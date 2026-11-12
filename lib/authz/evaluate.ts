import { prisma } from "../prisma.ts";
import type { ActorContext, AuthorizationDecision, ShopActorContext } from "./decision.ts";
import {
  CAREU_SHOP_PERMISSION_MAP,
  OWNER_BUNDLE,
  PLATFORM_ROLE_BUNDLES,
  SHOP_ROLE_BUNDLES,
  SUPER_ADMIN_EXCLUSIVE,
  type PlatformRoleKey,
  type ShopRoleKey,
} from "./roles.ts";
import type { PlatformPermission, ShopPermission } from "./permissions.ts";

function hasPlatformRolePermission(
  actor: ActorContext,
  permission: PlatformPermission,
): boolean {
  if (actor.platformRoles.includes("SUPER_ADMIN")) return true;
  if (SUPER_ADMIN_EXCLUSIVE.has(permission)) {
    return actor.platformRoles.includes("SUPER_ADMIN");
  }
  for (const role of actor.platformRoles) {
    const bundle = PLATFORM_ROLE_BUNDLES[role as PlatformRoleKey];
    if (bundle?.has(permission)) return true;
  }
  return false;
}

export function evaluatePlatformPermission(
  actor: ActorContext | null,
  permission: PlatformPermission,
): AuthorizationDecision {
  if (!actor) return { status: "REDIRECT_LOGIN" };

  if (actor.platformRoles.length > 0 && !actor.verifiedContact) {
    return { status: "CONTACT_UNVERIFIED", actor };
  }

  if (!hasPlatformRolePermission(actor, permission)) {
    return { status: "FORBIDDEN" };
  }

  return { status: "ALLOW", actor };
}

type ShopStatus = "PENDING" | "ACTIVE" | "PAUSED" | "SUSPENDED";

const SHOP_STATUS_GATE: Record<ShopPermission, Record<ShopStatus, boolean>> = {
  "shop.profile.read": { PENDING: true, ACTIVE: true, PAUSED: true, SUSPENDED: true },
  "shop.profile.write": { PENDING: true, ACTIVE: true, PAUSED: true, SUSPENDED: false },
  "shop.staff.manage": { PENDING: true, ACTIVE: true, PAUSED: true, SUSPENDED: true }, // owner-only in practice; gate allows by status but ownership/role still required
  "shop.status.manage": { PENDING: true, ACTIVE: true, PAUSED: true, SUSPENDED: false }, // lifting SUSPENDED requires platform.shop.moderate, not shop.status.manage (spec 0002 AC-10)
  "shop.listing.read": { PENDING: true, ACTIVE: true, PAUSED: true, SUSPENDED: true },
  "shop.listing.write": { PENDING: true, ACTIVE: true, PAUSED: true, SUSPENDED: false },
  "shop.listing.publish": { PENDING: true, ACTIVE: true, PAUSED: false, SUSPENDED: false },
  "shop.listing.remove": { PENDING: true, ACTIVE: true, PAUSED: true, SUSPENDED: false },
  "shop.inventory.read": { PENDING: true, ACTIVE: true, PAUSED: true, SUSPENDED: true },
  "shop.inventory.adjust": { PENDING: true, ACTIVE: true, PAUSED: true, SUSPENDED: true },
  "shop.inventory.restock": { PENDING: true, ACTIVE: true, PAUSED: false, SUSPENDED: false },
  "shop.order.read": { PENDING: true, ACTIVE: true, PAUSED: true, SUSPENDED: true },
  "shop.fulfillment.manage": { PENDING: true, ACTIVE: true, PAUSED: true, SUSPENDED: true },
  "shop.return.manage": { PENDING: true, ACTIVE: true, PAUSED: true, SUSPENDED: true },
  "shop.support.manage": { PENDING: true, ACTIVE: true, PAUSED: true, SUSPENDED: true },
  "shop.money.read": { PENDING: true, ACTIVE: true, PAUSED: true, SUSPENDED: true },
};

function shopStatusAllows(permission: ShopPermission, status: ShopStatus): boolean {
  return SHOP_STATUS_GATE[permission]?.[status] ?? false;
}

function shopPermissionsForMembership(
  role: ShopRoleKey | "OWNER",
): ReadonlySet<ShopPermission> {
  if (role === "OWNER") return OWNER_BUNDLE;
  return SHOP_ROLE_BUNDLES[role];
}

function careuMappedShopPermissions(
  roles: PlatformRoleKey[],
): Set<ShopPermission> {
  const out = new Set<ShopPermission>();
  for (const role of roles) {
    const mapped = CAREU_SHOP_PERMISSION_MAP[role];
    if (!mapped) continue;
    for (const p of mapped) out.add(p);
  }
  return out;
}

export async function resolveShopAccess(args: {
  actor: ActorContext | null;
  shopId: string;
  permission: ShopPermission;
}): Promise<{ decision: AuthorizationDecision; shop?: { id: string; status: ShopStatus; isFirstParty: boolean; ownerUserId: string } }> {
  const { actor, shopId, permission } = args;
  if (!actor) return { decision: { status: "REDIRECT_LOGIN" } };

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { id: true, status: true, isFirstParty: true, ownerUserId: true },
  });
  if (!shop) return { decision: { status: "NOT_FOUND" } };

  const isOwner = shop.ownerUserId === actor.userId;
  let shopRole: ShopRoleKey | "OWNER" | null = null;
  let hasPermission = false;
  let inScope = false;

  if (isOwner) {
    shopRole = "OWNER";
    hasPermission = OWNER_BUNDLE.has(permission);
    inScope = true;
  } else {
    const membership = await prisma.shopMembership.findFirst({
      where: { shopId: shop.id, userId: actor.userId, status: "ACTIVE" },
      select: { role: true },
    });
    if (membership) {
      shopRole = membership.role as ShopRoleKey;
      hasPermission = shopPermissionsForMembership(shopRole).has(permission);
      inScope = true;
    }
  }

  // Platform roles mapped to CareU shop only (spec 0002)
  if (!hasPermission && shop.isFirstParty && actor.platformRoles.length > 0) {
    // Acting in context of CareU shop via platform role mapping: in scope for decision.
    inScope = true;
    if (!actor.verifiedContact) {
      return { decision: { status: "CONTACT_UNVERIFIED", actor }, shop };
    }
    const mapped = careuMappedShopPermissions(actor.platformRoles as PlatformRoleKey[]);
    hasPermission = mapped.has(permission);
  }

  const actorCtx: ShopActorContext = {
    ...actor,
    shopId: shop.id,
    shopRole,
    isOwner,
    isCareuShop: shop.isFirstParty,
  };

  if (!hasPermission) {
    // Cross-shop / no relationship -> 404 to avoid confirming existence.
    // Authenticated but in-scope actor lacking permission -> 403 (spec 0002 AC-4).
    return { decision: { status: inScope ? "FORBIDDEN" : "NOT_FOUND" }, shop };
  }

  // Platform permissions are never gated by seller shop status; this is a shop-scoped check.
  // Mapped platform reach on CareU shop is still subject to CareU shop status gate.
  if (!shopStatusAllows(permission, shop.status as ShopStatus)) {
    return { decision: { status: "SHOP_UNAVAILABLE", actor: actorCtx, reason: shop.status }, shop };
  }

  if (actor.platformRoles.length > 0 && !actor.verifiedContact) {
    return { decision: { status: "CONTACT_UNVERIFIED", actor }, shop };
  }

  return { decision: { status: "ALLOW", actor: actorCtx }, shop };
}

export async function evaluateOwnership(
  actor: ActorContext | null,
  ownerUserId: string,
): Promise<AuthorizationDecision> {
  if (!actor) return { status: "REDIRECT_LOGIN" };
  if (actor.userId !== ownerUserId) return { status: "NOT_FOUND" };
  return { status: "ALLOW", actor };
}

export async function effectiveShopPermissions(
  userId: string,
  shopId: string,
): Promise<Set<ShopPermission>> {
  const [shop, membership, assignments, user] = await Promise.all([
    prisma.shop.findUnique({ where: { id: shopId }, select: { id: true, ownerUserId: true, isFirstParty: true } }),
    prisma.shopMembership.findFirst({ where: { shopId, userId, status: "ACTIVE" }, select: { role: true } }),
    prisma.platformRoleAssignment.findMany({ where: { userId, revokedAt: null }, select: { role: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true, phoneNumberVerified: true } }),
  ]);
  if (!shop) return new Set();
  const out = new Set<ShopPermission>();
  if (shop.ownerUserId === userId) {
    for (const p of OWNER_BUNDLE) out.add(p);
    return out;
  }
  if (membership) {
    for (const p of SHOP_ROLE_BUNDLES[membership.role as ShopRoleKey] ?? []) out.add(p);
  }
  const verified = Boolean(user?.emailVerified || user?.phoneNumberVerified);
  if (shop.isFirstParty && verified) {
    for (const a of assignments) {
      const mapped = CAREU_SHOP_PERMISSION_MAP[a.role as PlatformRoleKey];
      if (mapped) for (const p of mapped) out.add(p);
    }
  }
  return out;
}

export function logDenial(params: {
  actorUserId?: string;
  permission: string;
  scope?: string;
  requestId?: string;
}) {
  // Structured denial logging; never log denied record contents or customer personal data.
  console.warn("[authz.denied]", {
    actorUserId: params.actorUserId,
    permission: params.permission,
    scope: params.scope,
    requestId: params.requestId,
  });
}

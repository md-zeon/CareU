import { getActor } from "./actor.ts";
import {
  evaluateOwnership,
  evaluatePlatformPermission,
  logDenial,
  resolveShopAccess,
} from "./evaluate.ts";
import { safeReturnPath, type AuthorizationDecision } from "./decision.ts";
import type { PlatformPermission, ShopPermission } from "./permissions.ts";

function requestId(): string | undefined {
  // best effort; Next request id may not be available here
  return undefined;
}

export async function requirePlatformPermission(
  permission: PlatformPermission,
): Promise<AuthorizationDecision> {
  const actor = await getActor();
  const decision = evaluatePlatformPermission(actor, permission);
  if (decision.status !== "ALLOW") {
    logDenial({
      actorUserId: actor?.userId,
      permission,
      scope: "platform",
      requestId: requestId(),
    });
  }
  return decision;
}

export async function requireShopPermission(
  shopId: string,
  permission: ShopPermission,
): Promise<AuthorizationDecision> {
  // shopId must come from a loaded, trusted resource (spec 0002). Caller responsibility.
  const actor = await getActor();
  const { decision } = await resolveShopAccess({ actor, shopId, permission });
  if (decision.status !== "ALLOW") {
    logDenial({
      actorUserId: actor?.userId,
      permission,
      scope: `shop:${shopId}`,
      requestId: requestId(),
    });
  }
  return decision;
}

export async function requireOwnership(
  ownerUserId: string,
): Promise<AuthorizationDecision> {
  const actor = await getActor();
  const decision = await evaluateOwnership(actor, ownerUserId);
  if (decision.status !== "ALLOW") {
    logDenial({
      actorUserId: actor?.userId,
      permission: "ownership",
      scope: `user:${ownerUserId}`,
      requestId: requestId(),
    });
  }
  return decision;
}

export async function can(args: {
  permission: PlatformPermission | ShopPermission;
  shopId?: string;
}): Promise<AuthorizationDecision> {
  const { permission, shopId } = args;
  if (permission.startsWith("platform.")) {
    return requirePlatformPermission(permission as PlatformPermission);
  }
  if (!shopId) {
    return { status: "FORBIDDEN", reason: "MISSING_SHOP_SCOPE" };
  }
  return requireShopPermission(shopId, permission as ShopPermission);
}

// Route handler adapter: returns a Response for denial/redirect decisions, or null to continue.
export function routeDecisionResponse(
  decision: AuthorizationDecision,
  opts?: { locale?: string },
): Response | null {
  const locale = opts?.locale ?? "en";
  switch (decision.status) {
    case "ALLOW":
      return null;
    case "REDIRECT_LOGIN":
      return Response.redirect(
        new URL(
          `/${locale}/login?return=${encodeURIComponent(safeReturnPath(decision.returnPath))}`,
          process.env.BETTER_AUTH_URL || "http://localhost:3000",
        ),
        302,
      );
    case "FORBIDDEN":
    case "CONTACT_UNVERIFIED":
    case "SHOP_UNAVAILABLE":
      return Response.json({ error: decision.status }, { status: 403 });
    case "NOT_FOUND":
      return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  }
}

// Server action adapter: typed result for UI
export type ActionAuthResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: AuthorizationDecision["status"]; reason?: string };

export function actionDecisionResult<T = void>(
  decision: AuthorizationDecision,
  data?: T,
): ActionAuthResult<T> {
  if (decision.status === "ALLOW") {
    return { ok: true, data: data as T };
  }
  const reason =
    "reason" in decision ? (decision as { reason?: string }).reason : undefined;
  return { ok: false, error: decision.status, reason };
}

export function requireAllowedForAction<T = void>(
  decision: AuthorizationDecision,
): ActionAuthResult<T> | null {
  if (decision.status === "ALLOW") return null;
  return actionDecisionResult<T>(decision);
}

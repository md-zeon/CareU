import "server-only";
import { prisma } from "../../prisma.ts";
import { getActor } from "../../authz/actor.ts";
import { evaluatePlatformPermission, resolveShopAccess } from "../../authz/evaluate.ts";
import { PLATFORM_PERMISSIONS, SHOP_PERMISSIONS } from "../../authz/permissions.ts";
import type { ActorContext, AuthorizationDecision } from "../../authz/decision.ts";
import type { MediaPurpose, ParentRef } from "../types.ts";
import { purposeMatchesParent } from "../validation.ts";

export type MediaAuthResult =
  | { ok: true; actor: ActorContext | null; shopId?: string }
  | { ok: false; status: "REDIRECT_LOGIN" | "FORBIDDEN" | "NOT_FOUND" | "CONTACT_UNVERIFIED" | "SHOP_UNAVAILABLE" };

function fail(decision: AuthorizationDecision): MediaAuthResult {
  if (decision.status === "ALLOW") return { ok: true, actor: decision.actor };
  if (decision.status === "REDIRECT_LOGIN") return { ok: false, status: "REDIRECT_LOGIN" };
  if (decision.status === "NOT_FOUND") return { ok: false, status: "NOT_FOUND" };
  if (decision.status === "CONTACT_UNVERIFIED") return { ok: false, status: "CONTACT_UNVERIFIED" };
  if (decision.status === "SHOP_UNAVAILABLE") return { ok: false, status: "SHOP_UNAVAILABLE" };
  return { ok: false, status: "FORBIDDEN" };
}

export async function authorizeUpload(params: {
  purpose: MediaPurpose;
  parent: ParentRef;
}): Promise<MediaAuthResult & { parentMeta?: Record<string, unknown> }> {
  const actor = await getActor();
  if (!actor) return { ok: false, status: "REDIRECT_LOGIN" };
  if (!purposeMatchesParent(params.purpose, params.parent)) {
    return { ok: false, status: "FORBIDDEN" };
  }

  switch (params.purpose) {
    case "LISTING_IMAGE": {
      if (params.parent.kind !== "listing" && params.parent.kind !== "listingVariant") {
        return { ok: false, status: "FORBIDDEN" };
      }
      const listingId = params.parent.listingId;
      const variantId = params.parent.kind === "listingVariant" ? params.parent.listingVariantId : null;
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: {
          id: true,
          shopId: true,
          shop: { select: { id: true, isFirstParty: true } },
          ...(variantId
            ? { variants: { where: { id: variantId }, select: { id: true } } }
            : {}),
        },
      });
      if (!listing) return { ok: false, status: "NOT_FOUND" };
      if (variantId) {
        const variants = (listing as { variants?: Array<{ id: string }> }).variants ?? [];
        if (!variants.some((v) => v.id === variantId)) {
          return { ok: false, status: "NOT_FOUND" };
        }
      }
      // Authorized shop users or platform users acting on CareU/catalog as permitted.
      const shopDecision = await resolveShopAccess({
        actor,
        shopId: listing.shopId,
        permission: SHOP_PERMISSIONS.LISTING_WRITE,
      });
      if (shopDecision.decision.status === "ALLOW") {
        return { ok: true, actor, shopId: listing.shopId, parentMeta: { listingId: listing.id, shopId: listing.shopId } };
      }
      // Platform catalogue moderation/manage for non-careu? try platform permissions if in scope (CareU handled by mapping)
      if (listing.shop.isFirstParty) {
        return fail(shopDecision.decision);
      }
      // Third-party shop: only shop-scoped actors allowed per spec.
      if (shopDecision.decision.status === "NOT_FOUND") return { ok: false, status: "NOT_FOUND" };
      return fail(shopDecision.decision);
    }
    case "CATEGORY_IMAGE": {
      if (params.parent.kind !== "category") return { ok: false, status: "FORBIDDEN" };
      const category = await prisma.category.findUnique({
        where: { id: params.parent.categoryId },
        select: { id: true },
      });
      if (!category) return { ok: false, status: "NOT_FOUND" };
      const decision = evaluatePlatformPermission(actor, PLATFORM_PERMISSIONS.CATEGORY_MANAGE);
      if (decision.status === "ALLOW") return { ok: true, actor, parentMeta: { categoryId: category.id } };
      const alt = evaluatePlatformPermission(actor, PLATFORM_PERMISSIONS.CATALOGUE_MANAGE);
      if (alt.status === "ALLOW") return { ok: true, actor, parentMeta: { categoryId: category.id } };
      return fail(decision.status !== "FORBIDDEN" ? decision : alt);
    }
    case "SELLER_VERIFICATION_DOCUMENT": {
      if (params.parent.kind !== "sellerApplication") return { ok: false, status: "FORBIDDEN" };
      const app = await prisma.sellerApplication.findUnique({
        where: { id: params.parent.sellerApplicationId },
        select: {
          id: true,
          applicantUserId: true,
        },
      });
      if (!app) return { ok: false, status: "NOT_FOUND" };
      if (app.applicantUserId === actor.userId) {
        return { ok: true, actor, parentMeta: { sellerApplicationId: app.id } };
      }
      // authorized shop staff for that seller/application context: if applicant owns a shop, allow owner/staff with staff/profile perms? spec states "seller owner, or authorized shop staff for that seller/application context"
      const ownedShop = await prisma.shop.findFirst({
        where: { ownerUserId: app.applicantUserId },
        select: { id: true },
      });
      if (ownedShop) {
        // owner of that shop is applicant (covered). Check if actor is active member of that shop.
        const membership = await prisma.shopMembership.findFirst({
          where: { shopId: ownedShop.id, userId: actor.userId, status: "ACTIVE" },
          select: { id: true },
        });
        if (membership) {
          return { ok: true, actor, shopId: ownedShop.id, parentMeta: { sellerApplicationId: app.id, shopId: ownedShop.id } };
        }
      }
      // Platform staff do not upload seller verification docs on behalf of sellers in this foundation.
      return { ok: false, status: "NOT_FOUND" };
    }
    case "PROOF_OF_DELIVERY": {
      if (params.parent.kind !== "shipment") return { ok: false, status: "FORBIDDEN" };
      const shipment = await prisma.shipment.findUnique({
        where: { id: params.parent.shipmentId },
        select: {
          id: true,
          shopId: true,
          fulfillmentStatus: true,
          shop: { select: { id: true, isFirstParty: true } },
        },
      });
      if (!shipment) return { ok: false, status: "NOT_FOUND" };
      // Authorized for shipment and fulfillment workflow permits proof capture for shipment's current state.
      // Exact fulfillment state rules enforced by owning fulfillment slice; allow for now if actor can manage fulfillment for shop.
      const shopDecision = await resolveShopAccess({
        actor,
        shopId: shipment.shopId,
        permission: SHOP_PERMISSIONS.FULFILLMENT_MANAGE,
      });
      if (shopDecision.decision.status === "ALLOW") {
        return { ok: true, actor, shopId: shipment.shopId, parentMeta: { shipmentId: shipment.id, shopId: shipment.shopId } };
      }
      // Platform delivery/order manage for CareU mapped via shop access; for non-careu platform delivery manage may apply?
      if (shopDecision.decision.status === "NOT_FOUND" || shopDecision.decision.status === "FORBIDDEN") {
        // try platform delivery/order manage as platform actor in scope of order operations? better to be conservative.
      }
      return fail(shopDecision.decision);
    }
    default:
      return { ok: false, status: "FORBIDDEN" };
  }
}

export async function authorizePrivateRead(params: {
  assetId: string;
  accessPurpose: string;
  actor: ActorContext | null;
}): Promise<
  | {
      ok: true;
      asset: {
        id: string;
        storageKey: string;
        visibility: "PUBLIC" | "PRIVATE";
        purpose: MediaPurpose;
        fileNameOriginal: string;
        mimeType: string;
        sellerApplicationId: string | null;
        shipmentId: string | null;
        listingId: string | null;
        listingVariantId: string | null;
        categoryId: string | null;
        status: string;
      };
      log: {
        actorType: "USER" | "ANONYMOUS" | "SYSTEM";
        accessedByUserId: string | null;
        actorRoleOrContext: string | null;
        parentType: string | null;
        parentId: string | null;
      };
    }
  | { ok: false; status: 401 | 403 | 404; reason?: string; log: { actorType: "USER" | "ANONYMOUS"; accessedByUserId: string | null; parentType: string | null; parentId: string | null } }
> {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: params.assetId },
    select: {
      id: true,
      storageKey: true,
      visibility: true,
      purpose: true,
      fileNameOriginal: true,
      mimeType: true,
      sellerApplicationId: true,
      shipmentId: true,
      listingId: true,
      listingVariantId: true,
      categoryId: true,
      status: true,
    },
  });
  const parentType =
    asset?.shipmentId ? "shipment" :
    asset?.sellerApplicationId ? "sellerApplication" :
    asset?.listingVariantId ? "listingVariant" :
    asset?.listingId ? "listing" :
    asset?.categoryId ? "category" : null;
  const parentId =
    asset?.shipmentId ??
    asset?.sellerApplicationId ??
    asset?.listingVariantId ??
    asset?.listingId ??
    asset?.categoryId ??
    null;
  const baseLog = {
    actorType: (params.actor ? "USER" : "ANONYMOUS") as "USER" | "ANONYMOUS",
    accessedByUserId: params.actor?.userId ?? null,
    parentType,
    parentId,
  };

  if (!asset) return { ok: false, status: 404, log: baseLog };
  if (asset.visibility !== "PRIVATE" || asset.status !== "ACTIVE") {
    return { ok: false, status: 404, log: baseLog };
  }

  if (!params.actor) {
    return { ok: false, status: 401, reason: "UNAUTHENTICATED", log: baseLog };
  }

  // SELLER_VERIFICATION_DOCUMENT
  if (asset.purpose === "SELLER_VERIFICATION_DOCUMENT" && asset.sellerApplicationId) {
    const app = await prisma.sellerApplication.findUnique({
      where: { id: asset.sellerApplicationId },
      select: { id: true, applicantUserId: true },
    });
    if (!app) return { ok: false, status: 404, log: baseLog };
    if (app.applicantUserId === params.actor.userId) {
      return { ok: true, asset, log: { ...baseLog, actorRoleOrContext: "owner" } };
    }
    const ownedShop = await prisma.shop.findFirst({ where: { ownerUserId: app.applicantUserId }, select: { id: true } });
    if (ownedShop) {
      const membership = await prisma.shopMembership.findFirst({
        where: { shopId: ownedShop.id, userId: params.actor.userId, status: "ACTIVE" },
        select: { id: true },
      });
      if (membership) return { ok: true, asset, log: { ...baseLog, actorRoleOrContext: "shop_staff" } };
    }
    // Platform staff with seller review/trust permissions may access for review
    const p = evaluatePlatformPermission(params.actor, PLATFORM_PERMISSIONS.SELLER_DOCUMENT_READ);
    if (p.status === "ALLOW") return { ok: true, asset, log: { ...baseLog, actorRoleOrContext: "platform_review" } };
    const p2 = evaluatePlatformPermission(params.actor, PLATFORM_PERMISSIONS.SELLER_REVIEW);
    if (p2.status === "ALLOW") return { ok: true, asset, log: { ...baseLog, actorRoleOrContext: "platform_review" } };
    const p3 = evaluatePlatformPermission(params.actor, PLATFORM_PERMISSIONS.SELLER_TRUST_MANAGE);
    if (p3.status === "ALLOW") return { ok: true, asset, log: { ...baseLog, actorRoleOrContext: "platform_review" } };
    return { ok: false, status: 403, reason: "FORBIDDEN", log: baseLog };
  }

  // PROOF_OF_DELIVERY
  if (asset.purpose === "PROOF_OF_DELIVERY" && asset.shipmentId) {
    const shipment = await prisma.shipment.findUnique({
      where: { id: asset.shipmentId },
      select: {
        id: true,
        shopId: true,
        order: { select: { customerUserId: true } },
      },
    });
    if (!shipment) return { ok: false, status: 404, log: baseLog };
    // customer who owns the order
    if (shipment.order.customerUserId === params.actor.userId) {
      return { ok: true, asset, log: { ...baseLog, actorRoleOrContext: "customer" } };
    }
    // fulfilling shop users with appropriate permission
    const shopAccess = await resolveShopAccess({
      actor: params.actor,
      shopId: shipment.shopId,
      permission: SHOP_PERMISSIONS.ORDER_READ,
    });
    if (shopAccess.decision.status === "ALLOW") {
      return { ok: true, asset, log: { ...baseLog, actorRoleOrContext: "shop" } };
    }
    // authorized platform staff (delivery/support/dispute/review) as permitted
    for (const perm of [
      PLATFORM_PERMISSIONS.DELIVERY_MANAGE,
      PLATFORM_PERMISSIONS.SUPPORT_MANAGE,
      PLATFORM_PERMISSIONS.DISPUTE_RESOLVE,
      PLATFORM_PERMISSIONS.ORDER_READ,
    ] as const) {
      const d = evaluatePlatformPermission(params.actor, perm);
      if (d.status === "ALLOW") return { ok: true, asset, log: { ...baseLog, actorRoleOrContext: "platform" } };
    }
    if (shopAccess.decision.status === "NOT_FOUND") return { ok: false, status: 403, reason: "FORBIDDEN", log: baseLog };
    return { ok: false, status: 403, reason: "FORBIDDEN", log: baseLog };
  }

  return { ok: false, status: 403, reason: "FORBIDDEN", log: baseLog };
}

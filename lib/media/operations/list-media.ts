import "server-only";
import { prisma } from "../../prisma.ts";
import { getActor } from "../../authz/actor.ts";
import { resolveShopAccess } from "../../authz/evaluate.ts";
import { evaluatePlatformPermission } from "../../authz/evaluate.ts";
import { PLATFORM_PERMISSIONS, SHOP_PERMISSIONS } from "../../authz/permissions.ts";
import { publicUrlForKey } from "../r2.ts";
import type { MediaPurpose, SafeMediaSummary } from "../types.ts";

export type ListMediaForParentInput = {
  purpose: MediaPurpose;
  listingId?: string;
  listingVariantId?: string;
  categoryId?: string;
  sellerApplicationId?: string;
  shipmentId?: string;
};

export type ListMediaResult =
  | { ok: true; data: SafeMediaSummary[] }
  | { ok: false; error: string; statusCode: number };

export async function listMediaForParent(input: ListMediaForParentInput): Promise<ListMediaResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "UNAUTHENTICATED", statusCode: 401 };

  const where: Record<string, unknown> = { purpose: input.purpose };
  // visibility/status filtering: public active/replaced/deleted? "filtered by parent/purpose/status/visibility..." - return allowed records (typically ACTIVE for current views)
  if (input.purpose === "LISTING_IMAGE" || input.purpose === "CATEGORY_IMAGE") {
    where.status = "ACTIVE";
  } else {
    // verification/POD keep history - include ACTIVE (and REPLACED not expected) but exclude PENDING? show active records
    where.status = { in: ["ACTIVE"] };
  }

  if (input.purpose === "LISTING_IMAGE") {
    if (input.listingVariantId) {
      where.listingVariantId = input.listingVariantId;
      const lv = await prisma.listingVariant.findUnique({
        where: { id: input.listingVariantId },
        select: { listing: { select: { id: true, shopId: true } } },
      });
      if (!lv) return { ok: false, error: "NOT_FOUND", statusCode: 404 };
      const decision = await resolveShopAccess({ actor, shopId: lv.listing.shopId, permission: SHOP_PERMISSIONS.LISTING_READ });
      if (decision.decision.status === "NOT_FOUND") return { ok: false, error: "NOT_FOUND", statusCode: 404 };
      if (decision.decision.status !== "ALLOW") return { ok: false, error: decision.decision.status, statusCode: 403 };
    } else if (input.listingId) {
      where.listingId = input.listingId;
      where.listingVariantId = null;
      const listing = await prisma.listing.findUnique({ where: { id: input.listingId }, select: { id: true, shopId: true } });
      if (!listing) return { ok: false, error: "NOT_FOUND", statusCode: 404 };
      const decision = await resolveShopAccess({ actor, shopId: listing.shopId, permission: SHOP_PERMISSIONS.LISTING_READ });
      if (decision.decision.status === "NOT_FOUND") return { ok: false, error: "NOT_FOUND", statusCode: 404 };
      if (decision.decision.status !== "ALLOW") return { ok: false, error: decision.decision.status, statusCode: 403 };
    } else {
      return { ok: false, error: "MISSING_PARENT", statusCode: 400 };
    }
  } else if (input.purpose === "CATEGORY_IMAGE") {
    if (!input.categoryId) return { ok: false, error: "MISSING_PARENT", statusCode: 400 };
    where.categoryId = input.categoryId;
    const cat = await prisma.category.findUnique({ where: { id: input.categoryId }, select: { id: true } });
    if (!cat) return { ok: false, error: "NOT_FOUND", statusCode: 404 };
    // Public category media listing: allow if can manage or if public storefront context? but this is a server read op requiring auth per spec table.
    const d1 = evaluatePlatformPermission(actor, PLATFORM_PERMISSIONS.CATEGORY_MANAGE);
    const d2 = evaluatePlatformPermission(actor, PLATFORM_PERMISSIONS.CATALOGUE_MANAGE);
    if (d1.status !== "ALLOW" && d2.status !== "ALLOW") {
      return { ok: false, error: d1.status === "REDIRECT_LOGIN" ? "UNAUTHENTICATED" : "FORBIDDEN", statusCode: d1.status === "REDIRECT_LOGIN" ? 401 : 403 };
    }
  } else if (input.purpose === "SELLER_VERIFICATION_DOCUMENT") {
    if (!input.sellerApplicationId) return { ok: false, error: "MISSING_PARENT", statusCode: 400 };
    where.sellerApplicationId = input.sellerApplicationId;
    const app = await prisma.sellerApplication.findUnique({ where: { id: input.sellerApplicationId }, select: { id: true, applicantUserId: true } });
    if (!app) return { ok: false, error: "NOT_FOUND", statusCode: 404 };
    let allowed = app.applicantUserId === actor.userId;
    if (!allowed) {
      const ownedShop = await prisma.shop.findFirst({ where: { ownerUserId: app.applicantUserId }, select: { id: true } });
      if (ownedShop) {
        const mem = await prisma.shopMembership.findFirst({ where: { shopId: ownedShop.id, userId: actor.userId, status: "ACTIVE" }, select: { id: true } });
        if (mem) allowed = true;
      }
    }
    if (!allowed) {
      for (const p of [PLATFORM_PERMISSIONS.SELLER_DOCUMENT_READ, PLATFORM_PERMISSIONS.SELLER_REVIEW, PLATFORM_PERMISSIONS.SELLER_TRUST_MANAGE] as const) {
        if (evaluatePlatformPermission(actor, p).status === "ALLOW") { allowed = true; break; }
      }
    }
    if (!allowed) return { ok: false, error: "NOT_FOUND", statusCode: 404 };
  } else if (input.purpose === "PROOF_OF_DELIVERY") {
    if (!input.shipmentId) return { ok: false, error: "MISSING_PARENT", statusCode: 400 };
    where.shipmentId = input.shipmentId;
    const shipment = await prisma.shipment.findUnique({
      where: { id: input.shipmentId },
      select: { id: true, shopId: true, order: { select: { customerUserId: true } } },
    });
    if (!shipment) return { ok: false, error: "NOT_FOUND", statusCode: 404 };
    let allowed = shipment.order.customerUserId === actor.userId;
    if (!allowed) {
      const shopAccess = await resolveShopAccess({ actor, shopId: shipment.shopId, permission: SHOP_PERMISSIONS.ORDER_READ });
      if (shopAccess.decision.status === "ALLOW") allowed = true;
    }
    if (!allowed) {
      for (const p of [PLATFORM_PERMISSIONS.DELIVERY_MANAGE, PLATFORM_PERMISSIONS.SUPPORT_MANAGE, PLATFORM_PERMISSIONS.DISPUTE_RESOLVE, PLATFORM_PERMISSIONS.ORDER_READ] as const) {
        if (evaluatePlatformPermission(actor, p).status === "ALLOW") { allowed = true; break; }
      }
    }
    if (!allowed) return { ok: false, error: "NOT_FOUND", statusCode: 404 };
  }

  const rows = await prisma.mediaAsset.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      purpose: true,
      status: true,
      fileNameOriginal: true,
      mimeType: true,
      byteSize: true,
      width: true,
      height: true,
      altText: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
      visibility: true,
      storageKey: true,
    },
  });

  const data: SafeMediaSummary[] = rows.map((r) => ({
    id: r.id,
    purpose: r.purpose as SafeMediaSummary["purpose"],
    status: r.status as SafeMediaSummary["status"],
    fileNameOriginal: r.fileNameOriginal,
    mimeType: r.mimeType,
    byteSize: r.byteSize,
    width: r.width,
    height: r.height,
    altText: r.altText,
    sortOrder: r.sortOrder,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    publicUrl: r.visibility === "PUBLIC" ? publicUrlForKey(r.storageKey) : null,
  }));

  return { ok: true, data };
}

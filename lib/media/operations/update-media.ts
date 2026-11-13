import "server-only";
import { prisma } from "../../prisma.ts";
import { getActor } from "../../authz/actor.ts";
import { resolveShopAccess } from "../../authz/evaluate.ts";
import { evaluatePlatformPermission } from "../../authz/evaluate.ts";
import { PLATFORM_PERMISSIONS, SHOP_PERMISSIONS } from "../../authz/permissions.ts";

export type UpdateMediaMetadataInput =
  | { assetId: string; altText?: string | null }
  | { parent: { purpose: "LISTING_IMAGE" | "CATEGORY_IMAGE"; listingId?: string; listingVariantId?: string; categoryId?: string }; orderedAssetIds: string[] };

export type UpdateMediaResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string; statusCode: number };

type EditAuth =
  | { ok: true }
  | { ok: false; statusCode: number; error: string };

async function canEditPublicParent(
  actor: NonNullable<Awaited<ReturnType<typeof getActor>>>,
  asset: { purpose: string; listingId: string | null; listingVariantId: string | null; categoryId: string | null },
): Promise<EditAuth> {
  if (asset.purpose === "LISTING_IMAGE" && asset.listingId) {
    const listing = await prisma.listing.findUnique({ where: { id: asset.listingId }, select: { shopId: true } });
    if (!listing) return { ok: false, statusCode: 404, error: "NOT_FOUND" };
    const d = await resolveShopAccess({ actor, shopId: listing.shopId, permission: SHOP_PERMISSIONS.LISTING_WRITE });
    if (d.decision.status === "ALLOW") return { ok: true };
    return { ok: false, statusCode: d.decision.status === "NOT_FOUND" ? 404 : 403, error: String(d.decision.status) };
  }
  if (asset.purpose === "CATEGORY_IMAGE" && asset.categoryId) {
    const d1 = evaluatePlatformPermission(actor, PLATFORM_PERMISSIONS.CATEGORY_MANAGE);
    const d2 = evaluatePlatformPermission(actor, PLATFORM_PERMISSIONS.CATALOGUE_MANAGE);
    if (d1.status === "ALLOW" || d2.status === "ALLOW") return { ok: true };
    return { ok: false, statusCode: 403, error: "FORBIDDEN" };
  }
  return { ok: false, statusCode: 409, error: "NOT_EDITABLE" };
}

export async function updateMediaMetadata(input: UpdateMediaMetadataInput): Promise<UpdateMediaResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "UNAUTHENTICATED", statusCode: 401 };

  if ("orderedAssetIds" in input) {
    const { parent, orderedAssetIds } = input;
    if (!Array.isArray(orderedAssetIds) || orderedAssetIds.length === 0) {
      return { ok: false, error: "INVALID_INPUT", statusCode: 400 };
    }
    // All assets must belong to same parent and be editable public images
    const assets = await prisma.mediaAsset.findMany({
      where: { id: { in: orderedAssetIds } },
      select: { id: true, purpose: true, listingId: true, listingVariantId: true, categoryId: true, status: true, visibility: true },
    });
    if (assets.length !== orderedAssetIds.length) return { ok: false, error: "NOT_FOUND", statusCode: 404 };
    const sample = assets[0];
    if (sample.visibility !== "PUBLIC" || !["LISTING_IMAGE", "CATEGORY_IMAGE"].includes(sample.purpose)) {
      return { ok: false, error: "NOT_EDITABLE", statusCode: 409 };
    }
    // parent match
    if (parent.purpose !== sample.purpose) return { ok: false, error: "INVALID_INPUT", statusCode: 400 };
    for (const a of assets) {
      if (a.purpose !== sample.purpose) return { ok: false, error: "INVALID_INPUT", statusCode: 400 };
      if (parent.purpose === "LISTING_IMAGE") {
        if (parent.listingVariantId) {
          if (a.listingVariantId !== parent.listingVariantId) return { ok: false, error: "INVALID_INPUT", statusCode: 400 };
        } else if (parent.listingId) {
          if (a.listingId !== parent.listingId || a.listingVariantId) return { ok: false, error: "INVALID_INPUT", statusCode: 400 };
        }
      } else if (parent.purpose === "CATEGORY_IMAGE") {
        if (a.categoryId !== parent.categoryId) return { ok: false, error: "INVALID_INPUT", statusCode: 400 };
      }
    }
    const auth = await canEditPublicParent(actor, sample);
    if (!auth.ok) return { ok: false, error: auth.error, statusCode: auth.statusCode };

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < orderedAssetIds.length; i++) {
        const id = orderedAssetIds[i]!;
        await tx.mediaAsset.update({ where: { id }, data: { sortOrder: i } });
      }
    });
    return { ok: true, data: { orderedAssetIds } };
  }

  const asset = await prisma.mediaAsset.findUnique({
    where: { id: input.assetId },
    select: { id: true, purpose: true, listingId: true, listingVariantId: true, categoryId: true, visibility: true, status: true },
  });
  if (!asset) return { ok: false, error: "NOT_FOUND", statusCode: 404 };
  const auth = await canEditPublicParent(actor, asset);
  if (!auth.ok) return { ok: false, error: auth.error, statusCode: auth.statusCode };
  if (asset.status !== "ACTIVE") return { ok: false, error: "NOT_EDITABLE", statusCode: 409 };

  const updated = await prisma.mediaAsset.update({
    where: { id: asset.id },
    data: { altText: input.altText ?? null },
    select: { id: true, altText: true, sortOrder: true, updatedAt: true },
  });
  return { ok: true, data: updated };
}

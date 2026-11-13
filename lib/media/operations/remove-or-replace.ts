import "server-only";
import { prisma } from "../../prisma.ts";
import { getActor } from "../../authz/actor.ts";
import { resolveShopAccess } from "../../authz/evaluate.ts";
import { evaluatePlatformPermission } from "../../authz/evaluate.ts";
import { PLATFORM_PERMISSIONS, SHOP_PERMISSIONS } from "../../authz/permissions.ts";
import { deleteObject } from "../r2.ts";

export type RemoveOrReplaceInput = {
  assetId: string;
  replacementAssetId?: string | null;
  reason?: string | null;
};

export type RemoveOrReplaceResult =
  | { ok: true; data: { assetId: string; status: string } }
  | { ok: false; error: string; statusCode: number };

export async function removeOrReplaceMedia(input: RemoveOrReplaceInput): Promise<RemoveOrReplaceResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "UNAUTHENTICATED", statusCode: 401 };

  const asset = await prisma.mediaAsset.findUnique({ where: { id: input.assetId } });
  if (!asset) return { ok: false, error: "NOT_FOUND", statusCode: 404 };

  if (asset.purpose === "SELLER_VERIFICATION_DOCUMENT" || asset.purpose === "PROOF_OF_DELIVERY") {
    return { ok: false, error: "NOT_ALLOWED_BY_PURPOSE", statusCode: 403 };
  }
  if (!(asset.purpose === "LISTING_IMAGE" || asset.purpose === "CATEGORY_IMAGE")) {
    return { ok: false, error: "NOT_ALLOWED_BY_PURPOSE", statusCode: 403 };
  }

  // authorize
  if (asset.purpose === "LISTING_IMAGE" && asset.listingId) {
    const listing = await prisma.listing.findUnique({ where: { id: asset.listingId }, select: { shopId: true } });
    if (!listing) return { ok: false, error: "NOT_FOUND", statusCode: 404 };
    const d = await resolveShopAccess({ actor, shopId: listing.shopId, permission: SHOP_PERMISSIONS.LISTING_WRITE });
    if (d.decision.status !== "ALLOW") {
      return { ok: false, error: d.decision.status, statusCode: d.decision.status === "NOT_FOUND" ? 404 : 403 };
    }
  } else if (asset.purpose === "CATEGORY_IMAGE" && asset.categoryId) {
    const d1 = evaluatePlatformPermission(actor, PLATFORM_PERMISSIONS.CATEGORY_MANAGE);
    const d2 = evaluatePlatformPermission(actor, PLATFORM_PERMISSIONS.CATALOGUE_MANAGE);
    if (d1.status !== "ALLOW" && d2.status !== "ALLOW") {
      return { ok: false, error: "FORBIDDEN", statusCode: 403 };
    }
  } else {
    return { ok: false, error: "NOT_ALLOWED_BY_PURPOSE", statusCode: 403 };
  }

  let replacement: { id: string; status: string; purpose: string; listingId: string | null; listingVariantId: string | null; categoryId: string | null; sortOrder: number | null } | null = null;
  if (input.replacementAssetId) {
    replacement = await prisma.mediaAsset.findUnique({ where: { id: input.replacementAssetId } });
    if (!replacement) return { ok: false, error: "NOT_FOUND", statusCode: 404 };
    if (replacement.status !== "ACTIVE") return { ok: false, error: "INVALID_STATE", statusCode: 409 };
    // must be same parent/purpose context
    if (replacement.purpose !== asset.purpose) return { ok: false, error: "INVALID_STATE", statusCode: 409 };
    if (asset.listingId && replacement.listingId !== asset.listingId) return { ok: false, error: "INVALID_STATE", statusCode: 409 };
    if ((asset.listingVariantId ?? null) !== (replacement.listingVariantId ?? null)) return { ok: false, error: "INVALID_STATE", statusCode: 409 };
    if (asset.categoryId && replacement.categoryId !== asset.categoryId) return { ok: false, error: "INVALID_STATE", statusCode: 409 };
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (replacement) {
      // switch: set replacement sortOrder to old's if needed, mark old REPLACED
      await tx.mediaAsset.update({
        where: { id: replacement.id },
        data: { sortOrder: asset.sortOrder },
      });
      return tx.mediaAsset.update({
        where: { id: asset.id },
        data: { status: "REPLACED" },
      });
    } else {
      return tx.mediaAsset.update({
        where: { id: asset.id },
        data: { status: "DELETED" },
      });
    }
  });

  // Best-effort cleanup of R2 object for removed/replaced public media no longer referenced (eligible).
  // "Cleanup may run from eligible mutation flows..." - attempt delete; if fails, object may remain orphaned (operational follow-up).
  try {
    await deleteObject({ visibility: asset.visibility as "PUBLIC" | "PRIVATE", key: asset.storageKey });
  } catch {
    // ignore cleanup failure; DB state is authoritative for app behavior
  }

  return { ok: true, data: { assetId: updated.id, status: updated.status } };
}

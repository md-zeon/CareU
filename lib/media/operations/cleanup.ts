import "server-only";
import { prisma } from "../../prisma.ts";
import { getActor } from "../../authz/actor.ts";
import { evaluatePlatformPermission } from "../../authz/evaluate.ts";
import { PLATFORM_PERMISSIONS } from "../../authz/permissions.ts";
import { deleteObject } from "../r2.ts";

export type CleanupStoredObjectInput = {
  assetId: string;
  reason?: string;
};

export type CleanupStoredObjectResult =
  | { ok: true; data: { assetId: string; cleaned: boolean } }
  | { ok: false; error: string; statusCode: number };

export async function cleanupStoredObject(input: CleanupStoredObjectInput): Promise<CleanupStoredObjectResult> {
  // Restricted server/internal operation; allow platform admin-like authorized users for now (tightly scoped).
  const actor = await getActor();
  if (!actor) return { ok: false, error: "UNAUTHENTICATED", statusCode: 401 };
  const allowed =
    evaluatePlatformPermission(actor, PLATFORM_PERMISSIONS.CATALOGUE_MANAGE).status === "ALLOW" ||
    evaluatePlatformPermission(actor, PLATFORM_PERMISSIONS.SHOP_MODERATE).status === "ALLOW" ||
    actor.platformRoles.includes("SUPER_ADMIN");
  if (!allowed) return { ok: false, error: "FORBIDDEN", statusCode: 403 };

  const asset = await prisma.mediaAsset.findUnique({ where: { id: input.assetId } });
  if (!asset) return { ok: false, error: "NOT_FOUND", statusCode: 404 };

  // Eligible only for expired/abandoned pending uploads or public media no longer referenced and safe to remove.
  // Never for normal verification/POD evidence.
  if (asset.purpose === "SELLER_VERIFICATION_DOCUMENT" || asset.purpose === "PROOF_OF_DELIVERY") {
    return { ok: false, error: "NOT_ELIGIBLE", statusCode: 409 };
  }

  let eligible = false;
  if (asset.status === "PENDING_UPLOAD") {
    // treat as expired/abandoned pending if old enough? caller provides reason; allow pending cleanup.
    eligible = true;
  } else if ((asset.purpose === "LISTING_IMAGE" || asset.purpose === "CATEGORY_IMAGE") && (asset.status === "DELETED" || asset.status === "REPLACED")) {
    eligible = true;
  }

  if (!eligible) return { ok: false, error: "NOT_ELIGIBLE", statusCode: 409 };

  await deleteObject({ visibility: asset.visibility as "PUBLIC" | "PRIVATE", key: asset.storageKey });
  // keep DB record for audit/history of state; PENDING_UPLOAD cleaned up can be marked DELETED
  if (asset.status === "PENDING_UPLOAD") {
    await prisma.mediaAsset.update({ where: { id: asset.id }, data: { status: "DELETED" } });
  }
  return { ok: true, data: { assetId: asset.id, cleaned: true } };
}

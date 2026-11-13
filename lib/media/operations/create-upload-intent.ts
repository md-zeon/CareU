import "server-only";
import { prisma } from "../../prisma.ts";
import { generateStorageKey } from "../keys.ts";
import { presignUpload } from "../r2.ts";
import {
  normalizeParentForPurpose,
  purposeMatchesParent,
  sanitizeFileName,
  validateUploadInput,
  visibilityForPurpose,
} from "../validation.ts";
import type { MediaPurpose } from "../types.ts";
import { authorizeUpload } from "./auth.ts";

export type CreateUploadIntentInput = {
  purpose: MediaPurpose;
  fileName: string;
  mimeType: string;
  byteSize: number;
  checksumSha256?: string | null;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
  listingId?: string;
  listingVariantId?: string;
  categoryId?: string;
  sellerApplicationId?: string;
  shipmentId?: string;
};

export type CreateUploadIntentResult =
  | {
      ok: true;
      data: {
        assetId: string;
        storageKey: string;
        uploadUrl: string;
        uploadHeaders: Record<string, string>;
        uploadExpiresAt: string;
        status: "PENDING_UPLOAD";
      };
    }
  | { ok: false; error: string; statusCode: number };

export async function createUploadIntent(
  input: CreateUploadIntentInput,
): Promise<CreateUploadIntentResult> {
  const parent = normalizeParentForPurpose(input.purpose, input as unknown as Record<string, unknown>);
  if ("error" in parent) {
    return { ok: false, error: parent.error, statusCode: 400 };
  }
  if (!purposeMatchesParent(input.purpose, parent)) {
    return { ok: false, error: "INVALID_PARENT", statusCode: 400 };
  }

  const validation = validateUploadInput({
    purpose: input.purpose,
    mimeType: input.mimeType,
    byteSize: input.byteSize,
    fileName: input.fileName,
  });
  if (!validation.ok) {
    const statusCode = validation.error === "FILE_TOO_LARGE" ? 413 : 422;
    return { ok: false, error: validation.error, statusCode };
  }

  const authz = await authorizeUpload({ purpose: input.purpose, parent });
  if (!authz.ok) {
    const statusCode =
      authz.status === "REDIRECT_LOGIN" ? 401 :
      authz.status === "NOT_FOUND" ? 404 :
      authz.status === "CONTACT_UNVERIFIED" || authz.status === "SHOP_UNAVAILABLE" ? 403 : 403;
    return { ok: false, error: authz.status, statusCode };
  }
  if (!authz.actor) {
    return { ok: false, error: "UNAUTHENTICATED", statusCode: 401 };
  }

  const visibility = visibilityForPurpose(input.purpose);
  const storageKey = generateStorageKey(input.purpose, input.mimeType);
  const fileNameOriginal = sanitizeFileName(input.fileName);

  const data = {
    storageKey,
    visibility,
    purpose: input.purpose,
    fileNameOriginal,
    mimeType: input.mimeType,
    byteSize: input.byteSize,
    checksumSha256: input.checksumSha256 ?? null,
    width: typeof input.width === "number" ? input.width : null,
    height: typeof input.height === "number" ? input.height : null,
    altText: input.altText ?? null,
    sortOrder: null as number | null,
    status: "PENDING_UPLOAD" as const,
    uploadedByUserId: authz.actor.userId,
    listingId: undefined as string | undefined,
    listingVariantId: undefined as string | undefined,
    categoryId: undefined as string | undefined,
    sellerApplicationId: undefined as string | undefined,
    shipmentId: undefined as string | undefined,
  };

  if (parent.kind === "listing") data.listingId = parent.listingId;
  if (parent.kind === "listingVariant") {
    data.listingId = parent.listingId;
    data.listingVariantId = parent.listingVariantId;
  }
  if (parent.kind === "category") data.categoryId = parent.categoryId;
  if (parent.kind === "sellerApplication") data.sellerApplicationId = parent.sellerApplicationId;
  if (parent.kind === "shipment") data.shipmentId = parent.shipmentId;

  const asset = await prisma.mediaAsset.create({ data, select: { id: true, storageKey: true } });

  const presigned = await presignUpload({
    visibility,
    key: storageKey,
    contentType: input.mimeType,
    contentLength: input.byteSize,
  });

  return {
    ok: true,
    data: {
      assetId: asset.id,
      storageKey: asset.storageKey,
      uploadUrl: presigned.url,
      uploadHeaders: presigned.headers,
      uploadExpiresAt: presigned.expiresAt.toISOString(),
      status: "PENDING_UPLOAD",
    },
  };
}

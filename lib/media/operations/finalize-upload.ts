import "server-only";
import { prisma } from "../../prisma.ts";
import { getActor } from "../../authz/actor.ts";
import { headObject, publicUrlForKey } from "../r2.ts";
import { sanitizeFileName } from "../validation.ts";

export type FinalizeUploadInput = {
  assetId: string;
  checksumSha256?: string | null;
  width?: number | null;
  height?: number | null;
  fileNameOriginal?: string | null;
};

export type FinalizeUploadResult =
  | {
      ok: true;
      data: {
        id: string;
        status: "ACTIVE";
        purpose: string;
        visibility: string;
        fileNameOriginal: string;
        mimeType: string;
        byteSize: number;
        width: number | null;
        height: number | null;
        storageKey: string;
        publicUrl: string | null;
      };
    }
  | { ok: false; error: string; statusCode: number };

function normalizeContentType(ct: string | undefined): string | null {
  if (!ct) return null;
  return ct.split(";")[0]?.trim().toLowerCase() || null;
}

export async function finalizeUpload(input: FinalizeUploadInput): Promise<FinalizeUploadResult> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "UNAUTHENTICATED", statusCode: 401 };

  const asset = await prisma.mediaAsset.findUnique({
    where: { id: input.assetId },
  });
  if (!asset) return { ok: false, error: "NOT_FOUND", statusCode: 404 };

  // Pending asset uploader or authorized server/system flow for same context.
  // Foundation: allow uploader only (server/system flows can be added later).
  if (asset.uploadedByUserId !== actor.userId) {
    return { ok: false, error: "FORBIDDEN", statusCode: 403 };
  }

  if (asset.status === "ACTIVE") {
    // Idempotent success if matching/already active.
    return {
      ok: true,
      data: {
        id: asset.id,
        status: "ACTIVE",
        purpose: asset.purpose,
        visibility: asset.visibility,
        fileNameOriginal: asset.fileNameOriginal,
        mimeType: asset.mimeType,
        byteSize: asset.byteSize,
        width: asset.width,
        height: asset.height,
        storageKey: asset.storageKey,
        publicUrl: asset.visibility === "PUBLIC" ? publicUrlForKey(asset.storageKey) : null,
      },
    };
  }

  if (asset.status !== "PENDING_UPLOAD") {
    return { ok: false, error: "INVALID_STATE", statusCode: 409 };
  }

  const head = await headObject({ visibility: asset.visibility as "PUBLIC" | "PRIVATE", key: asset.storageKey });
  if (!head) {
    return { ok: false, error: "OBJECT_NOT_FOUND", statusCode: 404 };
  }

  // Verify actual stored object metadata against intent.
  if (typeof head.contentLength === "number" && head.contentLength !== asset.byteSize) {
    return { ok: false, error: "VERIFICATION_MISMATCH", statusCode: 422 };
  }
  const headType = normalizeContentType(head.contentType);
  const expectedType = normalizeContentType(asset.mimeType);
  if (headType && expectedType && headType !== expectedType) {
    return { ok: false, error: "VERIFICATION_MISMATCH", statusCode: 422 };
  }

  const updateData: {
    status: "ACTIVE";
    checksumSha256?: string;
    width?: number;
    height?: number;
    fileNameOriginal?: string;
  } = { status: "ACTIVE" };
  if (input.checksumSha256) updateData.checksumSha256 = input.checksumSha256;
  if (typeof input.width === "number") updateData.width = input.width;
  if (typeof input.height === "number") updateData.height = input.height;
  if (input.fileNameOriginal) updateData.fileNameOriginal = sanitizeFileName(input.fileNameOriginal);

  const updated = await prisma.mediaAsset.update({
    where: { id: asset.id },
    data: updateData,
  });

  return {
    ok: true,
    data: {
      id: updated.id,
      status: "ACTIVE",
      purpose: updated.purpose,
      visibility: updated.visibility,
      fileNameOriginal: updated.fileNameOriginal,
      mimeType: updated.mimeType,
      byteSize: updated.byteSize,
      width: updated.width,
      height: updated.height,
      storageKey: updated.storageKey,
      publicUrl: updated.visibility === "PUBLIC" ? publicUrlForKey(updated.storageKey) : null,
    },
  };
}

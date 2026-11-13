import {
  type MediaPurpose,
  type ParentRef,
  PRIVATE_DOCUMENT_MAX_BYTES,
  PRIVATE_DOCUMENT_MIME_TYPES,
  PUBLIC_IMAGE_MAX_BYTES,
  PUBLIC_IMAGE_MIME_TYPES,
} from "./types.ts";

export function visibilityForPurpose(purpose: MediaPurpose): "PUBLIC" | "PRIVATE" {
  return purpose === "LISTING_IMAGE" || purpose === "CATEGORY_IMAGE"
    ? "PUBLIC"
    : "PRIVATE";
}

export function bucketKindForVisibility(visibility: "PUBLIC" | "PRIVATE") {
  return visibility === "PUBLIC" ? "public" : "private";
}

export function allowedMimeTypesForPurpose(purpose: MediaPurpose): readonly string[] {
  return visibilityForPurpose(purpose) === "PUBLIC"
    ? PUBLIC_IMAGE_MIME_TYPES
    : PRIVATE_DOCUMENT_MIME_TYPES;
}

export function maxBytesForPurpose(purpose: MediaPurpose): number {
  return visibilityForPurpose(purpose) === "PUBLIC"
    ? PUBLIC_IMAGE_MAX_BYTES
    : PRIVATE_DOCUMENT_MAX_BYTES;
}

export function sanitizeFileName(name: string): string {
  const base = name.replace(/[\r\n\t]/g, " ").replace(/["\\]/g, "_").trim();
  const limited = base.slice(0, 180);
  return limited || "file";
}

export function extensionForMime(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "application/pdf":
      return ".pdf";
    default:
      return "";
  }
}

export function validateUploadInput(input: {
  purpose: MediaPurpose;
  mimeType: string;
  byteSize: number;
  fileName: string;
}): { ok: true } | { ok: false; error: string } {
  if (!input.fileName || !input.fileName.trim()) {
    return { ok: false, error: "INVALID_FILE_NAME" };
  }
  if (!Number.isInteger(input.byteSize) || input.byteSize <= 0) {
    return { ok: false, error: "INVALID_SIZE" };
  }
  const allowed = allowedMimeTypesForPurpose(input.purpose);
  if (!allowed.includes(input.mimeType)) {
    return { ok: false, error: "INVALID_TYPE" };
  }
  if (input.byteSize > maxBytesForPurpose(input.purpose)) {
    return { ok: false, error: "FILE_TOO_LARGE" };
  }
  return { ok: true };
}

export function purposeMatchesParent(
  purpose: MediaPurpose,
  parent: ParentRef,
): boolean {
  switch (purpose) {
    case "LISTING_IMAGE":
      return parent.kind === "listing" || parent.kind === "listingVariant";
    case "CATEGORY_IMAGE":
      return parent.kind === "category";
    case "SELLER_VERIFICATION_DOCUMENT":
      return parent.kind === "sellerApplication";
    case "PROOF_OF_DELIVERY":
      return parent.kind === "shipment";
    default:
      return false;
  }
}

export function normalizeParentForPurpose(
  purpose: MediaPurpose,
  input: Record<string, unknown>,
): ParentRef | { error: string } {
  const asString = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const listingId = asString(input.listingId);
  const listingVariantId = asString(input.listingVariantId);
  const categoryId = asString(input.categoryId);
  const sellerApplicationId = asString(input.sellerApplicationId);
  const shipmentId = asString(input.shipmentId);

  switch (purpose) {
    case "LISTING_IMAGE":
      if (listingVariantId && listingId) {
        return { kind: "listingVariant", listingId, listingVariantId };
      }
      if (listingId) return { kind: "listing", listingId };
      return { error: "MISSING_PARENT" };
    case "CATEGORY_IMAGE":
      if (categoryId) return { kind: "category", categoryId };
      return { error: "MISSING_PARENT" };
    case "SELLER_VERIFICATION_DOCUMENT":
      if (sellerApplicationId) return { kind: "sellerApplication", sellerApplicationId };
      return { error: "MISSING_PARENT" };
    case "PROOF_OF_DELIVERY":
      if (shipmentId) return { kind: "shipment", shipmentId };
      return { error: "MISSING_PARENT" };
    default:
      return { error: "INVALID_PURPOSE" };
  }
}

export function parentTypeForRef(ref: ParentRef): string {
  return ref.kind;
}

export function parentIdForRef(ref: ParentRef): string {
  switch (ref.kind) {
    case "listing":
      return ref.listingId;
    case "listingVariant":
      return ref.listingVariantId;
    case "category":
      return ref.categoryId;
    case "sellerApplication":
      return ref.sellerApplicationId;
    case "shipment":
      return ref.shipmentId;
  }
}

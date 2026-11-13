export const MEDIA_VISIBILITIES = ["PUBLIC", "PRIVATE"] as const;
export type MediaVisibility = (typeof MEDIA_VISIBILITIES)[number];

export const MEDIA_PURPOSES = [
  "LISTING_IMAGE",
  "CATEGORY_IMAGE",
  "SELLER_VERIFICATION_DOCUMENT",
  "PROOF_OF_DELIVERY",
] as const;
export type MediaPurpose = (typeof MEDIA_PURPOSES)[number];

export const MEDIA_ASSET_STATUSES = [
  "PENDING_UPLOAD",
  "ACTIVE",
  "DELETED",
  "REPLACED",
] as const;
export type MediaAssetStatus = (typeof MEDIA_ASSET_STATUSES)[number];

export const PRIVATE_ACCESS_PURPOSES = [
  "OWN_DOCUMENT_VIEW",
  "SELLER_VERIFICATION_REVIEW",
  "ORDER_POD_VIEW",
  "SUPPORT_REVIEW",
  "DELIVERY_REVIEW",
] as const;
export type PrivateAccessPurpose = (typeof PRIVATE_ACCESS_PURPOSES)[number];

export type PrivateAccessActorType = "USER" | "ANONYMOUS" | "SYSTEM";

export const PUBLIC_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const PRIVATE_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export const PUBLIC_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PRIVATE_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

export type ParentRef =
  | { kind: "listing"; listingId: string }
  | { kind: "listingVariant"; listingId: string; listingVariantId: string }
  | { kind: "category"; categoryId: string }
  | { kind: "sellerApplication"; sellerApplicationId: string }
  | { kind: "shipment"; shipmentId: string };

export type SafeMediaSummary = {
  id: string;
  purpose: MediaPurpose;
  status: MediaAssetStatus;
  fileNameOriginal: string;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  sortOrder: number | null;
  createdAt: Date;
  updatedAt: Date;
  publicUrl?: string | null;
};

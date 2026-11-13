import { randomBytes } from "node:crypto";
import { extensionForMime, visibilityForPurpose } from "./validation.ts";
import type { MediaPurpose } from "./types.ts";

function randomSuffix(bytes = 16): string {
  return randomBytes(bytes).toString("hex");
}

export function generateStorageKey(purpose: MediaPurpose, mimeType: string): string {
  const visibility = visibilityForPurpose(purpose).toLowerCase();
  const purposeSeg = purpose.toLowerCase();
  const ext = extensionForMime(mimeType);
  // e.g. public/listing_image/2026/11/<random>.jpg
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${visibility}/${purposeSeg}/${year}/${month}/${randomSuffix()}${ext}`;
}

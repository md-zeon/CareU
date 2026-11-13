/**
 * Focused media foundation tests (spec 0003, milestone 5) for helpers that do not need R2 or a database.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  allowedMimeTypesForPurpose,
  extensionForMime,
  maxBytesForPurpose,
  normalizeParentForPurpose,
  purposeMatchesParent,
  sanitizeFileName,
  validateUploadInput,
  visibilityForPurpose,
} from "../lib/media/validation.ts";
import { generateStorageKey } from "../lib/media/keys.ts";

describe("Media validation and helpers (spec 0003)", () => {
  test("purpose maps to visibility and limits (AC-2, AC-3)", () => {
    assert.equal(visibilityForPurpose("LISTING_IMAGE"), "PUBLIC");
    assert.equal(visibilityForPurpose("CATEGORY_IMAGE"), "PUBLIC");
    assert.equal(visibilityForPurpose("SELLER_VERIFICATION_DOCUMENT"), "PRIVATE");
    assert.equal(visibilityForPurpose("PROOF_OF_DELIVERY"), "PRIVATE");

    assert.deepEqual(allowedMimeTypesForPurpose("LISTING_IMAGE"), ["image/jpeg", "image/png", "image/webp"]);
    assert.deepEqual(allowedMimeTypesForPurpose("SELLER_VERIFICATION_DOCUMENT"), ["application/pdf", "image/jpeg", "image/png"]);

    assert.equal(maxBytesForPurpose("LISTING_IMAGE"), 5 * 1024 * 1024);
    assert.equal(maxBytesForPurpose("PROOF_OF_DELIVERY"), 10 * 1024 * 1024);
  });

  test("validateUploadInput enforces type and size by purpose (AC-2, AC-6)", () => {
    assert.deepEqual(
      validateUploadInput({ purpose: "LISTING_IMAGE", mimeType: "image/jpeg", byteSize: 1024, fileName: "a.jpg" }),
      { ok: true },
    );
    assert.deepEqual(
      validateUploadInput({ purpose: "LISTING_IMAGE", mimeType: "application/pdf", byteSize: 1024, fileName: "a.pdf" }),
      { ok: false, error: "INVALID_TYPE" },
    );
    assert.deepEqual(
      validateUploadInput({ purpose: "SELLER_VERIFICATION_DOCUMENT", mimeType: "image/webp", byteSize: 1024, fileName: "a.webp" }),
      { ok: false, error: "INVALID_TYPE" },
    );
    assert.deepEqual(
      validateUploadInput({ purpose: "LISTING_IMAGE", mimeType: "image/png", byteSize: 5 * 1024 * 1024 + 1, fileName: "a.png" }),
      { ok: false, error: "FILE_TOO_LARGE" },
    );
    assert.deepEqual(
      validateUploadInput({ purpose: "PROOF_OF_DELIVERY", mimeType: "image/png", byteSize: 0, fileName: "a.png" }),
      { ok: false, error: "INVALID_SIZE" },
    );
    assert.deepEqual(
      validateUploadInput({ purpose: "LISTING_IMAGE", mimeType: "image/png", byteSize: 10, fileName: "   " }),
      { ok: false, error: "INVALID_FILE_NAME" },
    );
  });

  test("purpose and parent matching and normalization (AC-1, AC-2)", () => {
    assert.equal(purposeMatchesParent("LISTING_IMAGE", { kind: "listing", listingId: "l1" }), true);
    assert.equal(purposeMatchesParent("LISTING_IMAGE", { kind: "listingVariant", listingId: "l1", listingVariantId: "v1" }), true);
    assert.equal(purposeMatchesParent("LISTING_IMAGE", { kind: "category", categoryId: "c1" }), false);
    assert.equal(purposeMatchesParent("CATEGORY_IMAGE", { kind: "category", categoryId: "c1" }), true);
    assert.equal(purposeMatchesParent("SELLER_VERIFICATION_DOCUMENT", { kind: "sellerApplication", sellerApplicationId: "s1" }), true);
    assert.equal(purposeMatchesParent("PROOF_OF_DELIVERY", { kind: "shipment", shipmentId: "sh1" }), true);

    assert.deepEqual(normalizeParentForPurpose("LISTING_IMAGE", { listingId: "l1" }), { kind: "listing", listingId: "l1" });
    assert.deepEqual(normalizeParentForPurpose("LISTING_IMAGE", { listingId: "l1", listingVariantId: "v1" }), { kind: "listingVariant", listingId: "l1", listingVariantId: "v1" });
    assert.deepEqual(normalizeParentForPurpose("CATEGORY_IMAGE", { categoryId: "c1" }), { kind: "category", categoryId: "c1" });
    assert.deepEqual(normalizeParentForPurpose("SELLER_VERIFICATION_DOCUMENT", {}), { error: "MISSING_PARENT" });
  });

  test("file name and extension helpers are safe (AC-6)", () => {
    assert.equal(extensionForMime("image/jpeg"), ".jpg");
    assert.equal(extensionForMime("image/png"), ".png");
    assert.equal(extensionForMime("image/webp"), ".webp");
    assert.equal(extensionForMime("application/pdf"), ".pdf");
    assert.equal(extensionForMime("text/plain"), "");

    const sanitized = sanitizeFileName('bad\r\n"name\\file.png');
    assert.equal(sanitized.includes("\n"), false);
    assert.equal(sanitized.includes("\r"), false);
    assert.equal(sanitized.includes('"'), false);
    assert.equal(sanitized.length > 0, true);
  });

  test("storage keys are unguessable and prefixed by visibility and purpose (AC-6)", () => {
    const key = generateStorageKey("LISTING_IMAGE", "image/jpeg");
    assert.match(key, /^public\/listing_image\/\d{4}\/\d{2}\/[a-f0-9]{32}\.jpg$/);

    const privateKey = generateStorageKey("SELLER_VERIFICATION_DOCUMENT", "application/pdf");
    assert.match(privateKey, /^private\/seller_verification_document\/\d{4}\/\d{2}\/[a-f0-9]{32}\.pdf$/);

    const another = generateStorageKey("LISTING_IMAGE", "image/jpeg");
    assert.notEqual(key, another);
  });
});

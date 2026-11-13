# Verify: media storage and secure file handling · spec 0003 · updated 2026-11-13
_Steps derived from spec 0003 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [ ] As an authorized listing/category manager, create an upload intent for a LISTING_IMAGE with allowed type/size and parent, confirm response includes assetId, storageKey, presigned upload URL, headers, and expiry, then upload the object to R2 and finalize successfully; confirm asset becomes ACTIVE with correct metadata and publicUrl (public base URL + storageKey). → AC-1, AC-2, AC-3
- [ ] As an authorized applicant/owner/shop staff for a seller application, create and finalize a SELLER_VERIFICATION_DOCUMENT upload for that application; confirm asset is PRIVATE, linked to sellerApplicationId, and no public URL is exposed. → AC-1, AC-2, AC-3
- [ ] As an authorized reviewer (platform seller review/trust/document read permission), request private access to an ACTIVE seller verification document; confirm a GRANTED PrivateFileAccessLog entry is created before/with the short lived download URL and expiry is returned. → AC-3, AC-4
- [ ] As the owning customer, request private access to a proof of delivery asset for your own shipment; confirm access is granted when permitted and the download URL is short lived and attachment oriented. → AC-3, AC-4
- [ ] As an authorized user, list media for a listing/category parent; confirm ordering by sortOrder then createdAt, safe fields only, public URLs for public media, and no raw storage keys/buckets/credentials for private files in the listing response. → AC-1, AC-3, AC-5
- [ ] As an authorized user, bulk reorder listing/category images and update alt text; confirm reorder applies in one operation and new/updated metadata is persisted. → AC-5
- [ ] As an authorized user, replace a listing/category image by finalizing a new ACTIVE asset first, then switching/removing the old one; confirm old asset becomes REPLACED/DELETED as appropriate and remains safe to clean up only when eligible. → AC-5, AC-6

## Commands
- [ ] `npm run typecheck` → passes with media schema, utilities, operations, and API routes. → AC-1, AC-2, AC-3, AC-4, AC-5, AC-6
- [ ] `npm run lint` → passes with no new lint errors in media foundation. → AC-2, AC-6
- [ ] `node --env-file=.env --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test "./tests/**/*.test.ts"` → existing implemented gates and schema/authz tests pass; T3-T7 remain skipped stubs. → AC-1, AC-2, AC-3, AC-4, AC-5, AC-6
- [ ] `npm run build` → production build succeeds including `/api/media/*` routes. → AC-1, AC-2, AC-3, AC-4, AC-5, AC-6
- [ ] `npx prisma migrate status` (with env loaded) → migration `20261113130000_media_storage_secure_file_handling` is applied and database schema is up to date. → AC-1, AC-4, AC-5

## Acceptance-criteria coverage
- AC-1: covered by upload intent/finalize happy paths, DB schema/migration, and list responses showing required metadata and correct parent links.
- AC-2: covered by intent validation/presign flow, finalize object verification and idempotent ACTIVE behavior, invalid type/size/mismatch rejection, and command checks.
- AC-3: covered by public URL serving for public media, private access via short lived presigned grants only, and listing/access response safety.
- AC-4: covered by GRANTED/DENIED/anonymous-denied private access attempts creating PrivateFileAccessLog entries with actor/context/result/timestamps (and expiry on grant) before or at grant issuance.
- AC-5: covered by listing/category reorder/update/remove-replace flows, verification document history preservation (new records, no casual delete/replace), and proof of delivery evidence preservation rules.
- AC-6: covered by server-side validation/constraints, untrusted client metadata handling, unguessable storage keys, idempotent finalize, and controlled cleanup eligibility (pending/removable public only; verification/POD preserved).

# 0003. Media storage and secure file handling

**Date**: 2026-11-13
**Status**: In Progress

## Summary

This spec defines a shared file storage foundation for CareU.bd using Cloudflare R2. It covers public product and listing images, public category images, private seller verification documents, and private proof of delivery files. Files are uploaded directly to R2 with a server issued presigned upload (a short lived upload permission), checked and finalized on the server, served through public URLs for public media or short lived signed access for private files, and recorded with metadata and an access audit trail.

## Requirements

**User stories**:
- As a seller or platform user, I want to upload allowed images and documents for the records I am responsible for so that my shop, listings, categories, verification, and deliveries have the files they need.
- As a customer, seller, or authorized platform staff member, I want to view private order or verification files only when I am allowed so that sensitive documents stay protected.
- As a platform operator, I want every private file access to be recorded so that I can understand who was granted access, when, and why.
- As a developer, I want one reusable file foundation so that later slices can add their own screens and workflows without inventing separate storage rules.

**Acceptance criteria** (the contract, each criterion is independently checkable):
- **AC-1**: The system can store metadata for each covered file in a central `MediaAsset` record, including storage key, visibility, purpose, original file name, type, size, checksum (when available), image dimensions (when known), status, uploader, timestamps, and the correct parent link for listing images, listing variant images, category images, seller verification documents, and proof of delivery files.
- **AC-2**: To upload a file, the server authorizes the actor, validates the requested purpose/parent/type/size, creates a `PENDING_UPLOAD` asset, and returns a short lived presigned R2 upload URL with allowed upload constraints where supported. After direct upload to R2, a finalize operation verifies the uploaded object exists and matches the allowed intent (including reported size and content type) before marking the asset `ACTIVE`; files that fail validation or verification never become active.
- **AC-3**: Public listing and category images are served through a configurable public base URL and are suitable for normal storefront rendering. Private seller verification documents and proof of delivery files are never publicly readable and can be accessed only through a server authorized, short lived presigned download grant.
- **AC-4**: Every private file access attempt creates a `PrivateFileAccessLog` record with actor identity/context (including anonymous attempts where there is no signed in user), asset, purpose/context, parent context, result (`GRANTED` or `DENIED`), and timestamps (and expiry when a grant is issued) before or at the time a download grant is issued.
- **AC-5**: File lifecycle rules are enforced by purpose: listing and category images can be added, reordered, updated (alt text/sort order), removed, or replaced by authorized users; seller verification documents keep history (new submissions/resubmissions add records and prior records remain reviewable); proof of delivery files are treated as evidence and are not casually deleted or replaced.
- **AC-6**: The server enforces safe file handling: allowed types and limits are checked on the server (public images: JPEG/PNG/WebP up to 5 MB; private documents: PDF/JPEG/PNG up to 10 MB), client provided content type and metadata are not trusted as proof, storage keys are unguessable and unique, finalize is idempotent for the same verified pending upload, and R2 object deletion is allowed only for controlled cleanup cases (for example expired pending uploads or removable/replaced public images no longer referenced) while verification and proof of delivery evidence remains preserved.

## Decision

**Chosen option**: Option 1: Central asset model with direct R2 uploads and controlled access.

The foundation will use Cloudflare R2 through the S3 compatible API, a central `MediaAsset` table, a `PrivateFileAccessLog` table, presigned direct uploads with server finalize, public URLs for public media, and audited short lived signed grants for private files.

**Implementation skills**: none recorded in project `AGENTS.md` for storage/file handling. Follow `AGENTS.md` rules for server side authorization, private document handling, caching, and dependency discipline.

## Feature design

**Data model sketch**:

Entities and fields (target model for this feature):

| Entity | Key fields | Notes |
|---|---|---|
| `MediaAsset` | `id` (PK), `storageKey` (unique), `visibility` (`PUBLIC`/`PRIVATE`), `purpose` (`LISTING_IMAGE`, `CATEGORY_IMAGE`, `SELLER_VERIFICATION_DOCUMENT`, `PROOF_OF_DELIVERY`), `fileNameOriginal` (sanitized), `mimeType`, `byteSize`, `checksumSha256` (nullable), `width` (nullable int), `height` (nullable int), `altText` (nullable), `sortOrder` (nullable int), `status` (`PENDING_UPLOAD`, `ACTIVE`, `DELETED`, `REPLACED`), `uploadedByUserId` (FK User), `listingId` (nullable FK), `listingVariantId` (nullable FK), `categoryId` (nullable FK), `sellerApplicationId` (nullable FK), `shipmentId` (nullable FK), `createdAt`, `updatedAt` | Central record for every covered file. Exactly one parent context must match `purpose` and `visibility`. `checksumSha256` and dimensions may be client provided metadata but are not trusted without verification. |
| `PrivateFileAccessLog` | `id` (PK), `mediaAssetId` (FK MediaAsset), `actorType` (`USER`, `ANONYMOUS`, `SYSTEM`), `accessedByUserId` (nullable FK User), `actorRoleOrContext` (nullable), `purpose` (access reason/context), `parentType` (nullable), `parentId` (nullable), `grantedAt`, `expiresAt` (nullable), `ipAddress` (nullable), `userAgent` (nullable), `result` (`GRANTED`/`DENIED`), `reason` (nullable) | Append only audit record for private access attempts/grants. Supports anonymous denied attempts. |

Relationships (cardinality):

| Relationship | Cardinality | Notes |
|---|---|---|
| User -> MediaAsset (`uploadedByUserId`) | 1 : N | A user uploads many assets. |
| User -> PrivateFileAccessLog (`accessedByUserId`, nullable) | 0..1 actor per log : N logs | Signed in actors link to User; anonymous attempts have no user id. |
| MediaAsset -> PrivateFileAccessLog | 1 : N | Each private access event belongs to one asset. |
| Listing -> MediaAsset | 1 : N | Listing images, ordered by `sortOrder` when used. |
| ListingVariant -> MediaAsset | 1 : N | Variant specific images when attached. |
| Category -> MediaAsset | 1 : N | Category images, ordered by `sortOrder` when used. |
| SellerApplication -> MediaAsset | 1 : N | Verification documents, history kept across submissions (current vs historical is determined by the owning review flow; foundation preserves all records). |
| Shipment -> MediaAsset | 1 : N | Proof of delivery files (one or more), treated as evidence. |

**State transitions** (if applicable):

`MediaAsset.status` lifecycle:
- `PENDING_UPLOAD` -> `ACTIVE`: server finalize confirms the R2 object exists and its reported metadata matches the allowed upload intent.
- `PENDING_UPLOAD` -> `DELETED`: upload expired/abandoned or failed verification and the pending record is cleaned up (object cleanup eligible when safe).
- `ACTIVE` -> `REPLACED`: a listing/category image asset is replaced by a newly finalized asset and is no longer the current attachment.
- `ACTIVE` -> `DELETED`: a removable public listing/category image is removed by an authorized action and is no longer referenced.
- Verification documents and proof of delivery assets remain part of preserved history/evidence in normal flows and are not casually transitioned to deleted/replaced by client actions.

`PrivateFileAccessLog` is append only in normal operation (no update/delete flow).

**API surface**:

| Endpoint / action | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `createUploadIntent` | Server action or route handler (POST) | `purpose`, `parentId` (and parent type/variant as needed), `fileName`, `mimeType`, `byteSize`, optional client checksum/dimensions | `assetId`, `storageKey`, presigned upload URL, required headers/conditions, upload expiry | Authenticated and authorized for parent/purpose and scope | 400 invalid input, 401 unauthenticated, 403 forbidden, 413/422 invalid type or size, 404 parent not found |
| `finalizeUpload` | Server action or route handler (POST) | `assetId`, optional checksum/client metadata | finalized `MediaAsset` summary (`id`, `status=ACTIVE`, metadata, public URL for public media when applicable) | Pending asset uploader or authorized server/system flow for the same context | 400 invalid state, 401/403, 404 asset/object not found, 409 already finalized in conflicting state, 422 verification mismatch |
| `getPrivateFileAccess` | Server action or route handler (POST/GET) | `assetId` or parent+asset selector, access `purpose/context` | short lived presigned GET URL, expiry, safe asset metadata (on grant only) | Session resolved server side; authorization checked for specific file/parent; attempt logged (including anonymous denied attempts) | 401/403 denied (logged), 404 not found, 410 expired/unavailable if applicable, 500 storage/signing error |
| `listMediaForParent` | Server read (query/action/route) | `purpose`, `parentId` (and variant/category context as needed) | ordered list of allowed media records with safe metadata (public URL for public media; no raw storage keys/buckets/credentials for private files) | Authenticated and authorized for parent scope | 401/403, 404 parent not found |
| `updateMediaMetadata` | Server action or route handler (PATCH/POST) | `assetId` or bulk reorder payload (`orderedAssetIds` for a parent), `altText`, `sortOrder` as allowed | updated media summary or updated ordered list | Authenticated and authorized for parent/purpose | 400/422 invalid, 401/403, 404, 409 not editable |
| `removeOrReplaceMedia` | Server action or route handler (POST/DELETE semantics) | `assetId`, replacement/new asset reference where applicable, reason/context as needed | updated state/list result | Authenticated and authorized; respects purpose history/evidence rules | 400/403 not allowed by purpose, 404, 409 conflict |
| `cleanupStoredObject` | Restricted server/internal operation | `assetId` or storage key, cleanup reason | cleanup result | Authorized server/admin or tightly scoped internal flow only (not a public client API) | 401/403, 404, 409 not eligible for cleanup |

**Value sourcing** (every value each action produces, computes, or displays names where it comes from; a required value with no named source is an undecided input, resolve it before this spec is done, do NOT leave the build to invent it):

| Action | Value produced / displayed | Source |
|---|---|---|
| `createUploadIntent` | `purpose`, `visibility` | Input `purpose`; `visibility` derived from purpose rules (`LISTING_IMAGE`/`CATEGORY_IMAGE` -> PUBLIC, verification/POD -> PRIVATE). |
| `createUploadIntent` | Parent attachment (listing, listing variant, category, seller application, shipment) | Input parent identifiers; validated against existing records and actor authorization in database. |
| `createUploadIntent` | Allowed file type and max size | Server side validation rules by purpose (images JPEG/PNG/WebP up to 5 MB; private docs PDF/JPEG/PNG up to 10 MB). |
| `createUploadIntent` | `storageKey`, presigned upload URL, upload expiry, signed upload constraints | Generated on server (unguessable key with visibility/purpose prefix and safe suffix) using R2 S3 client/presigner and configurable upload TTL (default 10 minutes). Allowed content type and content length are signed into upload conditions/headers when supported. |
| `createUploadIntent` | `assetId`, `status=PENDING_UPLOAD`, uploader, timestamps, optional client checksum/dimensions | Created `MediaAsset` record in database from authenticated session (`uploadedByUserId`), server time, and validated optional client metadata (stored but not trusted as proof). |
| `finalizeUpload` | Object existence and uploaded object metadata for verification | R2 object lookup/head via S3 compatible client; compared to pending asset intent (expected size, allowed content type/purpose/parent). |
| `finalizeUpload` | Checksum and image dimensions recorded | Optional client checksum stored if provided. Image dimensions may come from optional client metadata and should be verified from the uploaded object when practical during finalize; if not verified in the first build, values are treated as unverified metadata until verification support is added. Full SHA-256 recomputation from R2 is not required in this foundation. |
| `finalizeUpload` | Final asset status and public URL (public media) | Database state transition to `ACTIVE` on verified match (idempotent success if already active with matching state); public URL derived from configurable public base URL + `storageKey`. |
| `finalizeUpload` | Caller identity for finalize | Authenticated session must match pending uploader or an authorized server/system flow for the same context. |
| `getPrivateFileAccess` | Authorization decision and access purpose/context | Session/user resolved server side, spec 0002 permission/scope checks, parent ownership/scope from database, and input access purpose (initial set: `OWN_DOCUMENT_VIEW`, `SELLER_VERIFICATION_REVIEW`, `ORDER_POD_VIEW`, `SUPPORT_REVIEW`, `DELIVERY_REVIEW`, extensible). |
| `getPrivateFileAccess` | Audit log entry and result | `PrivateFileAccessLog` record written by server with actor type/id/context, asset, parent context, access purpose, result, reason (optional, useful for denied), timestamps, expiry, and request metadata when available. Denied attempts are logged (including anonymous). |
| `getPrivateFileAccess` | Presigned download URL, expiry, download presentation | R2 presigner using asset `storageKey` and configurable private access TTL (default 5 minutes), issued only on `GRANTED`. Content disposition/filename handling uses sanitized original name; documents default to safe download/attachment unless inline viewing is explicitly intended and safe. |
| `listMediaForParent` | Returned media list, order, and safe fields | `MediaAsset` rows filtered by parent/purpose/status/visibility and ordered by `sortOrder` then `createdAt`. Safe fields include asset id, purpose, status, sanitized file name, mime type, size, dimensions, alt text, sort order, timestamps, and safe uploader context as needed; private lists never expose raw storage keys, bucket names, credentials, or presigned URLs. |
| `updateMediaMetadata` | `altText`, `sortOrder`, reorder result | Authorized input values validated and stored. Reorder is a bulk operation for the parent (full ordered asset id list) applied in one server transaction; new image `sortOrder` defaults after the current highest value or creation order fallback. |
| `removeOrReplaceMedia` | Removal/replacement outcome | Purpose/history rules from database and authorized input. For listing/category replacement, create and finalize the new asset first, then switch the current attachment/order in a server operation, then mark old asset `REPLACED`/`DELETED` as appropriate. Verification docs are preserved as history; POD assets remain evidence. |
| `cleanupStoredObject` | Eligibility and timing for R2 deletion | Asset purpose/status/reference rules from database. Eligible only for expired/abandoned pending uploads or public media no longer referenced and safe to remove. Cleanup may run from eligible mutation flows or a restricted maintenance action later; never used for normal verification/POD evidence. |

**Key invariants**:
- `MediaAsset.storageKey` is unique, unguessable, and generated by the server with visibility/purpose prefixes and safe file suffixes; keys must not include sensitive personal data.
- `visibility` and allowed parent types must match `purpose` (public image purposes attach to listing/listing variant/category; private document purposes attach to seller application or shipment as defined).
- A `MediaAsset` represents exactly one parent context appropriate to its purpose; invalid combinations are rejected.
- File type and size are validated on the server per purpose. Client provided content type, checksum, and dimensions are not trusted as proof. Presigned uploads must include allowed upload constraints/headers when supported, and finalize must verify actual stored object metadata against the intent.
- A file becomes `ACTIVE` only after server finalize verifies the uploaded object. Finalize is idempotent for an already active, matching asset.
- Private assets are never publicly readable. Every private access attempt records a `PrivateFileAccessLog` entry (`GRANTED` or `DENIED`) including anonymous denied attempts. Access logging and grant issuance must be handled safely (denials recorded; grants recorded before returning the URL, using a transaction where practical).
- Listing and category images are replaceable/removable by authorized users. New public replacement assets are finalized before becoming current; replaced public objects are cleaned up only when no longer referenced. Verification documents keep history (resubmissions add records; prior records remain). Proof of delivery assets are evidence and are not casually deleted or replaced.
- R2 object deletion is permitted only for controlled cleanup cases and must not destroy verification or proof of delivery evidence.

**Security model**:
- All operations resolve the actor from the trusted server session and apply server side authorization (never trust client supplied role/shop/ownership). Use spec 0002 guards and scope checks for every protected action. If a specific media permission is missing, add it through the normal authz/permission process rather than bypassing checks.
- Public listing/category image management: authorized shop users may manage images for their own shop/listings/categories as permitted by shop scoped permissions; authorized platform users may manage CareU/catalog content and perform permitted platform/moderation actions. Every mutation is scoped to the correct parent and owner.
- Seller verification documents: the applicant, seller owner, or authorized shop staff for that seller/application context may upload and access their own verification documents for submission/resubmission only. Authorized platform staff with seller review/trust permissions may access them for review. No other sellers or customers may access them. Platform staff do not upload seller verification docs on behalf of sellers in this foundation.
- Proof of delivery files: upload is allowed only when the actor is authorized for that shipment and the fulfillment workflow permits proof capture for the shipment's current state (the exact fulfillment state rules are enforced by the owning fulfillment slice). A shipment may have one or more proof files. Viewable by the customer who owns the order, the fulfilling shop users with appropriate permission for that shipment, and authorized platform staff (delivery/support/dispute/review) as permitted. Access is logged.
- Private access uses short lived presigned GET URLs (default 5 minutes, configurable). Public media uses public read URLs only for intended public assets. No private file is served from a public bucket/path or without authorization.
- Upload and download URLs are short lived (uploads default 10 minutes, configurable). R2 bucket CORS (cross origin upload permission for browsers) must allow only the required app origins, methods, and headers for direct upload. Secrets and R2 credentials are read from environment variables and never exposed to clients except presigned URLs issued for the authorized action.
- Sensitive mutations and private access should also integrate with the project's normal audit and rate limiting patterns where applicable (for example upload intent, finalize, private access, verification, and proof of delivery actions).

**Configuration required**:
- `R2_ENDPOINT`: S3 compatible endpoint for the Cloudflare R2 account/bucket API.
- `R2_ACCESS_KEY_ID`: R2 access key id for server side S3 operations.
- `R2_SECRET_ACCESS_KEY`: R2 secret access key for server side S3 operations.
- `R2_BUCKET_PUBLIC`: Bucket (or bucket name) used for public media objects.
- `R2_BUCKET_PRIVATE`: Bucket (or bucket name) used for private document objects.
- `R2_PUBLIC_BASE_URL`: Configurable public base URL for serving public media (for example CDN/custom domain in production).
- `MEDIA_UPLOAD_URL_TTL_SECONDS`: Presigned upload URL lifetime in seconds (default 600 / 10 minutes).
- `MEDIA_PRIVATE_ACCESS_URL_TTL_SECONDS`: Presigned private download URL lifetime in seconds (default 300 / 5 minutes).
- R2 CORS configuration per environment: allowed origins, methods, and headers for direct browser uploads (configured in R2, documented during implementation).
- (Optional/follow up if needed) environment values for max counts per parent or additional limits; defaults are defined in code/config with server validation.

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path: authorized user creates an upload intent for a listing image (with signed upload constraints), uploads directly to R2, finalizes successfully after object verification, and the image becomes `ACTIVE` with a public URL; authorized user creates and finalizes a private verification document for their own application, verifies **AC-1**, **AC-2**, **AC-3**.
- Happy path (private access): authorized platform reviewer requests access to a private verification document; server writes a `GRANTED` `PrivateFileAccessLog` entry (with actor type/id and purpose) and returns a short lived signed URL. Authorized customer requests proof of delivery for their own order and receives access when permitted, verifies **AC-3**, **AC-4**.
- Failure/edge case: invalid type or oversize file is rejected at intent creation; finalize fails when object is missing or metadata does not match the intent and asset does not become active; repeated finalize for an already active matching asset is idempotent; expired/invalid presigned URLs fail safely; pending uploads can be cleaned up without affecting active evidence, verifies **AC-2**, **AC-6**.
- Auth/permission: unauthenticated user cannot create intents or obtain private access; an anonymous or unauthorized private access attempt is denied and logged with `DENIED`; seller cannot access another seller's verification documents; customer cannot access another customer's proof of delivery, verifies **AC-3**, **AC-4**, **AC-5**.
- Lifecycle/history: authorized user can bulk reorder and remove/replace listing or category images (new replacement finalized before becoming current); verification resubmission adds a new record while prior records remain; proof of delivery file cannot be casually deleted/replaced by normal flows; R2 cleanup is blocked for verification/POD evidence and allowed only for safe cleanup cases, verifies **AC-5**, **AC-6**.

## Build plan

Build approach: **Tracer Bullet** (project default). Build one thin, real end to end thread through schema, server logic, storage integration, and authorization/audit, then thicken with the remaining operations and safety rules.

1. **Schema and migration for file foundation**: add Prisma enums and models for `MediaAsset` and `PrivateFileAccessLog` (including parent foreign keys, status/visibility/purpose/actor enums, indexes, unique `storageKey`, nullable actor fields for anonymous attempts, and required timestamps/fields), and create/apply the migration for the confirmed data model, satisfies **AC-1**, **AC-4**, **AC-5**.
2. **Storage configuration and server utilities**: add server side R2 configuration/env validation, S3 compatible client/presigner setup, unguessable storage key generation, configurable public base URL and TTL helpers, and server side file validation rules (purpose, mime/type allow list, size limits, signed upload constraints where supported), satisfies **AC-2**, **AC-3**, **AC-6**.
3. **Upload intent and finalize thread (thin end to end)**: implement `createUploadIntent` and `finalizeUpload` server operations with authorization checks, `PENDING_UPLOAD` creation, presigned upload URL issuance, R2 object verification (existence and metadata match), idempotent finalize behavior, and safe transition to `ACTIVE` (or failure without activation), satisfies **AC-1**, **AC-2**, **AC-6**.
4. **Private access and audit logging**: implement `getPrivateFileAccess` to authorize by actor and parent scope, write `PrivateFileAccessLog` entries for granted and denied attempts (including anonymous), and issue short lived presigned GET URLs only on grant with safe logging/order guarantees, satisfies **AC-3**, **AC-4**, **AC-6**.
5. **Listing, metadata, lifecycle, and cleanup operations**: implement `listMediaForParent`, public image metadata updates and bulk reorder, remove/replace behavior for listing/category images (finalize replacement before switch), history preserving handling for verification documents, evidence preserving handling for proof of delivery, and controlled R2 cleanup eligible only for safe cases, satisfies **AC-1**, **AC-3**, **AC-5**, **AC-6**.
6. **Hardening and verification support**: add focused tests/helpers for validation, authorization, state transitions, idempotency, and audit logging paths defined by this spec; document env vars, CORS requirements, and integration notes needed by later UI slices, satisfies **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**.

## Consequences

**Positive**:
- Later slices get one shared, secure way to handle public and private files instead of building separate upload and access logic.
- Direct uploads reduce server load and fit serverless constraints, while server side intent/finalize keeps control and validation.
- Private document access becomes auditable and consistently protected by authorization checks, including denied and anonymous attempts.
- The data model supports history and evidence needs for verification and proof of delivery.

**Negative / tradeoffs**:
- The flow has more steps (intent, direct upload, finalize, access grant) than a simple upload endpoint, so implementation and testing are more involved.
- R2, CORS, and signing behavior depend on correct environment configuration and credential management in every environment.
- Cleanup of pending or replaced objects requires careful rules and operational follow up to avoid deleting evidence or leaving orphaned records.

**Neutral**:
- New environment variables and storage dependencies will be needed when implementation begins (following the project's dependency policy).
- Public image delivery will require `next/image` remote host configuration (`images.remotePatterns`) when public image rendering is wired.
- This spec defines the foundation and server operations; upload UI screens and fulfillment state rules are intentionally left to the owning slices.

## Follow-up

- [ ] Add `images.remotePatterns`, R2 CORS settings, and any CDN/public host configuration when the first public image rendering and direct upload paths are implemented.
- [ ] Define and enforce max image counts per listing/category in the owning catalog/listing slice (foundation should allow configuration/validation hooks).
- [ ] Add background cleanup for expired `PENDING_UPLOAD` assets and orphaned objects (important operational task as volume grows).
- [ ] When support attachments or review media are added, extend `purpose`, parent rules, authorization mapping, and access log purposes through this same foundation.
- [ ] Decide retention periods for verification documents and proof of delivery files when legal/operations policy is confirmed (retention must remain configurable by record type per `AGENTS.md`).
- [ ] Add stronger integrity verification later if needed (for example server side checksum verification strategy compatible with direct upload).

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
# 0003. Media storage and secure file handling (rationale)

## Context

CareU.bd needs a shared way to store and handle files for the marketplace. The same foundation must serve public images for listings and categories, private seller verification documents, and private proof of delivery files. Later slices (seller onboarding, catalog and listing management, fulfillment, and more) will depend on this foundation, so it must be safe, consistent, and easy to reuse.

Cloudflare R2 is already the chosen storage vendor for both public product media and private, access controlled documents. The project runs on Next.js 16 on the server, with Prisma 7 and Postgres, and it must enforce authorization on the server for every protected operation. Private order and seller records must never be exposed by guessable links or client trust. At the same time, public product and category images must load quickly and work well for crawlable storefront pages.

The main forces in this decision are security, auditability, performance, and simplicity. Uploads must be validated on the server and must not overload serverless request handling. Private files need a reliable audit trail when access is granted. Public media needs stable public URLs that work with caching and `next/image`. The model must also respect history rules: verification documents and proof of delivery are evidence, while catalog images are normal working content that can be replaced.

## Options considered

### Option 1: Central asset model with direct R2 uploads and controlled access (chosen)

Store file metadata in a central `MediaAsset` record and private access events in `PrivateFileAccessLog`. Use server issued presigned upload URLs for direct browser to R2 uploads, followed by a server finalize step. Serve public images through a configurable public base URL. Serve private files only through short lived, audited presigned download grants.

**Pros**:
- One consistent model for validation, ownership, linking, and auditing across all covered file types.
- Direct uploads avoid pushing large files through serverless routes and scale better.
- Public URLs are fast and cache friendly for storefront media; private files stay controlled.
- History and evidence rules can be enforced clearly in one place.

**Cons**:
- More moving parts than a simple server upload flow (intent, upload, finalize, access grant).
- Requires careful server checks so pending records, object state, and database state stay in sync.
- Adds storage integration dependencies and environment configuration.

### Option 2: Upload files through the application server

Have the browser upload to a Next.js route or server action, let the server validate, then stream the file to R2.

**Pros**:
- Simpler request flow in one place.
- Server sees the file bytes directly during upload.

**Cons**:
- Uses more server memory, bandwidth, and execution time.
- More likely to hit request size or timeout limits in serverless environments.
- Harder to scale for common image and document uploads.

### Option 3: Separate tables and flows per use case

Create different tables and upload/access flows for listing images, category images, verification documents, and proof of delivery.

**Pros**:
- Very explicit per use case.
- Each table can be tailored to its parent.

**Cons**:
- Duplicates validation, authorization, storage, and audit logic.
- Makes future file types harder to add consistently.
- Increases the chance that one flow becomes less secure than the others.

## Rationale

Option 1 fits the project constraints best. CareU needs both public and private file handling, and the same rules around validation, ownership, and auditing should apply everywhere. A central `MediaAsset` record gives one place to store storage keys, visibility, purpose, metadata, status, and parent links, while `PrivateFileAccessLog` gives a clear audit trail for private access grants and denied attempts (including anonymous attempts).

The direct upload flow is the right tradeoff for this stack. A server issued presigned upload URL keeps authorization and validation on the server, but moves the file bytes directly to R2. Signed upload constraints and server side finalize verification reduce trust in client supplied metadata. The finalize step confirms that the uploaded object exists and matches what was allowed before it becomes active. This is safer and more reliable than trusting the browser alone.

Public product and category images should be publicly readable so storefront pages stay fast, cacheable, and crawlable. Private verification documents and proof of delivery files must never be public; short lived signed access after an authorized, logged check gives controlled access without building a file proxy for every read. Controlled cleanup of R2 objects is included, but only for safe cases so evidence and verification history are not lost. Replacement, ordering, permission mapping, and upload timing details are specified tightly enough that later builders do not have to invent load bearing security or lifecycle behavior.

## References

No references section (engineer chose no references).
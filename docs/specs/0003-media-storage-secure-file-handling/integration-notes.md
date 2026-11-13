# Integration notes: media storage and secure file handling (spec 0003)

This note supports milestone 5 (hardening and integration). It records environment setup, CORS, permission mapping, and a reminder for real Cloudflare R2 setup.

## Environment variables

Required for `lib/media/config.ts` when media operations run:
- `R2_ENDPOINT` (example: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`)
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_PUBLIC` (public listing and category images)
- `R2_BUCKET_PRIVATE` (private seller verification documents and proof of delivery files)
- `R2_PUBLIC_BASE_URL` (base URL used to serve public media, no trailing slash required)

Optional (defaults in code):
- `MEDIA_UPLOAD_URL_TTL_SECONDS` (default `600`, 10 minutes)
- `MEDIA_PRIVATE_ACCESS_URL_TTL_SECONDS` (default `300`, 5 minutes)

Notes:
- Keep secrets in the root `.env` and never commit them.
- Restart the dev server after changing env vars.
- If config is missing, media operations that need R2/config will fail when invoked. The rest of the app can still run without these values until media flows are used.

## R2 and CORS setup (per environment)

- Enable R2 for the Cloudflare account.
- Create one public bucket and one private bucket. Keep the private bucket not publicly readable.
- Create S3 compatible R2 credentials (Access Key ID and Secret Access Key). Copy the secret at creation time because it is shown once.
- Configure public access for the public bucket using an appropriate public base URL (custom domain recommended for production; r2.dev is rate limited and intended for development use). Set `R2_PUBLIC_BASE_URL` to that base.
- Configure R2 CORS for direct browser uploads on the buckets used for presigned PUT uploads:
  - Allow only the required app origins for each environment (local, staging, production).
  - Allow required methods (at least `PUT`, and include `GET`/`HEAD` only if needed).
  - Allow required headers such as `Content-Type` and `Content-Length` (and any others required by the signed request).
  - Keep rules as narrow as practical.

## Permission and authorization mapping (current foundation)

The current implementation uses existing spec 0002 permissions and ownership checks:
- `LISTING_IMAGE` upload/list/update/remove: shop scoped listing access, mapped through `shop.listing.read` and `shop.listing.write` (and CareU shop mapping for authorized platform roles acting on the CareU shop).
- `CATEGORY_IMAGE` upload/list/update: platform catalog permissions `platform.category.manage` or `platform.catalogue.manage`.
- `SELLER_VERIFICATION_DOCUMENT` upload: applicant, or active shop member in the applicant's owned shop context (platform staff do not upload on behalf of sellers in this foundation).
- `SELLER_VERIFICATION_DOCUMENT` private read: applicant/authorized shop staff for that application context, or platform staff with `platform.seller.document.read`, `platform.seller.review`, or `platform.seller.trust.manage`.
- `PROOF_OF_DELIVERY` upload: shipment scoped fulfillment access via `shop.fulfillment.manage` (exact fulfillment state gating is owned by the fulfillment slice).
- `PROOF_OF_DELIVERY` private read: order customer, fulfilling shop users with `shop.order.read`, or authorized platform staff with `platform.delivery.manage`, `platform.support.manage`, `platform.dispute.resolve`, or `platform.order.read`.

If later slices need more specific media permissions, add them through the normal authz and permission catalog process instead of bypassing checks.

## Reminder: real Cloudflare R2 setup still needed

**Reminder:** this environment does not yet have live Cloudflare R2 configured (R2 enablement and S3 credentials were not available). Before relying on real uploads/downloads in staging or production, you must:
- Enable R2 in the Cloudflare dashboard for the account.
- Create `R2_BUCKET_PUBLIC` and `R2_BUCKET_PRIVATE`.
- Create R2 S3 credentials and set `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
- Configure `R2_PUBLIC_BASE_URL` and bucket CORS for direct browser uploads.
- Run a real end to end check: upload intent, direct PUT to R2, finalize, public media URL access, private access grant with audit log entries (including denied/anonymous attempts), and safe cleanup behavior.

Until then, local development can continue without R2 or use a local S3 compatible service (such as MinIO) for upload flow testing, but production behavior must be verified against real R2.
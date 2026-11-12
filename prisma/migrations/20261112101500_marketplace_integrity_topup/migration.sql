-- Marketplace domain model integrity top up after the 2026-11-12 rereview.
-- Schema driven changes first, then the hand authored guards Prisma cannot express.

-- CreateEnum
CREATE TYPE "SupportAuthorType" AS ENUM ('CUSTOMER', 'SELLER', 'STAFF', 'SYSTEM');

-- DropForeignKey
ALTER TABLE "seller_verification_document" DROP CONSTRAINT "seller_verification_document_sellerApplicationId_fkey";

-- AlterTable
ALTER TABLE "stock_movement" ADD COLUMN     "idempotencyKey" TEXT;

-- Convert the existing free text author type to the new enum without dropping values.
ALTER TABLE "support_message"
  ALTER COLUMN "authorType" TYPE "SupportAuthorType"
  USING ("authorType"::"SupportAuthorType");

-- CreateIndex
CREATE UNIQUE INDEX "shipment_orderId_shopId_key" ON "shipment"("orderId", "shopId");

-- CreateIndex
CREATE UNIQUE INDEX "stock_movement_idempotencyKey_key" ON "stock_movement"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "seller_verification_document" ADD CONSTRAINT "seller_verification_document_sellerApplicationId_fkey" FOREIGN KEY ("sellerApplicationId") REFERENCES "seller_application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Integrity guards from the rereview
-- ---------------------------------------------------------------------------

-- A review rating is a 1 to 5 score.
ALTER TABLE "review"
  ADD CONSTRAINT "review_rating_range_chk"
  CHECK ("rating" >= 1 AND "rating" <= 5);

-- A single line item is fulfilled, cancelled, or returned as a whole. The
-- PARTIALLY_* values describe an order or a shipment, never one item.
ALTER TABLE "order_item"
  ADD CONSTRAINT "order_item_fulfillment_status_item_level_chk"
  CHECK ("fulfillmentStatus" NOT IN ('PARTIALLY_FULFILLED', 'PARTIALLY_CANCELLED', 'PARTIALLY_RETURNED'));

-- A resolved COD record needs a resolver, a reason, and evidence. D-32: a
-- shortage closes only by an explicit, reasoned, evidenced, audited adjustment.
ALTER TABLE "cod_reconciliation_record"
  ADD CONSTRAINT "cod_reconciliation_resolved_attribution_chk"
  CHECK (
    "status" <> 'RESOLVED'
    OR ("resolvedAt" IS NOT NULL AND "resolvedByUserId" IS NOT NULL AND "reason" IS NOT NULL AND "evidenceRef" IS NOT NULL)
  );

-- Payout batches are approved by a person, with a reason and a timestamp.
ALTER TABLE "payout_batch"
  ADD CONSTRAINT "payout_batch_approval_attribution_chk"
  CHECK (
    "status" NOT IN ('APPROVED', 'PROCESSING', 'COMPLETED', 'PARTIAL')
    OR ("approvedByUserId" IS NOT NULL AND "approvedAt" IS NOT NULL AND "approvalReason" IS NOT NULL)
  );

-- Refunds are approved by a person, and a completed refund records how the
-- money left (gateway reference or a manual transaction reference).
ALTER TABLE "refund"
  ADD CONSTRAINT "refund_approval_attribution_chk"
  CHECK (
    "status" NOT IN ('APPROVED', 'PROCESSING', 'COMPLETED')
    OR ("approvedByUserId" IS NOT NULL AND "approvedAt" IS NOT NULL)
  ),
  ADD CONSTRAINT "refund_completed_reference_chk"
  CHECK (
    "status" <> 'COMPLETED'
    OR "providerReference" IS NOT NULL
    OR "transactionReference" IS NOT NULL
  );

-- A paid payout item records the transfer reference.
ALTER TABLE "payout_item"
  ADD CONSTRAINT "payout_item_paid_reference_chk"
  CHECK ("status" <> 'PAID' OR "transactionReference" IS NOT NULL);

-- One default saved address per user.
CREATE UNIQUE INDEX "saved_address_user_default_unique_idx"
  ON "saved_address" ("userId")
  WHERE "isDefault";

-- One default stock location per shop, and one platform default.
CREATE UNIQUE INDEX "stock_location_shop_default_unique_idx"
  ON "stock_location" ("shopId")
  WHERE "isDefault" AND "shopId" IS NOT NULL;

CREATE UNIQUE INDEX "stock_location_platform_default_unique_idx"
  ON "stock_location" ((true))
  WHERE "isDefault" AND "shopId" IS NULL;

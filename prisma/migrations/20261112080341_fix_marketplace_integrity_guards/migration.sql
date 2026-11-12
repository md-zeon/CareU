-- DropForeignKey
ALTER TABLE "payment_event" DROP CONSTRAINT "payment_event_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "stock_location" DROP CONSTRAINT "stock_location_shopId_fkey";

-- AddForeignKey
ALTER TABLE "stock_location" ADD CONSTRAINT "stock_location_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_event" ADD CONSTRAINT "payment_event_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Integrity guards corrected after review 2026-11-12
-- ---------------------------------------------------------------------------

-- The prior split check ended with `OR "discountPoisha" >= 0`, which made it a
-- no op because non negativity is already enforced by order_discount_nonneg_chk.
ALTER TABLE "order" DROP CONSTRAINT "order_discount_split_chk";

ALTER TABLE "order"
  ADD CONSTRAINT "order_discount_split_chk"
  CHECK ("careuFundedDiscountPoisha" + "sellerFundedDiscountPoisha" <= "discountPoisha");

ALTER TABLE "order_item"
  ADD CONSTRAINT "order_item_discount_split_chk"
  CHECK ("careuFundedDiscountPoisha" + "sellerFundedDiscountPoisha" <= "discountPoisha");

-- Commission rates are percentages in basis points, so 0 to 10000 is the full range.
ALTER TABLE "commission_rule"
  ADD CONSTRAINT "commission_rule_rate_bps_range_chk"
  CHECK ("rateBps" >= 0 AND "rateBps" <= 10000),
  ADD CONSTRAINT "commission_rule_category_scope_chk"
  CHECK ("scopeType" <> 'category' OR "categoryId" IS NOT NULL);

ALTER TABLE "order_item" DROP CONSTRAINT "order_item_commission_rate_nonneg_chk";

ALTER TABLE "order_item"
  ADD CONSTRAINT "order_item_commission_rate_range_chk"
  CHECK ("commissionRateBps" IS NULL OR ("commissionRateBps" >= 0 AND "commissionRateBps" <= 10000));

-- A dispute must be anchored to an order, shipment, or item so eligibility can
-- be scoped to the affected seller rather than guessed from free text.
ALTER TABLE "dispute"
  ADD CONSTRAINT "dispute_scope_present_chk"
  CHECK ("orderId" IS NOT NULL OR "shipmentId" IS NOT NULL OR "orderItemId" IS NOT NULL);

-- One review per purchased product. A review of a shared product carries
-- productId and is unique per user and product. A standalone listing has no
-- productId, so the listing itself is the product scope. The existing
-- (userId, orderItemId) key still prevents reviewing the same purchase twice.
CREATE UNIQUE INDEX "review_user_product_unique_idx"
  ON "review" ("userId", "productId")
  WHERE "productId" IS NOT NULL;

CREATE UNIQUE INDEX "review_user_listing_unique_idx"
  ON "review" ("userId", "listingId")
  WHERE "productId" IS NULL AND "listingId" IS NOT NULL;


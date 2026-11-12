/**
 * Marketplace domain model (spec 0001) schema contract tests.
 *
 * Locks in the durable, automatable parts of the corrected domain model:
 * money storage, snapshot fields, status separation, append-only/idempotency
 * anchors, scope anchors, and key integrity constraints reflected in the
 * schema. Traceability: AC-N comments/sections map to spec 0001.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

function readSchema(file: string): string {
  return readFileSync(resolve(process.cwd(), "prisma/schema", file), "utf8");
}

function readMigrationsSql(): string {
  const dir = resolve(process.cwd(), "prisma/migrations");
  return (readdirSync(dir, { recursive: true }) as string[])
    .filter((entry) => entry.endsWith(".sql"))
    .sort()
    .map((entry) => readFileSync(resolve(dir, entry), "utf8"))
    .join("\n");
}

function lastConstraint(sql: string, name: string): string {
  const pattern = new RegExp(`ADD CONSTRAINT "${name}"\\s+CHECK \\(([\\s\\S]*?)\\);`, "g");
  let body: string | undefined;
  for (const match of sql.matchAll(pattern)) body = match[1];
  assert.ok(body, `Expected CHECK constraint ${name} to be added by a migration`);
  return body;
}

function lastForeignKey(sql: string, name: string): string {
  const pattern = new RegExp(`ADD CONSTRAINT "${name}"\\s+FOREIGN KEY[\\s\\S]*?;`, "g");
  let body: string | undefined;
  for (const match of sql.matchAll(pattern)) body = match[0];
  assert.ok(body, `Expected FOREIGN KEY ${name} to be added by a migration`);
  return body;
}

function modelBlock(schema: string, model: string): string {
  const re = new RegExp(`model\\s+${model}\\s*\\{([\\s\\S]*?)\\n\\}`, "m");
  const m = schema.match(re);
  assert.ok(m, `Expected model ${model} to exist`);
  return m[1];
}

function hasToken(block: string, token: string): boolean {
  return block.includes(token);
}

const enums = readSchema("enums.prisma");
const seller = readSchema("seller.prisma");
const catalog = readSchema("catalog.prisma");
const order = readSchema("order.prisma");
const inventory = readSchema("inventory.prisma");
const customer = readSchema("customer.prisma");
const payment = readSchema("payment.prisma");
const trust = readSchema("trust.prisma");
const auth = readSchema("auth.prisma");
const all = [enums, seller, catalog, order, inventory, customer, payment, trust, auth].join("\n");
const migrations = readMigrationsSql();

describe("Marketplace domain model schema contract (spec 0001, corrected)", () => {
  test("AC-1: seller applications, verification documents, shops, and shop membership", () => {
    assert.match(enums, /enum\s+SellerApplicationType/);
    assert.match(enums, /INDIVIDUAL/);
    assert.match(enums, /BUSINESS/);
    assert.match(enums, /enum\s+SellerApplicationStatus/);
    assert.doesNotMatch(enums, /\bRESUBMITTED\b/);
    assert.match(enums, /enum\s+ShopStatus[\s\S]*PENDING[\s\S]*ACTIVE[\s\S]*PAUSED[\s\S]*SUSPENDED/);

    const app = modelBlock(seller, "SellerApplication");
    assert.ok(hasToken(app, "applicantUserId"));
    assert.ok(hasToken(app, "reviewedByUserId"));
    assert.ok(hasToken(app, "type") && hasToken(app, "SellerApplicationType"));
    assert.ok(hasToken(app, "status") && hasToken(app, "SellerApplicationStatus"));

    const doc = modelBlock(seller, "SellerVerificationDocument");
    assert.ok(hasToken(doc, "storageKey"));
    assert.ok(hasToken(doc, "sellerApplicationId"));

    const shop = modelBlock(seller, "Shop");
    assert.ok(hasToken(shop, "isFirstParty") && hasToken(shop, "Boolean"));
    assert.ok(hasToken(shop, "isTrusted") && hasToken(shop, "Boolean"));
    assert.ok(hasToken(shop, "status") && hasToken(shop, "ShopStatus") && hasToken(shop, "@default(PENDING)"));
    assert.ok(hasToken(shop, "@@unique([ownerUserId])"));

    const mem = modelBlock(seller, "ShopMembership");
    assert.ok(hasToken(mem, "@@unique([shopId, userId])"));
  });

  test("AC-2: shared catalog and seller owned sellable offers", () => {
    const category = modelBlock(catalog, "Category");
    assert.ok(hasToken(category, "parentId"));
    assert.ok(hasToken(category, "isRestricted"));
    assert.ok(hasToken(category, "isProhibited"));
    assert.match(catalog, /model\s+CategoryAttribute/);
    assert.match(catalog, /model\s+Product/);
    assert.match(catalog, /model\s+ProductVariant/);

    const listing = modelBlock(catalog, "Listing");
    assert.ok(hasToken(listing, "shopId"));
    assert.ok(hasToken(listing, "productId") && hasToken(listing, "String?"));
    assert.ok(hasToken(listing, "moderationStatus"));
    assert.ok(hasToken(listing, "publishStatus"));

    const variant = modelBlock(catalog, "ListingVariant");
    assert.ok(hasToken(variant, "sku"));
    assert.ok(hasToken(variant, "pricePoisha") && hasToken(variant, "BigInt"));
    assert.ok(hasToken(variant, "compareAtPoisha") && hasToken(variant, "BigInt?"));
    assert.ok(hasToken(variant, "currency"));
    assert.ok(hasToken(variant, "@@unique([listingId, sku])"));
    assert.match(catalog, /model\s+ListingMedia/);
  });

  test("AC-3/AC-6/AC-9: orders, shipments, items keep immutable snapshots and separate statuses in BigInt poisha", () => {
    const ord = modelBlock(order, "Order");
    assert.ok(hasToken(ord, "orderNumber"));
    assert.ok(hasToken(ord, "checkoutIdempotencyKey") && hasToken(ord, "@unique"));
    assert.ok(hasToken(ord, "customerUserId"));
    assert.ok(hasToken(ord, "shippingAddressSnapshot") && hasToken(ord, "Json") && !/\bshippingAddressSnapshot\s+Json\?/.test(ord));
    assert.ok(hasToken(ord, "paymentStatus") && hasToken(ord, "OrderPaymentStatus"));
    assert.ok(hasToken(ord, "fulfillmentStatus") && hasToken(ord, "FulfillmentStatus"));
    for (const f of ["subtotalPoisha", "discountPoisha", "careuFundedDiscountPoisha", "sellerFundedDiscountPoisha", "deliveryPoisha", "taxPoisha", "totalPoisha"]) {
      assert.ok(hasToken(ord, f) && hasToken(ord, "BigInt"), `Order.${f} must be BigInt poisha`);
    }
    assert.ok(hasToken(ord, "fxRateScaled") && hasToken(ord, "BigInt?"));
    assert.ok(hasToken(ord, "fxRateScale"));

    const ship = modelBlock(order, "Shipment");
    assert.ok(hasToken(ship, "orderId"));
    assert.ok(hasToken(ship, "shopId"));
    assert.ok(hasToken(ship, "deliveryChargePoisha") && hasToken(ship, "BigInt"));
    assert.ok(hasToken(ship, "destinationSnapshot"));

    const item = modelBlock(order, "OrderItem");
    for (const f of ["titleSnapshot", "skuSnapshot", "variantSnapshot"]) assert.ok(hasToken(item, f));
    for (const f of [
      "unitPricePoisha",
      "discountPoisha",
      "careuFundedDiscountPoisha",
      "sellerFundedDiscountPoisha",
      "taxPoisha",
      "commissionBasePoisha",
      "commissionPoisha",
      "lineTotalPoisha",
    ]) {
      assert.ok(hasToken(item, f) && hasToken(item, "BigInt"), `OrderItem.${f} must be BigInt poisha`);
    }
    assert.ok(hasToken(item, "commissionRateBps"));
    assert.ok(hasToken(item, "commissionRuleId"));
    assert.doesNotMatch(item, /commissionPoisha\s+BigInt\s+@default\(0\)/);
    assert.ok(hasToken(item, "quantity") && hasToken(item, "Int"));
    assert.ok(hasToken(item, "fulfillmentStatus"));

    assert.match(order, /model\s+OrderStatusHistory/);
    assert.match(order, /model\s+OrderPaymentStatusHistory/);
    assert.match(order, /model\s+ShipmentStatusHistory/);
  });

  test("AC-4: inventory balances, append-only movements, and reservations", () => {
    assert.match(inventory, /model\s+StockLocation/);
    const bal = modelBlock(inventory, "InventoryBalance");
    assert.ok(hasToken(bal, "onHand"));
    assert.ok(hasToken(bal, "reserved"));
    assert.ok(hasToken(bal, "@@unique([listingVariantId, stockLocationId])"));

    const mov = modelBlock(inventory, "StockMovement");
    assert.ok(hasToken(mov, "reason") && hasToken(mov, "StockMovementReason"));
    assert.ok(hasToken(mov, "quantityDelta"));
    assert.ok(hasToken(mov, "referenceType"));
    assert.ok(hasToken(mov, "referenceId"));
    assert.ok(hasToken(mov, "actorUserId"));

    const res = modelBlock(inventory, "StockReservation");
    assert.ok(hasToken(res, "status") && hasToken(res, "StockReservationStatus"));
    assert.ok(hasToken(res, "expiresAt"));
    assert.ok(hasToken(res, "idempotencyKey") && hasToken(res, "@unique"));
  });

  test("AC-5: payments, idempotent events, refunds, and COD reconciliation in BigInt poisha", () => {
    const p = modelBlock(payment, "Payment");
    assert.ok(hasToken(p, "method") && hasToken(p, "PaymentMethod"));
    assert.ok(hasToken(p, "canonicalStatus") && hasToken(p, "PaymentCanonicalStatus"));
    assert.ok(hasToken(p, "amountPoisha") && hasToken(p, "BigInt"));
    assert.ok(hasToken(p, "idempotencyKey"));
    assert.ok(hasToken(p, "@@unique([provider, providerReference])"));

    const ev = modelBlock(payment, "PaymentEvent");
    assert.ok(hasToken(ev, "eventKey") && hasToken(ev, "@unique"));
    assert.ok(hasToken(ev, "verificationStatus"));

    const refund = modelBlock(payment, "Refund");
    assert.ok(hasToken(refund, "amountPoisha") && hasToken(refund, "BigInt"));
    assert.ok(hasToken(refund, "status") && hasToken(refund, "RefundStatus"));
    assert.ok(hasToken(refund, "method") && hasToken(refund, "RefundMethod"));
    assert.ok(hasToken(refund, "idempotencyKey"));

    const cod = modelBlock(payment, "CODReconciliationRecord");
    assert.ok(hasToken(cod, "recordType") && hasToken(cod, "CODReconciliationRecordType"));
    assert.ok(hasToken(cod, "status") && hasToken(cod, "CODReconciliationStatus"));
    assert.ok(hasToken(cod, "amountPoisha") && hasToken(cod, "BigInt"));
    assert.ok(hasToken(cod, "resolvedAt"));
    assert.ok(hasToken(cod, "resolvedByUserId"));
    assert.ok(hasToken(cod, "resolvesRecordId"));
  });

  test("AC-6: append-only financial records, commission anchors, payouts, and first-party boundary", () => {
    assert.match(payment, /model\s+CommissionRule/);
    const ledger = modelBlock(payment, "FinancialLedgerEntry");
    assert.ok(hasToken(ledger, "idempotencyKey"));
    assert.ok(hasToken(ledger, "shopId") && hasToken(ledger, "String?"));
    assert.ok(hasToken(ledger, "amountPoisha") && hasToken(ledger, "BigInt"));
    assert.ok(hasToken(ledger, "currency"));
    assert.ok(hasToken(ledger, "entryType") && hasToken(ledger, "LedgerEntryType"));
    assert.ok(hasToken(ledger, "direction") && hasToken(ledger, "LedgerDirection"));
    assert.ok(hasToken(ledger, "eligibilityStatus") && hasToken(ledger, "LedgerEligibilityStatus"));
    assert.ok(hasToken(ledger, "createdAt") && !hasToken(ledger, "updatedAt"));

    const batch = modelBlock(payment, "PayoutBatch");
    assert.ok(hasToken(batch, "totalAmountPoisha") && hasToken(batch, "BigInt"));
    assert.ok(hasToken(batch, "approvedByUserId"));
    assert.ok(hasToken(batch, "approvalReason"));

    const item = modelBlock(payment, "PayoutItem");
    assert.ok(hasToken(item, "amountPoisha") && hasToken(item, "BigInt"));
    assert.ok(hasToken(item, "method"));
    assert.ok(hasToken(item, "destinationRef"));
    assert.ok(hasToken(item, "idempotencyKey"));

    const shop = modelBlock(seller, "Shop");
    assert.ok(hasToken(shop, "isFirstParty"));
  });

  test("AC-7: reviews, support, disputes, notifications, and audit logs with history anchors", () => {
    const review = modelBlock(trust, "Review");
    assert.ok(hasToken(review, "userId"));
    assert.ok(hasToken(review, "orderItemId"));
    assert.ok(hasToken(review, "listingId") || hasToken(review, "productId"));
    assert.ok(hasToken(review, "rating"));

    const sc = modelBlock(trust, "SupportCase");
    assert.ok(hasToken(sc, "@@index([assigneeUserId, status])"));
    assert.match(trust, /model\s+SupportCaseStatusHistory/);

    const msg = modelBlock(trust, "SupportMessage");
    assert.ok(hasToken(msg, "visibility") && hasToken(msg, "SupportMessageVisibility"));

    const dispute = modelBlock(trust, "Dispute");
    assert.ok(hasToken(dispute, "shopId"));
    assert.ok(hasToken(dispute, "moneyImpactPoisha") && hasToken(dispute, "BigInt?"));
    assert.ok(hasToken(dispute, "resolvedByUserId"));

    assert.match(trust, /model\s+NotificationStatusHistory/);
    const audit = modelBlock(trust, "AuditLog");
    assert.ok(hasToken(audit, "actorUserId"));
    assert.ok(hasToken(audit, "entityType"));
    assert.ok(hasToken(audit, "entityId"));
    assert.ok(!hasToken(audit, "updatedAt"));
  });

  test("AC-8: ownership/scope anchors, persisted addresses and wishlist, and no cart table", () => {
    const ord = modelBlock(order, "Order");
    assert.ok(hasToken(ord, "customerUserId"));
    assert.match(customer, /model\s+SavedAddress/);
    assert.match(customer, /model\s+Wishlist/);
    assert.match(customer, /model\s+WishlistItem/);
    assert.doesNotMatch(all, /^model\s+Cart\b/m);
    assert.ok(modelBlock(seller, "ShopMembership").includes("shopId"));
    assert.ok(modelBlock(catalog, "Listing").includes("shopId"));
    assert.ok(modelBlock(order, "Shipment").includes("shopId"));
    assert.ok(modelBlock(payment, "FinancialLedgerEntry").includes("shopId"));
  });

  test("AC-9: per-shop/per-item granularity and scoped money/trust records", () => {
    assert.match(order, /model\s+Shipment/);
    assert.ok(modelBlock(order, "Shipment").includes("shopId"));
    assert.ok(modelBlock(order, "OrderItem").includes("shipmentId"));
    assert.match(enums, /PARTIALLY_FULFILLED/);
    assert.match(enums, /PARTIALLY_CANCELLED/);
    assert.match(enums, /PARTIALLY_RETURNED/);

    const refund = modelBlock(payment, "Refund");
    assert.ok(hasToken(refund, "shipmentId"));
    assert.ok(hasToken(refund, "orderItemId"));
    const dispute = modelBlock(trust, "Dispute");
    assert.ok(hasToken(dispute, "orderItemId"));
    assert.ok(hasToken(dispute, "shipmentId"));
    const ledger = modelBlock(payment, "FinancialLedgerEntry");
    assert.ok(hasToken(ledger, "orderItemId"));
    assert.ok(hasToken(ledger, "shipmentId"));
  });

  test("Integrity and safety anchors reflected in schema", () => {
    // No destructive cascade from order history/financial records to core order/payment/refund graph
    assert.match(order, /order\s+Order[\s\S]*onDelete:\s*Restrict/);
    assert.match(order, /shipment\s+Shipment[\s\S]*onDelete:\s*Restrict/);
    assert.match(payment, /order\s+Order[\s\S]*onDelete:\s*Restrict/);
    assert.match(payment, /refund\s+Refund\?[\s\S]*onDelete:\s*Restrict/);
    assert.match(payment, /payment\s+Payment\?[\s\S]*onDelete:\s*Restrict/);

    assert.match(enums, /enum\s+LedgerDirection/);
    assert.match(enums, /enum\s+LedgerEntryType/);
    assert.match(enums, /enum\s+RefundMethod/);
    assert.match(enums, /enum\s+DeliveryAssigneeType/);
    assert.ok(modelBlock(inventory, "StockMovement").includes("referenceType"));
  });

  test("Database migration enforces the guards the Prisma schema cannot express", () => {
    // The discount split must actually be enforced, not bypassed by a trailing OR.
    const orderSplit = lastConstraint(migrations, "order_discount_split_chk");
    assert.ok(orderSplit.includes("careuFundedDiscountPoisha"));
    assert.ok(orderSplit.includes("sellerFundedDiscountPoisha"));
    assert.ok(orderSplit.includes("<="));
    assert.doesNotMatch(orderSplit, /OR\s+"discountPoisha"\s*>=\s*0/i);

    const itemSplit = lastConstraint(migrations, "order_item_discount_split_chk");
    assert.ok(itemSplit.includes("careuFundedDiscountPoisha"));
    assert.ok(itemSplit.includes("sellerFundedDiscountPoisha"));
    assert.ok(itemSplit.includes("<="));

    // Commission rates are percentages in basis points.
    assert.match(lastConstraint(migrations, "commission_rule_rate_bps_range_chk"), /<= 10000/);
    assert.match(lastConstraint(migrations, "commission_rule_rate_bps_range_chk"), />= 0/);
    assert.match(lastConstraint(migrations, "order_item_commission_rate_range_chk"), /<= 10000/);
    assert.match(migrations, /"commission_rule_category_scope_chk"[\s\S]*?CHECK \("scopeType" <> 'category' OR "categoryId" IS NOT NULL\)/);

    // A dispute must be anchored to an order, shipment, or item.
    const disputeScope = lastConstraint(migrations, "dispute_scope_present_chk");
    for (const key of ["orderId", "shipmentId", "orderItemId"]) {
      assert.ok(disputeScope.includes(key), `dispute scope check must require ${key}`);
    }

    // One review per purchased product; a standalone listing is its own product scope.
    assert.match(migrations, /CREATE UNIQUE INDEX "review_user_product_unique_idx"[\s\S]*?"userId", "productId"[\s\S]*?WHERE "productId" IS NOT NULL/);
    assert.match(migrations, /CREATE UNIQUE INDEX "review_user_listing_unique_idx"[\s\S]*?"userId", "listingId"[\s\S]*?WHERE "productId" IS NULL/);

    // Deleting a shop must not reclassify its stock location as platform stock.
    assert.match(lastForeignKey(migrations, "stock_location_shopId_fkey"), /ON DELETE RESTRICT/);
    // Verified callback history must not detach from its payment.
    assert.match(lastForeignKey(migrations, "payment_event_paymentId_fkey"), /ON DELETE RESTRICT/);

    // Earlier guards stay in place.
    assert.match(migrations, /CREATE UNIQUE INDEX "shop_single_first_party_idx" ON "shop" \("isFirstParty"\) WHERE "isFirstParty" = true/);
    assert.match(migrations, /"wishlist_item_target_present_chk"[\s\S]*?CHECK \("listingId" IS NOT NULL OR "listingVariantId" IS NOT NULL\)/);
    assert.match(migrations, /CREATE UNIQUE INDEX "wishlist_item_wishlist_listing_unique_idx"/);
    assert.match(migrations, /CREATE UNIQUE INDEX "wishlist_item_wishlist_listing_variant_unique_idx"/);
    assert.match(migrations, /"review_target_present_chk"[\s\S]*?CHECK \("listingId" IS NOT NULL OR "productId" IS NOT NULL\)/);
    for (const name of [
      "order_total_nonneg_chk",
      "order_item_commission_nonneg_chk",
      "payment_amount_nonneg_chk",
      "refund_amount_nonneg_chk",
      "inventory_balance_on_hand_nonneg_chk",
    ]) {
      assert.ok(lastConstraint(migrations, name).includes(">= 0"), `${name} must reject negative amounts`);
    }
  });

  test("Integrity top up after the 2026-11-12 rereview", () => {
    // A review rating is a 1 to 5 score, not a free integer.
    const rating = lastConstraint(migrations, "review_rating_range_chk");
    assert.match(rating, />=\s*1/);
    assert.match(rating, /<=\s*5/);

    // A single line item cannot be partially fulfilled, cancelled, or returned.
    const itemStatus = lastConstraint(migrations, "order_item_fulfillment_status_item_level_chk");
    for (const value of ["PARTIALLY_FULFILLED", "PARTIALLY_CANCELLED", "PARTIALLY_RETURNED"]) {
      assert.ok(itemStatus.includes(`'${value}'`), `item level status check must exclude ${value}`);
    }

    // One seller specific shipment per shop in an order.
    assert.match(
      migrations,
      /CREATE UNIQUE INDEX "shipment_orderId_shopId_key" ON "shipment"\s*\("orderId",\s*"shopId"\)/,
    );
    assert.ok(modelBlock(order, "Shipment").includes("@@unique([orderId, shopId])"));

    // Terminal money states must carry their attribution.
    const codAttribution = lastConstraint(migrations, "cod_reconciliation_resolved_attribution_chk");
    for (const field of ["resolvedAt", "resolvedByUserId", "reason", "evidenceRef"]) {
      assert.ok(codAttribution.includes(field), `COD resolution must require ${field}`);
    }

    const batchApproval = lastConstraint(migrations, "payout_batch_approval_attribution_chk");
    for (const field of ["approvedByUserId", "approvedAt", "approvalReason"]) {
      assert.ok(batchApproval.includes(field), `payout approval must require ${field}`);
    }

    const refundApproval = lastConstraint(migrations, "refund_approval_attribution_chk");
    for (const field of ["approvedByUserId", "approvedAt"]) {
      assert.ok(refundApproval.includes(field), `refund approval must require ${field}`);
    }

    const refundReference = lastConstraint(migrations, "refund_completed_reference_chk");
    assert.match(refundReference, /providerReference/);
    assert.match(refundReference, /transactionReference/);
    assert.match(lastConstraint(migrations, "payout_item_paid_reference_chk"), /transactionReference/);

    // Verification documents are compliance records, so a parent delete cannot cascade them away.
    assert.match(
      lastForeignKey(migrations, "seller_verification_document_sellerApplicationId_fkey"),
      /ON DELETE RESTRICT/,
    );
    assert.match(
      modelBlock(seller, "SellerVerificationDocument"),
      /sellerApplication\s+SellerApplication[\s\S]*?onDelete:\s*Restrict/,
    );

    // Stock movements carry a dedupe anchor like the other financial records.
    assert.ok(modelBlock(inventory, "StockMovement").includes("idempotencyKey"));
    assert.match(
      migrations,
      /CREATE UNIQUE INDEX "stock_movement_idempotencyKey_key" ON "stock_movement"\s*\("idempotencyKey"\)/,
    );

    // One default address per user and one default location per stock scope.
    assert.match(
      migrations,
      /CREATE UNIQUE INDEX "saved_address_user_default_unique_idx"\s+ON "saved_address"\s*\("userId"\)\s+WHERE "isDefault"/,
    );
    assert.match(
      migrations,
      /CREATE UNIQUE INDEX "stock_location_shop_default_unique_idx"\s+ON "stock_location"\s*\("shopId"\)\s+WHERE "isDefault" AND "shopId" IS NOT NULL/,
    );
    assert.match(migrations, /CREATE UNIQUE INDEX "stock_location_platform_default_unique_idx"/);

    // Support message authorship is a typed role, not a free string.
    assert.match(enums, /enum\s+SupportAuthorType/);
    assert.match(modelBlock(trust, "SupportMessage"), /authorType\s+SupportAuthorType/);
  });
});

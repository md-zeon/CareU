# Verify: Marketplace domain model · spec 0001 · updated 2026-11-12
_Steps derived from spec 0001 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [x] Inspect `prisma/schema/enums.prisma` and `prisma/schema/seller.prisma`: confirm `SellerApplication` (individual/business type, status, applicant/reviewer refs), `SellerVerificationDocument` (private `storageKey`), `Shop` (`isFirstParty`, status, `isTrusted`, `@@unique([ownerUserId])`), and `ShopMembership` (`@@unique([shopId, userId])`) exist with ownership fields → AC-1, AC-8
- [x] Inspect catalog models: `Category` tree (`parentId`), `CategoryAttribute`, `Product`, optional `ProductVariant`, `Listing` with nullable `productId` for standalone offers, `ListingVariant` with seller owned `sku`/`pricePoisha` BigInt/`currency`/status, and `ListingMedia` public refs exist → AC-2
- [x] Inspect order models: parent `Order` has separate `paymentStatus` and `fulfillmentStatus`, immutable `BIGINT` poisha snapshots (including discount funding/allocation totals and fx fields/scale); `Shipment` is per shop with `deliveryChargePoisha` and destination snapshot; `OrderItem` carries title/SKU/variant/price/qty/discount funding/allocation/commission rate-base-amount/tax/line snapshots and links to order, shipment, shop, listing, variant; fulfillment and payment status history tables exist → AC-3, AC-6, AC-8, AC-9
- [x] Inspect inventory and customer models: `StockLocation`, `InventoryBalance` (`onHand`, `reserved`, `@@unique([listingVariantId, stockLocationId])`), append only `StockMovement` with reason/delta/reference/actor, `StockReservation` with status/expiry/idempotency key, `SavedAddress`, `Wishlist`/`WishlistItem` exist and no cart table is present → AC-4, AC-8
- [x] Inspect payment/money models: `Payment` with method/provider/canonical status/`BIGINT` amount and idempotency anchors, append only `PaymentEvent` with unique `eventKey`, `Refund` with method/status/`BIGINT` amount and idempotency anchor, `CODReconciliationRecord` with open/resolved status, resolution linkage/attribution and record types, append only `FinancialLedgerEntry` with currency and typed direction/entry/eligibility in `BIGINT` poisha, `CommissionRule`, `PayoutBatch`/`PayoutItem` with approval and payout destination fields exist → AC-5, AC-6, AC-9
- [x] Inspect trust/operations models: `Review` (purchase-linked target, uniqueness per purchased product, and target validity constraints), `SupportCase`/`SupportMessage` with `authorType` (typed role), `visibility` (customer/internal), and support case status history, `Dispute` scoped to shop/order/shipment/item with evidence/resolution and resolver attribution, `Notification` with channel/status and status history, append only `AuditLog` with actor/action/entity/shop refs exist → AC-7, AC-8, AC-9
- [x] Confirm first party separation is representable: `Shop.isFirstParty` exists and financial posting can be scoped so first party sales create no third party seller commission, seller balance, or payout liability entries (supported by `Shop.isFirstParty`; enforced and audited in financial posting logic, which must skip those entries for first party sales) → AC-6
- [x] Confirm the database enforces the guards the schema cannot express: the order and order item discount split checks reject a funding split larger than the discount, commission rates are bounded to 0 through 10000 basis points, a dispute requires an order, shipment, or item, a review is unique per purchased product, deleting a shop cannot null a stock location, and callback history cannot detach from its payment (migration `20261112080341_fix_marketplace_integrity_guards`); review ratings are 1 through 5, a line item cannot carry a partial state, a shipment is unique per shop in an order, resolved COD records and approved payouts and refunds carry their attribution, completed refunds and paid payout items carry a transfer reference, a seller verification document cannot cascade away from its application, and defaults are unique per user and per stock scope (migration `20261112101500_marketplace_integrity_topup`) → AC-3, AC-5, AC-6, AC-7, AC-9
- [x] Confirm scope anchors exist on protected records (examples: customerUserId on Order/SavedAddress/Wishlist/SupportCase, shopId on Shop/Listing/Shipment/OrderItem/Dispute/PayoutItem, actor refs on histories/movements/audit/ledger) → AC-8

## Commands
- [x] `npx prisma validate` → schema valid → AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9
- [x] `npx prisma migrate status` → database schema is up to date (includes `20261112074041_marketplace_domain_model`, `20261112080341_fix_marketplace_integrity_guards`, and `20261112101500_marketplace_integrity_topup`) → AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9
- [x] `npx prisma generate` → client generated from current schema without errors → AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9

## Acceptance-criteria coverage
- AC-1 covered by identity/shop schema inspection steps
- AC-2 covered by catalog/listing schema inspection steps
- AC-3 covered by order/fulfillment schema inspection steps
- AC-4 covered by inventory/reservation schema inspection steps
- AC-5 covered by payment/reconciliation schema inspection steps
- AC-6 covered by money/settlement schema inspection and first party separation step
- AC-7 covered by trust/operations schema inspection steps
- AC-8 covered by scope anchor, persisted customer data, and ownership inspection steps
- AC-9 covered by per shop/item granularity, partial status support, and scoped money/trust record inspection steps

## Value sourcing checks
- [x] Checkout reserve/place: buyer and selected sellable items come from trusted server session plus DB validated listing variant IDs/quantities, not client role/shop flags → AC-8
- [x] Checkout reserve/place: unit price, title, SKU, variant, shop, and line totals are read/computed server side from current listing data and snapshotted onto `OrderItem` → AC-3
- [x] Checkout reserve/place: delivery charge, tax, discount, commission snapshots are computed by server rules/config and snapshotted on `Shipment`/`OrderItem`/`Order` → AC-3, AC-6
- [x] Checkout reserve/place: stock location for each reservation is server selected and recorded as `stockLocationId` on `StockReservation` and resulting `StockMovement` → AC-4
- [x] Checkout reserve/place: reservation expiry comes from server configuration and is recorded on `StockReservation.expiresAt` → AC-4
- [x] Payment callback/reconcile: canonical payment status transition comes from verified provider event mapped by provider independent layer into `PaymentEvent` and `Payment.canonicalStatus` → AC-5
- [x] Payment callback/reconcile: idempotency/deduplication key is provider event identifier or derived stable key stored unique on `PaymentEvent.eventKey` → AC-5
- [x] Inventory movement/adjustment: quantity delta and balance effect come from operation input plus current balance applied atomically and recorded in `StockMovement` with reason/reference → AC-4
- [x] Inventory movement/adjustment: actor and reason for sensitive adjustments come from trusted server session/actor context and required reason input stored on movement/audit records → AC-4, AC-8
- [x] Financial posting/eligibility: earning/commission/payout amounts in poisha come from snapshotted order/refund/settlement inputs and rules posted as append only `FinancialLedgerEntry` → AC-6
- [x] Financial posting/eligibility: first party exclusion is derived from `Shop.isFirstParty`; first party sales produce no seller commission/balance/payout liability entries → AC-6
- [x] Financial posting/eligibility: eligibility blocked scope is derived from dispute/return/refund state scoped to affected shipment/item/seller order context, not unrelated sellers → AC-9

## Known gaps deferred to owning slices
- Review uniqueness per purchased product relies on the application populating `productId` when a listing belongs to a shared product. A required resolution column or a trigger lands with the review feature.
- Cross row agreement is not enforced by composite foreign keys yet: `OrderItem` against `Shipment` order and shop, and `ListingMedia` variant against its listing. Composite keys land with checkout and fulfilment.
- `CommissionRule.scopeType` stays a free string until commission scoping policy is decided; a category scoped rule already requires `categoryId`.
- `InventoryBalance` is the authoritative on hand value. `StockMovement` carries an optional `idempotencyKey`; posting must stay transactional with the balance update.
- Constraint behaviour is asserted as SQL text in the contract test. Database backed rejection checks land with the T3 to T7 gates.

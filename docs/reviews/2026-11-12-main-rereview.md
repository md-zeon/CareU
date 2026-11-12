# Review, main, 2026-11-12 (rereview)

**Reviewed by**: opencode/glm-5.3-flash-free (author on opencode/big-pickle)
**Scope**: 17 files, uncommitted
**Verdict**: Approve with nits

## Summary

This rereview checked whether every finding from the two earlier reviews was actually fixed and looked for what they missed. The rework is real: the discount split check no longer carries the `OR` escape clause, the item level split check exists, commission rates are bounded, disputes must be anchored, review uniqueness now targets the purchased product, the stock location and payment event links are `Restrict`, and the contract test now reads the migrations and pins the corrected guards. Schema validates, the database is up to date and drift free, and the suite passes with only the intentionally pending T2 to T7 skips. What remains is a set of smaller integrity gaps the earlier reviews did not catch or did not finish, none of which blocks this foundation.

## Verification performed

- `npx prisma validate`: schemas valid.
- `npx prisma migrate status`: database schema is up to date with all three migrations.
- `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema`: no difference detected, so the live database matches the schema.
- `npm run test`: 48 tests, 37 pass, 11 skipped. The skips are exactly the pending T2 to T7 gate stubs and the intentional T1 skip count rules are respected.
- `npm run typecheck`: clean.

## Prior review findings, checked

All five majors from the two earlier reviews are fixed:

- Broken `order_discount_split_chk` (rework review): migration `20261112080341` drops the vacuous constraint and re-adds it without the `OR`, and adds `order_item_discount_split_chk`. The contract test asserts the fixed expression and rejects the old escape clause (tests/marketplace-domain-model.test.ts:312 to 323).
- Review uniqueness per order item (rework review): two partial unique indexes now enforce one review per user per product, and one per user per listing for standalone listings. One residual gap is noted below as a minor.
- Untested migration guards (rework review): the test now reads every migration file and asserts the first party index, wishlist guards, review target check, foreign key delete actions, and the money and quantity checks, including taking the last definition when a migration supersedes an earlier one.
- All minors from the rework review (commission bounds, dispute scope, stock location `SetNull`, `verify.md` wording) are fixed.
- Carried over minors from the first review were also closed: payment status history, support case status history, notification status history, payout item destination and batch approval fields, ledger currency, ledger and method enums, refund and payout and checkout idempotency, money and quantity checks, the missing indexes, the single first party shop index, and the `PENDING` shop default.

Two minors from the first review were left unaddressed and are re raised below (item level partial fulfillment states, cross row agreement), plus the `StockMovement` dedupe suggestion.

## Minor

### 🟡 Review rating has no range check, `prisma/schema/trust.prisma:13`

**Problem**: `Review.rating` is a bare `Int`. The migration guard section covers money and quantities but never bounds the rating, so a 0 or a 999 is a valid row.

**Why it matters**: ratings feed product pages and seller trust. One bad write distorts an average and nothing in the database objects.

**Suggested fix**: add a check constraint in the migration, for example `CHECK ("rating" BETWEEN 1 AND 5)`, alongside the existing money checks, and assert it in the contract test.

### 🟡 Per product review uniqueness depends on convention, `prisma/migrations/20261112080341_fix_marketplace_integrity_guards/migration.sql:48`

**Problem**: the new per product index applies only `WHERE "productId" IS NOT NULL`, and the target check only requires listingId or productId. A review of a listing that belongs to a shared product can legally carry only `listingId`. That row escapes the per product index and lands in the per listing index, so a repeat buyer who buys the same product through a different seller listing can still post a second review.

**Why it matters**: the spec promise is one review per eligible purchased product. The guarantee now rests on the application always populating `productId` when the listing links to one. The migration comment records the convention, but a convention is not a guard, which is the exact weakness the rework review flagged in the old design.

**Suggested fix**: document the rule as an application invariant where listing code will live, and plan a stronger enforcement (a later trigger or a required resolution column) when the review feature is built. Optionally note it in `verify.md` so the claim stays accurate.

### 🟡 Item level fulfillment status allows order level partial states, `prisma/schema/order.prisma:108`

**Problem**: `OrderItem.fulfillmentStatus` uses the shared `FulfillmentStatus` enum, which still contains `PARTIALLY_FULFILLED`, `PARTIALLY_CANCELLED` and `PARTIALLY_RETURNED`. A single item cannot be partially fulfilled, so those values are unrepresentable at item level and only invite drift. The first review raised this and it was never addressed; the refund axis duplication inside the enum was fixed, but this half was not.

**Why it matters**: invalid rows are representable today, and later checkout and fulfillment code will have to guess which states are legal per level.

**Suggested fix**: either introduce a dedicated item status enum without the partial values, or record a documented restriction that item level rows use only the single item states. Add a schema test once decided.

### 🟡 Related rows can disagree about order and shop, `prisma/schema/order.prisma:80`

**Problem**: `OrderItem.orderId` vs `Shipment.orderId`, `OrderItem.shopId` vs `Listing.shopId`, and `ListingMedia.listingVariantId` vs `Listing.listingId` (catalog.prisma:142) are all unchecked pairs. Nothing in the schema stops an item row pointing at a shipment from a different order, or a media row pointing at a variant from a different listing. The first review raised the shop drift half; it was not addressed.

**Why it matters**: seller commission, payout eligibility and shop scoped authorization all key off `shopId` and the order chain. A mismatched write attributes a sale to the wrong seller, which is the accounting boundary this model exists to protect.

**Suggested fix**: enforce agreement with composite foreign keys (for example unique `(id, orderId)` on shipment, then foreign key `(shipmentId, orderId)`), or state in the spec which field is authoritative and require the checkout transaction to write them together, with a note that a later trigger or composite key should harden it.

### 🟡 Stock movements have no dedupe scheme, `prisma/schema/inventory.prisma:47`

**Problem**: `StockMovement` carries `referenceType` and `referenceId` with a plain non unique index. The first review suggested a uniqueness scheme for repeat protection; it was never added. Every sibling money record got an idempotency anchor in the rework, but the movement log did not.

**Why it matters**: the movement log is append only history of every stock change. A retried adjustment or a replayed sale posting can insert a duplicate movement, and any code that reconciles balance from movements will double apply it.

**Suggested fix**: define and record the dedupe rule now, for example a partial unique index on `(listingVariantId, stockLocationId, reason, referenceType, referenceId)` for the reference carrying reasons, or document explicitly that `InventoryBalance` is authoritative and movements are advisory, and that posting must be transactional with the balance update.

### 🟡 One shipment per shop per order is not anchored, `prisma/schema/order.prisma:73`

**Problem**: the spec and AGENTS describe one seller specific shipment per shop in an order, and delivery charge is snapshotted per shipment. There is no unique constraint on `(orderId, shopId)`, so two shipments for the same shop in one order are representable.

**Why it matters**: duplicate shipments double count delivery charges and split one seller's fulfillment across two records, which complicates per shop money and eligibility later.

**Suggested fix**: if one per shop is the rule, add a unique index on `(orderId, shopId)` in the migration and pin it in the contract test. If multiple shipments per shop will ever be allowed (split delivery), record that decision in the spec so the structure reads as intentional.

### 🟡 Terminal states do not require their attribution fields, `prisma/schema/payment.prisma:200`

**Problem**: the rework added `resolvedAt` and `resolvedByUserId` to `CODReconciliationRecord`, and approval fields to `PayoutBatch` and `Refund`, but no constraint ties the state to the attribution. A COD record with status `RESOLVED` and no resolver, a payout batch with status `APPROVED` and no approver, and a refund with status `APPROVED` and no approver are all valid rows.

**Why it matters**: AGENTS requires these actions to be reasoned and audited, and D-32 requires a COD shortage to be closed only by an explicit, attributed adjustment. The fields exist but the database accepts states that defeat them.

**Suggested fix**: add check constraints in the migration, for example `status <> 'RESOLVED' OR ("resolvedAt" IS NOT NULL AND "resolvedByUserId" IS NOT NULL)` for the COD record, and equivalents for the approval states. Add assertions to the contract test.

### 🟡 Deleting a seller application deletes its verification documents, `prisma/schema/seller.prisma:37`

**Problem**: `SellerVerificationDocument.sellerApplication` cascades. Deleting an application silently deletes every verification document row for it.

**Why it matters**: verification documents carry compliance obligations, and the record retention periods for them are a pending policy. AGENTS says not to hard delete rows that carry audit or compliance obligations. The cascade makes that accidental the moment anyone writes an application cleanup.

**Suggested fix**: use `Restrict`, and let retention rules (once decided) drive explicit, audited deletion of aged documents instead.

## Nits

- ⚪ `prisma/schema/trust.prisma:82`, `SupportMessage.authorType` is a free string while every other actor discriminator in this schema is now an enum. Consider a `SupportAuthorType` enum for consistency.
- ⚪ `prisma/schema/customer.prisma:17` and `prisma/schema/inventory.prisma:9`, `isDefault` is a plain boolean on `SavedAddress` and `StockLocation`, so multiple defaults per user or per variant scope are representable. Partial unique indexes would pin one default each.
- ⚪ `prisma/schema/payment.prisma:208`, `CODReconciliationRecord.resolvesRecordId` is unique, which caps one resolution record per shortage. If one adjustment ever needs to close several shortages, the model cannot express it. Document the one to one choice or drop the unique.
- ⚪ `prisma/schema/payment.prisma:87`, `CommissionRule.scopeType` remains a free string outside the one check for `'category'`. An enum or a whitelist check would keep configuration typos out.
- ⚪ `docs/scope/scope.md:77`, the fresh model review checkbox is ticked while this rereview is still in progress. Tick it only after the review round actually closes.

## Strengths

- The rework genuinely closed every blocker and major from both earlier reviews, and the fixes are structural, not cosmetic: the split check is enforced at order and item level, review uniqueness targets the purchased product, and the migration guards are now watched by tests that would have caught the original vacuous check.
- The corrective migration pattern is sound: the broken constraint is dropped and re-added rather than edited in place, `migrate status` is clean, and a live database to schema diff reports no drift.
- Money is `BigInt` poisha consistently across schema and migration, financial history is protected by `Restrict` throughout, and every prior documentation claim in `verify.md` now matches what the model actually provides.

## Test coverage

`tests/marketplace-domain-model.test.ts` has 11 tests tracing AC-1 through AC-9 plus an integrity test, and the suite passes with the 11 pending T2 to T7 gate skips, which this milestone does not owe. The contract test improved materially: it reads per model blocks, reads the migrations recursively, and asserts the corrected constraint bodies including the absence of the `OR` escape clause. Remaining gaps, all consistent with the planned DB backed gates: constraint behaviour is asserted as SQL text, not exercised against the database (rejecting a negative amount, a duplicate wishlist row or a second review of the same product), and the gaps raised above (rating range, shipment uniqueness, attribution checks) would each be a one line addition to the existing integrity test.

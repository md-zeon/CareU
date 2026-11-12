# Review, main, 2026-11-12

**Reviewed by**: opencode/big-pickle (author on Iceman)
**Scope**: 17 files, uncommitted
**Verdict**: Changes requested

## Summary

This rework closes the blockers from the earlier review. Money is now `BigInt` poisha everywhere, the order, payment, refund and ledger graph uses `Restrict` instead of destructive cascades, commission snapshots carry rate, base and amount, discount funding is split between CareU and seller, and `Shop` defaults to `PENDING` with a single first party guard. The migration validates, applies, and `prisma migrate diff` reports no drift. Three real gaps remain: the order discount split check is a no op because of a stray `OR`, review uniqueness does not match its own spec, and the strongest new integrity constraints live only in raw SQL with no test watching them.

## Major

### 🟠 The discount split check can never fail, `prisma/migrations/20261112074041_marketplace_domain_model/migration.sql:1618`

**Problem**: the constraint reads `"careuFundedDiscountPoisha" + "sellerFundedDiscountPoisha" <= "discountPoisha" OR "discountPoisha" >= 0`. The second half is already guaranteed by `order_discount_nonneg_chk` on line 1612, so every row passes and the split rule is never enforced. `order_item` has no equivalent check at all (lines 1623 to 1633).

**Why it matters**: the funding split can sum to more than the total discount and nothing in the database notices. Later commission, settlement and refund math reads those snapshots, and the check currently gives false assurance that the split is coherent.

**Suggested fix**: remove the `OR "discountPoisha" >= 0` clause so the check enforces the sum, and add the same check to `order_item`. While this migration is still uncommitted, amend it and rebuild the local database. If it has already reached another environment, add a follow up migration instead of editing applied history.

### 🟠 Review uniqueness is per order item, not per purchased product, `prisma/schema/trust.prisma:22`

**Problem**: the unique key is `@@unique([userId, orderItemId])`. The governing spec says review uniqueness is enforced "per eligible purchased product scope" (`docs/specs/0001-marketplace-domain-model/index.md:98`), and the root context says one review per eligible purchased product. A customer who buys the same product in two separate orders gets two order items and therefore two reviews.

**Why it matters**: repeat purchases can be used to stack reviews on one product, which distorts ratings and weakens the verified purchase promise. If the correct key is added later, existing duplicate rows can make the index creation fail.

**Suggested fix**: decide the review scope (listing or product) and enforce uniqueness on that scope plus `userId`, for example partial unique indexes on (`userId`, `listingId`) and (`userId`, `productId`), or a single resolution column. Add a schema test that pins the key. If per order item is the intended meaning, correct the spec wording instead so the contract and the schema agree.

### 🟠 The new SQL only constraints have no test coverage, `tests/marketplace-domain-model.test.ts:14`

**Problem**: the test helper reads only files under `prisma/schema`. The rework's strongest new guards live only in the migration: the single first party shop index (line 1571), the wishlist target and duplicate indexes (lines 1574 to 1584), the listing media reference check (line 1587), the review target check (line 1592), and every money and quantity check (lines 1596 to 1654). None of these are asserted anywhere.

**Why it matters**: a regenerate step, a later schema change, or a plain typo can drop or break one of these guards while the suite stays green. The vacuous split check above is exactly that failure, and it passed the whole suite.

**Suggested fix**: extend the contract test to read the migration file and assert each named constraint and index exists. For the split check, assert the expression does not contain the `OR` escape clause. A database backed check against `pg_constraint` and `pg_indexes` would be stronger, and can come with the T3 inventory gate.

## Minor

### 🟡 Commission rate and scope have no bounds, `prisma/schema/payment.prisma:88`

**Problem**: `CommissionRule.rateBps` has no check at all, and `OrderItem.commissionRateBps` only checks value `>= 0` (`prisma/schema/order.prisma:103`). Nothing stops a rate above 10000 basis points. `CommissionRule.scopeType` is a free string and a category scoped rule may leave `categoryId` null.

**Why it matters**: a bad configuration value is snapshotted onto order items and flows into commission and settlement amounts, where it is hard to see and hard to unwind.

**Suggested fix**: add checks that both rate columns fall between 0 and 10000, make `scopeType` an enum, and add a check that a category scoped rule carries a `categoryId`.

### 🟡 A dispute can exist with only a shop, `prisma/schema/trust.prisma:93`

**Problem**: `orderId`, `shipmentId` and `orderItemId` are all nullable, and no check requires one of them. A dispute with only `shopId` is valid.

**Why it matters**: eligibility blocking is meant to target the affected item or shipment (`AC-9`). A shop level dispute has no item or shipment scope, so it either blocks too much or cannot block correctly, and the decision has to be guessed from free text.

**Suggested fix**: add a check requiring at least one of `orderId`, `shipmentId` or `orderItemId`. If shop level disputes are intentional, record how they scope eligibility.

### 🟡 Deleting a shop silently turns its stock location into a platform location, `prisma/schema/inventory.prisma:6`

**Problem**: `StockLocation.shop` uses `onDelete: SetNull`. Deleting a shop leaves the location row with a null `shopId`, while `type` still says `SHOP` unless someone changes it. `Listing` cascades from `Shop`, so the shop's listings and balances disappear with it.

**Why it matters**: the orphan location now reads as CareU owned stock. The damage is limited because a shop with orders cannot be deleted (`Shipment` and `OrderItem` use `Restrict`), but the state is contradictory and can mislead a later stock report.

**Suggested fix**: use `Restrict`, or add a check that `type = 'SHOP'` requires a non null `shopId`.

### 🟡 `verify.md` claims a schema guard that does not exist, `docs/specs/0001-marketplace-domain-model/verify.md:11`

**Problem**: the step says "the schema must not permit those liabilities for first party sales". The schema does permit a `FinancialLedgerEntry` against a first party shop with seller earning or payout entry types. Only posting logic prevents it.

**Why it matters**: the verify record claims a stronger guarantee than the model provides, which can mislead the ledger slice into assuming the database will catch a mistake.

**Suggested fix**: reword the step to say the boundary is enforced by posting logic, audited, and supported by `Shop.isFirstParty`.

## Nits

- ⚪ `docs/specs/0001-marketplace-domain-model/verify.md:16`, names migration `20261112064110_marketplace_domain_model`; the applied one is `20261112074041_marketplace_domain_model`.
- ⚪ `prisma/schema/payment.prisma:31`, `PaymentEvent.payment` uses `SetNull`. The spec allows a nullable link, but the append only callback log loses its payment anchor if a `Payment` row is ever deleted. `Restrict` is the safer default.

## Strengths

- Money is `BigInt` in every schema file and every money column in the migration, which matches the documented poisha contract in `lib/money`.
- The order, payment, refund and ledger graph now uses `Restrict`, so financial history cannot be deleted out from under an order. The earlier cascade finding is genuinely fixed.
- Commission snapshots carry rule, rate, base and amount, and `commissionPoisha` has no default, so a missing commission cannot pass silently.
- Discount funding is recorded on both `Order` and `OrderItem`, which matches the confirmed rule that commission treatment follows who funded the discount.
- Idempotency and append only anchors are consistently present: `checkoutIdempotencyKey`, `StockReservation.idempotencyKey`, `PaymentEvent.eventKey`, `FinancialLedgerEntry.idempotencyKey`, `PayoutItem.idempotencyKey`, and audit tables without `updatedAt`.
- The migration is real and current: `prisma validate` passes, `migrate status` reports up to date, and `migrate diff` against the live database is empty.

## Test coverage

`tests/marketplace-domain-model.test.ts` has 10 tests that trace to AC-1 through AC-9 and to the integrity anchors. They verify money types, snapshot fields, status separation, idempotency keys, scope anchors, the absence of a cart table, and the new `Restrict` relations. The full suite reports 36 passed and 11 skipped, with the skips being the intentionally pending T2 to T7 gates.

The gap is where the file reads from. It loads only `prisma/schema`, so the migration's manual constraints are untested, including the single first party shop index, the wishlist duplicate guards, the review target check, every money check, and the broken split check. The review uniqueness rule has no assertion either. Runtime enforcement of the constraints, such as a rejected negative amount or a duplicate wishlist row, is not exercised until the database backed gates land.

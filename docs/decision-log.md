# CareU.bd — Decision Log

**Status:** PROPOSAL — awaiting explicit approval.
Append-only. New decisions are appended; a superseded decision is marked `SUPERSEDED`, never deleted.

| Field  | Meaning                                                                                                                                      |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Status | `CONFIRMED` (approved) · `PROPOSED` (recommended, awaiting approval) · `VERIFIED` (confirmed against an external source) · `OPEN` (blocking) |

---

## Confirmed during discovery (2026-10-22)

### D-01 — One shared dashboard, not separate applications

**Status:** PROPOSED (structural recommendation, awaiting approval)
**Decision:** A single Next.js application and deployment hosts both the storefront and the dashboard. Workspaces (`platform`, `catalog`, `seller`, `operations`, `finance`) are route segments inside one dashboard system, with permission-driven navigation and server-enforced actions.
**Rationale:** One auth system, one Prisma client, one cache namespace, one deployment. Splitting adds authz surface, doubles operational burden, and buys nothing at this scale.
**Implications:** All dashboard routes are dynamic and never inside a shared `'use cache'` scope. `robots`/`noindex` applied in addition to server-side authorization.

### D-02 — Custom RBAC tables rather than the Better Auth organization plugin

**Status:** PROPOSED
**Decision:** `Role`, `Permission`, `RolePermission`, `UserRoleAssignment(userId, roleId, scopeType, scopeId)`.
**Rationale:** The organization plugin models orgs/teams/invitations. The marketplace needs platform-scoped staff and shop-scoped staff with different permission vocabularies, and the same human may hold roles in several shops. A purpose-built table is smaller, admin-configurable (a stated requirement), and auditable.
**Implications:** Role/permission checks are one helper (`requirePermission`) used by every action and handler. No organization plugin dependency.

### D-03 — MFA (TOTP) required for platform-admin and finance roles

**Status:** CONFIRMED (from the master brief)
**Decision:** Better Auth `twoFactor` plugin; enrolment is admin-gated; privileged roles cannot act without a verified second factor.
**Rationale:** Explicit requirement. Better Auth already ships the primitive.
**Implications:** The Better Auth CLI must be re-run once to add the `twoFactor` field to `User` — settle the auth plugin set before the main schema build (see R-6 in `docs/requirements.md`).

### D-04 — Cloudflare R2 is the storage decision

**Status:** CONFIRMED (from the master brief)
**Decision:** R2 for product media **and** private files. Bunny Stream for video.
**Rationale:** The master brief fixes R2. `AGENTS.md` still lists "Cloudflare R2 vs. Cloudinary" as a pending decision — that line is now stale and should be corrected when a documentation change is authorised.
**Implications:** Two buckets (public/private). `images.remotePatterns` must allow-list the R2 public host. Private media is served through signed, time-limited, audited URLs.

### D-05 — Stock and SKU live on the offer, not on the catalogue variant

**Status:** PROPOSED — **changes an existing `AGENTS.md` rule**
**Decision:** `Offer` (a seller's listing of a shared product variant) holds `sku`, `price`, `stock`. `ProductVariant` holds catalogue attributes only.
**Rationale:** A shared catalogue variant can be offered by many sellers, each with their own SKU, price and stock. Variant-level stock is impossible in that model and would leak one seller's inventory into another's.
**Implications:** The atomic-decrement rule in `AGENTS.md` ("`UPDATE variants SET stock = stock - $qty …`") must become "`UPDATE offer SET stock = stock - qty …`" with an affected-row check. CareU first-party stock is the stock of the first-party shop's own offers, so there is still exactly one inventory mechanism.

### D-06 — Money is stored as integer poisha (1/100 BDT)

**Status:** PROPOSED — **changes an existing `AGENTS.md` rule**
**Decision:** All monetary columns are `BigInt` holding poisha. BDT is the only currency at launch. Display uses `Intl.NumberFormat` with 2 decimals.
**Rationale:** `AGENTS.md` says "integer BDT" and `formatPrice` renders 0 decimals, but proportional multi-seller discount allocation, per-shipment delivery charges, commission on a ৳590 line, and partial refunds all produce sub-taka amounts. Whole-taka arithmetic guarantees rounding drift across allocations, which is a financial-correctness bug generator.
**Implications:** `formatPrice` changes to 2 decimals; a boundary converter is required because `BigInt` does not serialise to JSON. Integer-only storage is preserved — no floats, no `Decimal`.

### D-07 — Seller-unique products are shop-scoped

**Status:** PROPOSED
**Decision:** `Product.source ∈ PLATFORM | SELLER`. A seller-unique product belongs to one shop, is excluded from shared category browse, and carries its own variants, offers, SKU and stock.
**Rationale:** Keeps the shared catalogue clean and prevents seller-owned products from polluting platform-wide browse and SEO surfaces, while preserving the confirmed requirement that sellers may create unique products.
**Implications:** A `ownerShopId` column and a browse filter; catalogue governance screens treat the two sources differently.

### D-08 — COD: CareU owns the entire COD workflow end-to-end

**Status:** CONFIRMED (decision taken during discovery; scope reaffirmed)
**Decision:** CareU delivery staff or a CareU-coordinated courier collect the cash; **CareU owns the entire COD workflow end-to-end**. Sellers do **not** collect COD payments, coordinate COD remittances, or independently reconcile COD collections. CareU is the single merchant-of-record for COD. Concretely, CareU owns:
1. **Collection** — coordinating customer payment through the delivery/courier process.
2. **Custody tracking** — cash collected, courier-held funds (cash in a courier's hands before it reaches CareU), remittances and their reconciliation.
3. **Discrepancy handling** — investigating collection discrepancies and courier shortages, with evidence.
4. **Settlement** — calculating and settling seller earnings under the agreed commission and payout rules (D-12).
5. **Exception flows** — coordinating COD-related cancellations, returns and refunds.
6. **Auditability** — an auditable record for every collection, remittance, adjustment and settlement.
**Rationale:** CareU already manages delivery assignment, so a single merchant-of-record keeps one cash flow, one reconciliation path, and no seller cash-collection risk between delivery and settlement. Making CareU the owner of the *whole* chain (not just the final remittance) removes ambiguity about who investigates a missing taka.
**Implications:** `Shipment.codAmount`, `CashCollection` (expected / collected / shortage), a courier-custody dimension (`SELLER_RECEIVABLE` / courier-held cash before it reaches CareU — D-31), and COD entries in the ledger. A shortage is an explicit exception, owned and investigated by CareU, never a silent discrepancy and never automatically seller debt (D-26, D-32).

### D-09 — Discount funding is per-campaign; default is pro-rata commission-base reduction

**Status:** CONFIRMED (decision taken during discovery)
**Decision:** Each promotion declares its funding source (CareU / seller / mixed) and its commission treatment. Default: a platform-funded discount reduces the seller's commission base pro-rata; a seller-funded discount does not.
**Rationale:** The brief already requires commission treatment to be configurable per campaign. Pro-rata is the fair default when the platform funds the discount.
**Implications:** The funding split and allocation are snapshotted onto the order so historical economics are never recomputed.

### D-10 — Tax is modelled but not applied at launch

**Status:** CONFIRMED (decision taken during discovery)
**Decision:** Tax rules, jurisdiction mapping, inclusive/exclusive treatment, rounding mode and effective dating are modelled; snapshot columns exist; **no tax is collected** until a validated basis exists.
**Rationale:** The rules engine is a confirmed capability, but whether a tax is _collected_ is a legal/financial matter that must not be assumed. Nothing is charged without a basis.
**Implications:** Enabling tax later is a configuration change, not a code or schema change. Bangladesh VAT specifics remain an open verification item with a qualified professional.

### D-11 — Delivery: flat charge per seller shipment by district zone, buyer pays

**Status:** CONFIRMED (decision taken during discovery)
**Decision:** One flat delivery charge per seller shipment, determined by the destination district zone, charged to the buyer, snapshotted on the shipment and order. No free-delivery threshold at launch.
**Rationale:** The confirmed requirement is already "delivery charges per seller shipment, configurable by destination, shipment, method, weight or order value, snapshotted". A zone-based flat rate is the simplest model that satisfies it; a free-delivery threshold can be added later as a rule with no schema change.
**Implications:** `DeliveryZone`, `District` reference data, and an effective-dated `DeliveryRate` table.

### D-12 — Payouts: weekly, minimum ৳1,000, admin-approved, COD netted in

**Status:** CONFIRMED (decision taken during discovery)
**Decision:** Weekly payout batch, minimum ৳1,000, bank or mobile wallet destination, admin approval required, COD receivables netted into the same batch.
**Rationale:** Short cash cycle for sellers, manageable manual workload, and one reconciliation path for online and COD money.
**Implications:** `PayoutBatch` (draft → pending approval → approved → processing → paid/partial/failed), `Payout` per seller with a transfer reference, `PayoutAttempt` for failures and retries, and a two-person approval rule for batches.

### D-13 — Returns: 7-day window, customer pays return shipping (not refunded)

**Status:** CONFIRMED (decision taken during discovery)
**Decision:** 7-day return window from delivery. The customer pays return shipping and it is not refunded. Defect, wrong-item and damaged-on-arrival cases are borne by the seller and refunded in full, including return shipping.
**Rationale:** A conventional, low-operational-burden window that keeps the cost of returns with the party controlling the return in the ordinary case, while protecting the customer in fault cases.
**Implications:** `ReturnRequest.shippingCostBearer` and `windowExpiresAt` snapshot; the 7-day value is a configurable setting per category, not a hard-coded rule. **Bangladesh consumer-protection return rights may impose a different minimum — this must be verified with a qualified professional before launch (R-8).**

### D-14 — Seller-unique vs. shared catalogue: see D-07

**Status:** PROPOSED
_(Consolidated with D-07; retained here as a pointer for traceability.)_

### D-15 — Reservations begin at checkout, not at add-to-cart

**Status:** PROPOSED
**Decision:** The cart is browser-only, so a `StockReservation` is created when checkout is submitted, with a short configurable TTL (10 minutes). Expiry or cancellation posts a reversing stock movement and returns the units.
**Rationale:** With no server-side cart there is no earlier moment to reserve against. The "Stock reservations" dashboard item means in-flight checkout reservations.
**Implications:** A background job releases expired reservations; the dashboard can list and inspect them.

### D-16 — Append-only financial ledger plus immutable order snapshots

**Status:** PROPOSED
**Decision:** Order lines keep immutable financial snapshot columns for display and legal record. All money movement is additionally recorded as balanced `LedgerEntry` rows against a fixed account set. Corrections are reversing entries.
**Rationale:** Snapshots are convenient but cannot express adjustments, chargebacks or corrections. A ledger can, and it gives reconciliation a single source of truth without a general double-entry engine.
**Implications:** A nightly job asserts debits == credits per document. Balances are derived from the ledger, so no materialised balance table can drift.

### D-17 — `Product`/`Offer` split: catalogue vs. seller listing

**Status:** PROPOSED
**Decision:** `Product` + `ProductVariant` are the shared catalogue. `Offer` is a seller's listing (price, SKU, stock, status). A seller-unique product owns exactly one offer per variant.
**Rationale:** A single source of truth for catalogue attributes, and per-seller freedom for price, stock, SKU and moderation state.
**Implications:** Product pages aggregate offers; the customer sees the best eligible offer. A shared product is never deleted while an offer references it.

### D-18 — Search uses PostgreSQL full-text + `pg_trgm` at launch

**Status:** PROPOSED
**Decision:** Search is implemented with PostgreSQL `tsvector` columns plus `pg_trgm` for fuzzy matching, with a thin `lib/search/` interface so an external engine can replace it later.
**Rationale:** No additional infrastructure or cost, works on Neon 16/17, and adequate for a launch catalogue. An external service is a future optimisation, not a launch dependency.
**Implications:** Bangla tokenisation quality must be measured against real queries before launch; `pg_trgm` handles near-miss Bangla/Latin spellings better than plain FTS.

### D-19 — Test runner: Node's built-in `node --test`

**Status:** PROPOSED
**Decision:** Use Node 24's built-in test runner with native TypeScript execution. No new test dependency.
**Rationale:** The library policy discourages dependencies that do not earn their place, and `AGENTS.md` requires tests for permissions, inventory, payments, orders, refunds and commissions. The built-in runner satisfies that at zero install cost.
**Implications:** A `npm run test` script must exist and pass before any change in those areas is considered done. Database-backed tests need a local Postgres and a per-run schema or transaction isolation.

### D-20 — Storefront publishing: page + draft + immutable revision

**Status:** PROPOSED
**Decision:** `StorefrontPage` (identity) → `StorefrontDraft` (mutable working copy) → `StorefrontRevision` (immutable published snapshot). The live storefront reads only `activeRevisionId`.
**Rationale:** Guarantees a draft can never leak live, gives a full revision history, and makes rollback a publish of a cloned revision rather than a mutation of history.
**Implications:** Publishing validates the whole configuration. Navigation is stored in tables (queryable, translatable); visual homepage sections live in draft JSON validated against a closed type registry.

### D-21 — Dashboard staff UI is English-only at launch

**Status:** PROPOSED (reversible)
**Decision:** Internal dashboards ship in English only; the customer storefront remains `en`/`bn`.
**Rationale:** Halves the internal translation surface and the risk of a half-translated operational tool. Nothing in the brief requires Bangla staff tooling.
**Implications:** If Bangla staff tooling is wanted later, the next-intl catalogue extends without touching the data model.

### D-22 — Shop-scoped access uses one table, not a separate shop-staff table

**Status:** PROPOSED
**Decision:** Shop membership and shop permissions are expressed only through `UserRoleAssignment` with `scopeType = SHOP`.
**Rationale:** A separate `ShopStaff` table would be a second source of truth for the same fact, which is a classic source of authorization bugs.
**Implications:** `Shop.ownerUserId` remains the only explicit ownership field.

### D-23 — CareU absorbs payment-gateway fees at launch

**Status:** CONFIRMED (decision taken during discovery)
**Decision:** Payment-gateway fees are borne by CareU at launch and are **not** netted from seller earnings. Fees are recorded against dedicated ledger accounts (`GATEWAY_FEES` / `PLATFORM_EXPENSES`); charging a fee to a seller, if ever done, requires an explicit approved `FinancialAdjustment`.
**Rationale:** Keeps the seller proposition simple and the earnings model honest — a seller's payable should not silently shrink. Isolating fees now means the policy can change later without touching the earning pipeline.
**Implications:** `LedgerEntry` gains the `GATEWAY_FEES`/`PLATFORM_EXPENSES` accounts and an `accountClass` classification. Subject to O-12 (actual SSLCommerz fee structure): if fees cannot be absorbed, this decision is revisited with explicit approval — not changed silently.

### D-24 — Product ownership is four separate concepts

**Status:** CONFIRMED (decision taken during discovery)
**Decision:** "Who owns the product" is split into **catalogue ownership** (`Product.source` + `ownerShopId`), **visibility/channel** (`Product.channel`: `SHARED|EXCLUSIVE`), **offer ownership** (`Offer.shopId`) and **fulfilment ownership** (`Offer.shopId` → `SellerOrder.shopId`). A platform-owned product may be `SHARED` (any eligible shop may offer) or `EXCLUSIVE` (only the first-party shop may offer). Seller-unique products are isolated to their shop. A first-party offer is CareU's own inventory and revenue — **never** a seller liability.
**Rationale:** Conflating ownership, visibility and selling rights produces ambiguous browse/SEO behaviour and, worse, risks first-party inventory leaking into seller accounting. Separating the concepts keeps the shared pipeline intact while making the financial exclusion structural.
**Implications:** A `channel` column and INV-6a/6b/14a. First-party offers create no `SellerEarning`, no commission and no payout, enforced at the split boundary (§14), not by a second catalogue code path.

### D-25 — Discount allocation: proportional with largest-remainder rounding, deterministic tie-break

**Status:** CONFIRMED (decision taken during discovery)
**Decision:** Multi-line/multi-seller discounts are allocated proportionally to each eligible line's base. Integer poisha are assigned by floor, then the remaining poisha are distributed one at a time to the largest fractional remainders (largest-remainder method). Ties are broken deterministically by ascending `orderLineId`. `Σ allocated == discountTotal` is asserted before commit. Funding (CareU/seller/mixed) and the commission-base effect are snapshotted per line.
**Rationale:** Proportional allocation is the fair split required by the brief; integer-only storage (D-06) means the split will not divide evenly, so a defined rounding rule is mandatory. A deterministic tie-break makes the result reproducible for audits and disputes — iteration-order tie-breaks silently change the money.
**Implications:** `PromotionRedemption.allocation`, per-line `discountAmount`/`careuFundedDiscount`/`sellerFundedDiscount`/`commissionBase`, and line↔seller-order↔order reconciliation in `RECONCILE_LEDGER`.

### D-26 — COD: cash, earning and payout are separated; shortages stay open

**Status:** CONFIRMED (decision taken during discovery)
**Decision:** COD separates **cash collected** (`CashCollection`), the **seller earning** (eligibility, independent of remittance timing), and the **payout** (money out, COD netted in per D-12). A COD shortfall is an **outstanding reconciliation item** (`COD_SHORTAGE_PENDING`) and is **never** auto-assigned to CareU or the seller; it is resolved only by an approved, reasoned `FinancialAdjustment`. A failed/uncertain remittance is not treated as collected.
**Rationale:** Collapsing these into one "balance" is how COD shortages silently become seller deductions and how an unremitted cash position gets mistaken for settled money. Keeping them distinct makes every COD taka reconcilable.
**Implications:** `CashCollection.status`, `COD_SHORTAGE_PENDING` account, `Payout.nettingSnapshot`, and the COD section §3.10.1. Netting mechanics remain O-11 (policy).

### D-27 — Every private-document access is audited (fail closed)

**Status:** CONFIRMED (decision taken during discovery)
**Decision:** Every grant or denial of access to a private/sensitive document (seller verification, proof-of-delivery, case/dispute attachments) writes a dedicated, append-only `DocumentAccessLog` row **before** the signed URL is returned, on both success and denial. The log stores the document reference, actor, scope, purpose, result and a correlated request id — **never** the signed URL, document bytes or raw IP. If the audit write fails, the URL is not returned.
**Rationale:** The confirmed requirement is an auditable access log for private documents; a generic application log is neither complete nor reliably retained. Failing closed prevents an unaudited disclosure.
**Implications:** A new table (`DocumentAccessLog`), separate from `AuditLog`, with its own retention (never shorter than the document's). Signed-URL route writes the log transactionally relative to the response.

### D-28 — The ledger is a signed double-entry-per-document ledger (convention fixed)

**Status:** CONFIRMED (decision taken during discovery)
**Decision:** The financial ledger is a **double-entry ledger at document granularity in integer poisha**: every posted entry carries `DEBIT` or `CREDIT`, and **every document's entries must sum to equal debits and credits, asserted in code before commit**. Each account has a fixed **normal side** (`CASH`/`RECEIVABLE`/`EXPENSE`/`ADJUSTMENT` are debit-normal; `PAYABLE`/`REVENUE` are credit-normal); the signed balance of an account is `Σ DEBIT − Σ CREDIT` for debit-normal accounts and `Σ CREDIT − Σ DEBIT` for credit-normal. There is **no** single-entry-with-direction model and no "debits == credits" claim that is untestable. This resolves the earlier §8.4 contradiction.
**Rationale:** The brief requires auditability and reconciliation. A signed pair per document is the smallest structure that is verifiable, reversible and unambiguous across the whole account set.
**Implications:** `LedgerEntry.direction` is load-bearing; the `RECONCILE_LEDGER` job asserts per-document balance and per-account normal-side sign; every document-writing service asserts balance before commit (INV-58). Corrections remain reversing entry pairs (INV-57).

### D-29 — Deterministic largest-remainder rounding applies to funding splits too

**Status:** CONFIRMED (decision taken during discovery)
**Decision:** D-25's largest-remainder rule is applied **twice and independently**: once to distribute `discountTotal` across eligible lines, and once **within each line** to split that line's allocated discount between CareU-funded and seller-funded shares (for `MIXED`). Both use floor + largest-fractional-remainder, one poisha at a time, with the **same deterministic tie-break** (ascending `orderLineId`; for the funding split, ties on a single line resolve to the **CareU share first**). `Σ CareU-funded + Σ seller-funded == discountTotal` is asserted before commit.
**Rationale:** The funding split is itself integer-constrained and does not divide evenly (e.g. a 60/40 split of an odd allocation leaves one poisha over). Without a rule the extra poisha lands somewhere by accident and the ledger drifts from the snapshotted split.
**Implications:** `PromotionRedemption.fundingSplit` is computed by the same rounding primitive as `allocation`; `Σ` assertions in §3.6.1 cover both; the extra poisha from a `MIXED` split is deterministic and auditable.

### D-30 — Refund state machine is safe-by-default; unverified gateway refunds fall back to manual

**Status:** CONFIRMED (decision taken during discovery)
**Decision:** A refund is `REQUESTED → APPROVED → PROCESSING → COMPLETED | FAILED`, with `REJECTED` from `REQUESTED`/`APPROVED`. **Only `APPROVED` (admin-authorised, audited) refunds may move money.** A gateway refund that returns an inconclusive result is recorded as `PROCESSING` and reconciled against the gateway before retry — never assumed successful and never assumed failed. Where the gateway has **no refund API** (unverified, O-6), the refund **falls back to `MANUAL_TRANSFER`** with a recorded reference and admin approval; it does not block and does not silently abandon the customer. Refund ledger entries are written only on `COMPLETED`, and are reversing entries against the original sale.
**Rationale:** Refunds are money-moving and irreversible in practice; an unknown gateway outcome must never be treated as final, and a missing gateway capability must not strand the refund.
**Implications:** `Refund.status`, `Refund.method`, `gatewayRefundId`/`manualReference`; `PROCESSING` is a first-class reconciled state; INV-51 (COD) and INV-52 (online fallback) enforce the destinations of each path.

### D-31 — Seller receivables arise at COD collection; post-payout corrections never reopen a completed payout

**Status:** CONFIRMED (decision taken during discovery)
**Decision:** A **COD `SELLER_RECEIVABLE`** is created at the moment of collection (the customer's cash is held by CareU/courier and owed to the seller-account) and is settled when the COD cash is remitted/netterd into the payout; it is **never** conflated with the seller's earning (`SELLER_PAYABLE`, posted at order capture). A **post-payout** correction (late return, dispute upheld, chargeback, fee) **never edits a completed `Payout`**; it is recorded as a new, approved, reasoned `FinancialAdjustment` + reversing `LedgerEntry` pair, which leaves a `SELLER_RECEIVABLE` (seller owes CareU) or a `SELLER_PAYABLE` (CareU owes the seller) recovered on the **next** payout. A completed payout's amount, transfer reference and `nettingSnapshot` are immutable.
**Rationale:** The two errors that cost real money are mixing collected cash with earned money, and "fixing" a paid payout in place. Both are structural here: cash receivable is separate from the earning, and a completed payout is history.
**Implications:** INV-56a reconciliation is now fully specified (`Σ ELIGIBLE/PAYABLE netAmount == Σ SELLER_PAYABLE − Σ SELLER_RECEIVABLE`); `FinancialAdjustment` is the only post-payout correction path; payout rows are never mutated after `PAID`.

### D-32 — CareU owns COD discrepancy investigation; loss allocation is an explicit, evidenced, audited decision

**Status:** CONFIRMED (decision taken during discovery; codifies D-08/D-26)
**Decision:** CareU — not the seller — **owns and investigates** every COD collection discrepancy, including courier-held cash that never arrives, under/over-collection, and refused or partially paid deliveries. A discrepancy is **never automatically classified as seller debt, and never automatically booked as a confirmed CareU expense.** It remains an **open reconciliation item** (`COD_SHORTAGE_PENDING` for a shortfall; a distinct open item for an over-collection or missing-custody case) until CareU closes it with an **explicit, reasoned, evidenced and audited decision**. The eventual outcome is one of:
1. **Recovered** from the responsible party (courier/staff or other custodian) — recorded as a recovery against the party who held the funds, not against the seller.
2. **Absorbed by CareU** as a platform expense (`PLATFORM_EXPENSES`) — a deliberate, approved write-off.
3. **Charged to a seller** only if evidence establishes the seller is responsible, via an approved `FinancialAdjustment` (never automatic, never silent).
**Rationale:** A missing taka has to belong to someone; guessing (or silently deducting from the seller) is how COD disputes become unaccountable. Naming CareU as the investigator and forcing an evidenced decision makes every outcome traceable to a reason and an approver. It also keeps the confirmed rule (D-26) intact: a shortage does not become seller debt by default.
**Implications:** `CashCollection.status` (`COLLECTED|SHORT_COLLECTED|RECONCILED`), the `COD_SHORTAGE_PENDING` open-item account, a courier-custody tracking dimension, and `FinancialAdjustment` as the only path that changes who bears the loss. Each investigation and its resolution are audited (`AuditLog`), with the evidence reference stored on the adjustment. Weekly payout cadence, the ৳1,000 minimum and the commission policy are unchanged.

---

## Open items — not yet decided

| ID   | Item                                                                                                                  | Why it matters                                                                             | Consequence if unresolved                                                                      |
| ---- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| O-1  | Review moderation mode (auto-publish vs pre-moderation)                                                               | Changes the review pipeline, not the schema                                                | Schema supports both via a setting; the review queue UI differs                                |
| O-2  | Neon runtime driver (`@prisma/adapter-pg` pooled vs. `@prisma/adapter-neon`) and whether to add `DIRECT_DATABASE_URL` | Interactive transactions (checkout reservation, payout batch) may need a direct connection | Migration to another driver later; long transactions may be cut on the pooled endpoint today   |
| O-3  | Public order tracking without login: secure scoped time-limited token vs. sign-in required                            | Security/UX tradeoff; a token must be single-order, time-limited, non-guessable            | Either a public tracking page with a token, or account-only tracking                           |
| O-4  | Seller onboarding document list and retention period                                                                  | Legal/operational; affects `SellerApplicationDocument` retention                           | Default retention can be set by policy later; the list itself is admin-configurable            |
| O-5  | Notification channels (email only vs. email + SMS)                                                                    | Affects the notification outbox and provider wiring                                        | The model carries a `channel` field, so adding SMS is a provider change                        |
| O-6  | Whether SSLCommerz supports hosted checkout, partial refunds and chargeback notifications                             | Determines the payment model shape                                                         | Payment implementation is blocked until verified; the model already isolates gateway specifics |
| O-7  | Bangladesh regulatory obligations: invoice content/numbering, VAT, consumer return rights, e-commerce registration    | Legal exposure                                                                             | Cannot be resolved by engineering; requires a qualified professional                           |
| O-8  | Serial/warranty-tracked product lines in launch scope                                                                 | Adds a serial-entity dimension to inventory                                                | Explicitly deferred for now; can be added as an extension of `StockMovement`                   |
| O-9  | Whether the first-party shop appears in the seller-facing "marketplace" surfaces                                      | Affects storefront filters and seller analytics                                            | Cosmetic; the `isFirstParty` flag already supports both behaviours                             |
| O-10 | Buyer's payment for multi-seller orders when one seller is CareU first-party                                          | Presentation only; the split is already per seller order                                   | Cosmetic                                                                                       |
| O-11 | COD netting mechanics: per-seller receivable vs. explicit payout-batch offset                                         | Affects payout presentation and reconciliation reporting                                   | `Payout.nettingSnapshot` records whichever is chosen; the ledger reconciles either way (D-26)  |
| O-12 | Confirm SSLCommerz fee structure/caps allow CareU to absorb fees                                                       | D-23 assumes absorption; if infeasible the policy must change                              | Revisit D-23 with explicit approval; `GATEWAY_FEES` already isolates the cost                  |
| O-13 | Neon driver: confirm interactive transactions + `SELECT … FOR UPDATE` on the pooled endpoint (or use a direct connection) | The §11.2 checkout protocol requires a real transaction-capable connection                 | Verify before launch; the protocol is unchanged, only the connection choice is                     |
| O-14 | Bangladesh regulatory obligations for the specific launch catalogue (invoice content/numbering, VAT registration threshold, consumer-rights alignment) | Legal exposure if a regulated category goes live before review | Feature-gated: affected categories stay unpublished until a qualified BD professional signs off (see `requirements.md` §13.4); does not block non-regulated catalogue |

### Closure classification of the open items

The remaining open items are **not** blockers for building and verifying the application in working stages. Classified as agreed in the final discovery pass:

| Class | Items | Meaning |
|---|---|---|
| **Verify before launch** | O-2, O-13 (Neon transactions/locking), O-6 + O-12 (SSLCommerz capabilities/fees) | No schema impact; verified at the relevant implementation milestone, before the affected feature goes live. The payment model already isolates gateway specifics behind an interface. |
| **Verify before the affected feature ships (legal)** | O-7, O-14 | Requires a qualified Bangladesh professional. Non-regulated catalogue can launch; affected categories are feature-gated until reviewed. |
| **Follow-up, non-blocking** | O-1, O-3, O-4, O-5, O-8, O-9, O-10, O-11 | Settings/optional scope; the model already supports both behaviours or defers cleanly. |
| **Accepted as documented follow-up** | O-2 fallback (`DIRECT_DATABASE_URL`) | Add the env var when the Neon driver is chosen; documented in §13.3 R-3. |

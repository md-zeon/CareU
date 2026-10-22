# CareU.bd — Consolidated Requirements

**Status:** PROPOSAL — awaiting explicit approval. Nothing in this document is implemented.
**Phase:** Requirements discovery & data-model review.
**Sources:** `AGENTS.md` (confirmed platform rules) + the master product brief (dashboard-first strategy, admin-editable storefront, operational workspaces) + the policy decisions taken during discovery.
**Related:** `docs/decision-log.md`, `docs/data-model.md`.

## Status legend

| Code | Meaning |
|---|---|
| **C** | Confirmed — approved requirement |
| **R** | Recommended — proposed by engineering, awaiting approval |
| **A** | Assumption — needs validation against a real-world constraint |
| **U** | Unresolved — material decision still open |
| **D** | Deferred — explicitly out of launch scope |
| **V** | Externally verified constraint — confirmed against a provider/vendor source |

---

## 0. Scope and non-goals for launch

### In scope for launch
Customer storefront (en/bn), customer accounts, shared catalogue, third-party seller shops, CareU first-party store, cart & checkout, orders, seller/ CareU delivery, COD + online payment (SSLCommerz), returns/refunds/disputes, support cases, reviews & notifications, one permission-driven dashboard with five logical workspaces, admin-editable storefront (homepage sections, theme tokens, navigation, footer, landing pages) with draft/published revisions, seller earnings/commission/settlement, COD receivables, manual payout batches, audit trail.

### Explicitly out of launch scope (D)
Guest checkout, courier API integration, multi-currency display, warranty/serial-tracked product lines, external search service (Typesense/Meilisearch/Algolia), separate dashboard application, message broker, microservices, automated payouts, auto-publishing of storefront changes.

### Guiding invariants (C)
1. All money is **integer poisha** (1/100 BDT). No floats, no `Decimal`.
2. Order lines, orders, refunds, settlements keep **immutable financial snapshots**. History is never rewritten; corrections are new reversing entries.
3. `PaymentStatus` and `FulfillmentStatus` are **separate fields**, never a single combined enum.
4. Authorization is enforced **server-side** on every protected operation. UI hiding is cosmetic.
5. Public catalogue reads may be cached (`'use cache'`); **per-user, per-shop, per-order, per-permission reads are never shared-cached**.
6. CareU first-party sales produce **no marketplace commission, no seller balance, no payout liability**.
7. Stock is decremented atomically inside the order transaction, and every movement is recorded with a reason.
8. A browser redirect is never proof of payment — only a verified server-to-server callback or a reconciled gateway query settles an order.

---

## 1. Identity, accounts and access control

### 1.1 Actors
| Actor | Description | Scope |
|---|---|---|
| Customer | Authenticated shopper | Own data only |
| Seller owner | Account owner of exactly one third-party shop | Own shop + own catalogue/stock/orders |
| Seller staff | Invited by the seller owner | Own shop, restricted permissions |
| Platform staff | Employee accounts (catalog, inventory, support, delivery, finance, moderation) | Platform |
| Platform admin | Manages platform, catalogue governance, staff, settings, publishing | Platform |

### 1.2 Confirmed rules
- **C** One account may act as customer **and** seller simultaneously.
- **C** At most **one** third-party shop per seller account.
- **C** Auth: Better Auth, phone OTP + email OTP, DB-backed rate limiting, cookie cache enabled, session payload narrowed to `{id, name, email?, phone?}`.
- **C** BD phone numbers match `/^(\+880|0)1[3-9]\d{8}$/`.
- **C** Rate-limited endpoints: registration, OTP send/verify, checkout, refunds, support intake, seller applications.
- **C** Permission model: predefined starter roles + administrator-configurable roles and permissions. Platform permissions (catalogue, pricing, procurement, inventory, margins) are **separate** from shop permissions. Customer-support permissions are **separate** from financial permissions.
- **C** Least privilege by default — a newly invited staff member receives **no** sensitive permission automatically.
- **C** MFA required for privileged administrators and financial roles.
- **C** Every permission change, role change, and staff invitation is audited.
- **C** Account deletion **anonymizes** the user (name/email/phone scrambled) and retains financial, order and audit records. The `User` row survives as an anonymized shell; `Session`/`Account` cascade.
- **C** Customer identity and the review system: only verified purchasers may review, one review per eligible purchased product.

### 1.3 Recommended (R)
- Staff accounts are created by **admin-issued email/OTP invitation**. There is no self-registration path into any staff role.
- Dashboard staff UI is **English-only at launch**; the customer storefront remains `en`/`bn`. Reversible.
- Permission sets are read from the database on every protected request and are **never** embedded in the session cookie (the 300 s cookie cache must not delay a revoked role).
- `UserRoleAssignment` is the **single** mechanism for granting access (platform-scoped or shop-scoped). There is no separate "shop staff" table, to avoid two sources of truth.

### 1.4 Starter roles proposed (R)
`platform_super_admin`, `platform_admin`, `catalog_manager`, `inventory_manager`, `moderator`, `support_agent`, `finance_officer`, `delivery_coordinator`, `seller_owner`, `seller_staff`.
`platform_super_admin` and `finance_officer` require MFA. Shop-scoped roles: `seller_owner`, `seller_staff`. All others: platform-scoped.

### 1.5 Unresolved (U)
- Exact permission granularity (which dotted keys) — proposed in `docs/data-model.md` §2; low risk to adjust, roles are admin-configurable.

### 1.6 Acceptance criteria
- A seller staff member with `orders.read` on shop A cannot read shop B's orders by any means (direct URL, guessed ID, API call).
- Revoking a role takes effect on the next request, not after the cookie cache TTL.
- Deleting an account removes PII but leaves order and ledger rows readable and reconcilable.
- A privileged role cannot complete an action without a verified second factor.

---

## 2. Dashboard and workspaces

### 2.1 Confirmed (C)
- **One shared dashboard system** with permission-based navigation **and** action authorization.
- Logical workspaces: **Platform Administration**, **Catalogue & Inventory**, **Seller Workspace**, **Operations & Support**, **Finance**. These are logical, not separate applications.
- A person may access multiple workspaces **only when explicitly authorized**.
- Dashboard-first build order: build the operational surfaces and the services behind them, then connect the storefront.
- Dashboard-first does **not** defer security, domain logic, or backend foundations.
- Storefront configuration and publishing live in Platform Administration.

### 2.2 Recommended (R) — access architecture
| Aspect | Recommendation |
|---|---|
| Topology | Single Next.js app, single deployment. Dashboard = a route group (`app/[locale]/(dashboard)/dashboard/[workspace]/…`), not a separate service. |
| Workspace segments | `platform`, `catalog`, `seller`, `operations`, `finance`. |
| Authorization | Custom RBAC tables (`Role`, `Permission`, `RolePermission`, `UserRoleAssignment`) with a scope of `PLATFORM` or `SHOP`. |
| Scope enforcement | The scope comes from the server-side session + assignment, never from a client-supplied `shopId`, `role` or `isAdmin`. Data access filters by scope. |
| Action enforcement | A single `requirePermission(perm, ctx)` helper is the first statement of every server action and route handler. |
| Navigation | Derived from the same permission map. Explicitly *not* a security control. |
| Caching | Dashboard routes are never inside a shared `'use cache'` scope. `getCurrentUser` (browser-only, `'use cache: private'`) is not usable in actions/handlers — resolve the session directly there. |
| Indexing | `noindex` + robots disallow on all dashboard routes **in addition to** server-side authorization. |
| Audit | Every sensitive administrative, financial, pricing, inventory, moderation, settlement and permission action is written to the append-only audit log. |

### 2.3 Rationale for custom RBAC over the Better Auth organization plugin
The organization plugin models orgs / teams / invitations — a different vocabulary from "platform staff" vs "shop staff" with different permission sets, where the same human may hold roles in several shops. A purpose-built table is smaller, directly admin-configurable as the brief requires, and easier to audit and test.

### 2.4 Workspace contents (C, condensed)
- **Platform Administration** — overview/alerts, seller applications, shop management, catalogue governance, listing moderation, orders & exceptions, users/roles/permissions, platform settings, audit records, storefront configuration & publishing.
- **Catalogue & Inventory** — shared catalogue, variants, CareU inventory, stock movements, supplier receipts, adjustments, reservations, low-stock alerts, pricing and purchase-cost access control.
- **Seller Workspace** — shop profile & staff, offers, listing approval, pricing, stock, seller orders, shipment updates, reviews, support cases, earnings, settlement statements, reports.
- **Operations & Support** — fulfilment, shipments, delivery assignments and attempts, failed deliveries, returns, escalations, support cases, disputes, resolutions, evidence.
- **Finance** — payment reconciliation, COD receivables and remittance, commission, seller balances, refund review, financial adjustments, payout batches, settlement reports.

### 2.5 Acceptance criteria
- Navigation and page access are driven by the same permission source; a user never sees a link that 403s.
- A server action called directly (bypassing the UI) without the permission fails with a generic 403 and writes an audit entry.
- A dashboard page is never served from a shared cache scope.

---

## 3. Catalogue, categories and listings

### 3.1 Confirmed (C)
- Shared catalogue **definitions** + independent **seller listings** against them + **seller-unique products**.
- **Product ownership is four separate concepts (D-24):** catalogue ownership (`source`/`ownerShopId`), visibility/channel (`SHARED`/`EXCLUSIVE`), offer ownership (which shop sells it), and fulfilment ownership (which shop ships and is paid). A platform-owned product may be shared (any eligible shop offers) or first-party-exclusive (only CareU's shop offers). A first-party offer is CareU's own inventory and revenue and is **never** a seller liability.
- Category tree with category-specific attributes.
- Simple and variant-based products; per-variant SKU, price and stock.
- Allowed / restricted / prohibited categories are **configurable by admins**.
- Untrusted sellers' listings require approval; trusted sellers publish subject to configurable moderation.
- Sensitive edits (category, price, restricted attributes, product claims) may require review.
- Admins review reports and remove listings.
- Section content on the storefront references real catalogue products, categories or promotions — no duplicated product data.
- Product pages must be crawlable **without** a customer session, with unique `<title>`/description, canonical URL, and `Product` + `Offer` JSON-LD reflecting real price/availability/currency. **Never fabricate ratings or reviews.**

### 3.2 Recommended (R)
- `Product.source ∈ PLATFORM | SELLER`. A seller-unique product is **shop-scoped**: it appears under that shop only and is excluded from shared category browse. It does not pollute the shared catalogue.
- The catalogue variant holds **attributes only** (name, colour, size, weight). SKU, price and stock live on the **offer** (the seller's listing) — see §4 and D-05.
- Moderation default: untrusted seller → pre-publish approval; trusted seller → publish-then-moderate with report-driven takedown; sensitive field edits (category, price, restricted attributes, claims) → pre-approval for **all** sellers, including trusted. A per-shop trusted flag and a per-category "restricted" flag make these configurable.
- Product media belongs to the product (public bucket). Seller-submitted media is validated server-side for type and size.

### 3.3 Unresolved (U)
- Whether a seller's own photo of a shared catalogue product should be allowed (offer-level media). Deferred to a later phase — not needed at launch.

### 3.4 Acceptance criteria
- Two sellers can list the same shared product with different SKUs, prices and stock without any shared row being modified.
- A prohibited-category product cannot be published by any seller; the attempt is rejected server-side and audited.
- A price change on a restricted product by a trusted seller creates a pending-review state, not a live change.
- Product JSON-LD contains the real current price, availability and currency.

---

## 4. Inventory and stock

### 4.1 Confirmed (C)
- Seller-managed **and** CareU-managed ledgers, kept separate.
- Every movement is recorded with a reason: sale, return, restock, damage, adjustment.
- No overselling. No backorders.
- Sensitive adjustments are reasoned and audited.
- One CareU stock location at launch; the model supports more.
- Basic supplier receipts: supplier, quantities, unit cost, receipt date, invoice/reference.
- Configurable low-stock thresholds and out-of-stock alerts.

### 4.2 Recommended (R) — where stock lives
Stock lives on the **offer** (seller listing), not on the shared catalogue variant. A shared variant can be offered by many sellers with independent stock, so variant-level stock is impossible.
- `Offer.stock` = **available-to-sell** = physical on-hand **minus** units held by an `ACTIVE` reservation. It is decremented once, at reservation, and restored on release/expiry — there is **no** second subtraction for a reservation anywhere.
- Checkout decrements it atomically: `UPDATE offer SET stock = stock - qty WHERE id = $id AND stock >= qty`, and the affected-row count is verified inside the same transaction.
- A `StockReservation` row records the hold lifecycle; the `SALE` movement and the reservation are written together, and expiry/conversion are **conditional** transitions so the release winner posts exactly one reversing movement (no double restore).
- **This changes the atomic-decrement rule written in `AGENTS.md` (which names a `variants` table) — see D-05. Requires a one-line amendment to `AGENTS.md` when implementation is approved.**

### 4.3 Reservations and the browser-only cart (R)
The cart is browser-only, so no server-side cart row exists. A reservation therefore begins at **checkout submission**, not at add-to-cart, with a short TTL (10 minutes, configurable). The "Stock reservations" dashboard item means: view and manage in-flight checkout reservations, and release expired ones via a background job. This must be stated in the spec so it is not mistaken for a cart-reservation feature.
- **Crash recovery:** the reservation row and its `expiresAt` are committed in the same transaction as the order, so a crash before the release job leaves stock held (never oversold) and the next job pass releases it. The job re-scans by `(status, expiresAt)` and keeps no in-memory state; `JobRun` records each successful pass so a stalled job is identifiable.
- **Reservation ↔ payment gap:** if an online payment is never confirmed, the reservation expires and is released, and reconciliation moves the orphaned checkout attempt/order to an expired/cancelled state.

### 4.4 CareU first-party inventory (R)
CareU stock is the stock of the first-party shop's own offers. It uses the same ledger, movements and reservations. Purchase cost is stored **separately** from the public price, in a cost table readable only by procurement/inventory/finance permissions — a third-party seller's cost price is never visible to the platform by default, because the platform has no need for it.

### 4.5 Acceptance criteria
- Two concurrent checkouts for the last unit: exactly one succeeds, the other fails with a clear out-of-stock message, and no oversell row exists.
- Every stock number can be explained by a sequence of `StockMovement` rows, where `Offer.stock` is available-to-sell.
- A seller cannot see or mutate CareU stock, and CareU staff cannot alter a seller's stock without an adjustment reason.
- An expired reservation restores its units exactly once, even if the release job runs concurrently with a checkout or twice in a row.

---

## 5. Cart, checkout and pricing

### 5.1 Confirmed (C)
- Customer account required; **no guest checkout**.
- Cart is **browser-only**.
- The server revalidates price, stock, discount, delivery fee, tax and totals at checkout. Client totals are never trusted.
- Multi-seller checkout is **all-or-nothing** for required items: reserve all stock in one transaction; any failure rolls the whole attempt back.
- Orders keep full historical snapshots (title, SKU/variant, unit price, quantity, discount, delivery fee, tax, commission).
- Multiple saved delivery addresses.
- Customer sees the actual charge currency before confirming.

### 5.2 Recommended (R) — the checkout transaction protocol (normative)
- One `CheckoutAttempt` per submission, keyed by an **idempotency key**, carrying the pricing and address snapshots used for the attempt. Replaying the same key returns the original result instead of creating a second order. The idempotency key is inserted **before** any reservation work.
- **Stock is reserved at checkout submission** (the cart is browser-only, so there is no earlier moment), with a short TTL (default 10 minutes). A background job releases expired reservations.
- **`stock` means available-to-sell** = physical on-hand − units held by active reservations. It is decremented once, at reservation, and restored on release/expiry. There is **no** second subtraction for a reservation anywhere.
- **The all-or-nothing protocol** (single transaction, PostgreSQL `READ COMMITTED`):
  1. Insert `CheckoutAttempt` under the idempotency key (step 1, before locking anything).
  2. Lock the offers in a **deterministic order** (`SELECT … FOR UPDATE … ORDER BY offer.id`) so two concurrent checkouts sharing offers cannot deadlock.
  3. Revalidate offer/shop status, price, quantity limits against the **database**, never the client.
  4. Per line, in the same deterministic order: `UPDATE offer SET stock = stock - :qty, version = version + 1 WHERE id = :id AND stock >= :qty`; **assert exactly 1 affected row**, or the whole transaction rolls back.
  5. Write the `SALE` stock movement and the `ACTIVE` reservation.
  6. Snapshot pricing (allocation → delivery → tax → total).
  7. Create order/seller orders/lines; earnings except first-party.
  8. Create payment/allocation rows and the balanced ledger entries; assert balance.
  9. Commit.
- **The gateway is called outside the transaction.** Online flow: (phase 1) commit the order with `Payment.status = PENDING` and stock reserved; (phase 2) call SSLCommerz outside any transaction and store the gateway reference; (phase 3) settle on a **signature-verified** callback or a reconciled gateway query. A browser redirect never settles.
- **Reservation ↔ payment-confirmation gap:** if payment is never confirmed, the reservation expires and is released, and reconciliation moves the orphaned attempt/order to an expired/cancelled state. This closes the gap without trusting the browser.
- **Crash recovery:** the reservation and its expiry are committed with the order, so a crash before the release job is safe (units stay held, never oversold). The release job re-scans `(status, expiresAt)` on every pass and holds no in-memory state; `JobRun` records the last success.
- **Idempotent release:** release and conversion are **conditional** transitions (`ACTIVE → EXPIRED`/`CONVERTED`); only the winner posts the compensating movement, so stock is never released and sold.
- Checkout totals are computed in a fixed order: line subtotals → promotion allocation (§9) → delivery per seller shipment → tax (currently zero) → grand total. Every step is snapshotted.
- Money is integer **poisha**; `formatPrice` renders BDT with 2 decimals.

### 5.3 Delivery pricing (C per decision D-11)
- One **flat charge per seller shipment**, based on the delivery **district zone**; the **buyer** pays.
- No free-delivery threshold at launch. It can be added later as a rule without a schema change.
- The charge is snapshotted on the shipment and on the order.

### 5.4 Tax (C per decision D-10)
- Tax **rules** are modelled (jurisdiction, scope, rate, inclusive/exclusive, rounding, effective dating) and the applied tax is snapshotted on orders and lines — but **no tax is collected at launch** until a validated basis exists.
- No tax value is hard-coded anywhere.

### 5.5 Acceptance criteria
- A tampered client total is ignored; the server's recomputed total is what is charged.
- A multi-seller order where one seller's item is short stock creates **no** order and **no** partial stock movement.
- Replaying a checkout request with the same idempotency key yields the same order number.
- A product whose price changed after it was added to the cart is re-priced at checkout and the customer is shown the current price.
- Two concurrent checkouts for the last unit: exactly one succeeds; the loser sees a clean out-of-stock result and leaves no partial reservation or movement.
- Two concurrent checkouts that share offers in different request orders do not deadlock (deterministic lock order).
- An online order that is never paid is released by reservation expiry and the attempt is reconciled to an expired state — with no stock sold and no negative stock.
- A release job that runs twice (or races checkout completion) does not restore the same units twice.

---

## 6. Orders, fulfilment and delivery

### 6.1 Confirmed (C)
- The platform must **support** partial fulfilment, partial cancellation, partial returns and partial refunds, and preserve status history.
- Seller-managed and CareU-managed delivery.
- CareU-managed deliveries are manually assigned to staff or a courier (no courier API at launch).
- Proof of delivery is configurable: confirmation, recipient name, optional photo/signature, timestamp, staff/courier identity.
- One checkout may span several third-party sellers and CareU, producing one seller-specific fulfilment record/shipment per shop, each with its own status, tracking, delivery charge and payout eligibility.
- A single **customer order** is the customer-facing artefact; **seller orders** are the per-shop financial and operational units.

### 6.2 Recommended (R)
- `Order` (customer-level) → `SellerOrder` (per shop) → `OrderLine` (per line) → `Shipment` (per seller order; `kind ∈ OUTBOUND|RETURN`). The financial split (commission, earnings, delivery) happens at the **seller-order** level; the quantity-level split happens at the **line** level.
- Status changes are append-only events (`OrderStatusEvent`), never in-place overwrites.
- A return shipment reuses the `Shipment` model with `kind = RETURN` and `parentShipmentId`, so return delivery attempts and proof of delivery use the same machinery.
- COD: CareU owns the entire COD workflow (D-08). CareU — via its delivery staff or a CareU-coordinated courier — collects the cash at delivery; sellers are never COD custodians. Each collection is recorded as a `CashCollection` with expected amount, collected amount and shortage; cash held by a courier before it reaches CareU is tracked separately as courier-held funds. The shortage is an operational and financial exception **owned and investigated by CareU**, not a silent discrepancy (D-26, D-32).

### 6.3 Order state model (R)
- `Order.status`: PENDING → CONFIRMED → (PARTIALLY_FULFILLED) → FULFILLED → COMPLETED, with CANCELLED as a terminal branch.
- `Order.paymentStatus`: PENDING → AUTHORIZED → CAPTURED | FAILED | PARTIALLY_REFUNDED | REFUNDED, plus EXPIRED/CANCELLED.
- `Order.fulfillmentStatus`: PENDING → PARTIALLY_FULFILLED → FULFILLED, plus PARTIALLY_CANCELLED / CANCELLED.
- `PaymentStatus` and `FulfillmentStatus` are separate fields on the order **and** on the seller order. Combined status columns are forbidden.

### 6.4 Acceptance criteria
- A two-seller order shows two independent shipment statuses and two independent delivery charges.
- Cancelling one line of a multi-line seller order leaves the other lines fulfilable and the money split correct.
- Every status change is visible in the order timeline with actor, timestamp and note.

---

## 7. Payments

### 7.1 Confirmed (C)
- COD + online. BDT default. The customer sees the actual charge currency before confirming.
- A **provider-independent payment layer** with SSLCommerz as the initial online gateway behind a **validated IPN**.
- Callbacks must be verified and **idempotent**. A browser redirect is **not** proof of payment.
- Pending / failed / delayed / uncertain states are handled safely. Duplicate, delayed and uncertain notifications are reconciled before the order or stock state is finalised.
- The gateway integration sits behind an interface so another provider can be added without touching checkout.

### 7.2 Recommended (R)
- `Payment` (checkout-level) → `PaymentAttempt` (per charge attempt) → `PaymentEvent` (per IPN/webhook, unique on `(gateway, providerEventId)`).
- A single payment is allocated to seller orders via `PaymentAllocation`, so a multi-seller order reconciles per shop.
- COD orders also create a `Payment` row with method `COD` and status transitions driven by delivery outcome (captured on collection, failed on refusal/shortage).
- Every money-moving endpoint accepts an idempotency key; the key + request hash + stored response make retries safe.
- Verification of the IPN signature happens **before** any state change; an unverifiable callback is stored as `signatureValid = false` and never processed.

### 7.3 Externally verified constraints to confirm with SSLCommerz (V — pending verification)
- Whether the merchant account supports **hosted checkout** and what redirect/return URLs are required.
- Whether a **refund API** exists, whether it supports **partial** refunds, and the settlement timing.
- Whether a chargeback/dispute notification channel exists and its payload shape.
- Whether COD is a native product or handled entirely in-platform (assumed: entirely in-platform).
- Fee structure per transaction (rates, caps, FX/fees).  
**Default (approved):** CareU absorbs gateway fees at launch (D-23). This remains subject to verification of actual fees/caps; if verification shows fees cannot be absorbed, the policy must be revisited with explicit approval. **None of these may be assumed. The payment model is frozen only after verification.**

**Settlement reconciliation (no provider capability is assumed).** Whatever the gateway reports, CareU reconciles against its own books, not against an assumed capability:
- CareU's own `PLATFORM_CASH` is credited with the amount **CareU records as settled**, and the gateway fee is posted **separately** to `GATEWAY_FEES` / `PLATFORM_EXPENSES` (D-23, INV-58b) — a fee is **never** netted silently from a seller's earning.
- A `PaymentSettlement`/reconciliation step compares the **gateway-reported net settlement** for a period against the sum of `Payment` amounts CareU recorded as captured, and surfaces any difference (fee, hold, reserve, rounding) as a reconciliation item. If the gateway nets fees before settlement, the difference is expected and posted to `GATEWAY_FEES`; if it does not, the fee is charged as a separate line. **The model supports either shape without assuming one.**
- The reconciliation is a scheduled job with a `JobRun` row and an exception queue. An unreconciled difference blocks nothing operationally but is visible to finance; it is never written off automatically.
- **Do not invent gateway features.** If the gateway does not expose a settlement report or a fee line, reconciliation falls back to comparing CareU's recorded captures against the bank/gateway statement, recorded manually by finance with an audit entry. This is documented, not assumed.

### 7.4 Acceptance criteria
- A replayed IPN for an already-processed order produces no second financial effect.
- An IPN with an invalid signature changes nothing and is visible in the reconciliation queue.
- A customer who closes the browser after paying still has the order settled, via the IPN or a reconciliation query.

---

## 8. Commission, earnings, settlement and payouts

### 8.1 Confirmed (C)
- **Category-based** commission rates.
- CareU collects online payments and settles eligible seller earnings **later**.
- **Manual payout batches** recording amount, currency, method, destination reference, status and transaction references.
- Failed transfers are reconciled; retries are recorded.
- **COD is handled entirely by CareU (D-08).** CareU owns the end-to-end COD workflow: coordinating collection through delivery/courier, tracking cash collected and courier-held funds, remittances and reconciliation, investigating discrepancies and courier shortages, calculating and settling seller earnings under the commission/payout rules, coordinating COD cancellations/returns/refunds, and keeping an auditable record of every collection, remittance, adjustment and settlement. Sellers do **not** collect COD, coordinate remittances, or independently reconcile collections.
- Earnings become eligible only after delivery, expiry of the return window, and no blocking dispute.
- Eligibility is computed at **item/seller-order granularity**, so one seller's dispute does not block unrelated sellers.
- Refunds are reviewed and processed **manually** by admins.
- **CareU first-party sales are excluded from marketplace commission and produce no third-party seller balance and no seller payout liability.**

### 8.2 Policy decisions taken (C)
| Decision | Value |
|---|---|
| COD mechanics | CareU owns and operates the entire COD workflow (collection, courier custody, remittance, discrepancy investigation, settlement) end-to-end; sellers are never COD custodians (D-08, D-32) |
| Discount funding & commission base | Per-campaign configuration; **default** = platform-funded discounts reduce the commission base pro-rata; seller-funded discounts do not (D-09) |
| Payout cadence | **Weekly** batch, **minimum ৳1,000**, bank or mobile wallet, admin-approved, COD receivables netted into the same batch (D-12) |

### 8.3 Recommended (R)
- Commission rules are **effective-dated** (`CommissionRule` with `effectiveFrom`/`effectiveTo`) and the applied rate is **snapshotted** onto the seller order. Historical orders are never recomputed.
- `SellerEarning` is one row per seller order, carrying gross, commission, discount adjustment, delivery share, net, status (PENDING → ELIGIBLE → PAYABLE → PAID, or BLOCKED with a reason), `eligibleAt` and the batch period key.
- **Earning ≠ money movement (D-26).** `SellerEarning` is the *eligibility/obligation* record; the ledger is the *money*. The two reconcile: `Σ ELIGIBLE/PAYABLE netAmount == SELLER_PAYABLE − SELLER_RECEIVABLE` per shop.
- **COD separates cash, earning and payout.** The seller's earning becomes eligible after delivery/return-window/no-dispute **independently of whether COD cash has been remitted**; a failed/uncertain remittance is not treated as collected. COD is netted into the payout (D-12); the netted result is snapshotted on the payout.
- **When a seller receivable arises (D-31).** On COD collection the cash is held by CareU/courier; the amount owed to the seller is recorded as a **`SELLER_RECEIVABLE`** at that moment, distinct from the `SELLER_PAYABLE` posted at order capture. The receivable is settled when the COD cash is remitted/netterd into the payout. The seller's ledger balance is always `Σ SELLER_PAYABLE − Σ SELLER_RECEIVABLE`, and it must equal `Σ ELIGIBLE/PAYABLE netAmount` (INV-56a); `RECONCILE_LEDGER` asserts this per shop.
- **COD discrepancy investigation is CareU's responsibility; loss allocation is explicit and evidenced (D-32).** An unresolved COD discrepancy (shortfall, missing courier-held cash, over-collection, refused/partial payment) stays as an **open reconciliation item** (`COD_SHORTAGE_PENDING` for a shortfall) with its `CashCollection` reference. **CareU investigates it** (courier/staff remittance record vs. `DeliveryAttempt.codCollected`). It is **never automatically classified as seller debt and never automatically booked as a confirmed CareU expense.** It is closed only by an approved, reasoned, **evidenced** `FinancialAdjustment` that resolves it one of three ways: recovered from the responsible custodian; absorbed by CareU (`PLATFORM_EXPENSES`, a deliberate write-off); or — only if evidence establishes seller responsibility — charged to the seller. Every investigation and resolution is audited.
- **Post-payout corrections never reopen a completed payout (D-31).** A late return, an upheld dispute, a chargeback or a fee discovered **after** a payout is `PAID` is recorded as a **new approved `FinancialAdjustment` + reversing `LedgerEntry` pair** leaving a `SELLER_RECEIVABLE` (seller owes CareU) or `SELLER_PAYABLE` (CareU owes the seller), recovered on the **next** payout. A `PAID` payout's amount, transfer reference and `nettingSnapshot` are immutable — history is never rewritten.
- Balances are **derived** from the append-only ledger (single source of truth); a materialised balance table risks drift and is not introduced.
- A payout batch is prepared from ELIGIBLE earnings, then approved by a second authorised person before any transfer is recorded.
- **Sub-threshold earnings roll forward:** an `ELIGIBLE` earning below the ৳1,000 minimum is not discarded — it accumulates until it crosses the threshold in a later batch.
- **Failed transfers never mark earnings paid.** A failed payout leaves the earnings payable/eligible for a retry; retries carry an idempotency key and reconcile `UNCERTAIN` outcomes before re-sending, so the same money is never sent twice.
- Payouts to first-party shop earnings are impossible by construction: the first-party shop never creates a `SellerEarning` with a payable amount, and the payout builder excludes first-party shops explicitly as a second guard.

### 8.4 Financial ledger (R)
- Append-only `LedgerEntry`: fixed account set (`PLATFORM_CASH`, `PLATFORM_REVENUE`, `PLATFORM_COMMISSION`, `SELLER_PAYABLE`, `SELLER_RECEIVABLE`, `DELIVERY_REVENUE`, `REFUNDS`, `TAX_PAYABLE`, `GATEWAY_FEES`, `PLATFORM_EXPENSES`, `PLATFORM_ADJUSTMENT`, `COD_SHORTAGE_PENDING`), signed integer poisha, currency, references to the source document (`orderId`, `sellerOrderId`, `paymentId`, `refundId`, `payoutId`, `shipmentId`), optional `reversalOfId`. 
- **Account classification:** accounts are classified by purpose (cash/receivables/payables/revenue/expenses/adjustments). The same source transaction may post to multiple accounts; classification is distinct from `SellerEarning` and from the earning eligibility state.
- **Gateway fees:** CareU absorbs gateway fees by default at launch (D-23). Fees are posted to `GATEWAY_FEES`/`PLATFORM_EXPENSES` and **not** silently deducted from seller earnings. Fee allocation is recorded per `Payment`/`PaymentAttempt`.
- **COD discrepancies (D-08/D-32):** unresolved COD shortages (`CashCollection.shortageAmount`) are **outstanding reconciliation items owned and investigated by CareU**. They are **not** auto-assigned to CareU or the seller, and are not automatically booked as a confirmed CareU expense. A discrepancy (shortage, missing courier-held cash, over-collection) remains in reconciliation until CareU closes it with an explicit, reasoned, **evidenced** `FinancialAdjustment` + audit trail, resolving it one of three ways: recovered from the responsible custodian, absorbed by CareU (`PLATFORM_EXPENSES`), or — only on evidence of seller responsibility — charged to the seller. Courier-held cash before receipt by CareU is tracked separately (`CashCollection.custodyAmount`) from cash received (`receivedByCareuAmount`).
- **Adjustments:** `FinancialAdjustment` requires reason, approver, and produces balanced ledger entries. Arbitrary manual postings are prevented by workflow (draft → approved → posted) and audit.
- Every document (order, refund, payout, adjustment, collection) writes a **balanced set** of double-entry postings in integer poisha: each `LedgerEntry` carries `DEBIT` or `CREDIT`, and `Σ DEBIT == Σ CREDIT` **for that document** is asserted in code **before commit**. A nightly audit job (`RECONCILE_LEDGER`) re-asserts it per document and per seller scope; an imbalance is an alert, never a silent fix. Corrections are **reversing entry pairs**, never edits (D-28).
- **Debit/credit convention (fixed):** every account has a normal side. `CASH`, `RECEIVABLE`, `EXPENSE` and `ADJUSTMENT` accounts are debit-normal; `PAYABLE` and `REVENUE` accounts are credit-normal. The account's signed balance is `Σ DEBIT − Σ CREDIT` when debit-normal and `Σ CREDIT − Σ DEBIT` when credit-normal. A posting that would drive a debit-normal account negative (e.g. `PLATFORM_CASH` below cash actually held) is a reconciliation alert, not an automatic correction.
- **Scope of the engine (explicit):** this is a **document-level balanced ledger**, not a general accounting system. It has no period close, no cost centres and no trial balance beyond the per-document/per-scope assertions above. That is the deliberate boundary; extending the fixed account enum later is a migration, not a rewrite.

### 8.5 Acceptance criteria
- The sum of a seller's earnings equals the sum of their ledger balances at every point in time.
- A blocked dispute on seller A delays only seller A's payout; seller B is paid on schedule.
- A failed bank transfer is recorded with its reference and failure reason, retried, and never double-counted. A failed payout never marks earnings as `PAID`; retries are idempotent and reconciled against actual transfer outcomes.
- Earnings below the approved ৳1,000 payout threshold remain `ELIGIBLE` and roll forward across periods; they do not disappear.
- Partial returns, refunds, disputes, and reversals adjust only the affected seller-order/item obligations.
- A first-party sale appears in CareU revenue and margin reporting and in **no** seller balance, commission or payout.

---

## 9. Discounts and promotions

### 9.1 Confirmed (C)
- Coupons and campaigns with eligibility and usage limits.
- Funded by CareU, sellers, or both.
- Multi-seller discounts are allocated **proportionally across eligible items**, with traceable funding and allocation.
- Seller earnings and commission treatment are configurable per campaign.
- Allocations are snapshotted.

### 9.2 Recommended (R)
- One `Promotion` model with `kind ∈ COUPON | CAMPAIGN`; a coupon is a promotion with a code. Avoids two near-identical tables.
- Funding source and commission treatment are attributes of the promotion, with the pro-rata default from D-09.
- `PromotionRedemption` records each use, enforcing per-user and total usage limits and preserving the funding split for audit.

#### Discount allocation and rounding (C per decision D-25 — normative)
- Allocation is **proportional to each eligible line's base**, then assigned with **largest-remainder rounding**: floor each share, then give the remaining poisha to the largest fractional remainders, **one poisha at a time**.
- **Ties are broken deterministically** by ascending `orderLineId` (creation order). The result must not depend on iteration or map order — the same inputs always produce the same allocation.
- **The same rule applies to the funding split (D-29).** For a `MIXED` promotion, each line's allocated discount is split between the CareU-funded and seller-funded shares by the **same floor + largest-remainder method**, applied **per line**, one poisha at a time; a tie on a single line resolves to the **CareU share first**. The funding split is therefore integer-exact too.
- `Σ allocated == discountTotal` **and** `Σ careuFunded + Σ sellerFunded == discountTotal` are **asserted before commit**; a mismatch aborts the transaction.
- Funding (CareU / seller / mixed) and the commission-base effect are snapshotted **per line**; commission is charged on `lineBase − discountShare` under the default `REDUCE_BASE_PROPORTIONAL`.
- Cancellation and partial returns reverse **only the affected line's snapshotted allocation** (item discount, funding split, commission-base effect) — never a re-derivation from a later campaign.
- Line ↔ seller-order ↔ order reconciliation is asserted: `Σ line == sellerOrder == order` for the discount, the funding split and the commission base.

### 9.3 Acceptance criteria
- A ৳100 platform-funded coupon on a 3-seller cart reduces each seller's commission base by its proportional share, and the split is inspectable on the order.
- Usage limits cannot be exceeded under concurrent checkout (unique constraint + transaction).
- A discount that does not divide evenly into poisha allocates exactly the full amount (no lost or invented poisha), and repeating the computation yields the identical per-line result.
- Reversing one line of a discounted multi-seller order reverses only that line's allocation and funding split.

---

## 10. Returns, refunds, disputes and support

### 10.1 Confirmed (C)
- Configurable return-eligibility and deadline **settings**; actions gated on item and shipment status.
- Exceptions are routed to authorized review.
- Refunds go to the original method where supported.
- **COD refunds** require a manually verified payout method + admin approval + a recorded transaction reference. Because CareU owns the COD workflow end-to-end (D-08), CareU coordinates COD-related cancellations/returns/refunds; sellers never disburse COD cash.
- Disputes preserve both explanations, attachments, order/item history, decision reason, resolution and refund/settlement impact, and are decided by CareU support/admin.
- An unresolved dispute blocks **only the affected seller's** eligibility.
- Support cases link to an order or an item, have categories and priority, attachments, assignment, internal notes invisible to customers, status history and resolutions.
- Support operations are **separated** from financial operations (a support agent cannot approve a refund).
- Partial refunds (full and item/quantity-level) are supported.

### 10.2 Policy decisions taken (C)
| Decision | Value |
|---|---|
| Return window | **7 days** from delivery (D-13) |
| Return shipping cost | **Customer** pays; **not refunded**. Defect / wrong-item / damaged-on-arrival cases are borne by the **seller** and fully refunded including return shipping (D-13) |
| Refund amount | Refunded to the original method; the 7-day window also governs the refund deadline for non-defect cases |

### 10.3 Recommended (R)
- `ReturnRequest` is per order line + quantity, with `windowExpiresAt` computed from the line's delivery timestamp at request time and snapshotted.
- `Refund` is a header (order, seller order, payment, method, status, reason, approver, gateway/manual reference) with `RefundLine` children carrying the line, quantity, amount and component (item / delivery charge / tax).
- A refund to a COD order **cannot** reach `COMPLETED` without an admin approval record, a verified destination and a transaction reference — enforced in the service layer, not only in the UI.
- **Refund states and safety (D-30).** `REQUESTED → APPROVED → PROCESSING → COMPLETED | FAILED`, with `REJECTED` from `REQUESTED`/`APPROVED`. **Only an `APPROVED` refund may move money.** Money-moving refunds carry an idempotency key. A refund whose gateway outcome is inconclusive stays `PROCESSING` and is **reconciled against the gateway before any retry** — a timeout is never assumed to be a failure, and a success is never assumed from a redirect.
- **Fallback when the gateway refund capability is unavailable or unverified (O-6).** If the gateway exposes no refund API, or verification has not confirmed one, an online refund **falls back to `MANUAL_TRANSFER`** with an admin approval, a verified destination and a recorded reference. The fallback is a first-class path in the model from day one (INV-52), not an afterthought — a missing provider capability never strands a customer or blocks the refund queue.
- Refund ledger entries are posted **only on `COMPLETED`**, as reversing entries against the original sale; a `FAILED` refund posts nothing. `Refund`/`RefundLine` snapshots are immutable once written.
- `Dispute` is a separate object from `SupportCase` (different lifecycle, different blocking semantics) but may be linked to a case. `DisputeMessage` keeps both sides' explanations with attachments.
- Blocked earnings carry a `blockedReason` referencing the blocking dispute, so the seller can see why an earning is held.

### 10.4 Acceptance criteria
- A return request filed on day 8 against a 7-day window is rejected with a clear reason and no state change.
- A quantity-2 line can be partially refunded for 1 unit; the remaining unit stays fulfilled and reviewable.
- A support agent cannot complete a refund approval (permission check, audited on attempt).
- A dispute on one seller order does not change the eligibility date of any other seller order in the same order.

---

## 11. Customer account, reviews and notifications

### 11.1 Confirmed (C)
- Account wishlist, multiple delivery addresses.
- **Verified-purchase reviews only** — one review per eligible purchased product. Editing and reporting are supported.
- **Email + in-app notifications** with history and status.

### 11.2 Recommended (R)
- A review is bound to a specific `OrderLine` with a unique constraint, which enforces "one review per eligible purchased product" at the database level.
- Review publication: **auto-publish**, with report-driven moderation and takedown. The moderation mode is a platform setting, so the "pre-moderation" policy can be switched on without a schema change. This is my recommendation, not a confirmed policy (see §11.3).
- Notification dispatch uses an **outbox** written in the same transaction as the business change, so a committed order can never lose its confirmation email. A background worker drains the outbox and retries failures. No broker required.
- `NotificationPreference` lets a user mute categories per channel.

### 11.3 Unresolved (U)
- Review moderation mode: auto-publish (recommended) vs. pre-moderation. Low blast radius because it is a setting, but it changes the review pipeline, so it needs your confirmation.

### 11.4 Acceptance criteria
- A user who never purchased a product cannot review it; the server rejects the submission.
- A second review attempt for the same purchased product fails.
- Every notification sent is queryable with its channel, status and failure reason.

---

## 12. Storefront configuration and publishing

### 12.1 Confirmed (C)
- A **visual homepage section builder** with section ordering, visibility, content, images and supported settings.
- **Global design tokens** for colours and other approved theme properties.
- **Limited, validated** section-level overrides.
- Navigation, category menus, footer links and promotional links are admin-editable.
- Supported landing and informational pages.
- **Preview before publishing.**
- **Separate draft and published versions.** Draft changes must never leak into the live storefront.
- **Revision history and rollback.**
- Explicit publishing permissions and an audit trail.
- Validated configuration and **predefined component types** — no administrator-supplied code or CSS.
- Publishing validates the complete configuration and produces a consistent, recoverable published version.
- Homepage sections reference actual catalogue products, categories or promotions instead of duplicating product data.
- Checkout logic, security-sensitive behaviour, fundamental templates and unsupported layouts stay under developer control.

### 12.2 Recommended (R)
- **Three-layer model:**
  1. `StorefrontPage` — the identity of an editable surface (`scope`, `pageKey`, `slug`, SEO fields, `activeRevisionId`).
  2. `StorefrontDraft` — one mutable working copy per page; the only thing editors write to.
  3. `StorefrontRevision` — an **immutable** published snapshot with `revisionNumber`, checksum, publisher and timestamp.
- Publishing = validate the draft → write a new immutable revision → point `StorefrontPage.activeRevisionId` at it. Rollback = clone an old revision's content into a **new** revision and publish that (history is never rewritten).
- The live storefront reads **only** `activeRevisionId`. Drafts are reachable only through a preview route that requires a publishing permission and an explicit `?preview=` token.
- Structural, translatable, link-based navigation (header menu, footer links) is stored in **tables** (`NavigationMenu`, `NavigationItem`), because it must be queried and validated. Visual, ordered, image-bearing homepage sections live in the **draft JSON**, validated against a typed section registry (`HERO`, `CATEGORY_GRID`, `PRODUCT_CAROUSEL`, `PRODUCT_GRID`, `PROMO_BANNER`, `RICH_TEXT`, `TRUST_BADGES`, `COUNTDOWN`, `TESTIMONIALS`, `FAQ`).
- Theme tokens live in a `THEME`-scoped draft and are validated against a **closed registry** of allowed token keys and value formats (colour hex/rgb/oklch, radius scale, spacing scale, font choice). Arbitrary CSS strings are rejected at validation time.
- The section registry is a code-level allow-list. A section type that does not exist in the registry cannot be stored, so "administrator-supplied code" is structurally impossible.
- The current static mega menu in `lib/catalog/menu.ts` is the seed for the navigation tables; the file's stable `getMenu()` contract stays so the header component does not change.

### 12.3 Acceptance criteria
- Editing a draft and reloading the live storefront shows **no** change.
- A published revision can be rolled back to any earlier revision, and the rollback itself appears in the history.
- A draft containing an unknown section type, an unregistered theme token or a dangling product/category reference **fails validation** and cannot be published.
- A draft referencing a deleted product fails validation at publish time (not at render time).
- Every publish, rollback and preview action is audited with the actor and the revision numbers involved.

---

## 13. Infrastructure, security and operations

### 13.1 Confirmed (C)
- Vercel behind Cloudflare. Local PostgreSQL for development, Neon PostgreSQL for production.
- **Cloudflare R2** for product media and private files. **Bunny Stream** for video.
- **SSLCommerz** as the initial online gateway, subject to merchant onboarding and capability verification.
- BD-first operations, **BDT-only transactions at launch**.
- Provider integrations replaceable where valuable (payments, storage, notifications, delivery) without speculative abstraction.
- Seller verification documents and proof-of-delivery media live in **private, access-controlled** storage, served through **time-limited signed URLs** with an auditable access log. **Every access** to sensitive/private documents must be recorded in an auditable access log (actor, document reference, timestamp, access purpose where applicable, outcome). Authorization and private-storage access are separate from the audit record. Private-document contents, signed URLs, or secrets must not appear in ordinary application logs.
- Uploaded files: server-side type and size validation, never trusting the client's content type, never served from a public path.
- Secrets in environment variables; never committed; never echoed into logs.
- Managed database backups, documented recovery, and **periodic restore tests**.
- Configurable data retention per record type. Account deletion anonymizes rather than hard-deleting rows carrying financial or audit obligations.
- Payment callbacks: verify signature, reject replays, idempotent handlers.
- Audit trails are append-only for sensitive admin, financial, pricing, inventory, seller-trust, moderation and settlement actions.
- Rate limits on registration, OTP, checkout, refunds, support intake beyond the Better Auth defaults.
- **Customer order tracking requires authentication at launch** unless a secure token-based alternative is explicitly justified and approved. Public order tracking without login is **not** enabled by default. If considered, only a secure, scoped, time-limited, single-order token may be used (never guessable IDs).

### 13.2 Recommended (R)
- `PRIVATE` and `PUBLIC` R2 buckets; a `MediaAsset` row records bucket, key, mime, size, checksum, uploader and retention date. Private media is served by a short-lived signed-URL route that checks permission and writes an access-log row. The signed-URL route never logs the URL itself, only the reference and outcome.
- Private media is **not** routed through `next/image` optimisation (signed URLs expire and the optimiser would cache them); product media **is**, once `images.remotePatterns` allow-lists the R2 host.
- Background jobs (reservation expiry, earning eligibility, outbox dispatch, reconciliation, ledger balance check, document retention sweep) run as idempotent, re-runnable tasks with a `JobRun` audit row, triggered by a scheduled endpoint. No broker at launch. Crash recovery: on restart, jobs re-scan for work rather than relying on in-memory state; `JobRun` records the last successful run so a delayed job is detectable and reconcilable.
- Structured logs with request id, actor, action, entity — never secrets, session tokens, full OTPs or unmasked personal data.
- A test runner is **required** before any change touching permissions, inventory, payments, orders, refunds or commissions is "done". **Recommendation: Node's built-in `node --test` with Node 24 native TypeScript** — zero new dependencies.

### 13.3 Known technical risks (A — verify at implementation time)
| # | Risk | Mitigation |
|---|---|---|
| R-1 | Local PG is 18.1, Neon runs 16/17 | No PG18-only features (`uuidv7()`, virtual generated columns); generate IDs in the app; no `MERGE … RETURNING` if PG16 is the target |
| R-2 | `cf-connecting-ip` is the only IP source | If the header is missing in production, all traffic shares one rate-limit bucket — verify and define a fallback before launch |
| R-3 | Neon pooled endpoint + interactive transactions | Checkout reservation and payout batches are long transactions; a direct connection may be required (`DIRECT_DATABASE_URL` still pending) |
| R-4 | `BigInt` does not serialise to JSON | All money crosses an explicit boundary converter; never return raw `BigInt` to a client component |
| R-5 | `cacheComponents: true` + dashboards | Every dashboard route must be dynamic; a shared cache scope holding user data is a cross-user leak — a review item on every dashboard PR |
| R-6 | Better Auth CLI rewrites `prisma/schema/` | The 2FA plugin adds a field to `User`; settle auth plugins **before** the main schema build, then hand-add relations to `auth.prisma` and document the re-run procedure |
| R-7 | Prisma 7 CLI resolution | Never use `npx prisma@latest` (Prisma 8 is RC and breaks the toolchain); use the pinned local CLI |
| R-8 | BD regulatory obligations (invoice content/numbering, VAT, consumer return rights, e-commerce registration) | **Not verified.** Requires a qualified Bangladesh professional. Flagged, not assumed. |

### 13.4 Regulatory gating (verify before launch — O-7, O-14)

- The platform may be **built and verified** before regulatory review; it may not **launch a regulated category** before review.
- Invoice content/numbering, VAT registration/applicability, and consumer-return-rights alignment (which may override the 7-day default, D-13) are **not verified**. Until a qualified Bangladesh professional signs off, affected **categories stay unpublished** and no promotional message implies a legal claim.
- Tax is modelled but **not applied at launch** (D-10); enabling a tax rule requires the same sign-off and is a configuration change, not a schema change.
- This is a **feature/category gate**, not a global launch blocker: the non-regulated catalogue can go live while regulated categories remain unpublished.

---

## 14. Requirements → data model mapping (summary)

| Requirement area | Primary entities (see `docs/data-model.md`) |
|---|---|
| Identity, RBAC, MFA | `User` (Better Auth), `Role`, `Permission`, `RolePermission`, `UserRoleAssignment`, `StaffInvitation`, `TwoFactor` (Better Auth) |
| Seller onboarding | `SellerApplication`, `SellerApplicationDocument`, `SellerApplicationReview`, `Shop`, `Supplier` |
| Catalogue | `Category`, `CategoryAttribute`, `CategoryAttributeOption`, `Product`, `ProductVariant`, `ProductAttributeValue`, `ProductMedia`, `Brand`, `Offer` |
| Inventory | `InventoryLocation`, `StockMovement`, `StockReservation`, `SupplierReceipt`, `SupplierReceiptLine`, `PlatformCost` |
| Checkout | `CheckoutAttempt`, `Address`, `District`, `Promotion`, `PromotionRedemption`, `DeliveryRate`, `DeliveryZone`, `TaxRule`, `IdempotencyKey` |
| Orders | `Order`, `SellerOrder`, `OrderLine`, `OrderStatusEvent`, `Shipment`, `DeliveryAttempt`, `ProofOfDelivery`, `CashCollection` |
| Payments | `Payment`, `PaymentAttempt`, `PaymentEvent`, `PaymentAllocation`, `Refund`, `RefundLine` |
| Commission & settlement | `CommissionRule`, `SellerEarning`, `LedgerEntry`, `PayoutBatch`, `Payout`, `PayoutEarning`, `PayoutAttempt`, `FinancialAdjustment` |
| Returns & support | `ReturnRequest`, `Dispute`, `DisputeMessage`, `SupportCase`, `SupportCaseMessage`, `SupportCaseAttachment`, `CaseStatusEvent` |
| Customer | `WishlistItem`, `Review`, `ReviewReport`, `Notification`, `NotificationPreference`, `MediaAsset` |
| Storefront CMS | `StorefrontPage`, `StorefrontDraft`, `StorefrontRevision`, `NavigationMenu`, `NavigationItem` |
| Platform ops | `AuditLog`, `DocumentAccessLog`, `JobRun`, `OutboxMessage`, `PlatformSetting` |

---

## 15. Deferred to a later phase (D)
Offer-level product media; serial/warranty tracking; automated payouts; external search service; multi-currency display; public API for third parties; buyer-side split shipment; subscription/repeat orders; gift cards; multi-warehouse seller fulfilment.

# 0001. Marketplace domain model

**Date**: 2026-11-12
**Status**: Accepted

## Summary

This decision defines one foundational data model for CareU.bd so sellers, CareU's first party shop, catalog listings, inventory, orders, payments, fulfillment, money records, and support records all fit together consistently. It keeps one shared commerce pipeline for third party sellers and CareU while protecting the required boundary that CareU sales never create third party commission, seller balance, or payout liability. The model is designed around immutable snapshots, append only money and audit records, separate payment and fulfillment status, and clear ownership scope so later slices can build safely without rewriting core tables.

## Requirements

**User stories**:
- As a platform engineer, I want one consistent marketplace schema so that every slice (catalog, checkout, payments, fulfillment, money, and support) uses the same records and relationships.
- As a marketplace operator, I want CareU and third party sellers to share the buying flow while keeping their money treatment separate so that first party sales are never mixed into seller commissions or payouts.
- As a customer, I want my order to keep an accurate record of what I bought, paid, and received so that later changes to products, prices, or policies do not rewrite my history.
- As a seller or platform staff member, I want protected records to carry clear ownership and history so that access can be checked on the server and actions can be audited.

**Acceptance criteria** (the contract, each criterion is independently checkable):
- **AC-1**: The model can represent users, seller applications (individual and business), verification documents, shops, and minimal shop membership, including one shop per owner account, shop status (active, paused, suspended), trusted seller state, and a first party flag for the CareU shop.
- **AC-2**: The model can represent a shared catalog and independent sellable offers: categories (tree) with attributes and restriction flags, shared product definitions and optional shared variants, seller listings that link to a shared product or stand alone as unique listings, seller owned listing variants or SKUs with price in integer poisha, SKU, status, and stock ownership, and listing media.
- **AC-3**: The model can represent one customer checkout as a parent Order with immutable snapshots and per shop Shipments and OrderItems (including CareU and multiple third party sellers), with separate payment status and fulfillment status and preserved status history (fulfillment and payment). All money snapshots are stored as integer BDT poisha in `BIGINT` columns.
- **AC-4**: The model can represent stock locations, inventory balances, append only stock movements with reasons, and stock reservations with status, expiry, and idempotency support so all or nothing multi shop checkout and safe release can be implemented without overselling.
- **AC-5**: The model can represent provider agnostic payments (including cash on delivery and online), idempotent payment callback or webhook events, refunds, and COD collection, remittance, and reconciliation records with canonical states that support delayed, uncertain, duplicate, and reconciled outcomes.
- **AC-6**: The model can represent append only financial ledger entries, commission rule references, payout batches and payout items, and discount or tax snapshots on orders and lines, while ensuring first party shop sales never create third party seller commission, seller balance, or payout liability. Commission snapshots on order items include rate/basis/amount fields needed for audit, and discount funding/allocation snapshots are representable (CareU-funded vs seller-funded) without hard-coding pending policy values.
- **AC-7**: The model can represent post purchase and trust records tied to orders, shipments, items, or listings as applicable: reviews (verified purchase), support cases and messages (including internal notes), disputes with evidence and resolution, notifications with channel and status history, and append only audit logs.
- **AC-8**: Every protected record carries server side ownership or scope anchors (customer, shop, platform, or actor as appropriate), and persisted customer data includes saved addresses and wishlist records while the cart remains browser only with checkout and order snapshots.
- **AC-9**: The model supports partial fulfillment, partial cancellation, partial returns, partial refunds, and disputes at item or shipment granularity with recorded reasons and money impact, without blocking unrelated sellers' eligibility by structure.

## Decision

**Chosen option**: Option 1, one foundational domain model with shared entities and explicit boundaries.

Define a single coherent Prisma schema foundation for the marketplace. Use a shared `Shop` entity with `isFirstParty` for CareU and third party sellers; a shared `Product` definition plus seller owned `Listing` and `ListingVariant` (sellable SKU) records for shared and unique catalog offers; a parent `Order` with per shop `Shipment` records and snapshotted `OrderItem` records; separate `Payment` and `PaymentEvent` records for canonical state and idempotent callbacks; append only `StockMovement`, `FinancialLedgerEntry`, status history, and `AuditLog` records; and persisted `SavedAddress` and `Wishlist` records while keeping cart browser only. All money values are integer poisha, snapshots are immutable, payment status is separate from fulfillment status, and protected records include customer, shop, or platform scope anchors. Detailed RBAC permissions and enforcement rules are deferred to feature 2, but minimal membership and scope structures are included now.

**Implementation skills**: `prisma-client-api` (project stack, Prisma client usage and query patterns) · `prisma-cli` (project stack, Prisma schema and migration workflow)

## Feature design

**Data model sketch** (target, grouped by cluster; key fields, nullability intent, and relationships):

**Identity, sellers, shops**
| Entity | Key fields (PK, FK, important columns) | Notes / cardinality |
|---|---|---|
| `User` (existing) | `id` PK, `name`, `email` unique, `phoneNumber` unique nullable, verification flags, timestamps | Existing Better Auth model; referenced by owned records. |
| `SellerApplication` | `id` PK, `applicantUserId` FK User, `type` (individual/business), `status`, business/profile fields, `submittedAt`, `reviewedByUserId` FK User nullable, `reviewedAt`, `rejectionReason`, timestamps | 1 User to many applications (resubmissions/history). Review history recorded as fields and/or child history records. |
| `SellerVerificationDocument` | `id` PK, `sellerApplicationId` FK, `documentType`, `storageKey` (private), `mimeType`/size metadata, `status`, review notes, timestamps | 1 application to many documents. Private R2 references only. |
| `Shop` | `id` PK, `ownerUserId` FK User, `slug` unique, `name`, `isFirstParty` bool, `status`, `isTrusted` bool, approval/suspension metadata, timestamps | 1 owner to 1 shop. CareU is a shop with `isFirstParty=true`. |
| `ShopMembership` | `id` PK, `shopId` FK Shop, `userId` FK User, `membershipRole`/label placeholder, `status`, `invitedByUserId`, timestamps | Unique(`shopId`,`userId`). Minimal structure for feature 2 RBAC. |

**Catalog and listings**
| Entity | Key fields (PK, FK, important columns) | Notes / cardinality |
|---|---|---|
| `Category` | `id` PK, `parentId` FK Category nullable, `slug` unique, names, `status`, `isRestricted`, `isProhibited`, sort/config, timestamps | Self relation tree. |
| `CategoryAttribute` | `id` PK, `categoryId` FK, `key`, label, `valueType`, `required`, options/config, timestamps | 1 category to many attributes. |
| `Product` | `id` PK, `categoryId` FK, `title`, description, brand/attributes, `status`, `createdByUserId`, timestamps | Shared catalog definition. |
| `ProductVariant` | `id` PK, `productId` FK, option values/attributes, timestamps | Optional shared variant definition; 1 product to many variants. |
| `Listing` | `id` PK, `shopId` FK Shop, `productId` FK Product nullable, `categoryId` FK, `title`/description/attributes (required for standalone), `moderationStatus`, `publishStatus`, timestamps | Nullable `productId` means unique standalone listing. 1 shop to many listings. |
| `ListingVariant` | `id` PK, `listingId` FK Listing, `productVariantId` FK ProductVariant nullable, `sku`, `pricePoisha` int, `compareAtPoisha` int nullable, `currency` ('BDT'), `status`, option/attribute snapshot, timestamps | Seller owned sellable SKU. Independent price and stock per seller. |
| `ListingMedia` | `id` PK, `listingId` FK, `listingVariantId` FK nullable, `storageKey`/public URL ref, `mediaType`, `sortOrder`, `altText`, timestamps | Public product media references. |

**Inventory, reservations, addresses, wishlist**
| Entity | Key fields (PK, FK, important columns) | Notes / cardinality |
|---|---|---|
| `StockLocation` | `id` PK, `shopId` FK Shop nullable/platform scope, `name`, `type`, `isDefault`, address/meta, timestamps | Ready for multi location; one CareU location at launch. |
| `InventoryBalance` | `id` PK, `listingVariantId` FK, `stockLocationId` FK, `onHand` int, `reserved` int, `lowStockThreshold` int nullable, timestamps | Unique(`listingVariantId`,`stockLocationId`). Availability derived by rules. |
| `StockMovement` | `id` PK, `listingVariantId` FK, `stockLocationId` FK, `reason` enum, `quantityDelta` int, `referenceType`, `referenceId`, `actorUserId` FK nullable, `note`, `createdAt` | Append only. Reasons include sale, reserve, release, return, restock, damage, adjustment. |
| `StockReservation` | `id` PK, `checkoutKey`/`orderId` ref, `listingVariantId` FK, `stockLocationId` FK, `quantity` int, `status`, `expiresAt`, `idempotencyKey`, timestamps | Unique idempotency scope as needed. Supports active, committed, released, expired. |
| `SavedAddress` | `id` PK, `userId` FK User, label, recipient, phone, address fields (district/division/area/postal/lines), `isDefault`, timestamps | 1 user to many addresses. |
| `Wishlist` | `id` PK, `userId` FK User unique, timestamps | 1 user to 1 wishlist. |
| `WishlistItem` | `id` PK, `wishlistId` FK, `listingId` FK or `listingVariantId` FK, `addedAt` | Unique per wished item. Cart is not a persisted table. |

**Orders and fulfillment**
| Entity | Key fields (PK, FK, important columns) | Notes / cardinality |
|---|---|---|
| `Order` | `id` PK, `orderNumber` unique, `customerUserId` FK, `paymentStatus`, `fulfillmentStatus`, `currency` ('BDT'), fx snapshot fields, subtotal/discount/delivery/tax/total poisha snapshots, `placedAt`, timestamps | Parent checkout record; immutable financial snapshots. |
| `Shipment` | `id` PK, `orderId` FK, `shopId` FK, `shipmentNumber` unique, `fulfillmentStatus`, `deliveryMethod`, `deliveryChargePoisha` snapshot, destination snapshot, tracking/assignment refs, timestamps | One per shop in the order. |
| `OrderItem` | `id` PK, `orderId` FK, `shipmentId` FK, `shopId` FK, `listingId` FK, `listingVariantId` FK, title/SKU/variant snapshots, `unitPricePoisha`, `quantity`, discount/tax/commission/line total snapshots, timestamps | Immutable line snapshot linked to shipment and shop. |
| `OrderStatusHistory` | `id` PK, `orderId` FK, `fromStatus`, `toStatus`, `actorUserId` nullable/system, reason, `createdAt` | Append only history. |
| `ShipmentStatusHistory` | `id` PK, `shipmentId` FK, `fromStatus`, `toStatus`, `actorUserId` nullable/system, reason, `createdAt` | Append only history. |
| `DeliveryAssignment` | `id` PK, `shipmentId` FK, assignee type/id, `status`, `assignedAt`, notes, timestamps | Manual assignment to staff or courier. |
| `ProofOfDelivery` | `id` PK, `shipmentId` FK, `type`, `recipientName`, `mediaStorageKey` nullable private, `capturedAt`, `capturedByUserId`, metadata, timestamps | Configurable proof types. |

**Payments, money, and reconciliation**
| Entity | Key fields (PK, FK, important columns) | Notes / cardinality |
|---|---|---|
| `Payment` | `id` PK, `orderId` FK, `method` (cod/online), `provider`, `providerReference`, `canonicalStatus`, `amountPoisha` int, `currency`, initiated/settled timestamps, metadata | Canonical internal payment record. |
| `PaymentEvent` | `id` PK, `paymentId` FK nullable, `provider`, `eventKey` unique (idempotency), `eventType`, `verificationStatus`, `receivedAt`, sanitized payload/meta, processing result | Append only idempotent callback/webhook log. |
| `Refund` | `id` PK, `orderId` FK, `shipmentId`/`orderItemId` nullable scope, `amountPoisha` int, `method`, `status`, reason, requested/approved actor refs, provider/transaction reference, timestamps | Manual, reasoned, auditable. |
| `CommissionRule` | `id` PK, scope/category ref, rate value (basis points or configured unit), effective period, active flag, timestamps | Config reference; rates pending policy. |
| `FinancialLedgerEntry` | `id` PK, `shopId` FK nullable, `orderId`/`shipmentId`/`paymentId`/`refundId`/`payoutBatchId` refs as applicable, `entryType`, `amountPoisha` int, direction/sign convention, eligibility/status, reason, `actorUserId` nullable, `createdAt`, metadata | Append only source of truth. No seller earning, commission liability, or payout liability entries for first party shop sales. |
| `PayoutBatch` | `id` PK, `status`, `method`, destination reference, `totalAmountPoisha` int, created/processed metadata, timestamps | Manual payout batches. |
| `PayoutItem` | `id` PK, `payoutBatchId` FK, `shopId` FK, `amountPoisha` int, `status`, transaction reference, failure reason, timestamps | 1 batch to many items. |
| `CODReconciliationRecord` | `id` PK, `orderId`/`shipmentId`/`shopId` refs as applicable, `recordType` (collected, courier_held, remitted, shortage, adjustment, etc.), `amountPoisha` int, `status` (open/resolved), evidence refs, reason, actor, timestamps | Supports CareU owned COD workflow and open discrepancy items (never auto classified). |

**Trust and operations**
| Entity | Key fields (PK, FK, important columns) | Notes / cardinality |
|---|---|---|
| `Review` | `id` PK, `userId` FK, `listingId`/`productId` ref, `orderItemId` FK, rating, body, `status`, edit/report metadata, timestamps | Verified purchase only; uniqueness per eligible purchased product scope enforced. |
| `SupportCase` | `id` PK, `customerUserId` FK, `orderId`/`orderItemId` nullable, `shopId` nullable scope, category, priority, `status`, assignee, resolution, timestamps | Linked to order or item when applicable. |
| `SupportMessage` | `id` PK, `caseId` FK, author type/id, `visibility` (customer/internal), body, attachment refs, `createdAt` | Internal notes hidden from customers. |
| `Dispute` | `id` PK, `orderId`/`shipmentId`/`orderItemId` refs, `shopId` FK, opened by, `status`, explanations, evidence refs, decision reason, resolution, money/eligibility impact refs, timestamps | Blocks only affected seller eligibility by scope. |
| `Notification` | `id` PK, recipient user ref, `channel` (email/in_app), `type`, payload/subject refs, `status`, related entity refs, sent/read timestamps, history metadata | Email and in app history. |
| `AuditLog` | `id` PK, `actorUserId` nullable/system, actor scope, `action`, `entityType`, `entityId`, `shopId` nullable, before/after or diff summary, reason, metadata, `createdAt` | Append only audit trail for sensitive actions. |

**State transitions** (key entities, target behavior):
- `SellerApplication.status`: draft/submitted -> under_review -> approved or rejected -> (resubmitted as a new application or new review cycle per history rules).
- `Shop.status`: pending/approved context -> active <-> paused (seller) and active/paused -> suspended (admin), with existing orders/shipments/disputes/settlements continuing.
- `Listing` moderation/publish: draft -> pending_review (if required) -> approved/published or rejected/hidden/removed, with sensitive edits able to re-enter review.
- `StockReservation.status`: active -> committed or released or expired (terminal transitions enforced; release/expiry safe and idempotent).
- `Payment.canonicalStatus` (separate from fulfillment): initiated/pending -> authorized_or_paid or failed or cancelled or uncertain -> reconciled/settled as applicable; duplicates and late events resolved through `PaymentEvent` idempotency.
- `Order.fulfillmentStatus` and `Shipment.fulfillmentStatus` (separate from payment): placed/confirmed -> processing/packed/shipped/out_for_delivery -> delivered (or cancelled/returned/refunded paths) with history; partial states represented at item/shipment granularity.
- `PayoutBatch/PayoutItem`, `Refund`, `Dispute`, `SupportCase`: status flows recorded with history and reasoned transitions; financial effects posted as ledger entries, not by rewriting prior entries.

**API surface** (this spec defines no HTTP endpoints; it defines key domain operations and data contracts later feature specs will implement):

| Operation | Method/shape | Key inputs | Key outputs / records | Auth | Key errors / failure handling |
|---|---|---|---|---|---|
| Checkout reserve and place order | server transaction | customer identity, selected listing variants, quantities, address, pricing inputs, idempotency key | `StockReservation`, `Order`, `Shipment` per shop, `OrderItem` snapshots, status history | authenticated customer | stock unavailable, price changed, validation failure, partial reserve attempt -> full rollback |
| Payment callback process and reconcile | verified server callback handler | provider payload/signature, provider refs, event key | `PaymentEvent` (idempotent), updated `Payment` canonical state, reconciliation outcome, audit/log refs | provider verification + server only | invalid signature, duplicate event, delayed/uncertain state, out-of-order event -> no double apply |
| Inventory movement / adjustment | server domain operation | listing variant, location, quantity delta, reason, actor, reference | `StockMovement`, updated `InventoryBalance`, audit context | authorized shop/platform actor | insufficient stock, invalid transition, unauthorized scope, missing reason for sensitive adjustment |
| Financial posting and eligibility evaluation | server domain operation | order/shipment/payment/refund/payout context, amounts in poisha, actor/reason | `FinancialLedgerEntry`, eligibility state inputs, payout batch/item refs | authorized platform/finance actor; system jobs where safe | first-party exclusion violation, duplicate posting, blocked by dispute on affected scope only, reconciliation mismatch -> open audited item |

**Value sourcing** (every value each key operation must produce or record names where it comes from):

| Operation | Value produced / recorded | Source |
|---|---|---|
| Checkout reserve and place order | Buyer, shop scope, and selected sellable items | Authenticated session (trusted server side) + client selected listing variant IDs/quantities validated against DB |
| Checkout reserve and place order | Unit price, title, SKU, variant, shop, and line totals | Read from current `Listing`/`ListingVariant` and computed server side; snapshotted onto `OrderItem` |
| Checkout reserve and place order | Delivery charge, tax, discount, commission snapshots | Computed by server rules/config at checkout (pending policies remain configurable) and snapshotted on `Shipment`/`OrderItem`/`Order` |
| Checkout reserve and place order | Stock location for each reserved item | Server selected location for that sellable SKU, resolved from inventory balances and the shop's location rules (at launch, the default or available location). The chosen `stockLocationId` is recorded on `StockReservation` and on resulting `StockMovement` records. Exact selection rules are refined in inventory and fulfillment specs. |
| Checkout reserve and place order | Reservation expiry | Server configuration (duration) recorded on `StockReservation.expiresAt` |
| Payment callback process and reconcile | Canonical payment status transition | Verified provider event mapped by provider-independent layer; stored as `PaymentEvent` plus `Payment.canonicalStatus` |
| Payment callback process and reconcile | Idempotency/deduplication key | Provider event identifier or derived stable event key stored unique on `PaymentEvent.eventKey` |
| Inventory movement / adjustment | Quantity delta and resulting balance effect | Operation input plus current balance; applied atomically and recorded in `StockMovement` with reason and reference |
| Inventory movement / adjustment | Actor and reason for sensitive adjustments | Trusted server session/actor context and required reason input; stored on movement/audit records |
| Financial posting and eligibility evaluation | Earning/commission/payout amounts in poisha | Computed from snapshotted order/refund/settlement inputs and commission/funding rules; posted as append only `FinancialLedgerEntry` |
| Financial posting and eligibility evaluation | First party exclusion | `Shop.isFirstParty` on the selling shop; first party sales produce no seller commission, balance, or payout liability entries |
| Financial posting and eligibility evaluation | Eligibility blocked scope | Dispute/return/refund state scoped to affected shipment/item/seller order context, not unrelated sellers |

**Key invariants**:
- All money is stored as integer BDT (poisha). No float and no `Decimal` for money.
- `Order`, `OrderItem`, `Shipment`, `Refund`, settlement, and payout records keep immutable financial and descriptive snapshots (currency, amounts, titles, SKU/variant, quantities, charges, tax, commission, references as applicable). Corrections are new append only records, never rewrites of historical meaning.
- `paymentStatus` and `fulfillmentStatus` are separate fields and transition independently; important state changes are recorded in history tables/records.
- A single checkout can create one parent `Order` and one `Shipment` per shop; each `OrderItem` belongs to exactly one shipment and one shop.
- `ListingVariant` (seller owned sellable SKU) is the unit for seller specific price, SKU, and stock. Inventory and reservations reference the sellable SKU and location.
- `StockMovement`, `PaymentEvent`, `FinancialLedgerEntry`, and `AuditLog` are append only. Idempotency keys prevent duplicate effects for callbacks and reservation/checkout operations.
- A `Shop` with `isFirstParty=true` participates in shared commerce flows but must never receive third party seller commission, seller balance, or payout liability ledger entries.
- COD shortages are represented as open reconciliation records and are never auto classified as seller debt or confirmed CareU expense without an explicit, reasoned, evidenced, audited adjustment.
- Stock cannot go negative through supported operations; reservations and commits are atomic and all or nothing for a checkout attempt.
- Protected records include scope anchors (for example `customerUserId`, `shopId`, platform/actor scope) sufficient for server side authorization checks.

**Security model**:
- Authorization is enforced on the server for every protected operation. Client supplied role, shop, seller, or admin flags are never trusted.
- Shop scoped data (shop profile, listings, inventory, shipments, seller visible money views, shop support context) is isolated by `shopId` and accessible only to authorized members of that shop or authorized platform actors.
- Customer scoped data (saved addresses, wishlist, orders, notifications, customer support cases, private tracking) is isolated to the owning customer or authorized platform staff with the required permission.
- Financial permissions and support permissions are separate. Sensitive actions (refund approval, payouts, settlements, stock and money adjustments, seller trust/moderation decisions) require authorized roles and create audit records with actor and reason.
- Seller verification documents and proof of delivery media are private storage references served only through controlled access (for example signed URLs) with appropriate authorization; public product media is stored and served separately.
- Order tracking and private order information require sign in and ownership or permission checks on every read. `noindex` and robots rules are not access controls.

**Configuration required**:
- None new in this spec. Existing environment variables (`DATABASE_URL`, `BETTER_AUTH_*`) remain required. Later feature specs will add storage, payment gateway, email, SMS, and other service configuration as needed.

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path: the schema can represent a seller application and approved shop, a shared or unique listing with seller owned variant SKU, a multi shop order with per shop shipments and immutable snapshots, and saved addresses/wishlist for a customer, verifies **AC-1**, **AC-2**, **AC-3**, **AC-8**.
- Happy path: payment, idempotent callback event, COD reconciliation, ledger, commission rule reference, and payout records can be stored without rewriting history and with first party exclusion representable, verifies **AC-5**, **AC-6**.
- Failure/concurrency case: reservation and stock movement records can represent an all or nothing checkout attempt, expiry/release, duplicate payment events, and auditable adjustments without negative stock or double applied effects, verifies **AC-4**, **AC-5**.
- Auth/permission case: protected records expose customer/shop/platform scope anchors so unauthorized cross shop or cross customer access can be denied by server checks, and internal support notes remain distinct from customer visible messages, verifies **AC-7**, **AC-8**.
- Partial/dispute case: returns, refunds, disputes, and ledger impacts can be scoped to affected items or shipments so unrelated sellers remain eligible, verifies **AC-9**, **AC-3**, **AC-6**.

## Build plan

This plan follows the project's Tracer Bullet approach at schema level: establish a thin, coherent foundation first (core parties, catalog, orders, payments), then thicken with inventory, money, and operations records so the model can support an end to end slice without breaking rewrites. Tasks are schema and migration work in this repository (Prisma 7 multi file schema under `prisma/schema/`, generated client, and migration).

1. [x] Create the marketplace schema foundation in Prisma: shared enums/value conventions and core identity/shop tables (`SellerApplication`, `SellerVerificationDocument`, `Shop`, `ShopMembership`) with ownership and status fields, satisfies **AC-1**, **AC-8**.
2. [x] Add catalog and listing models (`Category`, `CategoryAttribute`, `Product`, `ProductVariant`, `Listing`, `ListingVariant`, `ListingMedia`) with shared definition vs seller owned sellable SKU relationships and uniqueness constraints, satisfies **AC-2**, **AC-8**.
3. [x] Add order and fulfillment models (`Order`, `Shipment`, `OrderItem`, status history, `DeliveryAssignment`, `ProofOfDelivery`) with per shop structure, separate payment/fulfillment status fields, and immutable snapshot fields (integer poisha), satisfies **AC-3**, **AC-8**, **AC-9**.
4. [x] Add inventory and checkout support models (`StockLocation`, `InventoryBalance`, `StockMovement`, `StockReservation`) plus persisted customer records (`SavedAddress`, `Wishlist`, `WishlistItem`) and enforce browser only cart by omission, satisfies **AC-4**, **AC-8**.
5. [x] Add payment and reconciliation models (`Payment`, `PaymentEvent`, `Refund`, `CODReconciliationRecord`) with idempotency keys, canonical status fields, and auditable event storage, satisfies **AC-5**, **AC-9**.
6. [x] Add money and settlement models (`CommissionRule`, `FinancialLedgerEntry`, `PayoutBatch`, `PayoutItem`) and wire relations/scope needed to represent first party exclusion and append only financial effects, satisfies **AC-6**, **AC-9**.
7. [x] Add trust and operations models (`Review`, `SupportCase`, `SupportMessage`, `Dispute`, `Notification`, `AuditLog`) with linkage to orders/shipments/items/listings and visibility/scope fields, satisfies **AC-7**, **AC-8**, **AC-9**.
8. [x] Review relations, indexes, and constraints for real query and integrity patterns (ownership FKs, unique keys, idempotency, status/history access), generate the Prisma client, create/apply the migration in development, and verify the schema supports the critical scenarios, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-8**, **AC-9**.

## Consequences

**Positive**:
- Provides one consistent, reviewable foundation for all marketplace slices, reducing rework and conflicting assumptions.
- Makes critical correctness rules explicit in the data model: immutable snapshots, append only financial and audit records, idempotent events, separate payment and fulfillment status, and clear ownership scope.
- Supports CareU first party and third party seller flows through one pipeline while preserving strict financial separation.

**Negative / tradeoffs**:
- The initial schema and migration are larger and more complex than a minimal Slice 1 only model.
- Some tables (for example disputes, payouts, reviews) will exist before their full feature behavior is implemented, so later specs must complete their workflows carefully.
- Pending policy values (commission rates, return windows, payout cadence, delivery pricing details, retention periods) remain unresolved and must be configured later without changing historical snapshots.

**Neutral**:
- Detailed RBAC permission catalogs and enforcement logic are intentionally deferred to feature 2; this spec provides scope anchors and minimal membership structures only.
- Cart remains browser only by design, so no cart table is introduced now.
- Tax and promotion configuration can be expanded in later specs, but order and line snapshot fields must already be able to record applied outcomes.

## Follow-up

- [ ] Design it (spec): `/architect roles, permissions, and access control` to define the full permission model, role catalog, and enforcement rules that build on the scope anchors and membership structures in this foundation.
- [ ] Decide commission rates per category, return window and eligibility rules, delivery pricing details, payout cadence and minimum threshold, COD refund payout methods, and retention periods before hard coding or enabling related behavior.
- [ ] When implementing migrations and domain logic, add indexes and transaction patterns that match real queries (checkout reservation, payment event dedupe, shop scoped dashboards, order history) and verify with actual execution plans.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

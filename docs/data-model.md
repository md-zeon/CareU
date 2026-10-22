# CareU.bd — Proposed Data Model

**Status:** PROPOSAL — for explicit approval. **Nothing here is implemented.** No Prisma schema, migration or seed script has been written.
**Depends on:** `docs/requirements.md`, `docs/decision-log.md`.
**Format:** entity tables (field · type · notes), not Prisma syntax. Field lists are proposals, not final DDL; a few types and lengths are intentionally left open.

---

## 1. How to read this document

- **Field types** are logical: `cuid` (app-generated), `BigInt` (poisha), `String`, `Int`, `Bool`, `DateTime`, `Json`, `enum`.
- Every monetary field is `BigInt` **poisha** (D-06). Every monetary field is named explicitly (`amount`, `price`, `commissionAmount`, …) so it cannot be confused with a count.
- `snapshot` in a field name means an immutable copy of a value at a point in time.
- **Constraints** marked **INV** are invariants the model must enforce (DB constraint, unique index, or service-layer rule — the enforcement point is stated).
- Enums are named in `UPPER_SNAKE`; the exact member lists are proposals.

---

## 2. Model at a glance

| Domain | Entities | Owns |
|---|---|---|
| Identity & access | `User` (Better Auth, existing), `Role`, `Permission`, `RolePermission`, `UserRoleAssignment`, `StaffInvitation` | Who may do what, where |
| Seller onboarding | `SellerApplication`, `SellerApplicationDocument`, `SellerApplicationReview`, `Shop` | Who may sell, and under what status |
| Catalogue | `Category`, `CategoryAttribute`, `CategoryAttributeOption`, `Brand`, `Product`, `ProductVariant`, `ProductAttributeValue`, `ProductMedia` | What exists, described once |
| Offers & listings | `Offer` | Who sells what, for how much, with how much stock |
| Inventory | `InventoryLocation`, `StockMovement`, `StockReservation`, `Supplier`, `SupplierReceipt`, `SupplierReceiptLine`, `PlatformCost` | Physical stock, its history, its cost |
| Pricing rules | `Promotion`, `PromotionRedemption`, `DeliveryZone`, `DeliveryRate`, `TaxRule`, `CommissionRule` | Configurable economics, effective-dated |
| Customers | `Address`, `District`, `WishlistItem`, `Review`, `ReviewReport`, `Notification`, `NotificationPreference` | Customer-owned data |
| Checkout | `CheckoutAttempt`, `IdempotencyKey` | One server-side attempt at a purchase |
| Orders | `Order`, `SellerOrder`, `OrderLine`, `OrderStatusEvent` | The purchase, split per shop and per line |
| Fulfilment & delivery | `Shipment`, `DeliveryAttempt`, `ProofOfDelivery`, `CashCollection` | Getting the goods to the customer |
| Payments | `Payment`, `PaymentAttempt`, `PaymentEvent`, `PaymentAllocation`, `Refund`, `RefundLine` | Money in, money out, and its proof |
| Settlement & finance | `SellerEarning`, `LedgerEntry`, `PayoutBatch`, `Payout`, `PayoutEarning`, `PayoutAttempt`, `FinancialAdjustment` | Who is owed what, and the proof of payment |
| Returns & support | `ReturnRequest`, `Dispute`, `DisputeMessage`, `SupportCase`, `SupportCaseMessage`, `SupportCaseAttachment`, `CaseStatusEvent` | Problems and their resolution |
| Storefront CMS | `StorefrontPage`, `StorefrontDraft`, `StorefrontRevision`, `NavigationMenu`, `NavigationItem` | Admin-authored storefront |
| Platform ops | `AuditLog`, `JobRun`, `OutboxMessage`, `MediaAsset`, `PlatformSetting` | Cross-cutting plumbing |

**~90 entities.** Dominant pattern: *catalogue → offer → order line → ledger entry*, with immutable snapshots at every money-bearing step.

---

## 3. Entity inventory

### 3.1 Identity & access

**`Role`** — a named bundle of permissions, optionally shop-scoped.
| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| key | String unique | `platform_admin`, `seller_staff` |
| name / description | String | |
| scopeType | enum `PLATFORM|SHOP` | Shop-scoped roles cannot hold platform permissions |
| isSystem | Bool | System roles cannot be deleted |
| createdBy / createdAt / updatedAt | | |

**`Permission`** — the atom of authorization.
| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| key | String unique | dotted, e.g. `payouts.approve`, `seller.orders.read` |
| module | String | grouping for the admin UI |
| description | String | |
| isSensitive | Bool | INV: sensitive permissions require MFA (see §5.5) |

**`RolePermission`** — join. Unique `(roleId, permissionId)`.

**`UserRoleAssignment`** — grants a role to a user at a scope.
| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| userId | FK User | |
| roleId | FK Role | |
| scopeType | enum `PLATFORM|SHOP` | |
| scopeId | String? | `null` iff `scopeType = PLATFORM`; the shop id otherwise |
| grantedBy / grantedAt | | |
| expiresAt | DateTime? | temporary access |
| revokedAt / revokedBy | DateTime? | soft revoke, so the grant history is auditable |

**`StaffInvitation`** — admin-issued onboarding.
| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| email / phone | String | one required |
| roleId | FK Role | |
| scopeType / scopeId | | as above |
| tokenHash | String | the raw token is never stored |
| status | enum `PENDING|ACCEPTED|REVOKED|EXPIRED` | |
| invitedBy / invitedAt / expiresAt / acceptedAt | | |

**`User`** (existing Better Auth model) — additions proposed:
`anonymizedAt`, `deletedAt`, `lastLoginAt`, `preferredLocale`, `marketingOptIn`, `twoFactorEnabled` (added by the Better Auth CLI when the 2FA plugin is enabled). All commerce relations hang off `User.id`.

### 3.2 Seller onboarding

**`SellerApplication`**
| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| userId | FK User | one active application per user at a time (INV) |
| type | enum `INDIVIDUAL|BUSINESS` | drives which fields are required |
| status | enum `DRAFT|SUBMITTED|UNDER_REVIEW|APPROVED|REJECTED|WITHDRAWN` | |
| legalName / tradeName | String? | |
| nidNumber / tinNumber | String? | **encrypt at rest** |
| phone / email / addressLine / districtId | | |
| businessType / bio | String? | |
| details | Json | type-specific fields that do not warrant columns |
| submittedAt / decidedAt / decidedBy / decisionReason | | |
| reviewCycle | Int | increments on resubmission |

**`SellerApplicationDocument`** — verification evidence, private bucket only.
`id`, `applicationId`, `docType` (enum `NID|TRADE_LICENSE|TIN_CERTIFICATE|UTILITY_BILL|BANK_STATEMENT|OTHER`), `storageKey`, `originalFileName`, `mimeType`, `sizeBytes`, `checksum`, `status` (`PENDING|APPROVED|REJECTED`), `reviewedBy`, `reviewedAt`, `rejectionReason`, `uploadedAt`, `retentionUntil`.
**INV** — `storageKey` must live in the private bucket; access is through a signed-URL route that writes an access-log row.

**`SellerApplicationReview`** — append-only history: `id`, `applicationId`, `reviewerId`, `action` (`SUBMITTED|REQUEST_CHANGES|APPROVED|REJECTED`), `note`, `createdAt`.

**`Shop`** — the selling entity. **This is where first-party and third-party live.**
| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| slug | String unique | public URL segment |
| name | String | |
| ownerUserId | FK User? | `null` **iff** `isFirstParty = true` |
| isFirstParty | Bool | true only for the CareU store |
| status | enum `ACTIVE|PAUSED|SUSPENDED|CLOSED` | |
| isTrusted | Bool | seller-trust status; admin-granted |
| trustedAt / trustedBy | | |
| description / logoKey / bannerKey / contactPhone | | |
| suspendedAt / suspendedReason / pausedAt | | |
| createdAt / updatedAt | | |

**INV-1** — `@@unique([ownerUserId])`: at most one third-party shop per account. (Postgres treats `NULL`s as distinct, so the first-party shop does not violate this.)
**INV-2** — a partial unique index guarantees **at most one** row with `isFirstParty = true` (a raw-SQL index in the migration, since Prisma cannot express a partial unique index).
**INV-3** — `isFirstParty = true` ⇒ `ownerUserId IS NULL`.
**INV-4** — the first-party shop is **excluded** from every seller-workspace query. It is served only by platform permissions. A first-party shop can never have a `SellerEarning` with a payable amount (D-08/D-12, see §14).

**`Supplier`** — `id`, `name`, `contactName`, `phone`, `email`, `address`, `notes`, `isActive`. (CareU procurement only; third-party sellers manage their own supply chain.)

### 3.3 Catalogue

**`Category`** — `id`, `slug` unique, `parentId` FK Category?, `path` (materialised path for tree queries), `depth`, `nameEn`, `nameBn`, `descriptionEn/Bn`, `imageKey`, `sortOrder`, `isActive`, `accessLevel` (`ALLOWED|RESTRICTED|PROHIBITED`), `requiresApproval` (Bool — restricted categories always require review), `createdAt/updatedAt`.
**INV-5** — `accessLevel = PROHIBITED` ⇒ no product may be published in it, by any actor; enforced in the service layer and audited.

**`CategoryAttribute`** — `id`, `categoryId`, `key`, `labelEn/Bn`, `type` (`TEXT|NUMBER|BOOLEAN|ENUM|SELECT|MULTI_SELECT`), `isRequired`, `isFilterable`, `isVariantAxis`, `sortOrder`, `options` (Json for `SELECT`/`MULTI_SELECT`; a separate option table is optional — see §15.3).

**`CategoryAttributeOption`** — `id`, `attributeId`, `value`, `labelEn/Bn`, `sortOrder`. Unique `(attributeId, value)`.

**`Brand`** — `id`, `slug` unique, `nameEn/Bn`, `logoKey`, `isActive`.

### 3.3.0 Product ownership — four separate concepts (D-24)
Three questions are routinely conflated as "who owns the product". They are answered by **three independent fields plus the offer rows**, and keeping them separate is what prevents the first-party/seller accounting from bleeding into the catalogue:

| Concept | Question it answers | Where it lives |
|---|---|---|
| **Catalogue ownership** | Who owns the *definition* (title, description, category, images)? | `Product.source` + `Product.ownerShopId` |
| **Visibility / channel** | Which storefronts may **show** it? | `Product.channel` (`SHARED` \| `EXCLUSIVE`) + offer shop scope |
| **Offer ownership** | Who is **selling** it, at what price and stock? | `Offer.shopId` |
| **Fulfilment ownership** | Who ships it and who is paid? | `Offer.shopId` → `SellerOrder.shopId` |

The four cases:

1. **Platform-owned, shared, multi-shop offers** — CareU owns the catalogue definition; any approved seller (and CareU itself) may put up an `Offer`. This is the common case (`source = PLATFORM`, `channel = SHARED`). The product is browsable once and shows all eligible offers.
2. **Platform-owned, CareU-exclusive** — CareU owns the definition **and** only the first-party shop may offer it (`source = PLATFORM`, `channel = EXCLUSIVE`). Used for CareU-exclusive items. This is the **platform-owned product with first-party-only offers** case: the catalogue artifact is a CareU asset, and there is no third-party seller contract attached.
3. **Shop-owned (seller-exclusive) product** — the seller owns the whole definition, and **only** that shop may offer it (`source = SELLER`, `ownerShopId` set). Isolated from shared browse and from every other shop.
4. **Shared definition, shop-owned offer on a platform product** — covered by case 1: the offer carries all commercial terms, so the seller never touches the platform's catalogue artifact.

**First-party offers are NOT seller liabilities.** A first-party `Offer`, its `SellerOrder`, and its stock are **CareU's own inventory and revenue**. They create no `SellerEarning`, no commission and no payout obligation, and they are excluded from the seller balance and from staff/marketplace surfaces (§14, INV-4/INV-29/INV-56/INV-61). The `isFirstParty` flag on the shop (snapshotted onto `SellerOrder`) is the single discriminator; the financial exclusion is enforced at the split/settlement boundary, never by a second catalogue code path.

**`Product`** — the shared catalogue entity.
| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| slug | String unique | public URL segment |
| source | enum `PLATFORM|SELLER` | **catalogue ownership** (D-07/D-24) |
| channel | enum `SHARED|EXCLUSIVE` | **visibility** (D-24). `SHARED` = any eligible shop may offer; `EXCLUSIVE` = only `ownerShopId` (with `source = SELLER`) or only the first-party shop (with `source = PLATFORM`) may offer |
| ownerShopId | FK Shop? | required iff `source = SELLER`; **NULL** for a platform-owned product even when `channel = EXCLUSIVE` |
| categoryId | FK Category | |
| brandId | FK Brand? | |
| productType | enum `SIMPLE|VARIANT` | |
| titleEn / titleBn | String | |
| descriptionEn / descriptionBn | String? | |
| status | enum `DRAFT|PENDING_REVIEW|PUBLISHED|REJECTED|ARCHIVED` | moderation state (D-07 default) |
| publishedAt / publishedBy | | |
| seoTitle / seoDescription | String? | per-locale override |
| primaryImageKey | String? | |
| ratingAverage / ratingCount / soldCount | | **denormalised, derived from `Review`** — never hand-edited |
| createdBy / createdAt / updatedAt | | |

**INV-6** — `source = SELLER` ⇒ `ownerShopId IS NOT NULL` **and** the product appears only under that shop (excluded from shared category browse).
**INV-6a** — `source = PLATFORM` ⇒ `ownerShopId IS NULL`. A platform-owned product's channel is expressed by `channel`, not by an owner.
**INV-6b** — `channel = EXCLUSIVE` ⇒ the product is offerable only by: the first-party shop (if `source = PLATFORM`), or `ownerShopId` (if `source = SELLER`). Enforced by INV-14a.
**INV-7** — `status` is a moderation/lifecycle state, never an availability state. Availability is derived from the stock of the eligible offers.

**`ProductVariant`** — catalogue attributes only. `id`, `productId`, `sku` (nullable; **catalogue-level** SKU for platform products only), `nameEn/Bn`, `optionValues` (Json: `{color: "Black", size: "M"}`), `position`, `isDefault`.
**INV-8** — a catalogue variant has **no price and no stock**. Price, SKU and stock belong to the `Offer` (D-05).

**`ProductAttributeValue`** — EAV for category attributes (filterable and not).
`id`, `productId`, `attributeId`, `valueText`, `valueNumber`, `valueBool`, `optionId`; exactly one value column is set. Index `(attributeId, valueText)`.
**INV-9** — values must satisfy the attribute's `type` and `isRequired`; validated on write against `CategoryAttribute`.

**`ProductMedia`** — `id`, `productId`, `storageKey` (public bucket), `mediaType` (`IMAGE|VIDEO`), `altText`, `width`, `height`, `position`, `isPrimary`.
**INV-10** — meaningful `altText` is required (SEO/accessibility); the media must be server-validated on upload (type, size, and — for video — that it points at a Bunny Stream asset, not an arbitrary URL).

### 3.4 Offers (the seller ↔ catalogue junction)

**`Offer`** — one seller's listing of one variant. **The heart of the model.**
| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| shopId | FK Shop | |
| productId / variantId | FK | denormalised for query performance; `variantId` already implies `productId` — **INV-11**: `variant.productId = productId` |
| sku | String | **unique per shop** |
| price | BigInt poisha | |
| compareAtPrice | BigInt? | "was" price for display |
| currency | String | `BDT` |
| condition | enum `NEW|USED|REFURBISHED` | |
| warrantyMonths | Int? | |
| stock | Int | **available-to-sell** = on-hand − units held by `ACTIVE` reservations (see §11.1) |
| minOrderQty / maxOrderQty | Int? | |
| status | enum `DRAFT|PENDING_REVIEW|PUBLISHED|REJECTED|PAUSED|ARCHIVED` | |
| moderationReason | String? | |
| isPrimary | Bool | the shop's featured offer for that variant |
| version | Int | optimistic concurrency for price/stock edits |
| publishedAt / createdAt / updatedAt | | |

**INV-12** — `@@unique([shopId, sku])`. SKU uniqueness is **per seller**, not global: two sellers may legitimately both use "PHONE-001".
**INV-13** — `stock >= 0` (DB check constraint). The decrement is `UPDATE offer SET stock = stock - :qty WHERE id = :id AND stock >= :qty`; the affected-row count must be 1 or the transaction rolls back. `stock` is **available-to-sell** (on-hand minus active reservations) — see §11.1.
**INV-14** — an offer of a `source = SELLER` product must belong to that product's `ownerShopId`. A seller cannot list another seller's unique product.
**INV-14a** — an offer of a `channel = EXCLUSIVE` product must belong to the product's only eligible shop: the first-party shop (when `source = PLATFORM`) or `ownerShopId` (when `source = SELLER`). No other shop may create or publish an offer on an exclusive product.
**INV-15** — a `channel = SHARED` (`source = PLATFORM`) product may be offered by **any** active shop, including the first-party shop; the platform is not a special seller in the catalogue, only in the stock ledger.

### 3.5 Inventory

**`InventoryLocation`** — `id`, `code` unique, `name`, `kind` (`PLATFORM|SELLER`), `shopId` FK? (null for a platform warehouse, set for a seller's own location), `isActive`, `address`.
Launch: one `PLATFORM` location (CareU) + one implicit `SELLER` location per shop.

**`StockMovement`** — **append-only** ledger of physical stock. Never updated, never deleted.
| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| offerId | FK Offer | |
| locationId | FK InventoryLocation | |
| shopId | FK Shop | denormalised for scoping |
| direction | enum `IN|OUT` | |
| reason | enum `SALE|RETURN|RESTOCK|DAMAGE|ADJUSTMENT|TRANSFER|RESERVATION_HOLD|RESERVATION_RELEASE` | |
| quantity | Int | always positive; direction carries the sign |
| unitCost | BigInt? | poisha; CareU purchase cost |
| referenceType / referenceId | String | e.g. `ORDER_LINE`, `SUPPLIER_RECEIPT_LINE`, `RETURN_REQUEST` |
| note | String? | **required for `ADJUSTMENT` and `DAMAGE`** |
| actorId | FK User? | null for system-generated movements |
| createdAt | | |

**INV-16** — the sum of `StockMovement` for an offer, by direction, equals `Offer.stock`, where `Offer.stock` is **available-to-sell** (§11.1). The atomic decrement writes the matching `SALE` movement **inside the same transaction**.
**INV-17** — a movement whose `reason` is `ADJUSTMENT` or `DAMAGE` must carry a note and produces an `AuditLog` entry.
**INV-18** — `StockMovement` rows are never updated or deleted. Corrections are additional compensating movements.

**`StockReservation`** — a short-lived hold created at checkout.
`id`, `offerId`, `checkoutAttemptId`, `orderId` (nullable until converted), `quantity`, `status` (`ACTIVE|CONVERTED|RELEASED|EXPIRED`), `expiresAt`, `createdAt`, `convertedAt?`, `releasedAt`, `releaseReason`.
**INV-19** — `@@unique([checkoutAttemptId, offerId])` makes reservation idempotent for a given attempt.
**INV-20** — an `ACTIVE` reservation past `expiresAt` is released by a background job that performs a **conditional** transition (`ACTIVE → EXPIRED`, affected rows == 1) and only the winner posts a `RESERVATION_RELEASE` movement and restores `Offer.stock`. Release is therefore **idempotent** — concurrent workers or a release racing a checkout cannot restore the same units twice (§11.3).
**INV-20a** — the reservation state transitions are conditional: `ACTIVE → CONVERTED` (checkout completion) and `ACTIVE → RELEASED|EXPIRED` (release/expiry) are mutually exclusive. Whichever matches first wins; the loser does no stock work.

**`SupplierReceipt`** — `id`, `supplierId`, `locationId`, `receivedAt`, `reference` (invoice no.), `note`, `totalCost`, `status` (`DRAFT|COMPLETED|VOIDED`), `createdBy`, `createdAt`.
**`SupplierReceiptLine`** — `id`, `receiptId`, `offerId`, `quantity`, `unitCost`, `lotNumber?`, `expiryDate?`.
On `COMPLETED`, each line writes an `IN` / `RESTOCK` movement and increments `Offer.stock` — atomically.

**`PlatformCost`** — CareU purchase cost, **separate from the public price** so it can be permission-restricted.
`id`, `offerId`, `unitCost`, `currency`, `effectiveFrom`, `effectiveTo?`, `note`, `createdBy`, `createdAt`.
**INV-21** — a third-party seller's cost price is never stored in a platform-readable table. `PlatformCost` is populated only for first-party offers.

### 3.6 Pricing rules (all effective-dated)

**`Promotion`** — one model for coupons and campaigns.
`id`, `kind` (`COUPON|CAMPAIGN`), `code` (unique, nullable — present only for coupons), `name`, `type` (`PERCENT|FIXED|FREE_DELIVERY`), `value` (BigInt poisha for `FIXED`; basis points for `PERCENT`), `fundingSource` (`CAREAU|SELLER|MIXED`), `commissionTreatment` (`REDUCE_BASE_PROPORTIONAL|NO_EFFECT`), `scope` (`PLATFORM|SHOP`), `shopId?`, `minOrderAmount?`, `maxDiscountAmount?`, `perUserLimit?`, `totalUsageLimit?`, `usedCount`, `startsAt`, `endsAt`, `isActive`, `eligibleCategoryIds` (Json), `rules` (Json, validated), `createdBy`, `createdAt`.
**INV-22** — `@@unique([code])` where `code IS NOT NULL` (case-insensitive comparison via a functional index on `lower(code)`).
**INV-23** — a `SELLER`-funded or `SHOP`-scoped promotion may only discount that seller's own lines.
**INV-24** — usage limits are enforced inside the checkout transaction via a conditional `UPDATE … WHERE used_count < limit` (see §11.4).

**`PromotionRedemption`** — `id`, `promotionId`, `userId`, `orderId`, `discountTotal`, `fundingSplit` (Json: per seller AND per line, CareU-funded vs seller-funded), `allocation` (Json: the per-line, per-seller-order allocation produced by §3.6.1), `createdAt`.
**INV-25** — `@@unique([promotionId, userId, orderId])` prevents double-application.
**INV-25a** — `discountTotal` equals the sum of the per-line `discountAmount` values AND the sum of the `fundingSplit` shares; the allocation is snapshotted so a later campaign edit cannot rewrite it.

### 3.6.1 Discount funding, allocation and rounding (D-25)
This section is normative: the money must add up exactly, every time.

**Order of allocation.** Within a checkout, discounts are allocated:
1. **Across a promotion's eligible lines only** (INV-23 keeps seller/shop-funded promotions on their own lines), and
2. **Within a line, in proportion to that line's discount-eligible base** (line unit price × qty, less any earlier allocation), and
3. **Across seller orders**, so each `SellerOrder` and each `OrderLine` carries its own allocated discount.

**Proportional allocation with largest-remainder rounding (the approved method).**
- Compute each eligible line's exact share as a rational: `share_i = eligibleBase_i / Σ eligibleBase × discountTotal`.
- Convert each share to integer poisha by taking its **floor**. The remaining poisha (`discountTotal − Σ floor_i`) is distributed **one poisha at a time** to the lines with the **largest fractional remainder** (largest-remainder / Hare–Niemeyer method).
- **Deterministic tie-breaking (required):** when two or more lines have an equal fractional remainder, the poisha goes to the line with the **smaller `orderLineId` in ascending stable order** (catalogue/creation order). This makes the result independent of iteration order, hash order or database row order — two runs of the same inputs always produce the identical allocation. Do not tie-break by map/object key order or by sorting on a non-unique field.
- **The funding split uses the same rule (D-29).** Once a line's allocated discount is fixed, its `MIXED` CareU/seller split is computed with the **same floor + largest-remainder method applied per line**, one poisha at a time, with a deterministic tie-break that resolves to the **CareU share first**. The split is integer-exact; the extra poisha of an uneven split is deterministic and auditable, never accidental.
- **Verification before commit:** assert `Σ allocated_discount == discountTotal` **and** `Σ CareU-funded + Σ seller-funded == discountTotal`. A mismatch aborts the transaction (this is a code assertion, not a rounding warning).

**Funding and commission-base enforcement, per line.**
- `fundingSource = CAREAU` ⇒ CareU funds it: the commission base of the affected lines is reduced by the CareU-funded share and CareU's revenue absorbs the cost. No seller is charged.
- `fundingSource = SELLER` (or `SHOP`-scoped) ⇒ the seller funds it: the discount reduces that seller's gross proceeds; commission is computed on the **reduced** base.
- `fundingSource = MIXED` ⇒ CareU and the seller share the discount according to the campaign's split; the split is applied **per line** and stored in `fundingSplit`.
- `commissionTreatment = REDUCE_BASE_PROPORTIONAL` (the approved default) ⇒ commission is charged on `lineBase − discountShare`. `NO_EFFECT` ⇒ commission is charged on `lineBase` regardless of the discount, and the discount is funded entirely by its `fundingSource`.
- Every line snapshots `discountAmount`, `careuFundedDiscount`, `sellerFundedDiscount` and `commissionBase`. The `SellerOrder` snapshots the totals. **No seller earns or is charged an amount that cannot be traced to a snapshotted line.**

**Cancellation, partial returns and reconciliation.**
- A cancellation or partial return reverses **only the affected line's allocated shares** (item discount, its CareU/seller funding split, and its commission-base effect), using the snapshotted allocation — never a re-derivation from today's campaign.
- Because a discount may have been funded by CareU across a multi-seller order, the reversal posts balanced ledger corrections to the correct scopes: a CareU-funded reversal posts to CareU; a seller-funded reversal posts only against that seller's `SellerOrder`.
- **Line ↔ seller-order ↔ order reconciliation:** at all times, `Σ line.discountAmount == sellerOrder.discountAmount` per seller order, and `Σ sellerOrder.discountAmount == order.discountAmount`. The same holds for the funding split and the commission base. These are asserted by `RECONCILE_LEDGER` and by an order-integrity check.

**`DeliveryZone`** — `id`, `code` unique, `nameEn/Bn`, `divisionId`, `isRemote`, `surcharge` (BigInt).

**`DeliveryRate`** — `id`, `scopeType` (`ZONE|SHIPMENT_METHOD|ORDER_VALUE_TIER|WEIGHT_BAND|GLOBAL`), `scopeId?`, `zoneId?`, `method?`, `minOrderValue?`, `maxOrderValue?`, `minWeightGrams?`, `maxWeightGrams?`, `amount` (BigInt), `effectiveFrom`, `effectiveTo?`, `priority`, `isActive`.
**INV-26** — exactly one rate is selected per shipment at snapshot time; the selection and the resulting amount are written onto the `Shipment` (`deliveryCharge`).

**`TaxRule`** — `id`, `name`, `jurisdictionCode` (`BD`), `scopeType` (`CATEGORY|PRODUCT|ADDRESS_ZONE|GLOBAL`), `scopeId?`, `rateBps`, `isInclusive`, `roundingMode`, `effectiveFrom`, `effectiveTo?`, `isActive`.
**INV-27** — **no tax is applied at launch** (D-10). The rules table is populated with `isActive = false` only, and the applied tax (currently always 0) is snapshotted on the order, seller order and line. Enabling tax is a configuration change.

**`CommissionRule`** — `id`, `scopeType` (`GLOBAL|CATEGORY|PRODUCT|SHOP`), `scopeId?`, `rateBps`, `effectiveFrom`, `effectiveTo?`, `note`, `createdBy`, `createdAt`.
**INV-28** — the rule effective at order time is **snapshotted** onto `SellerOrder` (`commissionRateBps`, `commissionAmount`). A historical order is never recomputed when a rate changes.
**INV-29** — the first-party shop's offers never match a commission rule: a first-party seller order has `commissionRateBps = 0` and `commissionAmount = 0`.

### 3.7 Customers

**`District`** — reference data: `id`, `code` unique, `nameEn`, `nameBn`, `divisionId`, `isActive`. (`Division` as a second small reference table if needed — **or** fold the division into `District` as a string to avoid a table for 64 rows; see §15.3.)

**`Address`** — `id`, `userId`, `label`, `recipientName`, `phone`, `line1`, `line2`, `area`, `city`, `districtId`, `postCode`, `isDefault`, `createdAt`.
**INV-30** — at most one default address per user (partial unique index on `(user_id) WHERE is_default`).

**`WishlistItem`** — `id`, `userId`, `productId`, `variantId?`, `createdAt`. Unique `(userId, productId, variantId)`.

**`Review`** — `id`, `userId`, `productId`, `orderLineId` (FK, unique), `rating` (1–5), `title`, `body`, `status` (`PENDING|PUBLISHED|REJECTED|FLAGGED`), `isVerifiedPurchase`, `images` (Json), `createdAt`, `updatedAt`, `editedAt`, `moderatedBy`, `moderationReason`.
**INV-31** — `@@unique([orderLineId])` enforces "one review per eligible purchased product" at the database level. A review can only exist against a line the reviewer actually bought.
**INV-32** — `ratingAverage`/`ratingCount` on `Product` are derived from published reviews only and are never written by hand.
**INV-33** — JSON-LD `aggregateRating` is emitted **only** when a real count exists; ratings are never fabricated.

**`ReviewReport`** — `id`, `reviewId`, `reporterId`, `reason`, `status` (`OPEN|REVIEWING|ACTIONED|DISMISSED`), `handledBy`, `createdAt`.

**`Notification`** — `id`, `userId`, `type` (e.g. `ORDER_CONFIRMED`, `SHIPMENT_DISPATCHED`, `PAYOUT_PAID`), `channel` (`IN_APP|EMAIL|SMS`), `title`, `body`, `data` (Json), `status` (`PENDING|SENT|FAILED|READ`), `readAt`, `sentAt`, `failureReason`, `relatedType`, `relatedId`, `createdAt`.
**INV-34** — a notification is written via the outbox in the same transaction as the business change (§11.5), so a committed order can never lose its confirmation.

**`NotificationPreference`** — `id`, `userId`, `type`, `inApp`, `email`, `sms`. Unique `(userId, type)`.

### 3.8 Checkout

**`CheckoutAttempt`** — one server-side attempt at a purchase.
`id`, `userId`, `idempotencyKey` (unique), `status` (`PENDING|RESERVATION_FAILED|VALIDATION_FAILED|ORDER_CREATED|EXPIRED`), `addressSnapshot` (Json), `pricingSnapshot` (Json — the computed subtotal, the per-line discount allocation from §3.6.1, the funding split, delivery, tax, total, and the rule versions used), `couponCode`, `promotionId?`, `failureReason`, `createdAt`, `completedAt`.
**INV-35** — `@@unique([idempotencyKey])`; replaying the key returns the original order rather than creating a second one. The key is inserted **before** any reservation (§11.2 step 1).
**INV-36** — the pricing snapshot records the **inputs and the computed allocation** (offer ids, prices, promotion id, per-line discount shares, funding split, delivery zone, tax rule ids) so a later dispute can be reconstructed exactly and the rounding is reproducible.
**INV-36a** — the snapshot is immutable once `status = ORDER_CREATED`.

**`IdempotencyKey`** — generic, for payment initiation, refunds and payouts.
`id`, `key` unique, `scope` (e.g. `PAYMENT_INITIATE`), `userId`, `requestHash`, `responseStatus`, `responseBody` (Json), `createdAt`, `completedAt`.
**INV-37** — a replay with a **different** request hash is rejected (conflict), never silently re-run.

**No `Cart` / `CartItem` table** — the cart is browser-only by confirmed requirement. The server re-derives every price from the offers at checkout.

### 3.9 Orders

**`Order`** — the customer-facing purchase.
| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| orderNumber | String unique | human reference, e.g. `CU-2026-000123` |
| userId | FK User | |
| status | enum | `PENDING|CONFIRMED|PARTIALLY_FULFILLED|FULFILLED|COMPLETED|CANCELLED` |
| paymentStatus | enum | `PENDING|AUTHORIZED|CAPTURED|PARTIALLY_REFUNDED|REFUNDED|FAILED|EXPIRED|CANCELLED` — **separate field** |
| fulfillmentStatus | enum | `PENDING|PARTIALLY_FULFILLED|FULFILLED|PARTIALLY_CANCELLED|CANCELLED` — **separate field** |
| paymentMethod | enum `COD|ONLINE` | |
| currency | String | `BDT` |
| subtotal / discountTotal / deliveryTotal / taxTotal / grandTotal | BigInt | poisha snapshots |
| promotionId? / couponCode | | |
| deliveryAddressSnapshot | Json | immutable copy of the address at purchase time |
| shippingMethodSnapshot | String? | |
| placedAt / cancelledAt / cancelReason | | |
| notes / customerNote | | |
| createdAt / updatedAt | | |

**INV-38** — `grandTotal = subtotal − discountTotal + deliveryTotal + taxTotal` is asserted at write time.
**INV-39** — `paymentStatus` and `fulfillmentStatus` are separate columns and are never derived from one another.

**`SellerOrder`** — the per-shop financial and operational unit.
| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| orderId | FK Order | |
| shopId | FK Shop | |
| shopNameSnapshot | String | the shop name at purchase time |
| isFirstParty | Bool | **snapshot** of `Shop.isFirstParty` at purchase time |
| status | enum | `PENDING|ACCEPTED|PACKING|READY_TO_SHIP|SHIPPED|PARTIALLY_DELIVERED|DELIVERED|PARTIALLY_CANCELLED|CANCELLED` |
| subtotal / discountTotal / deliveryCharge / taxTotal | BigInt | |
| commissionRateBps | Int | **snapshot** of the effective rule |
| commissionAmount | BigInt | 0 for first-party (INV-29) |
| sellerGross | BigInt | subtotal − discount + delivery share |
| sellerNet | BigInt | gross − commission (first-party: gross, but **not payable**) |
| payableAmount | BigInt | **0 for first-party** (INV-4) |
| currency | String | |
| earningsStatus | enum | `PENDING|ELIGIBLE|BLOCKED|PAYABLE|PAID|REVERSED` |
| blockedReason | String? | references the blocking dispute |
| eligibleAt | DateTime? | delivery + return window expiry |
| acceptedAt / shippedAt / deliveredAt / cancelledAt | | |
| createdAt / updatedAt | | |

**INV-40** — a seller order is created for **every** shop in the checkout, including the first-party shop. The financial difference is entirely in `commissionAmount` and `payableAmount` (§14).

**`OrderLine`** — the unit of fulfilment, refund, review and earning.
| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| sellerOrderId | FK SellerOrder | |
| offerId | FK Offer | |
| productId / variantId | FK | |
| titleSnapshot / titleBnSnapshot | String | |
| variantNameSnapshot / skuSnapshot | String | |
| unitPrice | BigInt | price at purchase time |
| quantity | Int | |
| lineSubtotal | BigInt | unitPrice × quantity |
| discountAmount | BigInt | this line's share of the promotion |
| taxAmount | BigInt | 0 at launch |
| deliveryShare | BigInt | this line's share of the shipment delivery charge |
| commissionAmount | BigInt | this line's share of the seller order's commission |
| sellerNetAmount | BigInt | this line's share of seller net |
| fulfillmentStatus | enum | `PENDING|PICKED|PACKED|SHIPPED|DELIVERED|PARTIALLY_CANCELLED|CANCELLED|RETURNED` |
| deliveredAt / cancelledAt / cancelReason | | |
| returnStatus | enum? | `NONE|REQUESTED|APPROVED|RECEIVED|RESTOCKED|REFUNDED` |
| createdAt | | |

**INV-41** — all `*Snapshot` fields and all money fields on a line are **immutable after creation**. A price change, a product rename or a commission-rate change never rewrites history.
**INV-42** — `lineSubtotal = unitPrice × quantity`; the sum of `discountAmount` over all lines equals the order's `discountTotal`; the sum of `deliveryShare` equals the seller order's `deliveryCharge`; the sum of `commissionAmount` equals the seller order's `commissionAmount`.

**`OrderStatusEvent`** — append-only history: `id`, `orderId?`, `sellerOrderId?`, `entityType`, `entityId`, `fromStatus`, `toStatus`, `actorType` (`SYSTEM|CUSTOMER|SELLER|ADMIN`), `actorId?`, `note`, `createdAt`.

### 3.10 Fulfilment & delivery

**`Shipment`** — one per seller order (plus one per return).
`id`, `sellerOrderId`, `kind` (`OUTBOUND|RETURN`), `parentShipmentId?` (a return points at its outbound shipment), `method` (`CAREAU_STAFF|COURIER|SELLER_MANAGED`), `status` (`PENDING|ASSIGNED|PICKED_UP|IN_TRANSIT|DELIVERED|FAILED_ATTEMPT|RETURNED|CANCELLED`), `deliveryCharge` (BigInt snapshot), `zoneId`, `addressSnapshot` (Json), `courierName`, `courierPhone`, `assignedStaffUserId?`, `trackingRef?`, `codAmount` (BigInt), `codCollectedAmount` (BigInt), `codShortageAmount` (BigInt), `dispatchedAt`, `deliveredAt`, `expectedAt`, `createdAt`.

**`DeliveryAttempt`** — `id`, `shipmentId`, `attemptNo` (unique with `shipmentId`), `actorUserId?`, `courierName?`, `outcome` (`SUCCESS|FAILED|CUSTOMER_UNAVAILABLE|REFUSED|WRONG_ADDRESS|RETURNED`), `note`, `codCollected?`, `attemptedAt`.
**INV-43** — COD is collected only via a `DeliveryAttempt` with `outcome = SUCCESS` and a matching `CashCollection` row.

**`ProofOfDelivery`** — `id`, `shipmentId`, `deliveryAttemptId`, `method` (`CONFIRMATION|RECIPIENT_NAME|PHOTO|SIGNATURE|OTP`), `recipientName?`, `signatureKey?`, `photoKey?`, `otpCodeHash?`, `confirmedByUserId?`, `createdAt`.
**INV-44** — signature and photo keys live in the **private** bucket; `otpCodeHash` stores a hash, never the code.
**INV-45** — the configured POD requirements (which methods are mandatory for a given delivery method) are validated before a shipment may reach `DELIVERED`.

**`CashCollection`** — `id`, `shipmentId`, `collectedByUserId`, `custodianType` (`CAREAU_STAFF|COURIER`), `expectedAmount`, `collectedAmount`, `custodyAmount` (cash still held by the courier/staff and not yet received by CareU), `receivedByCareuAmount` (cash actually received by CareU), `overageAmount` (collected > expected), `shortageAmount`, `reference?`, `note?`, `status` (`COLLECTED|IN_CUSTODY|SHORT_COLLECTED|RECONCILED`), `investigatedBy?`, `investigationNote?`, `reconciledBy?`, `reconciledAt?`, `collectedAt`.
**INV-46** — `receivedByCareuAmount + custodyAmount = collectedAmount`, and `collectedAmount + shortageAmount = expectedAmount`; an overage is a separate positive `overageAmount`, an open item like a shortage. A discrepancy creates an exception for reconciliation; it is never silently absorbed.
**INV-46a** — a `shortageAmount > 0` posts to `COD_SHORTAGE_PENDING` and remains an **outstanding reconciliation item** until an approved `FinancialAdjustment` resolves it (D-26). The platform never automatically writes the shortage off against CareU or the seller, and the seller's `SellerEarning` is **not** reduced by a shortage until that adjustment is approved.
**INV-46b** — **CareU owns every COD discrepancy end-to-end (D-32).** CareU investigates (recording `investigatedBy`/`investigationNote` and an evidence reference), and the discrepancy is closed only by an approved, reasoned `FinancialAdjustment` that resolves it one of three ways: recovered from the responsible custodian, absorbed by CareU (`PLATFORM_EXPENSES`), or — only on evidence of seller responsibility — charged to the seller. Courier-held cash before receipt by CareU is tracked in `custodyAmount` and posts to the courier-custody receivable (D-31); the seller is never a COD custodian. Every investigation and resolution is audited.

### 3.10.1 COD collection, remittance and earnings separation (D-26, D-32)
**CareU owns the entire COD workflow end-to-end (D-08):** collection through delivery/courier, custody tracking, remittance and reconciliation, discrepancy investigation (including courier shortages), seller-earning settlement, COD cancellations/returns/refunds, and the audit record for each. **Sellers never collect COD, never coordinate remittances, and never independently reconcile collections.** COD deliberately separates three things: **the cash we hold**, **the seller's earning**, and **the payout we owe**. These are recorded independently and reconciled, never collapsed into one "balance":

1. **Cash in hand (courier/staff → CareU).** On a successful COD delivery, `CashCollection` records what was actually collected (`collectedAmount`), split into what CareU has received (`receivedByCareuAmount`) and what a courier/staff member still holds (`custodyAmount`). CareU — not the seller — is the merchant-of-record and the only party that reconciles the cash. `COD_COLLECTION` ledger entries book the cash. **When the seller is a third party, collection posts a `SELLER_PAYABLE` (CareU now owes the seller's share) — not a receivable; while the cash is still in the courier/staff's custody and not yet at CareU, the amount owed *by the courier to CareU* is the courier-custody receivable (`SELLER_RECEIVABLE`, D-31).** A shortfall posts to `COD_SHORTAGE_PENDING`; an over-collection is a separate open item.
2. **Seller earning (obligation).** The seller's `SellerEarning` becomes `ELIGIBLE` after delivery, the return window and no blocking dispute — **independently of whether the cash has been remitted yet**. Earning eligibility is not gated on physical remittance.
3. **Payout (money out).** Earnings are netted into a payout batch according to the approved cadence (weekly, §3.12). COD cash that has not yet reached CareU from the courier/staff is tracked as a **custody receivable (courier/staff → CareU)** under `SELLER_RECEIVABLE`; once the seller is owed, it is a `SELLER_PAYABLE`. An un-remitted position is not a reason to delay an eligible earning — but a shortage that is still unresolved does not silently become a seller deduction.

**When the receivable arises (D-31).** The seller's `SELLER_PAYABLE` arises at order capture/collection (the seller has become entitled), independent of earning-eligibility timing. A `SELLER_RECEIVABLE` arises only when someone else holds money that a party owes to another: (a) courier/staff custody of collected COD cash before it reaches CareU, and (b) a post-payout correction (late return/chargeback/fee) that makes the seller owe CareU. The seller's ledger balance is `Σ SELLER_PAYABLE − Σ SELLER_RECEIVABLE`, and `RECONCILE_LEDGER` asserts it equals `Σ ELIGIBLE/PAYABLE netAmount` (INV-56a).

**Netting COD into payouts (approved default).** COD is netted into the seller's payout relative to the seller's COD position; the exact netting mechanics (per-seller receivable vs. explicit batch offset) are configurable (O-11), and the *netted result* is snapshotted on the `Payout` (`nettingSnapshot`). Whatever the mechanics, the ledger must reconcile: `SELLER_PAYABLE` (earning) − `SELLER_RECEIVABLE` − payout paid = 0 per shop.

**Failed/uncertain remittance.** A remittance that fails or is not confirmed leaves the COD cash as an open **custody receivable** (courier/staff → CareU); it is **not** treated as collected by CareU until confirmed, and it never marks an earning `PAID`. A remittance that is `UNCERTAIN` is reconciled against the courier/bank record before it is retried or written off.

**Post-payout corrections (D-31).** A correction discovered after a payout is `PAID` **never** mutates that payout. It is an approved `FinancialAdjustment` + reversing `LedgerEntry` pair that leaves a `SELLER_RECEIVABLE` (seller owes CareU) or `SELLER_PAYABLE` (CareU owes the seller), recovered on the next payout. The completed payout's amount, transfer reference and `nettingSnapshot` are immutable.

**Discrepancy investigation and loss allocation (D-32).** **CareU owns the investigation of every COD discrepancy** — a shortfall, courier-held cash that never arrives, an over-collection, or a refused/partial payment. The discrepancy stays an open reconciliation item (`COD_SHORTAGE_PENDING` for a shortfall; a distinct open item otherwise) until CareU closes it with an explicit, reasoned, **evidenced** and audited decision. It is **never automatically classified as seller debt and never automatically booked as a confirmed CareU expense.** The three permitted outcomes, each an approved `FinancialAdjustment` with an evidence reference:
- **Recovered** from the responsible custodian (courier/staff) — `PLATFORM_CASH` ← the custodian's `SELLER_RECEIVABLE`/receivable account; the seller is untouched.
- **Absorbed by CareU** as a deliberate write-off — `PLATFORM_EXPENSES` ← `COD_SHORTAGE_PENDING`.
- **Charged to a seller** — only where evidence establishes seller responsibility; posted as a reasoned `FinancialAdjustment` (never automatic, never silent).
Every investigation records `investigatedBy`/`investigationNote` and writes an `AuditLog` row. Weekly payout cadence, the ৳1,000 minimum and the commission policy are unchanged.

### 3.11 Payments

**`Payment`** — checkout-level.
`id`, `orderId`, `method` (`COD|ONLINE`), `status` (`PENDING|AUTHORIZED|CAPTURED|FAILED|REFUNDED|PARTIALLY_REFUNDED|EXPIRED|CANCELLED`), `gateway` (nullable, `SSLCOMMERZ`), `gatewaySessionId?`, `gatewayTransactionId?`, `amount` (BigInt), `currency`, `capturedAt?`, `verifiedAt?`, `failureReason?`, `createdAt`, `updatedAt`.

**`PaymentAttempt`** — `id`, `paymentId`, `attemptNo`, `gateway`, `requestPayload` (Json, masked), `responsePayload` (Json, masked), `status`, `errorCode?`, `createdAt`.
**INV-47** — request/response payloads are stored with secrets, card data and full PANs redacted at write time.

**`PaymentEvent`** — one row per inbound IPN/webhook.
`id`, `gateway`, `providerEventId`, `paymentId?`, `orderId?`, `eventType`, `rawPayload` (Json), `signatureValid` (Bool), `receivedAt`, `processedAt?`, `processingResult?`, `duplicateOfId?`.
**INV-48** — `@@unique([gateway, providerEventId])` is the replay guard. A duplicate insert is recorded and ignored.
**INV-49** — an event with `signatureValid = false` is **never** processed; it is queued for review.

**`PaymentAllocation`** — `id`, `paymentId`, `sellerOrderId`, `amount` (BigInt), `kind` (`ORDER|REFUND|ADJUSTMENT`). Unique `(paymentId, sellerOrderId, kind)`.
**INV-50** — the allocations for a payment sum to the payment amount. This is what makes a multi-seller order reconcilable per shop.

**`Refund`** — `id`, `orderId`, `sellerOrderId?`, `paymentId`, `amount`, `currency`, `method` (`GATEWAY|MANUAL_TRANSFER`), `status` (`REQUESTED|APPROVED|REJECTED|PROCESSING|COMPLETED|FAILED`), `reason`, `requestedBy`, `approvedBy?`, `approvedAt?`, `idempotencyKey` (unique), `gatewayRefundId?`, `manualReference?`, `payoutDestination?` (Json, masked), `processedAt?`, `gatewayOutcome?` (`SUCCESS|FAILED|UNCERTAIN`), `failureReason?`.
**INV-51** — a refund on a **COD** order may not reach `COMPLETED` without `approvedBy`, `payoutDestination` and `manualReference` (confirmed requirement).
**INV-51a** — **no refund may move money unless it is `APPROVED`** (admin-authorised and audited). The `REQUESTED → APPROVED` transition is the only door to `PROCESSING`; a rejected or unapproved refund posts no ledger entries (D-30).
**INV-52** — refunding an online payment uses the gateway; if the gateway has no refund API, or verification has not confirmed one (O-6), the refund **falls back to `MANUAL_TRANSFER`** with an admin approval, a verified destination and a recorded reference. The model supports both destinations from day one — a missing provider capability never strands a customer (D-30).
**INV-52a** — a refund whose gateway outcome is **`UNCERTAIN`** stays `PROCESSING` and is **reconciled against the gateway before any retry**; a timeout is never treated as a failure and a redirect is never treated as success. Retries carry the refund's `idempotencyKey`, so the gateway cannot apply a refund twice.
**INV-52b** — the refund's ledger entries (reversing the original sale) are posted **only on `COMPLETED`**; a `FAILED` refund posts nothing.

**`RefundLine`** — `id`, `refundId`, `orderLineId`, `quantity`, `amount`, `component` (`ITEM|DELIVERY_CHARGE|TAX`).
**INV-53** — the sum of `RefundLine.amount` equals `Refund.amount`. `quantity` must not exceed the order line's quantity minus prior refunded quantity.

### 3.12 Settlement & finance

**`SellerEarning`** — one row per seller order.
`id`, `sellerOrderId` (unique), `shopId`, `grossAmount`, `commissionAmount`, `discountAdjustment`, `deliveryShare`, `adjustmentsTotal`, `netAmount`, `currency`, `status` (`PENDING|ELIGIBLE|BLOCKED|PAYABLE|PAID|REVERSED`), `eligibleAt?`, `blockedReason?`, `periodKey` (ISO week, e.g. `2026-W43`), `payoutId?`, `createdAt`, `paidAt?`.
**INV-54** — `netAmount = grossAmount − commissionAmount + adjustmentsTotal`. `grossAmount` is the post-discount proceeds **for the seller's funding share only**: `Σ lineBase − Σ sellerFundedDiscount` for that seller order (§3.6.1). CareU-funded discounts never reduce `grossAmount`; they reduce CareU's own revenue.
**INV-55** — `status` may only become `ELIGIBLE` when `eligibleAt <= now()` and no blocking dispute exists for that seller order. A blocking dispute sets `BLOCKED` **for that seller order only**.
**INV-56** — **no `SellerEarning` row is created for a first-party seller order.** The first-party revenue and margin live in the platform's own reporting, not in seller earnings. (Belt-and-braces: the payout builder also excludes `isFirstParty` shops — §14.)
**INV-56a — earning is *not* money movement.** `SellerEarning` is the **eligibility/obligation record** (what the seller has become entitled to). The **money** lives in `LedgerEntry` (`SELLER_PAYABLE` / `SELLER_RECEIVABLE`). `SellerEarning.status` and the ledger balance must reconcile: `Σ ELIGIBLE/PAYABLE netAmount == SELLER_PAYABLE − SELLER_RECEIVABLE` for that shop. `RECONCILE_LEDGER` asserts this.
**INV-56b** — earning eligibility is evaluated **per seller order**, so one seller's dispute or return never blocks another seller's unrelated earnings in the same order (INV-66).

**`LedgerEntry`** — append-only financial ledger.
| Field | Type | Notes |
|---|---|---|
| id | cuid | |
| account | enum | `PLATFORM_CASH|PLATFORM_REVENUE|PLATFORM_COMMISSION|SELLER_PAYABLE|SELLER_RECEIVABLE|DELIVERY_REVENUE|REFUNDS|TAX_PAYABLE|GATEWAY_FEES|PLATFORM_EXPENSES|PLATFORM_ADJUSTMENT|COD_SHORTAGE_PENDING` |
| accountClass | enum | derived/denormalised purpose: `CASH|RECEIVABLE|PAYABLE|REVENUE|EXPENSE|ADJUSTMENT` (account classification is distinct from the transaction that produced the entry). Also determines the **normal side**: `CASH`/`RECEIVABLE`/`EXPENSE`/`ADJUSTMENT` are **debit-normal**; `PAYABLE`/`REVENUE` are **credit-normal** (D-28) |
| direction | enum `DEBIT|CREDIT` | |
| amount | BigInt poisha | always positive; direction carries the sign |
| currency | String | |
| ledgerType | enum | `ORDER_SALE|COMMISSION|EARNING|DELIVERY|REFUND|PAYOUT|COD_COLLECTION|COD_REMITTANCE|COD_SHORTAGE|GATEWAY_FEE|TAX|ADJUSTMENT` |
| sourceTransactionType | enum? | `ORDER|REFUND|PAYOUT|COLLECTION|ADJUSTMENT` — the **document** this entry belongs to (distinct from the account it posts to) |
| shopId? | FK | set for seller-related entries |
| orderId? / sellerOrderId? / paymentId? / refundId? / payoutId? / shipmentId? | FK | references to the source document |
| description | String | |
| reversalOfId? | FK LedgerEntry | links a correction to the entry it reverses |
| createdAt | | |

**INV-57** — entries are **never updated or deleted**. A correction is a new pair of entries with `reversalOfId` pointing at the original.
**INV-58** — for every **document** (order, refund, payout, adjustment, collection), total debits equal total credits. A nightly job (`RECONCILE_LEDGER`) asserts this per document **and per seller scope**; an imbalance is an alert, not a silent fix.
**INV-58a** — three concepts that must not be conflated: the **account** (what kind of balance moved), the **source transaction** (which document produced the entry, `sourceTransactionType` + FK), and the **seller earning** (the eligibility/obligation record in `SellerEarning`). One source document may post to several accounts; one account may be touched by many source documents. Commission, for example, posts from the order/commission source to `PLATFORM_COMMISSION`, and the seller's payable is recorded separately.
**INV-58b** — `GATEWAY_FEES` / `PLATFORM_EXPENSES` carry CareU-absorbed gateway fees (D-23). Fees are **never** silently deducted from `SellerEarning` — if a fee is ever charged to a seller, it is an explicit, reasoned, approved `FinancialAdjustment` with its own ledger entries.
**INV-58c** — `COD_SHORTAGE_PENDING` holds unresolved COD shortages (D-26). A shortage is **never** auto-assigned to CareU or a seller; it stays here until an approved `FinancialAdjustment` moves it, with a reason and audit trail.
**INV-58d** — the ledger is **double-entry at document granularity** (D-28). Every `LedgerEntry` carries `direction ∈ DEBIT|CREDIT`; `Σ DEBIT == Σ CREDIT` for each document is asserted in code **before commit** and re-asserted nightly per document and per seller scope. Each account's **normal side** is fixed by its `accountClass` (debit-normal: `CASH`/`RECEIVABLE`/`EXPENSE`/`ADJUSTMENT`; credit-normal: `PAYABLE`/`REVENUE`), and the account's signed balance is `Σ DEBIT − Σ CREDIT` (debit-normal) or `Σ CREDIT − Σ DEBIT` (credit-normal). A posting that would drive a debit-normal account negative is a reconciliation alert, not an automatic correction.

**`PayoutBatch`** — `id`, `batchNumber` unique, `status` (`DRAFT|PENDING_APPROVAL|APPROVED|PROCESSING|PARTIALLY_PAID|PAID|FAILED|CANCELLED`), `periodStart`, `periodEnd`, `totalAmount`, `itemCount`, `currency`, `method` (`BANK|MOBILE_WALLET|MIXED`), `preparedBy`, `approvedBy?`, `approvedAt?`, `processedAt?`, `bankReference?`, `notes`.
**INV-59** — a batch moves to `APPROVED` only with a second authorised person (`approvedBy != preparedBy`).
**INV-60** — only `ELIGIBLE` earnings with `netAmount >= 100000` poisha (৳1,000) and `periodKey` inside the batch window may be added.
**INV-60a** — an `ELIGIBLE` earning with `netAmount < ৳1,000` is **not discarded**: it stays `ELIGIBLE` and **rolls forward** into a later batch window. Its `periodKey` is informational; eligibility for inclusion is `status = ELIGIBLE AND netAmount >= threshold`, so small earnings accumulate until they cross the threshold. The threshold is a **setting**, not a hard-coded constant.

**`Payout`** — one per seller within a batch.
`id`, `batchId`, `shopId`, `amount`, `currency`, `method`, `destinationSnapshot` (Json — masked account/wallet details), `status` (`PENDING|PROCESSING|PAID|FAILED|RETRY|CANCELLED`), `transferReference?`, `failureReason?`, `paidAt?`, `attemptCount`, `nettingSnapshot` (Json — the COD receivable / offset applied, see §3.10.1), `recalculationOf?` (FK Payout — a corrected retry of a failed payout).
**INV-61** — a payout's shop is never the first-party shop.
**INV-61a** — a failed transfer **never** marks its earnings `PAID`. On failure the `Payout` becomes `FAILED`; the earnings return to `PAYABLE` (or remain `ELIGIBLE`) so they can be included in a retry. The failure is recorded on a `PayoutAttempt` with its reference and reason.

**`PayoutEarning`** — join: `payoutId`, `earningId`, `amount`. Unique `(payoutId, earningId)`.
**INV-61b** — the earnings of a failed payout are re-linked to the retry payout via fresh `PayoutEarning` rows under a **new** `Payout` (or a `recalculationOf` linkage); the same earning is never marked paid by two payouts — enforced by `@@unique([earningId])` on `PayoutEarning` **plus** the earning's `payoutId` pointer. A retry that would re-link an already-`PAID` earning is rejected.

**`PayoutAttempt`** — `id`, `payoutId`, `attemptNo` (unique with `payoutId`), `status` (`INITIATED|SUCCEEDED|FAILED|UNCERTAIN`), `reference?`, `failureReason?`, `actorId?`, `idempotencyKey` (unique per payout), `at`.
**INV-61c** — each transfer attempt carries an `idempotencyKey` so a retried API call is not executed twice; an outcome of `UNCERTAIN` is reconciled against the transfer provider before a retry is issued, so the same money is never sent twice.

**`FinancialAdjustment`** — `id`, `shopId?`, `orderId?`, `sellerOrderId?`, `type` (`CORRECTION|CHARGEBACK|FEE|WRITE_OFF|ROUNDING`), `direction` (`DEBIT|CREDIT`), `amount`, `currency`, `reason` (required), `status` (`DRAFT|APPROVED|POSTED|VOID`), `createdBy`, `approvedBy?`, `ledgerEntryId?`, `createdAt`.
**INV-62** — a posted adjustment always has a matching `LedgerEntry` pair.

### 3.13 Returns, disputes and support

**`ReturnRequest`** — `id`, `orderId`, `sellerOrderId`, `orderLineId`, `quantity`, `type` (`REFUND|EXCHANGE|REPLACE`), `reason` (enum), `status` (`REQUESTED|APPROVED|REJECTED|PICKUP_SCHEDULED|RECEIVED|INSPECTED|RESTOCKED|REFUNDED|CLOSED`), `requestedBy`, `decidedBy?`, `decisionReason?`, `windowExpiresAt` (snapshot), `shippingCostBearer` (`CUSTOMER|SELLER|PLATFORM`), `shippingCostAmount` (BigInt), `receivedAt?`, `inspectedAt?`, `restockedAt?`, `returnShipmentId?`, `refundId?`, `createdAt`.
**INV-63** — a request filed after `windowExpiresAt` is rejected; the check uses the **snapshotted** expiry, not a recomputed one.
**INV-64** — `restockedAt` implies an `IN`/`RESTOCK` `StockMovement` for the returned quantity.
**INV-65** — the 7-day window (D-13) is a **setting**, read from the category/return policy at request time and stored in `windowExpiresAt`; it is not a hard-coded constant.

**`Dispute`** — `id`, `orderId`, `sellerOrderId`, `orderLineId?`, `raisedBy`, `againstShopId`, `category`, `status` (`OPEN|UNDER_REVIEW|AWAITING_EVIDENCE|RESOLVED|REJECTED|CLOSED`), `priority`, `amount` (BigInt, disputed amount), `resolutionType?` (`REFUND_FULL|REFUND_PARTIAL|REJECT|SETTLE`), `resolution?`, `blocksEarnings` (Bool, default true), `resolvedBy?`, `resolvedAt?`, `evidenceDueAt?`, `createdAt`.
**INV-66** — a dispute blocks earnings **only** for `againstShopId`. It never touches other seller orders in the same order.

**`DisputeMessage`** — `id`, `disputeId`, `authorId`, `authorRole` (`CUSTOMER|SELLER|CAREU`), `body`, `attachments` (Json of private keys), `createdAt`. Append-only — both explanations are preserved.

**`SupportCase`** — `id`, `caseNumber` unique, `customerId`, `orderId?`, `sellerOrderId?`, `orderLineId?`, `shopId?` (shop-scoped cases), `category`, `priority`, `subject`, `status` (`OPEN|IN_PROGRESS|WAITING_ON_CUSTOMER|WAITING_ON_THIRD_PARTY|RESOLVED|CLOSED`), `assignedToUserId?`, `firstResponseAt?`, `resolvedAt?`, `resolution?`, `createdAt`, `closedAt`.
**INV-67** — support permissions and financial permissions are disjoint. A support agent may create a case and request a refund, but may not approve one (§5.4).

**`SupportCaseMessage`** — `id`, `caseId`, `authorId`, `body`, `isInternal` (Bool), `attachments` (Json), `createdAt`.
**INV-68** — `isInternal = true` messages are **never** returned by any customer-facing query. Enforced in the data-access layer, not in the UI.

**`SupportCaseAttachment`** — `id`, `caseId`, `messageId?`, `storageKey` (private), `fileName`, `mimeType`, `sizeBytes`, `uploadedBy`, `createdAt`, `retentionUntil`.
**`CaseStatusEvent`** — `id`, `caseId`, `fromStatus`, `toStatus`, `actorId`, `note`, `createdAt`.

### 3.14 Storefront CMS

**`StorefrontPage`** — the identity of an editable surface.
`id`, `scope` (`HOMEPAGE|LANDING_PAGE|THEME|FOOTER|ANNOUNCEMENT`), `pageKey` (unique per scope), `slug?` (unique, for landing pages), `title`, `seoTitle?`, `seoDescription?`, `noindex` (Bool), `activeRevisionId?` (FK StorefrontRevision), `isEnabled` (Bool), `createdBy`, `createdAt`, `updatedAt`.
**INV-69** — the live storefront reads **only** `activeRevisionId`. A draft is reachable only through a preview route requiring a publishing permission and an explicit preview token.

**`StorefrontDraft`** — the mutable working copy. `id`, `pageId`, `content` (Json — the validated section array / token map), `basedOnRevisionId?`, `updatedBy`, `updatedAt`.
Unique `pageId` — one draft per page. Editing a draft never touches `activeRevisionId`.

**`StorefrontRevision`** — immutable published snapshot.
`id`, `pageId`, `revisionNumber` (Int, per page), `content` (Json), `checksum`, `publishedBy`, `publishedAt`, `note?`, `sourceRevisionId?` (for a rollback clone).
Unique `(pageId, revisionNumber)`.
**INV-70** — revision rows are never updated or deleted. A rollback **clones** an old revision's content into a new revision and publishes it, so the history stays complete.

**`NavigationMenu`** — `id`, `key` unique (`HEADER_PRIMARY`, `HEADER_MEGA`, `FOOTER_SHOP`, `FOOTER_LINKS`), `name`, `position`, `isEnabled`, `sortOrder`.
**`NavigationItem`** — `id`, `menuId`, `parentId?`, `labelEn`, `labelBn`, `href?`, `categoryId?`, `productId?`, `promotionId?`, `isExternal`, `isVisible`, `sortOrder`, `badgeEn?`, `badgeBn?`.
**INV-71** — an item has exactly one target: `href` (internal or external), `categoryId`, `productId` or `promotionId`. Publishing validates that every referenced entity still exists and is visible.
**INV-72** — navigation is stored in tables (not JSON) because it must be queried, translated and validated per item. The current static mega menu in `lib/catalog/menu.ts` becomes the seed, and its `getMenu()` contract is preserved so the header component does not change.

**Theme tokens** live in the `THEME`-scoped draft's JSON and are validated against a **closed registry** of allowed token keys and value formats. Arbitrary CSS strings are rejected at validation time. **INV-73** — a section type that is not in the code-level registry cannot be stored, so administrator-supplied code is structurally impossible.

### 3.15 Platform ops

**`AuditLog`** — append-only.
`id`, `actorUserId?`, `actorRole?`, `actorType` (`USER|SYSTEM|GATEWAY`), `action` (dotted, e.g. `payout.approved`), `entityType`, `entityId`, `shopId?`, `before` (Json), `after` (Json), `metadata` (Json), `requestId`, `ip`, `userAgent`, `createdAt`.
**INV-74** — never updated or deleted. Required actions: admin/permission changes, pricing changes, inventory adjustments, seller-trust changes, moderation, settlement/payout, refund approval, publishing, role grants/revokes.
**INV-75** — `before`/`after` payloads are redacted: no secrets, tokens, full OTPs or unmasked personal data.

**`JobRun`** — `id`, `jobName`, `status` (`RUNNING|SUCCEEDED|FAILED`), `startedAt`, `finishedAt?`, `attempt`, `affected` (Int), `error?`, `meta` (Json). Makes background work (reservation expiry, earning eligibility, outbox dispatch, reconciliation, ledger balance check) observable.

**`OutboxMessage`** — `id`, `type`, `payload` (Json), `status` (`PENDING|SENT|FAILED`), `attempts`, `availableAt`, `sentAt?`, `lastError?`, `createdAt`. Written in the same transaction as the business change; a worker drains it.

**`MediaAsset`** — `id`, `storageKey`, `bucketKind` (`PUBLIC|PRIVATE`), `mimeType`, `sizeBytes`, `width?`, `height?`, `checksum`, `uploadedBy`, `createdAt`, `retentionUntil?`.
**INV-76** — a private asset is served only through the signed-URL route, which checks permission and writes an access-log row. Product media lives in the public bucket; seller documents and proof-of-delivery media never do.

**`DocumentAccessLog`** — **required** audit record for every access to a private/sensitive document (D-27). Private documents are **not** covered by a generic application log; a dedicated, append-only row is written on every grant/denial.
`id`, `mediaAssetId` (FK), `ownerType` (`SELLER_APPLICATION|POD|CASE_ATTACHMENT|DISPUTE_ATTACHMENT`), `ownerId`, `actorUserId`, `actorRole`, `scopeType` (`PLATFORM|SHOP|CUSTOMER`), `purpose` (enum: `REVIEW_VERIFICATION|MODERATION|DISPUTE_EVIDENCE|SUPPORT|DELIVERY_CONFIRMATION|CUSTOMER_SELF`), `accessResult` (`GRANTED|DENIED`), `deniedReason?`, `requestId` (correlates to the structured request log), `ipHash?` (hashed — never raw), `createdAt`.
**INV-76a** — the signed-URL route writes exactly one `DocumentAccessLog` row per request, on both `GRANTED` and `DENIED`, **before** returning the URL. If the audit write fails, the URL is **not** returned (fail closed).
**INV-76b** — the log stores the document **reference**, never the signed URL, never the document bytes, never raw IP. Signed URLs are short-lived and not logged.
**INV-76c** — retries and duplicate requests produce distinct rows; the log is append-only and never updated or deleted (retained per §10, never shorter than the document's own retention).

**`PlatformSetting`** — `id`, `key` unique, `value` (Json), `description`, `updatedBy`, `updatedAt`. Holds non-secret configuration (e.g. the review moderation mode, return window defaults, notification toggles). Secrets never appear here.

---

## 4. Relationships and cardinalities

| From | To | Cardinality | Notes |
|---|---|---|---|
| User | Shop (owner) | 0..1 | `@@unique([ownerUserId])` — one shop per account |
| User | UserRoleAssignment | 1..* | a user may hold roles in several shops + platform |
| Role | RolePermission | 1..* | |
| Category | Category | 0..* (parent) | tree, with a materialised `path` |
| Category | Product | 1..* | |
| Product | ProductVariant | 1..* | |
| Product | Offer | 0..* | a shared product may be offered by many shops |
| Offer | Shop | n..1 | |
| Offer | OrderLine | 1..* | |
| Order | SellerOrder | 1..* | **one per shop in the checkout** |
| SellerOrder | OrderLine | 1..* | |
| SellerOrder | Shipment | 1..* (usually 1) | + returns point back via `parentShipmentId` |
| Order | Payment | 1..* | one per attempt; COD + online are the same model |
| Payment | PaymentAllocation | 1..* | splits a payment across seller orders |
| PaymentAllocation | SellerOrder | n..1 | |
| SellerOrder | SellerEarning | 0..1 | not created for first-party |
| SellerEarning | PayoutEarning | 0..* | a payout may cover several earnings |
| PayoutBatch | Payout | 1..* | |
| Payout | Shop | n..1 | never the first-party shop |
| OrderLine | Review | 0..1 | `@@unique([orderLineId])` |
| OrderLine | ReturnRequest | 0..* | one per quantity-level request |
| SellerOrder | Dispute | 0..* | blocks only that seller order |
| SupportCase | Order / OrderLine | 0..1 | optional link |
| Shipment | DeliveryAttempt | 1..* | |
| DeliveryAttempt | ProofOfDelivery | 0..1 | |
| Shipment | CashCollection | 0..* | one per collection event |
| StorefrontPage | StorefrontDraft | 1..1 | one mutable draft |
| StorefrontPage | StorefrontRevision | 1..* | immutable history; `activeRevisionId` points at the live one |
| MediaAsset | (referenced by) | — | product media, documents, POD, attachments |
| MediaAsset (private) | DocumentAccessLog | 1..* | every grant/denial of a private asset is logged (D-27) |

---

## 5. Key invariants and unique constraints

The numbered list above (§3) is the field-level detail. The load-bearing ones, restated:

### 5.1 Structural
- **INV-1** One third-party shop per seller account.
- **INV-2** Exactly one first-party shop.
- **INV-6/7** Seller-unique products are shop-scoped; `status` is never an availability state.
- **INV-8** A catalogue variant has no price and no stock.
- **INV-12** SKU is unique **per shop**, not globally.
- **INV-14** A seller may only offer their own unique products.

### 5.2 Money
- **INV-38** `grandTotal = subtotal − discount + delivery + tax`.
- **INV-25a / §3.6.1** Discount funding splits and per-line allocations are snapshotted; `Σ line discount == sellerOrder == order`; largest-remainder rounding is deterministic and asserted before commit.
- **INV-41/42** Line snapshots are immutable; their sums reconcile to the order, seller order and commission.
- **INV-53** Refund lines sum to the refund; refunded quantity never exceeds the line quantity.
- **INV-54 / INV-54a** `netAmount = gross − commission + adjustments`, where `gross` counts only the seller's funding share.
- **INV-56a** `SellerEarning` (eligibility record) reconciles to the ledger `SELLER_PAYABLE − SELLER_RECEIVABLE`; the two are distinct concepts.
- **INV-58** Every document's ledger entries balance (debits == credits); **INV-58a** account vs source transaction vs seller earning are distinct.
- **INV-58b** Gateway fees are never silently netted from sellers (D-23).
- **INV-58c / INV-46a** COD shortages stay in `COD_SHORTAGE_PENDING` until an approved adjustment resolves them (D-26); **INV-46b (D-32)** CareU owns the investigation and the discrepancy is never auto-classified as seller debt or a confirmed CareU expense — it is closed by an evidenced, approved adjustment (recovered / CareU-absorbed / seller-charged). Courier-held cash is tracked via `CashCollection.custodyAmount`.
- **INV-57** Ledger rows are never edited or deleted; corrections are reversing entries.
- **INV-60a / INV-61a/61b/61c** Sub-threshold earnings roll forward; failed transfers never mark earnings paid; retries are idempotent.

### 5.3 Inventory
- **INV-13** `stock >= 0`, enforced by the conditional UPDATE, verified by affected-row count; `stock` is available-to-sell.
- **INV-16** `Offer.stock` (available-to-sell) always equals the net sum of its `StockMovement` rows.
- **INV-19/20/20a** Reservations are idempotent per checkout attempt; expiry/conversion are conditional transitions; the release winner posts exactly one reversing movement.

### 5.4 Authorization
- **INV-48** `@@unique([gateway, providerEventId])` — a replayed IPN has no second effect.
- **INV-51** A COD refund cannot complete without approval, destination and reference.
- **INV-67** Support and financial permissions are disjoint.
- **INV-68** Internal case notes never appear in customer-facing reads.
- **INV-74/75** Audit rows are append-only and redacted.

### 5.5 Privilege escalation prevention
- A role assignment carries a scope. A `SHOP`-scoped assignment **cannot** hold a platform permission — enforced when the role is created or the assignment is granted, and re-checked at authorization time.
- Permissions marked `isSensitive` (finance, publishing, role management) require MFA. A session without a verified second factor is treated as lacking those permissions, not as a special error state.
- `scopeId` is derived server-side from the assignment. A request may **narrow** a scope (a staff member with two shops may pick one) but may never **widen** it.
- First-party shop access is granted by platform permissions only, never by a shop-scoped assignment.

---

## 6. Financial ledger concept

**Two layers, one truth.**

1. **Snapshot layer** — `Order`, `SellerOrder`, `OrderLine`, `Refund`, `Payout` carry immutable money columns. These answer "what did the customer pay and what was the price of this line?" instantly, and they are what a customer, a seller, an auditor and the tax record need. They are never recomputed.
2. **Ledger layer** — `LedgerEntry` rows answer "where did the money go, and did every document balance?" They carry the account, direction, and references to the source document. They are append-only.

**Account set (with purpose classification):**

| Account | Class | Purpose |
|---|---|---|
| `PLATFORM_CASH` | CASH | CareU's cash/bank position |
| `PLATFORM_REVENUE` | REVENUE | first-party sale revenue |
| `PLATFORM_COMMISSION` | REVENUE | marketplace commission earned |
| `SELLER_PAYABLE` | PAYABLE | amount owed to a seller |
| `SELLER_RECEIVABLE` | RECEIVABLE | amounts owed by a seller/CareU to the other |
| `DELIVERY_REVENUE` | REVENUE | delivery charges collected |
| `REFUNDS` | EXPENSE | refunds issued |
| `TAX_PAYABLE` | PAYABLE | tax collected on behalf of a jurisdiction (unused at launch) |
| `GATEWAY_FEES` | EXPENSE | payment-gateway fees (CareU-absorbed, D-23) |
| `PLATFORM_EXPENSES` | EXPENSE | other platform operating costs |
| `COD_SHORTAGE_PENDING` | ADJUSTMENT | unresolved COD shortages awaiting reconciliation (D-26) |
| `PLATFORM_ADJUSTMENT` | ADJUSTMENT | balancing/adjustment postings |

**The three concepts (do not conflate — INV-58a):**
- **Account** — *what kind of balance* moved (the enum above).
- **Source transaction** — *which document* produced the entry (`sourceTransactionType` + the FK to order/refund/payout/collection/adjustment).
- **Seller earning** — the *eligibility/obligation record* in `SellerEarning` (INV-56a). It is **not** a ledger account and is not money in motion; it reconciles to `SELLER_PAYABLE`.

**Illustrative flows (amounts are placeholders, not rates):**

| Event | Debit | Credit |
|---|---|---|
| Online order captured (third-party) | `PLATFORM_CASH` | `SELLER_PAYABLE` (per seller) |
| Online order captured (first-party) | `PLATFORM_CASH` | `PLATFORM_REVENUE` (CareU's own sale) |
| Delivery charged to customer | `PLATFORM_CASH` | `DELIVERY_REVENUE` |
| Commission recognised | `SELLER_PAYABLE` (per seller) | `PLATFORM_COMMISSION` |
| Gateway fee charged to CareU | `GATEWAY_FEES` | `PLATFORM_CASH` |
| COD collected at delivery (D-08/D-31) | `PLATFORM_CASH` (cash now held by CareU/courier) | `SELLER_PAYABLE` (CareU now owes the seller's share) |
| COD custodied by courier, not yet at CareU (D-31) | `SELLER_RECEIVABLE` (amount owed by courier/staff to CareU) | `PLATFORM_CASH` (cash-under-remittance account) |
| COD short-collected (D-26/D-32) | `COD_SHORTAGE_PENDING` | `PLATFORM_CASH` (the missing cash, open item, not absorbed) |
| COD shortage recovered from the courier/custodian (D-32) | `PLATFORM_CASH` | `SELLER_RECEIVABLE` (custodian settles) |
| COD shortage absorbed by CareU (approved write-off, D-32) | `PLATFORM_EXPENSES` | `COD_SHORTAGE_PENDING` |
| COD shortage charged to the seller (only on evidence, D-32) | `SELLER_RECEIVABLE` | `COD_SHORTAGE_PENDING` |
| COD over-collected (D-32) | `PLATFORM_CASH` | a COD overage open-item account (open item, resolved like a shortage) |
| Payout executed | `SELLER_PAYABLE` | `PLATFORM_CASH` |
| Refund issued (seller-funded) | `SELLER_PAYABLE`; separately reverse `PLATFORM_COMMISSION` | `PLATFORM_CASH` |
| Refund issued (CareU-funded discount) | `REFUNDS` | `PLATFORM_CASH` |
| Post-payout correction (late return/chargeback/fee, D-31) | `SELLER_RECEIVABLE` (seller now owes CareU) | `PLATFORM_CASH` or the affected account |
| Adjustment | `PLATFORM_ADJUSTMENT` | the affected account |

Each row above is one document; a real document posts several of these rows together and must net `Σ DEBIT == Σ CREDIT` as a set (INV-58/INV-58d). The COD collection case, for example, debits `PLATFORM_CASH` for the cash received and credits `SELLER_PAYABLE` for the seller's share, with the CareU commission credited to `PLATFORM_COMMISSION` and any delivery to `DELIVERY_REVENUE` in the same set.

**Convention (fixed — D-28).** The ledger is **double-entry at document granularity in integer poisha**. Every entry carries `DEBIT` or `CREDIT`. Every account has a **normal side** determined by its `accountClass`:

| `accountClass` | Normal side |
|---|---|
| `CASH`, `RECEIVABLE`, `EXPENSE`, `ADJUSTMENT` | **Debit-normal** |
| `PAYABLE`, `REVENUE` | **Credit-normal** |

An account's signed balance is `Σ DEBIT − Σ CREDIT` (debit-normal) or `Σ CREDIT − Σ DEBIT` (credit-normal). Debit and credit are not "signs on a single number" — they are the two sides of each document's balanced posting, and the balance assertion compares their totals.

**Rules**
- Every **document's** `Σ DEBIT == Σ CREDIT`, asserted in code before commit; an imbalance means the transaction does not commit (§11.4). `RECONCILE_LEDGER` re-asserts it nightly per document **and per seller scope**; a mismatch is an alert, never a silent fix (INV-58, INV-58d).
- A seller balance is `SUM(entries where shopId = X and account ∈ {SELLER_PAYABLE, SELLER_RECEIVABLE})` applied to each account's normal side — **derived, never stored**. There is no balance table to drift. This balance must reconcile with the seller's `ELIGIBLE`/`PAYABLE` earnings (INV-56a). A debit-normal account driven negative (e.g. `PLATFORM_CASH` below cash actually held) is a reconciliation alert.
- **Gateway fees are not silently netted from sellers.** They post to `GATEWAY_FEES`; charging a fee to a seller requires an approved `FinancialAdjustment` (INV-58b).
- **COD discrepancies are CareU's to investigate and are never auto-assigned (D-32).** A shortage sits in `COD_SHORTAGE_PENDING` until an evidenced, approved adjustment resolves it one of three ways — recovered from the custodian, absorbed by CareU, or (on evidence) charged to the seller (INV-58c/INV-46b). Courier-held cash is tracked separately from cash received by CareU.
- **Post-payout corrections never reopen a `PAID` payout (D-31).** A late return/dispute/chargeback/fee is a new approved `FinancialAdjustment` + reversing entry pair that leaves a `SELLER_RECEIVABLE` or `SELLER_PAYABLE` recovered on the next payout; the completed payout is immutable.
- Reversals are explicit: a new entry with `reversalOfId` pointing at the original, and the original is untouched.

**Scope of the engine (explicit):** this is a **document-level balanced double-entry ledger**, not a general accounting system — no period close, no cost centres, no multi-currency translation, no trial balance beyond the per-document/per-scope assertions. That is the deliberate boundary. A general ledger would be a large, high-maintenance subsystem the single-currency, single-entity launch does not need. The account enum is a fixed set, so extending it later is a migration, not a rewrite.

---

## 7. Inventory ledger concept

`StockMovement` is an append-only, per-offer ledger of stock; `Offer.stock` is its **materialised current balance**.

**Semantics (single definition, §11.1):** `Offer.stock` is **available-to-sell** — physical on-hand **minus** units held by `ACTIVE` reservations. It is **not** raw on-hand. A reservation reduces `stock` immediately (via the `OUT`/`SALE` movement); a release/expiry restores it (via the `IN`/`RESERVATION_RELEASE` movement). Nothing else subtracts for a reservation, so there is no double subtraction.

```
SUM(CASE WHEN direction='IN' THEN quantity ELSE -quantity END)  ==  Offer.stock   (available-to-sell)
```

This is maintained inside the same transaction as every change:

| Action | Movement | `Offer.stock` |
|---|---|---|
| Checkout reservation | `OUT` / `SALE` | −qty (atomic conditional UPDATE) |
| Reservation expired / cancelled | `IN` / `RESERVATION_RELEASE` | +qty (idempotent: only the `ACTIVE → EXPIRED` winner posts) |
| Supplier receipt | `IN` / `RESTOCK` | +qty |
| Return received and restocked | `IN` / `RETURN` | +qty |
| Damage write-off | `OUT` / `DAMAGE` | −qty (requires a note) |
| Manual correction | `IN` or `OUT` / `ADJUSTMENT` | ±qty (requires a note + audit) |

`StockMovement` rows are never updated or deleted. A correction is a compensating movement, and the audit log records the before/after.

**Reservations** are a separate table because they have a lifecycle (TTL, conversion, release) that a movement does not. A reservation and its `SALE` movement are written together at checkout; a release writes its compensating `RESERVATION_RELEASE` movement.

---

## 8. State machines

### 8.1 Order
`PENDING → CONFIRMED → PARTIALLY_FULFILLED → FULFILLED → COMPLETED`, with `CANCELLED` reachable from `PENDING`/`CONFIRMED`. `COMPLETED` is reached when payment is captured **and** fulfilment is complete (and the return window has not yet blocked anything — completion is about fulfilment, not about the return window closing).

### 8.2 Seller order
`PENDING → ACCEPTED → PACKING → READY_TO_SHIP → SHIPPED → (PARTIALLY_DELIVERED) → DELIVERED`, with `PARTIALLY_CANCELLED` / `CANCELLED` branches.

### 8.3 Line fulfilment
`PENDING → PICKED → PACKED → SHIPPED → DELIVERED`, with `PARTIALLY_CANCELLED` / `CANCELLED` / `RETURNED`.

### 8.4 Payment
`PENDING → AUTHORIZED → CAPTURED → (PARTIALLY_REFUNDED) → REFUNDED`; `FAILED`, `EXPIRED`, `CANCELLED` are terminal branches. COD follows `PENDING → CAPTURED` on successful collection, `PENDING → FAILED` on refusal/shortage.

### 8.5 Shipment
`PENDING → ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED`, with `FAILED_ATTEMPT` (retryable, loops back to `ASSIGNED`), `RETURNED` and `CANCELLED`.

### 8.6 Return
`REQUESTED → APPROVED → PICKUP_SCHEDULED → RECEIVED → INSPECTED → RESTOCKED → REFUNDED → CLOSED`; `REJECTED` branches from `REQUESTED`/`APPROVED`.

### 8.7 Dispute
`OPEN → UNDER_REVIEW → (AWAITING_EVIDENCE) → RESOLVED | REJECTED → CLOSED`.

### 8.8 Support case
`OPEN → IN_PROGRESS → (WAITING_ON_CUSTOMER | WAITING_ON_THIRD_PARTY) → RESOLVED → CLOSED`.

### 8.9 Payout batch
`DRAFT → PENDING_APPROVAL → APPROVED → PROCESSING → PAID | PARTIALLY_PAID | FAILED`, with `CANCELLED` from `DRAFT`/`PENDING_APPROVAL`.

### 8.10 Payout
`PENDING → PROCESSING → PAID | FAILED → RETRY → PROCESSING`.

### 8.11 Refund
`REQUESTED → APPROVED → PROCESSING → COMPLETED | FAILED`, with `REJECTED` from `REQUESTED`/`APPROVED`. Only `APPROVED` may move money; `PROCESSING` with an `UNCERTAIN` gateway outcome is reconciled before retry (D-30, INV-51a/52a).

### 8.12 Earning
`PENDING → ELIGIBLE → PAYABLE → PAID`; `BLOCKED` (dispute) can supersede `PENDING`/`ELIGIBLE` and returns to `ELIGIBLE` when the dispute resolves; `REVERSED` is terminal.

### 8.13 Seller application
`DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED | REJECTED`; `REJECTED → SUBMITTED` on resubmission (new `reviewCycle`).

### 8.14 Offer / product
`DRAFT → PENDING_REVIEW → PUBLISHED → (PAUSED | ARCHIVED)`; `REJECTED → DRAFT` after correction.

**State-change rules (all domains):** transitions are performed by named service functions that validate the current state, write the new state, append a status event, and write the audit entry — in one transaction. A transition that is not in the table above is an error, not a fallback.

---

## 9. Tenant and permission boundaries

| Boundary | Enforcement |
|---|---|
| Platform staff | `scopeType = PLATFORM` assignments; a query with no shop filter |
| Shop staff | `scopeType = SHOP` assignments; every query filtered by `shopId ∈ assigned shop ids` |
| Seller owner vs. staff | Both shop-scoped; the owner additionally has `seller.shop.manage` (staff invitations, shop settings, payout destination) |
| Customer | Every customer-owned table carries `userId`; reads filter by `userId = session.user.id` |
| First-party shop | Only platform permissions reach it; excluded from all seller-workspace queries |
| Support | `shopId` may be set on a case (shop-scoped support); internal notes never cross to the customer |
| Finance | Separate permission namespace; cannot read seller catalogue drafts; cannot edit orders |
| Public storefront | No session required for catalogue reads; `robots`/`noindex` for private surfaces, plus server-side authorization for private data |

**The scoping rule:** a data-access function receives an `AccessScope` object (`{ kind: 'PLATFORM' } | { kind: 'SHOP', shopIds: string[] }`) and is responsible for applying it. A repository function that does not take a scope is a review blocker.

---

## 10. Deletion, retention and snapshot policies

| Data | Policy |
|---|---|
| `User` | Never hard-deleted. Anonymise name/email/phone, set `anonymizedAt`/`deletedAt`. `Session`/`Account` cascade. |
| `Order`, `SellerOrder`, `OrderLine` | Never deleted. Retained for the statutory period. |
| `LedgerEntry`, `StockMovement`, `PaymentEvent` | Append-only, never deleted, never updated. |
| `SellerEarning`, `Payout`, `PayoutAttempt` | Retained with the financial record. |
| `AuditLog` | Append-only. Retention configurable, but never shorter than the retention of the actions it records. |
| `SellerApplicationDocument` | Private; `retentionUntil` set by policy (open question O-4). Deletion is a hard delete of the object **and** the row, with an audit entry. |
| `ProofOfDelivery` media | Private; retained for the order's retention period. |
| `SupportCaseAttachment` | Private; `retentionUntil` per policy. |
| `MediaAsset` | `retentionUntil`; unreferenced public assets are swept by a job. |
| `Notification` | Retained as history; older rows can be pruned (not a financial record). |
| `Product` / `Offer` | Archived, not deleted, while referenced by any order line. |
| `Category` | Deactivated, not deleted, while referenced. |
| `StorefrontRevision` | Never deleted (revision history is an explicit requirement). |
| `StorefrontDraft` | Replaced in place; old draft content is superseded, not retained as history. |
| `Promotion` | Archived, not deleted, while referenced by a redemption. |

**The rule:** a row that carries a financial or audit obligation is never hard-deleted. A row that carries only operational data may be deleted once it is unreferenced and past its retention date, and the deletion is audited.

---

## 11. Transaction and concurrency requirements

### 11.1 Stock semantics (decide once, do not double-count)
- `Offer.stock` is the **available-to-sell** quantity: physical on-hand units **minus** units already held by an `ACTIVE` (non-expired) `StockReservation`. In other words, `stock` is decremented at reservation time and restored only if the reservation is released or expires.
- There is therefore **no second subtraction** for reservations anywhere else. A reservation is represented by (a) the `StockReservation` row and (b) the matching `OUT` / `SALE` `StockMovement`; the balance is already reflected in `Offer.stock`.
- `StockMovement` records the **physical** movement (the unit genuinely left available stock at reservation). `StockReservation` records the **hold lifecycle**. They are consistent because they are written together, once.
- A concurrent checkout sees only `available-to-sell`. Two customers cannot both reserve the last unit, because the reservation decrements the same counter the second reader checks.
- **Explicit non-goal:** we do not model "on-hand" and "available" as two separate columns at launch. One counter (`stock`) = available; reservations are the only thing that reduces it before a sale. This avoids the classic double-subtraction bug.

### 11.2 The checkout transaction (the critical one)
The protocol assumes PostgreSQL `READ COMMITTED` (Prisma's default isolation). `SELECT ... FOR UPDATE` is **necessary but not sufficient** on its own: the correctness guarantee is the combination of deterministic lock ordering, row locks, and the conditional decrement with an affected-row assertion. Steps:

1. **Idempotency first, outside the reservation work.** Insert the `CheckoutAttempt` guarded by `@@unique([idempotencyKey])`. If a row already exists, return its stored result and stop — never proceed to reserve stock a second time.
2. **Load and lock offers in a deterministic order.** `SELECT ... FROM offer WHERE id IN (…) ORDER BY id FOR UPDATE`. Deterministic ordering (by `offer.id`) is what makes deadlock impossible between two concurrent checkouts that share offers in a different request order; without it, the two transactions can lock in opposite orders and deadlock.
3. **Re-validate from the database, not the client payload:** offer `status = PUBLISHED`, shop `status = ACTIVE`, price, `minOrderQty`/`maxOrderQty`, and that no `source = SELLER` product is being offered by the wrong shop.
4. **Atomic conditional decrement, per line, in the same deterministic order:** `UPDATE offer SET stock = stock - :qty, version = version + 1 WHERE id = :id AND stock >= :qty`. Assert `affected rows == 1`. If any line yields 0 rows, **throw** — the whole transaction rolls back, restoring every earlier decrement in this attempt. This single conditional UPDATE is the anti-oversell guard; the row locks above make the read/validate consist and the ordering prevents deadlocks.
5. **Write the inventory records:** `StockMovement` (`OUT` / `SALE`) per line, then `StockReservation` (`ACTIVE`, `expiresAt = now + TTL`).
6. **Compute and snapshot pricing** in a fixed order: line subtotals → promotion allocation (largest-remainder, §3.6.1) → delivery per seller shipment → tax (currently 0) → grand total. Persist the pricing snapshot and the funding split.
7. **Create `Order` → one `SellerOrder` per shop → `OrderLine` rows** (immutable snapshots). Create `SellerEarning` rows **except** for first-party shops.
8. **Create `Payment`** and its **`PaymentAllocation`** rows; write the **balanced `LedgerEntry` set** for the sale, commission, delivery and any first-party revenue; insert `OutboxMessage` rows.
9. **Assert balance** (debits == credits for every document written) in code before commit.
10. **Commit.**

Any failure rolls back **everything**, including the stock decrements. The `AGENTS.md` atomic-decrement rule is satisfied: the decrement and its verification happen inside this transaction, against the offer row (§D-05 amendment).

**Payment gateway is always outside this transaction.** Required flow for online payment:
- **Phase 1 (reserve + create order):** run the transaction above with `Payment.status = PENDING` and no gateway reference. Commit. Stock is now held by reservations with a TTL.
- **Phase 2 (call gateway):** create a `PaymentAttempt`, call SSLCommerz **outside any transaction**, and store the gateway session/redirect reference.
- **Phase 3 (settle on verified callback or reconciliation):** the verified `PaymentEvent` (or a reconciled gateway query) moves `Payment.status` to `CAPTURED` and finalizes the order state. **Neither the gateway response to the browser nor the browser redirect is authoritative** — only a signature-verified server-to-server event or a reconciled query settles the order.
- A reservation that is not settled before `expiresAt` is released (§11.3), and the orphaned `CheckoutAttempt`/`Order` is moved to an expired/cancelled state by reconciliation. This closes the gap between reservation and payment confirmation **without** trusting the browser.

### 11.3 Reservation lifecycle, crash recovery and reconciliation
- **Expiry:** an `ACTIVE` reservation past `expiresAt` is released by a background job (`RELEASE_EXPIRED_RESERVATIONS`). Release is a conditional transition: `UPDATE stock_reservation SET status='EXPIRED' WHERE id=? AND status='ACTIVE'`; only the winner (affected rows == 1) posts the compensating `IN` / `RESERVATION_RELEASE` `StockMovement` and restores `Offer.stock`. This makes release **idempotent** — two workers, or a worker plus a checkout, cannot restore the same units twice.
- **Crash between commit and job execution:** because the reservation row and its `expiresAt` are committed in the same transaction as the order, a crash before the job runs is safe: the units stay held (never oversold) and the next job pass releases them once `expiresAt` passes. The job scans by `(status, expiresAt)` — it holds no in-memory state, so a restart simply re-scans. `JobRun` records each pass; a stale `JobRun` (last success too long ago) is an operational alert.
- **Expiry racing a checkout completion:** if the checkout transaction commits the reservation as `CONVERTED` before the release job claims it, the conditional release matches 0 rows and does nothing. If the release wins first, the checkout's own conditional transitions (and its `stock >= qty` check) fail and the attempt rolls back cleanly. Stock is never both released and sold.
- **Reconciliation job:** `RECONCILE_PAYMENTS` finds payments stuck in `PENDING`/`AUTHORIZED` past a threshold, queries the gateway for the authoritative state, and either settles or expires them — releasing reservations. `RECONCILE_LEDGER` asserts debits == credits per document and per seller scope. `RECONCILE_PAYOUTS` compares open payouts against transfer outcomes.
- **No reliance on the browser:** the reconciliation path means a customer who pays and then closes the browser still gets a settled order.

### 11.4 Financial invariants
- The ledger is **double-entry at document granularity** (D-28): for every document written in this transaction, `Σ DEBIT == Σ CREDIT`, asserted in code before commit. Each account's normal side is fixed by its `accountClass`, and its signed balance is `Σ DEBIT − Σ CREDIT` (debit-normal) or `Σ CREDIT − Σ DEBIT` (credit-normal) — there is no "signed single number" convention (INV-58d).
- Money never changes by arithmetic on a stored balance; it changes by appending ledger entries. There is no `balance = balance - x` update anywhere.
- Refunds, payouts and adjustments are idempotent by `IdempotencyKey` and by a uniqueness constraint on the business reference (e.g. one `Payout` per `(batchId, shopId)`).
- Discount allocation **and** the funding split are computed by the same deterministic largest-remainder primitive (§3.6.1, D-25/D-29), and `Σ` is asserted before commit.
- A **`PAID` payout is immutable**; a post-payout correction is a new approved `FinancialAdjustment` + reversing entry pair (D-31). A refund never moves money before `APPROVED`, and never posts ledger entries before `COMPLETED` (D-30).
- **CareU owns the COD workflow end-to-end (D-08) and every COD discrepancy investigation (D-32).** A COD discrepancy is never auto-classified as seller debt or a confirmed CareU expense; it is closed only by an evidenced, approved `FinancialAdjustment` (recovered from custodian / CareU-absorbed / seller-charged). Courier-held cash is tracked separately from cash received by CareU (INV-46b).

### 11.5 Concurrency controls
| Race | Control |
|---|---|
| Two customers buy the last unit | Deterministic-order `SELECT … FOR UPDATE` + conditional `UPDATE … WHERE stock >= qty` + affected-row assertion; loser rolls back |
| Deadlock between concurrent checkouts sharing offers | Offers locked in `ORDER BY id` — a total lock order, so no cycle is possible |
| Same checkout submitted twice | `@@unique([idempotencyKey])` on `CheckoutAttempt` (step 1, before any reservation) |
| Duplicate IPN | `@@unique([gateway, providerEventId])` on `PaymentEvent` |
| Two admins approve the same refund | Optimistic concurrency (`version`) on `Refund` + state check |
| Promotion limit exceeded | Conditional `UPDATE promotion SET used_count = used_count + 1 WHERE id = ? AND used_count < limit` |
| Two payout batches pick the same earning | Conditional transition (`status = 'ELIGIBLE' → 'PAYABLE'`); a losing batch sees 0 rows affected |
| Reservation expiry vs. checkout completion | Conditional `ACTIVE → EXPIRED` / `ACTIVE → CONVERTED`; the loser does no stock work |
| Seller edits price during checkout | Checkout validates under the row lock; the edit bumps `Offer.version`; a conflicting write is rejected |
| Review submission twice | `@@unique([orderLineId])` |
| Two default addresses | Partial unique index on `(user_id) WHERE is_default` |

### 11.6 Usage-limit enforcement
Promotion limits are enforced with a conditional update inside the checkout transaction (§11.5), never by a read-then-write.

### 11.7 Outbox pattern
Business change and `OutboxMessage` are written in the same transaction. A worker (scheduled job) sends email/SMS/in-app notifications, retries with backoff, and records the outcome. `JobRun` records each worker pass. This removes the "committed order but lost confirmation email" failure without a broker.

### 11.8 External calls
No database transaction may span a network call to the gateway, an SMS/email provider, or object storage. Long transactions must stay well under the connection timeout, which is one reason the Neon direct-connection question (O-2) matters. **Verified assumption:** this protocol relies on PostgreSQL `SELECT ... FOR UPDATE` and `READ COMMITTED` semantics and on Prisma interactive transactions (`$transaction` with a client callback); both are supported by the installed Prisma 7 + `@prisma/adapter-pg` stack. Before implementation, confirm the transaction protocol against a local PostgreSQL 18 instance and re-confirm against Neon 16/17, since the two differ (§13.3 R-1/R-3).

---

## 12. Indexing considerations

Indexes are proposed from the **actual query patterns** named above, and must be confirmed with `EXPLAIN` against real data before the production migration is finalised.

| Table | Index | Serves |
|---|---|---|
| `offer` | `(shopId, status)` | Seller workspace listing |
| `offer` | `(productId, status, price)` | Product page: eligible offers by price |
| `offer` | `(productId, isPrimary)` | Product page: primary offer |
| `offer` | `(shopId, sku)` unique | SKU lookup at checkout |
| `offer` | `(status, updatedAt)` | Moderation queue |
| `product` | `(status, categoryId, publishedAt)` | Category browse |
| `product` | `(source, ownerShopId, status)` | Shop-scoped seller products |
| `product` | `(slug)` unique | Product page |
| `category` | `(path)` | Tree expansion |
| `order` | `(userId, createdAt desc)` | Customer order list |
| `order` | `(orderNumber)` unique | Lookup |
| `seller_order` | `(shopId, status, createdAt desc)` | Seller order list |
| `seller_order` | `(orderId)` | Order → seller orders |
| `order_line` | `(sellerOrderId)` | Lines of a seller order |
| `order_line` | `(productId, createdAt desc)` | Product's sold lines / review eligibility |
| `payment` | `(orderId)` | |
| `payment` | `(gateway, gatewayTransactionId)` | Reconciliation |
| `payment_event` | `(gateway, providerEventId)` unique | Replay guard |
| `payment_event` | `(processedAt) WHERE processedAt IS NULL` | Reconciliation queue |
| `stock_movement` | `(offerId, createdAt desc)` | Stock history for an offer |
| `stock_movement` | `(referenceType, referenceId)` | Trace a movement to its document |
| `stock_reservation` | `(status, expiresAt) WHERE status = 'ACTIVE'` | Expiry job |
| `stock_reservation` | `(checkoutAttemptId, offerId)` unique | Idempotency |
| `seller_earning` | `(status, eligibleAt)` | Eligibility job |
| `seller_earning` | `(shopId, status, periodKey)` | Seller statements and payout build |
| `seller_earning` | `(periodKey, status)` | Payout batch build |
| `ledger_entry` | `(shopId, account, createdAt)` | Seller balance and statements |
| `ledger_entry` | `(orderId)` / `(sellerOrderId)` / `(refundId)` / `(payoutId)` | Document → entries |
| `payout` | `(batchId)`, `(shopId, status)` | Batch and seller views |
| `refund` | `(status, createdAt desc)` | Refund review queue |
| `return_request` | `(orderLineId, status)` | Return eligibility and history |
| `dispute` | `(againstShopId, status)` | Blocking-dispute check |
| `support_case` | `(assignedToUserId, status)`, `(customerId, createdAt desc)` | Work queues |
| `review` | `(productId, status)` | Product page reviews |
| `notification` | `(userId, createdAt desc)`, `(userId) WHERE readAt IS NULL` | Inbox and unread count |
| `audit_log` | `(entityType, entityId, createdAt desc)`, `(actorUserId, createdAt desc)`, `(createdAt)` | Audit views and retention sweeps |
| `user_role_assignment` | `(userId)`, `(scopeType, scopeId)` | Scope resolution on every request |
| `storefront_page` | `(scope, pageKey)` unique | Lookup |
| `storefront_revision` | `(pageId, revisionNumber)` unique | History |

**Full-text search:** `tsvector` columns on `product` (title + description) with a GIN index, plus a `pg_trgm` GIN index on the title for fuzzy matching. Verify Bangla tokenisation quality against real queries before launch (D-18).

---

## 13. Requirements → entity mapping

The full mapping table is `docs/requirements.md` §14. Coverage check — every confirmed requirement area maps to at least one entity:

| Requirement area | Covered by |
|---|---|
| Identity, RBAC, MFA, audit | `Role`, `Permission`, `RolePermission`, `UserRoleAssignment`, `StaffInvitation`, `AuditLog` |
| Seller onboarding and verification | `SellerApplication`, `SellerApplicationDocument`, `SellerApplicationReview`, `Shop` |
| Shop lifecycle (pause/suspend/trust) | `Shop.status`, `Shop.isTrusted` + `AuditLog` |
| Category tree and attributes | `Category`, `CategoryAttribute`, `CategoryAttributeOption`, `ProductAttributeValue` |
| Simple and variant products | `Product`, `ProductVariant`, `Offer` |
| Per-variant SKU/price/stock | `Offer.sku`, `Offer.price`, `Offer.stock` |
| Allowed/restricted/prohibited categories | `Category.accessLevel` + publishing validation |
| Listing approval and moderation | `Offer.status`, `Product.status`, `AuditLog` |
| Inventory ledgers and movements | `StockMovement`, `InventoryLocation`, `Offer.stock` |
| Reservations, no overselling | `StockReservation` + conditional UPDATE |
| Supplier receipts | `Supplier`, `SupplierReceipt`, `SupplierReceiptLine` |
| Low-stock alerts | `Offer.stock` + threshold setting + alert job (`JobRun`) |
| Checkout revalidation and all-or-nothing | `CheckoutAttempt`, `IdempotencyKey`, §11.1 |
| Order snapshots | `OrderLine` snapshot fields |
| Multiple seller orders per checkout | `Order` → `SellerOrder` → `OrderLine` |
| Partial fulfilment/cancellation/returns/refunds | `OrderLine.fulfillmentStatus`, `ReturnRequest`, `Refund`/`RefundLine`, `Shipment.kind` |
| Status history | `OrderStatusEvent`, `CaseStatusEvent`, `CaseStatusEvent` |
| Seller vs. CareU delivery | `Shipment.method`, `Shop.isFirstParty` |
| Proof of delivery | `DeliveryAttempt`, `ProofOfDelivery` |
| Delivery charges, snapshotted | `DeliveryRate`, `DeliveryZone`, `Shipment.deliveryCharge` |
| COD + online payments | `Payment`, `PaymentAttempt`, `PaymentEvent`, `PaymentAllocation` |
| Callback verification and idempotency | `PaymentEvent.signatureValid` + unique constraint |
| Commission by category | `CommissionRule` + snapshot on `SellerOrder` |
| Discounts, funding, proportional allocation | `Promotion`, `PromotionRedemption`, line `discountAmount` |
| Earnings eligibility, dispute holds | `SellerEarning.status`, `blockedReason`, `Dispute.blocksEarnings` |
| COD receivables and remittance | `Shipment.codAmount`, `CashCollection`, ledger `SELLER_RECEIVABLE` |
| Payout batches and failures | `PayoutBatch`, `Payout`, `PayoutEarning`, `PayoutAttempt` |
| Refunds reviewed manually | `Refund.status`, `approvedBy`, `RefundLine` |
| Financial corrections | `FinancialAdjustment` + reversing `LedgerEntry` |
| Tax rules and snapshot | `TaxRule` + `Order.taxTotal` (0 at launch) |
| Wishlist, addresses, reviews | `WishlistItem`, `Address`, `Review`, `ReviewReport` |
| Notifications with history | `Notification`, `NotificationPreference`, `OutboxMessage` |
| Support cases, notes, attachments | `SupportCase`, `SupportCaseMessage`, `SupportCaseAttachment`, `CaseStatusEvent` |
| Disputes preserving both sides | `Dispute`, `DisputeMessage` |
| Storefront section builder, draft/publish, rollback | `StorefrontPage`, `StorefrontDraft`, `StorefrontRevision` |
| Theme tokens, navigation, footer, landing pages | `StorefrontDraft` (THEME scope), `NavigationMenu`, `NavigationItem`, `StorefrontPage` scope `LANDING_PAGE` |
| Private media, signed URLs, access log | `MediaAsset`, `AuditLog` (access entries) |
| Retention and anonymisation | §10 policies + `User.anonymizedAt` |

**Coverage result: no confirmed requirement is unmapped.**

---

## 14. Why the model supports both sales channels without mixing their obligations

The two channels share the catalogue, the cart, the checkout, the order, the delivery, the support and the reporting pipelines. The financial split happens in exactly **one** place, and it is a **snapshot of a flag**, not a second code path.

| Concern | Third-party seller | CareU first-party | Where the difference lives |
|---|---|---|---|
| Listing | `Offer` rows on shared products, or a shop-scoped unique product | `Offer` rows on the first-party shop | `Shop.isFirstParty` |
| Inventory | `StockMovement` in the seller's own ledger | `StockMovement` in CareU's ledger, same table, different `shopId` | `Shop` / `InventoryLocation` |
| Checkout | Identical | Identical | — |
| Order | `Order` → `SellerOrder` (per shop) | `Order` → `SellerOrder` (first-party shop) | — |
| Commission | `commissionAmount > 0` from `CommissionRule` | `commissionAmount = 0` (INV-29) | `SellerOrder` snapshot |
| Seller earnings | `SellerEarning` created, payable | **No `SellerEarning` row at all** (INV-56) | absence of the row |
| Payout | `Payout` + `PayoutEarning` | Impossible (INV-61; the batch builder excludes first-party) | `Payout` |
| Ledger | `SELLER_PAYABLE` / `SELLER_RECEIVABLE` entries | `PLATFORM_REVENUE` only — no seller account is ever touched | `LedgerEntry.account` |
| Disputes | Block that seller's earnings only | No seller earnings to block; the dispute is a CareU cost | `Dispute.againstShopId` |
| Reporting | Seller analytics (sales, commission, balance) | CareU first-party revenue, cost and margin — a **separate** view over `PLATFORM_REVENUE` / `PlatformCost` | view layer |
| Support | May be shop-scoped | CareU support, platform-scoped | `SupportCase.shopId` |
| Access | Shop-scoped permissions | Platform permissions only (INV-4) | `UserRoleAssignment.scopeType` |

**The guarantees this buys:**
1. A first-party sale **cannot** create a seller payable, because the code path that creates `SellerEarning` rows is not reached for a first-party shop, and the payout builder excludes first-party shops independently. Two independent guards.
2. A first-party sale **cannot** be charged commission, because the commission is snapshotted as 0 and `CommissionRule` selection excludes first-party offers.
3. The **ledger is the proof**: for any seller, `SUM(SELLER_PAYABLE) − SUM(SELLER_RECEIVABLE)` is their balance. CareU's first-party revenue appears only under `PLATFORM_REVENUE`, so it can never be mistaken for a seller obligation. A reconciliation query proves the separation rather than asserting it.
4. The two channels keep **separate cost visibility**: `PlatformCost` holds CareU purchase cost and is restricted to procurement/inventory/finance permissions. A third-party seller's cost is never stored, so it can never leak.
5. **One fulfilment pipeline**: the same `Shipment`, `DeliveryAttempt` and `ProofOfDelivery` machinery serves both, so operational maturity arrives once.

---

## 15. Self-review of this proposal

### 15.1 Duplication found
| Issue | Resolution |
|---|---|
| `Coupon` and `Campaign` would be near-identical | Merged into one `Promotion` model with `kind` |
| `ShopStaff` vs. `UserRoleAssignment` | One table (D-22) |
| `Product.source = SELLER` vs. a separate `SellerProduct` table | One `Product` with a source flag and a scoped owner (D-07) |
| `OrderLine` vs. `SellerOrder` financial columns | Deliberate: the order line is the quantity-level truth, the seller order is the shop-level summary. The sums are asserted (INV-42). |
| `Notification` vs. `OutboxMessage` | Different jobs: the outbox is the *delivery* queue, the notification is the *user-visible record*. Not merged. |
| `District` and `Division` | Division is folded into `District` as a string unless a division table is needed for reporting — 64 rows, one table is enough |
| `CategoryAttribute.options` Json vs. `CategoryAttributeOption` | **Recommend the option table**, because attribute values are filter facets and need indexed lookups. The Json column is redundant — drop it |
| `SellerEarning` vs. the ledger seller balance | **Not duplicates** — the earning is the *eligibility/obligation* record, the ledger is *money in motion*; they reconcile (INV-56a) |
| `DocumentAccessLog` vs. `AuditLog` | `AuditLog` records *administrative/financial actions*; `DocumentAccessLog` records *private-document reads* at a per-request granularity and volume. Kept separate so the high-volume access stream never buries the low-volume action trail |

### 15.2 Missing relationships found and added
- `PaymentAllocation` → `SellerOrder` — added, without it a multi-seller order cannot be reconciled per shop.
- `Shipment.parentShipmentId` — added, so returns reuse the outbound machinery.
- `RefundLine.component` — added, so a delivery-charge or tax refund is distinguishable from an item refund.
- `OrderLine.returnStatus` — added, so the line's return state is visible without a join.
- `SellerEarning.payoutId` — added alongside `PayoutEarning`, so the earning→payout link is queryable in both directions without a join table scan.
- `AuditLog.shopId` — added, so shop-scoped audits are filterable.
- `MediaAsset` — added as the single registry for public and private assets, so retention and access rules have one place to live.
- `DocumentAccessLog` — added as the dedicated, append-only audit of private-document access (D-27), separate from `AuditLog`.
- `Payout.recalculationOf` + `PayoutAttempt.idempotencyKey` — added so a failed transfer retry is traceable and idempotent (INV-61a/61c).
- `CashCollection.status` — added so an unresolved COD shortage is an explicit open item until reconciled (INV-46a).
- `CashCollection.custodianType` / `custodyAmount` / `receivedByCareuAmount` / `overageAmount` / `investigatedBy` / `investigationNote` — added so CareU-owned COD custody and discrepancy investigation are explicit and auditable (D-08/D-32, INV-46b).

### 15.3 Ambiguous ownership found and resolved
| Ambiguity | Resolution |
|---|---|
| Who owns the price — the product or the seller? | The **offer** (D-05, D-17). The product owns the description; the offer owns the commercial terms. |
| Who owns stock — the variant or the seller? | The **offer** (D-05). |
| Who owns the return window — the platform or the category? | A **configurable setting** resolved at request time and **snapshotted** onto `ReturnRequest.windowExpiresAt` (D-13, INV-63) |
| Who owns the tax rate? | `TaxRule`, effective-dated; resolved at checkout and snapshotted |
| Who owns the delivery rate? | `DeliveryRate`, effective-dated; resolved and snapshotted onto `Shipment` |
| Who owns the commission rate? | `CommissionRule`, effective-dated; **snapshotted** onto `SellerOrder` |
| Is a notification the outbox row? | No — separate concerns (above) |
| Does a `Review` belong to a product or a line? | A **line** (INV-31); the product is derived |
| Who owns purchase cost? | `PlatformCost`, first-party only (INV-21) |

### 15.4 Unsafe deletion found and fixed
- `User` → anonymise, never delete (§10).
- `Order`/ledger/movements/audit → never delete.
- `Product`/`Offer`/`Category` → archive, not delete, while referenced.
- `SellerApplicationDocument` / POD media / case attachments → hard delete allowed at `retentionUntil`, with an audit entry, because they are private objects with no financial obligation.
- `StorefrontRevision` → never delete (explicit requirement).
- `StockMovement` → never delete; corrections are compensating movements.

### 15.5 Race conditions found and mitigated
All rows of §11.5. The ones that are easiest to get wrong and must be implemented exactly as written:
1. **Checkout** — the offers are locked in deterministic `ORDER BY id` order (deadlock-free), then a conditional `UPDATE … WHERE stock >= qty` with an affected-row assertion, with the movement and the reservation written in the same transaction. Neither the row lock nor the conditional update alone is sufficient; it is the combination.
2. **Payout batch build** — the eligibility transition must be a conditional update, not read-then-write, or two admins can pay the same earning twice.
3. **Reservation expiry vs. checkout completion** — a conditional `ACTIVE → EXPIRED`/`CONVERTED` transition; only the winner does stock work, so units are never both released and sold.
4. **Failed transfer retry** — an `idempotencyKey` per attempt and a reconciliation of `UNCERTAIN` outcomes before retry, so the same money is never sent twice (INV-61c).

### 15.6 Complexity check
| Concern | Assessment |
|---|---|
| ~90+ entities (now +`DocumentAccessLog`) | Large but each is narrow and single-purpose. The alternative (fewer, wider tables with JSON blobs) trades a schema problem for a query, validation and audit problem. |
| The ledger | 12 accounts with an explicit class and a fixed normal side, double-entry at document granularity, one debit==credit assertion per document and per seller scope (INV-58d). A deliberately bounded **document-level balanced ledger** — not a general accounting engine (no period close, cost centres or multi-currency translation). |
| RBAC | 5 small tables. Less code than configuring the organization plugin for a shape it does not model. |
| Storefront CMS | 5 tables + validated JSON. The validation registry is the real complexity, and it is the part that satisfies the "no administrator-supplied code" requirement. |
| EAV for product attributes | One extra table, but it is what makes category-specific attributes filterable without a schema change per category. |
| `OrderLine` + `SellerOrder` + `Order` | Three levels, each with a distinct job (customer / shop / line). The alternative — one wide table — cannot express multi-seller splits or per-line refunds. |

**Verdict:** no unmanageable complexity identified. The largest single risk is not the model but the **inventory concurrency guarantee** and the **first-party/third-party financial separation** — both are stated as invariants and must be implemented exactly.

---

## 16. Unresolved material decisions and their consequences

| ID | Decision | Consequence in this model | Blocks implementation? |
|---|---|---|---|
| O-1 | Review moderation mode | `Review.status` supports both; the review queue differs. No schema impact. | No |
| O-2 | Neon driver + `DIRECT_DATABASE_URL` | No schema impact, but long transactions (checkout, payout) may need a direct connection | No (verify before launch) |
| O-3 | Public order tracking | Needs a signed, order-scoped, time-limited token table or a stateless signed token | No (adds one small table) |
| O-4 | Seller document list and retention | `retentionUntil` is already on the document row | No |
| O-5 | Email vs. email + SMS | `Notification.channel` already carries the channel | No |
| O-6 | SSLCommerz capabilities (hosted checkout, partial refunds, chargeback) | `Refund.method` already supports `GATEWAY` and `MANUAL_TRANSFER`; `PaymentEvent` covers any callback shape | **Payment implementation only** |
| O-7 | Bangladesh regulatory obligations (invoice, VAT, consumer return rights) | The 7-day window and the "no tax at launch" position are both provisional pending this | No (but launch risk) |
| O-8 | Serial/warranty tracking | Not modelled; an extension of `StockMovement` (a serial table keyed by offer + movement) | No (deferred) |
| O-9/O-10 | First-party presentation in seller surfaces | `isFirstParty` supports both behaviours | No |
| O-11 | COD netting mechanics (per-seller receivable vs. explicit batch offset) | `Payout.nettingSnapshot` records whichever is chosen; the ledger reconciles either way (D-26) | No (policy) |
| O-12 | Confirm SSLCommerz fees/caps allow CareU absorption | If not, the D-23 default must be revisited with explicit approval; `GATEWAY_FEES` already isolates the cost | **Payment implementation only** |
| O-13 | Neon driver confirm: interactive transactions + `FOR UPDATE` on the pooled endpoint | The §11.2 protocol assumes a real transaction-capable connection; verify pooled vs. direct (O-2) before launch | No (verify before launch) |
| O-14 | BD regulatory obligations for the specific launch catalogue | Non-regulated catalogue can launch; regulated categories stay unpublished until reviewed (feature/category gate) | No (launch gate per category) |

**Closure classification:** O-2/O-6/O-12/O-13 are **verify at the relevant implementation milestone**; O-7/O-14 are **verify before the affected feature/category ships**; O-1/O-3/O-4/O-5/O-8/O-9/O-10/O-11 are **non-blocking follow-ups** already supported by the model or cleanly deferrable. None of these block building and verifying the application in working stages.

---

## 17. Proposed schema file layout (for when implementation is approved)

`prisma/schema/` already contains `schema.prisma` (generator + datasource) and `auth.prisma` (Better Auth models). Prisma multi-file schemas support relations across files (GA since 6.7.0) and `prisma7.config.ts` already points at the directory with an explicit `migrations.path`.

Proposed additions — **not created yet**:

```
prisma/schema/
  schema.prisma            (existing — generator + datasource; unchanged)
  auth.prisma              (existing — Better Auth models + the relation fields our models need)
  access.prisma            Role, Permission, RolePermission, UserRoleAssignment, StaffInvitation
  seller.prisma            SellerApplication*, Shop, Supplier
  catalog.prisma           Category*, Brand, Product, ProductVariant, ProductAttributeValue, ProductMedia
  offer.prisma             Offer
  inventory.prisma         InventoryLocation, StockMovement, StockReservation, SupplierReceipt*, PlatformCost
  pricing.prisma           Promotion, PromotionRedemption, DeliveryZone, DeliveryRate, TaxRule, CommissionRule
  order.prisma             Order, SellerOrder, OrderLine, OrderStatusEvent
  fulfilment.prisma        Shipment, DeliveryAttempt, ProofOfDelivery, CashCollection
  payment.prisma           Payment, PaymentAttempt, PaymentEvent, PaymentAllocation, Refund, RefundLine
  settlement.prisma        SellerEarning, LedgerEntry, PayoutBatch, Payout, PayoutEarning, PayoutAttempt, FinancialAdjustment
  support.prisma           ReturnRequest, Dispute, DisputeMessage, SupportCase*, CaseStatusEvent
  customer.prisma          Address, District, WishlistItem, Review, ReviewReport, Notification, NotificationPreference
  storefront.prisma        StorefrontPage, StorefrontDraft, StorefrontRevision, NavigationMenu, NavigationItem
  platform.prisma          AuditLog, DocumentAccessLog, JobRun, OutboxMessage, MediaAsset, PlatformSetting, IdempotencyKey, CheckoutAttempt
```

**Migration strategy:** one migration per domain group, in dependency order (access → seller → catalog → offer → inventory → pricing → order → fulfilment → payment → settlement → support → customer → storefront → platform), with the money-bearing groups (`order`, `payment`, `settlement`) migrated last so the ledger and constraints land on tables that already exist. Every migration is additive — no destructive change in the first pass. Raw-SQL additions (partial unique indexes, `tsvector` columns, `CHECK` constraints) go in the same migrations via hand-edited SQL, and are documented in the migration file.

---

**End of proposal. Nothing in this document has been implemented. Explicit approval is required before any schema, migration, seed script or application code is written.**

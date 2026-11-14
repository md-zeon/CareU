# 0004. UI prototype foundation and mock data

**Date**: 2026-11-14
**Status**: Accepted

## Summary

This spec defines the shared foundation for CareU's Facade prototype: a typed mock data layer, reusable layout primitives, and standard page state components so future journeys can render believable screens without real backend reads or writes. It uses a dedicated `lib/mock/` area with representative fixtures for customer, seller, and platform flows, practical design tokens and primitives in code adapted to CareU's Bangladesh first identity, and a small internal showcase to prove the building blocks. Existing shared placeholders such as the catalog menu are refactored onto this foundation while routes stay navigable.

## Requirements

**User stories**:
- As a developer building a prototype journey, I want shared mock data, layout primitives, and state components so that I can create consistent screens quickly without inventing patterns for each feature.
- As a reviewer of the prototype, I want screens to show believable content and clear loading, empty, error, and success states so that I can judge the experience before backend wiring.
- As a developer working in a bilingual marketplace, I want mock content and UI building blocks that support English and Bangla so that the prototype reflects CareU's real audience.

**Acceptance criteria** (the contract, each criterion is independently checkable):
- **AC-1**: A dedicated `lib/mock/` module exists with typed, UI oriented fixtures and exports for all phase groups needed by the prototype: catalog and brands, products, variants, listings, shops and sellers, personas and role views, cart and wishlist, addresses, orders, shipments, payments and COD views, reviews, seller onboarding/moderation and inventory views, payouts/settlements and commission summaries, support/dispute/return records, and platform content/notification/analytics items.
- **AC-2**: Mock data uses strict prototype contract rules: stable string IDs and slugs, explicit cross domain references, integer BDT money values, bilingual `{ en, bn }` fields for user visible content where shown, representative happy path records, and scenario helpers for `default`, `empty`, `loading`, `error`, and `success` where applicable. Consuming journeys get data through typed functions/helpers (sync by default) rather than raw ad hoc objects.
- **AC-3**: Reusable layout primitives are available for prototype journeys, including page containers, page headers, section wrappers, responsive grids or stacks, and card/list/detail shells that can be composed for storefront, seller, and admin screens.
- **AC-4**: Reusable state and feedback components are available and demonstrated: loading/skeleton states, empty states, error states (including a clear recovery affordance where appropriate), success confirmations, and basic form feedback primitives.
- **AC-5**: Design direction is captured as practical tokens and reusable primitives in code, inspired by the reference sites but adapted to CareU's identity (Bangladesh first, English and Bangla, BDT, multi vendor plus CareU first party), and user facing UI labels in the foundation components use next-intl.
- **AC-6**: Existing shared placeholders are refactored onto the new foundation without breaking navigable routes: `lib/catalog/menu.ts` and related menu consumption use the new mock source or compatible typed exports, shared storefront primitives adopt the new foundation where appropriate, and no real database reads, real API calls, or real auth enforcement are introduced.
- **AC-7**: A small internal prototype showcase route or section exists to review layout primitives and loading, empty, error, success, and form feedback states in one place, using local placeholder media assets (reusing and extending `public/products/` SVG placeholders as needed).

## Decision

**Chosen option**: Option 1: Shared typed foundation in code with a dedicated mock layer.

Build a dedicated `lib/mock/` area with typed fixtures and scenario helpers, add practical design tokens and reusable layout/state primitives, refactor shared shell and menu surfaces to consume the foundation, and provide an internal showcase. Keep the foundation prototype only: UI oriented types, no Prisma coupling, no persistence, no real backend or auth enforcement.

**Implementation skills**: none recorded in project context files for this feature. Follow root `AGENTS.md` rules for server/client boundaries, next-intl usage, money as integer BDT, caching, and prototype constraints.

## Feature design

**Data model sketch**:

The mock layer is UI oriented (not Prisma models). All money is integer BDT. User visible content uses `LocalizedText = { en: string; bn: string }` where shown.

| Entity group | Entity | Key fields (representative) | Primary key | Main relationships / cardinality |
|---|---|---|---|---|
| Shared | `MockScenario` and state helpers | scenario: `default \| empty \| loading \| error \| success`; optional message/context; helper return shapes for lists/details/forms | n/a (types/helpers) | Used by domain getters and state components across all groups |
| Catalog | `MockCategory` | id, slug, name: LocalizedText, parentId?, image?, sortOrder, description? | id | Category 0..1 parent to 0..N child categories; Category 1 to 0..N products/listings |
| Catalog | `MockBrand` | id, slug, name: LocalizedText, logo? | id | Brand 1 to 0..N products |
| Catalog | `MockProduct` | id, slug, title/description: LocalizedText, categoryId, brandId?, primaryShopId?, image paths, rating?, reviewCount?, status | id | Product 1 to 0..N variants; Product 1 to 0..N listings; Product 1 to 0..N reviews |
| Catalog | `MockProductVariant` | id, productId, sku, title/options: LocalizedText or labels, priceBdt, compareAtPriceBdt?, availability/stock state | id | Variant N to 1 product; Variant 1 to 0..N listing variants/cart items/order items |
| Catalog | `MockListing` | id, shopId, productId, variantId?, status/moderation state, priceBdt, compareAtPriceBdt?, visible flags | id | Listing N to 1 shop; Listing N to 1 product/variant context; Listing 1 to 0..N cart/order references |
| Shop and seller | `MockShop` | id, slug, name: LocalizedText, type: `careu` or `third_party`, status, logo?, rating? | id | Shop 1 to 0..N listings, shipments, payouts, staff memberships |
| Shop and seller | `MockSellerApplication` | id, applicantPersonaId, type: individual/business, status, submittedAt?, document refs/labels, review notes? | id | Application N to 1 persona/applicant; Application 1 to 0..N verification document records |
| Shop and seller | `MockSellerStaff` | id, shopId, personaId, role label, status | id | Staff N to 1 shop; Staff N to 1 persona |
| Identity | `MockPersona` | id, kind: guest/customer/seller owner/seller staff/platform, displayName: LocalizedText or string, contact labels?, shopId?, platformRole?, scope labels | id | Persona 1 to 0..N addresses/orders; seller personas 0..N to 1 shop; platform personas carry platform role/scope |
| Customer commerce | `MockCart` | id, personaId, items[], subtotalBdt, deliveryEstimateBdt?, totalBdt | id | Cart 1 to 1 persona context; Cart 1 to 0..N cart items |
| Customer commerce | `MockCartItem` | id, cartId, listingId, variantId?, shopId, quantity, unitPriceBdt, lineTotalBdt | id | Cart item N to 1 cart; N to 1 listing/variant; N to 1 shop |
| Customer commerce | `MockWishlist` | id, personaId, item refs/listingIds | id | Wishlist 1 to 1 persona; Wishlist 1 to 0..N wishlist items |
| Customer commerce | `MockAddress` | id, personaId, label, recipientName, phone, lines: LocalizedText or strings, district/area, isDefault | id | Address N to 1 persona |
| Orders and fulfillment | `MockOrder` | id, orderNumber, customerPersonaId, placedAt, overallStatus, paymentMethod, itemSubtotalBdt, deliveryTotalBdt, grandTotalBdt, currency `BDT` | id | Order 1 to N shipments; Order 1 to 0..N payments/COD views |
| Orders and fulfillment | `MockShipment` | id, orderId, shopId, status, trackingCode?, deliveryFeeBdt, proofOfDelivery refs?, status history view | id | Shipment N to 1 order; N to 1 shop; Shipment 1 to N order items |
| Orders and fulfillment | `MockOrderItem` | id, orderId, shipmentId, listingId, variantId?, titleSnapshot: LocalizedText, quantity, unitPriceBdt, lineTotalBdt | id | Order item N to 1 shipment/order; N to 1 listing/variant reference |
| Payments and COD | `MockPayment` | id, orderId, method: COD/online, status, amountBdt, reference? | id | Payment N to 1 order |
| Payments and COD | `MockCodView` | id, shipmentId or orderId, collection/remittance/reconciliation status, amountBdt, notes? | id | COD view N to 1 shipment/order context |
| Trust and support | `MockReview` | id, productId, authorPersonaId, rating, title/body: LocalizedText, status, createdAt | id | Review N to 1 product; N to 1 persona |
| Trust and support | `MockSupportCase` | id, orderId?/shipmentId?, customerPersonaId, category, priority, status, summary: LocalizedText | id | Support case N to 0..1 order/shipment; N to 1 persona |
| Trust and support | `MockDispute` and `MockReturn` | id, orderId/shipmentId/itemId refs, status, reason, requested/refund amounts in BDT | id | Linked to order/shipment/items and shop/customer contexts |
| Seller operations | `MockInventoryView` | id, shopId, listingId/variantId, available/reserved quantities, low stock flag, movement summaries | id | Inventory view N to 1 shop; N to 1 listing/variant |
| Seller operations | `MockPayout` and `MockSettlement` | id, shopId, period/status, amountBdt, method label, references | id | Payout/settlement N to 1 shop; may reference orders/shipments in summaries |
| Seller operations | `MockCommissionSummary` | id, shopId or order context, basis, rate label, amountBdt | id | Summary linked to shop/order context |
| Platform operations | `MockModerationItem` | id, target type/id, status, reason, submittedAt | id | References seller application, shop, or listing |
| Platform operations | `MockDeliveryAssignment` | id, shipmentId, assignee label, status, scheduled/updated times | id | Assignment N to 1 shipment |
| Platform operations | `MockNotification` | id, audience persona/role, channel in app/email view, title/body: LocalizedText, status/read state | id | Notification N to 0..1 persona or role audience |
| Platform operations | `MockContentBlock` and `MockAnalyticsCard` | id, key/scope, title/body/value: LocalizedText or formatted values, period/status | id | Used by content, theme preview, and dashboard views |

**State transitions** (if applicable):

No persistent business state machine is implemented in this foundation. Scenario/state is a view concern represented by `MockScenario` (`default`, `empty`, `loading`, `error`, `success`) and helper outputs. Individual domain records may carry status labels (for example order, shipment, application, payout) as representative mock data, but transitions are not executed by this feature.

**API surface**:

| Surface | Kind | Key inputs | Key outputs | Access / use | Key errors or states |
|---|---|---|---|---|---|
| `lib/mock/types` and domain modules | TypeScript exports | none (type definitions and constants) | UI oriented types, scenario types, shared helpers | Imported by prototype pages/components and shared UI | Type misuse caught at compile time; optional fields must be handled safely in UI |
| Domain getters (for example catalog, shops, personas, cart, orders, seller ops, platform ops) | Sync functions/helpers | optional `{ scenario, locale, id, filters }` depending on domain | typed records, lists, or scenario descriptors | Server or client prototype code as appropriate, no network/DB | `empty`, `loading`, `error`, and `success` variants returned/represented per helper contract; missing id can return `null`/not found state |
| `lib/mock/index` | Barrel exports | none | stable import surface for journeys | Preferred entry point for consumers | Duplicate or unclear exports avoided by single source definitions |
| Layout primitives (page container, page header, section, grid/stack, card/list/detail shells) | React components | children, titles, actions, layout props | composed page structure | Storefront, seller, and admin prototype screens | Invalid composition falls back to safe layout; responsive classes keep mobile/desktop usable |
| State and feedback primitives (loading/skeleton, empty, error, success, form feedback) | React components | title/message/content, retry action, field error/help text, tone/state props | consistent state UI | Any prototype flow and showcase | Missing optional copy uses translated defaults; retry affordance shown only when action provided |
| Internal showcase route/section | Next.js route in app router | navigation to showcase path | rendered examples of primitives and states | Internal prototype review only (not production feature flow) | Route remains navigable under locale routing; no real data mutations |

**Value sourcing** (every value each action produces, computes, or displays names where it comes from; a required value with no named source is an undecided input, resolve it before this spec is done, do NOT leave the build to invent it):

| Action | Value produced / displayed | Source |
|---|---|---|
| Domain getters return mock records/lists | Entity IDs, slugs, status labels, relationships (shopId, productId, orderId, etc.) | Stable values defined in `lib/mock` fixtures/constants with explicit cross domain references |
| Domain getters return content | Names, titles, descriptions, labels, messages shown to users | Bilingual `LocalizedText` fields in fixtures or translated UI copy via next-intl in components (UI labels not hardcoded) |
| Domain getters return money | Prices, compare at prices, subtotals, delivery fees, totals, payout/commission amounts | Integer BDT number fields in fixtures/helpers (no floats, no recomputed historical values) |
| Domain getters return scenario views | Empty lists, loading indicators, error messages/retry context, success confirmations | `MockScenario` input plus per domain helper logic and shared state component props/default translated messages |
| Catalog/menu refactor | Menu categories, links, featured items, product cards shown in shared shell | New mock catalog/menu exports in `lib/mock` (or compatible exports consumed by `lib/catalog/menu.ts`) replacing parallel hardcoded menu data |
| Layout and state primitives render UI | Headings, helper text, button labels, form feedback text, accessibility labels | next-intl messages for UI chrome/labels and typed props/fixture content for data driven text |
| Showcase route demonstrates states | Visible examples for layout primitives and loading/empty/error/success/form feedback | Composed showcase page using foundation components and mock getters with scenario inputs |
| Persona fixtures provide identity context | Guest/customer/seller/platform persona names, kinds, shop scope, platform role labels | `MockPersona` fixtures in `lib/mock`; switcher control and session simulation behavior sourced later from feature 5 |

**Key invariants**:
- No real database reads, no Prisma queries, no real API calls, and no real auth or permission enforcement are added by this foundation.
- Mock money values are integer BDT only; no float and no `Decimal` values in fixture contracts.
- User visible mock content that represents translatable domain content uses `{ en, bn }` where shown; UI component labels and messages go through next-intl.
- Fixtures use stable IDs/slugs and explicit cross domain links so different journeys can render consistent relationships.
- Scenario handling is consistent: helpers/components support the agreed states (`default`, `empty`, `loading`, `error`, `success` where applicable) without requiring each journey to invent its own state contract.
- The foundation is representative, not exhaustive: enough records and variants to support believable screens and key states, without production scale data generation.
- Prototype showcase and mock persona data are prototype aids only and must not be presented as real security boundaries or production data.

**Security model**:
- This feature does not introduce protected backend operations or real access control enforcement. It must not weaken existing session handling or claim authorization.
- All data is static mock data in code or local placeholder assets; no secrets, credentials, personal production data, or private documents are stored.
- Internal showcase is for prototype review and should be treated as non production UI; later wiring must add real server side authorization for protected journeys.
- Mock personas and role labels are display/data fixtures only for future UI flows (feature 5), not trusted identity or permission sources.

**Configuration required**:
- No new environment variables or third party credentials are required for this feature.
- Local placeholder media continues to use files under `public/products/` (and any added local placeholders in `public/`), so no new `images.remotePatterns` configuration is required.

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path: `lib/mock` exports provide representative typed fixtures across all phase groups and scenario helpers return usable `default`/`success` data for catalog, persona, order, and seller/platform examples, verifies **AC-1**, **AC-2**.
- State coverage: the showcase (or equivalent composed demo) renders loading, empty, error with recovery affordance, success, and form feedback states using shared primitives, verifies **AC-4**, **AC-7**.
- Composition/layout: shared layout primitives compose a responsive page, section, and list/detail structure suitable for storefront, seller, and admin screens, verifies **AC-3**.
- Bilingual and design direction: foundation components use next-intl for UI labels and fixtures/primitives can present `en`/`bn` content and BDT values consistent with the CareU direction, verifies **AC-2**, **AC-5**.
- Integration/refactor: shared shell/menu and navigable routes render using the refactored foundation without Prisma/database/API calls or real auth enforcement, verifies **AC-6**.

## Build plan

Build approach: **Facade** (project default). Lead with the shared UI shell, primitives, states, and believable mock data that later journeys can compose; keep routes navigable and avoid real backend wiring.

1. **Create the mock foundation module**: add `lib/mock/` with shared types (`LocalizedText`, scenario types, helper contracts), stable ID/slug conventions, domain folders/modules, and an index/barrel export surface for all required phase groups, satisfies **AC-1**, **AC-2**.
2. **Seed representative fixtures and scenario helpers**: implement UI oriented fixtures and typed getters/helpers for catalog/brands/products/variants/listings/shops, personas/role views, customer commerce, orders/shipments/payments/COD, reviews/support/disputes/returns, seller operations, and platform operations with `default`, `empty`, `loading`, `error`, and `success` coverage where applicable, satisfies **AC-1**, **AC-2**.
3. **Add layout primitives and design tokens in code**: implement reusable page containers, headers, sections, grids/stacks, and card/list/detail shells with practical Tailwind/theme usage adapted to the CareU direction and responsive behavior, satisfies **AC-3**, **AC-5**.
4. **Add state and form feedback primitives**: implement loading/skeleton, empty, error/retry, success, and basic form feedback components with next-intl labels/defaults and safe handling of optional data, satisfies **AC-4**, **AC-5**.
5. **Refactor shared placeholders onto the foundation**: replace or adapt `lib/catalog/menu.ts` and shared storefront/menu consumers to use the new mock exports or compatible interfaces, update shared shell pieces to use new primitives where appropriate, and keep existing routes navigable without real data/auth wiring, satisfies **AC-5**, **AC-6**.
6. **Add internal showcase and local placeholder assets**: create a small internal showcase route/section demonstrating layout primitives and all key states, and add/reuse local placeholder media in `public/products/` as needed for believable examples, satisfies **AC-4**, **AC-7**.
7. **Consistency pass**: verify bilingual content handling, integer BDT usage in fixtures, no Prisma/API/auth additions, and clear prototype-only boundaries in the showcase and exports, satisfies **AC-2**, **AC-5**, **AC-6**, **AC-7**.

## Consequences

**Positive**:
- Later customer, seller, and admin journey features can build on one consistent set of types, fixtures, primitives, and states instead of reinventing them.
- The prototype becomes easier to review because loading, empty, error, and success behavior is visible and consistent.
- Refactoring shared placeholders reduces duplicate mock sources and makes the facade more believable.

**Negative / tradeoffs**:
- Seeding representative fixtures for all phase groups increases initial effort and creates a mock surface that will need maintenance as journey needs evolve.
- Refactoring shared shell/menu code carries a small regression risk for existing navigation and placeholder pages.
- UI oriented mock types may differ from final backend contracts, so later wiring will require mapping rather than direct reuse.

**Neutral**:
- The foundation introduces prototype-only modules and an internal showcase that later work can refine, replace, or hide as needed.
- No new dependencies, environment variables, or storage configuration are required if local placeholders and existing project libraries are sufficient.

## Follow-up

- [ ] Feature 5 should consume `MockPersona` fixtures for the journey/persona switcher UI and define any session simulation behavior needed for prototype views.
- [ ] If a `design.md` or stronger design token source is introduced later, align the foundation primitives and tokens to that source of truth.
- [ ] As journeys 6 onward are built, extend representative fixtures and scenario helpers only where needed and keep mock shapes consistent with this foundation.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

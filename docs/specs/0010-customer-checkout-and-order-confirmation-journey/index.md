# 0010. Customer checkout and order confirmation journey

**Date**: 2026-11-20
**Status**: In Progress

## Summary

This feature turns the checkout placeholder into a complete, clickable prototype for a signed in mock customer. One page collects address, delivery, payment, and summary choices from mock data, then a separate confirmation page shows an order number and a per shop summary. It proves the whole journey, including the required failure states, without real stock reservation, payment processing, or backend writes.

## Requirements

**User stories**:

- As a signed in mock customer, I want to review the items I selected, choose how they are delivered and paid for, and place a mock order so that I can see what CareU checkout feels like.
- As a customer who added one item from a product page, I want buy now to take me straight to checkout without changing my cart.
- As a reviewer, I want to see every required failure state so that I can judge the error handling before backend wiring.

**Acceptance criteria** (the contract, each criterion is independently checkable):

- **AC-1**: Checkout is available only to the signed in customer prototype persona through the existing `ProtectedPrototypePage` customer gate. Guests and other personas see the existing sign in required state and no checkout draft data.
- **AC-2**: Checkout is one page with the sections in this fixed order: address, delivery, payment, summary. It uses existing CareU layout primitives, tokens, local placeholder assets, bilingual `next-intl` strings, and integer BDT formatting, and keeps the existing noindex robots rule.
- **AC-3**: Entry from the cart builds a draft from only the selected available lines in the shared store. An empty selection, or a selection where every item is unavailable, blocks entry with a clear state and offers a link back to the cart.
- **AC-4**: Buy now on a product builds a single item draft from the chosen product and variant. It does not add to, remove from, or otherwise change the shared cart.
- **AC-5**: Every draft item carries a full display and money snapshot plus stable string ids back to its cart line, address, shop, and catalog mock sources. Checkout displays and totals from that snapshot, not from a live cart read.
- **AC-6**: The address section offers saved mock addresses. When the active scenario has no saved address, an inline address form appears using `react-hook-form` and `zod` validation, with no persistence of the entered values.
- **AC-7**: The delivery section lists mock delivery options, each showing its charge resolved from a mock delivery rule table keyed by option and destination district, in integer poisha formatted as BDT.
- **AC-8**: The payment section offers cash on delivery and online payment. Online payment is a clearly labeled mock gateway panel with no card fields and no real payment data entry.
- **AC-9**: The prototype switcher can demonstrate empty selection, no saved address, unavailable item, payment failure, and order placement failure scenarios, each with a distinct, clear error or empty state and a path to recover or return to the cart.
- **AC-10**: A payment failure leaves no order placed and lets the customer retry payment on the same checkout page.
- **AC-11**: The place order action is disabled while a mock placement is in progress and whenever a late availability check finds an item unavailable.
- **AC-12**: Totals are recomputed from the checkout snapshot with `lib/money` at placement time. No client supplied total is trusted, and no real stock reservation, payment processing, or backend write occurs.
- **AC-13**: A successful placement navigates to a separate confirmation route showing a deterministic order number and a per shop summary. It does not show tracking. A refresh keeps the last confirmation using session storage.
- **AC-14**: Leaving checkout discards the draft and leaves the shared cart untouched.
- **AC-15**: There are no new HTTP API routes, Prisma models, or migrations. All checkout data comes from a dedicated `lib/mock/checkout` module and the existing shared cart store.

## Decision

**Chosen option**: Option 1: One page checkout with a dedicated mock module and local draft state.

Build checkout as a single page of sections backed by a dedicated `lib/mock/checkout` module. Keep the draft in component state and the last confirmation in session storage. Entry comes from selected cart lines or a product buy now action, and all failures are injected through the existing prototype scenario state.

**Implementation skills**: `react-hook-form` (`pproenca/dot-skills`, `.agents/skills/react-hook-form/`) · `zod` (`pproenca/dot-skills`, `.agents/skills/zod/`)

## Feature design

**Data model sketch**:

This is browser side prototype state, not a database schema. Display text uses `LocalizedText` (`{ en, bn }`) where shown, money is integer poisha, and images are local placeholder paths.

- `CheckoutDraft`: `draftId`, `source` (`cart` | `buy_now`), `sourceLineIds` (stable ids to cart lines, empty for buy now), `items`, `addressSelection`, `deliveryOptionId`, `paymentMethodId`, `scenario`.
- `CheckoutItemSnapshot`: `lineId?` (nullable for buy now), `productId`, `variantId?`, `shopId`, `title`, `variantTitle?`, `image`, `sku?`, `unitPricePoisha`, `quantity`, `lineTotalPoisha`, `availability`, `shopName`, `shopType` (`careu` | `marketplace`).
- `CheckoutAddressView`: `id`, `label`, `recipientName`, `phone`, `addressLine`, `district`, `isDefault?`.
- `InlineAddressDraft`: `recipientName`, `phone`, `addressLine`, `district`, held in form state and validated by a `zod` schema.
- `DeliveryOptionView`: `id`, `label`, `description`, `chargePoisha`, resolved from a mock rule table keyed by option and destination district.
- `PaymentMethodView`: `id` (`cod` | `online_mock`), `label`, `description`, `showsMockGateway` boolean.
- `CheckoutTotals`: `subtotalPoisha`, `deliveryPoisha`, `totalPoisha`, `itemCount`, `perShopSummary` (one entry per shop with its items and shop subtotal).
- `OrderConfirmation`: `orderNumber`, `placedAtLabel`, `items`, `addressSnapshot`, `deliverySnapshot`, `paymentSnapshot`, `totals`, `perShopSummary`.
- `CheckoutFailure`: `stage` (`selection` | `address` | `availability` | `payment` | `placement`), `code`, `messageKey` (a `next-intl` key), `retryable` boolean.
- `CheckoutScenario`: `default`, `empty_selection`, `no_address`, `unavailable_item`, `payment_failure`, `placement_failure`, resolved from prototype state.

Relationships: one draft holds one or more item snapshots. Each snapshot references one mock product, zero or one mock variant, and one mock shop. A draft uses one saved address or one inline address, one delivery option, and one payment method. One successful placement produces one confirmation. No Prisma model or migration is added.

**State transitions**:

- Draft lifecycle: created from cart or buy now → address chosen → delivery chosen → payment chosen → reviewed → placing → confirmed or failed.
- Payment failure returns to the payment section with retry and no order placed. Placement failure returns to the review state with retry. A late unavailable item blocks placement and keeps the draft editable.
- Leaving checkout discards the draft. A successful confirmation is written to session storage and read again on refresh.

**API surface**:

There are no HTTP endpoints. The contract is the set of pure mock getters, validators, and placement helpers that the client surfaces call.

| Function | Kind | Key inputs | Key outputs | Gate | Key errors |
|---|---|---|---|---|---|
| `createCheckoutDraft` | pure function | `source`, selected lines or product and variant | `CheckoutDraft` | customer gate at page level | empty or unavailable selection returns a `CheckoutFailure` |
| `getCheckoutScenario` | pure function | prototype switcher state | `CheckoutScenario` | none | unknown value falls back to `default` |
| `getSavedAddresses` | pure function | `scenario` | `CheckoutAddressView[]` | customer gate at page level | no address scenario returns an empty array |
| `validateAddressDraft` | `zod` schema | inline address form values | validated address or field errors | none | missing fields, invalid phone |
| `getDeliveryOptions` | pure function | `destinationDistrict` | `DeliveryOptionView[]` | none | unknown district uses a mock rule fallback |
| `getPaymentMethods` | pure function | none | `PaymentMethodView[]` | none | not applicable |
| `recomputeTotals` | pure function | `CheckoutDraft` | `CheckoutTotals` | none | malformed snapshot yields a typed error |
| `placeMockOrder` | async mock function | `CheckoutDraft`, `scenario` | `OrderConfirmation` or `CheckoutFailure` | customer gate at page level | payment failure, placement failure, late unavailable item |
| `saveLastConfirmation` / `readLastConfirmation` | session storage helpers | `OrderConfirmation` | stored or read confirmation | customer gate at confirmation page | missing or invalid stored value falls back to a not found state |

**Value sourcing** (every value each action produces, computes, or displays traces to a named source):

| Action | Value produced or displayed | Source |
|---|---|---|
| Create draft from cart | item snapshots | selected available lines in the shared store resolved against mock catalog and shop mocks |
| Create draft from buy now | item snapshot | product page chosen product and variant resolved against mock catalog, with no `sourceLineIds` |
| Create draft | `draftId` | generated locally when the draft is created |
| Address section | saved address list and labels | `lib/mock/checkout` fixtures filtered by `CheckoutScenario` |
| Inline address form | field values and field errors | `react-hook-form` form state validated by the `zod` schema, never persisted |
| Delivery section | option labels and charges | mock delivery option fixtures and the mock delivery rule table keyed by option and destination district |
| Payment section | method labels and mock gateway flag | mock payment method fixtures; no card fields are rendered |
| Summary | item lines and subtotal | draft snapshots computed with `lib/money` |
| Summary | delivery charge | selected delivery option from the mock rule table |
| Summary and confirmation | total | recomputed from snapshot subtotal plus delivery charge with `lib/money` at placement time |
| Per shop summary | shop grouping and shop subtotal | shop ids and names on snapshots, grouped deterministically |
| Failure states | injected failure and retry path | prototype switcher scenario state, with unknown values falling back to `default` |
| Confirmation | order number | deterministic generator derived from the placed draft identity |
| Confirmation | placed at label | generated at placement and formatted with the active locale |
| Confirmation refresh | last confirmation | session storage copy written on successful placement |
| Failure messages | localized message and retry action | `CheckoutFailure.messageKey` resolved through `next-intl` |
| Page access | customer persona | existing prototype persona state and `ProtectedPrototypePage` gate |
| All pages | locale labels and formatted money | active `next-intl` locale and `lib/money` helpers |
| Navigation | cart, product, and confirmation hrefs | `next-intl` routing with locale prefix over existing routes |

**Key invariants**:

- Checkout requires the signed in customer prototype persona. The gate is UI only and is not a real authorization boundary.
- A draft is a snapshot. Cart changes after draft creation do not silently alter what checkout displays or totals.
- Buy now never mutates the cart, and leaving checkout never mutates the cart.
- An unavailable item cannot be selected at cart entry and cannot be placed even if it becomes unavailable late.
- Totals are recomputed from the snapshot with `lib/money`. No client supplied total is accepted.
- No real reservation, payment, IPN, backend write, HTTP route, Prisma model, or migration is introduced.
- The confirmation shows an order number and per shop summary only. Tracking is out of scope for this feature.
- All user facing strings use `next-intl` for `en` and `bn`, and all money is integer poisha formatted as BDT.
- The checkout and confirmation routes keep their noindex robots rule.

**Security model**:

This is a prototype with no real authentication, authorization, or financial effect. The customer persona gate only shapes the review experience and must not be treated as a security control. No card fields, real payment data, secrets, or tokens are collected or stored. The only persisted value is the last mock confirmation in session storage, holding mock address and item snapshots. Checkout and confirmation stay unindexed, and that discovery hint is not a substitute for access control when real orders arrive in feature 11.

**Configuration required**:

None. The feature uses existing mock modules, prototype state, local placeholder assets, and no new environment variables.

**Critical test scenarios** (each maps to an acceptance criterion):

- Happy path from cart: sign in as the customer persona, select available items across more than one shop, choose a saved address, delivery option, and payment method, review the summary, place the order, and confirm the order number and per shop summary. Verifies **AC-1**, **AC-2**, **AC-3**, **AC-5**, **AC-6**, **AC-7**, **AC-8**, **AC-13**.
- Happy path from buy now: choose a variant on a product, use buy now, confirm one item in the draft, place a mock order, and return to the cart to confirm it is unchanged. Verifies **AC-4**, **AC-5**, **AC-14**.
- Empty and unavailable selection: enter checkout with no selection and with only unavailable selected items, confirm both are blocked with a clear state and a cart link. Verifies **AC-3**, **AC-9**.
- No saved address scenario: switch to the no address scenario, confirm the inline form appears, submit invalid values to see `zod` field errors, then submit valid values. Verifies **AC-6**, **AC-9**.
- Payment and placement failures: switch to payment failure, confirm no order is placed and retry works on the same page; switch to placement failure and confirm the retry state; make an item unavailable late and confirm placement is disabled. Verifies **AC-9**, **AC-10**, **AC-11**.
- Boundary pass: confirm totals recompute from the snapshot, no stock or payment side effect occurs, no HTTP route or schema change exists, refresh keeps the last confirmation, and en and bn render with integer BDT money. Verifies **AC-2**, **AC-12**, **AC-13**, **AC-15**.

## Build plan

Build approach: **Facade**. Lead with the visible checkout shell on mock data, then make the draft, totals, failures, and confirmation real behind it. No migration is needed because all state is in the browser.

1. [x] Add `react-hook-form`, `zod`, and `@hookform/resolvers` to `package.json`, and add the checkout and confirmation `next-intl` message namespaces for `en` and `bn`. Satisfies **AC-2**, **AC-15**.
2. [x] Create `lib/mock/checkout` with typed contracts, fixtures, scenario helpers, the delivery rule table, the deterministic order number generator, the placement helper, and session storage helpers. Add no HTTP routes, Prisma models, or migrations. Satisfies **AC-5**, **AC-7**, **AC-12**, **AC-13**, **AC-15**.
3. [x] Build the checkout page shell with `PageHeader`, `CardShell`, the existing customer gate, and the four sections in the fixed order address, delivery, payment, summary. Preserve loading and noindex behavior. Satisfies **AC-1**, **AC-2**.
4. [x] Wire cart selection and product buy now into `createCheckoutDraft`, including the blocking empty and unavailable states, the cart return link, and draft discard on leave. Satisfies **AC-3**, **AC-4**, **AC-14**.
5. [x] Implement the address section with the saved address picker and the inline address form using `react-hook-form`, `zod`, and localized field errors, with no persistence. Satisfies **AC-6**.
6. [x] Implement the delivery and payment sections, including the mock rule based charges, the cash on delivery option, the labeled mock online gateway panel, and the no address and payment failure scenario states. Satisfies **AC-7**, **AC-8**, **AC-9**, **AC-10**.
7. [x] Implement summary totals with `lib/money`, the late availability block, the disabled state during placement, placement failures with retry, and the no side effect guarantee. Satisfies **AC-11**, **AC-12**.
8. [x] Build the separate confirmation route with the deterministic order number, per shop summary, session storage refresh, no tracking content, and noindex metadata. Satisfies **AC-13**, **AC-2**.
9. [x] Add prototype switcher coverage for all five required failures plus a consistency pass over bilingual strings, integer BDT, local placeholder assets, responsive layout, and empty, loading, and error states. Satisfies **AC-9**, **AC-2**, **AC-15**.

## Consequences

**Positive**:

- Reviewers get a believable end to end customer journey from cart or product through checkout to confirmation before any backend work starts.
- A dedicated mock module keeps prototype values in one place and gives later backend wiring a clear contract to replace.
- Required failures are reviewable on demand, including payment and placement failures that are hard to reach in a static mock.
- Snapshot based totals and recomputation at placement preserve the money rules the real checkout will need.

**Negative / tradeoffs**:

- Adds three client dependencies for form handling and validation, and more client state than a static placeholder page.
- Browser only draft and session storage confirmation are approximations that will need real server side order state in feature 11.
- Mock delivery charges and order numbers are prototype values. Real delivery pricing and payout policy remain pending and must not be inferred from them.
- The customer gate is UI only, so it must not be reused as a real access boundary.

**Neutral**:

- No database schema, environment variables, or production integrations change in this feature.
- Feature 11 will own real addresses, order history, tracking, and sign in required order reads.

## Follow-up

- [ ] Install `react-hook-form`, `zod`, and `@hookform/resolvers` as local npm dependencies before implementation starts. Only the Agent Skills are installed today.
- [ ] Add notes for the `react-hook-form` and `zod` skills to root `AGENTS.md` `## Library policy` or the relevant storefront area context, so build agents pick up their conventions. The installed `react-hook-form` skill directory currently has no readable guidance files, so refresh or remove it if it stays empty.
- [ ] MCP servers were skipped during design. Do not reoffer them for this work.
- [ ] When building feature 11, replace session storage confirmation with real server side order detail and enforce ownership or permission on every read, including tracking.
- [ ] When delivery pricing, payout cadence, and return policy values are confirmed, replace the mock rule values with the approved policy and keep them snapshotted per order.
- [ ] Align the product buy now action with the real purchase flow when backend wiring resumes, so it never becomes a second cart implementation.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

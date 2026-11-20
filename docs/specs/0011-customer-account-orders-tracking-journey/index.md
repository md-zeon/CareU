# 0011. Customer account, addresses, orders, and tracking journey

**Date**: 2026-11-20
**Status**: Accepted

## Summary

This feature turns the account, address, order history, order detail, and tracking placeholders into a complete clickable prototype for a signed in mock customer. It uses a dedicated mock module and a persisted browser store, so profile and address edits survive navigation while orders and shipments stay stable fixtures. Tracking requires the customer persona in the prototype, and every order read is filtered by mock customer id so the UI rehearses the ownership rule that real backend wiring will enforce later.

## Requirements

**User stories**:

- As a signed in mock customer, I want to manage my profile and saved addresses so that I can review the account screens before backend wiring.
- As a signed in mock customer, I want to browse my order history and open an order so that I can see snapshots, per shop groups, and shipment status in context.
- As a signed in mock customer, I want to track a shipment from order detail and from a dedicated page so that I can judge the tracking experience.
- As a reviewer, I want every required empty, error, and exception state on demand so that I can judge the prototype without waiting for real data.
- As a guest, I want to see the sign in required state so that the prototype follows the confirmed rule that tracking needs an account.

**Acceptance criteria** (the contract, each criterion is independently checkable):

- **AC-1**: Profile, addresses, orders, order detail, and `/order/track` are available only through the existing `ProtectedPrototypePage` customer gate. Guests and other personas see the sign in required state and no mock account data.
- **AC-2**: The account area is a nested route group with a shared shell containing a customer summary card and side navigation. It uses the layout primitives and tokens from spec 0004, next-intl strings for en and bn, local placeholder assets, and a noindex rule on every account and order route, with no sitemap entries.
- **AC-3**: Profile shows customer details with an inline edit form using `react-hook-form` and `zod`. A valid save shows a success state, an invalid save shows field errors, and saved values persist in the account store across navigation and refresh.
- **AC-4**: Addresses show a list with a default badge and support add, edit, delete with confirm, and set default. At most one address is default. Phone uses the confirmed Bangladesh pattern `/^(\+880|0)1[3-9]\d{8}$/`, and saved changes persist in the account store.
- **AC-5**: Order history shows identity and shipment fixtures from spec 0004 plus the newest checkout confirmation when present. Status tabs derive from shipment states using the furthest active state rule with cancellation winning when every shipment is cancelled. Each tab shows a count and at most ten orders.
- **AC-6**: Order detail shows the address, delivery, and payment snapshots, item snapshots grouped per shop, integer poisha totals formatted as BDT with `lib/money`, and a shipment card with a track action for each shipment.
- **AC-7**: Tracking is reached from a shipment card and from `/order/track`, requires the customer persona, and shows progress steps plus an ordered status timeline derived from the same shipment record and status events used by order detail.
- **AC-8**: The shipment states pending, packed, shipped, out for delivery, delivered, cancelled, and delivery exception are reviewable. A delivery exception appears as a prominent alert with a clearly labeled support link placeholder.
- **AC-9**: The prototype switcher exposes empty orders, no addresses, invalid form, order not found, tracking not found, loading, error, and shipment exception scenarios. An unknown scenario value falls back to the default scenario.
- **AC-10**: Every account and order getter filters by the current mock customer id. An order, shipment, or address owned by another mock customer returns a typed not found result, never the other customer's data.
- **AC-11**: There are no HTTP routes, Prisma models, migrations, environment variables, or real backend writes. All data comes from `lib/mock/account`, the shared fixtures, the existing checkout confirmation, and the persisted account store.
- **AC-12**: The account store uses a versioned storage key, skips hydration during server rendering, rehydrates after mount behind a skeleton, normalizes stored values with a safe fallback, uses selectors for reads, and resets to that persona's mock defaults when the prototype persona changes.
- **AC-13**: An invalid order or tracking id shows a not found state with a return link, distinct from a gate failure. A failed address save shows an inline typed error and keeps the entered values for retry.
- **AC-14**: Dates and times use `Intl.DateTimeFormat` with the active next-intl locale, all user facing strings are localized for en and bn, and all money stays integer poisha formatted as BDT.

## Decision

**Chosen option**: Option 1: Nested account shell with a dedicated mock module and a persisted account store.

Build the account area as nested routes under a shared shell, read mock data through a new `lib/mock/account` module, and keep profile and address edits in a new versioned Zustand store that follows the existing cart store pattern. Orders and shipments stay in fixtures so history and tracking remain consistent with checkout confirmation.

**Implementation skills**: `zustand-persist-state` (`pproenca/dot-skills`, `.agents/skills/zustand-persist-state/`) · `nextjs-zustand` (`pproenca/dot-skills`, `.agents/skills/nextjs-zustand/`) · `zod` (`pproenca/dot-skills`, `.agents/skills/zod/`) · `react-hook-form` (`pproenca/dot-skills`, `.agents/skills/react-hook-form/`)

## Feature design

**Data model sketch**:

This is browser side prototype state, not a database schema. User visible text uses `LocalizedText` (`{ en, bn }`) where shown. Money is integer poisha. All ids are stable strings.

| Entity | Primary key | Required fields | Optional fields | Relationship and constraint |
|---|---|---|---|---|
| CustomerProfileView | customerId | name, phone, memberSinceLabel | email, avatarPath | One profile per mock customer |
| SavedAddressView | id | label, recipientName, phone, addressLine, district, isDefault | landmark | Many per customer, at most one default |
| OrderSummaryView | orderNumber | placedAt, statusGroup, totalPoisha, itemCount, shopCount, shipmentCount | none | One row per order in history, owned by one customer |
| OrderDetailView | orderNumber | addressSnapshot, deliverySnapshot, paymentSnapshot, totals, itemSnapshots, perShopGroups | none | Extends one summary |
| ShipmentView | shipmentId | orderNumber, shopId, shopName, shopType, status | trackingNumber | Many per order |
| ShipmentStatusEvent | eventId | shipmentId, status, atLabel, noteKey | actorLabel | Ordered history under one shipment |
| TrackingView | shipmentId | orderNumber, status, progressSteps, lastUpdateLabel | deliveryException | Derived from one shipment |
| AccountScenario | id | profileVariant, addressVariant, orderVariant, shipmentVariant | none | Switcher selector only, no persisted data |

`shopType` is `careu` or `marketplace`. `statusGroup` is derived, never stored. Snapshots copied from checkout confirmation are read only in this feature.

**State transitions**:

- Profile: viewing → editing → saving → saved with feedback or failed with field errors → viewing.
- Address: list → add or edit form → validating → saving → saved or failed with values retained. Delete → confirm → removed from the session list. Set default swaps the flag so only one remains.
- Shipment: pending → packed → shipped → out for delivery → delivered. Terminal exception branches are cancelled and delivery exception. The timeline preserves every entered state.
- Order status group derives from shipments. The furthest active state wins. When every shipment is cancelled the group is cancelled. A delivery exception on the only active shipment shows as delivery exception.
- Persona switch resets the account store to the new persona's mock defaults, then rehydrates behind the skeleton.

**API surface**:

There are no HTTP endpoints. The contract is typed mock getters, validators, and store actions.

| Function | Kind | Key inputs | Key outputs | Gate | Key errors |
|---|---|---|---|---|---|
| getProfile | pure getter | customerId | CustomerProfileView | customer persona | not found |
| listAddresses | pure getter | customerId, scenario | SavedAddressView[], cap six | customer persona | storage or empty result |
| saveAddress | store action | customerId, address draft, addressId? | saved address or typed failure | customer persona | invalid fields, invalid phone, storage error |
| deleteAddress | store action | customerId, addressId | removed flag or typed failure | customer persona | not found, storage error |
| setDefaultAddress | store action | customerId, addressId | updated list or typed failure | customer persona | not found |
| listOrders | pure getter | customerId, scenario | OrderSummaryView[] grouped by status, cap ten per tab | customer persona | empty result |
| getOrderDetail | pure getter | customerId, orderNumber | OrderDetailView | customer persona and ownership | not found |
| getShipment | pure getter | customerId, shipmentId | ShipmentView with status events | customer persona and ownership | not found |
| getTracking | pure getter | customerId, shipmentId | TrackingView | customer persona and ownership | not found |
| getAccountScenario | pure getter | prototype switcher state | AccountScenario | none | unknown falls back to default |
| resetAccountForPersona | store action | customerId | store reset to that persona defaults | customer persona switch | none |

Failures use a discriminated `AccountResult<T>` with `ok`, and on failure a `code` of `not_found`, `invalid`, `forbidden`, `storage_error`, or `unknown`, a `messageKey` for next-intl, and a `retryable` flag.

**Value sourcing** (every displayed or computed value traces to a named source):

| Action | Value produced or displayed | Source |
|---|---|---|
| Account shell | customer summary | getProfile for current mock customer id |
| Account shell | customer id and persona | existing prototype persona state from spec 0005 |
| Profile edit | field values and field errors | react-hook-form form state validated by the shared zod schema |
| Profile save | success or failure state | AccountResult from the account store action |
| Address list | addresses and default badge | listAddresses merge of fixture and account store overrides |
| Address form | phone validation | confirmed Bangladesh pattern in root AGENTS.md |
| Address save | stored values | account store action with normalized merge |
| Address delete | confirmation prompt text | next-intl account namespace |
| Order history | older orders | shared order fixtures from spec 0004 |
| Order history | newest order | last mock confirmation from spec 0010 when present |
| Order history | order number | deterministic generator from spec 0010 for confirmations, fixture id otherwise |
| Order history | status tabs and counts | derived from shipment states under the furthest active rule |
| Order detail | address, delivery, payment, item snapshots | checkout confirmation snapshot or shared fixture snapshot |
| Order detail | totals | recomputed from snapshots with lib/money, integer poisha |
| Order detail | shop groups and shop type | shopId and shopType on item snapshots |
| Shipment card | status label | ShipmentView.status from the fixture |
| Shipment card | track link | shipmentId on the shipment plus next-intl routing |
| Tracking | progress steps and timeline | ShipmentStatusEvent list ordered by explicit fixture order |
| Tracking | last update label | latest status event atLabel formatted with Intl and active locale |
| Tracking | delivery exception alert | ShipmentView.status of delivery exception |
| Tracking | support link | clearly labeled placeholder for the later support journey |
| All pages | locale strings and money format | active next-intl locale and lib/money helpers |
| All pages | gate decision | prototype persona state, UI only |
| All pages | review scenario | prototype switcher state with default fallback |
| All pages | noindex metadata | static route metadata on each account and order route |

**Key invariants**:

- The customer gate is UI only. It rehearses policy and is never a real authorization boundary.
- Every read filters by mock customer id. No helper returns another customer's record.
- Address edits and profile edits persist in the account store. Orders, shipments, and status events never enter the store.
- At most one saved address is default. Setting a default clears the previous one.
- Order status is derived from shipments and is never stored as a separate value.
- Snapshots copied from checkout stay unchanged. Money is integer poisha and totals use lib/money.
- No HTTP route, Prisma model, migration, environment variable, or real backend write is added.
- Unknown scenario values fall back to default. Missing or invalid stored values fall back to mock defaults after normalization.
- Account and order routes stay unindexed, and this is a crawler hint rather than access control.

**Security model**:

Prototype only. The signed in customer persona gates every account and tracking screen. Mock ownership filtering prevents one persona from reading another persona's orders and addresses in the UI. No real session, token, payment data, or personal data from a backend is handled. The persisted store holds mock profile and address values in browser storage, so it must be reset on persona switch to avoid leaking one mock identity into another. All private routes carry noindex and are excluded from the sitemap. Real server side ownership checks and sign in required tracking are explicitly deferred to feature 26.

**Configuration required**:

None. No new environment variable, credential, or service is needed.

**Critical test scenarios** (each maps to an acceptance criterion):

- Happy path: switch to the customer persona, edit profile, add an address and set it as default, open order history, drill into an order, then track a shipment from its card, verifies **AC-1**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**.
- Refresh and persona boundary: reload to confirm profile and address edits survive, then switch persona and confirm the account store resets to that persona defaults, verifies **AC-3**, **AC-4**, **AC-12**.
- Empty and error states: use the switcher for empty orders, no addresses, invalid form, order not found, tracking not found, loading, error, and shipment exception. Confirm an unknown scenario falls back to default, verifies **AC-8**, **AC-9**, **AC-13**.
- Ownership: attempt to open another mock customer's order number and shipment id and confirm a typed not found result, verifies **AC-10**.
- Boundary pass: confirm no HTTP route, schema change, migration, environment variable, or real write exists, and confirm bilingual text, Intl dates, and integer BDT money, verifies **AC-2**, **AC-11**, **AC-14**.

## Build plan

Build approach: **Facade**. Lead with the visible shells and screens on mock data, then wire the persisted store and forms behind them, then add the full state set and the boundary pass. No migration is needed because all state stays in the browser.

1. [x] Add the account, address, order, detail, and tracking message namespaces for en and bn, and add noindex metadata to every account and order route. Satisfies **AC-2**, **AC-14**.
2. [x] Create `lib/mock/account` with the typed contracts, fixtures, scenario helpers, status derivation, not found results, and the getters listed in the API surface. Reuse checkout order numbers and status events from the shared fixtures. Satisfies **AC-5**, **AC-6**, **AC-7**, **AC-10**, **AC-11**.
3. [x] Create `lib/store/account` as a versioned vanilla Zustand store with skipHydration, manual rehydrate after mount, normalized merge with safe fallback, selectors, and reset on persona change. Satisfies **AC-3**, **AC-4**, **AC-12**.
4. [x] Build the nested account shell with side navigation and customer summary card, then compose the profile and address pages with their cards and inline forms. Satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**.
5. [x] Wire profile save, address save, delete with confirm, and set default to the store actions, including zod validation with the confirmed phone pattern, inline errors, retained values, and success feedback. Satisfies **AC-3**, **AC-4**, **AC-13**, **AC-14**.
6. [x] Build order history with status tabs, counts, and the ten order cap, then order detail with snapshot summary, per shop groups, totals, and shipment cards. Satisfies **AC-5**, **AC-6**, **AC-14**.
7. [x] Build the tracking view from shipment status events, reachable from shipment cards and `/order/track`, with progress steps, timeline, and the delivery exception alert and support link placeholder. Satisfies **AC-7**, **AC-8**.
8. [x] Extend the prototype switcher with the account scenarios and confirm the default fallback for unknown values, including loading, empty, invalid, not found, error, and exception states. Satisfies **AC-8**, **AC-9**, **AC-13**.
9. [x] Run the boundary pass over ownership filtering, bilingual strings, Intl dates, integer BDT money, local assets, responsive layout, and the no backend guarantee. Satisfies **AC-2**, **AC-10**, **AC-11**, **AC-14**.

## Consequences

**Positive**:

- Reviewers get a believable end to end account journey that connects to the checkout confirmation they just saw.
- A dedicated mock module gives later backend wiring a clear contract to replace without touching checkout.
- The persisted store makes edits feel real across navigation while the reset rule keeps mock personas separate.
- Ownership filtering and derived status are rehearsed now, so the real wiring in feature 26 has an agreed behaviour to implement.

**Negative / tradeoffs**:

- A second persisted store adds browser storage surface and rehydration code that must stay in step with the cart store pattern.
- Mock profiles and addresses live only in the browser and will be replaced by real server side records later.
- Status derivation rules for mixed shipments are prototype rules until real fulfilment policy is confirmed.
- The support link is a placeholder and will not lead to a working help flow until the next journey lands.

**Neutral**:

- No database, environment, or deployment change is part of this feature.
- Real sign in required tracking and real order access control remain owned by feature 26.

## Follow-up

- [ ] Update root `AGENTS.md` so the installed stack list shows zustand, react-hook-form, and zod as installed. It still marks them as not installed.
- [ ] Add pointers for the `zustand-persist-state` and `nextjs-zustand` skills to the relevant context file, and refresh the `react-hook-form` skill directory which has no readable guidance.
- [ ] Replace the support link placeholder when the customer support and trust pages journey is built.
- [ ] Enforce real server side ownership and sign in required tracking in the customer commerce wiring feature, including every order and document read.
- [ ] MCP servers were skipped during design. Do not reoffer them for this work.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

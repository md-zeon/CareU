# Verify: Customer account, addresses, orders, and tracking journey · spec 0011 · updated 2026-11-20
_Steps derived from spec 0011 acceptance criteria and value sourcing table. Static checks were run after the final edit; browser checks below are the manual handoff for the clickable prototype._

## UI / manual

- [x] Switch to the `customer` prototype persona and open `/en/account`. Confirm the shared shell renders the customer summary card from `getProfile` and side navigation for profile, addresses, and orders. Repeat with no persona and with a non-customer persona; confirm the existing sign in required state appears and no mock account data is exposed. → **AC-1, AC-2**
- [x] On `/en/account`, enter edit mode, submit an invalid phone such as `12345`, and confirm an inline field error. Enter a valid name, BD phone, and optional email, save, and confirm the success state. Navigate away and back, then refresh; confirm the saved values persist. → **AC-3, AC-14**
- [x] On `/en/account/addresses`, confirm the list shows the default badge on exactly one fixture address. Add a new address with an invalid phone and confirm field errors; correct it and save, then set it as default and confirm the previous default is cleared. Edit and save another address; delete an address and confirm the inline confirmation prompt before removal. Refresh and confirm all address edits survive. → **AC-4, AC-14**
- [x] Open `/en/account/orders`. Confirm the fixture orders appear, the newest checkout confirmation from session storage appears when present, each status tab shows a derived count, and no tab shows more than ten orders. Confirm the status group follows the furthest active shipment state and becomes cancelled only when every shipment is cancelled. → **AC-5**
- [x] Open `CU-1001` and confirm the detail shows address, delivery, and payment snapshots, item snapshots grouped per shop with shop type, integer poisha totals formatted as BDT, and one shipment card per shipment with a track action. Compare `CU-1002` and a freshly confirmed order for the same snapshot structure. → **AC-6, AC-14**
- [x] Use a shipment card track action and confirm `/en/order/track?shipment=<id>` shows progress steps plus an ordered timeline derived from that shipment's status events, matching the status shown on the order detail card. → **AC-7**
- [x] Use the prototype switcher shipment shortcuts for `demo-pending`, `demo-packed`, `demo-shipped`, `demo-out-for-delivery`, `demo-delivered`, `demo-cancelled`, and `demo-delivery-exception`. Confirm the progress steps advance in order and the exception state shows a prominent alert with a clearly labeled support link placeholder. → **AC-8**
- [x] Use the switcher shortcuts for `empty_orders`, `no_addresses`, `invalid_form`, `order_not_found`, `tracking_not_found`, `loading`, `error`, and `shipment_exception`. Confirm each opens its matching `?scenario=` URL with a suggested `customer` persona and renders the distinct state. Open a scenario with an unknown value and confirm it falls back to the default scenario. → **AC-9, AC-13**
- [x] Open `/en/account/orders/CU-2000` and `/en/order/track?shipment=ship-other`. Confirm both show a typed not found state with a return link, not another customer's data and not a gate failure. → **AC-10, AC-13**
- [x] Refresh after editing the profile and an address, then switch to a different prototype persona and back. Confirm each persona sees only its own mock defaults after the reset and rehydrate behind the skeleton. → **AC-12**
- [x] Repeat profile validation, address persistence, order history, order detail, and tracking under `/bn`. Confirm Bangla strings render, dates use `Intl.DateTimeFormat` with the active locale, and money stays integer poisha displayed as BDT. → **AC-14**
- [x] Inspect page metadata for `/en/account`, `/bn/account/addresses`, `/en/account/orders`, `/bn/account/orders/CU-1001`, and `/en/order/track`. Confirm all emit `noindex, nofollow` and no sitemap entry exists for them. → **AC-2, AC-11**
- [x] Check the browser console during the journey. Record any errors; the prototype should not add warnings beyond existing shared components. → evidence note, not an AC

## Commands

- [x] `npm run typecheck` → exits 0 → **AC-3, AC-12**
- [x] `npm run lint` → exits 0 → **AC-2**
- [x] `npm run test` → 75 tests, 66 pass, 0 fail, 9 skipped; `T3`–`T7` remain declared stubs → boundary evidence only
- [x] `npm run build` → exits 0; account, address, order history, and track routes generate as partial prerendered routes → **AC-1, AC-2**
- [x] `git diff --check` → exits 0; only LF to CRLF notices remain → boundary evidence only
- [x] `git diff --name-only -- prisma app/api .env* next.config.ts package.json` → empty → **AC-11**

## Acceptance-criteria coverage

- **AC-1**: customer gate on profile, addresses, orders, order detail, and tracking; guest and non-customer sign in required state; no mock leakage.
- **AC-2**: nested shell with customer summary and side navigation, layout primitives, local assets, bilingual strings, noindex on every private route, no sitemap entries.
- **AC-3**: inline profile form with react-hook-form and zod, success and field error feedback, persisted save.
- **AC-4**: address list, default badge, add, edit, delete with confirm, set default with single-default invariant, BD phone pattern, persisted save.
- **AC-5**: fixture plus newest confirmation orders, derived status groups and counts, ten order cap.
- **AC-6**: snapshots, per shop groups with shop type, integer BDT totals, shipment cards with track action.
- **AC-7**: tracking from shipment card and dedicated route, gated by customer persona, progress steps and timeline from the same shipment record.
- **AC-8**: all seven shipment states, prominent delivery exception alert, labeled support link placeholder.
- **AC-9**: eight switcher scenarios plus unknown value fallback.
- **AC-10**: ownership filtering on every order, shipment, and address getter; other customer records return typed not found.
- **AC-11**: no HTTP routes, Prisma models, migrations, env vars, or backend writes; data comes from `lib/mock/account`, shared fixtures, checkout confirmation, and the browser account store.
- **AC-12**: versioned key, skipHydration, manual rehydrate, normalized merge with fallback, selectors, persona reset behind skeleton.
- **AC-13**: not found states with return links distinct from gate failure; failed address save retains entered values with inline typed error.
- **AC-14**: localized en and bn strings, Intl dates with active locale, integer poisha money formatted as BDT.

## Value-sourcing coverage

- Customer summary, persona, and id → `getProfile` and prototype session state.
- Profile field values and errors → react-hook-form form state validated by the shared zod schema; save result from the account store action.
- Address list and default badge → `listAddresses` merge of fixture and store overrides; phone validation from the confirmed BD pattern; delete prompt from the next-intl account namespace; saves through the normalized account store action.
- Order history rows → shared order fixtures plus the last checkout confirmation; order number from the deterministic generator or fixture id; status tabs and counts derived from shipment states.
- Order detail → checkout or fixture snapshots for address, delivery, payment, and items; totals recomputed with `lib/money`; shop groups and type from item snapshots.
- Shipment card → `ShipmentView.status` and shipment id plus next-intl routing.
- Tracking → ordered `ShipmentStatusEvent` list for steps and timeline; latest event label with Intl and active locale; delivery exception state for the alert; labeled support link placeholder.
- All pages → active next-intl locale and money helpers, prototype persona for the gate, switcher scenario with default fallback, and static noindex metadata.

## Boundary checks

- No HTTP route, Prisma model, migration, environment variable, or real backend write is added.
- Orders, shipments, and status events remain fixtures; only mock profile and address edits persist in browser storage.
- The customer gate is UI only and never an authorization boundary; ownership filtering is rehearsed in mock getters only.
- Private account and order routes are noindex; no sitemap entry is added for them.
- No remote media host, real personal data, payment data, or tracking token flow is introduced.

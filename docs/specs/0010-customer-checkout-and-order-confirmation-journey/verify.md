# Verify: Customer checkout and order confirmation journey · spec 0010 · updated 2026-11-20
_Steps derived from spec 0010 acceptance criteria. Runtime checks were exercised against `npm run dev -- --port 3100`; static checks were rerun after the final edit._

## UI / manual

- [ ] Sign in as the `customer` prototype persona, select two available lines in `/en/cart`, and open checkout. Confirm the one page shell renders address, delivery, payment, then summary in that fixed order, with the selected shop groups intact. → **AC-1, AC-2, AC-3**
- [ ] Confirm the draft uses item snapshots from the shared cart selection and the observed total is `৳3,049,860.00` (subtotal `৳3,049,800.00`, delivery `৳60.00`). Changing cart state after entry does not redraft checkout. → **AC-3, AC-5, AC-12**
- [ ] Change the saved address, delivery option, and payment method. Confirm the address snapshot, delivery charge from the mock rule table, and payment label update while the item and money snapshots stay stable. → **AC-5, AC-6, AC-7, AC-8**
- [ ] Select online payment and confirm the clearly labeled mock gateway panel appears with no card fields and no real payment data entry. → **AC-8**
- [ ] Place the order and confirm navigation to `/en/order/confirmation`. The observed deterministic order number was `CU-1NL4F98`; the page shows the per shop summary and total, shows no tracking, and a refresh keeps the same order number and total from session storage. → **AC-13**
- [ ] Open `/en/checkout?scenario=empty_selection`. Confirm the empty selection state appears with a path back to the cart and no draft items. → **AC-3, AC-9**
- [ ] Open `/en/checkout?scenario=no_address`. Confirm the inline address form appears, invalid input shows field errors, and valid input lets checkout continue without persisting the entered values. → **AC-6, AC-9**
- [ ] Open `/en/checkout?scenario=unavailable_item`. Confirm the unavailable line is clearly marked and place order stays disabled. → **AC-9, AC-11**
- [ ] Open `/en/checkout?scenario=payment_failure`. Confirm no order is placed and the customer can retry payment on the same checkout page. → **AC-9, AC-10**
- [ ] Open `/en/checkout?scenario=placement_failure`. Confirm the place order action is disabled while mock placement is in progress and retry is available afterward. → **AC-9, AC-11**
- [ ] On a product page, use buy now and confirm checkout receives only that single item draft while the shared cart quantity remains unchanged. Return to the cart and open checkout; confirm the buy now handoff is cleared and the selected cart lines are used again. → **AC-4, AC-14**
- [ ] Open `/en/checkout` with no persona or with a non-customer persona. Confirm the existing sign in required state appears and no checkout draft data is exposed. → **AC-1**
- [ ] Repeat representative cart, buy now, failure, and confirmation steps under `/bn`. Confirm Bangla strings render and money remains integer poisha displayed as BDT. → **AC-2**
- [ ] Inspect page metadata for `/en/checkout` and `/en/order/confirmation`. Confirm both emit `noindex, nofollow` and the confirmation contains no tracking section or tracking link. → **AC-2, AC-13**
- [ ] Check the browser console during the journey. The observed run had 0 errors and only recurring `next/image` fill warnings for sized `aspect-square` parents. → evidence note, not an AC
- [ ] Use the prototype switcher shortcuts on `/en/prototype`; confirm each checkout shortcut opens the matching `?scenario=` URL with a suggested `customer` persona. → **AC-9**

## Commands

- [ ] `npm run typecheck` → exits 0 → **AC-2, AC-5, AC-12**
- [ ] `npm run lint` → exits 0 → **AC-2**
- [ ] `npm run test` → 75 tests, 66 pass, 0 fail, 9 skipped; `T3`–`T7` remain declared stubs → boundary evidence only
- [ ] `npm run build` → exits 0; `/en/checkout`, `/bn/checkout`, `/en/order/confirmation`, and `/bn/order/confirmation` generate as partial prerendered routes → **AC-1, AC-2, AC-13**
- [ ] `git diff --check` → exits 0; only LF to CRLF notices remain → boundary evidence only
- [ ] `git diff --name-only -- prisma app/api` → empty → **AC-15**

## Acceptance-criteria coverage

- **AC-1**: customer-only gate, guest and non-customer sign in required state, no draft leakage, build prerender.
- **AC-2**: one page fixed section order, shared layout primitives, bilingual strings, integer BDT, noindex, build.
- **AC-3**: selected available cart lines, empty and all-unavailable blocks, back to cart.
- **AC-4**: buy now single item handoff, shared cart untouched, handoff cleared on cart entry.
- **AC-5**: full display and money snapshots, stable ids, no live cart read for draft contents.
- **AC-6**: saved addresses plus validated inline form with no persistence.
- **AC-7**: delivery options and charges from the mock rule table in integer BDT.
- **AC-8**: COD and online selection, labeled mock gateway panel, no card fields.
- **AC-9**: all five switcher scenarios with distinct states and recovery paths.
- **AC-10**: payment failure leaves no order and allows same page retry.
- **AC-11**: late availability block and disabled/retry placement state.
- **AC-12**: totals recomputed from the snapshot with `lib/money`; no client total trusted.
- **AC-13**: separate confirmation route, deterministic order number, per shop summary, no tracking, session storage refresh.
- **AC-14**: leaving checkout discards the draft and leaves the cart unchanged.
- **AC-15**: no HTTP routes, Prisma models, or migrations; data comes from `lib/mock/checkout` and the shared cart store.

## Boundary checks

- No real stock reservation, payment processing, order writes, audit writes, or backend mutations occur.
- No new HTTP API route, Prisma model, or migration is added.
- Only the last confirmation is stored in session storage; the checkout draft stays in local component state.
- Online payment is UI only; no card fields or real gateway credentials are introduced.
- Order tracking is not shown on confirmation and no public tracking token flow is introduced.

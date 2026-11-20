# 0008. Customer product and review journey, verify

Use this checklist to verify the spec and, later, the built prototype journey.

## Spec completeness

- [ ] `index.md` contains `## Summary`, `## Requirements`, `## Decision`, `## Feature design`, `## Build plan`, `## Consequences`, `## Follow-up`, and a `## Rationale` pointer.
- [ ] `rationale.md` contains `## Context`, `## Options considered`, and `## Rationale`.
- [ ] `## Requirements` defines IDed acceptance criteria **AC-1** through **AC-6**.
- [ ] Every build task in `## Build plan` references the AC(s) it satisfies, and every critical test scenario maps to an AC.
- [ ] `## Feature design` includes data model, state transitions, API/interface surface, value sourcing, key invariants, security model, configuration, and critical test scenarios.

## Prototype behavior (when built)

- [ ] A visitor can open `/[locale]/product/[slug]` from browse/discovery routes and see breadcrumbs, gallery, key facts, and clear continuation paths (**AC-1**).
- [ ] Variant selection updates the URL (`variant`) and displayed price, compare at price, availability, and variant details within one representative shop context with safe fallback (**AC-2**).
- [ ] Product description and details/specs render when available; review summary, 5 to 1 breakdown, published review list, and gated write a review UI entry render correctly, with a clear empty review state when none exist (**AC-3**).
- [ ] Frequently bought together, More from this shop, Recently viewed, and Related products appear as distinct prototype safe blocks excluding the current product, and the future experience placeholder is present and unobtrusive (**AC-4**).
- [ ] Unknown slug shows a clear not found state; invalid variant falls back safely; missing media uses local fallback with stable layout; unavailable selection disables primary purchase action but keeps page useful; empty groups do not break layout (**AC-5**).
- [ ] Content is bilingual (`en`/`bn`), prices are integer BDT, actions are UI only with no real persistence/submission/auth/payment/stock/backend writes, rendering is server first where possible with minimal client JavaScript, and the public page remains structurally crawlable as a prototype page (**AC-6**).

## Boundary checks

- [ ] No Prisma/database reads or writes, no real review submission, no real cart or wishlist persistence, no checkout completion, no stock reservation, and no backend mutations are introduced.
- [ ] No client trusted identity or security by URL is introduced; UI copy does not promise guest checkout completion.
- [ ] Images use local placeholder assets with meaningful alt text and stable dimensions; no new external image configuration is required.
- [ ] No new dependencies are added without justification.

---

# Verify: Customer product and review journey · spec 0008 · updated 2026-11-15
_Steps derived from spec 0008 acceptance criteria and value sourcing. `/check verify` can run these; `/test` can later lock the durable ones._

## UI / manual
- [ ] Open `/en/product/vivo-y28-5g` (or `/bn/product/vivo-y28-5g`) from browse or discovery and confirm breadcrumbs, gallery, key facts (title, brand when available, rating summary, integer BDT price and compare at when present), and clear continuation paths to browse/related items and cart, wishlist, checkout actions → **AC-1**
- [ ] Select a different variant and confirm the URL updates with `variant`, and displayed price, compare at price, availability/stock state, SKU/variant details update within one representative shop context with shop name and trust cues/badges visible (no multi seller comparison). Reload with an invalid or missing `variant` and confirm safe fallback to the default representative variant → **AC-2**
- [ ] Confirm product description and details/specs (highlights/specifications when provided) render. Confirm review section shows average rating, review count, 5 to 1 star breakdown, and published review list with safe author label, date label, rating, and title/body when available. Confirm "Write a review" is visible but gated as a UI only sign in/policy prompt with no submission or persistence. Open a state with no reviews (e.g. `?scenario=empty` on a valid product) and confirm a clear empty review state → **AC-3**
- [ ] Confirm distinct blocks for Frequently bought together, More from this shop, Recently viewed, and Related products, each prototype safe/deterministic and excluding the current product. Confirm Recently viewed uses prototype safe behavior (browser side state if used with deterministic mock fallback) and is labeled clearly when fallback content is shown. Confirm a clearly labeled, unobtrusive future experience placeholder is present with no real feature behavior → **AC-4**
- [ ] Open `/[locale]/product/unknown-product` and confirm a clear not found style prototype state with navigation back to browsing. Use an invalid variant URL and confirm safe fallback. Confirm missing/invalid gallery media uses local fallback with meaningful alt text and stable layout. Open `/[locale]/product/mens-cotton-shirt` and select an unavailable/out of stock variant to confirm a clear unavailable state and disabled primary purchase action while the page remains useful. Preview `?scenario=loading`, `?scenario=empty`, `?scenario=error` and confirm states; empty reviews and empty cross sell groups do not break layout → **AC-5**
- [ ] Confirm content is bilingual (`en`/`bn`), prices are integer BDT, and interactions are UI only with no real database reads/writes, no real auth or permission checks for browsing, no real review submission, no real cart/wishlist persistence, no checkout completion, no stock reservation, and no backend writes. Confirm rendering is server first where possible with minimal client JavaScript and stable image/layout handling, and the public product page remains structurally crawlable as a prototype page → **AC-6**
- [ ] Value sourcing checks: vary slug to confirm product identity/breadcrumb/category/brand come from route + mock catalog resolution; vary `variant` param to confirm selection, price, compare at, availability, and stock label come from resolved variant/URL with fallback; confirm shop context comes from representative listing/shop (one context, no comparison); confirm review summary/breakdown/list and safe author labels come from published mock reviews/persona mapping; confirm cross sell groups come from deterministic mock mappings (FBT/more from shop/related) and recently viewed fallback/client state excluding current product; confirm navigation targets resolve to existing/prototype routes → **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**

## Commands
- [ ] `npm run typecheck` → exits 0 → **AC-6**
- [ ] `npm run lint` → exits 0 → **AC-6**
- [ ] `npm run build` → exits 0 and product routes generate for mock product slugs/locales → **AC-1**, **AC-5**, **AC-6**

## Acceptance-criteria coverage
- **AC-1**: product open from browse/discovery, breadcrumbs/gallery/key facts, continuation paths, build/typecheck
- **AC-2**: variant URL sync and fallback, price/compare at/availability/SKU/details update, one representative shop context, build/typecheck
- **AC-3**: description/details/specs, review summary/breakdown/list, empty reviews, gated write review UI entry, build/typecheck
- **AC-4**: FBT/more from shop/recently viewed/related blocks, deterministic/prototype safe exclusions, future experience placeholder, build/typecheck
- **AC-5**: not found, invalid variant fallback, gallery fallback, unavailable primary action disabled, scenario/empty/error states, stable layout, build
- **AC-6**: bilingual and integer BDT, prototype boundaries/no backend writes, server first/minimal client JS/stable crawlable prototype page, commands pass

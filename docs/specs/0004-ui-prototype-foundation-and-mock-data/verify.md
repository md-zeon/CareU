# Verify: UI prototype foundation and mock data · spec 0004 · updated 2026-11-14
_Steps derived from spec 0004 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._
## UI / manual
- [ ] Open `/en/prototype` and `/bn/prototype` → layout primitives (container, header, sections, grid, detail, list, card shells) render as a coherent responsive prototype surface with bilingual UI labels. → AC-3, AC-5
- [ ] On `/en/prototype` states section → loading skeleton, empty state with action, error state with retry affordance, success state, and form feedback (help, error, success) are all visible and distinct. → AC-4, AC-7
- [ ] Click "Try again" in the error demo → state changes to a success confirmation. → AC-4
- [ ] Visit `/en`, `/en/search`, `/en/cart`, `/en/wishlist`, `/en/account`, `/en/order/track` and open header category navigation → routes remain navigable and shared surfaces render using the refactored foundation/menu data. → AC-6
- [ ] Check representative mock content on showcase and menu → user visible domain content appears in English and Bangla where provided, money is shown as BDT, and placeholders use local assets under `public/products/`. → AC-2, AC-5, AC-7

## Commands
- [ ] `npm run typecheck` → passes. → AC-1, AC-2, AC-3, AC-4, AC-5, AC-6
- [ ] `npm run lint` → passes. → AC-5, AC-6
- [ ] `npm run build` → passes. → AC-3, AC-4, AC-5, AC-6, AC-7
- [ ] Inspect `lib/mock/` exports and getters → typed fixtures/helpers exist for catalog/brands/products/variants/listings, shops/sellers/applications/staff, personas, cart/wishlist/addresses, orders/shipments/items/payments/COD, reviews/support/disputes/returns, inventory/payouts/settlements/commissions, moderation/delivery/notifications/content/analytics with `default/empty/loading/error/success` scenario handling where applicable. → AC-1, AC-2
- [ ] Inspect `lib/catalog/menu.ts`, storefront pages/components, and `app/[locale]/(storefront)/prototype/page.tsx` → no Prisma queries, no real DB/API reads or writes, and no real auth enforcement added for this prototype foundation. → AC-6, AC-7

## Acceptance-criteria coverage
- AC-1: `lib/mock/` module with typed, UI oriented fixtures and exports for all required phase groups (catalog/brands/products/variants/listings, shops/sellers/applications/staff, personas/role views, cart/wishlist/addresses, orders/shipments/items/payments/COD, reviews/support/disputes/returns, seller operations, platform operations).
- AC-2: stable string IDs/slugs and explicit cross domain references; integer BDT money values; bilingual `{ en, bn }` fields for user visible content where shown; representative happy path records; scenario helpers for `default/empty/loading/error/success` where applicable; data consumed through typed getters/helpers.
- AC-3: reusable layout primitives available (containers, headers, sections, grids/stacks, card/list/detail shells) for storefront, seller, and admin composition.
- AC-4: loading/skeleton, empty, error with recovery affordance, success, and basic form feedback primitives available and demonstrated.
- AC-5: practical design tokens and reusable primitives in code adapted to CareU (Bangladesh first, EN/BN, BDT, multi vendor plus CareU first party); foundation UI labels use next-intl.
- AC-6: `lib/catalog/menu.ts` and shared placeholder surfaces refactored onto the foundation; routes remain navigable; no real database reads, real API calls, or real auth enforcement introduced.
- AC-7: internal prototype showcase route exists (`/[locale]/prototype`, noindex) demonstrating layout primitives and key states using local placeholder media assets.

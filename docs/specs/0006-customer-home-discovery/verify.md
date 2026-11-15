# Verify: Customer home and discovery journey · spec 0006 · updated 2026-11-14
_Steps derived from spec 0006 acceptance criteria and value sourcing. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [x] Visit `/en` and `/bn`: home renders hero, trust strip, featured categories, promotions, featured products, brand highlights, editorial, and closing links in a coherent order with believable localized content → AC-1, AC-2, AC-4
- [x] Confirm hero, category, product, brand, campaign, and closing links navigate to real prototype routes (including `/category/[slug]`, `/product/[slug]`, `/brand/[slug]`, `/campaign/[slug]`, `/search`, `/account` as used) without dead ends; unknown slugs show a prototype safe not found/placeholder state → AC-3
- [x] Confirm featured product prices display in BDT (integer poisha formatted), shop context is visible (CareU vs marketplace seller), and content is adapted for CareU in both English and Bangla → AC-4
- [x] Open `/en/prototype` and `/bn/prototype`: confirm home discovery previews demonstrate default, loading, empty, and error states; error preview includes a clear retry affordance and returns to content after retry → AC-5
- [x] Resize to mobile/tablet/desktop widths: layout remains responsive, images keep stable dimensions/aspect ratios, and no obvious layout shift or overflow is introduced → AC-5
- [x] Confirm prototype boundaries in UI/copy: mock content only, no real orders/payments/stock reservation/auth enforcement claims, no guest checkout promise, and no public order tracking promise conflicting with CareU policy → AC-6

## Commands
- [x] `npm run typecheck` → exits 0 → AC-5, AC-6
- [x] `npm run lint` → exits 0 → AC-5, AC-6
- [x] `npm run build` → completes successfully and includes home/category/product/brand/campaign routes → AC-3, AC-5

## Acceptance-criteria coverage
- AC-1: covered by home visit and section discoverability checks.
- AC-2: covered by section order/content checks.
- AC-3: covered by navigation/link checks and build route presence.
- AC-4: covered by bilingual/BDT/CareU context checks.
- AC-5: covered by showcase scenario checks, responsive/layout checks, and command checks.
- AC-6: covered by boundary/copy checks and absence of real backend/auth/payment/stock behavior.

## Value sourcing checks
- [x] Home chrome labels, section titles, retry/empty/error UI text, and prototype note come from `next-intl` Home messages in `en`/`bn` → AC-4, AC-5
- [x] Hero eyebrow/title/description/badge/image/alt/CTAs/layout hints come from `HomeHero` fixture data → AC-1, AC-2, AC-4
- [x] Trust item icons/titles/descriptions come from `HomeTrustItem[]` fixtures mapped to icons → AC-1, AC-2, AC-4
- [x] Featured categories resolve from existing mock catalog categories with prototype href targets → AC-1, AC-2, AC-3
- [x] Campaign titles/descriptions/images/badges/tags/CTAs/hrefs come from `HomeCampaign[]` fixtures → AC-1, AC-2, AC-3, AC-4
- [x] Featured products resolve from existing mock products/variants/shops/brands; prices/compare-at are integer BDT formatted with money helpers; shop labels reflect CareU vs marketplace seller → AC-1, AC-2, AC-3, AC-4
- [x] Brand highlights resolve from existing mock brands with prototype href targets and count labels → AC-1, AC-2, AC-3
- [x] Editorial content comes from `HomeEditorial` fixture (eyebrow/title/body/image/cta/author/source as present) → AC-1, AC-2, AC-4
- [x] Closing discovery block and links come from `HomeClosingBlock`/`HomeClosingLink[]` fixtures with valid hrefs → AC-1, AC-2, AC-3
- [x] Navigation targets resolve to existing routes or new prototype placeholder routes (`/category/[slug]`, `/product/[slug]`, `/brand/[slug]`, `/campaign/[slug]`) with locale aware links → AC-3
- [x] Loading/empty/error/default states come from home scenario helpers/getters and shared state primitives; showcase provides preview control → AC-5
- [x] Active locale and LocalizedText rendering follow route locale/next-intl and `{ en, bn }` mock fields → AC-4

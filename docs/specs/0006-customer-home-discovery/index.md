# 0006. Customer home and discovery journey

**Date**: 2026-11-14
**Status**: Accepted

## Summary

This spec defines the customer home and discovery journey for CareU.bd as a Facade prototype on the existing storefront. It gives visitors a balanced first view of CareU with a clear hero, trust cues, featured categories, promotions, featured products, brand highlights, an editorial story, and closing discovery links. The page will be built on mock data and reusable UI blocks, with clickable prototype routes, bilingual content, BDT pricing, strong performance habits, and clear loading, empty, and error states.

## Requirements

**User stories**:
- As a visitor, I want the home page to help me understand CareU and quickly discover categories, products, promotions, and brands so that I can start browsing with confidence.
- As a visitor, I want home page actions and cards to take me to real, clickable prototype pages so that the discovery journey feels complete.
- As a reviewer, I want the home page to show believable content and clear loading, empty, error, and success states so that I can judge the experience before backend wiring.

**Acceptance criteria** (the contract, each criterion is independently checkable):
- **AC-1**: A visitor landing on the home page can quickly understand what CareU offers and find clear paths into browsing, featured products, promotions, categories, and brands.
- **AC-2**: The home page shows the agreed prototype sections in a coherent order adapted for CareU: hero, trust and value strip, featured categories, promotions or campaign highlights, featured or new products, brand highlights or shop by brand, editorial or story, and closing discovery links.
- **AC-3**: Key home actions and cards (hero calls to action, category, brand, product, promotion, and closing discovery links as applicable) navigate to real, clickable prototype routes on mock data so the discovery journey feels complete without real backend behavior.
- **AC-4**: Content and labels are adapted for CareU (Bangladesh first marketplace, CareU and third party seller context where relevant, English and Bangla support, and BDT pricing display) and do not copy reference sites.
- **AC-5**: The home journey includes the key prototype states needed for this feature: a normal content state plus appropriate loading, empty, and error handling for data driven sections, with responsive behavior and performance minded rendering (server first where possible, minimal client JavaScript, optimized images with stable dimensions, and no layout shift).
- **AC-6**: The experience remains prototype grade (mock or placeholder data, no real database writes, no real authentication enforcement, no payments, and no stock reservation) and follows CareU policy in the UI (no guest checkout promises that conflict with policy, and any tracking references remain sign in required where shown).

## Decision

**Chosen option**: Option 1: Dedicated home discovery module with reusable section blocks.

Build the customer home and discovery journey as a composed, server first prototype page backed by a dedicated `lib/mock` home discovery module and reusable section components that extend the existing foundation.

**Implementation skills**: none recorded in project context files for this feature. Follow root `AGENTS.md` rules for Next.js App Router, React Server Components, caching, next-intl, integer BDT money, prototype boundaries, and performance. Follow `lib/money/AGENTS.md` when formatting or handling BDT values, `tests/AGENTS.md` when adding tests for future wiring, and `lib/authz/AGENTS.md` only if a later change introduces protected behavior (not expected in this prototype).

## Feature design

**Data model sketch**:

The data model for this feature is UI oriented mock data only (no Prisma schema change). User visible text uses `LocalizedText` (`{ en, bn }`) where shown, money is integer BDT consistent with existing mocks, and image paths are local placeholders.

| Entity | Key fields | Primary key | Relationships / cardinality |
|---|---|---|---|
| `HomeDiscoveryPayload` | `hero`, `trustItems`, `featuredCategories`, `campaigns`, `featuredProducts`, `featuredBrands`, `editorial`, `closingLinks` | n/a (composed result) | 1 payload contains 1 hero, 0..N trust items, 0..N featured categories, 0..N campaigns, 0..N featured products, 0..N featured brands, 0..1 editorial, 0..N closing links |
| `HomeHero` | `id`, `eyebrow?`, `title`, `description`, `primaryCta` (`label`, `href`), `secondaryCta?` (`label`, `href`), `image`, `imageAlt?`, `badge?`, `variant?`/layout hints (`align?`, `theme?`, `campaignId?`) | `id` | 1 per payload; call to action `href` values target navigable prototype routes |
| `HomeTrustItem` | `id`, `icon`, `title`, `description?` | `id` | 0..N per payload |
| `HomeCampaign` | `id`, `title`, `description?`, `image`, `imageAlt?`, `ctaLabel`, `href`, `badge?`/`tag?`, `tone?`/`variant?`, `startsAtLabel?`, `endsAtLabel?` | `id` | 0..N per payload; `href` targets a navigable prototype route (and may represent a campaign landing or search/browse destination) |
| `HomeEditorial` | `id`, `eyebrow?`, `title`, `body` or `excerpt`, `image`, `imageAlt?`, `ctaLabel?`, `href?`, `author?` or `sourceLabel?` | `id` | 0..1 per payload |
| `HomeClosingLink` | `id`, `label`, `description?`, `href`, `icon?` (and optional section intro fields on the closing block container, such as `title?`) | `id` | 0..N links in closing block |
| Existing `MockCategory` / menu category data | existing fields (id, slug, localized name, image, href/sort context as available) | existing `id`/`slug` | `featuredCategories` references and resolves 0..N existing categories |
| Existing `MockProduct` with related listing/variant/shop context as needed | existing fields (id, slug, localized title, images, integer BDT price/compare at, shop context, rating/availability labels as available) | existing `id`/`slug` | `featuredProducts` references and resolves 0..N existing products for display |
| Existing `MockBrand` | existing fields (id, slug, localized name, logo/image as available) | existing `id`/`slug` | `featuredBrands` references and resolves 0..N existing brands |

**State transitions** (if applicable):

This feature has no persistent business state machine. View state is scenario driven for prototype review: `default` (normal content), `loading` (skeleton or loading placeholders), `empty` (no content or clear empty treatment), `error` (clear error with retry affordance in demo/showcase context), and `success` where used by shared state helpers.

**API surface**:

No new backend API endpoints or server actions are added. The interface surface is route, mock, and component contracts.

| Surface | Kind | Key inputs | Key outputs | Access / use | Key errors or states |
|---|---|---|---|---|---|
| `app/[locale]/(storefront)/page.tsx` | Next.js Server Component route | locale from route params/root params, translations, composed home discovery data (default scenario for normal render) | rendered home sections and navigable links | Public storefront page, no sign in required | missing data falls back to empty or error section states; route remains navigable |
| `lib/mock/home/*` (types, fixtures, getters) | TypeScript mock module | optional `{ scenario }` and optional selectors/refs as needed | `HomeDiscoveryPayload` or section results with scenario support | Imported by home page, section components, and showcase | `loading`, `empty`, `error` scenario results; unknown refs should resolve safely (omit or fallback) |
| `lib/mock/index.ts` | barrel export | none | exports home discovery types/getters | Shared import surface | export omissions break consumers at build time |
| Home section components (for example hero, trust strip, category grid, campaigns, product rail, brand highlights, editorial, closing links) | React components (Server Components by default; Client only if needed for minimal UI behavior) | typed props from `HomeDiscoveryPayload` and/or resolved mock entities, labels/messages as needed | composed, responsive UI sections | Used by home route and prototype showcase | missing optional fields handled safely; links always point to valid prototype routes |
| Prototype placeholder routes for discovery targets | Next.js routes under `app/[locale]/(storefront)/...` | route params such as `slug` where applicable | clear prototype placeholder pages with mock/stateful UI | Public navigable prototype destinations from home | unknown slug shows not found style placeholder content (prototype safe), not a broken navigation path |
| Internal prototype showcase/state preview (existing or extended) | Next.js route/section | scenario selection or documented preview mechanism | visible loading, empty, error, success, and default examples for home sections | Internal prototype review | preview mechanism is prototype only and documented |

**Value sourcing** (every value each action produces, computes, or displays names where it comes from; a required value with no named source is an undecided input, resolve it before this spec is done, do not leave the build to invent it):

| Action | Value produced / displayed | Source |
|---|---|---|
| Render home page shell and section headings/chrome labels | Page title context, section labels, button/link UI text, retry text, empty/error messages for UI chrome | `next-intl` messages and existing translated strings/locale routing (`en`, `bn`) |
| Render hero content | Eyebrow, title, description, badge, image, image alt, CTA labels, CTA hrefs, layout/variant hints | `HomeHero` fixture(s) in `lib/mock/home` (LocalizedText, local image paths, prototype route hrefs) |
| Render trust and value strip | Icon keys, titles, descriptions | `HomeTrustItem[]` fixtures in `lib/mock/home` mapped to icon components (for example lucide icons) |
| Render featured categories | Category names, images, links, order/selection | `featuredCategories` refs resolved from existing `lib/mock/catalog` (and menu/category helpers as needed) plus prototype `href` targets |
| Render promotions or campaign highlights | Titles, descriptions, images, badges/tags, CTA labels, hrefs, optional time labels/tones | `HomeCampaign[]` fixtures in `lib/mock/home` |
| Render featured or new products | Product titles, images, prices, compare at prices, badges/ratings/shop context labels as available, product links | `featuredProducts` refs resolved from existing `lib/mock/catalog` (and related shop/listing/variant context as needed); prices as integer BDT formatted with existing money helpers (for example `formatPrice`); shop labels from existing shop mocks where shown |
| Render brand highlights | Brand names, logos/images, links | `featuredBrands` refs resolved from existing `lib/mock/catalog` brand data plus prototype `href` targets |
| Render editorial or story | Eyebrow, title, body/excerpt, image, image alt, CTA, source/author label | `HomeEditorial` fixture in `lib/mock/home` |
| Render closing discovery links | Section intro, link labels/descriptions/icons, hrefs | `HomeClosingLink[]` and container fields in `lib/mock/home` |
| Navigate from home entry points | Destination URLs for hero, categories, products, brands, campaigns, and closing links | `href` fields in home fixtures/resolved entities; existing routes (`/search`, `/cart`, `/wishlist`, `/account` where used) and new prototype placeholder routes added by this feature: `/category/[slug]`, `/product/[slug]`, `/brand/[slug]`, and `/campaign/[slug]` (locale aware) |
| Demonstrate loading, empty, error, success states | Scenario selection and resulting UI state | Scenario helpers/getter options in `lib/mock/home` and shared state primitives; normal home route defaults to `default`; preview/showcase mechanism provides scenario control for review (prototype only) |
| Choose locale and language specific text | Which language string to display for LocalizedText and UI copy | Active locale from Next.js route/root params and next-intl; LocalizedText fields provide `en` and `bn` values in mock content |

**Key invariants**:
- The home page is a public storefront surface and must remain crawlable in structure as a normal page; prototype preview controls (if any) must not create private data exposure or real access boundaries.
- No real database reads, Prisma queries, real API calls, real authentication enforcement, payment flows, or stock/reservation behavior are introduced.
- All user visible mock content that represents translatable content uses `LocalizedText` (`en`, `bn`) where shown; UI chrome labels use next-intl and are not hardcoded.
- All money values displayed from mocks are integer BDT (poisha consistent with existing mock conventions) and formatted for display using project money helpers; no float or `Decimal` money.
- All `href` targets used by home discovery entry points resolve to navigable routes in the app (existing routes or prototype placeholders added in this feature); no dead end links.
- Image assets for this feature use local placeholder paths under `public/` with meaningful alt text and explicit dimensions/sizing to avoid layout shift.
- Rendering is server first by default with minimal client JavaScript; interactive behavior (if any) is limited to lightweight UI needs and does not add unnecessary dependencies.
- Scenario handling is consistent with the prototype foundation: `default`, `empty`, `loading`, `error`, and `success` are supported where applicable through shared helpers/primitives.

**Security model**:
- No protected backend operations are added. The home page is public and requires no sign in.
- No real authorization, session mutation, or permission granting is performed. UI visibility and prototype preview controls are never security controls.
- Mock data and local placeholder assets contain no secrets, credentials, or personal production data.
- Any future personalized or protected home content must be implemented later with server side session and permission checks; this feature must not preempt that model with client trusted identity.

**Configuration required**:
- No new environment variables or third party credentials are required.
- No new `images.remotePatterns` entries are required when using local placeholder assets only.

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path: a visitor can view the home page and see hero, trust, featured categories, promotions, featured products, brand highlights, editorial, and closing discovery sections with believable localized mock content and BDT prices, verifies **AC-1**, **AC-2**, **AC-4**.
- Navigation flow: clicking primary home entry points (hero calls to action, category, product, brand, campaign, and closing links) navigates to real prototype routes or placeholders without broken navigation, verifies **AC-3**.
- State coverage: loading, empty, and error states for data driven home sections can be demonstrated through the prototype scenario/showcase mechanism, and the default home view renders a stable responsive layout without layout shift, verifies **AC-5**.
- Boundary and policy check: the page uses mock/local data only, introduces no real backend/auth/payment/stock behavior, and contains no UI copy that promises guest checkout or public order tracking in conflict with CareU policy, verifies **AC-6**.

## Build plan

Build approach: **Facade** (project default, prototype). Lead with a visible, believable home page shell composed from mock data and reusable blocks, then add navigable placeholder targets and scenario coverage so the journey is reviewable end to end before any backend wiring.

1. **Add the home discovery mock contract and fixtures**: create `lib/mock/home` (or equivalent) with typed entities (`HomeDiscoveryPayload`, `HomeHero`, `HomeTrustItem`, `HomeCampaign`, `HomeEditorial`, `HomeClosingLink`), representative bilingual fixtures, local placeholder image references, scenario helpers, and composed getters that resolve featured categories, products, and brands from existing mocks; export from `lib/mock/index.ts`, satisfies **AC-1**, **AC-2**, **AC-4**, **AC-5**, **AC-6**.
2. **Build reusable home section components on the existing foundation**: implement server first section blocks for hero, trust strip, featured categories, promotions, featured products, brand highlights, editorial, and closing links using existing primitives/state components and CSS first responsive layout (add shadcn UI components only if needed), satisfies **AC-1**, **AC-2**, **AC-4**, **AC-5**.
3. **Compose the storefront home route**: replace the placeholder home page with the ordered discovery journey, default scenario rendering, locale aware content/messages, integer BDT display, and performance minded image/layout handling, satisfies **AC-1**, **AC-2**, **AC-4**, **AC-5**, **AC-6**.
4. **Add navigable prototype destination routes for missing targets**: create simple placeholder routes for discovery links that do not yet exist (at minimum the targets chosen in this spec such as category, product, brand, and campaign placeholders) with clear prototype states and no dead ends, satisfies **AC-3**, **AC-6**.
5. **Add state preview coverage and resilience pass**: ensure home sections handle loading, empty, and error scenarios through shared helpers/showcase or documented prototype preview controls, add safe fallbacks (alt text, missing data handling, responsive checks), and verify no real backend/auth/payment wiring is introduced, satisfies **AC-3**, **AC-4**, **AC-5**, **AC-6**.

## Consequences

**Positive**:
- Reviewers get a clear, clickable home and discovery experience that makes the storefront direction tangible before backend wiring.
- A dedicated home mock module and reusable section blocks reduce duplication and make later journey and data wiring work easier to stage.
- Server first rendering, local assets, and CSS first layout choices support the performance goal and keep the prototype lightweight.

**Negative / tradeoffs**:
- The feature adds several new mock types, fixtures, components, and placeholder routes that will need maintenance as the prototype evolves.
- Prototype placeholder destinations are intentionally incomplete and will be replaced or deepened by later journey features.
- Home specific mock content may not map one to one with future CMS or catalog query shapes, so later wiring will require adaptation.

**Neutral**:
- No database schema, environment variables, or production integrations change in this feature.
- The visual result will follow the existing CareU foundation and researched direction rather than a pixel perfect external design file.

## Follow-up

- [ ] As customer browse, brand, and product journeys (features 7 and 8) are designed and built, replace or deepen the placeholder category, brand, product, and campaign routes with their full journey implementations and keep home links aligned.
- [ ] If a dedicated `design.md` or design tool source is adopted later, align home section spacing, typography, and component details to that source of truth.
- [ ] During backend wiring, replace home mock getters with real cached catalog/content reads and add metadata, structured data, sitemap, and canonical handling appropriate for the production home page.
- [ ] When adding new shadcn UI components for this feature, confirm they are necessary and do not add avoidable client bundle cost.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

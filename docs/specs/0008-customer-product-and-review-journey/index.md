# 0008. Customer product and review journey

**Date**: 2026-11-15
**Status**: Accepted

## Summary

This spec defines the customer product and review journey for CareU.bd as a Facade prototype on the existing storefront. A visitor can open a product page, review gallery, price, variants, availability, and shop context, read details and reviews, explore cross sell and related items, and continue toward cart, wishlist, or checkout placeholder flows. The page will run on mock and placeholder data only, with bilingual content, integer BDT pricing, server first rendering where possible, and clear states for loading, empty, error, unavailable, and not found cases so the experience can be reviewed before backend wiring.

## Requirements

**User stories**:
- As a visitor, I want to understand a product, its price, variants, availability, and shop context so that I can decide whether to continue.
- As a visitor, I want to read product details and reviews and discover related or complementary items so that I can evaluate the product with confidence.
- As a reviewer, I want the product page to be clickable, believable, and prototype safe so that I can judge the experience before real data, cart, checkout, and review submission are connected.

**Acceptance criteria** (the contract, each criterion is independently checkable):
- **AC-1** (Page purpose and entry): A visitor can open a product detail page from browse or discovery routes and quickly understand what the product is, see key facts (title, brand when available, rating summary, and integer BDT price/compare at when present), and find clear paths to continue browsing, view related items, or use cart, wishlist, and checkout related actions.
- **AC-2** (Purchase block, variants, and shop context): The top of the page shows breadcrumbs and a purchase block with a media gallery and key information. A visitor can select a variant when variants exist, see price, compare at price, availability/stock state, and variant details update for the selected option within one representative shop context, and understand shop or seller context (shop name and available trust cues/badges) without multi seller offer comparison. The selected variant is reflected in URL state with safe fallback to a default representative variant.
- **AC-3** (Details and reviews): The page shows product description and details/specs content (including highlights/specifications when mock data provides them) and a review section with average rating, review count, rating breakdown (5 to 1 stars), and a list of published reviews with safe author display, date label, rating, and title/body when available. When no reviews exist, the page shows a clear empty review state. A write a review action is visible but gated as a UI only sign in or policy prompt with no submission or persistence.
- **AC-4** (Cross sell, related, and future placeholder): The page includes distinct merchandising blocks for Frequently bought together, More from this shop, Recently viewed, and Related products, each driven by deterministic mock data or prototype safe client/mock behavior and excluding the current product. A Recently viewed block follows prototype safe behavior (simple browser side UI state if used, with deterministic mock fallback). The page also includes a clearly labeled, unobtrusive placeholder area for future supported experiences without inventing real feature behavior.
- **AC-5** (States, fallbacks, and resilience): The journey handles required states: unknown product slug shows a clear not found style prototype state with navigation back to browsing; invalid or missing gallery media uses a local fallback with meaningful alt text and stable layout; invalid variant URL or missing selection falls back safely to a default representative variant; out of stock or unavailable selection shows a clear unavailable state and disables the primary purchase action while keeping the page useful; empty reviews and empty cross sell groups are handled clearly without broken layout; loading, empty, error, and default scenarios can be demonstrated for prototype review where applicable.
- **AC-6** (Prototype boundaries, i18n, money, SEO, and performance): The journey uses mock and local placeholder data only with no real database reads or writes, no real auth or permission checks for browsing, no real review submission, no real cart or wishlist persistence, no checkout, no stock reservation, and no backend writes. User facing content is bilingual (`en` and `bn`), prices are integer BDT, and rendering is server first where possible with minimal client JavaScript and stable image/layout handling. Public product pages remain structurally crawlable as prototype pages, and UI visibility is not a security boundary.

## Decision

**Chosen option**: Option 1: Dedicated PDP mock module and composed page result with reusable server first sections.

Build the product and review journey as a cohesive prototype feature backed by a dedicated PDP mock layer (composed `ProductDetailPageResult` and supporting contracts), deterministic resolvers over existing catalog, shop, trust, and identity mocks, URL driven variant selection, and reusable server first storefront components with small client interactions only where needed (gallery controls, variant selection, UI only quick actions, and recently viewed state). The design direction is a clean marketplace PDP adapted to the existing CareU prototype foundation (Dir 1), with no new dependencies.

**Implementation skills**: none recorded in project context files for this feature. Follow root `AGENTS.md` rules for Next.js App Router, React Server Components, caching boundaries, next-intl, integer BDT money, prototype boundaries, SEO rules, and performance. Follow `lib/money/AGENTS.md` when formatting or handling BDT values.

## Feature design

**Data model sketch**:

The data model for this feature is UI oriented mock data only (no Prisma schema change). User facing mock text uses `LocalizedText` (`{ en, bn }`) where shown, money is integer BDT, and image paths are local placeholders.

| Entity | Key fields | Primary key | Relationships / cardinality |
|---|---|---|---|
| `ProductDetailPageResult` (composed) | `slug`, `breadcrumbs`, `product?`, `gallery`, `variants`, `selectedVariantId`, `shop?`, `details`, `reviewSummary`, `reviews`, `crossSell`, `futureExperience`, `scenario/state metadata?` | n/a (composed by slug, query, scenario) | 1 result per resolved product page; composes entities below. Unknown slug yields not found state (no `product`) |
| `ResolvedProductDetail` | `id`, `slug`, `title` (LocalizedText), `description` (LocalizedText), `brand?` (id/label), `category?` (id/label), `rating?`, `reviewCount?`, `badges?`, `highlights?` (`LocalizedText[]`), `specifications?` (`{ label: LocalizedText; value: LocalizedText }[]`) | `id` / `slug` | Resolves 1 existing `MockProduct`; 0..1 `MockBrand`; 0..1 `MockCategory`; 1..N `MockProductVariant` |
| `ProductGalleryItem` | `id`, `src` (local path), `alt` (LocalizedText), `order`, `isPrimary?`, `variantId?` (hint) | `id` | 1..N per product; 0..1 preferred item hint per variant. Built from product images with local fallback |
| `ResolvedVariant` | `id`, `productId`, `title` (LocalizedText), `sku?`, `options?`, `priceBdt` (int), `compareAtPriceBdt?` (int), `availability` (`in_stock` \| `low_stock` \| `out_of_stock`), `stockStateLabel?`, `isSelectable` | `id` | N variants per 1 product; 1 selected at a time within 1 representative shop context |
| `ResolvedShopContext` | `shopId`, `label` (LocalizedText), `slug?/href?`, `badges?/trustCues?`, `isCareU?` or type label | `shopId` | 1 representative shop per viewed product context; drives shop block and More from this shop |
| `ReviewSummary` | `averageRating`, `reviewCount`, `breakdown` (counts for stars 5..1) | n/a | 1 per product page, derived from displayable published reviews |
| `ResolvedReview` | `id`, `rating`, `title?` (LocalizedText), `body` (LocalizedText), `createdAtLabel`, `authorLabel` (LocalizedText, safe), `status` | `id` | 0..N per product; resolves existing `MockReview` and optional mock persona for safe author display |
| `CrossSellGroups` / `CrossSellGroup` | `key` (`frequently_bought_together` \| `more_from_shop` \| `recently_viewed` \| `related`), `title` (LocalizedText), `items` (resolved product cards), `isPrototypeMock?` | `key` within page | 0..4 groups per page; each 0..N items (small fixed max). Items exclude current product and invalid refs omitted |
| `FutureExperiencePlaceholder` | `id/key`, `label` (LocalizedText), `description` (LocalizedText), `placement?` | `id/key` | 0..1 per page, unobtrusive and clearly labeled |
| Existing mocks reused/extended | `MockProduct` (+ optional `highlights`, `specifications`, `frequentlyBoughtTogetherProductIds?`), `MockProductVariant`, `MockListing`, `MockShop`, `MockBrand`, `MockCategory`, `MockReview`, identity/persona mocks as available | existing ids/slugs | Extensions are mock safe and deterministic; existing browse/home behavior remains intact |

**State transitions** (if applicable):

No persistent business state machine. View state is scenario driven for prototype review (`default`, `loading`, `empty`, `error`, and `success` where used by shared helpers). Client UI state is limited to prototype safe interactions: selected variant synchronized with URL (with fallback), gallery active media, UI only wishlist/cart action feedback, and recently viewed client state with deterministic mock fallback. No real persistence, submission, reservation, or payment state.

**API surface**:

No new backend API endpoints or server actions are added. The interface surface is route, mock module, and component contracts.

| Surface | Kind | Key inputs | Key outputs | Access / use | Key errors or states |
|---|---|---|---|---|---|
| `app/[locale]/(storefront)/product/[slug]/page.tsx` | Next.js Server Component route (new/upgrade) | `locale`, `slug`, URL search params (`variant?`, `scenario?` for prototype preview as applicable) | PDP with breadcrumbs, purchase block, details/specs, reviews, cross sell, future placeholder, related items, or not found/loading/empty/error states | Public, no sign in | unknown slug -> not found style prototype state with navigation; invalid params -> safe defaults/fallback variant |
| `lib/mock/pdp/*` (and safe catalog/trust extensions) | TypeScript mock modules/getters | `slug`, selected variant hint, `locale` aware resolution context, scenario options | `ProductDetailPageResult`, resolved detail/gallery/variants/shop, review summary/reviews, cross sell groups, recently viewed fallback data | Server components and limited client helpers as appropriate | unknown refs omitted safely; invalid selection normalized; deterministic grouping and ordering |
| `components/storefront/product/*` | React components (server first, client only where interaction needed) | typed PDP result, labels/messages, URL/selection state, UI only callbacks | responsive PDP sections and interactions | Public UI | missing optional data handled safely; stable layout; no backend side effects |
| Header/browse links to `/product/[slug]` | Existing navigation surfaces | product slug/href | navigable entry into PDP | Public | unknown/missing target handled by PDP not found state |

**Value sourcing** (every value each action produces, computes, or displays names where it comes from; a required value with no named source is an undecided input, resolve it before this spec is done, do not leave the build to invent it):

| Action | Value produced / displayed | Source |
|---|---|---|
| Resolve product page context | Page validity, product identity, title, description, brand, category, base rating/review counts | Route `slug` resolved against existing `MockProduct` (and composed PDP getter); brand/category labels from `MockBrand`/`MockCategory`; not found when no match |
| Build breadcrumbs | Labels and hrefs | Fixed Home route + category chain (from product/category mock context when available) + current product label; links to existing/prototype routes |
| Resolve gallery | Gallery items, order, primary/active image, alt text, fallback image | `MockProduct.images` mapped to `ProductGalleryItem` with localized or meaningful alt; selected variant hint used when provided; local fallback placeholder asset when no valid image |
| Resolve representative shop context (6A) | Shop name/label, href/badges/trust cues, CareU/third party cue | Representative active/visible listing/offer context resolved from `MockListing` and `MockShop` for the product, consistent with browse eligibility rules where applicable; no multi seller comparison |
| Resolve variants and selection (16A) | Variant list, options, selected variant, SKU, priceBdt, compareAtPriceBdt, availability, stock label, selectability | `MockProductVariant` records for the product resolved in representative shop context; `variant` URL param selects variant with safe fallback to default representative variant; money values integer BDT |
| Render purchase actions and handoff (4A) | Add to cart, wishlist, checkout/proceed actions and feedback | UI labels/messages from `next-intl`; actions provide UI only feedback and/or navigate to existing placeholder routes (`/cart`, `/wishlist`, `/checkout` as applicable); no persistence, no backend, no real checkout completion |
| Render description and details/specs (15A,18A) | Description, highlights, specification rows/sections | `MockProduct.description` plus mock safe extensions `highlights` and `specifications` when available; sections hidden/graceful when missing |
| Render review summary and list (2A,19A) | Average rating, review count, 5..1 breakdown, review items (rating, title, body, date label, safe author label) | Published `MockReview` records for product; summary/breakdown derived; author label resolved from mock persona/identity when available else generic localized label (for example “Verified customer”); empty state when none |
| Write a review entry (gated) | Visible entry point and prompt/note | UI only control with localized copy/policy prompt (for example sign in or policy note); no form submission, no persistence, no backend |
| Build cross sell groups (20A,21A) | Frequently bought together, More from this shop, Related products items | Deterministic mock resolvers: FBT from explicit per product mapping (`frequentlyBoughtTogetherProductIds` or equivalent) with safe fallback; More from this shop from same representative shop products; Related from same category and/or brand; all exclude current product, use resolved product cards, omit invalid refs, apply small fixed max |
| Build Recently viewed (10A) | Recently viewed items and fallback content | Client side recent product slugs/ids state if used (prototype safe) plus deterministic mock fallback set; resolved to product cards, excludes current product, labeled clearly as prototype content when fallback |
| Render future experience placeholder (3A) | Placeholder label/description/block | `FutureExperiencePlaceholder` mock/config content, clearly labeled and unobtrusive, no real feature behavior |
| Render states and resilience (7A) | Not found, loading, empty, error, unavailable, fallback media, empty groups | Route/component logic, scenario helpers/shared state primitives, and safe parsing/fallback rules; unknown slug and invalid params handled without crash |
| Locale, money formatting, and UI chrome | Localized labels/text, BDT formatted prices | Active locale from route/root params and `next-intl`; `LocalizedText` provides `en`/`bn`; integer BDT formatted with existing money helpers |
| Navigation targets | All href destinations (breadcrumbs, actions, cards, back links) | Existing and prototype routes: browse/category/brand/collection/search/product, `/cart`, `/wishlist`, `/checkout`, and other navigable placeholders as linked |

**Key invariants**:
- Prototype only: no Prisma/database reads or writes, no real auth or permission checks for browsing, no real review submission, no real cart/wishlist persistence, no checkout, no stock reservation, no payment, and no backend mutations.
- Public product pages remain structurally crawlable as prototype pages; UI visibility and prototype controls are not security boundaries.
- URL is the source of truth for variant selection (`variant`) with safe fallback to the default representative variant; invalid params never crash the page.
- One representative shop context is shown for the viewed offer (6A); no multi seller offer comparison is introduced.
- A variant or offer shown as unavailable/out of stock must present a clear unavailable state and disable the primary purchase action while keeping the page useful (7A).
- Cross sell groups exclude the current product, omit invalid/missing refs safely, use deterministic mock sourcing (21A), and apply a small fixed max per group.
- Recently viewed uses prototype safe behavior only (10A): simple browser side UI state if used plus deterministic mock fallback, no real tracking persistence beyond lightweight client state if used.
- All user facing translatable mock content uses `LocalizedText` (`en`, `bn`) where shown; UI chrome uses `next-intl`. No hardcoded user facing strings.
- All displayed money values are integer BDT and formatted with project money helpers; no float or `Decimal` money.
- Rendering is server first by default with minimal client JavaScript; client components are limited to interaction needs and no new dependency is added.
- Images use local placeholder assets with meaningful alt text and stable dimensions/sizing to avoid layout shift.

**Security model**:
- The product detail page is a public browsing surface and requires no sign in.
- No real authorization, session mutation, protected data access, review submission, or permission granting is introduced. Quick actions and write a review are UI only with clear gated feedback/prompts and no persistence or backend side effects.
- No client trusted identity or security by URL is introduced. UI copy must not promise guest checkout completion or conflict with CareU policies (for example tracking remains sign in required where shown in future journeys).
- Mock data and local placeholder assets contain no secrets, credentials, or real personal data. Any future protected or personalized behavior must be implemented later with server side session and permission checks.

**Configuration required**:
- None. No new environment variables, third party credentials, or `images.remotePatterns` entries are required when using local placeholder assets.

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path, view and understand product: a visitor opens `/product/[slug]` from a browse/discovery link and sees breadcrumbs, gallery, key facts (title, brand when available, rating summary, integer BDT price/compare at when present), and clear continuation paths, verifies **AC-1**.
- Happy path, variant and shop context: selecting a variant updates URL and displayed price/availability/variant details within one representative shop context, with shop cues visible and no multi seller comparison, verifies **AC-2**.
- Happy path, details and reviews: description/details/specs render when available and the review section shows summary, 5 to 1 breakdown, published review list, and a gated write a review UI entry; empty reviews show a clear empty state, verifies **AC-3**.
- Happy path, merchandising blocks: Frequently bought together, More from this shop, Recently viewed, and Related products render as distinct prototype safe blocks excluding the current product, and the future experience placeholder is present and clearly labeled, verifies **AC-4**.
- Failure and fallback cases: unknown slug shows not found state; invalid variant falls back safely; missing media uses local fallback with stable layout; unavailable/out of stock selection disables primary purchase action while keeping page useful; empty cross sell/review states do not break layout, verifies **AC-5**.
- Boundary and quality checks: content is bilingual (`en`/`bn`), money is integer BDT, interactions are UI only with no real persistence/submission/auth/payment/stock/backend writes, rendering remains server first with minimal client JavaScript and stable layout, and the page remains structurally crawlable as a public prototype page, verifies **AC-6**.

## Build plan

Build approach: **Facade** (project default, prototype). Lead with a visible, navigable PDP shell on mock data and reusable sections, then add interactive selection and merchandising behavior, and finish with state coverage and resilience so the journey is reviewable end to end before backend wiring.

1. [x] **Add PDP mock contracts, fixtures, and safe extensions**: create `lib/mock/pdp/` (types, fixtures/fallback data, getters, exports) with `ProductDetailPageResult` and supporting contracts; extend existing catalog/trust/identity mocks in a mock safe way for highlights/specifications and deterministic frequently bought together mappings; export from mock barrels, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**.
2. [x] **Implement PDP resolvers and URL safe selection logic**: build deterministic getters for product resolution, breadcrumbs, representative shop context, gallery with fallback, variant resolution and `variant` URL selection/fallback, review summary and published review mapping, and cross sell groups (FBT, more from shop, related, recently viewed fallback data) with fixed limits and safe omission of invalid refs, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**.
3. [x] **Build reusable server first PDP UI sections**: implement breadcrumbs integration and PDP components for gallery, purchase/info panel, variant selector display, availability/price/shop context, description/details/specs, review summary/list with gated write review entry, cross sell/related blocks, and future experience placeholder using existing primitives/state blocks and no new dependency, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**.
4. [x] **Compose the product route and wire interactions**: implement/upgrade `app/[locale]/(storefront)/product/[slug]/page.tsx` with server resolved data, variant URL synchronization, UI only wishlist/cart feedback, recently viewed prototype safe client behavior with fallback, and navigable handoff links to placeholder routes, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**.
5. [x] **Add prototype state coverage and consistency pass**: extend prototype showcase/preview coverage for PDP scenarios and complete responsive, accessibility, bilingual, integer BDT, fallback, and boundary checks (no real backend/auth/review submission/cart persistence/checkout/stock writes), satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**.

## Consequences

**Positive**:
- Reviewers get a complete, clickable product decision journey that connects discovery, evaluation, reviews, and onward actions in a believable prototype.
- A dedicated PDP mock module and composed result make the page easier to reason about, test in preview states, and later replace with real cached catalog, review, and commerce reads.
- Server first rendering, local assets, deterministic mock sourcing, and no new dependency support performance and maintainability goals for the prototype.

**Negative / tradeoffs**:
- The feature adds substantial mock, resolver, and component surface area (variants, reviews, multiple merchandising groups, recently viewed behavior) that will need maintenance as later journeys evolve.
- Deterministic mock mappings for frequently bought together, related items, review authors, and recently viewed fallback are prototype approximations and must be replaced or refined during backend wiring.
- Rich PDP interactions (gallery, variant selection, cross sell blocks, client side recently viewed) increase UI complexity within the no new dependency and minimal client JavaScript constraints.

**Neutral**:
- No database schema, environment variables, or production integrations change in this feature.
- Product, cart, wishlist, and checkout routes may remain placeholders or be completed by later journeys; this feature provides navigable handoff and UI only behavior only.

## Follow-up

- [ ] When building customer cart and wishlist journey (feature 9), replace UI only cart/wishlist feedback and placeholder handoff behavior with the approved prototype or real state behavior as appropriate for that journey.
- [ ] When building customer checkout and order confirmation journey (feature 10), align PDP purchase actions and policy messaging with the approved checkout flow (including sign in required checkout).
- [ ] During backend wiring, replace PDP mock getters with real cached product, offer, inventory, and review reads; define real review submission/moderation, recently viewed tracking, and merchandising signals; and add production metadata, structured data, canonicals, sitemap handling, and breadcrumb structured data where supported by visible content.
- [ ] If gallery or interaction requirements grow beyond lightweight built in patterns, reconsider a focused UI dependency with justification against bundle and maintenance cost.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

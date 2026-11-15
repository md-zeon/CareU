# 0007. Customer browse, search, and brand journey

**Date**: 2026-11-15
**Status**: Accepted

## Summary

This spec defines the customer browse, search, and brand journey for CareU.bd as a Facade prototype on the existing storefront. Visitors will be able to browse category, curated collection, and brand pages, and search the mock catalog, using rich product cards, breadcrumbs, expanded filters, sorting, and URL based pagination. The journey will run on mock data only, with bilingual content, integer BDT pricing, server first rendering where possible, and clear loading, empty, error, and no result states so the experience can be reviewed before backend wiring.

## Requirements

**User stories**:
- As a visitor, I want to browse categories, collections, and brands so that I can discover products in ways that feel natural for a marketplace.
- As a visitor, I want to search and refine results with filters, sorting, and pagination so that I can find relevant products quickly.
- As a visitor, I want clear breadcrumbs, product details at a glance, and helpful empty or error states so that I always understand where I am and what to do next.
- As a reviewer, I want the journey to be clickable, believable, and prototype safe so that I can judge the experience before real data and backend behavior are connected.

**Acceptance criteria** (the contract, each criterion is independently checkable):
- **AC-1** (Category browsing): A visitor can open a category page and browse mock products in a rich grid with breadcrumbs that reflect available parent and child context (Home, then Category, then Subcategory when mock data supports it), expanded filters, sort, and URL based pagination (`?page=`), and can navigate to product, brand, collection, or other relevant prototype destinations.
- **AC-2** (Collection browsing): A visitor can open a curated collection page at `/collection/[slug]` and see a localized title and description (and hero or intro content as defined in mock data) with breadcrumbs (Home, then Collections, then Collection name), a rich product grid, expanded filters, sort, and URL based pagination.
- **AC-3** (Brand browsing): A visitor can open a brand page and browse that brand's mock products with breadcrumbs (Home, then Brand, then Brand name), a rich product grid, expanded filters, sort, and URL based pagination.
- **AC-4** (Search and suggestions): A visitor can search from the header; the search results page uses the `?q=` query to filter mock catalog and listing data on the server and shows breadcrumbs (Home, then Search results for the query), sort, URL based pagination, and clear states for empty query and no results. While typing (after at least 2 characters), lightweight autocomplete shows a small mixed list of matching products, categories, brands, and collections from mock data with direct links plus a “See all results” action to `/search?q=...`.
- **AC-5** (Rich product cards and UI only actions): Result cards show product image, localized title, integer BDT price and compare at price when present, availability or stock state, rating and review count when available, shop or seller context, badges, and brand label. Wishlist and cart quick actions are clickable UI only controls with clear feedback (visual state, icon change, or short message) and no real persistence or backend calls.
- **AC-6** (Filters, sort, and states): Category, collection, and brand grids provide the expanded filter set (category or subcategory context where relevant, brand, price range, availability, shop including CareU and third party shops, rating, badges or offers, and simple attribute style filters only when the current mock result set clearly provides them, for example size, color, or storage from variant options; hidden when unavailable). Sort options include Relevance (search default), Featured (browse default), Price low to high, Price high to low, Newest, Rating, and Best selling as mock driven values. Surfaces handle loading, empty, error, and normal states responsively.
- **AC-7** (Prototype boundaries, i18n, money, SEO and performance): The journey uses mock and placeholder data only with no real database reads or writes, no real auth or permission checks for browsing, no real cart or wishlist persistence, no checkout, no stock reservation, and no backend writes. Links can go to existing or placeholder routes (including product, cart, wishlist, and checkout placeholders) but do not complete those journeys. User facing content is bilingual (`en` and `bn`), prices are integer BDT, rendering is server first where possible with minimal client JavaScript and stable image and layout handling. Search results follow project rules (not treated as indexable canonical content), while public browse pages remain structurally crawlable as prototype pages.

## Decision

**Chosen option**: Option 1: Dedicated browse module with shared URL state, mock resolvers, and reusable server first UI.

Build the journey as a cohesive browse and search feature backed by new mock browse contracts (collections, resolved product cards, facets, sort, suggestions, and composed page results), URL driven query parsing with safe fallbacks, and reusable storefront components for breadcrumbs, filters, sorting, grids, pagination, and states. Implement autocomplete and interactive controls with small client components and no new dependency.

**Implementation skills**: none recorded in project context files for this feature. Follow root `AGENTS.md` rules for Next.js App Router, React Server Components, caching boundaries, next-intl, integer BDT money, SEO rules for public and search surfaces, and prototype boundaries. Follow `lib/money/AGENTS.md` when formatting or handling BDT values.

## Feature design

**Data model sketch**:

The data model for this feature is UI oriented mock data only (no Prisma schema change). User facing mock text uses `LocalizedText` (`{ en, bn }`) where shown, money is integer BDT, and image paths are local placeholders.

| Entity | Key fields | Primary key | Relationships / cardinality |
|---|---|---|---|
| `MockCollection` (new) | `id`, `slug`, `title` (LocalizedText), `description` (LocalizedText), `eyebrow?` (LocalizedText), `badge?` (LocalizedText), `image?`, `imageAlt?` (LocalizedText), `productIds` (string[], explicit ordered refs), `highlightCategoryIds?` (string[]), `highlightBrandIds?` (string[]), `visible` (boolean), `sortOrder` (number) | `id` (`slug` unique) | 1 collection references 0..N existing `MockProduct` by `productIds`; may highlight 0..N `MockCategory` and 0..N `MockBrand` for display. Used by `/collection/[slug]` and autocomplete. |
| `ResolvedProductCard` (new contract) | `productId`, `slug`, `href`, `image`, `imageAlt?` (LocalizedText), `title` (LocalizedText), `brandId?`, `brandLabel?` (LocalizedText), `priceBdt` (integer), `compareAtPriceBdt?` (integer), `availability` (`in_stock` \| `low_stock` \| `out_of_stock`), `availabilityLabel?` (LocalizedText), `rating?` (number), `reviewCount?` (number), `shopId`, `shopLabel` (LocalizedText), `badges` (LocalizedText[] or typed badge items), `variantId?`, `listingId?`, `isNew?`, `isBestSeller?`, `featuredRank?` (mock driven support fields as needed) | `productId` (representative card key in grid) | 1 card resolves 1 `MockProduct` plus 1 representative `MockProductVariant` or listing context, 1 shop context, and 0..1 `MockBrand`. One representative active and visible offer per product in grids. |
| `SearchSuggestion` (new contract) | `kind` (`product` \| `category` \| `brand` \| `collection`), `id`, `label` (LocalizedText), `secondaryLabel?` (LocalizedText), `image?` or icon hint, `href` | composite (`kind`, `id`) | Links to existing mock entity routes only (product, category, brand, collection). |
| `BrowseQueryState` (URL state contract) | `q?`, `page` (default 1), `sort`, `category?`, `brand?` (multi), `shop?` (multi), `availability?` (multi), `minPrice?`, `maxPrice?` (integer BDT), `rating?`, `badges?` (multi), `attributes?` (keyed multi values, only when supported) | n/a (derived from URL) | URL is the source of truth for shareable browse and search state; parsed and normalized with safe defaults. |
| `FacetDefinition` / `FacetOption` (new contracts) | Definition: `key`, `label` (LocalizedText), `kind` (`single` \| `multi` \| `range` \| `toggle`), `options?`, `visible`. Option: `value`, `label` (LocalizedText), `count?` (mock supported), selected derived from URL | `key`, option `value` | Facets defined per surface/result context; attribute facets generated only when resolved result set provides them. |
| `SortOption` (new contract) | `key`, `label` (LocalizedText), `appliesTo` (`search` \| `browse` \| `both`), `isDefault?` or default mapping | `key` | Includes relevance, featured, price low to high, price high to low, newest, rating, best selling. |
| `BrowsePageResult` (composed result) | `items` (`ResolvedProductCard[]`), `totalCount`, `page`, `pageCount`, `pageSize` (12), `facets`, `activeSort`, `appliedFilters`, `breadcrumbs`, `title`/context, scenario/state metadata | n/a | Returned by server side mock getters for category, collection, brand, and search surfaces. |
| Existing mocks reused | `MockCategory`, `MockBrand`, `MockProduct`, `MockProductVariant`, `MockListing`, `MockShop`, menu/category data | existing ids/slugs | Resolved into cards, breadcrumbs, facets, suggestions, and page context. Existing mock product/browse support fields may be extended in a mock safe way to source Featured, Newest, and Best selling deterministically (D6A). |

**State transitions** (if applicable):

No persistent business state machine. View and data loading behavior is scenario driven for prototype review (`default`, `loading`, `empty`, `error`, and `success` where used by shared helpers). Quick action UI state (wishlist/cart feedback) is local client UI state only with no persistence.

**API surface**:

No new backend API endpoints or server actions are added. The interface surface is route, mock module, and component contracts.

| Surface | Kind | Key inputs | Key outputs | Access / use | Key errors or states |
|---|---|---|---|---|---|
| `app/[locale]/(storefront)/category/[slug]/page.tsx` | Next.js Server Component route (upgrade) | `locale`, `slug`, URL search params (`page`, `sort`, filter params) | category page with breadcrumbs, filter UI, sort, rich grid, pagination, or not found/empty/error states | Public, no sign in | unknown slug -> not found style prototype state; no matching results after filters -> empty results with reset; invalid params -> safe defaults |
| `app/[locale]/(storefront)/collection/[slug]/page.tsx` | Next.js Server Component route (new) | `locale`, `slug`, URL search params | collection hero/intro, breadcrumbs, filter UI, sort, rich grid, pagination, or states | Public, no sign in | unknown slug -> not found style state; empty/no matches -> empty state; invalid params -> safe defaults |
| `app/[locale]/(storefront)/brand/[slug]/page.tsx` | Next.js Server Component route (upgrade) | `locale`, `slug`, URL search params | brand page with breadcrumbs, filter UI, sort, rich grid, pagination, or states | Public, no sign in | unknown slug -> not found style state; no matches -> empty state; invalid params -> safe defaults |
| `app/[locale]/(storefront)/search/page.tsx` | Next.js Server Component route (upgrade) | `locale`, `q`, `page`, `sort`, optional simpler query params as applicable | search prompt state, results with breadcrumbs/sort/pagination, or no results/error states | Public, no sign in; search results not indexable canonical content | missing/blank `q` -> empty query prompt; no matches -> no results state; invalid params -> safe defaults |
| Header search autocomplete (existing storefront header/search UI, client enhancement) | Client component(s), no new dependency | typed query text, focus/keyboard events, mock suggestion getter | mixed suggestion list (products, categories, brands, collections) after >= 2 chars, direct links, “See all results” to `/search?q=...` | Public UI | no matches -> clear no suggestions state or graceful close; blur/escape/navigation closes; limited to small set (up to 8) |
| `lib/mock/browse/*` and `lib/mock/catalog` extensions | TypeScript mock modules/getters | slugs, `BrowseQueryState`, scenario options | `BrowsePageResult`, suggestions, resolved cards, facets, breadcrumbs, collections | Server components and client autocomplete as appropriate | unknown refs omitted safely; invalid state normalized; deterministic sort and pagination |
| Shared browse components (breadcrumbs, filter panel/drawer + chips, sort, product grid/card, pagination, state blocks) | React components (server first, client only where interaction needed) | typed results, labels, URL state/actions, callbacks for UI only quick actions | responsive browse UI | Public | missing optional data handled safely; stable layout; no backend side effects |

**Value sourcing** (every value each action produces, computes, or displays names where it comes from; a required value with no named source is an undecided input, resolve it before this spec is done, do not leave the build to invent it):

| Action | Value produced / displayed | Source |
|---|---|---|
| Resolve page context (category/collection/brand) | Page title, description/intro, hero image, slug validity | Route `slug` param resolved against `mockCategories`, `MockCollection` fixtures, or `mockBrands`; localized fields from matched mock entity; not found when no match |
| Build breadcrumbs | Breadcrumb labels and hrefs for category, collection, brand, search | Fixed Home route + surface rules (8A); category parent chain from `MockCategory.parentId`/mock helpers when available; collection label from `MockCollection`; brand label from `MockBrand`; search crumb from localized UI label plus current `q` value |
| Parse and normalize browse state | `q`, `page`, `sort`, active filters, attribute selections | URL search params parsed into `BrowseQueryState`; defaults applied (search `relevance`, browse `featured`, `page=1`, page size 12); unknown/invalid values fall back safely |
| Resolve representative product cards | Card image, alt, title, href, brand label, priceBdt, compareAtPriceBdt, availability/state label, rating, reviewCount, shop label, badges, support fields | `MockProduct` + representative `MockProductVariant`/`MockListing` + `MockShop` + `MockBrand` resolved by mock browse getters; product `href` uses prototype route `/product/[slug]`; money values integer BDT formatted with existing money helpers |
| Determine card eligibility | Whether a product appears in results | Representative offer must be resolvable as active and visible (approved/visible listing context) for a shop that is not suspended (D7A); otherwise omit; deterministic stable choice when multiple valid representatives exist |
| Apply filters | Filtered item set and active facet state | `BrowseQueryState` filters applied over resolved cards/result set: category/subcategory context, brand, shop, availability, price range (`minPrice`/`maxPrice` integer BDT), rating threshold, badges/offers, and attribute matches from variant options when provided |
| Build filter facets and options | Facet labels, kinds, options, counts, visibility (including attribute facets) | Typed facet definitions plus derivation from current resolved/mock result context; attribute facets generated only when result set clearly provides values (for example size/color/storage from variant options), hidden otherwise; counts mock supported/derived from result set |
| Sort results | Ordered item list for selected sort key | `relevance` (search): simple text match heuristic over localized title, brand, category, and collection names; `featured`: curated/priority order for surface context (collection `productIds` order or explicit mock featured rank) with stable fallback; `price-asc`/`price-desc`: `priceBdt`; `newest` and `best-selling`: explicit deterministic mock fields/ranks added as needed (D6A); `rating`: `rating` then `reviewCount` |
| Paginate results | `totalCount`, `pageCount`, current page slice | Filtered and sorted list length divided by fixed `pageSize` 12 (D5A); `page` from URL normalized to >= 1 with safe fallback; out of range handled consistently (clear empty state or clamped to last valid page, implemented consistently and documented in code/spec behavior) |
| Render result cards | All AC-5 visible values and quick action controls | `ResolvedProductCard` fields for display; quick action click feedback from local client UI state only (pressed/selected visual state, icon change, or short message), no persistence/backend |
| Search by query | Matching result set for `/search?q=` | Server side mock getter filters mock catalog/listing/collection/brand context by normalized `q` against localized searchable fields; missing/blank `q` produces empty query prompt state (D3A), non matching `q` produces no results state |
| Autocomplete suggestions | Mixed suggestion items and “See all results” target | Client requested query (>= 2 chars) matched against mock products, categories, brands, collections via mock suggestion getter; limited to up to 8 mixed items; each item provides kind, label, secondary label/image hint as available, and `href`; “See all results” links to `/search?q=<encoded query>` |
| Render states | Loading, empty, error, success/normal, no suggestions | Scenario helpers/shared state primitives and route/component logic: loading/empty/error scenarios for prototype review, plus runtime empty query, no results, no suggestions, not found, and filter empty states |
| Locale and UI copy | Localized text, labels, messages, RTL/LTR safe layout assumptions already in app | Active locale from Next.js route/root params and `next-intl`; LocalizedText values provide `en` and `bn`; UI chrome/messages from message catalogs |
| Navigation targets | All href destinations used by pages, breadcrumbs, cards, facets reset links, suggestions | Existing routes and prototype routes: `/category/[slug]`, `/brand/[slug]`, `/collection/[slug]` (new), `/search`, `/product/[slug]`, `/cart`, `/wishlist`, `/account` and other existing placeholders where linked; all targets must be navigable |

**Key invariants**:
- Prototype only: no Prisma/database reads or writes, no real auth or permission checks, no real cart/wishlist persistence, no checkout, no stock reservation, no payment, and no backend mutations.
- URL is the shareable source of truth for browse/search state (`q`, `page`, `sort`, filters); parsing must be tolerant with safe defaults/fallbacks.
- Page size is 12 items per page (D5A). Unknown or invalid params do not crash pages.
- A result card is shown only when a representative active and visible offer can be resolved for a non suspended shop context (D7A); missing refs are omitted safely.
- Attribute filters are shown only when the current resolved mock result set clearly provides them (D10A) and are hidden otherwise.
- All user facing mock content that is translatable uses LocalizedText (`en`, `bn`) where shown; UI chrome uses `next-intl`. No hardcoded user facing strings.
- All displayed money values are integer BDT and formatted with project money helpers; no float or `Decimal` money.
- Rendering is server first by default with minimal client JavaScript; client components are used only for interaction (autocomplete, filter controls/drawer, quick action feedback) and no new dependency is added (C1A).
- Images use local placeholder assets with meaningful alt text and stable dimensions/sizing to avoid layout shift.
- Search results are not treated as indexable canonical content; public browse pages remain structurally crawlable as prototype pages. UI visibility is not a security boundary.

**Security model**:
- Category, collection, brand, search, and autocomplete surfaces are public and require no sign in.
- No real authorization, session mutation, protected data access, or permission granting is introduced. Quick actions are UI only and do not create real user owned cart/wishlist records.
- Mock data and local placeholder assets contain no secrets, credentials, or real personal data.
- Future protected or personalized behavior must use server side session and permission checks during backend wiring; this feature must not introduce client trusted identity or security by URL.

**Configuration required**:
- None. No new environment variables, third party credentials, or `images.remotePatterns` entries are required when using local placeholder assets.

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path, category browse: a visitor opens a category page, sees breadcrumbs with available parent/child context, a rich product grid, expanded filters, sort, and URL pagination, and can navigate to relevant prototype destinations, verifies **AC-1**.
- Happy path, collection browse: a visitor opens `/collection/[slug]`, sees localized collection intro content, breadcrumbs, a rich grid, filters, sort, and URL pagination, verifies **AC-2**.
- Happy path, brand browse: a visitor opens a brand page, sees brand breadcrumbs and a rich filtered/sorted/paginated grid of that brand's mock products, verifies **AC-3**.
- Happy path, search and autocomplete: typing at least 2 characters shows mixed mock suggestions with direct links and “See all results”; submitting a query shows server filtered results with breadcrumbs, sort, pagination, and correct empty query/no results states, verifies **AC-4**.
- UI behavior, rich cards and quick actions: cards show required content (image, localized title, integer BDT price/compare at when present, availability, rating/review when available, shop/seller context, badges, brand label) and wishlist/cart quick actions give clear UI feedback with no persistence or backend calls, verifies **AC-5**.
- Filters, sort, and states: expanded facets (including rating, badges/offers, and attribute filters only when supported by current results) and sort options work through URL state; surfaces render responsive loading, empty, error, and normal states; attribute filters hide when unavailable, verifies **AC-6**.
- Boundary, i18n, money, SEO/performance: pages use mock data only with no real backend/auth/payment/stock/cart writes, content is bilingual with integer BDT prices, rendering remains server first with minimal client JavaScript and stable layout, and search results are not treated as indexable canonical content while public browse pages remain structurally crawlable, verifies **AC-7**.
- Failure/edge cases: unknown slugs show not found style prototype states, invalid params fall back safely, out of range pages are handled consistently, and no suggestions/no matching results states are clear and navigable, verifies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-6**.

## Build plan

Build approach: **Facade** (project default, prototype). Lead with a visible, navigable browse shell on mock data (shared contracts, resolvers, and route surfaces), then add interactive controls, suggestions, and full state coverage so the journey is reviewable end to end before backend wiring.

1. [x] **Add browse and collection mock contracts, fixtures, and deterministic support data**: create or extend `lib/mock` with `MockCollection` fixtures, browse/query/facet/sort/suggestion/result types, and any explicit deterministic mock fields/ranks needed for Featured, Newest, and Best selling; export from mock barrels, satisfies **AC-2**, **AC-4**, **AC-5**, **AC-6**, **AC-7**.
2. [x] **Implement shared browse query parsing and resolver/getter logic**: add URL state parsing with safe defaults/fallbacks, representative card resolution (D7A), filtering (including supported attribute facets), sorting (D6A), pagination (page size 12), breadcrumbs, and composed page results for category, collection, brand, and search surfaces, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**.
3. [x] **Build reusable browse UI primitives and states**: implement server first breadcrumbs, filter panel/drawer with active chips, sort control, rich product card/grid, pagination, and loading/empty/error/no results/not found UI blocks using existing design primitives and no new dependency, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**.
4. [x] **Upgrade category, brand, and search routes and add the collection route**: compose `/category/[slug]`, `/brand/[slug]`, `/search`, and new `/collection/[slug]` pages with URL driven state, correct states (unknown slug, empty query, no results, no matches), bilingual content, integer BDT display, and crawlability/noindex handling as appropriate, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-6**, **AC-7**.
5. [x] **Add header autocomplete and UI only quick actions**: implement lightweight mixed search suggestions (>= 2 chars, up to 8 items, direct links plus “See all results”) and clickable wishlist/cart quick action feedback with local client state only, satisfies **AC-4**, **AC-5**, **AC-7**.
6. [x] **Add prototype state coverage and consistency pass**: extend prototype showcase/preview coverage for browse surfaces and scenarios, verify responsive behavior, stable layout, safe fallbacks, accessible controls, and prototype boundaries (no backend/auth/payment/stock/cart persistence), satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**.

## Consequences

**Positive**:
- Visitors and reviewers get a complete, clickable discovery journey across category, collection, brand, and search surfaces with believable marketplace context.
- Shared URL state, typed mock contracts, and reusable browse components reduce duplication and make later backend wiring and journey deepening easier.
- Server first rendering, local assets, deterministic mock logic, and no new dependency support performance and maintainability goals for the prototype.

**Negative / tradeoffs**:
- The feature adds significant mock, resolver, and UI surface area (routes, components, query parsing, facets, suggestions) that will need maintenance as later journeys evolve.
- Deterministic mock fields and heuristics for Featured, Newest, Best selling, and Relevance are prototype approximations and will need to be replaced by real catalog/search signals during wiring.
- Expanded filters and responsive filter UI increase interaction complexity, especially for attribute facets and URL synchronization, within the no new dependency constraint.

**Neutral**:
- No database schema, environment variables, or production integrations change in this feature.
- Existing placeholder category, brand, and search routes will be replaced by fuller prototype implementations, while product, cart, wishlist, and checkout remain placeholders or separate journeys.

## Follow-up

- [ ] When building customer product and review journey (feature 8), align product card links, product context, and any shared browse components with the full product detail experience.
- [ ] When building customer cart and wishlist journey (feature 9), replace UI only quick actions with the approved prototype or real state behavior as appropriate for that journey.
- [ ] During backend wiring, replace mock browse getters with real cached catalog/search reads, define real relevance/ranking signals, and add production metadata, canonicals, structured data, and sitemap handling for public browse pages while keeping search results non indexable as required.
- [ ] If search suggestions need richer accessibility or interaction behavior later, reconsider a focused UI dependency with justification against bundle and maintenance cost.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
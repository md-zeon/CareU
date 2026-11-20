# 0008. Customer product and review journey, rationale

## Context

CareU.bd is building customer journeys as a Facade prototype: the UI should look and feel real on mock and placeholder data before backend wiring. Feature 8 in the scope covers the customer product and review journey. Visitors reach product pages from the home, browse, search, brand, and collection journeys already built, but the product route is still effectively a placeholder destination and needs a complete, reviewable detail experience.

The page must help a visitor decide and continue: understand the product, choose a variant, see price and availability in integer BDT, understand the representative shop context in a multi vendor marketplace, read description and reviews, discover complementary items, and move toward cart, wishlist, or checkout flows. At the same time, the project has firm prototype boundaries: no real database reads or writes, no real auth or permission enforcement for browsing, no real review submission, no real cart or wishlist persistence, no checkout, no stock reservation, and no backend writes. Content must be bilingual (`en` and `bn`), prices must be integer BDT, and public product pages must remain structurally crawlable as prototype pages.

The design also needs to fit the existing stack and patterns: Next.js 16 App Router with server first rendering, React 19, Tailwind v4, Base UI and shadcn primitives, next-intl, the mock data layer in `lib/mock`, local placeholder assets, and no unnecessary new dependencies.

## Options considered

### Option 1: Dedicated PDP mock module and composed page result with reusable server first sections

Create a dedicated PDP mock layer (for example `lib/mock/pdp/`) that returns a composed `ProductDetailPageResult` and supporting contracts for gallery, variants, shop context, details/specs, reviews, cross sell groups, and future placeholder content. Resolve data deterministically from existing catalog, shop, trust, and identity mocks with small mock safe extensions. Build reusable server first PDP sections and keep client components limited to interactions that need them (gallery controls, variant selection and URL sync, UI only quick actions, and recently viewed state with fallback).

**Pros**:
- Keeps route and component logic clear by centralizing PDP resolution and typed contracts.
- Matches patterns already used in browse and home journeys, making the prototype easier to extend and later wire to real data.
- Supports server first rendering, deterministic states, and minimal client JavaScript.

**Cons**:
- Adds new mock modules, types, and components that must be maintained as the prototype evolves.
- Requires careful resolver rules (representative offer, variant fallback, cross sell sourcing, review mapping) to keep behavior believable and consistent.

### Option 2: Extend browse/catalog mocks and assemble the page mostly in route/components

Reuse and extend existing `lib/mock/catalog`, `lib/mock/trust`, and browse style components, and assemble PDP data directly in the product route and UI components without a dedicated composed PDP result.

**Pros**:
- Fewer new files and a smaller initial abstraction.
- Can reuse existing card and mock patterns quickly.

**Cons**:
- Risks a large, hard to follow route/component with scattered data shaping logic.
- Makes it harder to keep variant selection, reviews, cross sell groups, and state handling consistent and testable in preview scenarios.

### Option 3: Build a client heavy interactive PDP shell

Render most of the PDP as client components with local mock lookups and client managed state for variants, gallery, reviews, and merchandising blocks.

**Pros**:
- Can make some interactions straightforward to prototype quickly.
- Keeps most behavior in one interactive UI layer.

**Cons**:
- Conflicts with the project preference for server first rendering and minimal client JavaScript.
- Increases hydration cost and makes later replacement with server resolved, cached data more work.

## Rationale

Option 1 is the best fit for this feature and project stage. The product page is one of the richest customer surfaces so far: it combines gallery and variant behavior, representative shop context, structured details, review presentation, several merchandising groups, and multiple prototype states. A composed PDP result and dedicated mock module give that complexity a clear home, similar to how browse and home journeys use composed mock contracts.

The chosen direction also respects confirmed constraints. It keeps the experience public and crawlable in structure, uses mock and local placeholder data only, avoids real auth and backend side effects, and models UI only actions and gated review entry explicitly. Variant selection is URL driven with safe fallback so the page remains shareable and resilient. Cross sell and recently viewed behavior stay prototype safe through deterministic sourcing and lightweight client state only where useful.

Option 2 would likely work for a simpler page, but this journey has enough moving parts that ad hoc assembly would create avoidable maintenance and consistency risk. Option 3 would trade away server first rendering and future wiring clarity for short term convenience. Option 1 gives a believable, reviewable PDP now while keeping the path to real data, review, and commerce wiring straightforward later.

# 0007. Customer browse, search, and brand journey: Rationale

## Context

CareU.bd is in a Facade phase where customer journeys are built as clickable, believable prototype flows on mock and placeholder data before backend wiring. Scope feature 7 requires category, collection, search, and brand browsing with filters, sorting, pagination or load more, breadcrumbs, and clear empty and no result states on mock catalog data. Existing surfaces are placeholders (`/search`, `/category/[slug]`, `/brand/[slug]`) and feature 6 already links the home page into them.

The current stack and project rules strongly shape the decision: Next.js App Router with React Server Components, next-intl for `en` and `bn`, Tailwind v4 with Base UI/shadcn patterns, integer BDT money, local placeholder assets, and strict prototype boundaries (no real database reads or writes, no real auth enforcement, no payments, no stock reservation). Public browse pages should remain structurally crawlable as prototype pages, while search results must not be treated as indexable canonical content. The solution must also fit a multi vendor marketplace context by showing shop or seller context and supporting CareU alongside third party shops in mock data.

The main forces are: keep the experience reviewable and complete across four browsing surfaces, make filters/sort/pagination shareable and deterministic in a server first prototype, avoid new dependencies and unnecessary client JavaScript, and define clear data/value sources so the build does not invent behavior for collections, suggestions, sorting, or representative marketplace offers.

## Options considered

### Option 1: Dedicated browse module with shared URL state, mock resolvers, and reusable server first UI (chosen)

Create a dedicated browse layer in mock and UI code: typed collection fixtures and browse contracts, shared URL query parsing and normalization, server side mock getters/resolvers that compose page results (items, facets, breadcrumbs, pagination), and reusable components for browse controls and states. Category, collection, brand, and search routes compose this shared layer, with small client components only for autocomplete and interactive controls.

**Pros**:
- Keeps behavior consistent across category, collection, brand, and search surfaces while still allowing surface specific rules (for example search relevance, empty query prompt, and simpler search filtering).
- Makes shareable URL state, deterministic mock results, and value sourcing explicit, which reduces guesswork during build and later backend wiring.
- Fits project rules well: server first rendering, no new dependency, typed contracts, and reusable UI primitives.

**Cons**:
- Requires more upfront design and implementation work (query parsing, facet derivation, resolvers, and shared components) than ad hoc page logic.
- Introduces more files and abstractions that must be kept in sync as prototype data and journeys evolve.

### Option 2: Route by route implementation with minimal shared helpers

Upgrade each route independently (category, collection, brand, search), each with its own query handling, filtering, sorting, and UI composition, sharing only a few low level mock helpers.

**Pros**:
- Faster to start for a single page because each route can be tailored directly.
- Fewer shared abstractions to understand at first.

**Cons**:
- High risk of inconsistent behavior for breadcrumbs, pagination, filters, sort semantics, empty states, and card rendering across four related surfaces.
- Duplicated logic makes later fixes and backend wiring harder and increases the chance that one surface drifts from the agreed requirements.

### Option 3: Client heavy interactive browse experience over loaded mock data

Load a broad mock dataset into client components and handle most filtering, sorting, pagination, and suggestions in the browser for a highly interactive feel.

**Pros**:
- Can make some interactions feel immediate once data is loaded in the client.
- Reduces the need to think about URL driven server composition for every state change.

**Cons**:
- Conflicts with project preferences for server first rendering, minimal client JavaScript, and shareable URL state.
- Makes SEO/crawlability, deep linking, and consistent server/client behavior harder, and would push more complexity into client code than this prototype needs.

## Rationale

Option 1 is the best fit for the confirmed requirements and constraints. The feature is not a single page; it is four related browsing surfaces that must behave consistently (breadcrumbs, rich cards, expanded filters, sorting, URL pagination, and states) while also handling surface specific cases like collection intro content, brand scoped results, empty search queries, and mixed autocomplete suggestions. A shared browse module gives one place to define URL state, eligibility rules for representative offers, facet generation, deterministic sorts, and value sources, which is especially important because the mock data does not naturally provide every signal (for example Newest and Best selling need explicit deterministic support).

The engineer confirmed choices that favor explicit, reviewable state: URL based pagination and shareable filter/sort state (B6A, D5A), a responsive filter panel with active chips (C2A), server filtered search results with lightweight autocomplete (D3A, D4A), and no new dependency (C1A). Option 1 supports these choices without pushing the feature toward client heavy architecture. It also preserves CareU marketplace context in a controlled way by resolving one representative active and visible offer per product for a non suspended shop (D7A), which is more believable than showing arbitrary or duplicate product entries.

Option 2 would be acceptable only for a much smaller surface, but here it would likely create drift and rework across category, collection, brand, and search implementations. Option 3 would optimize for interaction patterns that are not required by the prototype and would work against the project’s server first and performance guidance. The chosen option accepts more upfront structure as the tradeoff for consistency, traceability, and a cleaner path to future backend wiring.
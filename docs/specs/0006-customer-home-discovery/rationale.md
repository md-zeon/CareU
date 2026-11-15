# 0006. Customer home and discovery journey (rationale)

## Context

CareU.bd already has a working storefront shell, locale routing for English and Bangla, shared header and footer patterns, and prototype foundations from features 4 and 5. The home route at `app/[locale]/(storefront)/page.tsx` is still a placeholder with empty sections, so visitors cannot yet experience a believable discovery journey. Scope feature 6 asks for a home and discovery experience that helps people understand CareU, explore featured content, and move into browse flows while the project remains in the Facade phase.

The main forces are consistency, clarity, and speed of review. The home page must feel real enough to evaluate, but it must not introduce real backend reads or writes, real authentication or permission enforcement, payments, or stock reservation. It must fit the current stack and conventions, reuse the mock data and UI foundations already built, and present CareU as a Bangladesh first, bilingual marketplace with both CareU and third party seller context where relevant.

Performance is also a core force for this feature. The home page is a public entry point, so it must render quickly, stay responsive on mobile and desktop, avoid unnecessary client JavaScript, and prevent layout shift. The design must remain easy to extend when later journeys and real data wiring replace prototype placeholders.

## Options considered

### Option 1: Dedicated home discovery module with reusable section blocks

Add a dedicated home discovery mock module and build the page from reusable home section components composed from existing layout, state, and catalog/shop primitives. Use CSS first layouts and local placeholder assets.

**Pros**:
- Creates a clear, typed content model for home sections while reusing existing catalog, brand, and product mocks.
- Keeps the page easy to review, extend, and later wire to real data because sections and getters have stable boundaries.
- Supports performance and consistency by favoring server rendering, reusable primitives, and minimal client JavaScript.

**Cons**:
- Requires upfront structure (new mock module, types, getters, and several section components) before the page is complete.
- Adds prototype specific types that will need mapping when real home/content data is introduced later.

### Option 2: Page level composition over existing mocks with minimal new structure

Build most of the home page directly in the route and components, pulling from existing mock modules and adding only small inline data where needed.

**Pros**:
- Faster to start because it needs fewer new files and abstractions.
- Keeps early experimentation flexible while the design is still evolving.

**Cons**:
- Makes section data harder to reuse, test, and demonstrate across scenario states.
- Increases the risk of inconsistent content shapes and duplicated logic as more discovery surfaces are added.

### Option 3: Rich interactive home with heavier UI behavior

Implement the same sections but rely on more interactive client components (for example richer carousel behavior and animation patterns) to mimic reference sites closely.

**Pros**:
- Can feel visually dynamic and closer to polished marketing pages.
- May offer more interaction patterns in a single pass.

**Cons**:
- Adds client JavaScript, hydration cost, and performance risk, which conflicts with the stated performance goal.
- Increases implementation complexity for a prototype that still needs to stay easy to change and later wire to real data.

## Rationale

Option 1 best fits the forces in Context. The home page needs to be believable and reviewable now, but it also needs a clean handoff to later journeys and backend wiring. A dedicated home discovery module gives this feature a clear content contract for hero, trust, campaign, editorial, and closing link data while still composing featured categories, products, and brands from existing mock sources. That avoids duplicating domain data and keeps the prototype aligned with the foundation built in feature 4.

The choice also supports the performance goal. A server first page with reusable section blocks, local placeholder assets, CSS first layout behavior, and minimal client JavaScript is the simplest way to deliver a fast, stable experience on the current stack. Option 2 would reduce structure but make state handling and reuse weaker, and Option 3 would add interaction weight that is not necessary to prove the discovery journey in this phase.

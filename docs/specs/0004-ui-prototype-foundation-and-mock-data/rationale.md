# 0004. UI prototype foundation and mock data (rationale)

## Context

CareU.bd is moving through a Facade phase where the product should look and feel real before real backend wiring resumes. Scope feature 4 asks for the shared UI building blocks that later prototype journeys can reuse: design direction, layout primitives, reusable page states, and a simple mock data layer so screens can render convincingly without real database reads or writes.

Today the project has a working Next.js 16 storefront shell, locale routing for English and Bangla, theme and font setup, a static catalog menu facade in `lib/catalog/menu.ts`, and several placeholder routes. That is enough to navigate, but not enough to give later customer, seller, and admin journeys a consistent base. If each journey invents its own mock records, loading and error views, and layout patterns, the prototype will drift quickly and become harder to review and later wire to real data.

The main forces shaping this decision are consistency, speed of building the next prototype journeys, and clear separation from production behavior. The foundation must stay believable and reusable while respecting project rules: no real database reads or writes, no real auth enforcement, integer BDT money, bilingual user visible content where shown, and user facing UI text through next-intl.

## Options considered

### Option 1: Shared typed foundation in code with a dedicated mock layer

Create a dedicated `lib/mock/` area with typed TypeScript fixtures and scenario helpers, add reusable layout and state primitives in code, capture design direction as practical tokens and component patterns, and refactor shared shell/menu placeholders to use the new foundation. Add a small internal showcase to demonstrate the primitives and states.

**Pros**:
- Gives journeys 5 onward one consistent source for data shapes, states, and layout building blocks.
- Keeps prototype concerns explicit and easy to replace or evolve during later backend wiring.
- Supports believable rendering across storefront, seller, and admin flows without real services.

**Cons**:
- Requires upfront design and refactoring work before individual journey screens are polished.
- A broad mock domain set can become maintenance overhead if fixture shapes are not kept representative and disciplined.

### Option 2: Minimal mock data only, defer shared primitives

Add only a mock data module now and let each journey build its own layout and state components.

**Pros**:
- Smaller initial implementation.
- Lets each journey tailor UI patterns to its needs.

**Cons**:
- High risk of duplicated components, inconsistent empty/error/loading behavior, and conflicting mock shapes.
- Makes later refactoring and backend wiring harder because patterns are scattered.

### Option 3: Parallel prototype system without touching existing placeholders

Build `lib/mock/` and new primitives separately while leaving `lib/catalog/menu.ts`, current shell pieces, and placeholder routes mostly unchanged.

**Pros**:
- Low immediate churn and lower risk of breaking current navigation.
- Easy to experiment in isolation.

**Cons**:
- Creates two sources of truth for prototype data and UI patterns.
- Shared surfaces like the menu can drift from the new foundation, reducing confidence that journeys are building on the real base.

## Rationale

Option 1 fits the Facade approach and the scope of feature 4. The project needs a foundation that later customer, seller, and admin journeys can reuse immediately, so the work cannot stop at data alone or at visual tokens alone. A dedicated `lib/mock/` area makes prototype data easy to find and keeps it separate from future real domain modules. Typed, UI oriented fixtures inspired by domain concepts provide enough structure to render marketplace aware screens while avoiding premature coupling to Prisma models and database details.

Refactoring the shared shell and menu onto the new foundation, while keeping routes navigable, is the right balance for an aggressive but bounded replacement. It removes the most visible duplicate source of prototype catalog data and proves the primitives in real shared surfaces without absorbing all later journey page work into this feature. The internal showcase gives one place to review loading, empty, error, success, and form feedback states, which is important because later journeys will rely on them.

The main tradeoff is breadth: seeding representative fixtures for all phase groups now is more work than a storefront only set. That tradeoff is acceptable here because the user chose full marketplace coverage, and representative (not exhaustive) depth keeps the foundation useful without turning it into a production data model.

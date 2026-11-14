# 0005. Prototype access and journey switcher (rationale)

## Context

CareU is in a Facade (user interface first) phase where customer, seller, and platform journeys are being built as believable prototype flows on mock data before real backend wiring. Feature 4 already added shared mock foundations, layout primitives, and state components, but there is no easy way yet to move between guest, signed in, seller, and platform views or to review sign in required screens without real authentication.

The main forces are speed of review, policy clarity, and safety. Reviewers need one consistent way to enter every journey type, including journeys that are planned but not fully built. At the same time, the prototype must not blur the line between mock access and real access: sign in required flows must still be visible for guests, and nothing in this feature may replace server side session or permission checks. The solution also needs to fit the existing Next.js 16 app, locale routing, next-intl (internationalization) messages, and the mock persona data already introduced in `lib/mock`.

## Options considered

### Option 1: Floating panel with persisted browser session and shared UI context

Add a small floating trigger and panel mounted in the root locale layout, backed by a client side React context/provider. Store the active persona and panel state in browser storage, define personas and journey shortcuts as typed static config, and provide a shared helper so pages can render sign in required gates for guest mock flows.

**Pros**:
- Easy to reach from any prototype route, including future seller and admin areas, without changing normal navigation.
- Shared provider and helper keep persona behavior consistent across journeys and fit the existing stack with no new dependency.
- Browser persistence makes multi page review smooth while staying fully client side and prototype only.

**Cons**:
- Adds always visible prototype chrome and a bit of client side code to the locale shell.
- Static shortcut config needs upkeep as routes change.
- Route level adoption of the gate helper is still needed, so coverage depends on journeys using it consistently.

### Option 2: Top development bar with in memory state

Show a slim bar near the top of the layout with persona controls and reset the selected persona on refresh.

**Pros**:
- Very visible and simple to understand.
- Avoids browser storage handling.

**Cons**:
- Competes with the real header and layout space, especially on mobile and across many routes.
- Losing state on refresh makes longer review flows frustrating.
- Still needs a shared way for pages to read the active persona.

### Option 3: URL parameter or route based persona switching

Encode the active persona in the URL so each view is shareable and explicit.

**Pros**:
- Persona state can be visible in the address bar and easier to share as a link.
- No browser storage is required.

**Cons**:
- Adds noise to URLs and touches navigation and caching behavior in ways that are unnecessary for a prototype only review tool.
- Harder to keep panel state and grouped shortcuts feeling simple.
- More moving parts than needed for the current Facade goal.

## Rationale

Option 1 best fits the forces in Context. The prototype needs a review tool that works everywhere, keeps guest and signed in mock flows easy to compare, and stays clearly separate from real authentication. A floating panel mounted at the root locale layout is available across customer, seller, and platform routes without reshaping the real header, and a shared React context gives pages one consistent source for the active mock persona so sign in required gates can behave the same way.

Persisting the persona and panel state in browser storage supports longer multi page reviews, while a safe fallback to guest protects the experience when stored data is missing or invalid. Typed static config for personas and shortcuts keeps the journey map explicit and easy to maintain during the Facade phase, and it avoids adding route discovery, backend reads, or new dependencies. Compared with a top bar, this option keeps layout impact lower; compared with URL parameters, it keeps implementation and navigation simpler for a prototype only need.

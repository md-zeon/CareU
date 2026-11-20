# 0009. Customer cart and wishlist journey, rationale

## Context

CareU.bd is in the Facade prototype phase, where customer journeys need to look and feel complete on mock and browser side data before real backend wiring. Features 6, 7, and 8 already provide clickable home, browse, search, and product experiences, but the cart and wishlist pages are still placeholders, header counts always return zero, and add to cart or add to wishlist actions on product and browse surfaces are only local visual feedback.

Scope feature 9 asks for complete cart and wishlist prototype flows with item lists, quantity and selection changes, saved for later style states if useful, and clear empty and error states using browser side or mock data only. The feature must let a mock customer add, view, update, and remove items in cart and wishlist and move onward to checkout or browsing.

Several forces shape the design. CareU is a Bangladesh first, bilingual (English and Bangla), multi vendor marketplace where prices are shown in integer BDT and one checkout can later involve several shops. Confirmed product policy requires a customer account for checkout and sign in for tracking, and the prototype must show policy correct sign in required screens where needed without real authentication enforcement. Cart behavior is normally browser side in this product, while wishlist is an account style capability. In this prototype, the engineer chose to let guests use the cart and reach a sign in gate when proceeding to checkout, while keeping the wishlist limited to signed in mock customer personas through the existing prototype access flow.

The journey also needs to feel connected: product variant choices should carry into cart and wishlist, unavailable items must remain visible but blocked from moving forward, and reviewers need clear states (normal, empty, loading, error, and action feedback) across responsive pages.

## Options considered

### Option 1: Shared persisted browser state with integrated prototype flows (chosen)

Implement cart and wishlist as full prototype pages backed by one shared browser side state store. Product and browse actions, page actions, and header counts all read and update the same state. Persist the state in browser storage so it survives refresh during review. Use Zustand to manage the shared store and selectors, and wire prototype sign in gates for actions that require a signed in mock customer.

**Pros**:
- Creates a complete, believable end to end journey where add, view, update, remove, and move actions stay in sync across surfaces.
- Makes variant specific items, quantities, selection, saved for later, and unavailable handling easy to review in one connected flow.
- Fits the existing prototype direction and the existing TODO in header count hooks, while keeping the state model explicit for later backend wiring.

**Cons**:
- Adds a new client dependency (Zustand) and more client side state logic than isolated placeholder screens.
- Requires careful handling of prototype persona gates, browser persistence, and edge cases such as unavailable items and duplicate adds.
- Browser stored prototype state is an approximation and will need to be replaced or adapted when real cart and wishlist persistence is wired.

### Option 2: Separate mock page views without shared cross page state

Keep cart and wishlist as mostly independent mock screens with fixed or page local example data. Add to cart and add to wishlist actions on other pages would continue to show local feedback but would not update a shared cart, wishlist, or header counts.

**Pros**:
- Lower implementation effort and fewer moving parts in the prototype.
- Avoids adding a new state library and reduces persistence and synchronization concerns.

**Cons**:
- Does not satisfy the goal of a complete clickable flow where items added elsewhere appear in cart and wishlist pages.
- Makes quantity, selection, saved for later, and onward actions feel disconnected and harder to review as a real journey.
- Leaves header counts and existing quick actions misleading, increasing rework when the journey is made consistent later.

### Option 3: Shared state with built in React context and hooks (no new dependency)

Build the same integrated flow and browser persistence using React context, reducers or state hooks, and browser storage APIs instead of adding Zustand.

**Pros**:
- Avoids a new dependency and stays within built in React and browser APIs.
- Can still provide shared state and persistence if designed carefully.

**Cons**:
- Requires more custom store, selector, and render update wiring to keep header counts and many UI surfaces in sync cleanly.
- Goes against the existing codebase hint that cart and wishlist counts would move to Zustand selectors, so the implementation may need another refactor later.
- Increases the chance of prop drilling or avoidable rerender complexity for a prototype feature that already spans multiple surfaces.

## Rationale

Option 1 is the best fit for this feature because the main problem is not only to show cart and wishlist screens, but to let reviewers experience a connected prototype journey. The acceptance criteria require items added from product and browse surfaces to appear in shared state, update header counts, support quantity and selection changes, move between cart, saved for later, and wishlist, and continue onward through prototype sign in gates. A shared persisted store is the simplest way to make those behaviors coherent.

Zustand was chosen for this feature even though React built ins could work, because shared selectors and actions across header, product, browse, cart, and wishlist surfaces benefit from a small dedicated client store. The engineer accepted the dependency tradeoff, and two installed Agent Skills (`fusengine/claude-plugins@nextjs-zustand` and `bkjain655/agent-skills@zustand-persist-state`) can guide implementation patterns. The store remains prototype scoped: it uses browser storage, mock catalog resolution, and UI only sign in gates, so it does not claim real authentication, payment, stock reservation, or backend persistence.

This approach also respects the important constraints surfaced in the conversation: guest cart access with a sign in gate before checkout, sign in required wishlist access, variant specific line items, unavailable items kept visible but blocked, and clear empty and error states. The main tradeoff is extra client side complexity now, but that complexity directly serves the Facade goal of making the approved journey reviewable before backend wiring.

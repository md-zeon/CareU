# 0010. Customer checkout and order confirmation journey, rationale

## Context

CareU.bd is in the Facade prototype phase. Features 6 to 9 already let a reviewer move through home, browse, product, cart, and wishlist on mock and browser side data. The checkout route is still a placeholder that shows shop grouping and a summary, but it cannot collect choices, fail, or confirm an order. Scope feature 10 asks for the full checkout prototype: address selection, delivery options, cash on delivery and online payment screens, order summary, confirmation, and failure states, with no guest checkout and no real stock reservation or payment processing.

The prototype has firm boundaries. Real authentication, inventory writes, payment callbacks, settlement, and order records are deferred until after UI approval. The existing `ProtectedPrototypePage` customer gate already shapes the signed in customer experience, and the cart already exposes selected available lines through the shared store. The product page needs a buy now entry that must not change the cart. Everything the prototype shows must come from mock catalog, shop, address, delivery, and payment fixtures that live beside the UI.

Several product rules constrain the design. Prices are integer poisha shown as BDT. One checkout can span several shops, so the confirmation needs a per shop summary. A customer account is required for checkout, while tracking requires sign in and belongs to a later feature. Commission rates, return windows, delivery pricing details, and payout cadence are still pending policies, so the prototype must use clearly labeled mock values instead of inventing policy defaults. Reviewers also need to reach empty selection, no saved address, unavailable item, payment failure, and placement failure on demand, which the prototype switcher can drive.

The journey should feel connected to the rest of the storefront. It needs the existing CareU layout primitives, bilingual strings, local placeholder images, the same noindex treatment as other private surfaces, and minimal client complexity. The question is not whether to build real commerce now, but how to present the approved interaction and its failure states in a way that is easy to review and easy to replace during backend wiring.

## Options considered

### Option 1: One page checkout with a dedicated mock module and local draft state (chosen)

Build checkout as a single page containing address, delivery, payment, and summary sections. Back it with a dedicated `lib/mock/checkout` module that supplies fixtures, scenario driven values, total recomputation, placement results, and confirmation helpers. Keep the draft in component state and the last confirmation in session storage. Enter from selected cart lines or from a product buy now action.

**Pros**:

- Matches the Facade goal with the least surface area that still proves the full interaction and its failures.
- Keeps the draft, totals, and per shop summary in one place, so reviewers see the whole decision before placing an order.
- Reuses the existing gate, store, layout primitives, and placeholder assets without new infrastructure.
- Gives backend wiring a narrow mock contract to replace instead of scattered page local fixtures.

**Cons**:

- Adds client form and validation dependencies for the inline address case.
- Browser state is an approximation of a real order and must be replaced when feature 11 lands.
- All failure states are injected, so they need scenario discipline to stay believable during review.

### Option 2: Multi step wizard with separate routes

Split address, delivery, payment, and confirmation into separate navigable routes and carry the draft between them with query state or browser storage.

**Pros**:

- Each screen has one job and can be visually focused.
- Mirrors a common checkout pattern that reviewers may recognize.
- Makes it easy to show a step indicator and guard navigation between steps.

**Cons**:

- Adds more URLs to gate, keep unindexed, and maintain for the same prototype scope.
- Requires draft handoff across routes, which creates more failure modes than a single page review.
- Hides the whole order from the customer until the last step, making the per shop summary harder to judge early.
- Costs more work without proving more of the approved experience.

### Option 3: Wire real backend checkout now

Use real inventory reservation, real payment callbacks, and persisted orders instead of a mock flow.

**Pros**:

- Removes the gap between the prototype and production behavior.
- Would force real authorization, audit, and idempotency work earlier.

**Cons**:

- Breaks the approved Facade boundary and the confirmed no backend writes rule for this feature.
- Depends on policy values that are still pending, including delivery pricing details, return windows, and payout cadence.
- Needs real payment gateway integration, verified callbacks, and reconciliation well before the UI is approved.
- Turns a reviewable UI feature into a large backend program and delays the customer journey review.

## Rationale

Option 1 is the best fit because the main need is to review a complete checkout interaction on approved mock data. The scope row already describes the target as a prototype with mock data, clear confirmation and error states, and no backend writes. A single page with ordered sections gives reviewers the full address, delivery, payment, and summary picture at once, while a separate confirmation route keeps the successful outcome distinct and easy to refresh.

The chosen approach also respects the hard product boundaries. The customer persona gate stays where it is, buy now never becomes a second cart, snapshot based totals are recomputed with the money helpers at placement, and no client supplied total is trusted. Pending policies stay pending because delivery charges come from a labeled mock rule table and no commission or return rule is implied by the prototype.

The alternatives were rejected for concrete reasons. A wizard adds navigation and state handoff cost without proving more behavior, which matters when the whole point is fast UI review. Building real backend checkout now would break the approved prototype boundary, drag unresolved policy decisions into the build, and expand the feature far beyond what the engineer asked for. The tradeoff of Option 1 is browser only state and injected failures, but that tradeoff is exactly what the Facade phase accepts, and feature 11 is already planned to replace the confirmation with real server side order detail and ownership checks.

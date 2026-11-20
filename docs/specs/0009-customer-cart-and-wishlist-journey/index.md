# 0009. Customer cart and wishlist journey

**Date**: 2026-11-20
**Status**: Accepted

**Verification**: Typecheck, lint, tests (66 pass / 9 skipped T3–T7) and production build pass. Browser verified add-to-cart/wishlist from product and browse surfaces, shop grouping, variant lines, quantity caps, selection and summary, save-for-later and cross-area moves with quantity merge, duplicate merge and wishlist uniqueness, unavailable states, guest gates, signed-in checkout with selected available lines only, refresh persistence, shared persona state, en/bn rendering, and empty/loading/error states.

## Summary

This feature turns the cart and wishlist placeholders into a complete, clickable prototype journey on mock data. Shoppers can add items from product and browse pages, see them grouped by shop in the cart, change quantities, select what to take forward, save items for later, and move items between cart and wishlist. The wishlist stays for signed in mock customers, while guests can use the cart and meet a sign in prompt before checkout. All of this lives in one shared browser side store so counts and pages stay in sync and survive a refresh.

## Requirements

**User stories**:

- As a shopper browsing products, I want to add a chosen product or variant to my cart or wishlist so that I can review it later.
- As a guest, I want to build a cart and edit it freely, then be asked to sign in only when I move toward checkout.
- As a shopper, I want the cart grouped by shop with selection controls so that I can choose exactly what to take forward.
- As a shopper, I want to change quantities, remove items, save items for later, and move items to my wishlist so that my cart matches my intent.
- As a signed in mock customer, I want a wishlist I can open, prune, and move into my cart so that I can act on saved products.
- As a reviewer of the prototype, I want clear empty, loading, and error states and counts that stay in sync so that the journey feels finished.

**Acceptance criteria** (the contract, each criterion is independently checkable):

- **AC-1**: A guest can open the cart page and add, view, change quantity of, select, and remove items without signing in.
- **AC-2**: The wishlist page and every wishlist action are limited to signed in mock customer personas; a guest sees the existing prototype sign in required gate instead.
- **AC-3**: Active cart items are grouped by shop with clear shop context, and the grouping follows the shop of each stored line.
- **AC-4**: Each active cart item has a select control, there are select all and clear selection controls for the whole cart and for each shop, and selection applies only to available items.
- **AC-5**: The cart summary shows the count of selected available items and their subtotal in integer BDT, and states that delivery and final totals are confirmed at checkout.
- **AC-6**: Quantity controls enforce a minimum of 1 and cap at mock availability when it is known; quantity never falls below 1, and removal is the way to drop an item.
- **AC-7**: An unavailable item stays visible with a clear unavailable state, and cannot be selected, increased past availability, or moved forward toward checkout.
- **AC-8**: Each active cart item supports remove, save for later, and move to wishlist, with the sign in required gate shown to a guest who tries to move an item to wishlist.
- **AC-9**: The saved for later area supports move back to cart, move to wishlist, and remove, and merges quantity into an existing matching line when moved back.
- **AC-10**: Each wishlist item supports open as a product, remove, and move to cart, and the wishlist page offers onward links to continue browsing and to go to the cart.
- **AC-11**: Add to cart and add to wishlist actions on product and browse surfaces update the same shared browser side state, and the header cart and wishlist counts read from that state.
- **AC-12**: Adding the same product and variant again merges quantity in the cart and saved for later, while the wishlist keeps a single unique entry for that product and variant.
- **AC-13**: Cart and wishlist lines are variant specific when the product has variants, and all display details are resolved from mock catalog data using the stored ids.
- **AC-14**: The shared cart and wishlist state persists across a page refresh in the same browser, and is shared across prototype personas.
- **AC-15**: Proceed to checkout from the cart shows the prototype sign in required gate to a guest, then sends a signed in mock customer to a navigable checkout placeholder page using only selected available items.
- **AC-16**: The cart, wishlist, and saved for later areas have clear empty states with next actions, plus loading and error states for prototype review.

## Decision

**Chosen option**: Option 1: Shared persisted browser state with integrated prototype flows.

Build the cart and wishlist as full prototype pages backed by one shared browser side state store. Product and browse actions, page actions, and header counts all read and update that same store, persisted to browser storage, with prototype sign in gates for wishlist actions and checkout.

**Implementation skills**: `nextjs-zustand` (`fusengine/claude-plugins`, `.agents/skills/nextjs-zustand/`) · `zustand-persist-state` (`bkjain655/agent-skills`, `.agents/skills/zustand-persist-state/`)

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

**Data model sketch**:

This is browser side prototype state, not a database schema. Display details are never stored on a line; they are resolved from mock catalog data using the stored ids.

- `SharedPrototypeState`: the single persisted store, holding `activeCartLines`, `savedForLaterLines`, and `wishlistLines`. One instance per browser.
- `ActiveCartLine`: `lineId` (unique), `productId`, `variantId` (nullable), `shopId`, `quantity` (integer, at least 1), `selected` (boolean), `addedAt`.
- `SavedForLaterLine`: `lineId` (unique), `productId`, `variantId` (nullable), `shopId`, `quantity` (integer, at least 1), `savedAt`.
- `WishlistLine`: `lineId` (unique), `productId`, `variantId` (nullable), `shopId`, `addedAt`.

Relationships: the state holds zero or more of each line type. Each line references one mock product, zero or one mock variant, and one mock shop for grouping and display. Uniqueness key for merging and deduplication is the pair of `productId` and `variantId` within a given line collection.

**State transitions**:

- Active cart line: added to saved for later, moved to wishlist, removed, or kept active with quantity and selection changes.
- Saved for later line: moved back to active cart (merging quantity), moved to wishlist, or removed.
- Wishlist line: moved to active cart (merging quantity) or removed.
- Selection: an available active line toggles between selected and unselected; an unavailable line stays unselected and cannot enter the proceed set.

**API surface**:

There are no HTTP endpoints. The contract is the client store action surface that pages and header components call.

| Store action | Key inputs | Key outputs | Gate |
|---|---|---|---|
| addToCart | productId, variantId nullable, shopId, quantity default 1 | new or merged ActiveCartLine | none, guest allowed |
| setQuantity | lineId, quantity | updated ActiveCartLine | clamp to minimum 1 and mock availability |
| removeFromCart | lineId | line removed | none |
| toggleSelected | lineId | updated selection | available lines only |
| selectAll / clearSelection | optional shopId | updated selection for scope | available lines only |
| saveForLater | lineId | SavedForLaterLine, removed from cart | none |
| moveSavedToCart | lineId | ActiveCartLine with merged quantity | none |
| moveSavedToWishlist | lineId | WishlistLine, removed from saved | sign in required |
| moveCartToWishlist | lineId | WishlistLine, removed from cart | sign in required |
| addToWishlist | productId, variantId nullable, shopId | unique WishlistLine | sign in required |
| removeFromWishlist | lineId | line removed | sign in required |
| moveWishlistToCart | lineId | ActiveCartLine with merged quantity | sign in required and available only |
| proceedToCheckout | selected line ids | navigation to checkout placeholder | sign in required |

**Value sourcing** (every value an action produces or displays traces to a named source):

| Action | Value produced or displayed | Source |
|---|---|---|
| addToCart / saveForLater / move between areas | lineId | generated locally when the line is created |
| addToWishlist | entry uniqueness | derived from productId plus variantId against existing wishlist lines |
| addToCart and moves that merge | merged quantity | sum of the incoming quantity and the existing matching line quantity, capped by mock availability |
| setQuantity | quantity bounds | minimum 1; maximum from mock availability for the product or variant when known, otherwise a fixed prototype cap |
| Cart rows and groups | title, image, variant label, shop name, unit price, availability | resolved from mock catalog data using productId, variantId, and shopId |
| Cart summary | selected subtotal | sum of unit price multiplied by quantity over selected, available active lines, using integer BDT from mock catalog data |
| Cart summary | selected item count | count of selected, available active lines |
| Header cart count | count badge | derived from active cart line quantities in the shared store |
| Header wishlist count | count badge | derived from wishlist line count in the shared store |
| Unavailable state | unavailable flag | mock availability for the product or variant |
| Wishlist actions and checkout | sign in state | existing prototype persona or access state resolved through the current gate components |

**Key invariants**:

- Quantity is always an integer of at least 1, and never exceeds mock availability when that value is known.
- The same product and variant appears once per line collection, merging quantity in cart and saved for later and staying unique in wishlist.
- An unavailable line is never selected and never included in the summary or the proceed set.
- The summary and proceed action use only selected, available active cart lines.
- All state lives in the shared store; no page keeps its own competing copy of cart or wishlist items.
- Persisted data survives refresh and is shared across personas; there is no per persona split.

**Security model**:

This is a prototype with no backend writes, no real authentication, and no financial effect. Wishlist views and wishlist actions require a signed in mock customer persona through the existing prototype gate, and proceed to checkout applies the same gate to guests. The sign in gate is a UI prototype control, not a security boundary. No secrets, tokens, or personal data are placed in browser storage.

**Configuration required**:

None. The feature uses the existing mock catalog and prototype access state and adds no new environment variables.

**Critical test scenarios** (each maps to an acceptance criterion):

- Happy path: browse to a product with variants, add the chosen variant to cart, see it grouped under its shop with correct count and subtotal, adjust quantity, select it, save another item for later, move it back, then proceed to checkout. Verifies **AC-1**, **AC-3**, **AC-5**, **AC-6**, **AC-9**, **AC-15**.
- Wishlist path: as a signed in mock customer, add a product twice, confirm one entry, move it to cart, remove another, and use the onward links. Verifies **AC-10**, **AC-12**, **AC-13**.
- Guest gate: as a guest, open wishlist and try a wishlist action and proceed to checkout, confirming the sign in required gate appears and no wishlist data is shown. Verifies **AC-2**, **AC-8**, **AC-15**.
- Unavailable item: an item with zero mock availability stays visible, cannot be selected or increased, and is excluded from summary and proceed. Verifies **AC-4**, **AC-5**, **AC-7**.
- Persistence and sync: add items from product and browse surfaces, confirm header counts and page lists match, refresh, and confirm state remains and is shared after switching persona. Verifies **AC-11**, **AC-14**.
- Empty and error states: open empty cart, wishlist, and saved for later areas and confirm clear next actions and correct loading and error states. Verifies **AC-16**.

## Build plan

Ordered for the Facade approach: stand up the visible shells on mock data first, then make the shared browser store real behind them, then wire cross surface actions and gates. No database migration is needed because all state is in the browser.

1. [x] Build the cart page shell grouped by shop, with item rows, selection controls, summary panel, and empty, loading, and error states driven by mock catalog data. Satisfies **AC-1**, **AC-3**, **AC-4**, **AC-5**, **AC-16**.
2. [x] Build the wishlist page shell with item actions, onward links to browsing and cart, and empty, loading, and error states. Satisfies **AC-10**, **AC-16**.
3. [x] Add the Zustand store with browser persistence for `SharedPrototypeState` and the three line collections, plus mock catalog resolution helpers. Satisfies **AC-11**, **AC-12**, **AC-13**, **AC-14**.
4. [x] Wire the cart actions to the store: add, quantity changes with caps, remove, per item and per shop selection, select all and clear, save for later, and move to wishlist. Satisfies **AC-1**, **AC-4**, **AC-6**, **AC-7**, **AC-8**.
5. [x] Wire saved for later and wishlist actions to the store, including move back to cart with quantity merge, move to wishlist, remove, and unique wishlist adds. Satisfies **AC-9**, **AC-12**.
6. [x] Integrate add to cart and add to wishlist on product and browse surfaces and switch the header cart and wishlist counts to store selectors. Satisfies **AC-11**, **AC-13**.
7. [x] Add the prototype sign in gates for wishlist access and wishlist actions, plus the proceed to checkout gate and the navigable checkout placeholder route using only selected available items. Satisfies **AC-2**, **AC-8**, **AC-15**.

## Consequences

**Positive**:

- Reviewers get a connected, believable cart and wishlist journey that matches the rest of the Facade prototype.
- One shared store keeps product actions, browse actions, pages, and header counts consistent.
- Variant specific lines, shop grouping, selection, saved for later, and unavailable handling are all reviewable before backend work begins.

**Negative / tradeoffs**:

- Adds a client dependency and more client side state logic than isolated placeholder pages.
- Browser stored state is an approximation and will need a real cart and wishlist persistence design when the backend is wired.
- Prototype sign in gates are UI only and must not be mistaken for real authorization.

**Neutral**:

- Persisted prototype data may need a reset control for repeatable demos, to be added if reviewers need it.
- The installed Zustand skills are not yet referenced in project context files.

## Follow-up

- [ ] Add a note for `nextjs-zustand` and `zustand-persist-state` in root `AGENTS.md` `## Library policy` or the relevant store area context, so build agents pick up their conventions.
- [ ] Design real cart and wishlist persistence and authentication enforcement in a later backend feature; this spec deliberately defers that under Facade.
- [ ] Recheck the shared across personas behavior when real persona aware accounts replace the prototype access switcher.

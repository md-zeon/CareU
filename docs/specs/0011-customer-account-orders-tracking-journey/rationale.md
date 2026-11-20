# 0011. Customer account, addresses, orders, and tracking journey (rationale)

## Context

> ⚠️ Premise note: This journey carries the confirmed rule that tracking requires sign in and the project rule that private order reads need ownership checks. In the Facade phase the persona gate is UI only, so it must never be read as a real access boundary. The correct framing is a prototype that rehearses those rules, with real server side checks explicitly owned by the later customer commerce wiring feature.

The checkout journey in spec 0010 deliberately stopped at an order number and a per shop summary. It left tracking out on purpose and handed account areas, order history, and sign in required order reads to this feature. The scope row for feature 11 asks for profile, saved addresses, order history and detail, per shipment status, and tracking, all on mock data during the UI first phase.

The delivery approach is Facade. The scope header records Facade for the whole Phase 1 customer journey group and the root guide points to the scope file for build order, so Facade governs this spec even though the root guide describes Tracer Bullet as a general default. The consequence is that visible screens come first, browser state is acceptable, and no backend writes belong here.

The engineer chose a persisted Zustand store for profile and address edits rather than session storage or component state. That choice has to fit the existing cart store, which already uses a versioned key, manual rehydration after mount, and a safe fallback for invalid stored values. The persona switcher from spec 0005 also means one browser can move between several mock customers, so stored account values must reset when the persona changes.

Tracking is a policy sensitive surface. The confirmed rules are that tracking requires an account and that private order information needs server side authorization on every read. The prototype can show the shape of those rules, but it cannot enforce them. Recording that limit clearly here prevents a later builder from treating the UI gate as security.

## Options considered

### Option 1: Nested account shell with a dedicated mock module and a persisted account store

Build nested account routes under a shared shell. Read all account and order values from a new `lib/mock/account` module that composes the shared fixtures and the checkout confirmation. Keep profile and address edits in a versioned Zustand store that mirrors the cart store. Orders and shipments stay in fixtures.

**Pros**:
- Gives the reviewer a believable, connected account journey while keeping checkout untouched.
- The persisted store makes edits survive navigation, and the reset rule keeps mock personas separate.
- A dedicated mock module is a clean replacement point for later backend wiring.
- Ownership filtering and derived status can be rehearsed without a database.

**Cons**:
- Adds a second persisted store with rehydration and reset code to maintain.
- Mock values in browser storage are an approximation that will be discarded later.
- Mixed shipment status rules are prototype rules, not confirmed policy.

### Option 2: Single tabbed account page with component state only

Use one account route with tabs that swap panels. Keep profile and address edits in component state, with no persisted store or new mock module.

**Pros**:
- Fewest moving parts and the fastest prototype to build.
- No browser storage or rehydration code to maintain.

**Cons**:
- Tabs do not match the navigable route structure the reviewer will see in the real product.
- Edits vanish on navigation, which makes address management hard to judge.
- Folding all data into one page leaves no clean contract for later wiring.

### Option 3: Extend the checkout mock module and the shared cart store

Add account views and mutations beside the existing checkout contracts, and store profile and address edits in the cart store.

**Pros**:
- Reuses one module and one store, with no new storage key.
- Fewer files and fewer patterns for a builder to learn.

**Cons**:
- Couples account state to cart state, so a cart reset or persona change can damage account data.
- Bloats the checkout module with views that have a different lifetime and different ownership rules.
- Makes the later backend replacement harder because two journeys share one mutable contract.

## Rationale

The Facade phase is the deciding force. The goal is a clickable, believable journey on mock data, not production behaviour, so the simplest structure that still rehearses the real rules is the right one. Nested routes match where these screens will live after wiring, and a dedicated mock module gives feature 26 a single place to replace with server reads.

The engineer's preference for a persisted Zustand store is honoured because it makes edits feel real across navigation and because the cart store already proves the pattern in this codebase. The cost is a second storage key and rehydration guard, and that cost is accepted knowingly. The reset on persona change is the specific guard that keeps the preference safe: without it, one mock customer would inherit another customer's saved address.

Ownership filtering and derived status are included now because they are cheap to represent in a mock getter and expensive to invent during backend wiring. They stay prototype behaviour. The UI gate and the noindex rules are discovery and review aids, not a security boundary. The real authorization work remains a separate, explicitly tracked feature, and the spec says so wherever a builder might otherwise assume the prototype is enough.

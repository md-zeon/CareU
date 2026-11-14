# 0005. Prototype access and journey switcher

**Date**: 2026-11-14
**Status**: Accepted

## Summary

This spec defines a prototype only journey switcher for CareU.bd so you can move through customer, seller, and platform admin areas without real sign in or permission checks. A clearly labeled floating panel will let you pick a mock persona, jump to grouped journey shortcuts, and still see sign in required screens when you are viewing as a guest. The selected persona and panel state stay saved in the browser so you can review multi page flows, while the whole feature remains UI only and never becomes a real access control boundary.

## Requirements

**User stories**:
- As a product reviewer, I want to switch between guest, customer, seller, and platform mock views so that I can review every prototype journey without real account setup.
- As a prototype reviewer, I want quick shortcuts to journey entry points so that I can reach customer, seller, and admin screens fast during review.
- As a reviewer checking policy, I want sign in required screens to appear for guest flows so that I can confirm the experience follows CareU rules while still using mock access.

**Acceptance criteria** (the contract, each criterion is independently checkable):
- **AC-1**: A persistent floating prototype panel is available across locale routes in the prototype and is clearly marked as prototype only. It can be opened and closed, and it does not appear as real account or permission UI.
- **AC-2**: The panel lets you choose an active mock persona from a representative set that includes guest, signed in customer, seller owner, seller staff, CareU shop staff, and representative platform views (platform admin, operations or support, and finance or settlements), each shown with a clear label and short scope description.
- **AC-3**: The panel shows journey shortcuts grouped by area (customer, seller, platform, and any general prototype entry points), with localized labels and links that work with the current locale. Shortcuts for routes not built yet still open a clear placeholder or not yet built state instead of breaking navigation.
- **AC-4**: The active mock persona and panel open or closed state are stored in browser storage and restored on navigation and refresh. If the stored persona is missing or invalid, the session safely falls back to guest.
- **AC-5**: Prototype pages that require sign in by CareU policy show a sign in required gate when the active persona is guest, and the switcher provides a clear way to continue as an appropriate signed in mock persona. Switching persona never performs real authentication and never grants real backend access.
- **AC-6**: Active prototype persona state is shared through a shared UI mechanism (a client side provider and helper) so pages and layouts can render the correct mock state consistently without introducing real database reads, real API calls, or real server side authorization changes.
- **AC-7**: The implementation reuses or extends existing prototype foundations where appropriate (for example `lib/mock` persona fixtures, shared primitives, and placeholder states), keeps user facing UI text in next-intl, and remains compatible with the Facade approach and existing navigable routes.

## Decision

**Chosen option**: Option 1: Floating panel with persisted browser session and shared UI context.

Provide a prototype only floating switcher mounted in the root locale layout, backed by a small client side React context/provider that persists the active persona and panel state in browser storage. Define personas and journey shortcuts as typed static configuration that reuses existing mock persona fixtures where possible, and expose a shared helper for sign in required prototype gates.

**Implementation skills**: none recorded in project context files for this feature. Follow root `AGENTS.md` rules for Next.js App Router, server and client boundaries, next-intl usage, prototype only scope, caching, and the rule that UI visibility is never authorization.

## Feature design

**Data model sketch**:

The model is UI oriented and prototype only. No Prisma models, database writes, or server session changes are introduced.

| Entity | Key fields | Required / nullable | Primary key | Relationships and constraints |
|---|---|---|---|---|
| `PrototypePersonaOption` | `id: string`, `label: LocalizedText`, `kind: "guest" \| "customer" \| "seller" \| "platform"`, `description: LocalizedText`, `mockPersonaId?: string`, `shopId?: string`, `platformRole?: string`, `journeyScope: "guest" \| "customer" \| "seller" \| "platform"` | `id`, `label`, `kind`, `description`, `journeyScope` required; others nullable by persona type | `id` | Static config in code. Guest has no `mockPersonaId`. Non guest options should map to existing or added `lib/mock` persona fixtures where a matching fixture is needed for journey data. `id` values must be unique and stable. |
| `PrototypeJourneyShortcut` | `id: string`, `label: LocalizedText`, `href: string`, `area: "general" \| "customer" \| "seller" \| "platform"`, `requiresSignIn: boolean`, `suggestedPersonaId?: string`, `status: "available" \| "planned"` | all required except `suggestedPersonaId` | `id` | Static typed config in code. `href` is a locale relative path resolved for the active locale. `suggestedPersonaId`, when set, must reference an existing `PrototypePersonaOption.id`. |
| `PrototypeSession` | `activePersonaId: string`, `isPanelOpen: boolean`, `version: number` | all required | single stored record key (for example `careu.prototype.session`) | Persisted in browser storage only. `activePersonaId` must resolve to a known persona option; invalid values reset to guest defaults. `version` supports safe future resets. |

**State transitions** (if applicable):

| State | Trigger | Result |
|---|---|---|
| No stored session | App loads and storage is empty, unavailable, or unreadable | Use default session: guest persona, panel closed (or a defined default open state if chosen in implementation), no error shown to normal users |
| Valid stored session | App loads and stored `version` and `activePersonaId` are valid | Restore `activePersonaId` and `isPanelOpen` |
| Invalid stored session | App loads and stored data is malformed, wrong version, or unknown persona | Replace with default guest session and continue safely |
| Persona selected | User chooses a persona in the panel | Update `activePersonaId`, persist session, and re render prototype UI using the selected mock persona |
| Panel toggled | User opens or closes the floating control | Update `isPanelOpen` and persist session |
| Guest on protected flow | A page marked as sign in required renders while persona is guest | Show sign in required gate UI with a switcher affordance to choose a signed in mock persona |
| Shortcut activated | User clicks a journey shortcut | Navigate to the shortcut `href` for the active locale; if `status` is planned or the route is a placeholder target, show a clear placeholder or not yet built state |

**API surface**:

No backend API endpoints are added. The interface is client side UI and typed config.

| Surface | Method or kind | Key inputs | Key outputs | Auth | Key errors or states |
|---|---|---|---|---|---|
| `prototypePersonaOptions` config | typed constant | none | ordered list of `PrototypePersonaOption` | none (UI only) | missing labels or ids must fail type checking; guest option must exist |
| `prototypeJourneyShortcuts` config | typed constant | none | grouped or groupable list of `PrototypeJourneyShortcut` | none (UI only) | unknown `suggestedPersonaId` should be avoided by types/review; planned routes must still be navigable to a placeholder state |
| `PrototypeSessionProvider` | React client provider | `children` | context value with session, persona, and actions | none (UI only) | storage unavailable falls back to in memory defaults for the current render; invalid stored data resets to guest |
| `usePrototypeSession()` | hook | none | `{ session, activePersona, setActivePersona, togglePanel, openPanel, closePanel }` | none (UI only) | used outside provider should throw a clear development error or return a safe documented fallback chosen in implementation |
| `PrototypeAccessSwitcher` | React client component | optional className or mount props if needed | floating trigger and panel UI | none (UI only) | panel must remain usable on small screens and not block critical navigation |
| `PrototypeGate` (or equivalent helper) | React component/helper | `requiredPersonaKinds?` or `requiresSignIn`, `children`, optional fallback content | children for allowed mock persona, otherwise sign in required UI | none (UI only) | guest on protected flow shows gate; allowed mock personas see prototype content; no server side enforcement implied |
| Browser storage read/write helpers | functions | storage key, session value | parsed valid `PrototypeSession` or default | none (UI only) | JSON parse errors, wrong version, unknown persona, or unavailable storage result in safe fallback to guest |

**Value sourcing** (every value each action produces, computes, or displays names where it comes from; a required value with no named source is an undecided input, resolve it before this spec is done, do NOT leave the build to invent it):

| Action | Value produced / displayed | Source |
|---|---|---|
| Render floating trigger and panel | Prototype label, open/close labels, section headings, persona labels, scope descriptions, shortcut labels | next-intl messages for UI chrome plus `LocalizedText` fields in typed persona and shortcut config |
| Show current mock persona | Active persona id, display label, kind, scope description | `PrototypeSession.activePersonaId` from provider state resolved against `prototypePersonaOptions` config |
| List representative personas | Guest, signed in customer, seller owner, seller staff, CareU shop staff, platform admin, operations/support, finance/settlements options | `prototypePersonaOptions` static config; `mockPersonaId` links to existing or added `lib/mock/identity` fixtures where needed |
| Persist and restore session | Stored active persona id, panel open state, version, storage key | `PrototypeSession` value written to and read from browser storage using a fixed key and schema version defined in code |
| Decide default/fallback persona | Guest persona id and default panel state | Defined default `PrototypeSession` constant in code (guest option must exist in config) |
| Render grouped journey shortcuts | Shortcut label, target href, area group, planned status, suggested persona | `prototypeJourneyShortcuts` static config, grouped by `area`; `href` resolved with the active locale/routing helpers used by the app |
| Navigate from shortcut | Destination URL for the active locale | `href` in shortcut config combined with locale aware navigation/linking in the UI |
| Show sign in required gate for guest | Gate heading/body/actions and whether the current flow requires sign in | Shared `PrototypeGate` inputs or page level prototype metadata plus next-intl copy; active persona from `usePrototypeSession()` |
| Offer switch to signed in mock persona from gate | Suggested or available signed in persona options | Persona options filtered from `prototypePersonaOptions` (non guest, appropriate kind/scope) and optional `suggestedPersonaId` from shortcut or gate context |
| Mount switcher on every locale route | Placement in rendered tree | Root locale layout (`app/[locale]/layout.tsx`) wraps children with provider and renders the floating switcher |
| Mark UI as prototype only | Visible "Prototype" badge/text and explanatory copy | next-intl messages and component styling/content in the switcher UI |

**Key invariants**:
- This feature is prototype only: it must never perform real authentication, grant real permissions, or be treated as a server side access boundary.
- Guest persona on a protected prototype flow shows a sign in required gate UI, not protected content, until a signed in mock persona is selected in the prototype session.
- `activePersonaId` always resolves to a known configured persona option; unknown or invalid stored values fall back to guest.
- Browser persistence is best effort: if storage is unavailable, the app remains usable with in memory default state for the current session.
- Journey shortcuts and persona options are typed static config; no route discovery, database query, or remote fetch is used to build them.
- User facing UI labels and messages in the switcher and gate use next-intl. Mock persona and shortcut labels that are user visible content may use `LocalizedText` consistent with existing mock conventions.
- No real database reads/writes, real API calls, or changes to real auth enforcement are introduced.

**Security model**:
- No protected backend operation is added or changed. Real authorization remains the responsibility of server side code in later wiring; hiding or showing prototype UI is not authorization.
- The floating panel is always visible in the prototype by product decision for this phase, but it must be clearly labeled prototype only and must only control mock UI state.
- Prototype session data stored in browser storage contains only mock persona selection and panel UI state (no secrets, tokens, credentials, or personal production data).
- Sign in required screens remain visible as UI gates for guest persona to reflect policy, but enforcement is still not real until backend wiring features implement it server side.

**Configuration required**:
- No new environment variables or third party credentials are required.
- No remote image domains or external services are required.

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Happy path: the floating prototype panel renders across locale pages, is clearly labeled prototype only, opens/closes, lists representative personas and grouped journey shortcuts, and switching persona updates the visible mock context, verifies **AC-1**, **AC-2**, **AC-3**, **AC-6**.
- Persistence and recovery: selecting a persona and toggling the panel persists across navigation and refresh; invalid or unknown stored session data resets safely to guest, verifies **AC-4**.
- Policy gate flow: visiting a protected prototype flow as guest shows the sign in required gate, and using the switcher to choose a signed in mock persona reveals the prototype flow without any real auth action, verifies **AC-5**.
- Missing route handling: activating a shortcut for a not yet built journey leads to a clear placeholder or not yet built state instead of a broken experience, verifies **AC-3**, **AC-7**.
- Integration boundaries: the feature uses shared provider/helper/config and existing mock foundations, all user facing UI strings go through next-intl, and no database/API/real auth enforcement is introduced, verifies **AC-6**, **AC-7**.

## Build plan

Build approach: **Facade** (project default). Lead with the visible shell level UI and believable mock access behavior so reviewers can move through journeys first, then deepen gate coverage as journey pages adopt the shared helper.

1. [x] **Define prototype session and config types**: add typed models for persona options, journey shortcuts, and persisted session state (including safe defaults and versioning), and create static config for representative personas and grouped shortcuts aligned to existing `lib/mock` identity fixtures, satisfies **AC-2**, **AC-3**, **AC-4**, **AC-7**.
2. [x] **Implement shared session state and persistence**: add a client side provider/hook with browser storage read/write helpers, safe fallback to guest on invalid or unavailable storage, and persona/panel actions, satisfies **AC-4**, **AC-6**.
3. [x] **Build the floating switcher UI**: create the clearly labeled prototype trigger and panel with current persona display, persona picker, and grouped journey shortcuts using existing primitives/tokens and next-intl labels, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-7**.
4. [x] **Mount the switcher in the root locale shell**: wire the provider and floating panel into `app/[locale]/layout.tsx` so it is available across prototype routes while preserving locale behavior and navigability, satisfies **AC-1**, **AC-6**, **AC-7**.
5. [x] **Add shared sign in required gate helper and placeholder handling**: provide a reusable prototype gate/wrapper for guest protected flows with a clear path to switch persona, and ensure planned or missing shortcuts resolve to a clear placeholder/not yet built state, satisfies **AC-3**, **AC-5**, **AC-7**.
6. [x] **Extend mock foundations and apply to representative routes**: extend `lib/mock` persona fixtures/config only as needed for the agreed representative set (including CareU shop staff and finance/settlements view if missing), and apply the gate/helper to at least the currently relevant sign in required prototype entry points so the policy flow is reviewable, satisfies **AC-2**, **AC-5**, **AC-6**, **AC-7**.
7. [x] **Consistency and boundary pass**: verify bilingual UI labels, safe persistence behavior, no real auth/database/API wiring, clear prototype labeling, and small screen usability of the floating panel, satisfies **AC-1**, **AC-4**, **AC-5**, **AC-6**, **AC-7**.

## Consequences

**Positive**:
- Reviewers can move quickly through customer, seller, and platform prototype journeys without waiting for real authentication, roles, or backend wiring.
- Policy sensitive flows remain visible because guest users still encounter sign in required gates in the UI.
- A shared provider, config, and gate helper gives later journey features a consistent way to render mock persona states.

**Negative / tradeoffs**:
- The switcher adds always visible prototype chrome and a small amount of client side state/persistence code to the locale shell.
- Static shortcut and persona config will need maintenance as routes and journeys evolve.
- Prototype gates can drift from future real authorization behavior if later wiring does not replace them with server enforced checks.

**Neutral**:
- The feature extends prototype foundations (`lib/mock` and shared UI) but does not change the data model, migrations, or production auth flow.
- Persona names and scopes are representative review aids; exact production permission behavior remains defined and enforced by later authz and backend wiring work.

## Follow-up

- [ ] As Phase 1, 2, and 3 journey routes are built, keep `prototypeJourneyShortcuts` and route level gate usage current so the switcher remains a complete review map.
- [ ] When backend wiring begins (feature 25 onward), remove or gate prototype only access and replace prototype gates with real server side session and permission checks.
- [ ] If mock persona needs grow, extend `lib/mock/identity` fixtures and persona options together so labels, scopes, and journey data stay consistent.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

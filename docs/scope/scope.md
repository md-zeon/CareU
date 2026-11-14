# Scope: CareU.bd marketplace platform

CareU.bd is a Bangladesh first multi vendor marketplace where third party sellers and CareU's own shop sell through one shared buying experience. Over time it will also support multiple branch locations for stock and fulfillment and broader company operations.

**Build approach:** Facade (make the whole product look and feel real first on placeholder and mock data, then wire the real system behind it after you approve the UI). This is prototype grade on purpose: Phase 1 is a clickable, believable UI, not production complete.
**Workflow:** Prototype (after /develop: nothing extra required; rely on develop's own build time self check). The project default level of rigor while we prove the experience first. `/architect` is still the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag (e.g. `· Alpha`) to do more.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

**UI direction (inspiration):** draw UI and UX ideas from [Aniq UI fashion storefront demo](https://ecommerce-clothes-1.aniq-ui.com/en), [Aniq UI ecommerce admin dashboard demo](https://ecommerce-clothes-1-admin.aniq-ui.com/en/dashboard), [Flannels](https://www.flannels.com/), and [Masari Shop](https://www.masarishop.com/). Use them for layout, page flow, navigation patterns, states, and merchandising feel; adapt for CareU's Bangladesh first, multi vendor marketplace and confirmed rules.

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| A | Storefront shell, i18n, and theme | Already in place | existing |
| B | Authentication basics | Already in place | in-progress |
| C | Money primitives and test baseline | Already in place | existing |
| D | Catalog menu facade (placeholder) | Already in place | existing |
| 1 | Marketplace domain model | Existing foundations (backend later) | done |
| 2 | Roles, permissions, and access control | Existing foundations (backend later) | done |
| 3 | Media storage and secure file handling | Existing foundations (backend later) | in-progress |
| 4 | UI prototype foundation and mock data | UI foundations | done |
| 5 | Prototype access and journey switcher | UI foundations | planned |
| 6 | Customer home and discovery journey | Phase 1 · Customer journeys | planned |
| 7 | Customer browse, search, and brand journey | Phase 1 · Customer journeys | planned |
| 8 | Customer product and review journey | Phase 1 · Customer journeys | planned |
| 9 | Customer cart and wishlist journey | Phase 1 · Customer journeys | planned |
| 10 | Customer checkout and order confirmation journey | Phase 1 · Customer journeys | planned |
| 11 | Customer account, addresses, orders, and tracking journey | Phase 1 · Customer journeys | planned |
| 12 | Customer support and trust pages journey | Phase 1 · Customer journeys | planned |
| 13 | Seller entry, onboarding, and shop setup journey | Phase 2 · Seller journeys | planned |
| 14 | Seller dashboard and shop management journey | Phase 2 · Seller journeys | planned |
| 15 | Seller catalog, listings, and inventory journey | Phase 2 · Seller journeys | planned |
| 16 | Seller orders, fulfillment, and delivery journey | Phase 2 · Seller journeys | planned |
| 17 | Seller earnings, payouts, and support journey | Phase 2 · Seller journeys | planned |
| 18 | Platform admin shell and overview journey | Phase 3 · Admin journeys | planned |
| 19 | Platform seller, shop, and listing moderation journey | Phase 3 · Admin journeys | planned |
| 20 | Platform catalog, pricing, and inventory operations journey | Phase 3 · Admin journeys | planned |
| 21 | Platform orders, payments, COD, and delivery operations journey | Phase 3 · Admin journeys | planned |
| 22 | Platform returns, refunds, disputes, support, and settlements journey | Phase 3 · Admin journeys | planned |
| 23 | Platform content, theme, notifications, and analytics journey | Phase 3 · Admin journeys | planned |
| 24 | UI approval checkpoint and backend wiring plan | After UI approval | planned |
| 25 | Wire foundations, auth, roles, and media to the UI | Later · Backend wiring | planned |
| 26 | Wire customer commerce and fulfillment flows | Later · Backend wiring | planned |
| 27 | Wire seller operations and marketplace money flows | Later · Backend wiring | planned |
| 28 | Wire platform operations, governance, and reporting | Later · Backend wiring | planned |
| 29 | Multi branch locations for stock and fulfillment | Future | planned |
| 30 | Branch and company operations management | Future | planned |
| 31 | Employee affiliate marketing | Future | planned |
| 32 | Virtual tryout room with a dummy mannequin | Future | planned |

## Already in place (brownfield)

### A. Storefront shell, i18n, and theme · existing
Next.js app shell with locale routing for English and Bangla, shared layout, fonts, theme, header, footer, and placeholder storefront routes. code in `app/[locale]/`, `components/storefront/`, `lib/i18n/`

### B. Authentication basics · in-progress
Better Auth with phone and email one time codes, session helpers, and the base auth database models. Role and permission enforcement for the full marketplace is still to come. Real auth enforcement is deferred during the UI prototype phase and will be wired later. code in `lib/auth.ts`, `lib/session.ts`, `lib/auth-client.ts`, `prisma/schema/auth.prisma`, `app/api/auth/`

### C. Money primitives and test baseline · existing
Integer poisha helpers, rounding, allocation, and discount pipeline with T1 money tests in place. code in `lib/money/`, `tests/money/`

### D. Catalog menu facade (placeholder) · existing
Static seeded category and menu data served behind a cache facade for the storefront header. code in `lib/catalog/menu.ts`, `lib/catalog/menu.types.ts`

## Existing foundations (kept, backend wiring deferred until after UI approval)

These records and specs stay in place. During the UI first Facade phase, do not extend their backend behavior unless it is required to render or navigate the prototype. Use placeholder and mock data in the UI instead.

### 1. Marketplace domain model · done
Core records for sellers, shops, CareU as first party, categories, products and variants, inventory, carts, orders, payments, shipments, and audit history, recorded so later backend wiring has one consistent model.
**Done when:** the marketplace entities, relationships, and key constraints remain recorded in a spec and the schema can support later slices without breaking rewrites.
spec [0001](../specs/0001-marketplace-domain-model/index.md)
code in `prisma/schema/enums.prisma`, `prisma/schema/seller.prisma`, `prisma/schema/catalog.prisma`, `prisma/schema/inventory.prisma`, `prisma/schema/customer.prisma`, `prisma/schema/order.prisma`, `prisma/schema/payment.prisma`, `prisma/schema/trust.prisma`, `prisma/schema/auth.prisma`, `prisma/migrations/20261112074041_marketplace_domain_model`
- [x] Design it (spec): `/architect marketplace domain model`
- [x] Build it: `/develop marketplace domain model`
  - [x] Milestone 1: add shared enums and core identity/shop schema (`SellerApplication`, `SellerVerificationDocument`, `Shop`, `ShopMembership`) with ownership and status fields, satisfies **AC-1**, **AC-8**
  - [x] Milestone 2: add catalog and sellable offer schema (`Category`, `CategoryAttribute`, `Product`, `ProductVariant`, `Listing`, `ListingVariant`, `ListingMedia`) with shared and unique listing support, satisfies **AC-2**, **AC-8**
  - [x] Milestone 3: add order, fulfillment, inventory, reservation, and persisted customer records (parent `Order`, per shop `Shipment`/`OrderItem`, histories, stock models, `SavedAddress`, `Wishlist`) with snapshots and scope anchors, satisfies **AC-3**, **AC-4**, **AC-8**, **AC-9**
  - [x] Milestone 4: add payment, money, COD reconciliation, trust, operations, and audit models, then review constraints/indexes and create/verify the migration and generated client, satisfies **AC-5**, **AC-6**, **AC-7**, **AC-8**, **AC-9**
  - [x] Rework: apply 2026-11-12 review findings (money as BIGINT poisha, snapshot/cascade/history/integrity fixes, updated migration/spec/tests)
- [x] Rework: apply 2026-11-12 rereview integrity top up (rating and item status guards, shipment uniqueness, terminal attribution, stock movement idempotency, typed support author, default uniqueness)
- [x] Verify it: `/check verify marketplace domain model`
- [x] Test it: `/test marketplace domain model`
- [x] Review it (fresh model): `/check review marketplace domain model`
- [x] Document it: `/document marketplace domain model`

### 2. Roles, permissions, and access control · done
Roles for customers, seller owners and staff, and platform staff, with shop scoped and platform scoped permissions designed and recorded. Real server side enforcement across marketplace flows is deferred until backend wiring after UI approval.
**Done when:** the permission model remains recorded in a spec and protected actions can be granted or denied by trusted server side roles and scopes when backend wiring resumes.
spec [0002](../specs/0002-roles-permissions-access-control/index.md) · code in `lib/authz/`, `app/api/authz/roles/route.ts`, `app/[locale]/(storefront)/forbidden/page.tsx`, `scripts/bootstrap-super-admin.ts`, `prisma/schema/rbac.prisma`, `prisma/migrations/20261112103000_roles_permissions_access_control`, `tests/acceptance-gates.test.ts`, `tests/authz-catalog.test.ts`, `tests/authz-milestone5.test.ts`, `tests/authz-access-control.test.ts`
- [x] Design it (spec): `/architect roles, permissions, and access control`
- [x] Build it: `/develop roles, permissions, and access control`
  - [x] Milestone 1: add `PlatformRole`, `PlatformRoleGrantSource`, and `ShopRole` enums, the `PlatformRoleAssignment` model with grant/revoke history, and `ShopMembership` role and lifecycle fields, with hand authored partial unique indexes for live assignments and live memberships, satisfies **AC-1**
  - [x] Milestone 2: write the typed permission catalog, role bundles, `OWNER_BUNDLE`, super admin exclusive set, CareU shop mapping, and resource access matrix with a completeness test, satisfies **AC-2**
  - [x] Milestone 3: resolve effective access from the session plus the database (`getActor`, live platform roles, ACTIVE membership, owner derivation, verified contact, shop status gate) and implement the evaluator, guards, and `AuthorizationDecision` adapters, satisfies **AC-3**, **AC-4**, **AC-5**, **AC-7**, **AC-10**
  - [x] Milestone 4: implement platform role grant/revoke, shop staff assign/remove, and refund and payout approval guards with self grant, role conflict, self approval, and last super admin protection, every change audited, satisfies **AC-6**, **AC-8**, **AC-9**
  - [x] Milestone 5: add the idempotent bootstrap script, wire guards into one real protected entry point with the localized 403 and login redirect, and land the probe, revocation, conflict, and locked revocation tests, satisfies **AC-4**, **AC-5**, **AC-6**, **AC-9**, **AC-11**
- [x] Verify it: `/check verify roles, permissions, and access control`
- [x] Test it: `/test roles, permissions, and access control`
- [x] Review it (fresh model): `/check review roles, permissions, and access control`
- [x] Document it: `/document roles, permissions, and access control` (PR description prepared)

### 3. Media storage and secure file handling · in-progress
Cloudflare R2 design and backend foundation for public product media and private documents. Backend work is paused during the UI first phase; use placeholder images and files in the prototype and resume milestone 5 and integration after UI approval.
**Done when:** the R2 storage design remains recorded in a spec, and when resumed uploads are validated and private files are served only through controlled access.
spec [0003](../specs/0003-media-storage-secure-file-handling/index.md) · code in `lib/media/`, `app/api/media/`, `prisma/schema/media.prisma`, `prisma/migrations/20261113130000_media_storage_secure_file_handling`, `docs/specs/0003-media-storage-secure-file-handling/integration-notes.md`, `tests/media-foundation.test.ts`
- [x] Design it (spec): `/architect media storage and secure file handling`
- [ ] Build it (paused during UI first): `/develop media storage and secure file handling`
  - [x] Milestone 1: schema, migration, and storage utilities (R2 config, key/URL/TTL helpers, validation), satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**
  - [x] Milestone 2: upload intent and finalize thread (presigned direct upload, verification, idempotent activation), satisfies **AC-1**, **AC-2**, **AC-6**
  - [x] Milestone 3: private access grants and audit logging (including denied and anonymous attempts), satisfies **AC-3**, **AC-4**, **AC-6**
  - [x] Milestone 4: media listing, metadata, reorder/replace/remove, history and evidence rules, and safe cleanup, satisfies **AC-1**, **AC-3**, **AC-5**, **AC-6**
  - [ ] Milestone 5: hardening, focused tests, and integration notes (env vars, CORS, permissions), satisfies **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**
- [ ] Verify it: `/check verify media storage and secure file handling`
- [ ] Test it: `/test media storage and secure file handling`
- [ ] Review it (fresh model): `/check review media storage and secure file handling`
- [ ] Document it: `/document media storage and secure file handling`

## UI foundations

Keep foundations only where needed to render and navigate the UI. Build order for the UI prototype (confirmed): 4, then 5, then Phase 1 customer journeys (6 to 12).

### 4. UI prototype foundation and mock data · done
Set up the shared UI building blocks for the Facade prototype: design direction, layout primitives, reusable page states, and a simple mock data layer so screens can render convincingly without real database reads or writes. Decision (confirmed): adapted Aniq patterns for CareU identity (Bangladesh first, EN/BN, BDT, multi vendor plus CareU first party); representative static fixtures per journey covering happy path and key empty, loading, error, and success states.
**Done when:** the design direction and mock data approach are recorded, and shared components can render navigation, lists, details, forms, empty, loading, error, and success states across the prototype.
spec [0004](../specs/0004-ui-prototype-foundation-and-mock-data/index.md) · code in `lib/mock/`, `components/storefront/primitives/`, `components/storefront/states/`, `components/prototype/`, `app/[locale]/(storefront)/prototype/page.tsx`, `lib/catalog/menu.ts`
- [x] Design it (spec): `/architect ui prototype foundation and mock data`
- [x] Build it: `/develop ui prototype foundation and mock data`
  - [x] Milestone 1: create `lib/mock/` types, domain modules, and representative fixtures with scenario helpers for all phase groups, satisfies **AC-1**, **AC-2**
  - [x] Milestone 2: add reusable layout primitives and practical design tokens adapted to CareU, satisfies **AC-3**, **AC-5**
  - [x] Milestone 3: add loading, empty, error, success, and form feedback primitives, satisfies **AC-4**, **AC-5**
  - [x] Milestone 4: refactor shared shell and `lib/catalog/menu.ts` onto the foundation while keeping routes navigable, satisfies **AC-5**, **AC-6**
  - [x] Milestone 5: add the internal showcase, local placeholder assets, and consistency pass (bilingual, integer BDT, no real backend/auth), satisfies **AC-2**, **AC-4**, **AC-5**, **AC-6**, **AC-7**

### 5. Prototype access and journey switcher · needs a decision
Add easy UI only access for the prototype so you can move through customer, seller, and platform admin journeys without real auth enforcement, while still showing sign in and sign in required screens where CareU policy requires them. Decision (confirmed): a persistent prototype UI switcher to jump between mock personas and views (guest, signed in customer, seller owner or staff, platform roles) and reach sign in required screens as UI flows.
**Done when:** a prototype user can enter customer, seller, and admin areas, see mock signed in states and role views, and reach policy correct sign in required screens without real backend checks.
- [ ] Design it (spec): `/architect prototype access and journey switcher`

## Phase 1: Customer journeys (UI prototype)

Build each customer journey as a complete clickable flow on placeholder and mock data, including navigation and empty, loading, error, and success states, before moving to the next journey.

### 6. Customer home and discovery journey · needs a decision
Prototype the storefront home and discovery experience: hero and merchandising sections, category and brand entry points, promotions and editorial style highlights, header and footer navigation, inspired by the reference sites and adapted to CareU.
**Done when:** a visitor can move through home, featured sections, and entry points into browse flows with believable content and all key page states.
- [ ] Design it (spec): `/architect customer home and discovery journey`

### 7. Customer browse, search, and brand journey · needs a decision
Prototype category, collection, search, and brand browsing with filters, sorting, pagination or load more, breadcrumbs, and clear empty and no result states on mock catalog data.
**Done when:** a customer can browse categories and brands, refine results, search, and open products through a complete, navigable UI flow with its states.
- [ ] Design it (spec): `/architect customer browse, search, and brand journey`

### 8. Customer product and review journey · needs a decision
Prototype product detail pages with galleries, variant selection, price and availability display, seller or shop context, related products, and review presentation on mock data, including future facing space for supported experiences.
**Done when:** a customer can view a product, switch variants, understand availability and shop context, see review and related item states, and continue to cart or wishlist flows.
- [ ] Design it (spec): `/architect customer product and review journey`

### 9. Customer cart and wishlist journey · needs a decision
Prototype cart and wishlist screens as complete UI flows with item lists, quantity and selection changes, saved for later style states if useful, and clear empty and error states using browser side or mock data only.
**Done when:** a signed in mock customer can add, view, update, and remove items in cart and wishlist and move onward to checkout or browsing.
- [ ] Design it (spec): `/architect customer cart and wishlist journey`

### 10. Customer checkout and order confirmation journey · needs a decision
Prototype the checkout flow on mock data: address selection, delivery option display, payment method selection screens (cash on delivery and online payment UI), order summary, confirmation, and failure states. Follow CareU policy: no guest checkout and no real stock reservation or payment processing.
**Done when:** a mock signed in customer can complete or fail a checkout UI flow, see clear confirmation and error states, and understand per shop and total summaries without backend writes.
- [ ] Design it (spec): `/architect customer checkout and order confirmation journey`

### 11. Customer account, addresses, orders, and tracking journey · needs a decision
Prototype customer account areas: profile, saved addresses, order history and detail, per shipment status views, and order tracking. Follow CareU policy: tracking requires sign in. Use mock order and shipment states.
**Done when:** a mock signed in customer can manage profile and address screens, review orders, and track shipments through complete UI states.
- [ ] Design it (spec): `/architect customer account, addresses, orders, and tracking journey`

### 12. Customer support and trust pages journey · needs a decision
Prototype help and trust surfaces: contact and FAQ, order linked support entry points, return and policy information, and legal pages (privacy, terms, consent) as navigable content screens.
**Done when:** a customer can find help, start a support style flow in UI, and read trust and legal pages with consistent navigation and states.
- [ ] Design it (spec): `/architect customer support and trust pages journey`

## Phase 2: Seller journeys (UI prototype)

Build each seller journey as a complete clickable flow on placeholder and mock data, including navigation and empty, loading, error, and success states, before moving to the next journey.

### 13. Seller entry, onboarding, and shop setup journey · needs a decision
Prototype seller application, verification document submission views, approval status screens, and initial shop setup for one shop per account, using mock states and no real review actions.
**Done when:** a seller can move through apply, pending, approved or rejected, and shop setup screens with clear states and next steps.
- [ ] Design it (spec): `/architect seller entry, onboarding, and shop setup journey`

### 14. Seller dashboard and shop management journey · needs a decision
Prototype the seller home dashboard and shop management: shop profile, staff and role views, shop status controls, and key summary cards, all on mock data and scoped to one shop in the UI.
**Done when:** a mock seller user can navigate their dashboard and manage shop information and status screens with complete UI states.
- [ ] Design it (spec): `/architect seller dashboard and shop management journey`

### 15. Seller catalog, listings, and inventory journey · needs a decision
Prototype listing and inventory management screens: create and edit products and variants, pricing, media placeholders, stock views, low stock and out of stock states, and moderation status displays on mock data.
**Done when:** a mock seller or CareU shop user can move through listing and inventory screens with believable data, validation style feedback, and all key states.
- [ ] Design it (spec): `/architect seller catalog, listings, and inventory journey`

### 16. Seller orders, fulfillment, and delivery journey · needs a decision
Prototype seller order management: order and shipment lists, detail views, fulfillment status steps, delivery and tracking fields, and proof of delivery capture views as UI only mock flows.
**Done when:** a mock seller can review orders, progress shipment states, and view delivery details through complete UI flows.
- [ ] Design it (spec): `/architect seller orders, fulfillment, and delivery journey`

### 17. Seller earnings, payouts, and support journey · needs a decision
Prototype seller facing money and help views: commission and balance summaries, payout history, COD related status views, and support or dispute entry points, clearly separated from CareU first party treatment in labels and mock data.
**Done when:** a mock seller can understand earnings, payout, and support screens with clear states and no real financial processing.
- [ ] Design it (spec): `/architect seller earnings, payouts, and support journey`

## Phase 3: Platform and admin journeys (UI prototype)

Build each platform and admin journey as a complete clickable flow on placeholder and mock data, including navigation and empty, loading, error, and success states, before moving to the next journey.

### 18. Platform admin shell and overview journey · needs a decision
Prototype the platform admin shell: navigation, overview dashboard, key metrics cards, alerts, and role aware entry points inspired by the reference admin demo but adapted to CareU operations.
**Done when:** a mock platform user can move through the admin home and reach each admin area with consistent layout and states.
- [ ] Design it (spec): `/architect platform admin shell and overview journey`

### 19. Platform seller, shop, and listing moderation journey · needs a decision
Prototype admin screens for seller applications, shop approvals and status, listing review and moderation, and trust actions using mock records and review states.
**Done when:** a mock admin can review sellers, shops, and listings through complete approval, rejection, and moderation UI flows.
- [ ] Design it (spec): `/architect platform seller, shop, and listing moderation journey`

### 20. Platform catalog, pricing, and inventory operations journey · needs a decision
Prototype CareU and platform catalog operations: categories and attributes, CareU first party products and pricing views, procurement and stock operation screens, and low stock states on mock data.
**Done when:** a mock platform operator can navigate catalog, pricing, and inventory screens and see clear operational states without real writes.
- [ ] Design it (spec): `/architect platform catalog, pricing, and inventory operations journey`

### 21. Platform orders, payments, COD, and delivery operations journey · needs a decision
Prototype operations screens for orders, shipments, payment states, cash on delivery tracking, delivery assignment, and tracking oversight, reflecting CareU ownership of COD workflows in labels and states.
**Done when:** a mock operations user can inspect and progress order, payment, COD, and delivery UI flows with complete states on mock data.
- [ ] Design it (spec): `/architect platform orders, payments, cod, and delivery operations journey`

### 22. Platform returns, refunds, disputes, support, and settlements journey · needs a decision
Prototype admin and finance adjacent screens for returns, refunds, disputes, support cases, seller balances, and payout batches, keeping support and financial views clearly separated in the UI.
**Done when:** a mock authorized user can follow review and resolution style flows and see recorded outcomes and money impact states in UI only.
- [ ] Design it (spec): `/architect platform returns, refunds, disputes, support, and settlements journey`

### 23. Platform content, theme, notifications, and analytics journey · needs a decision
Prototype content and governance screens: homepage and page content editing, theme settings, notification templates and history views, and seller versus CareU analytics views, all on mock data.
**Done when:** a mock authorized user can move through content, theme, notification, and reporting screens with clear scope separation and complete UI states.
- [ ] Design it (spec): `/architect platform content, theme, notifications, and analytics journey`

## After UI approval

### 24. UI approval checkpoint and backend wiring plan · needs a decision
Review the completed prototype journeys, capture feedback, and turn approved UI into a concrete backend wiring plan that maps each flow to real data, auth, permissions, payments, inventory, and integrations.
**Done when:** approved and changed UI areas are recorded, and the next backend wiring features and decisions are ready to design in order.
- [ ] Design it (spec): `/architect ui approval checkpoint and backend wiring plan`

## Later: backend wiring and production logic (after UI approval)

These features reintroduce the real marketplace behavior behind the approved UI. They remain planned until the UI is approved. Real database writes, real auth enforcement, payment and IPN handling, stock reservation, integrations, and production correctness work happen here, not in the prototype phases.

### 25. Wire foundations, auth, roles, and media to the UI · needs a decision
Connect approved UI to real auth, permission checks, and media handling: resume feature 3 backend completion, enforce server side access, and replace placeholder access with real sessions and controlled file flows.
**Done when:** approved screens use real session, role, permission, and media behavior where required, with server side enforcement and no placeholder access leaks.
- [ ] Design it (spec): `/architect wire foundations, auth, roles, and media to the ui`

### 26. Wire customer commerce and fulfillment flows · needs a decision
Connect approved customer journeys to real catalog data, cart persistence as decided, server checked checkout, stock reservation, order creation, payments and COD handling, fulfillment, and sign in required tracking.
**Done when:** a real customer can browse, buy, pay or place COD, and track orders through verified, correct, and auditable flows behind the approved UI.
- [ ] Design it (spec): `/architect wire customer commerce and fulfillment flows`

### 27. Wire seller operations and marketplace money flows · needs a decision
Connect approved seller journeys to real onboarding, shop management, listings, inventory, fulfillment, commissions, balances, COD reconciliation, and settlements with correct CareU versus third party separation.
**Done when:** seller operations and marketplace money handling work end to end with correct scope, snapshots, and auditable records behind the approved UI.
- [ ] Design it (spec): `/architect wire seller operations and marketplace money flows`

### 28. Wire platform operations, governance, and reporting · needs a decision
Connect approved admin journeys to real moderation, operations, returns and disputes, support, content publishing, notifications, analytics, and governance controls with proper separation of duties.
**Done when:** platform staff can operate the marketplace through real, authorized, and auditable workflows behind the approved UI.
- [ ] Design it (spec): `/architect wire platform operations, governance, and reporting`

## Future

### 29. Multi branch locations for stock and fulfillment · needs a decision
Add support for multiple CareU branch locations such as warehouses or fulfillment hubs that hold stock and take part in fulfilling orders.
**Done when:** the system can represent branch locations and track stock and fulfillment by location without breaking the single location flows.
- [ ] Design it (spec): `/architect multi branch locations for stock and fulfillment`

### 30. Branch and company operations management · needs a decision
Extend the platform to manage broader branch and company operations beyond order fulfillment, building on roles, inventory, and reporting.
**Done when:** branch and company level operational workflows can be managed in the product with the right access controls and records.
- [ ] Design it (spec): `/architect branch and company operations management`

### 31. Employee affiliate marketing · needs a decision
Allow approved CareU employees (with permission granted by a superior in their role) to take part in affiliate marketing with trackable referrals and rewards.
**Done when:** eligible employees can be enabled for affiliate activity, referrals are tracked reliably, and rewards or reporting follow approved rules.
- [ ] Design it (spec): `/architect employee affiliate marketing`

### 32. Virtual tryout room with a dummy mannequin · needs a decision
Offer a virtual tryout experience with a dummy mannequin so customers can preview how selected products may look before buying.
**Done when:** customers can use a tryout view on supported products and the experience fits into the normal product browsing flow.
- [ ] Design it (spec): `/architect virtual tryout room with a dummy mannequin`

## Deferred
Out of scope for the current roadmap pass, kept so the plan stays honest.
- **Advanced procurement and supplier workflows**: deeper purchasing, supplier management, and receiving flows beyond basic receipts · needs a decision
- **Courier API integrations**: automated courier booking and live courier status updates · needs a decision
- **Guest checkout**: buying without a customer account · needs a decision (confirmed not in launch policy; UI prototype follows sign in required checkout)
- **Backorders and preorders**: selling items before stock is available · needs a decision

## Legend

**The decision box.** Every feature carries exactly one, the sub-task whose label ends with `(spec)`. Its wording varies (`Design it (spec)` normally, `Decide the stack (spec)` on Stack & architecture), so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box and `/architect` never ticks one.

**Feature lifecycle**: the scope updates as a feature moves; each row is what it shows and who sets it:

| State | Set by | The feature shows |
|---|---|---|
| `planned` · needs a decision | `/scope` | one box: `Design it (spec): /architect <feature>` |
| `in-progress` (designed) | **`/architect` at spec capture** | `Design it` ticked; spec linked; `Build it: /develop <feature>` + **2 to 5 milestones**; the tier's closing boxes (`Verify it`, `Test it`, `Review it`, `Document it`); any surfaced follow-up enrolled |
| `in-progress` (building) | `/develop` | milestone sub-boxes tick one by one; code pointer filled |
| `in-progress` (verified) | `/check verify` | `Build it` + milestones ticked; `Verify it` ticked |
| `done` | **you, when you decide it is** (any skill sets it when you say so); `/sync` reconciles | boxes you ran ticked, skipped ones marked skipped; the tier's last stage is the suggested point to call it done |

- **Next step** = the first unticked box (always a command or a tracked milestone).
- **needs a decision** = run `/architect` first; otherwise straight to `/develop` (or `/audit` for standards & tooling). The tag drops once the spec is captured.
- **Atomic build tasks live in the spec's `## Build plan`, not here**: the scope carries only the milestone rollup.
- **Status** `planned` → `in-progress` → `done`, plus `existing` (pre-workflow) and `dropped` (de-scoped, kept for history).
- **Approach tag** beside a heading (e.g. `· Facade`) overrides the project default for that feature; no tag = inherits it.
- **Workflow tier tag** beside a heading (e.g. `· GA`, `· Prototype`) sets that one feature's rigor above or below the project default; no tag inherits the default.
- **Workflow** (header line) is the project default, what runs after `/develop`: **Prototype** = nothing; **Alpha** = `/check verify`; **Beta** = `/check verify` then `/test`; **GA** = adds a fresh model `/check review` then `/document`.
- **Pointer line** (`spec <n> · code in <path>`): the spec link added by `/architect`, the code path by `/develop`.
# Scope: CareU.bd marketplace platform

CareU.bd is a Bangladesh first multi vendor marketplace where third party sellers and CareU's own shop sell through one shared buying experience. Over time it will also support multiple branch locations for stock and fulfillment and broader company operations.

**Build approach:** Tracer Bullet (prove one thin, real end to end thread through every layer, then thicken it slice by slice).
**Workflow:** GA (after /develop: /check verify, /test, a fresh model /check review, then /document). The project default level of rigor. `/architect` is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag (e.g. `· Beta`) to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| A | Storefront shell, i18n, and theme | Already in place | existing |
| B | Authentication basics | Already in place | in-progress |
| C | Money primitives and test baseline | Already in place | existing |
| D | Catalog menu facade (placeholder) | Already in place | existing |
| 1 | Marketplace domain model | Foundation | in-progress |
| 2 | Roles, permissions, and access control | Foundation | planned |
| 3 | Media storage and secure file handling | Foundation | planned |
| 4 | CareU first party shop and platform bootstrap | Slice 1 | planned |
| 5 | Seller onboarding and shop management | Slice 1 | planned |
| 6 | Category and product catalog foundation | Slice 1 | planned |
| 7 | Product and listing management | Slice 1 | planned |
| 8 | Storefront browse and product pages | Slice 1 | planned |
| 9 | Customer account, addresses, and cart | Slice 1 | planned |
| 10 | Checkout, stock reservation, and order placement | Slice 1 | planned |
| 11 | Payments and cash on delivery handling | Slice 1 | planned |
| 12 | Fulfillment, shipments, and order tracking | Slice 1 | planned |
| 13 | Inventory ledger and stock operations | Slice 2 | planned |
| 14 | Delivery configuration and assignment | Slice 2 | planned |
| 15 | Returns, refunds, and disputes | Slice 2 | planned |
| 16 | Customer support cases | Slice 2 | planned |
| 17 | Notifications and message history | Slice 2 | planned |
| 18 | Commissions, seller balances, and settlements | Slice 2 | planned |
| 19 | Promotions, coupons, and campaigns | Slice 3 | planned |
| 20 | Reviews and ratings | Slice 3 | planned |
| 21 | Analytics and reporting | Slice 3 | planned |
| 22 | Public site SEO and legal basics | Slice 3 | planned |
| 27 | Site content management (CMS) for company roles | Slice 3 | planned |
| 28 | Super admin theme customization | Slice 3 | planned |
| 29 | Multi branch locations for stock and fulfillment | Future | planned |
| 30 | Branch and company operations management | Future | planned |
| 31 | Employee affiliate marketing | Future | planned |
| 32 | Virtual tryout room with a dummy mannequin | Future | planned |

## Already in place (brownfield)

### A. Storefront shell, i18n, and theme · existing
Next.js app shell with locale routing for English and Bangla, shared layout, fonts, theme, header, footer, and placeholder storefront routes. code in `app/[locale]/`, `components/storefront/`, `lib/i18n/`

### B. Authentication basics · in-progress
Better Auth with phone and email one time codes, session helpers, and the base auth database models. Role and permission enforcement for the full marketplace is still to come. code in `lib/auth.ts`, `lib/session.ts`, `lib/auth-client.ts`, `prisma/schema/auth.prisma`, `app/api/auth/`

### C. Money primitives and test baseline · existing
Integer poisha helpers, rounding, allocation, and discount pipeline with T1 money tests in place. code in `lib/money/`, `tests/money/`

### D. Catalog menu facade (placeholder) · existing
Static seeded category and menu data served behind a cache facade for the storefront header. code in `lib/catalog/menu.ts`, `lib/catalog/menu.types.ts`

## Foundations

### 1. Marketplace domain model · in-progress
Define the core records for sellers, shops, CareU as first party, categories, products and variants, inventory, carts, orders, payments, shipments, and audit history so every slice shares one consistent model.
**Done when:** the marketplace entities, relationships, and key constraints are recorded in a spec and the schema can support later slices without breaking rewrites.
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

### 2. Roles, permissions, and access control · needs a decision
Define and enforce roles for customers, seller owners and staff, and platform staff, with shop scoped and platform scoped permissions checked on the server for every protected action.
**Done when:** the permission model is recorded in a spec and protected actions can be granted or denied by trusted server side roles and scopes.
- [ ] Design it (spec): `/architect roles, permissions, and access control`

### 3. Media storage and secure file handling · needs a decision
Design and integrate Cloudflare R2 (decided) for public product media and for private documents such as seller verification files and proof of delivery, with safe uploads and controlled access.
**Done when:** the R2 storage design is recorded in a spec, uploads are validated, and private files are served only through controlled access.
- [ ] Design it (spec): `/architect media storage and secure file handling`

## Slice 1: Core marketplace loop

### 4. CareU first party shop and platform bootstrap · needs a decision
Set up CareU as the first party shop and seed the minimum platform records so CareU can sell its own products through the same shared flow as sellers.
**Done when:** CareU exists as a first party shop in the system and the platform can tell CareU sales apart from third party seller sales for later money handling.
- [ ] Design it (spec): `/architect careu first party shop and platform bootstrap`

### 5. Seller onboarding and shop management · needs a decision
Let sellers apply, submit required details, and be approved or rejected by admins, then create and manage one shop per account with basic staff and shop status controls.
**Done when:** an admin can approve a seller, the seller gets one shop, shop status can be managed, and seller actions stay limited to their own shop.
- [ ] Design it (spec): `/architect seller onboarding and shop management`

### 6. Category and product catalog foundation · needs a decision
Build the shared category tree and product structures for simple and variant products so CareU and approved sellers can list items against a common catalog.
**Done when:** categories and product structures support both CareU and seller listings, with the attributes needed for real browse and order records.
- [ ] Design it (spec): `/architect category and product catalog foundation`

### 7. Product and listing management · needs a decision
Provide tools for CareU staff and approved sellers to create, edit, and publish listings with prices, variants, and ownership checks, respecting approval and moderation rules.
**Done when:** authorized users can manage their own listings, sensitive changes follow the right checks, and listings are ready to appear on the storefront.
- [ ] Design it (spec): `/architect product and listing management`

### 8. Storefront browse and product pages · needs a decision
Show real categories and product pages on the public storefront with clear price, availability, and crawlable content so customers can find and understand products.
**Done when:** customers can browse categories and open a product page with accurate, server rendered information and basic SEO metadata.
- [ ] Design it (spec): `/architect storefront browse and product pages`

### 9. Customer account, addresses, and cart · needs a decision
Let signed in customers manage their profile and delivery addresses and keep a cart that is ready for a server checked checkout.
**Done when:** a signed in customer can save addresses, add items to a cart, and see a cart that reflects current items for checkout.
- [ ] Design it (spec): `/architect customer account, addresses, and cart`

### 10. Checkout, stock reservation, and order placement · needs a decision
Run a server checked checkout that confirms prices and stock, reserves inventory safely, and creates immutable order and shipment records for each shop in the cart.
**Done when:** a checkout either reserves all required stock and creates correct order records, or fails safely without partial reservations or wrong totals.
- [ ] Design it (spec): `/architect checkout, stock reservation, and order placement`

### 11. Payments and cash on delivery handling · needs a decision
Support cash on delivery and the first online payment flow with verified, idempotent updates so orders and money states stay correct even with delays or repeats.
**Done when:** an order can move through payment states safely for cash on delivery and online payment, and only verified payment results settle an order.
- [ ] Design it (spec): `/architect payments and cash on delivery handling`

### 12. Fulfillment, shipments, and order tracking · needs a decision
Create per shop shipment records with status history, basic assignment, tracking details, and proof of delivery so a placed order can be fulfilled and followed to completion.
**Done when:** staff or sellers can update a shipment through its allowed steps, capture proof of delivery when required, and a signed in customer can track their order.
- [ ] Design it (spec): `/architect fulfillment, shipments, and order tracking`

## Slice 2: Operations and trust

### 13. Inventory ledger and stock operations · needs a decision
Track stock movements with reasons, support restocks and adjustments, and surface low stock and out of stock states for CareU and seller managed inventory.
**Done when:** every stock change is recorded with a reason, stock levels stay accurate, and authorized users can manage inventory without overselling.
- [ ] Design it (spec): `/architect inventory ledger and stock operations`

### 14. Delivery configuration and assignment · needs a decision
Configure delivery charges and methods for coverage across all districts at launch, assign CareU managed deliveries to staff or couriers, and keep delivery details consistent on each shipment.
**Done when:** delivery options and charges can be applied and recorded per shipment across all districts, and CareU managed deliveries can be assigned and tracked.
- [ ] Design it (spec): `/architect delivery configuration and assignment`

### 15. Returns, refunds, and disputes · needs a decision
Support return requests, refunds, and disputes with clear status, evidence, review, and recorded outcomes that connect back to orders and money.
**Done when:** eligible items can move through a reviewed return or dispute flow and any refund or adjustment is recorded with its reason and effect.
- [ ] Design it (spec): `/architect returns, refunds, and disputes`

### 16. Customer support cases · needs a decision
Provide support cases linked to orders or items with categories, priority, assignment, internal notes, attachments, status history, and resolutions.
**Done when:** support staff and customers can follow a case from open to resolved with a clear history, while internal notes stay hidden from customers.
- [ ] Design it (spec): `/architect customer support cases`

### 17. Notifications and message history · needs a decision
Send important updates by email and in app, and keep a history so users can see what was sent and its status.
**Done when:** key order, account, and support events create the right email and in app messages and users can review their notification history.
- [ ] Design it (spec): `/architect notifications and message history`

### 18. Commissions, seller balances, and settlements · needs a decision
Calculate commissions, track seller balances, and manage manual payout batches and cash on delivery reconciliation with auditable records.
**Done when:** eligible earnings, commissions, and payout actions are recorded clearly, and CareU first party sales stay separate from third party seller payouts.
- [ ] Design it (spec): `/architect commissions, seller balances, and settlements`

## Slice 3: Growth and governance

### 19. Promotions, coupons, and campaigns · needs a decision
Create discounts and campaigns with eligibility and usage limits, including funding and allocation rules across multiple sellers and CareU.
**Done when:** a promotion can be applied within its rules, and its funding and allocation are recorded clearly on the affected orders.
- [ ] Design it (spec): `/architect promotions, coupons, and campaigns`

### 20. Reviews and ratings · needs a decision
Let verified purchasers leave one review per eligible product, edit or report reviews, and show trusted feedback on the storefront.
**Done when:** only eligible purchases can create reviews, reviews can be managed fairly, and product pages show accurate review information.
- [ ] Design it (spec): `/architect reviews and ratings`

### 21. Analytics and reporting · needs a decision
Provide seller facing and CareU facing reports for sales, orders, inventory, returns, commissions, and payouts, keeping first party and marketplace views separate where needed.
**Done when:** authorized users can see the reports relevant to their scope without exposing another seller's or restricted CareU data.
- [ ] Design it (spec): `/architect analytics and reporting`

### 22. Public site SEO and legal basics · needs a decision
Strengthen public pages with crawlable content, metadata, canonicals, sitemap coverage, structured data where supported, and clear privacy, terms, and consent pages.
**Done when:** indexable public pages have correct SEO signals and users can access basic privacy, terms, and consent information.
- [ ] Design it (spec): `/architect public site seo and legal basics`

### 27. Site content management (CMS) for company roles · needs a decision
Let authorized company roles edit selected site content such as pages, homepage sections, banners, and announcements without writing code, in a way that keeps the storefront fast.
**Done when:** authorized roles can create and update the selected content areas without code, and published changes appear on the site without harming performance.
- [ ] Design it (spec): `/architect site content management for company roles`

### 28. Super admin theme customization · needs a decision
Let a super admin adjust approved visual theme settings, such as colors and branding, at any time without code changes, while keeping the site fast and consistent.
**Done when:** a super admin can change approved theme settings and the storefront reflects them safely without hurting performance or breaking the design system.
- [ ] Design it (spec): `/architect super admin theme customization`

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
- **Guest checkout**: buying without a customer account · needs a decision
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

# 0002. Roles, permissions, and access control

**Date**: 2026-11-12
**Status**: In Progress

## Summary

This decision defines how CareU.bd decides who may do what. Roles are fixed bundles written in code, permissions are typed constants at the domain action level, and the database only records who holds which role and where. Every protected server entry point resolves the acting user and their scope from the session and the database, then calls a guard before touching data. Customers are implicit, shop staff are scoped to one shop, and platform staff act globally with narrow permissions, including automatic reach over CareU's own shop. The result is a small, auditable model that later slices can call instead of inventing their own checks.

## Requirements

**User stories**:
- As a platform engineer, I want one permission catalog and one set of guard helpers so that every later slice enforces access the same way instead of growing its own checks.
- As a seller owner, I want to give my staff only the shop roles they need so that my inventory, listings, and money are not exposed to everyone who helps me.
- As platform staff, I want my role to carry exactly the permissions my job needs so that I can work without holding unrelated financial or seller data.
- As a customer, I want my own orders, addresses, and cases to stay mine, and I want a denied action to fail safely without revealing whether someone else's record exists.
- As an auditor, I want every grant, revocation, and membership change recorded with actor and reason so that access can be reconstructed after the fact.

**Acceptance criteria** (the contract, each criterion is independently checkable):
- **AC-1**: The database can represent platform role assignments with grant and revoke history, and shop staff memberships with a required shop role and an INVITED, ACTIVE, REMOVED lifecycle. One live platform assignment exists per user and role, and one live membership exists per user per shop, both enforced by the database.
- **AC-2**: The permission catalog and role bundles are code defined and typed. Every permission in the catalog belongs to at least one role bundle, the owner bundle, or the super admin exclusive set, and no runtime path can create a role or change a bundle.
- **AC-3**: Effective access for an actor resolves entirely server side from the session plus the database, never from a client supplied role, shop id, seller id, or permission. Platform roles grant their mapped actions on the CareU first party shop, and cross shop reads happen only through permissions defined as platform reach.
- **AC-4**: A protected server entry point can require a platform permission, a shop permission, or customer ownership. A route handler maps the result to a redirect to login with a validated return path, 403 for denial, or 404 for an out of scope resource, and a server action returns the same typed decision for the UI to render.
- **AC-5**: Removing a platform role or a shop membership takes effect on the next protected request. Permissions are never read from the session cookie cache.
- **AC-6**: Only a super admin grants or revokes platform roles. Nobody can grant themselves a role. Every grant and revocation writes an audit record with actor, target, role, and reason. The last live super admin cannot be revoked, including two revocations running at the same time.
- **AC-7**: A platform role has no effect for a user without a verified email or phone number.
- **AC-8**: A shop owner assigns or removes shop roles within their own shop only. An INVITED membership grants no access until ACTIVE (the acceptance flow belongs to feature 5), a removed member can be invited again as a new row, the owner cannot hold or be removed through a membership row, and every staff change is audited with actor and reason.
- **AC-9**: Super admin passes every permission check and additionally holds the exclusive set. Customer support may read order, case, and customer contact context across shops but no payment, ledger, commission, payout, or bank data. Finance approves refunds and payouts and can never approve a refund they requested. Trust and moderation reviews seller applications, reads private verification documents, sets trusted seller state, and moderates listings and reviews. One user cannot hold customer support and finance and settlements at the same time.
- **AC-10**: A shop that is paused or suspended still allows its staff to read and fulfil orders already placed, including stock adjustments for returns and damage, and denies new listing, publishing, pricing, and restock actions. Suspension of a seller shop never changes platform reach over the CareU shop.
- **AC-11**: An idempotent bootstrap script grants the first super admin from a configured email only when that user exists with a verified contact and no live super admin exists, records the grant as a system bootstrap action, and rerunning it creates no duplicate assignment. It exits non zero when it cannot grant.

## Decision

**Chosen option**: Option 1: a typed permission catalog and guard helpers over the existing Prisma and Better Auth stack.

Authorization is enforced by our own code defined permission catalog, fixed role bundles, Prisma backed role assignment, and server guards that return a typed actor context. Better Auth stays responsible for identity and session only. The database stores assignments, memberships, and audit records, while role meaning stays in code review.

**Implementation skills**: `better-auth-best-practices` (`.agents/skills/better-auth-best-practices/`) · `better-auth-security-best-practices` (`.agents/skills/better-auth-security-best-practices/`) · `prisma-client-api` (`.agents/skills/prisma-client-api/`) · `prisma-cli` (`.agents/skills/prisma-cli/`)

## Feature design

### Data model sketch

**New model: `PlatformRoleAssignment`**

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | String PK | yes | cuid |
| `userId` | FK `User` | yes | the holder, onDelete Restrict |
| `role` | `PlatformRole` enum | yes | one of the eight bundles |
| `grantSource` | `PlatformRoleGrantSource` enum | yes | `ADMIN` or `BOOTSTRAP`, default `ADMIN` |
| `grantedByUserId` | FK `User` | no | null only for `BOOTSTRAP`; onDelete Restrict; never the same user as `userId` |
| `grantedAt` | DateTime | yes | default now |
| `revokedByUserId` | FK `User` | no | onDelete Restrict |
| `revokedAt` | DateTime | no | null means live |
| `revokeReason` | String | no | required by the domain layer when revoking |
| `createdAt`, `updatedAt` | DateTime | yes | |

Indexes: `@@index([userId, revokedAt])`, `@@index([role, revokedAt])`. Unique live assignment per user and role is a partial unique index hand authored in the migration: `UNIQUE ("userId", "role") WHERE "revokedAt" IS NULL`. Add `@@index([userId, role])` for conflict checks.

**Changed model: `ShopMembership`**

| Field | Type | Required | Notes |
|---|---|---|---|
| `role` | `ShopRole` enum | yes | replaces the `membershipRole` string |
| `acceptedAt` | DateTime | no | set when status becomes ACTIVE |
| `removedAt` | DateTime | no | set with removal, kept for history |
| existing fields | unchanged | | `shopId`, `userId`, `status`, `invitedByUserId`, timestamps |

Indexes: replace `@@unique([shopId, userId])` with a hand authored partial unique index `UNIQUE ("shopId", "userId") WHERE "status" <> 'REMOVED'`, so a removed member can be invited again as a new row. Add `@@index([shopId, status])`.

**New enums**

- `PlatformRole`: `SUPER_ADMIN`, `PLATFORM_ADMIN`, `CATALOGUE_PRICING`, `INVENTORY_PROCUREMENT`, `DELIVERY_OPERATIONS`, `CUSTOMER_SUPPORT`, `FINANCE_SETTLEMENTS`, `TRUST_MODERATION`.
- `PlatformRoleGrantSource`: `ADMIN`, `BOOTSTRAP`.
- `ShopRole`: `MANAGER`, `CATALOGUE`, `FULFILMENT`, `SUPPORT`.

Owner authority is not a membership row and is not a `ShopRole`. It derives from the existing unique `Shop.ownerUserId`, so a shop has exactly one owner by construction, and the database and domain layer reject a membership row whose user is the shop owner. CareU first party uniqueness already holds through the existing `shop_single_first_party_idx` partial index.

### Permission catalog

Permissions are string constants in `lib/authz/permissions.ts`, typed so a typo fails compilation. Names are `scope.domain.action`.

**Shop scoped permissions** (checked against one shop id):

| Permission | Meaning |
|---|---|
| `shop.profile.read` | Read own shop profile |
| `shop.profile.write` | Edit own shop profile, excluding payout destination |
| `shop.staff.manage` | Invite, assign, and remove shop staff |
| `shop.status.manage` | Pause or reactivate own shop |
| `shop.listing.read` | Read own shop listings |
| `shop.listing.write` | Create and edit own shop listings |
| `shop.listing.publish` | Publish or unpublish own shop listings |
| `shop.listing.remove` | Remove own shop listings |
| `shop.inventory.read` | Read own shop stock |
| `shop.inventory.adjust` | Adjust own shop stock for returns, damage, and corrections with a reason |
| `shop.inventory.restock` | Receive new stock into own shop |
| `shop.order.read` | Read own shop orders and shipments |
| `shop.fulfillment.manage` | Move own shop shipments through allowed steps |
| `shop.return.manage` | Respond to returns for own shop items |
| `shop.support.manage` | Read and reply to own shop support cases |
| `shop.money.read` | Read own shop commission and payout statements |

**Platform permissions** (global reach, each role holds only what it needs):

| Permission | Meaning |
|---|---|
| `platform.shop.read` | Read shop records across shops |
| `platform.shop.moderate` | Suspend or reinstate a shop |
| `platform.seller.review` | Approve or reject seller applications |
| `platform.seller.document.read` | Read private seller verification documents |
| `platform.seller.trust.manage` | Grant or revoke trusted seller state |
| `platform.listing.moderate` | Approve, reject, hide, or remove listings |
| `platform.review.moderate` | Hide or remove reviews |
| `platform.category.manage` | Manage the category tree and restriction flags |
| `platform.catalogue.manage` | Manage shared products and attributes |
| `platform.inventory.manage` | Manage CareU inventory |
| `platform.procurement.manage` | Manage supplier receipts |
| `platform.delivery.manage` | Configure delivery and assign CareU deliveries |
| `platform.order.read` | Read orders across shops |
| `platform.order.manage` | Correct order and shipment state with a reason |
| `platform.customer.read` | Read customer contact and profile context |
| `platform.support.manage` | Triage, assign, and resolve support cases |
| `platform.dispute.resolve` | Decide disputes with a recorded reason |
| `platform.refund.request` | Open a refund request |
| `platform.refund.approve` | Approve and process a refund |
| `platform.payment.reconcile` | Read and reconcile payment state |
| `platform.commission.manage` | Configure commission rules |
| `platform.ledger.read` | Read financial ledger entries |
| `platform.payout.manage` | Create and process payout batches, including payout destination and bank data |
| `platform.payout.approve` | Approve a payout batch without changing its destination |
| `platform.cod.reconcile` | Read and reconcile cash on delivery records |
| `platform.audit.read` | Read audit records |
| `platform.cms.manage` | Edit site content through the future CMS |
| `platform.role.manage` | Grant and revoke platform roles (exclusive) |
| `platform.theme.manage` | Change approved theme settings (exclusive) |

### Role bundles

**Shop roles** (the owner bundle holds every shop permission):

| Permission | MANAGER | CATALOGUE | FULFILMENT | SUPPORT |
|---|---|---|---|---|
| `shop.profile.read` | yes | yes | yes | yes |
| `shop.profile.write` | yes | no | no | no |
| `shop.staff.manage` | no | no | no | no |
| `shop.status.manage` | no | no | no | no |
| `shop.listing.read` | yes | yes | no | no |
| `shop.listing.write` | yes | yes | no | no |
| `shop.listing.publish` | yes | yes | no | no |
| `shop.listing.remove` | yes | yes | no | no |
| `shop.inventory.read` | yes | yes | yes | no |
| `shop.inventory.adjust` | yes | no | yes | no |
| `shop.inventory.restock` | yes | no | no | no |
| `shop.order.read` | yes | no | yes | yes |
| `shop.fulfillment.manage` | yes | no | yes | no |
| `shop.return.manage` | yes | no | yes | yes |
| `shop.support.manage` | yes | no | no | yes |
| `shop.money.read` | yes | no | no | no |

`OWNER_BUNDLE` is a code constant counted by the completeness test. It holds all sixteen shop permissions, including `shop.staff.manage` and `shop.status.manage`. Management of payout destination is deliberately outside this catalog and belongs to the settlements feature.

**Platform roles**:

| Permission | PLATFORM_ADMIN | CATALOGUE_PRICING | INVENTORY_PROCUREMENT | DELIVERY_OPERATIONS | CUSTOMER_SUPPORT | FINANCE_SETTLEMENTS | TRUST_MODERATION |
|---|---|---|---|---|---|---|---|
| `platform.shop.read` | yes | yes | yes | yes | yes | yes | yes |
| `platform.shop.moderate` | yes | no | no | no | no | no | yes |
| `platform.seller.review` | yes | no | no | no | no | no | yes |
| `platform.seller.document.read` | yes | no | no | no | no | no | yes |
| `platform.seller.trust.manage` | yes | no | no | no | no | no | yes |
| `platform.listing.moderate` | yes | yes | no | no | no | no | yes |
| `platform.review.moderate` | yes | no | no | no | no | no | yes |
| `platform.category.manage` | yes | yes | no | no | no | no | no |
| `platform.catalogue.manage` | yes | yes | no | no | no | no | no |
| `platform.inventory.manage` | yes | no | yes | no | no | no | no |
| `platform.procurement.manage` | yes | no | yes | no | no | no | no |
| `platform.delivery.manage` | yes | no | no | yes | no | no | no |
| `platform.order.read` | yes | no | no | yes | yes | yes | no |
| `platform.order.manage` | yes | no | no | no | no | no | no |
| `platform.customer.read` | yes | no | no | no | yes | no | no |
| `platform.support.manage` | yes | no | no | no | yes | no | no |
| `platform.dispute.resolve` | yes | no | no | no | yes | no | no |
| `platform.refund.request` | no | no | no | no | yes | no | no |
| `platform.refund.approve` | no | no | no | no | no | yes | no |
| `platform.payment.reconcile` | no | no | no | no | no | yes | no |
| `platform.commission.manage` | no | no | no | no | no | yes | no |
| `platform.ledger.read` | no | no | no | no | no | yes | no |
| `platform.payout.manage` | no | no | no | no | no | yes | no |
| `platform.payout.approve` | no | no | no | no | no | yes | no |
| `platform.cod.reconcile` | no | no | no | no | no | yes | no |
| `platform.audit.read` | yes | no | no | no | no | yes | no |
| `platform.cms.manage` | yes | no | no | no | no | no | no |
| `platform.role.manage` | exclusive | exclusive | exclusive | exclusive | exclusive | exclusive | exclusive |
| `platform.theme.manage` | exclusive | exclusive | exclusive | exclusive | exclusive | exclusive | exclusive |

`SUPER_ADMIN` passes every check and is the only role that holds `platform.role.manage` and `platform.theme.manage`. The exclusive set is checked before role bundles, so adding a permission to a bundle later cannot silently grant an exclusive action.

Role conflict rule: a user cannot hold `CUSTOMER_SUPPORT` and `FINANCE_SETTLEMENTS` at the same time. A grant that would create the combination fails with `ROLE_CONFLICT`. The rule is evaluated against live assignments, so it applies in both directions.

### Resource access matrix

A permission name is only enforceable if it names what it reaches. This matrix is the contract the guards and queries follow.

| Permission | Models and fields it reaches | Notes |
|---|---|---|
| `platform.shop.read` | `Shop` id, name, slug, status, `isFirstParty`, `isTrusted` | No owner contact and no payout destination |
| `platform.customer.read` | `User` name, email, phone; `SavedAddress`; order contact snapshots | Contact data only, no financial records |
| `platform.order.read` | `Order`, `OrderItem`, `Shipment`, status history | No payment amounts, ledger, or commission |
| `shop.order.read` | Own shop `Shipment`, `OrderItem`, recipient and phone snapshots | Needed to deliver, scoped to the shop |
| `platform.payment.reconcile` | `Payment`, `PaymentEvent`, `providerReference` | No bank destination |
| `platform.ledger.read` | `FinancialLedgerEntry` | Read only |
| `platform.payout.manage` | `PayoutBatch`, `PayoutItem`, `destinationRef` | Bank and wallet destination data lives here |
| `platform.payout.approve` | Payout amounts and status | Cannot change `destinationRef` |
| `platform.seller.document.read` | `SellerVerificationDocument` storage key and metadata | Private media, access logged |
| `shop.money.read` | Own shop ledger and payout summaries | No `destinationRef` |
| `platform.commission.manage` | `CommissionRule` | Rates remain pending policy |
| `platform.cod.reconcile` | `CODReconciliationRecord`, courier and evidence references | No automatic shortage classification |
| `platform.audit.read` | `AuditLog` | Secrets and personal data stay masked |
| `shop.inventory.read` / `adjust` / `restock` | Own shop `InventoryBalance`, `StockMovement` | Scoped by the shop's stock locations |
| `shop.listing.read` / `write` / `publish` / `remove` | Own shop `Listing`, `ListingVariant`, `ListingMedia` | Scoped by `shopId` |
| `platform.category.manage` / `platform.catalogue.manage` | `Category`, `CategoryAttribute`, `Product`, `ProductVariant` | Shared catalogue definitions |
| `platform.support.manage` | `SupportCase`, `SupportMessage` including internal notes | Customer visible and internal messages stay distinct |

Sensitive field rule: payout destination and bank data are reachable only through `platform.payout.manage`. Payment provider references are reachable only through `platform.payment.reconcile`. Customer support holds neither, so its cross shop reach never exposes money movement or bank details.

### CareU shop reach

Platform roles act on the shop with `isFirstParty = true` through this mapping. Seller shops are never reachable through these shop scoped permissions; platform reach over seller shops only comes from `platform.*` permissions.

| Platform role | Shop permissions on the CareU shop |
|---|---|
| `PLATFORM_ADMIN` | `shop.profile.read`, `shop.listing.read`, `shop.listing.write`, `shop.listing.publish`, `shop.listing.remove`, `shop.inventory.read`, `shop.inventory.adjust`, `shop.inventory.restock`, `shop.order.read`, `shop.fulfillment.manage`, `shop.return.manage`, `shop.support.manage` |
| `CATALOGUE_PRICING` | `shop.listing.read`, `shop.listing.write`, `shop.listing.publish`, `shop.listing.remove`, `shop.inventory.read` |
| `INVENTORY_PROCUREMENT` | `shop.inventory.read`, `shop.inventory.adjust`, `shop.inventory.restock`, `shop.listing.read` |
| `DELIVERY_OPERATIONS` | `shop.order.read`, `shop.fulfillment.manage`, `shop.return.manage` |
| `CUSTOMER_SUPPORT` | `shop.order.read`, `shop.return.manage`, `shop.support.manage` |
| `FINANCE_SETTLEMENTS` | `shop.order.read`, `shop.money.read` |
| `TRUST_MODERATION` | `shop.listing.read` |
| `SUPER_ADMIN` | all shop permissions |

No platform role receives `shop.staff.manage` or `shop.status.manage` on the CareU shop through this mapping. CareU shop ownership and platform role management stay separate.

### Authorization decisions and denial

One evaluator produces an `AuthorizationDecision` union, and thin adapters render it for each caller type. Guards never throw an untyped error at the boundary.

| Decision | Route handler | Server action | Notes |
|---|---|---|---|
| `ALLOW` | continue | continue | Actor context returned |
| `REDIRECT_LOGIN` | 302 to login with return path | typed `UNAUTHENTICATED` result | No session |
| `FORBIDDEN` | 403 | typed `FORBIDDEN` result | Authenticated but denied |
| `NOT_FOUND` | 404 | typed `NOT_FOUND` result | Resource outside actor scope |
| `CONTACT_UNVERIFIED` | 403 | typed `CONTACT_UNVERIFIED` result | Platform role holder without verified email or phone |
| `SHOP_UNAVAILABLE` | 403 | typed `SHOP_UNAVAILABLE` result | Action denied by shop status gate |

The login return path is validated by `safeReturnPath(raw)`: accept only a path that starts with a single `/`, reject `//`, a backslash, any absolute URL, and encoded variants, and fall back to the locale home. This prevents open redirects through the login hop.

Audit action names are constants in `lib/authz/audit-actions.ts`, for example `platform.role.grant`, `platform.role.revoke`, `shop.membership.assign`, `shop.membership.remove`, and `shop.status.change`. No free text action names reach `AuditLog`.

### Shop status gate

Shop scoped checks consult `Shop.status` after the permission check. Platform permissions are never gated by a seller shop's status.

| Permission group | ACTIVE | PAUSED | SUSPENDED |
|---|---|---|---|
| `shop.profile.read` | allow | allow | allow |
| `shop.profile.write` | allow | allow | deny |
| `shop.listing.read` | allow | allow | allow |
| `shop.listing.write` | allow | allow | deny |
| `shop.listing.publish` | allow | deny | deny |
| `shop.listing.remove` | allow | allow | deny |
| `shop.inventory.read` | allow | allow | allow |
| `shop.inventory.adjust` | allow | allow | allow |
| `shop.inventory.restock` | allow | deny | deny |
| `shop.order.read` | allow | allow | allow |
| `shop.fulfillment.manage` | allow | allow | allow |
| `shop.return.manage` | allow | allow | allow |
| `shop.support.manage` | allow | allow | allow |
| `shop.money.read` | allow | allow | allow |
| `shop.status.manage` | allow | allow | allow |

The owner may unpause a PAUSED shop. Lifting a SUSPENDED shop requires `platform.shop.moderate`, not `shop.status.manage`. Return and damage adjustments stay allowed in both states so already placed orders can still complete.

### State transitions

- `PlatformRoleAssignment`: none → live (grant) → revoked (terminal). A revoked row is never edited back to live; a new grant creates a new row, so history stays append only.
- `ShopMembership`: none → INVITED → ACTIVE → REMOVED. INVITED → REMOVED cancels an invitation. REMOVED is terminal for that row. Re inviting creates a new row, allowed by the partial unique index.
- Shop pause or suspension does not change membership status. It gates a class of actions at check time, per the shop status gate above.

### API surface

This feature ships server helpers and domain operations, not public HTTP endpoints. The Next.js server actions and route handlers added by later slices call these.

| Operation | Shape | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `getActor` | server function, request memoized | none | `{ userId, platformRoles, verifiedContact }` or null | session | none, returns null when signed out |
| `requirePlatformPermission` | guard, returns decision and actor | `permission: PlatformPermission` | actor context plus platform roles | session + platform role | `UNAUTHENTICATED`, `FORBIDDEN`, `CONTACT_UNVERIFIED` |
| `requireShopPermission` | guard, returns decision and actor | `shopId: string, permission: ShopPermission` | actor context plus resolved shop role | session + shop scope | `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `SHOP_UNAVAILABLE` |
| `requireOwnership` | guard, returns decision and owner | `ownerUserId: string` | actor context | session + ownership | `UNAUTHENTICATED`, `NOT_FOUND` |
| `can` | non throwing check for UI hints | `permission, shopId?` | `AuthorizationDecision` | session | none |
| `grantPlatformRole` | server action | `targetUserId, role, reason?` | assignment id | super admin | `FORBIDDEN`, `SELF_GRANT`, `TARGET_UNVERIFIED`, `TARGET_NOT_FOUND`, `ROLE_CONFLICT`, `DUPLICATE` |
| `revokePlatformRole` | server action | `assignmentId, reason` | void | super admin | `FORBIDDEN`, `LAST_SUPER_ADMIN`, `NOT_FOUND` |
| `approveRefund` | server action | `refundId, reason` | refund id and status | finance | `FORBIDDEN`, `SELF_APPROVAL`, `NOT_FOUND` |
| `approvePayoutBatch` | server action | `payoutBatchId, reason` | batch id and status | finance | `FORBIDDEN`, `NOT_FOUND` |
| `assignShopRole` | server action | `shopId, targetUserId, role` | membership id | shop owner | `FORBIDDEN`, `NOT_OWNER`, `OWNER_CANNOT_BE_ASSIGNED`, `ALREADY_ACTIVE`, `NOT_FOUND` |
| `removeShopMembership` | server action | `shopId, membershipId, reason` | void | shop owner | `FORBIDDEN`, `OWNER_CANNOT_BE_REMOVED`, `NOT_FOUND` |
| `effectiveShopPermissions` | read function | `userId, shopId` | permission set | internal | none |

`requireShopPermission` resolves the shop scope from the trusted session and the resource being touched. A caller may pass a shop id only after the resource has been loaded and its `shopId` compared against the actor's access. Passing a client supplied shop id straight into the guard is a defect, and the guard API documents that. `can` calls the same evaluator as the guards, so UI hints and enforcement cannot drift.

### Value sourcing

| Action | Value produced / displayed | Source |
|---|---|---|
| All guards | Acting user id | `auth.api.getSession({ headers })` in the route handler or server action, per `AGENTS.md` |
| Platform permission check | Live platform roles | `PlatformRoleAssignment` rows for the user where `revokedAt` is null |
| Shop permission check | Shop role | `ShopMembership` row for `(shopId, userId)` where `status = ACTIVE` |
| Shop permission check | Owner authority | `Shop.ownerUserId` equals the acting user id |
| Shop permission check | CareU shop mapping | `Shop.isFirstParty = true` row plus the role mapping table above |
| Effective permissions | Permission set | Code catalog mapping resolved roles to permissions |
| Shop action gate | Shop state | `Shop.status` |
| Denial response | Which decision to return | Guard outcome: no session, denied permission, unverified contact, shop state, or resource outside actor scope |
| Login return path | Validated relative path | Request parameter passed through `safeReturnPath`, falling back to the locale home |
| Denial log | Actor, permission, scope, request id | Session actor, permission constant, resolved scope, request id from the request |
| Grant and revoke | Granting actor, source, and time | Session actor plus `grantSource = ADMIN`; `grantSource = BOOTSTRAP` with a null actor for the script; `grantedAt` or `revokedAt` default now |
| Revocation guard | Live super admin count | `SELECT ... FOR UPDATE` over `PlatformRoleAssignment` rows with role `SUPER_ADMIN` and `revokedAt` null, counted inside the same transaction |
| Role conflict check | Conflicting live roles | Live assignments for the target user, read inside the grant transaction |
| Refund approval guard | Refund requester | `Refund.requestedByUserId` |
| Staff change | Changing actor and time | Session actor, `acceptedAt` or `removedAt` |
| Re invite after removal | Allowed or not | Partial unique index on `(shopId, userId)` where status is not REMOVED |
| Verified contact gate | Verified email or phone | `User.emailVerified` or `User.phoneNumberVerified` |
| Bootstrap | Target super admin user | `PLATFORM_SUPER_ADMIN_EMAIL` matched against `User.email` |
| Bootstrap outcome | Exit code and audit record | Grant result: success writes a `BOOTSTRAP` assignment and system audit record, failure exits non zero |
| Audit record | Actor scope and action name | `platform` or the shop id, plus a constant from `lib/authz/audit-actions.ts` |
| Role value | Valid role key | `PlatformRole` and `ShopRole` enum values |

### Key invariants

- Every protected server entry point calls a guard before reading or mutating protected data. Server actions and route handlers enforce; layouts and components may only hide UI.
- No client supplied role, permission, shop id, seller id, or admin flag is trusted. Scope comes from the session plus database lookups, or from a loaded resource whose owner is verified.
- Permissions are never stored in the session cookie. The 5 minute cookie cache is for user display only.
- Super admin passes all checks. The exclusive set (`platform.role.manage`, `platform.theme.manage`) is checked before bundles and can never be granted to another role.
- The last live super admin cannot be revoked. The revocation transaction locks the live `SUPER_ADMIN` rows with `SELECT ... FOR UPDATE`, counts them, then revokes, so two concurrent revocations cannot empty the role.
- Nobody can grant themselves a platform role. A grant requires the target to have a verified email or phone.
- A user cannot hold `CUSTOMER_SUPPORT` and `FINANCE_SETTLEMENTS` together. The conflict check and the grant share one transaction.
- An INVITED membership grants nothing. Only ACTIVE grants its role. A REMOVED row is never revived, and re inviting inserts a new row.
- The owner never holds a membership row and cannot be removed from their own shop.
- Platform role assignment and revocation, and shop membership changes, write to the existing `AuditLog` with actor, target, action, and reason where required. Audit writes happen in the same transaction as the change.
- A denied authorization never returns another shop's record. Cross shop lookups return 404. Authenticated denials return 403. Signed out callers receive the login decision with a validated return path.
- Platform permissions reach seller shops only where the permission is explicitly platform scoped. Shop scoped permissions from platform roles reach only the CareU shop.
- A paused or suspended shop allows read and fulfilment of existing orders, including return and damage adjustments, and denies new selling and restock actions, per the shop status gate.
- Exactly one first party shop exists, guaranteed by the existing partial unique index. Resolving it assumes feature 4 has provisioned it; when no first party shop exists, the CareU mapping fails closed with a configuration error logged for operators.
- The permission catalog, role bundles, owner bundle, and CareU mapping are the only source of role meaning. No database row can add a permission to a role.
- `can` and every guard share one evaluator, so a UI hint can never disagree with enforcement.

### Security model

Access is deny by default. A caller with no resolved permission is denied, and the guard must be called explicitly; there is no ambient access.

- Customer data: readable by the owning customer through `requireOwnership`, or by a platform actor holding the matching platform permission (`platform.customer.read`, `platform.order.read`, `platform.support.manage`). Ownership checks happen on every read, not only on write.
- Shop data: readable and writable only by the shop owner, an ACTIVE member holding the matching `ShopRole`, or a platform actor whose permission reaches the shop. Customer support reads order and case context across shops by design and holds no financial permission.
- Financial data: payment reconciliation, ledger, commission, payouts, and cash on delivery reconciliation are reachable only through finance permissions. `platform.refund.approve` and `platform.payout.approve` are separated from requesting, self approval of a refund is denied, and support and finance roles cannot be combined in one user.
- Bank and destination data: only `platform.payout.manage` reaches `PayoutBatch.destinationRef` and `PayoutItem.destinationRef`. `platform.payout.approve` sees amounts and status but cannot change the destination.
- Private documents: seller verification documents are reachable only through `platform.seller.document.read`. Media access itself is defined by the media storage spec.
- Sensitive actions always write an audit record with actor and reason. This includes role changes, membership changes, shop suspension, seller trust changes, listing moderation, refunds, payouts, stock adjustments, and commission rule changes.
- Denial logging records actor, permission, scope, and request id. It never records the contents of the denied record or customer personal data.
- Privileged sign in requires a verified email or phone. Two factor authentication for platform staff is a recorded follow up, not part of this build.
- Rate limiting beyond Better Auth defaults applies to the role management actions and the bootstrap script path. Better Auth already rate limits the OTP endpoints.

### Configuration required

- `PLATFORM_SUPER_ADMIN_EMAIL`: the email of the user who receives the first `SUPER_ADMIN` assignment when the bootstrap script runs. Never hardcoded, never committed with a real value.

### Critical test scenarios

- Happy path: a super admin grants a platform role to a verified user, that user passes a matching platform guard, the CareU shop mapping lets them act on the first party shop, and shop staff pass only their own shop guard, verifies **AC-1**, **AC-2**, **AC-3**, **AC-6**.
- Happy path: an owner invites a member with a shop role, the invite grants nothing until ACTIVE, and after the status changes only the bundle permissions pass, verifies **AC-8**.
- Failure case: revoking the only live super admin is rejected, revoking one of two succeeds, and two concurrent revocations cannot empty the role, verifies **AC-6**.
- Failure case: a role revoked in the database stops working on the next request even though the session cookie still holds cached user data, verifies **AC-5**.
- Failure case: a removed member can be invited again as a new row while the old removed row stays for history, verifies **AC-1**, **AC-8**.
- Auth/permission case: signed out receives the login decision, an authenticated user without the permission gets 403, a shop resource id from another shop gets 404, and a return path like `//evil.example` is rejected, verifies **AC-4**.
- Auth/permission case: customer support reads an order across shops but is denied payment, ledger, commission, payout, and bank fields, finance cannot approve a refund it requested, and the support plus finance combination is rejected, verifies **AC-9**.
- Auth/permission case: a user without `platform.payout.manage` cannot read `destinationRef` even when holding `platform.payout.approve`, verifies **AC-9**.
- Suspension case: staff of a paused or suspended shop can still read and fulfil an existing order and adjust stock for a return, but cannot publish a listing or restock, and platform roles on the CareU shop still work, verifies **AC-10**.
- Bootstrap case: the script refuses to run without the environment variable, does nothing and exits non zero when the user is missing or unverified, grants once with a system audit record, and reruns without duplicating, verifies **AC-7**, **AC-11**.

## Build plan

The project uses Tracer Bullet. At this point no protected marketplace surface exists yet, so the thin end to end thread is the role management action itself: catalog, schema, actor resolution, one real guard, one real protected mutation, audit, bootstrap, and tests proving allow and deny. Later slices then call the same helpers instead of inventing checks.

1. Add `PlatformRole`, `PlatformRoleGrantSource`, and `ShopRole` enums, the `PlatformRoleAssignment` model, the `ShopMembership` role and lifecycle fields, relations, and indexes. Create the migration, including the partial unique indexes for live assignments and live memberships, replace the old membership unique index, and generate the client. satisfies **AC-1**.
2. Write the typed permission catalog, role bundles, `OWNER_BUNDLE`, exclusive set, CareU shop mapping, and resource access matrix in `lib/authz/`, with a compile time and unit test that every permission belongs to a bundle, the owner bundle, or the exclusive set. satisfies **AC-2**.
3. Implement `getActor` and effective access resolution: session read, live platform assignments, ACTIVE shop membership, owner derivation, verified contact, the CareU shop mapping, and the shop status gate. Memoize within the request and fail closed when the CareU shop is missing. satisfies **AC-3**, **AC-7**, **AC-10**.
4. Implement the evaluator and guards: `requirePlatformPermission`, `requireShopPermission`, `requireOwnership`, and `can`, returning the `AuthorizationDecision` union, with route handler and server action adapters, validated return paths, typed errors, and structured denial logging. satisfies **AC-4**, **AC-5**.
5. Implement `grantPlatformRole` and `revokePlatformRole` with super admin only checks, self grant denial, verified target check, role conflict check, last live super admin protection using row locks inside one transaction, reason requirement, and `AuditLog` writes with constant action names. satisfies **AC-6**, **AC-7**, **AC-9**.
6. Implement `assignShopRole` and `removeShopMembership` owned by the shop owner only, rejecting owner membership rows and live duplicates, allowing re invite after removal, with reason requirement and `AuditLog` writes. Feature 5 owns the invitation UI and acceptance flow. satisfies **AC-8**.
7. Implement `approveRefund` with the self approval guard sourced from `Refund.requestedByUserId`, and `approvePayoutBatch` with destination changes denied to approvers. satisfies **AC-9**.
8. Add the bootstrap script behind `PLATFORM_SUPER_ADMIN_EMAIL`, idempotent, requiring an existing user with a verified contact, granting with `grantSource = BOOTSTRAP` and a system audit record, exiting non zero on failure, and document the environment variable. satisfies **AC-11**.
9. Wire the guards into one real protected server entry point (the role management action and its route handler), add the localized 403 page and signed out redirect with return path, and add the probe, revocation, conflict, and locked revocation tests. satisfies **AC-4**, **AC-5**, **AC-6**, **AC-9**.
10. Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`, and record the results. satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-8**, **AC-9**, **AC-10**, **AC-11**.

## Consequences

**Positive**:
- One catalog and one set of guards give every later slice a single, reviewable way to check access instead of scattered role name comparisons.
- Role meaning stays in code review while assignment stays operational, so access changes never require a deploy and permission changes never happen silently.
- Immediate revocation and database backed resolution close the usual stale permission gap from session caching.
- The platform and shop permission split, the resource access matrix, and the confirmed support and finance separation keep financial and bank data away from operational and support staff.
- One evaluator with two adapters keeps route handlers, server actions, and UI hints consistent.

**Negative / tradeoffs**:
- Every protected entry point needs a guard call, which is easy to forget; the build relies on review and tests until a lint rule or wrapper exists.
- Reading roles from the database on every protected request adds one or two queries; acceptable at this scale, and it is the price of immediate revocation.
- The permission catalog is larger than the suggested range (45 permissions), because the domain actions for money, moderation, and shop operations are genuinely distinct.
- The decision union and its two adapters are more code than throwing errors, and the extra structure must be learned once and used consistently.
- The partial unique index on live memberships replaces a constraint already in the schema, so the migration must drop the old index and any placeholder rows must be cleared.
- Platform staff acting on the CareU shop through a role mapping means CareU shop authority is split between ownership and platform role, which is less obvious than a single membership row.

**Neutral**:
- Feature 5 owns invitations and shop lifecycle screens; this spec only supplies the membership role model and the assignment helpers it will call.
- The CMS and theme permissions exist in the catalog but gate features that land later; until those features exist, the permissions are declared and tested, not exercised.
- Feature 4 owns provisioning the CareU shop; the guards assume it exists and fail closed until it does.
- Two factor authentication for platform staff stays an open follow up rather than being built now.

## Follow-up

- [ ] Feature 4 must provision the single first party CareU shop and its owner; authz resolution fails closed until it exists.
- [ ] Decide and build two factor authentication for platform staff accounts; privileged access currently depends on phone or email verification only.
- [ ] Decide what happens when a platform role holder loses email and phone verification, since the role silently stops working; consider blocking de verification while a live platform role exists.
- [ ] Add a lint rule or a wrapper type that makes an unguarded protected server action fail review, once the first few slices show the common call shape.
- [ ] Consider an access review report for periodic checks of who holds which platform role, likely alongside analytics.
- [ ] Feature 5 must implement the shop staff invitation and acceptance flow on top of the membership model defined here.
- [ ] Record `platform.cms.manage` and `platform.theme.manage` ownership details in the CMS and theme specs; this spec only reserves them.
- [ ] Revisit per shop scoping for platform staff if branch operations or regional support teams need it; this spec grants global reach with narrow permissions.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

# 0002. Roles, permissions, and access control: rationale

## Context

CareU.bd already has identity: Better Auth handles phone and email one time codes, sessions, and DB backed rate limiting. The marketplace domain spec (spec 0001) added the records access control must protect: shops with one owner, shop memberships with a placeholder role string, first party and third party shops, customer owned orders and addresses, private seller documents, financial ledger entries, payouts, and an append only audit log. What does not exist is a way to decide who may read or change any of it. Every later slice, from seller onboarding to payouts, would otherwise invent its own check, and the first cross shop leak would be found in production.

The forces at play are strict. The project rules already say authorization is enforced on the server for every protected operation, that client supplied roles and shop ids are never trusted, that shop scoped staff must not reach another shop, that support permissions are separate from financial permissions, and that sensitive actions are audited. Financial separation is a product promise: CareU first party sales create no seller commission or payout liability, so the permission model must not blur platform staff reach and seller scope either. Local development runs Postgres 16 compatible SQL on Neon in production, so partial unique indexes are available.

The team is small and the roadmap is long. The model has to be simple enough to operate without a dedicated security engineer, precise enough for the confirmations in `AGENTS.md`, and additive enough that later slices can add one permission without redesigning anything. The cost of not deciding is concrete: either a permissive default appears under delivery pressure, or every slice grows a different home grown role check.

## Options considered

### Option 1: Own typed catalog and guards on Prisma (chosen)

Define permissions as typed constants in `lib/authz/`, build fixed role bundles from them, store only assignments and memberships in Prisma, and expose guard helpers that resolve the actor from the session plus the database. Better Auth continues to own identity and session only.

**Pros**:
- One source of truth aligned with the shop and membership records that already exist.
- Full control over shop scope, the CareU first party mapping, and the exact denial behaviour.
- Role meaning is reviewed in code; assignment is a database operation.
- No new service, no second tenancy model, and no extra runtime.

**Cons**:
- We own the guard code, the tests, and the audit wiring.
- Entry points must remember to call a guard; nothing enforces that mechanically at first.

### Option 2: Better Auth access control API

Use Better Auth's `createAccessControl`, statements, and `hasPermission` with the existing session and Prisma adapter.

**Pros**:
- Less custom code, and it ships with the auth library already in use.
- A documented permission statement format, useful if the team already knows it.

**Cons**:
- It adds a second representation of roles and statements beside our Prisma enums and bundles.
- Shop scope, owner derivation, and the CareU shop mapping still need our own code, so the custom work does not disappear.
- The permission check is session shaped, which pushes toward embedding roles in the session and weakening immediate revocation.

### Option 3: Better Auth organization plugin

Model each shop as a Better Auth organization and use its members, roles, invitations, and dynamic access control.

**Pros**:
- Invitation and member management plumbing comes with the plugin.
- Custom roles and statements are supported.

**Cons**:
- It duplicates `Shop` and `ShopMembership`, which the marketplace schema already owns, and the two models must be kept in sync.
- The one shop per owner rule, first party flag, suspension semantics, and payout separation do not map cleanly onto organizations.
- Platform roles are global and do not fit the organization member model at all.

### Option 4: External policy engine

Run Cerbos, Oso, or Permit.io as a policy engine and ask it on each sensitive action.

**Pros**:
- Strong policy language, central policy review, and good tooling for complex rules.
- Policies can be changed without a deploy.

**Cons**:
- A new service or sidecar to deploy, monitor, and secure, for eight platform roles and four shop roles.
- Policy inputs still come from our database, so the data loading and scope work remains.
- Runtime policy changes are the opposite of the decided review model; role meaning would drift out of code review.

## Rationale

The shop and membership records already live in Prisma, and the product rules already describe scope in those terms. Option 1 keeps the permission layer where the data is, so there is one place to read, one place to test, and one place to audit. The other three options each add a second representation of the same idea: Better Auth statements, organization members, or external policies. A second representation is a second thing to keep in sync, and the failure mode is exactly the one this feature exists to prevent, a check that disagrees with the data.

Immediate revocation settled the session question. The session cookie cache stays for user display, as `AGENTS.md` requires, but access is read from the database on each protected request. That costs one or two indexed queries per request, which is acceptable at this scale, and it removes the class of bug where a removed finance user keeps approving payouts for five minutes.

The fixed bundle model is deliberately less flexible than runtime roles. With four shop roles and eight platform roles, the operational benefit of inventing roles at runtime is small, while the cost is real: every screen must handle unknown roles, and permissions stop being reviewable in a pull request. The catalog still grows with the roadmap; adding a permission is a code change with tests, which is the right amount of friction for access control.

The CareU shop mapping resolves the awkward case. CareU staff are not seller staff and should not need membership rows on CareU's own shop, but they still need to publish products, move stock, and fulfil orders. Mapping each platform role to the shop permissions it needs on the first party shop keeps one action vocabulary while leaving seller shops unreachable through shop scoped permissions. Support reach across seller shops is then explicit and narrow, which matches the confirmed separation of support and finance.

## Sub decisions

- **Role keys in enums, not a role table**: the database cannot invent a role, and TypeScript catches typos. A table seeded from code would only add a sync step.
- **One platform assignment table with revoke history**: removal keeps who had what, which matters for finance and trust roles. Current access is the rows with no revoke time.
- **No per member permission overrides**: access is exactly the bundle. Any exception becomes a role change, so review stays simple and support cannot quietly gain refund approval.
- **One shop role per membership**: a person who needs two jobs gets a second membership in a later slice if the need is real; the effective permission set stays obvious.
- **45 permissions at domain action level**: the money, moderation, and shop operation actions are genuinely distinct. The catalog is intentionally additive; later slices add permissions rather than widening existing ones. The count is deliberately larger than the range the architect skill suggests as comfortable, because collapsing restock into a general stock adjustment would let a fulfilment role receive inventory it has no business receiving.
- **Super admin is implicit all access plus an exclusive set**: one built in safety valve, and two actions (role management and theme) that no bundle can ever hold.
- **Deny with 403, hide other tenants with 404**: authenticated users get a clear answer, while cross shop probes cannot confirm that a record exists.
- **One `AuthorizationDecision` union with thin adapters, not thrown errors**: route handlers and server actions must render denial differently (302 versus a typed result), and an untyped thrown error loses the distinction between forbidden, missing, and unverified entirely. Keeping one evaluator behind two adapters also stops the UI hint path (`can`) from drifting away from enforcement.
- **Partial unique indexes for live rows, not a status column in the key**: revocation and membership removal are append only histories, so `UNIQUE ("userId", "role") WHERE "revokedAt" IS NULL` and `UNIQUE ("shopId", "userId") WHERE "status" <> 'REMOVED'` express "one live row" while letting history accumulate. Prisma cannot express either, so they are hand authored in the migration, which is the project's existing pattern for constraints it cannot model.
- **Bootstrap grants are attributable but actorless**: the first super admin cannot be granted by a super admin, so `grantedByUserId` is nullable and `grantSource = BOOTSTRAP` marks the one system path. Keeping a separate source enum rather than a magic sentinel user means an audit query can tell a scripted grant from a human one without joining a placeholder account.
- **The support and finance conflict is enforced, not just documented**: `AGENTS.md` requires support and financial permissions to stay separate, and one user holding both would defeat every per-role split in this spec. Rejecting the combination at grant time is cheaper than discovering after an incident that a single account could approve its own refund request.

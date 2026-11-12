# Authorization library — `lib/authz/`

## Overview

Server-side authorization for roles, permissions, and access control (spec 0002). This area owns the typed permission catalog, role bundles, actor resolution, authorization decisions, guards, and audited server actions. Every protected operation must resolve the actor and scope from the trusted session and database, never from client input.

## Key files

| File | Owns |
|---|---|
| `permissions.ts` | Typed shop and platform permission constants (`scope.domain.action`) |
| `roles.ts` | Shop/platform role bundles, `OWNER_BUNDLE`, super admin exclusive set, CareU shop permission mapping, conflict rules, resource access matrix |
| `decision.ts` | `AuthorizationDecision` union, decision helpers, and `safeReturnPath` validation |
| `actor.ts` | `getActor()` request-memoized actor resolution from session + live DB role/membership/verification data |
| `evaluate.ts` | Pure/platform and shop authorization evaluation, ownership checks, effective shop permissions, shop status gate, denial logging |
| `guards.ts` | `requirePlatformPermission`, `requireShopPermission`, `requireOwnership`, `can`, and route/server-action adapters |
| `actions.ts` | Audited server actions: platform role grant/revoke, shop membership assign/remove, refund approval, payout batch approval (with authz, invariant, and rate-limit checks) |
| `audit-actions.ts` | Constant audit action names for `AuditLog` |
| `rate-limit.ts` | DB-backed rate limiting for role management actions and bootstrap using the `rateLimit` table |
| `index.ts` | Barrel exports |

## Conventions

- Derive actor, roles, shop scope, and permissions from the trusted session and database on every protected read/write. Never trust client-supplied `role`, `shopId`, `sellerId`, `isAdmin`, or permissions.
- Permissions are never stored in the session cookie cache. `getActor()` reads live assignments/memberships and contact verification from the database.
- Guards return typed `AuthorizationDecision` values (allow, redirect login, forbidden, not found, contact unverified, shop unavailable). Cross-shop/out-of-scope access returns `NOT_FOUND`; an authenticated in-scope actor lacking permission returns `FORBIDDEN`.
- Platform role holders must have a verified email or phone. Super admin passes checks except exclusive handling is enforced by the catalog/rules; `platform.role.manage` and `platform.theme.manage` are exclusive.
- Shop-scoped checks apply the shop status gate; platform permissions are not gated by seller shop status. CareU first-party shop access for platform roles uses the explicit mapping in `roles.ts`.
- Sensitive mutations (role grants/revocations, membership changes, approvals) run in transactions with audit records and rate limiting where required. Keep actions idempotent/safe under concurrency (e.g. last-super-admin revocation lock).

## Related

- Spec: [docs/specs/0002-roles-permissions-access-control/index.md](../../docs/specs/0002-roles-permissions-access-control/index.md)
- Schema: `prisma/schema/rbac.prisma`, `prisma/schema/enums.prisma`, `prisma/schema/seller.prisma`, `prisma/schema/auth.prisma`
- Migration: `prisma/migrations/20261112103000_roles_permissions_access_control/`
- Protected probe: `app/api/authz/roles/route.ts`
- Bootstrap: `scripts/bootstrap-super-admin.ts` (requires `PLATFORM_SUPER_ADMIN_EMAIL`)

_Drafted by /sync from the introducing change, worth a quick human pass._

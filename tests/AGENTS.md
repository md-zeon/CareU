# Tests — `tests/`

## Overview

The test suite uses Node 24's built-in test runner with native TypeScript type stripping. No test framework dependency is needed. `tests/README.md` is the authoritative registry for the seven project-wide acceptance gates.

## Key files

| File | Owns |
|---|---|
| `README.md` | Acceptance gate registry (T1–T7), rules, ownership table, running instructions |
| `money.test.ts` | T1 — Money and rounding (implemented and passing) |
| `acceptance-gates.test.ts` | T2–T7 — T2 implemented with real tests; T3–T7 declared as skipped stubs until their owning milestones replace them with real tests |
| `marketplace-domain-model.test.ts` | Schema contract for spec 0001: money storage, snapshots, status separation, scope anchors, idempotency and the migration guards |
| `authz-catalog.test.ts`, `authz-milestone5.test.ts`, `authz-access-control.test.ts` | Authz behavior, catalog/role bundles, and access control tests for spec 0002 |

## Commands

```bash
npm run test
# Runs: node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test "./tests/**/*.test.ts"
```

## Conventions

- Tests use `node:test` (`describe`, `test`) — no jest, vitest or other framework.
- TypeScript is stripped natively by Node 24. No `tsx`, no `ts-node`, no compile step.
- Money tests (and any test of money primitives) import from `lib/money/` directly — the module is dependency-free for exactly this reason.
- Database-backed tests (T2–T7) need a local Postgres and per-run schema or transaction isolation. No shared test database state.
- A skipped gate is not a satisfied gate. `npm run test` passing with skipped T3–T7 does not mean those gates are satisfied — read the skip count. See D-19.

## Acceptance gates

| Group | Area | Status |
|---|---|---|
| T1 | Money and rounding | Implemented (`money.test.ts`) |
| T2 | Authorization and scope isolation | Implemented (`tests/acceptance-gates.test.ts`, `tests/authz-*.test.ts`) |
| T3 | Concurrent inventory reservations | Pending — Inventory and checkout milestone |
| T4 | Payment idempotency | Pending — Payments milestone |
| T5 | Double-entry ledger | Pending — Financial ledger milestone |
| T6 | Refunds | Pending — Returns, refunds and disputes milestone |
| T7 | Payouts | Pending — Commission, earnings and settlement milestone |

## Gotchas

- Gates T2–T7 must cover the **failure path** (concurrency, replay, over-refund, cross-tenant access) not only the happy path. A test that asserts a mock's own configuration proves nothing. T2 is implemented for the authz foundation; remaining gates still need real tests.
- Each gate must be implemented with real tests against real behaviour before the milestone that owns it is called done. See `AGENTS.md` (root) for which milestones require a passing gate before a change is considered done.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._


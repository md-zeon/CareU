# Behavioural test groups (project-wide acceptance gates)

CareU.bd has **seven behavioural test groups**. They are project-wide
acceptance gates: any milestone that touches an area covered by a group must
have that group's tests implemented and passing before the milestone can be
called done.

| Group | Area | Requirements | Owner milestone | Status |
|---|---|---|---|---|
| T1 | Money & rounding | §5, §8, §9 | Test runner + money foundation | **implemented** (`tests/money.test.ts`) |
| T2 | Authorization & scope isolation | §1, §2 | Identity, accounts and access control | **implemented** (`tests/acceptance-gates.test.ts`, `tests/authz-*.test.ts`) |
| T3 | Concurrent inventory reservations | §4, §5 | Inventory, cart and checkout | pending |
| T4 | Payment idempotency | §7 | Payments | pending |
| T5 | Double-entry ledger | §8.4 | Financial ledger | pending |
| T6 | Refunds | §10 | Returns, refunds, disputes and support | pending |
| T7 | Payouts | §8 | Commission, earnings, settlement and payouts | pending |

## Rules

- **A skipped gate is not a satisfied gate.** T3–T7 are currently declared as
  skipped tests in `tests/acceptance-gates.test.ts` so the registry is
  visible in the test run. The owning milestone must replace each skip with
  real tests. `npm run test` passing does **not** mean T3–T7 are satisfied —
  read the skip count. T2 is implemented.
- A group is implemented with **real tests against real behaviour**, not
  mocks of the behaviour under test. A test that asserts the mock's own
  configuration proves nothing.
- Each group must cover the **failure** path, not only the happy path:
  concurrency, replay, over-refund, cross-tenant access and negative balances
  are the cases that matter.
- Gates that touch permissions, inventory, payments, orders, refunds or
  commissions must pass before the change is "done" (AGENTS.md).

## Running

```bash
npm run test
```

Node's built-in test runner executes `tests/**/*.test.ts` through Node's
native TypeScript stripping. There is no test-framework dependency.

## Scope note

M0 delivered the runner, the integer-poisha money foundation and this registry.
T2 (authorization and scope isolation) is now implemented for the authz
foundation. T3–T7 remain unimplemented and must not be implemented ahead of
their owning milestones.

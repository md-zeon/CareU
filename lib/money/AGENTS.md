# Money library — `lib/money/`

## Overview

All monetary values in CareU.bd are `bigint` poisha (1 BDT = 100 poisha). This folder holds the dependency-free primitives that every domain area imports for arithmetic, rounding, allocation, and discount computation. It has no server-only imports and no path aliases so the Node built-in test runner and CLI contexts can load it directly.

## Key files

| File | Owns |
|---|---|
| `poisha.ts` | The canonical `Poisha = bigint` type; `bdtToPoisha`, `poishaToBdtString`, `sumPoisha`, `multiplyPoisha`, `applyBps`, `roundHalfUp` |
| `allocation.ts` | `largestRemainderAllocate` (proportional split with deterministic tie-break by ascending id); `splitByWeight` (two-party split, ties resolve to `first`) |
| `discount.ts` | `allocateDiscount` (full pipeline: allocate across lines, split CareU/seller funding, derive `commissionBase` and `grossAmount`); `computeCommissionAmount`; `aggregateSellerOrder` |
| `index.ts` | Barrel re-export; import from here, not individual files |

## Conventions

- Every monetary column is `bigint` poisha. Never `number` for money arithmetic, never `float`, never `Prisma.Decimal`. See D-06 in `docs/decision-log.md`.
- Rates (commission, discount funding ratios) are integer **basis points** (1 bps = 0.01%). Use `applyBps(value, rateBps)` — it rounds half-up to the nearest poisha.
- Multi-line or two-party splits use the **largest-remainder method**: floor each share, hand the remaining poisha one at a time to the largest fractional remainders, tie-break by ascending `orderLineId` (for line splits) or CareU-first (for funding splits). `Σ shares == total` is asserted before returning. See D-25 and D-29.
- `largestRemainderAllocate` returns a `Map` keyed by `id`; iteration order is not stable — do not depend on it for correctness.
- `allocateDiscount` runs the two-stage pipeline: stage 1 distributes `discountTotal` across eligible lines; stage 2 splits each line's share between CareU-funded and seller-funded. It asserts `Σ allocated == discountTotal` and `Σ careuFunded + Σ sellerFunded == discountTotal` before returning.
- A CareU-funded discount never reduces `grossAmount` for the seller; a seller-funded discount does. `commissionBase = subtotal - discountAmount` under `REDUCE_BASE_PROPORTIONAL` (the default). See INV-54 and D-09.
- First-party (CareU) seller orders pass `rateBps = 0` to `computeCommissionAmount`. Never infer this from the shop; the caller supplies it explicitly.
- Display uses `Intl.NumberFormat` with 2 decimal places. `poishaToBdtString` gives the lossless decimal string for serialisation (BigInt does not JSON-serialise).

## Gotchas

- `bigint` does not serialise to JSON. Convert at the boundary: `poishaToBdtString` for display/logging; store as `BigInt` Prisma columns (mapped from DB `BIGINT`).
- Never compute a historical order with today's commission rate. Snapshot `commissionRateBps` and `commissionAmount` on the seller order at order time. Sum the per-line `commissionAmount` values to get the seller-order total — do NOT re-run `applyBps` on the aggregate, it will drift by rounding (INV-42).
- `roundHalfUp` works on arbitrary `bigint` pairs; pass `(numerator, denominator)` from the actual multiplication, not a pre-divided float.

## Related specs

`docs/decision-log.md`: D-06 (poisha), D-09 (commission treatment), D-25 (allocation), D-28 (ledger), D-29 (funding split)
`docs/data-model.md`: §3.6.1 (discount allocation pipeline)

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._


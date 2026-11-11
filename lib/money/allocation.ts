/**
 * Deterministic largest-remainder allocation (D-25) and funding-split
 * rounding (D-29).
 *
 * The same primitive is used twice:
 *   1. to distribute a promotion's `discountTotal` across eligible lines,
 *      in proportion to each line's eligible base; and
 *   2. within a single line, to split that line's allocated discount between
 *      the CareU-funded and seller-funded shares.
 *
 * Rules (docs/data-model.md §3.6.1, docs/decision-log.md D-25/D-29):
 *   - Each share is floor-divided to whole poisha.
 *   - The remaining poisha are handed out one at a time to the largest
 *     fractional remainders.
 *   - Ties are broken deterministically by ascending `orderLineId`; for the
 *     CareU/seller funding split, a tie resolves to the CareU share first.
 *   - `Σ shares == total` is asserted; a mismatch throws.
 *
 * Money is `bigint` poisha. This module is dependency-free.
 */

import { type Poisha, sumPoisha } from "./poisha.ts";

/** One weighted participant in an allocation. */
export interface AllocationWeight<TId extends string | number = string> {
  /** Stable, unique identity used for deterministic tie-breaking. */
  readonly id: TId;
  /** Non-negative integer weight (e.g. a line base or an amount to split). */
  readonly weight: bigint;
}

/** A weight pair used to split a single amount (e.g. CareU vs seller). */
export interface SplitWeights {
  /** Share of the first party, in the same unit as `second`. */
  readonly first: bigint;
  /** Share of the second party, in the same unit as `first`. */
  readonly second: bigint;
}

export class AllocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AllocationError";
  }
}

/**
 * Split `total` into integer poisha shares proportional to `weights`, using
 * the largest-remainder method.
 *
 * Returns a `Map` keyed by each participant `id`, preserving no particular
 * order — the caller must not depend on iteration order for correctness.
 * Ties on the fractional remainder are broken by ascending `id` (string
 * compare for string ids, numeric compare for number ids) via a stable
 * comparator, so the result is independent of input order.
 *
 * @throws {AllocationError} if total is negative, any weight is negative, the
 *   total weight is zero while `weights` is non-empty, ids are not unique, or
 *   the shares do not sum exactly to `total`.
 */
export function largestRemainderAllocate<TId extends string | number>(
  total: Poisha,
  weights: readonly AllocationWeight<TId>[],
): Map<TId, Poisha> {
  if (total < 0n) {
    throw new AllocationError(`total must be non-negative, got ${total}`);
  }
  if (weights.length === 0) {
    if (total !== 0n) {
      throw new AllocationError(`cannot allocate ${total} across zero participants`);
    }
    return new Map();
  }

  const seen = new Set<TId>();
  for (const w of weights) {
    if (seen.has(w.id)) throw new AllocationError(`duplicate participant id: ${String(w.id)}`);
    seen.add(w.id);
    if (w.weight < 0n) {
      throw new AllocationError(`weight must be non-negative for ${String(w.id)}, got ${w.weight}`);
    }
  }

  const totalWeight = weights.reduce((acc, w) => acc + w.weight, 0n);
  if (totalWeight === 0n) {
    if (total !== 0n) {
      throw new AllocationError(`cannot allocate ${total}: total weight is zero`);
    }
    const zeros = new Map<TId, Poisha>();
    for (const w of weights) zeros.set(w.id, 0n);
    return zeros;
  }

  // Deterministic order: by id ascending. This is the documented tie-break
  // (ascending `orderLineId`), applied to every id for reproducibility.
  const ordered = [...weights].sort((a, b) => compareIds(a.id, b.id));

  // Floor each share and track the exact remainder as an integer numerator
  // (share_i = total * weight_i / totalWeight). The fractional part is
  // compared with cross-multiplication to stay in integer arithmetic.
  const shares = new Map<TId, Poisha>();
  let allocated = 0n;
  const remainders: { id: TId; remainder: bigint }[] = [];

  for (const w of ordered) {
    const numerator = total * w.weight;
    const base = numerator / totalWeight;
    const remainder = numerator % totalWeight;
    shares.set(w.id, base);
    allocated += base;
    remainders.push({ id: w.id, remainder });
  }

  let leftover = total - allocated;
  if (leftover < 0n) {
    throw new AllocationError(`internal error: allocated ${allocated} exceeds total ${total}`);
  }

  // Largest remainder first; ties broken by the deterministic id order above.
  remainders.sort((a, b) => {
    if (a.remainder !== b.remainder) return a.remainder > b.remainder ? -1 : 1;
    return compareIds(a.id, b.id);
  });

  for (let i = 0; i < remainders.length && leftover > 0n; i++) {
    const { id } = remainders[i]!;
    shares.set(id, (shares.get(id) ?? 0n) + 1n);
    leftover -= 1n;
  }

  if (leftover !== 0n) {
    throw new AllocationError(`leftover ${leftover} could not be distributed`);
  }

  const check = sumPoisha([...shares.values()]);
  if (check !== total) {
    throw new AllocationError(`allocation sum ${check} != total ${total}`);
  }

  return shares;
}

/**
 * Split a single poisha amount between two parties according to
 * `weights.first : weights.second`, using largest-remainder rounding with a
 * deterministic tie-break that awards a tied extra poisha to `first`
 * (CareU) — D-29.
 *
 * Both returned shares are whole poisha and sum exactly to `total`.
 */
export function splitByWeight(
  total: Poisha,
  weights: SplitWeights,
): { first: Poisha; second: Poisha } {
  if (weights.first < 0n || weights.second < 0n) {
    throw new AllocationError("split weights must be non-negative");
  }
  const sum = weights.first + weights.second;
  if (sum === 0n) {
    if (total !== 0n) {
      throw new AllocationError(`cannot split ${total} with zero total weight`);
    }
    return { first: 0n, second: 0n };
  }

  // `first` sorts before `second`, so a tied remainder resolves to `first`.
  const result = largestRemainderAllocate(total, [
    { id: "first", weight: weights.first },
    { id: "second", weight: weights.second },
  ]);
  return { first: result.get("first") ?? 0n, second: result.get("second") ?? 0n };
}

/** Compare ids deterministically: numbers numerically, strings by codepoint. */
function compareIds<TId extends string | number>(a: TId, b: TId): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0;
}

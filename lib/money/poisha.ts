/**
 * Money primitives.
 *
 * All monetary values in CareU.bd are integers in **poisha** (1 BDT = 100
 * poisha), stored as `bigint`. Never use `number` for money arithmetic and
 * never use a float or `Prisma.Decimal`. See docs/data-model.md (D-06) and
 * AGENTS.md.
 *
 * This module is intentionally dependency-free (no `server-only`, no `@/`
 * path aliases) so it can be loaded by Node's built-in test runner and by
 * CLI contexts that strip path aliases.
 */

/** Number of poisha in one taka. */
export const POISHA_PER_BDT = 100n;

/** Canonical integer money type. */
export type Poisha = bigint;

/** True when `value` is a safely representable integer money amount. */
export function isPoisha(value: unknown): value is Poisha {
  return typeof value === "bigint";
}

/** Convert a whole number of taka (integer) to poisha. */
export function bdtToPoisha(taka: bigint | number): Poisha {
  if (typeof taka === "number" && !Number.isInteger(taka)) {
    throw new TypeError(`bdtToPoisha expects an integer number of taka, got ${taka}`);
  }
  return BigInt(taka) * POISHA_PER_BDT;
}

/** Convert poisha to BDT as a lossless decimal string, e.g. 90001n -> "900.01". */
export function poishaToBdtString(value: Poisha): string {
  const negative = value < 0n;
  const abs = negative ? -value : value;
  const taka = abs / POISHA_PER_BDT;
  const paisa = abs % POISHA_PER_BDT;
  const paisaStr = paisa.toString().padStart(2, "0");
  return `${negative ? "-" : ""}${taka}.${paisaStr}`;
}

/** Sum a list of poisha amounts. */
export function sumPoisha(values: readonly Poisha[]): Poisha {
  let total = 0n;
  for (const value of values) total += value;
  return total;
}

/** Multiply a poisha amount by an integer quantity (never a fraction). */
export function multiplyPoisha(value: Poisha, quantity: bigint | number): Poisha {
  if (typeof quantity === "number" && !Number.isInteger(quantity)) {
    throw new TypeError(`multiplyPoisha expects an integer quantity, got ${quantity}`);
  }
  return value * BigInt(quantity);
}

/**
 * Apply an integer basis-points rate (e.g. commission `rateBps`) to a poisha
 * amount, rounding half-up to the nearest poisha. Basis points are the
 * documented representation for rates (docs/data-model.md).
 */
export function applyBps(value: Poisha, rateBps: bigint | number): Poisha {
  if (typeof rateBps === "number" && !Number.isInteger(rateBps)) {
    throw new TypeError(`applyBps expects an integer number of basis points, got ${rateBps}`);
  }
  const bps = BigInt(rateBps);
  const numerator = value * bps;
  const denominator = 10_000n;
  const rounded = roundHalfUp(numerator, denominator);
  return rounded;
}

/**
 * Divide `numerator / denominator`, rounding half away from zero to the
 * nearest integer, without floating point.
 */
export function roundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) {
    throw new RangeError("roundHalfUp: denominator must not be zero");
  }
  const negative = (numerator < 0n) !== (denominator < 0n);
  const n = numerator < 0n ? -numerator : numerator;
  const d = denominator < 0n ? -denominator : denominator;
  const quotient = n / d;
  const remainder = n % d;
  const rounded = remainder * 2n >= d ? quotient + 1n : quotient;
  return negative ? -rounded : rounded;
}

/**
 * Discount allocation pipeline (D-25 + D-29 + D-09 / INV-54).
 *
 * Given a promotion's total discount and the eligible order lines, this
 * produces, per line, the snapshotted money the order stores:
 *   - `discountAmount`        — this line's share of the discount
 *   - `careuFundedDiscount`   — the CareU-funded part of that share
 *   - `sellerFundedDiscount`  — the seller-funded part of that share
 *   - `commissionBase`        — the base commission is charged on
 *   - `grossAmount`           — this line's contribution to the seller's gross
 *
 * Steps (docs/data-model.md §3.6.1):
 *   1. Allocate `discountTotal` across eligible lines in proportion to each
 *      line's discount-eligible base (largest-remainder, D-25).
 *   2. Within each line, split the allocated discount between CareU and the
 *      seller according to the promotion's funding weights (largest-remainder
 *      with a CareU-first tie-break, D-29).
 *   3. Derive the commission base and the seller's gross:
 *        `commissionBase = subtotal - discountAmount`  (REDUCE_BASE_PROPORTIONAL)
 *        `grossAmount   = subtotal - sellerFundedDiscount`   (INV-54)
 *
 * A CareU-funded discount never reduces the seller's gross proceeds — it
 * reduces CareU's own revenue (INV-54). A seller-funded discount reduces the
 * seller's gross proceeds and is charged on the reduced commission base.
 *
 * Money is `bigint` poisha. This module is dependency-free.
 */

import { applyBps, type Poisha, sumPoisha } from "./poisha.ts";
import { type AllocationWeight, largestRemainderAllocate, splitByWeight } from "./allocation.ts";

/** The funding source of a promotion (docs/data-model.md §3.6.1). */
export type FundingSource = "CAREAU" | "SELLER" | "MIXED";

/** How a discount affects the commission base. */
export type CommissionTreatment = "REDUCE_BASE_PROPORTIONAL" | "NO_EFFECT";

/** One eligible order line presented to the allocator. */
export interface EligibleLine {
  /** Stable id used for deterministic tie-breaking (ascending `orderLineId`). */
  readonly orderLineId: string;
  /** The line's full subtotal (unit price × qty), in poisha. */
  readonly subtotal: Poisha;
  /**
   * The discount-eligible portion of the subtotal, used as the allocation
   * weight (§3.6.1 step 2). Defaults to the full subtotal.
   */
  readonly eligibleBase?: Poisha;
}

/** The funding weights for a `MIXED` promotion. */
export interface FundingWeights {
  readonly careu: bigint;
  readonly seller: bigint;
}

/** The snapshotted per-line result of the allocation. */
export interface LineAllocation {
  readonly orderLineId: string;
  readonly subtotal: Poisha;
  readonly discountAmount: Poisha;
  readonly careuFundedDiscount: Poisha;
  readonly sellerFundedDiscount: Poisha;
  /** The base commission is charged on. */
  readonly commissionBase: Poisha;
  /** This line's contribution to the seller order's `sellerGross`. */
  readonly grossAmount: Poisha;
}

export interface AllocationInput {
  /** Total discount to distribute, in poisha (>= 0). */
  readonly discountTotal: Poisha;
  readonly lines: readonly EligibleLine[];
  readonly fundingSource: FundingSource;
  /**
   * Required when `fundingSource === "MIXED"`. The ratio CareU:seller used to
   * split each line's allocated discount.
   */
  readonly fundingWeights?: FundingWeights;
  readonly commissionTreatment?: CommissionTreatment;
}

export interface AllocationResult {
  readonly lines: LineAllocation[];
  readonly totalAllocated: Poisha;
  readonly totalCareuFunded: Poisha;
  readonly totalSellerFunded: Poisha;
  readonly totalCommissionBase: Poisha;
  readonly totalGross: Poisha;
}

/**
 * Run the full allocation pipeline and assert the documented sums before
 * returning. Throws if `Σ allocated != discountTotal` or
 * `Σ careuFunded + Σ sellerFunded != discountTotal` (D-25/D-29).
 */
export function allocateDiscount(input: AllocationInput): AllocationResult {
  const { discountTotal, lines, fundingSource } = input;
  const treatment: CommissionTreatment = input.commissionTreatment ?? "REDUCE_BASE_PROPORTIONAL";

  if (fundingSource === "MIXED") {
    const w = input.fundingWeights;
    if (!w || w.careu + w.seller <= 0n) {
      throw new Error("MIXED funding requires positive fundingWeights");
    }
  }

  const weights: AllocationWeight<string>[] = lines.map((l) => ({
    id: l.orderLineId,
    weight: l.eligibleBase ?? l.subtotal,
  }));

  const allocatedByLine = largestRemainderAllocate(discountTotal, weights);

  const results: LineAllocation[] = [];
  for (const line of lines) {
    const discountAmount = allocatedByLine.get(line.orderLineId) ?? 0n;

    let careuFunded = 0n;
    let sellerFunded = 0n;
    switch (fundingSource) {
      case "CAREAU":
        careuFunded = discountAmount;
        break;
      case "SELLER":
        sellerFunded = discountAmount;
        break;
      case "MIXED": {
        // CareU maps to `first` so that an exact-remainder tie resolves to the
        // CareU share (D-29).
        const split = splitByWeight(discountAmount, {
          first: input.fundingWeights!.careu,
          second: input.fundingWeights!.seller,
        });
        careuFunded = split.first;
        sellerFunded = split.second;
        break;
      }
    }

    // Per-line funding sum must equal the line's allocated discount.
    if (careuFunded + sellerFunded !== discountAmount) {
      throw new Error(
        `line ${line.orderLineId}: funding split ${careuFunded}+${sellerFunded} != ${discountAmount}`,
      );
    }

    // Commission base (§3.6.1): charged on `lineBase - discountShare` under
    // REDUCE_BASE_PROPORTIONAL; untouched under NO_EFFECT.
    const commissionBase =
      treatment === "NO_EFFECT" ? line.subtotal : line.subtotal - discountAmount;

    if (commissionBase < 0n) {
      throw new Error(`line ${line.orderLineId}: commission base went negative`);
    }

    // Seller gross (INV-54): only the seller's own funded share reduces the
    // seller's proceeds. A CareU-funded discount reduces CareU's revenue.
    const grossAmount = line.subtotal - sellerFunded;
    if (grossAmount < 0n) {
      throw new Error(`line ${line.orderLineId}: gross amount went negative`);
    }

    results.push({
      orderLineId: line.orderLineId,
      subtotal: line.subtotal,
      discountAmount,
      careuFundedDiscount: careuFunded,
      sellerFundedDiscount: sellerFunded,
      commissionBase,
      grossAmount,
    });
  }

  const totalAllocated = sumPoisha(results.map((r) => r.discountAmount));
  const totalCareuFunded = sumPoisha(results.map((r) => r.careuFundedDiscount));
  const totalSellerFunded = sumPoisha(results.map((r) => r.sellerFundedDiscount));
  const totalCommissionBase = sumPoisha(results.map((r) => r.commissionBase));
  const totalGross = sumPoisha(results.map((r) => r.grossAmount));

  if (totalAllocated !== discountTotal) {
    throw new Error(`Σ allocated ${totalAllocated} != discountTotal ${discountTotal}`);
  }
  if (totalCareuFunded + totalSellerFunded !== discountTotal) {
    throw new Error(
      `Σ careuFunded + Σ sellerFunded ${totalCareuFunded + totalSellerFunded} != ${discountTotal}`,
    );
  }

  return {
    lines: results,
    totalAllocated,
    totalCareuFunded,
    totalSellerFunded,
    totalCommissionBase,
    totalGross,
  };
}

/**
 * Compute the commission charged on a commission base at `rateBps`.
 *
 * The effective rule is snapshotted onto the seller order as
 * `commissionRateBps` + `commissionAmount` (INV-28); a historical order is
 * never recomputed when a rate changes.
 *
 * Rounding: the docs do not fix a rounding mode for commission, so this uses
 * half-up to whole poisha. It is applied per line, and the per-line amounts
 * must sum to the seller order's `commissionAmount` (INV-42) — so the
 * seller-order total is the **sum of the line amounts**, never a separate
 * computation on the seller-order base, which would drift by rounding.
 *
 * First-party seller orders are charged 0 (INV-29): the caller passes
 * `rateBps = 0`.
 */
export function computeCommissionAmount(
  commissionBase: Poisha,
  rateBps: bigint | number,
): Poisha {
  if (commissionBase < 0n) {
    throw new Error(`commission base must be non-negative, got ${commissionBase}`);
  }
  return applyBps(commissionBase, rateBps);
}

/** The seller-order-level totals derived from a set of allocated lines. */
export interface SellerOrderTotals {
  readonly subtotal: Poisha;
  readonly discountTotal: Poisha;
  readonly careuFundedTotal: Poisha;
  readonly sellerFundedTotal: Poisha;
  readonly commissionBaseTotal: Poisha;
  readonly grossAmount: Poisha;
}

/**
 * Aggregate allocated lines into the seller-order totals and assert the
 * line ↔ seller-order reconciliation (docs/data-model.md §3.6.1).
 *
 * `grossAmount` is `Σ subtotal − Σ sellerFundedDiscount` (INV-54).
 */
export function aggregateSellerOrder(lines: readonly LineAllocation[]): SellerOrderTotals {
  const subtotal = sumPoisha(lines.map((l) => l.subtotal));
  const discountTotal = sumPoisha(lines.map((l) => l.discountAmount));
  const careuFundedTotal = sumPoisha(lines.map((l) => l.careuFundedDiscount));
  const sellerFundedTotal = sumPoisha(lines.map((l) => l.sellerFundedDiscount));
  const commissionBaseTotal = sumPoisha(lines.map((l) => l.commissionBase));
  const grossAmount = sumPoisha(lines.map((l) => l.grossAmount));

  if (careuFundedTotal + sellerFundedTotal !== discountTotal) {
    throw new Error(
      `seller order: Σ careuFunded + Σ sellerFunded ${careuFundedTotal + sellerFundedTotal} != Σ discount ${discountTotal}`,
    );
  }
  if (grossAmount !== subtotal - sellerFundedTotal) {
    throw new Error(
      `seller order: gross ${grossAmount} != subtotal ${subtotal} - sellerFunded ${sellerFundedTotal}`,
    );
  }

  return {
    subtotal,
    discountTotal,
    careuFundedTotal,
    sellerFundedTotal,
    commissionBaseTotal,
    grossAmount,
  };
}

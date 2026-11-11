/**
 * T1 — Money & rounding (project-wide acceptance gate).
 *
 * Proves the money foundation: integer poisha arithmetic, deterministic
 * largest-remainder allocation (D-25), deterministic funding-split rounding
 * (D-29), and the `Σ` assertions that guard every checkout transaction.
 *
 * Gate owner: M0. Must pass before any milestone is considered done.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  applyBps,
  bdtToPoisha,
  multiplyPoisha,
  poishaToBdtString,
  roundHalfUp,
  sumPoisha,
} from "../lib/money/poisha.ts";
import {
  AllocationError,
  largestRemainderAllocate,
  splitByWeight,
} from "../lib/money/allocation.ts";
import { allocateDiscount, aggregateSellerOrder, computeCommissionAmount } from "../lib/money/discount.ts";

describe("T1 money: poisha primitives", () => {
  test("1 BDT is 100 poisha", () => {
    assert.equal(bdtToPoisha(1), 100n);
    assert.equal(bdtToPoisha(199), 19_900n);
    assert.equal(bdtToPoisha(1000n), 100_000n);
  });

  test("rejects a fractional number of taka", () => {
    assert.throws(() => bdtToPoisha(1.5), TypeError);
  });

  test("converts poisha back to an exact BDT string", () => {
    assert.equal(poishaToBdtString(100n), "1.00");
    assert.equal(poishaToBdtString(19_900n), "199.00");
    assert.equal(poishaToBdtString(5_999n), "59.99");
    assert.equal(poishaToBdtString(0n), "0.00");
    assert.equal(poishaToBdtString(-250n), "-2.50");
  });

  test("sums and multiplies exactly, with no float drift", () => {
    assert.equal(sumPoisha([1n, 2n, 3n]), 6n);
    assert.equal(sumPoisha([]), 0n);
    assert.equal(multiplyPoisha(19_900n, 3), 59_700n);
    // A float would lose this; BigInt keeps it exact.
    assert.equal(multiplyPoisha(1n, 3), 3n);
    assert.equal(sumPoisha([10_000n, 20_000n, 30_000n]), 60_000n);
  });

  test("applies basis points with half-up rounding", () => {
    // 10% of 1000 BDT (100000 poisha) = 10000 poisha.
    assert.equal(applyBps(100_000n, 1_000), 10_000n);
    // 10% of 1 poisha = 0.1 -> 0
    assert.equal(applyBps(1n, 1_000), 0n);
    // 50% of 1 poisha = 0.5 -> rounds half up to 1
    assert.equal(applyBps(1n, 5_000), 1n);
    // 12.5% of 100 poisha = 12.5 -> 13
    assert.equal(applyBps(100n, 1_250), 13n);
  });

  test("roundHalfUp rounds away from zero and rejects a zero denominator", () => {
    assert.equal(roundHalfUp(5n, 2n), 3n);
    assert.equal(roundHalfUp(-5n, 2n), -3n);
    assert.equal(roundHalfUp(4n, 2n), 2n);
    assert.throws(() => roundHalfUp(1n, 0n), RangeError);
  });
});

describe("T1 rounding: largest-remainder allocation (D-25)", () => {
  test("distributes the discount exactly, with no lost or invented poisha", () => {
    // The documented worked example:
    //   line A base 59700 (3 x 199.00), line B base 45000 (1 x 450.00)
    //   discountTotal 10000
    // Exact shares 5702.0057 / 4297.9943 -> floors 5702 / 4297, one poisha left.
    // The larger remainder (0.9943) belongs to line B, so B gets the extra.
    const result = largestRemainderAllocate(10_000n, [
      { id: "line-a", weight: 59_700n },
      { id: "line-b", weight: 45_000n },
    ]);

    assert.equal(result.get("line-a"), 5_702n);
    assert.equal(result.get("line-b"), 4_298n);
    assert.equal(sumPoisha([...result.values()]), 10_000n);
  });

  test("is deterministic regardless of input order", () => {
    const weights = [
      { id: "line-c", weight: 33_333n },
      { id: "line-a", weight: 33_333n },
      { id: "line-b", weight: 33_334n },
    ];
    const forward = largestRemainderAllocate(10_000n, weights);
    const reversed = largestRemainderAllocate(10_000n, [...weights].reverse());

    assert.deepEqual(
      [...forward.entries()].sort(),
      [...reversed.entries()].sort(),
      "reversing the input must not change the allocation",
    );
    assert.equal(sumPoisha([...forward.values()]), 10_000n);
  });

  test("breaks exact remainder ties by ascending id", () => {
    // Two equal bases, one extra poisha: the smaller id must win.
    const result = largestRemainderAllocate(1n, [
      { id: "line-b", weight: 100n },
      { id: "line-a", weight: 100n },
    ]);

    assert.equal(result.get("line-a"), 1n);
    assert.equal(result.get("line-b"), 0n);
  });

  test("handles a zero discount and a single participant", () => {
    const zero = largestRemainderAllocate(0n, [
      { id: "line-a", weight: 100n },
      { id: "line-b", weight: 100n },
    ]);
    assert.equal(sumPoisha([...zero.values()]), 0n);

    const single = largestRemainderAllocate(10_000n, [{ id: "line-a", weight: 5n }]);
    assert.equal(single.get("line-a"), 10_000n);
  });

  test("rejects invalid input instead of producing a wrong split", () => {
    assert.throws(() => largestRemainderAllocate(-1n, [{ id: "a", weight: 1n }]), AllocationError);
    assert.throws(
      () => largestRemainderAllocate(10n, [{ id: "a", weight: -1n }]),
      AllocationError,
    );
    assert.throws(
      () => largestRemainderAllocate(10n, [{ id: "a", weight: 1n }, { id: "a", weight: 2n }]),
      AllocationError,
      "duplicate ids must be rejected — they would make the tie-break ambiguous",
    );
    assert.throws(
      () => largestRemainderAllocate(10n, [{ id: "a", weight: 0n }]),
      AllocationError,
      "a zero total weight cannot absorb a non-zero discount",
    );
  });
});

describe("T1 rounding: funding split (D-29)", () => {
  test("splits an uneven amount with largest-remainder rounding", () => {
    // 5702 at 60/40: CareU exact 3421.2 (rem .2), seller exact 2280.8 (rem .8)
    // -> the larger remainder gives the extra poisha to the seller.
    const line1 = splitByWeight(5_702n, { first: 60n, second: 40n });
    assert.equal(line1.first, 3_421n);
    assert.equal(line1.second, 2_281n);
    assert.equal(line1.first + line1.second, 5_702n);

    // 4298 at 60/40: CareU exact 2578.8 (rem .8), seller exact 1719.2 (rem .2)
    // -> the extra poisha goes to CareU.
    const line2 = splitByWeight(4_298n, { first: 60n, second: 40n });
    assert.equal(line2.first, 2_579n);
    assert.equal(line2.second, 1_719n);
    assert.equal(line2.first + line2.second, 4_298n);
  });

  test("resolves an exact tie to the CareU share first", () => {
    const split = splitByWeight(5_701n, { first: 50n, second: 50n });
    assert.equal(split.first, 2_851n);
    assert.equal(split.second, 2_850n);
    assert.equal(split.first + split.second, 5_701n);
  });

  test("is exact for a fully funded source", () => {
    const careu = splitByWeight(5_702n, { first: 100n, second: 0n });
    assert.equal(careu.first, 5_702n);
    assert.equal(careu.second, 0n);
  });
});

describe("T1 allocation pipeline: discount, funding and commission base", () => {
  const lines = [
    { orderLineId: "line-a", subtotal: 59_700n },
    { orderLineId: "line-b", subtotal: 45_000n },
  ];

  test("mixed 60/40 funding allocates exactly and reconciles to the total", () => {
    const result = allocateDiscount({
      discountTotal: 10_000n,
      lines,
      fundingSource: "MIXED",
      fundingWeights: { careu: 60n, seller: 40n },
    });

    assert.equal(result.totalAllocated, 10_000n);
    assert.equal(result.totalCareuFunded + result.totalSellerFunded, 10_000n);

    const a = result.lines.find((l) => l.orderLineId === "line-a")!;
    const b = result.lines.find((l) => l.orderLineId === "line-b")!;

    assert.equal(a.discountAmount, 5_702n);
    assert.equal(b.discountAmount, 4_298n);

    // Per-line funding split (D-29) as computed above.
    assert.equal(a.careuFundedDiscount, 3_421n);
    assert.equal(a.sellerFundedDiscount, 2_281n);
    assert.equal(b.careuFundedDiscount, 2_579n);
    assert.equal(b.sellerFundedDiscount, 1_719n);

    // Line -> seller order -> order reconciliation (the `Σ` assertions).
    assert.equal(result.totalCareuFunded, 6_000n);
    assert.equal(result.totalSellerFunded, 4_000n);
    assert.equal(
      sumPoisha(result.lines.map((l) => l.discountAmount)),
      result.totalAllocated,
    );
  });

  test("commission base is reduced by the line's allocated discount", () => {
    const result = allocateDiscount({
      discountTotal: 10_000n,
      lines,
      fundingSource: "MIXED",
      fundingWeights: { careu: 60n, seller: 40n },
    });

    const a = result.lines.find((l) => l.orderLineId === "line-a")!;
    assert.equal(a.commissionBase, 59_700n - 5_702n);
  });

  test("NO_EFFECT leaves the commission base untouched", () => {
    const result = allocateDiscount({
      discountTotal: 10_000n,
      lines,
      fundingSource: "MIXED",
      fundingWeights: { careu: 60n, seller: 40n },
      commissionTreatment: "NO_EFFECT",
    });

    const a = result.lines.find((l) => l.orderLineId === "line-a")!;
    assert.equal(a.commissionBase, 59_700n);
  });

  test("a CareU-funded discount never reduces the seller's gross proceeds", () => {
    const result = allocateDiscount({
      discountTotal: 10_000n,
      lines,
      fundingSource: "CAREAU",
    });

    for (const line of result.lines) {
      assert.equal(line.sellerFundedDiscount, 0n);
      assert.equal(line.careuFundedDiscount, line.discountAmount);
      // INV-54: gross = subtotal - sellerFundedDiscount; a CareU-funded
      // discount reduces CareU's revenue, not the seller's proceeds.
      assert.equal(line.grossAmount, line.subtotal);
    }
    assert.equal(result.totalSellerFunded, 0n);
    assert.equal(result.totalCareuFunded, 10_000n);
    assert.equal(result.totalGross, 104_700n);
  });

  test("a seller-funded discount lands entirely on the seller", () => {
    const result = allocateDiscount({
      discountTotal: 10_000n,
      lines,
      fundingSource: "SELLER",
    });

    assert.equal(result.totalCareuFunded, 0n);
    assert.equal(result.totalSellerFunded, 10_000n);
    // INV-54: the seller's gross is reduced by the seller-funded discount.
    assert.equal(result.totalGross, 104_700n - 10_000n);
  });

  test("the seller order reconciles to its lines (INV-54)", () => {
    const result = allocateDiscount({
      discountTotal: 10_000n,
      lines,
      fundingSource: "MIXED",
      fundingWeights: { careu: 60n, seller: 40n },
    });

    const totals = aggregateSellerOrder(result.lines);

    assert.equal(totals.subtotal, 104_700n);
    assert.equal(totals.discountTotal, 10_000n);
    assert.equal(totals.careuFundedTotal, 6_000n);
    assert.equal(totals.sellerFundedTotal, 4_000n);
    assert.equal(totals.grossAmount, 104_700n - 4_000n);
    assert.equal(
      totals.commissionBaseTotal,
      sumPoisha(result.lines.map((l) => l.commissionBase)),
    );
  });

  test("a partially eligible line allocates on its eligible base only", () => {
    // The discount is allocated on `eligibleBase`, but the money the line
    // contributes to the seller's gross is the full subtotal.
    const result = allocateDiscount({
      discountTotal: 10_000n,
      lines: [
        { orderLineId: "line-a", subtotal: 10_000n, eligibleBase: 10_000n },
        { orderLineId: "line-b", subtotal: 10_000n, eligibleBase: 5_000n },
      ],
      fundingSource: "SELLER",
    });

    const a = result.lines.find((l) => l.orderLineId === "line-a")!;
    const b = result.lines.find((l) => l.orderLineId === "line-b")!;

    assert.equal(a.discountAmount, 6_667n);
    assert.equal(b.discountAmount, 3_333n);
    assert.equal(a.commissionBase, 10_000n - 6_667n);
    assert.equal(b.commissionBase, 10_000n - 3_333n);
    assert.equal(b.grossAmount, 10_000n - 3_333n);
  });

  test("commission is computed per line and sums to the seller order (INV-42)", () => {
    const result = allocateDiscount({
      discountTotal: 10_000n,
      lines,
      fundingSource: "MIXED",
      fundingWeights: { careu: 60n, seller: 40n },
    });

    // 10% of each line's commission base, computed per line.
    const perLine = result.lines.map((l) =>
      computeCommissionAmount(l.commissionBase, 1_000n),
    );
    assert.equal(perLine[0], 5_400n); // 10% of 53998 = 5399.8 -> 5400
    assert.equal(perLine[1], 4_070n); // 10% of 40702 = 4070.2 -> 4070

    // The seller-order total is the SUM of the line amounts (INV-42), never a
    // separate computation on the seller-order base, which would drift by
    // rounding.
    const sellerOrderCommission = sumPoisha(perLine);
    assert.equal(sellerOrderCommission, 9_470n);
  });

  test("the seller-order commission is the sum of the line amounts, not a re-computation", () => {
    // Two lines of 5 poisha each at 10%: each line rounds 0.5 up to 1, so the
    // sum of the line amounts is 2 — while 10% of the aggregate base of 10 is
    // 1. The seller order must use the sum of the lines.
    const perLine = [5n, 5n].map((base) => computeCommissionAmount(base, 1_000n));
    assert.equal(sumPoisha(perLine), 2n);
    assert.equal(computeCommissionAmount(10n, 1_000n), 1n);
  });

  test("a first-party seller order is charged no commission (INV-29)", () => {
    assert.equal(computeCommissionAmount(59_700n, 0n), 0n);
  });

  test("MIXED without funding weights is rejected", () => {    assert.throws(
      () =>
        allocateDiscount({
          discountTotal: 10_000n,
          lines,
          fundingSource: "MIXED",
        }),
      /fundingWeights/,
    );
  });

  test("repeating the computation yields an identical per-line result", () => {
    const run = () =>
      allocateDiscount({
        discountTotal: 10_000n,
        lines: [...lines].reverse(),
        fundingSource: "MIXED",
        fundingWeights: { careu: 60n, seller: 40n },
      });

    const first = run();
    const second = run();

    for (const line of first.lines) {
      const match = second.lines.find((l) => l.orderLineId === line.orderLineId)!;
      assert.deepEqual(match, line);
    }
  });
});

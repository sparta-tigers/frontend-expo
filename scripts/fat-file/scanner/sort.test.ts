// Feature: fat-file-refactoring, Property 6: Fat File 정렬 결정성

// Validates: Requirements 3.6, 9.2
//
// Property 6 (from design.md, Correctness Properties):
//   For any `ScanResult[]` input `xs`, `sortScanResults(xs)` is monotone
//   non-decreasing under the cascade
//     1) priorityTier: TOP before REVIEW,
//     2) loc: descending,
//     3) absolutePath: lexicographic ascending,
//   AND the sort is idempotent (`sort(sort(xs))` deep-equals `sort(xs)`).
//
// Ancillary guarantees exercised here:
//   - The input array is never mutated.
//   - The output is a permutation of the input (same multiset of elements).

import { Arbitrary, array, assert as fcAssert, constant, constantFrom, integer, property, record, string } from "fast-check";
import { strict as assert } from "node:assert";
import { test } from "node:test";

import type { ScanResult } from "../types.ts";
import { compareScanResult, sortScanResults } from "./sort.ts";

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

// Small alphabet keeps shrinking predictable and produces many ties on every
// axis (tier, loc, absolutePath) so the comparator's tie-break cascade is
// actually exercised. `fc.string({ unit, ... })` is the v4 replacement for
// the now-removed `fc.stringOf` constructor.
const pathArb = string({
  unit: constantFrom("a", "b", "c", "d"),
  minLength: 1,
  maxLength: 5,
});

// Tier determines the allowed `loc` band so the ScanResult invariant
// `(loc >= 1000) ↔ (tier === "TOP")` holds by construction.
const scanResultArb: Arbitrary<ScanResult> = constantFrom("TOP" as const, "REVIEW" as const)
  .chain((priorityTier) => {
    const locArb =
      priorityTier === "TOP"
        ? integer({ min: 1000, max: 2500 })
        : integer({ min: 500, max: 999 });
    return record({
      absolutePath: pathArb,
      relativePath: pathArb,
      loc: locArb,
      priorityTier: constant(priorityTier),
    });
  });

const scanResultsArb = array(scanResultArb, { minLength: 0, maxLength: 20 });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Canonical key for multiset comparison: JSON encoding is sufficient because
 * every `ScanResult` is a flat record of string/number literals and the
 * fields are written in a fixed order by the arbitrary above.
 */
function multiset(xs: readonly ScanResult[]): string[] {
  return xs.map((x) => JSON.stringify(x)).sort();
}

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

test("Property 6a: sortScanResults output is monotone non-decreasing under compareScanResult", () => {
  fcAssert(
    property(scanResultsArb, (xs) => {
      const sorted = sortScanResults(xs);
      for (let i = 0; i < sorted.length - 1; i += 1) {
        assert.ok(
          compareScanResult(sorted[i]!, sorted[i + 1]!) <= 0,
          `adjacent pair out of order at index ${i}: ` +
            `${JSON.stringify(sorted[i])} vs ${JSON.stringify(sorted[i + 1])}`,
        );
      }
    }),
  );
});

test("Property 6b: sortScanResults is idempotent (sort ∘ sort = sort)", () => {
  fcAssert(
    property(scanResultsArb, (xs) => {
      const once = sortScanResults(xs);
      const twice = sortScanResults(once);
      assert.deepEqual(twice, once);
    }),
  );
});

test("Property 6c: sortScanResults does not mutate the input array", () => {
  fcAssert(
    property(scanResultsArb, (xs) => {
      const snapshot = xs.slice();
      sortScanResults(xs);
      assert.deepEqual(xs, snapshot);
    }),
  );
});

test("Property 6d: sortScanResults output is a permutation of the input", () => {
  fcAssert(
    property(scanResultsArb, (xs) => {
      const sorted = sortScanResults(xs);
      assert.equal(sorted.length, xs.length);
      assert.deepEqual(multiset(sorted), multiset(xs));
    }),
  );
});

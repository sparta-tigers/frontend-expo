// Feature: fat-file-refactoring, Property 1: Priority_Tier 분류와 ScanResult 불변식

// Validates: Requirements 1.6, 1.7, 1.8, 1.9
//
// Property 1 (from design.md, Correctness Properties):
//   For any non-negative integer `loc` and any `absolutePath`,
//   `priorityTier(loc)` partitions the three branches:
//     - loc >= 1000                ↔ tier === "TOP"
//     - 500 <= loc < 1000          ↔ tier === "REVIEW"
//     - loc < 500                  → excluded (tier === null, buildScanResult === null)
//   When `buildScanResult` produces a ScanResult, the 3-tuple
//   (absolutePath, loc, priorityTier) structure and biconditional hold.
//
// Invalid loc values (NaN, negative) are also exercised: they must fall into
// the "excluded" branch.

import { assert as fcAssert, integer, property, string } from "fast-check";
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { buildScanResult, priorityTier } from "./priority-tier.ts";

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

// Non-negative integer loc that spans all three branches
// (below REVIEW threshold, REVIEW band, TOP band).
const nonNegativeLoc = integer({ min: 0, max: 10_000 });

// Absolute path: any non-empty printable string is sufficient for the
// invariants we assert here. The scanner itself validates absolute-ness
// elsewhere (Req 1.1); Property 1 only cares that the value is threaded
// through unchanged.
const absolutePathArb = string({ minLength: 1, maxLength: 64 });
const relativePathArb = string({ minLength: 1, maxLength: 64 });

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

test("Property 1a: priorityTier partitions non-negative integer loc into three disjoint branches", () => {
  fcAssert(
    property(nonNegativeLoc, (loc) => {
      const tier = priorityTier(loc);
      if (loc >= 1000) {
        assert.equal(tier, "TOP");
      } else if (loc >= 500) {
        assert.equal(tier, "REVIEW");
      } else {
        assert.equal(tier, null);
      }
    }),
  );
});

test("Property 1b: priorityTier biconditionals hold across a wide integer range", () => {
  fcAssert(
    property(integer({ min: -500, max: 5_000 }), (loc) => {
      const tier = priorityTier(loc);
      // (loc >= 1000) ↔ (tier === "TOP")
      assert.equal(loc >= 1000, tier === "TOP");
      // (500 <= loc < 1000) ↔ (tier === "REVIEW")
      assert.equal(loc >= 500 && loc < 1000, tier === "REVIEW");
      // loc < 500 → null (covers both non-negative < 500 and negative values)
      if (loc < 500) {
        assert.equal(tier, null);
      }
    }),
  );
});

test("Property 1c: buildScanResult returns null iff loc < 500", () => {
  fcAssert(
    property(
      absolutePathArb,
      relativePathArb,
      nonNegativeLoc,
      (absolutePath, relativePath, loc) => {
        const result = buildScanResult({ absolutePath, relativePath, loc });
        if (loc < 500) {
          assert.equal(result, null);
        } else {
          assert.notEqual(result, null);
        }
      },
    ),
  );
});

test("Property 1d: ScanResult carries the (absolutePath, loc, priorityTier) 3-tuple and satisfies the biconditional", () => {
  fcAssert(
    property(
      absolutePathArb,
      relativePathArb,
      integer({ min: 500, max: 10_000 }),
      (absolutePath, relativePath, loc) => {
        const result = buildScanResult({ absolutePath, relativePath, loc });
        assert.notEqual(result, null);
        // Narrow for the type checker.
        if (result === null) return;

        // 3-tuple: the three fields referenced by Property 1 are threaded through verbatim.
        assert.equal(result.absolutePath, absolutePath);
        assert.equal(result.loc, loc);
        assert.ok(
          result.priorityTier === "TOP" || result.priorityTier === "REVIEW",
          `priorityTier must be "TOP" | "REVIEW", got ${String(result.priorityTier)}`,
        );

        // Biconditionals (Req 1.6, 1.7, 1.9).
        assert.equal(loc >= 1000, result.priorityTier === "TOP");
        assert.equal(
          loc >= 500 && loc < 1000,
          result.priorityTier === "REVIEW",
        );
      },
    ),
  );
});

test("Property 1e: invalid loc (NaN) is excluded from the scan output", () => {
  assert.equal(priorityTier(Number.NaN), null);
  assert.equal(
    buildScanResult({
      absolutePath: "/x",
      relativePath: "x",
      loc: Number.NaN,
    }),
    null,
  );
});

test("Property 1f: negative loc is excluded from the scan output", () => {
  fcAssert(
    property(integer({ min: -1_000_000, max: -1 }), (loc) => {
      assert.equal(priorityTier(loc), null);
      assert.equal(
        buildScanResult({ absolutePath: "/x", relativePath: "x", loc }),
        null,
      );
    }),
  );
});

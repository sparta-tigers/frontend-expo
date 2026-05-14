// Feature: fat-file-refactoring
//
// Priority_Tier classifier and ScanResult builder.
//
// Responsibility:
//   - `priorityTier(loc)` — pure total function mapping LoC count to the Fat
//     File priority tier, or `null` when the file is below the Fat File
//     threshold and should be filtered out of the scan output (Req 1.8).
//   - `buildScanResult(...)` — return `null` for sub-threshold files and
//     otherwise construct a `ScanResult` that satisfies every invariant
//     declared in `types.ts` (Req 1.6, 1.7, 1.9).
//
// Karpathy / Zero Magic:
//   - Two bare if-branches, no lookup tables, no framework magic.
//   - The two biconditional invariants
//       (loc >= 1000)           ↔ priorityTier === "TOP"
//       (500 <= loc < 1000)     ↔ priorityTier === "REVIEW"
//     hold by construction, but we still assert them inline so any accidental
//     refactor (e.g. a swapped threshold, an off-by-one) fails loudly at the
//     construction site rather than corrupting downstream Spec / Task stages
//     silently.

import type { PriorityTier, ScanResult } from "../types.ts";

const TOP_THRESHOLD = 1000 as const;
const REVIEW_THRESHOLD = 500 as const;

/**
 * Classify a LoC count into a Priority_Tier, or `null` when the file is
 * below the Fat File threshold and should be excluded from scan output.
 *
 * Total over `number`: every input — including negative, non-integer, and
 * `NaN` values — produces a defined result, because both comparisons are
 * false for `NaN` and for `loc < REVIEW_THRESHOLD`.
 *
 * - `loc >= 1000`          → `"TOP"`
 * - `500 <= loc < 1000`    → `"REVIEW"`
 * - otherwise              → `null`
 */
export function priorityTier(loc: number): PriorityTier | null {
  if (loc >= TOP_THRESHOLD) return "TOP";
  if (loc >= REVIEW_THRESHOLD) return "REVIEW";
  return null;
}

/** Arguments accepted by {@link buildScanResult}. */
export type BuildScanResultArgs = {
  readonly absolutePath: string;
  readonly relativePath: string;
  readonly loc: number;
};

/**
 * Construct a `ScanResult` iff the file qualifies as a Fat File.
 *
 * Returns `null` when `loc < 500` so sub-threshold files are dropped from
 * the scan output entirely (Req 1.8).
 *
 * When a `ScanResult` is produced it satisfies the biconditional invariants
 * documented on the `ScanResult` type:
 *   - `(loc >= 1000) ↔ (priorityTier === "TOP")`
 *   - `(500 <= loc < 1000) ↔ (priorityTier === "REVIEW")`
 *
 * The assertions are redundant given the implementation of `priorityTier`,
 * but are retained as a tripwire against future drift. A violation throws
 * rather than silently producing a malformed record.
 */
export function buildScanResult(args: BuildScanResultArgs): ScanResult | null {
  const tier = priorityTier(args.loc);
  if (tier === null) return null;

  const topBiconditional = args.loc >= TOP_THRESHOLD === (tier === "TOP");
  const reviewBiconditional =
    (args.loc >= REVIEW_THRESHOLD && args.loc < TOP_THRESHOLD) ===
    (tier === "REVIEW");

  if (!topBiconditional || !reviewBiconditional) {
    throw new Error(
      `ScanResult invariant violated: loc=${args.loc}, priorityTier=${tier}`,
    );
  }

  return {
    absolutePath: args.absolutePath,
    relativePath: args.relativePath,
    loc: args.loc,
    priorityTier: tier,
  };
}

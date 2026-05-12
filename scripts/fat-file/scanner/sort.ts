// Feature: fat-file-refactoring
//
// Deterministic comparator for `ScanResult` so that every stage of the
// pipeline (Scanner → Spec_Builder → Task_Planner) re-applies the same
// total order without ambiguity.
//
// Rationale (Karpathy / Zero Magic):
//   - Pure plain-string comparison (`<` / `>`) is used for `absolutePath`.
//     `localeCompare` would pull in an ICU table that differs across Node
//     versions and OS locales; plain string compare is byte-stable.
//   - The comparator defines a TOTAL order, which makes `Array.prototype.sort`
//     idempotent: `sortScanResults(sortScanResults(xs))` is deep-equal to
//     `sortScanResults(xs)` (Property 6).
//   - `sortScanResults` allocates a fresh array via `slice()` so the input
//     `ReadonlyArray<ScanResult>` is never mutated.

import type { PriorityTier, ScanResult } from "../types.ts";

/**
 * Tier weight — lower weight sorts first. `TOP` must precede `REVIEW`.
 * The object is frozen so callers cannot accidentally mutate the ordering
 * at runtime.
 */
const PRIORITY_TIER_WEIGHT: Readonly<Record<PriorityTier, number>> =
  Object.freeze({
    TOP: 0,
    REVIEW: 1,
  });

/**
 * Total-order comparator for `ScanResult`.
 *
 * Tie-breaking cascade (matches design's "정렬 규칙"):
 *   1. `priorityTier`: `TOP` (weight 0) before `REVIEW` (weight 1).
 *   2. `loc`         : descending (larger files first).
 *   3. `absolutePath`: lexicographic ascending via plain `<` / `>`.
 *
 * Returns a negative number when `a` should sort before `b`, positive when
 * after, and `0` only when the two scan results are tied on all three axes.
 */
export function compareScanResult(a: ScanResult, b: ScanResult): number {
  const tierDelta =
    PRIORITY_TIER_WEIGHT[a.priorityTier] - PRIORITY_TIER_WEIGHT[b.priorityTier];
  if (tierDelta !== 0) return tierDelta;

  // Descending `loc`: larger `loc` sorts first, so we flip the subtraction.
  const locDelta = b.loc - a.loc;
  if (locDelta !== 0) return locDelta;

  if (a.absolutePath < b.absolutePath) return -1;
  if (a.absolutePath > b.absolutePath) return 1;
  return 0;
}

/**
 * Returns a new array of `ScanResult` sorted by `compareScanResult`.
 *
 * Invariants:
 *   - Input `xs` is never mutated (we `slice()` first).
 *   - Idempotent: `sortScanResults(sortScanResults(xs))` is deep-equal to
 *     `sortScanResults(xs)` because `compareScanResult` is a total order.
 */
export function sortScanResults(xs: readonly ScanResult[]): ScanResult[] {
  return xs.slice().sort(compareScanResult);
}

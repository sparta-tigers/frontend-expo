// Feature: fat-file-refactoring
//
// `Fat_File_Scanner` facade (Task 2.9).
//
// Wires the individual scanner primitives into the deterministic pipeline
// specified in design.md:
//
//   enumerateSourceFiles → readFileSync → countLoC → buildScanResult → sortScanResults
//
// Rationale (Karpathy / Zero Magic):
//   - The facade is a plain function composition. No classes, no DI container,
//     no hidden state. Re-running `scan()` with the same inputs and the same
//     filesystem contents yields a deep-equal result (Req 1.1, 1.4, 1.9).
//   - Node stdlib only: `fs.readFileSync` + `path.relative`. File reads are
//     synchronous on purpose — directory counts are small and sync keeps the
//     call graph flat and greppable.
//   - No logging, no mutation of process state, no network. The only side
//     effects are the synchronous file reads required to count LoC.
//   - Sub-threshold files are dropped inside `buildScanResult` (which returns
//     `null`), so we never surface non-Fat files downstream (Req 1.8).
//
// Requirements covered: 1.1, 1.4, 1.9.

import * as fs from "node:fs";
import * as path from "node:path";

import type { ScanResult } from "../types.ts";
import { countLoC } from "./count-loc.ts";
import { enumerateSourceFiles } from "./enumerate.ts";
import { buildScanResult } from "./priority-tier.ts";
import { sortScanResults } from "./sort.ts";

/**
 * Options accepted by {@link scan}.
 *
 * - `rootDir`     : absolute workspace root. `ScanResult.relativePath` is
 *                   computed as `path.relative(rootDir, absolutePath)`.
 * - `targets`     : workspace-relative directory names to recurse into.
 * - `extensions`  : optional extension whitelist. Falls through to
 *                   {@link DEFAULT_EXTENSIONS} inside `enumerateSourceFiles`.
 * - `excludeDirs` : optional directory-segment blacklist. Falls through to
 *                   {@link DEFAULT_EXCLUDE_DIRS} inside `enumerateSourceFiles`.
 */
export type ScanOptions = {
  readonly rootDir: string;
  readonly targets: readonly string[];
  readonly extensions?: readonly string[];
  readonly excludeDirs?: readonly string[];
};

/**
 * Scan the configured `targets` under `rootDir` for Fat Files.
 *
 * Pipeline:
 *   1. Enumerate absolute source paths (`enumerateSourceFiles`).
 *   2. For each path, read the file with UTF-8 encoding, compute LoC
 *      (`countLoC`), derive the workspace-relative path, and build a
 *      `ScanResult` (`buildScanResult`). Sub-threshold files produce `null`
 *      and are skipped.
 *   3. Sort the surviving results via `sortScanResults`.
 *
 * Determinism:
 *   - `enumerateSourceFiles` sorts its directory traversal, so path order is
 *     reproducible before scanning.
 *   - `countLoC` and `buildScanResult` are pure.
 *   - `sortScanResults` imposes a total order (Property 6).
 *   → Same inputs + same filesystem contents → deep-equal `ScanResult[]`.
 */
export function scan(opts: ScanOptions): ScanResult[] {
  const enumerateOpts: {
    readonly rootDir: string;
    readonly targets: readonly string[];
    extensions?: readonly string[];
    excludeDirs?: readonly string[];
  } = {
    rootDir: opts.rootDir,
    targets: opts.targets,
  };
  // `exactOptionalPropertyTypes: true` disallows writing `undefined` into an
  // optional field, so we copy the keys only when the caller actually
  // supplied them.
  if (opts.extensions !== undefined) {
    enumerateOpts.extensions = opts.extensions;
  }
  if (opts.excludeDirs !== undefined) {
    enumerateOpts.excludeDirs = opts.excludeDirs;
  }

  const absolutePaths = enumerateSourceFiles(enumerateOpts);

  const results: ScanResult[] = [];
  for (const absolutePath of absolutePaths) {
    const source = fs.readFileSync(absolutePath, "utf8");
    const loc = countLoC(source);
    const relativePath = path.relative(opts.rootDir, absolutePath);

    const result = buildScanResult({ absolutePath, relativePath, loc });
    if (result === null) continue; // sub-threshold file (Req 1.8)
    results.push(result);
  }

  return sortScanResults(results);
}

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------
// Downstream stages (Diagnosis_Engine, Spec_Builder) and the PBT suite import
// the scanner primitives through this barrel so they only need to reference
// `scripts/fat-file/scanner`. Exporting the helpers here — in addition to
// their original modules — keeps the public surface of the Scanner a single
// entry point.

export { countLoC } from "./count-loc.ts";
export {
  DEFAULT_EXCLUDE_DIRS,
  DEFAULT_EXTENSIONS,
  enumerateSourceFiles,
} from "./enumerate.ts";
export type { EnumerateOptions } from "./enumerate.ts";
export { buildScanResult, priorityTier } from "./priority-tier.ts";
export type { BuildScanResultArgs } from "./priority-tier.ts";
export { compareScanResult, sortScanResults } from "./sort.ts";

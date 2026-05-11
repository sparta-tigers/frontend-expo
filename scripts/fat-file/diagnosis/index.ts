// Feature: fat-file-refactoring
//
// `Diagnosis_Engine` facade (Task 4.5).
//
// Wires the two diagnosis primitives into the per-file pipeline specified in
// design.md:
//
//   ScanResult + source
//     → classifyConcerns(source)    → concerns[], mixed
//     → detectAnyOccurrences(source) → anyOccurrences[]
//     → Diagnosis (merged with ScanResult fields)
//
// Rationale (Karpathy / Zero Magic):
//   - Pure function composition. No classes, no DI, no hidden state. Running
//     `diagnose()` twice with the same (file, source) inputs yields a
//     deep-equal `Diagnosis` (Req 2.1, 2.2, 2.3, 2.4).
//   - No I/O inside the facade itself. `diagnoseAll()` accepts an injected
//     `readSource` callback so callers remain in control of filesystem
//     access; the facade never imports `node:fs`.
//   - The `Diagnosis` shape is defined in `../types.ts`. We spread the
//     incoming `ScanResult` first, then overlay the diagnosis-specific
//     fields — identical to the `extends ScanResult` declaration.
//
// Requirements covered: 2.1, 2.2, 2.3, 2.4.

import type { Diagnosis, ScanResult } from "../types.ts";
import { classifyConcerns } from "./classify-concern.ts";
import { detectAnyOccurrences } from "./detect-any.ts";

/**
 * Diagnose a single Fat File.
 *
 * - `file`   : the `ScanResult` produced by `Fat_File_Scanner` for this path.
 * - `source` : the file's raw source text. The caller is responsible for
 *              reading it (usually the same UTF-8 read the scanner used).
 *
 * Returns a `Diagnosis` that preserves every `ScanResult` invariant and
 * carries the three analysis fields (`concerns`, `mixed`, `anyOccurrences`)
 * exactly as produced by the two primitives. No post-processing, no
 * deduplication beyond what each primitive already guarantees.
 */
export function diagnose(file: ScanResult, source: string): Diagnosis {
  const { concerns, mixed } = classifyConcerns(source);
  const anyOccurrences = detectAnyOccurrences(source);

  return {
    ...file,
    concerns,
    mixed,
    anyOccurrences,
  };
}

/**
 * Convenience wrapper that diagnoses every result in a scan output.
 *
 * - `results`    : `ScanResult[]` returned by `Fat_File_Scanner.scan()`.
 * - `readSource` : caller-provided reader. Typical implementation is
 *                  `(p) => fs.readFileSync(p, "utf8")`. Keeping the reader
 *                  as a parameter lets tests inject in-memory sources
 *                  without touching the filesystem.
 *
 * Output preserves the input order — the scanner has already sorted its
 * results (Property 6), and this wrapper does not re-sort.
 */
export function diagnoseAll(
  results: readonly ScanResult[],
  readSource: (absolutePath: string) => string,
): Diagnosis[] {
  const out: Diagnosis[] = [];
  for (const file of results) {
    out.push(diagnose(file, readSource(file.absolutePath)));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------
// Downstream stages (`Spec_Builder`, the PBT suite, future CLI wiring) import
// the diagnosis primitives through this barrel so they only need to
// reference `scripts/fat-file/diagnosis`. The original modules remain
// importable directly for co-located tests.

export {
    classifyBlock,
    classifyConcerns,
    splitTopLevelBlocks
} from "./classify-concern.ts";
export type {
    ClassifiedBlock,
    ClassifyConcernsResult,
    TopLevelBlock
} from "./classify-concern.ts";
export { detectAnyOccurrences } from "./detect-any.ts";


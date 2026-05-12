// Feature: fat-file-refactoring
//
// Common data models for the Fat File pipeline.
//
// Rationale (Karpathy / Zero Magic):
//   - Pure `export type` declarations; no runtime code lands here.
//   - Every field is `readonly` and every array is `ReadonlyArray<T>` so the
//     pipeline stages (Scanner → Diagnosis → Spec → Task → Verifier) cannot
//     mutate each other's outputs in place.
//   - `verbatimModuleSyntax: true` forces `export type { ... }` at consumers;
//     we mirror the convention here by exporting every symbol via `export type`.
//
// Invariants for each type are documented inline via JSDoc. The enforcement of
// those invariants is the responsibility of the module that builds the value
// (e.g. `priorityTier()` inside the Scanner); this file only declares shapes.

// ---------------------------------------------------------------------------
// Source files
// ---------------------------------------------------------------------------

/**
 * A raw source file read from disk, prior to any LoC / Concern analysis.
 *
 * Invariants:
 * - `absolutePath` is an absolute filesystem path.
 * - `relativePath` is relative to the workspace root and uses POSIX separators.
 * - `extension` is one of the four frontend source extensions the scanner
 *   accepts; binary or unknown extensions never appear here.
 * - `content` is the UTF-8 decoded text of the file. Binary-decoded failures
 *   cause the file to be skipped upstream, so `content` is always a valid
 *   string.
 */
export type SourceFile = {
  readonly absolutePath: string;
  readonly relativePath: string;
  readonly extension: ".ts" | ".tsx" | ".js" | ".jsx";
  readonly content: string;
};

// ---------------------------------------------------------------------------
// Scanner output
// ---------------------------------------------------------------------------

/**
 * Priority tier assigned to a Fat File by the scanner.
 *
 * Invariants:
 * - `"TOP"`    ↔ `loc >= 1000`
 * - `"REVIEW"` ↔ `500 <= loc < 1000`
 * - Files with `loc < 500` are filtered out before a `PriorityTier` is ever
 *   assigned, so this type has no `"NONE"` variant by design.
 */
export type PriorityTier = "TOP" | "REVIEW";

/**
 * A file the scanner flagged as a Fat File.
 *
 * Invariants:
 * - `loc >= 500` (files below the threshold are excluded from scan output).
 * - `(loc >= 1000) ↔ (priorityTier === "TOP")`.
 * - `(500 <= loc < 1000) ↔ (priorityTier === "REVIEW")`.
 * - `relativePath` is relative to the workspace root with POSIX separators.
 */
export type ScanResult = {
  readonly absolutePath: string;
  readonly relativePath: string;
  readonly loc: number;
  readonly priorityTier: PriorityTier;
};

// ---------------------------------------------------------------------------
// Diagnosis output
// ---------------------------------------------------------------------------

/**
 * Concern category assigned to a top-level block within a source file.
 *
 * - `UI`       : React components returning JSX.
 * - `Logic`    : Custom hooks, pure functions, store factories, async actions.
 * - `Type`     : `interface` / `type` / `enum` declarations.
 * - `Style`    : `StyleSheet.create` or styled-components declarations.
 * - `Constant` : Module-scope immutable literal constants.
 *
 * Note on naming: the identifier uses an intentional underscore
 * (`Concern_Category`) to match the vocabulary defined in `requirements.md`
 * and `design.md`. It is purposefully not renamed to `ConcernCategory` so
 * greps across spec and implementation stay aligned.
 */
export type Concern_Category = "UI" | "Logic" | "Type" | "Style" | "Constant";

/**
 * Syntactic context in which an `any` occurrence was detected.
 *
 * Mapping from the five regex patterns in the design to the seven context
 * labels here:
 * - `: any`               → `"variable"` | `"parameter"` | `"return"`
 *                            (position-dependent, determined by the detector).
 * - `as any`              → `"assertion"`.
 * - `<any>`               → `"generic"`.
 * - `any[]`               → `"array"`.
 * - `Record<_, any>`      → `"record"`.
 */
export type AnyOccurrenceContext =
  | "variable"
  | "parameter"
  | "return"
  | "generic"
  | "assertion"
  | "array"
  | "record";

/**
 * A single `any` usage discovered by the Diagnosis Engine.
 *
 * Invariants:
 * - `line >= 1` and `line <= total line count of the containing file`
 *   (1-based line numbering matching editor and tsc conventions).
 * - `snippet` is the trimmed original line text. It must contain the `any`
 *   token that produced this occurrence.
 */
export type AnyOccurrence = {
  readonly line: number;
  readonly context: AnyOccurrenceContext;
  readonly snippet: string;
};

/**
 * Diagnosis for a single Fat File. Extends `ScanResult` with the per-file
 * analysis results (concern mix + `any` usage inventory).
 *
 * Invariants:
 * - All `ScanResult` invariants are preserved.
 * - `concerns` contains distinct entries (no duplicates) and is ordered
 *   canonically as `UI → Logic → Type → Style → Constant` so serialization
 *   is deterministic.
 * - `mixed ↔ (concerns.length >= 2)`.
 * - Every `anyOccurrences[i].line` is within the source file's line range.
 */
export type Diagnosis = ScanResult & {
  readonly concerns: readonly Concern_Category[];
  readonly mixed: boolean;
  readonly anyOccurrences: readonly AnyOccurrence[];
};

// ---------------------------------------------------------------------------
// Refactoring spec
// ---------------------------------------------------------------------------

/**
 * Planned new module produced by decomposing a Fat File.
 *
 * Invariants:
 * - `path` is workspace-relative with POSIX separators and matches the naming
 *   rule for its `concern` (see design's "네이밍 규칙 매핑" table).
 * - `expectedLoc <= 300`, unless the enclosing `RefactoringSpecEntry` carries
 *   an `exception` (Req 4.3).
 * - `publicApi` lists named exports plus, when applicable, the literal
 *   `"default"` key to represent a default export.
 */
export type ModulePlan = {
  readonly path: string;
  readonly concern: Concern_Category;
  readonly expectedLoc: number;
  readonly publicApi: readonly string[];
};

/**
 * Strategy chosen for replacing a single `any` occurrence.
 *
 * - `"named-interface"`    : introduce / reuse a named `interface`.
 * - `"named-type"`         : introduce / reuse a named `type` alias.
 * - `"unknown-with-guard"` : type the boundary as `unknown` and add a type
 *                            guard function; `guardFunction` is then required.
 */
export type TypeReplacementStrategy =
  | "named-interface"
  | "named-type"
  | "unknown-with-guard";

/**
 * A single planned `any` → concrete-type replacement.
 *
 * Invariants:
 * - `originalLine` matches the `line` of the source `AnyOccurrence`.
 * - `from` is the original source snippet containing `any`.
 * - `to` is the replacement snippet and MUST NOT contain the word-boundary
 *   token `\bany\b` (the detector rejects plans otherwise).
 * - `strategy === "unknown-with-guard"` ↔ `guardFunction` is a non-empty
 *   identifier. For the other two strategies, `guardFunction` is absent.
 */
export type TypeReplacement = {
  readonly originalLine: number;
  readonly from: string;
  readonly to: string;
  readonly strategy: TypeReplacementStrategy;
  readonly guardFunction?: string;
};

/**
 * Barrel file that re-exports the decomposed modules to preserve the original
 * Fat File's import path.
 *
 * Invariants:
 * - `path` ends with `/index.ts` (or the original file path, when the barrel
 *   replaces a single-file module such as a standalone hook).
 * - `reExports` is the exact set of public symbols the barrel re-exposes; its
 *   union with `ModulePlan.publicApi` across `decomposition` must cover the
 *   original Fat File's Public_API (Req 7.1, 7.2, 10.4).
 */
export type BarrelFilePlan = {
  readonly path: string;
  readonly reExports: readonly string[];
};

/**
 * Exception clause flagged when a Fat File cannot be decomposed within the
 * 300 LoC / single-concern constraints (Req 4.3).
 *
 * Invariants:
 * - `reason` is a non-empty human-readable explanation.
 * - `userConfirmationRequired` is pinned to the literal `true`; presence of
 *   this field is itself the signal that user confirmation is needed.
 */
export type RefactoringException = {
  readonly reason: string;
  readonly userConfirmationRequired: true;
};

/**
 * Full refactoring plan for one Fat File.
 *
 * Invariants:
 * - When `exception` is absent: `decomposition.every(m => m.expectedLoc <= 300)`.
 * - The union of `decomposition[*].publicApi` and `barrelFile.reExports`
 *   is a superset of the original Fat File's Public_API (name, form, and
 *   type signature axes — see design's "Public_API 3축 보존").
 * - `typeReplacements` is in 1:1 correspondence (by line number) with the
 *   source `Diagnosis.anyOccurrences` (Property 10).
 */
export type RefactoringSpecEntry = {
  readonly source: Diagnosis;
  readonly decomposition: readonly ModulePlan[];
  readonly typeReplacements: readonly TypeReplacement[];
  readonly barrelFile: BarrelFilePlan;
  readonly exception?: RefactoringException;
};

// ---------------------------------------------------------------------------
// Task planner output
// ---------------------------------------------------------------------------

/**
 * State machine vertex for a per-file Refactoring Task.
 *
 * Allowed transitions (see design's state diagram):
 *   Pending → Planned → Executed → Verified → Done
 *   Planned → Halted    (decomposition impossible, Req 4.3)
 *   Executed → Halted   (validation failed, Req 10.5)
 *   Halted → Pending    (after user confirmation)
 */
export type RefactoringTaskState =
  | "Pending"
  | "Planned"
  | "Executed"
  | "Verified"
  | "Done"
  | "Halted";

/**
 * A single task in the refactoring backlog.
 *
 * Invariants:
 * - Each task targets exactly one Fat File (`targetFile`) — no multi-file
 *   tasks (Req 9.1).
 * - `generatedModules.length === expectedLocs.length` and both are > 0; the
 *   two arrays are index-aligned (module at index `i` has expected LoC
 *   `expectedLocs[i]`).
 * - `requirementsRefs ⊇ {1, 2, 3, 4, 5, 6, 7, 8}` — every task is traced to
 *   all eight primary requirements (Req 9.4).
 * - `state` transitions obey the state machine above.
 */
export type RefactoringTask = {
  readonly id: string;
  readonly targetFile: string;
  readonly generatedModules: readonly string[];
  readonly expectedLocs: readonly number[];
  readonly requirementsRefs: readonly number[];
  readonly state: RefactoringTaskState;
};

// ---------------------------------------------------------------------------
// Verifier output
// ---------------------------------------------------------------------------

/**
 * Per-file validation checklist evaluated after a Refactoring Task's
 * `Executed` transition.
 *
 * Invariants:
 * - `locBound`            : every generated module has `loc <= 300`.
 * - `singleConcern`       : every generated module has exactly one Concern.
 * - `tscBaselineClean`    : `(current tsc errors) \ (baseline tsc errors) = ∅`.
 * - `publicApiPreserved`  : original Public_API is a subset of
 *                           (new modules' exports ∪ barrel re-exports).
 * - `anyResidualCount`    : total `any` token count across the refactored
 *                           modules. MUST be 0 for the task to pass
 *                           (Req 6.3); the field is surfaced even when 0 so
 *                           downstream reporting can show it explicitly.
 */
export type ValidationChecklist = {
  readonly locBound: boolean;
  readonly singleConcern: boolean;
  readonly tscBaselineClean: boolean;
  readonly publicApiPreserved: boolean;
  readonly anyResidualCount: number;
};

/**
 * Final verification report for a single Fat File.
 *
 * Invariants (see Property 16):
 * - `passed` is the conjunction
 *     `locBound ∧ singleConcern ∧ tscBaselineClean ∧ publicApiPreserved
 *      ∧ anyResidualCount === 0`.
 * - `passed === false` ↔ `failedReasons.length >= 1`; the Refactoring Task
 *   transitions to `Halted` in that case.
 * - `notes` carries informational messages that do NOT halt the pipeline
 *   (Req 10.6). It is always present (possibly empty) so downstream code
 *   can iterate it without nil-checks.
 */
export type ValidationReport = {
  readonly file: string;
  readonly checklist: ValidationChecklist;
  readonly passed: boolean;
  readonly failedReasons: readonly string[];
  readonly notes: readonly string[];
};

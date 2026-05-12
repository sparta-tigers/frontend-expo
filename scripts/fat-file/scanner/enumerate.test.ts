// Feature: fat-file-refactoring, Property 2: Source_File 필터링 건전성

// Validates: Requirements 1.1, 1.2, 1.3
//
// Property 2 (from design.md, Correctness Properties):
//   For any file-path set P laid down on disk, every path returned by
//   `enumerateSourceFiles({ rootDir, targets, ... })` simultaneously satisfies:
//     (a) it belongs under one of `targets` (i.e. its path under `rootDir`
//         starts with a target directory segment),
//     (b) its extension is in {".ts", ".tsx", ".js", ".jsx"},
//     (c) no path segment equals any `excludeDirs` entry
//         ("node_modules", ".expo", "dist", "build", ".git").
//   And conversely: any file in P satisfying (a) ∧ (b) ∧ (c) is NOT missing
//   from the output (completeness).
//
// Strategy (Karpathy / Bare Metal):
//   - Spin up a fresh tmpdir per fc iteration inside os.tmpdir().
//   - Generate a small (≤ 20) random file tree with a mix of target and
//     non-target top segments, excluded and non-excluded segments at any
//     depth, and both source and non-source extensions.
//   - Create the files on disk with fs.writeFileSync, then call
//     `enumerateSourceFiles({ rootDir, targets: ["foo", "bar", "baz"] })`.
//   - Assert soundness (every returned path passes (a)+(b)+(c)) and
//     completeness (every file matching (a)+(b)+(c) is in the result).

import { array, assert as fcAssert, constantFrom, property, record, stringMatching } from "fast-check";
import { strict as assert } from "node:assert";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { test } from "node:test";

import {
    DEFAULT_EXCLUDE_DIRS,
    DEFAULT_EXTENSIONS,
    enumerateSourceFiles,
} from "./enumerate.ts";

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

// The three target top-level directories the scanner is asked to recurse into.
const TARGETS = ["foo", "bar", "baz"] as const;

// A segment pool that mixes:
//   - TARGET top-level names: "foo", "bar", "baz"
//   - NON-TARGET top-level name: "qux" (should be pruned by (a))
//   - EXCLUDED segment names: "node_modules", ".expo", "dist", "build", ".git"
//     (should be pruned by (c), at any depth)
//   - Plain directory names: "a", "b", "c"
const segmentArb = constantFrom(
  "foo",
  "bar",
  "baz",
  "qux",
  "node_modules",
  ".expo",
  "dist",
  "build",
  ".git",
  "a",
  "b",
  "c",
);

// Mix of source and non-source extensions so completeness is non-trivial.
const extensionArb = constantFrom(
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".md",
  ".json",
);

// File base name — short, filesystem-safe, non-empty.
const baseNameArb = stringMatching(/^[a-z][a-z0-9]{0,5}$/);

// A single file entry: 1..4 directory segments + a base name + an extension.
// The first segment acts as the top-level; when it is not in TARGETS the
// entry is always excluded by condition (a).
const fileEntryArb = record({
  segments: array(segmentArb, { minLength: 1, maxLength: 4 }),
  baseName: baseNameArb,
  ext: extensionArb,
});

// A file tree: at most 20 entries to keep each fc run cheap and shrink-friendly.
const fileTreeArb = array(fileEntryArb, { minLength: 0, maxLength: 20 });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// fast-check 4.6 dropped the public `GetValueFromArbitrary` utility, so we
// reconstruct the generated record's shape directly. Kept narrow (no opaque
// aliases) so shrinkers and future contributors can see the exact shape.
type FileEntry = {
  segments: string[];
  baseName: string;
  ext: string;
};

function relPathOf(entry: FileEntry): string {
  return path.join(...entry.segments, `${entry.baseName}${entry.ext}`);
}

/**
 * Reference oracle for Property 2. A file at the given workspace-relative
 * path is expected in the scanner output iff all three conditions hold.
 */
function shouldBeIncluded(relPath: string): boolean {
  const segments = relPath.split(path.sep).filter((s) => s.length > 0);
  if (segments.length === 0) return false;

  // (a) top-level segment must be one of TARGETS.
  if (!TARGETS.includes(segments[0] as (typeof TARGETS)[number])) return false;

  // (c) no segment may equal an excluded directory name.
  for (const seg of segments) {
    if ((DEFAULT_EXCLUDE_DIRS as readonly string[]).includes(seg)) {
      return false;
    }
  }

  // (b) extension must be in the allowlist.
  const ext = path.extname(segments[segments.length - 1]);
  if (!(DEFAULT_EXTENSIONS as readonly string[]).includes(ext)) {
    return false;
  }

  return true;
}

/**
 * Materialize the generated tree on disk under `rootDir`. Duplicate relative
 * paths are collapsed into a single file (latest wins); the set of unique
 * paths is returned so completeness checks can compare against the on-disk
 * reality, not the pre-dedupe generator output.
 */
function materializeTree(
  rootDir: string,
  entries: readonly FileEntry[],
): Set<string> {
  const uniqueRel = new Set<string>();
  for (const entry of entries) {
    const rel = relPathOf(entry);
    uniqueRel.add(rel);
    const abs = path.join(rootDir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, "");
  }
  return uniqueRel;
}

// ---------------------------------------------------------------------------
// Property
// ---------------------------------------------------------------------------

test("Property 2: enumerateSourceFiles is sound and complete w.r.t. (targets, extensions, excludeDirs)", (t) => {
  // Per-test parent tmpdir so any accidental leaks are swept by t.after.
  // `realpathSync` canonicalizes symlinked tmpdirs (e.g. /tmp → /private/tmp
  // on macOS) so string comparisons against rootDir are stable.
  const parentTmp = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), "fat-file-enum-")),
  );

  t.after(() => {
    fs.rmSync(parentTmp, { recursive: true, force: true });
  });

  fcAssert(
    property(fileTreeArb, (entries) => {
      // Each fc iteration gets its own rootDir under parentTmp and cleans up
      // deterministically, regardless of assertion outcome.
      const rootDir = fs.mkdtempSync(path.join(parentTmp, "run-"));
      try {
        const createdRel = materializeTree(rootDir, entries);

        const result = enumerateSourceFiles({
          rootDir,
          targets: TARGETS as readonly string[],
        });

        // Convert absolute paths back to rootDir-relative for assertions.
        const resultRel = new Set(
          result.map((abs) => path.relative(rootDir, abs)),
        );

        // Soundness: every returned path satisfies (a) ∧ (b) ∧ (c).
        for (const rel of resultRel) {
          assert.ok(
            shouldBeIncluded(rel),
            `soundness violated: ${rel} should not have been included`,
          );
        }

        // Completeness: every on-disk path satisfying the 3 conditions is
        // in the result.
        const expectedRel = new Set(
          [...createdRel].filter((rel) => shouldBeIncluded(rel)),
        );
        for (const rel of expectedRel) {
          assert.ok(
            resultRel.has(rel),
            `completeness violated: ${rel} missing from result`,
          );
        }

        // Exact-set equality — defense in depth against accidental extras
        // that slip past soundness (e.g. path-normalization bugs).
        assert.equal(
          resultRel.size,
          expectedRel.size,
          `size mismatch: got ${resultRel.size}, expected ${expectedRel.size}`,
        );
      } finally {
        fs.rmSync(rootDir, { recursive: true, force: true });
      }
    }),
    { numRuns: 50 },
  );
});

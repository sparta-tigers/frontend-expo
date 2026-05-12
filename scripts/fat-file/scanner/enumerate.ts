// Feature: fat-file-refactoring
//
// Source file enumerator for the Fat_File_Scanner pipeline.
//
// Rationale (Karpathy / Bare Metal):
//   - Node stdlib `fs` + `path` only. No glob libraries, no AST parsers.
//   - Synchronous recursion: deterministic ordering is trivial to reason about
//     and the target directories are small enough (a few thousand files at
//     most) that async gains are not worth the complexity.
//   - Pure function surface: callers pass `rootDir`, `targets`, and optional
//     `extensions` / `excludeDirs`. No globals, no environment lookups.
//   - Missing targets are skipped silently so the scanner works on partial
//     repos (e.g. when `styles/` has not been scaffolded yet).
//
// Requirements covered: 1.1, 1.2, 1.3.

import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Default source-file extensions. Kept in sync with design.md's
 * `Fat_File_Scanner.extensions` and with `requirements.md` Req 1.2.
 */
export const DEFAULT_EXTENSIONS: readonly string[] = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
];

/**
 * Default directory names excluded from enumeration. Any path segment equal
 * to one of these disqualifies a file. Matches design.md's
 * `Fat_File_Scanner.excludes` and `requirements.md` Req 1.3.
 */
export const DEFAULT_EXCLUDE_DIRS: readonly string[] = [
  "node_modules",
  ".expo",
  "dist",
  "build",
  ".git",
];

/**
 * Options for {@link enumerateSourceFiles}.
 *
 * - `rootDir`     : absolute path of the workspace root. `targets` are
 *                   resolved relative to this.
 * - `targets`     : workspace-relative directory names to recurse into, e.g.
 *                   `["app", "components", "context", "hooks", "src", "styles"]`.
 *                   Missing entries (directory not present) are skipped.
 * - `extensions`  : file extensions to include, case-sensitive, leading dot
 *                   required. Defaults to {@link DEFAULT_EXTENSIONS}.
 * - `excludeDirs` : directory segment names to exclude at any depth. Defaults
 *                   to {@link DEFAULT_EXCLUDE_DIRS}.
 */
export type EnumerateOptions = {
  readonly rootDir: string;
  readonly targets: readonly string[];
  readonly extensions?: readonly string[];
  readonly excludeDirs?: readonly string[];
};

/**
 * Recursively enumerate source files under `opts.targets`.
 *
 * Guarantees:
 * 1. Every returned path is absolute and sorted lexically (ascending).
 * 2. The result is deterministic: directory entries are sorted before
 *    recursion, so two invocations with identical inputs and filesystem
 *    contents produce identical output.
 * 3. No returned path has any segment equal to an `excludeDirs` entry.
 * 4. Every returned path's extension is in `extensions`.
 * 5. Missing target directories are silently skipped; other filesystem errors
 *    propagate (they indicate a real problem the caller must handle).
 */
export function enumerateSourceFiles(opts: EnumerateOptions): string[] {
  const extensions = opts.extensions ?? DEFAULT_EXTENSIONS;
  const excludeDirs = opts.excludeDirs ?? DEFAULT_EXCLUDE_DIRS;

  const extensionSet = new Set(extensions);
  const excludeSet = new Set(excludeDirs);

  const collected: string[] = [];
  const rootAbs = path.resolve(opts.rootDir);

  for (const target of opts.targets) {
    const targetAbs = path.resolve(rootAbs, target);
    const relToRoot = path.relative(rootAbs, targetAbs);

    // Why: ../를 포함하거나 절대 경로인 경우 rootDir 바깥을 가리키므로 차단.
    //      path.resolve 단독 사용은 ../을 정상 처리하므로 상대 경로로 변환 후 검증 필수.
    if (relToRoot.startsWith("..") || path.isAbsolute(relToRoot)) {
      throw new Error(
        `[enumerate] Target '${target}' is outside rootDir '${opts.rootDir}'. Path traversal blocked.`
      );
    }

    // Skip if any segment of the target itself is excluded (e.g. a caller
    // accidentally passing "node_modules/foo"). Cheaper and safer than
    // discovering the exclusion deep in recursion.
    if (hasExcludedSegment(target, excludeSet)) {
      continue;
    }

    let stat: fs.Stats;
    try {
      stat = fs.statSync(targetAbs);
    } catch (err) {
      if (isEnoent(err)) {
        // Req: handle missing target directories gracefully.
        continue;
      }
      throw err;
    }

    if (!stat.isDirectory()) {
      // Targets are expected to be directories. A file target is a caller
      // error, not our responsibility to salvage. Skip quietly to keep the
      // enumerator total.
      continue;
    }

    walk(targetAbs, extensionSet, excludeSet, collected);
  }

  collected.sort();
  return collected;
}

/**
 * Depth-first directory walk. Directory entries are sorted before recursion
 * so enumeration order is reproducible regardless of filesystem ordering.
 */
function walk(
  dirAbs: string,
  extensions: ReadonlySet<string>,
  excludeDirs: ReadonlySet<string>,
  out: string[],
): void {
  // `withFileTypes: true` avoids a per-entry `statSync` call and gives us
  // the `.isDirectory()` / `.isFile()` bit straight from `readdir`.
  const entries = fs.readdirSync(dirAbs, { withFileTypes: true });

  // Deterministic order: sort by entry name ascending.
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

  for (const entry of entries) {
    const name = entry.name;

    // Excluded directory segments are filtered at every level. We do not peek
    // beyond the exclusion — the whole subtree is skipped.
    if (entry.isDirectory()) {
      if (excludeDirs.has(name)) continue;
      walk(path.join(dirAbs, name), extensions, excludeDirs, out);
      continue;
    }

    if (!entry.isFile()) {
      // Symlinks, sockets, FIFOs, etc. are not source files. Skip.
      // We intentionally do not follow symlinks to sidestep cycles without
      // tracking visited inodes.
      continue;
    }

    // Extension check is a cheap string suffix match; path.extname handles
    // the leading-dot convention.
    const ext = path.extname(name);
    if (!extensions.has(ext)) continue;

    out.push(path.join(dirAbs, name));
  }
}

/**
 * True if any segment of the POSIX-or-native path equals an excluded name.
 * Split on both separators so callers can pass either style.
 */
function hasExcludedSegment(
  p: string,
  excludeDirs: ReadonlySet<string>,
): boolean {
  if (p === "") return false;
  const segments = p.split(/[\\/]+/);
  for (const seg of segments) {
    if (seg !== "" && excludeDirs.has(seg)) return true;
  }
  return false;
}

/**
 * Narrow an unknown thrown value to a Node.js `ENOENT` error without pulling
 * in a type dependency on NodeJS.ErrnoException.
 */
function isEnoent(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "ENOENT"
  );
}

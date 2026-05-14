// Feature: fat-file-refactoring
/**
 * Feature: fat-file-refactoring
 *
 * Concern 분류기 (Task 4.1)
 *
 * Why:
 * AST 파서나 TypeScript Compiler API와 같은 무거운 툴링 없이 순수 정규식과 휴리스틱만으로
 * 소스 코드 블록의 관심사(UI, Logic, Type, Style, Constant)를 분류하여 빠른 분석 속도와
 * 결정론적 결과를 보장하기 위함.
 *
 * - 문자열 리터럴과 주석은 의도적으로 토큰화하지 않으며, AST 파싱 없이 단일 루프를 통해 블록의 brace depth를 추적함.
 * - 분류 직전에만 주석을 stripping 하여 정규식이 오탐하지 않도록 함.
 * - 평가 우선순위(Evaluation priority)는 UI -> Style -> Type -> Constant -> Logic 순으로 적용됨.
 * - 최종 반환되는 분류 순서(CANONICAL_ORDER)는 UI -> Logic -> Type -> Style -> Constant 순으로 통일됨.
 */

import type { Concern_Category } from "../types.ts";

// ---------------------------------------------------------------------------
// Block boundary regex
// ---------------------------------------------------------------------------

/**
 * Line-start regex that marks a new top-level declaration block when the
 * current brace depth is zero.
 *
 * Keywords recognised (kept in a single table for auditability against the
 * task description): export | function | const | let | var | interface |
 * type | enum | class | async.
 *
 * `default` is matched through the `export default ...` branch: an
 * `export` prefix always precedes `default` in valid TypeScript, so the
 * `export` keyword already opens the block.
 *
 * `import` is intentionally omitted — design.md treats imports as preamble,
 * not as a block.
 */
const BLOCK_STARTER =
  /^\s*(?:export|function|const|let|var|interface|type|enum|class|async)\b/;

// ---------------------------------------------------------------------------
// Concern rule table
// ---------------------------------------------------------------------------

/**
 * UI detection heuristic. A block is UI iff it declares a PascalCase function
 * / arrow-bound component AND contains a `return (` AND at least one JSX tag.
 *
 * The RN primitive list is redundant against the generic `<[A-Z]\w*` pattern
 * but is kept verbatim from the design table for traceability.
 */
const UI_RULES = {
  /** `export (default)? function Foo` — PascalCase function component. */
  functionDecl: /\bexport\s+(?:default\s+)?function\s+[A-Z]\w*/,
  /** `const Foo[:=]` — PascalCase arrow/FC component binding. */
  arrowDecl: /\bconst\s+[A-Z]\w*\s*[:=]/,
  /** `return (` — the return-with-wrapping-parens pattern. */
  returnParen: /\breturn\s*\(/,
  /** PascalCase JSX tag OR one of the listed RN primitives. */
  jsxTag:
    /<(?:[A-Z]\w*|View|Text|ScrollView|FlatList|Pressable|TouchableOpacity|Image|StyleSheet)\b/,
} as const;

/**
 * Style detection heuristic: `StyleSheet.create(` or `styled.X` / `styled(...)`.
 */
const STYLE_RULE = /StyleSheet\.create\(|\bstyled\s*[.(]/;

/**
 * Type detection heuristic: the block's primary construct is an exported
 * `type` / `interface` / `enum` declaration.
 */
const TYPE_RULE = /\bexport\s+(?:type|interface|enum)\s+\w+/;

/**
 * Constant detection:
 *   - Primary line matches `export const UPPER_SNAKE =`.
 *   - RHS, after `=`, must NOT look like a function call (`identifier(` at
 *     the very start — e.g., `createStyles(...)`).
 *   Literal RHS values (primitive, object, array, `as const`) all pass the
 *   exclusion.
 */
const CONSTANT_RULES = {
  decl: /\bexport\s+const\s+[A-Z_][A-Z0-9_]*\s*=/,
  /** RHS starts with `identifier(` -> function-call initialiser -> not literal. */
  functionCallRhs: /^\s*[A-Za-z_$][\w$]*\s*\(/,
} as const;

/**
 * Canonical order of Concern_Category values returned by {@link classifyConcerns}.
 * Why: 출력되는 관심사의 순서를 항상 UI -> Logic -> Type -> Style -> Constant 로
 *      고정하여, 툴 체인 다운스트림에서 예측 가능한 결과 포맷을 보장함.
 */
const CANONICAL_ORDER: readonly Concern_Category[] = [
  "UI",
  "Logic",
  "Type",
  "Style",
  "Constant",
];

// ---------------------------------------------------------------------------
// splitTopLevelBlocks
// ---------------------------------------------------------------------------

/**
 * Top-level declaration block boundary returned by
 * {@link splitTopLevelBlocks}.
 *
 * `startLine` / `endLine` are 1-based inclusive. `text` is the raw source
 * text for the inclusive line range, joined with `\n`. Adjacent blocks
 * satisfy `prev.endLine + 1 === next.startLine`.
 */
export type TopLevelBlock = {
  readonly startLine: number;
  readonly endLine: number;
  readonly text: string;
};

/**
 * Split a source string into top-level declaration blocks.
 *
 * Algorithm:
 *   1. Walk lines; at each line, check the STARTING brace depth. If it is
 *      `0` and the line matches {@link BLOCK_STARTER}, the line opens a new
 *      block (and flushes the previous one, if any).
 *   2. Update brace depth by counting `{` and `}` characters on the line.
 *      No string / comment tokenization — by design.
 *   3. Lines before the first boundary (imports, leading comments) are
 *      treated as preamble and excluded from every block.
 *
 * Output:
 *   - Empty source or source with no top-level declarations -> `[]`.
 *   - Otherwise: blocks partition the range
 *     `[firstBoundaryLine, lines.length]` with no gaps and no overlaps.
 */
export function splitTopLevelBlocks(source: string): readonly TopLevelBlock[] {
  if (source === "") return [];

  const lines = source.split("\n");
  const blocks: TopLevelBlock[] = [];

  let depth = 0;
  // `currentStart === -1` means no block has been opened yet (preamble).
  let currentStart = -1;

  const flush = (endLineInclusive: number): void => {
    if (currentStart === -1) return;
    blocks.push({
      startLine: currentStart,
      endLine: endLineInclusive,
      text: lines.slice(currentStart - 1, endLineInclusive).join("\n"),
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const lineNum = i + 1;

    // (1) Depth-0 boundary check FIRST — before updating depth with this
    //     line's braces. A depth-0 `export const ...` opens a new block even
    //     when the same line introduces a `{` for the new block's body.
    if (depth === 0 && BLOCK_STARTER.test(line)) {
      flush(lineNum - 1);
      currentStart = lineNum;
    }

    // (2) Update running brace depth — approximation (no tokenization).
    for (let j = 0; j < line.length; j++) {
      const ch = line.charCodeAt(j);
      if (ch === 0x7b)
        depth++; // '{'
      else if (ch === 0x7d) depth--; // '}'
    }
  }

  // (3) Final flush — the last block runs to EOF.
  flush(lines.length);

  return blocks;
}

// ---------------------------------------------------------------------------
// classifyBlock
// ---------------------------------------------------------------------------

/**
 * Classify a single block's text into a {@link Concern_Category}.
 *
 * Priority: UI -> Style -> Type -> Constant -> Logic.
 *
 * Line and block comments are stripped before the rule table is applied so
 * regex matchers cannot fire on keywords that live inside comments. String
 * literals are intentionally NOT tokenized — the rules are anchored on
 * declaration-start patterns where accidental matches inside strings are
 * rare enough to accept per Zero Magic.
 *
 * Logic is the fallback: custom hooks, `create()` factories, plain
 * functions, `async function` declarations, re-exports — anything that
 * does not match a more specific rule lands here.
 */
export function classifyBlock(block: string): Concern_Category {
  const stripped = stripComments(block);

  // (1) UI — component shape + return( + JSX tag all three required.
  const hasComponentShape =
    UI_RULES.functionDecl.test(stripped) || UI_RULES.arrowDecl.test(stripped);
  if (
    hasComponentShape &&
    UI_RULES.returnParen.test(stripped) &&
    UI_RULES.jsxTag.test(stripped)
  ) {
    return "UI";
  }

  // (2) Style — StyleSheet.create(...) or styled.X / styled(...).
  if (STYLE_RULE.test(stripped)) return "Style";

  // (3) Type — primary construct is type/interface/enum.
  if (TYPE_RULE.test(stripped)) return "Type";

  // (4) Constant — export const UPPER_SNAKE = <non-function-call RHS>.
  const declMatch = CONSTANT_RULES.decl.exec(stripped);
  if (declMatch !== null) {
    const afterEq = stripped.slice(declMatch.index + declMatch[0].length);
    if (!CONSTANT_RULES.functionCallRhs.test(afterEq)) return "Constant";
  }

  // (5) Logic — fallback.
  return "Logic";
}

// ---------------------------------------------------------------------------
// classifyConcerns
// ---------------------------------------------------------------------------

/**
 * Per-block classification result emitted by {@link classifyConcerns}.
 * `startLine` / `endLine` mirror those of the source {@link TopLevelBlock}.
 */
export type ClassifiedBlock = {
  readonly startLine: number;
  readonly endLine: number;
  readonly concern: Concern_Category;
};

/**
 * File-level classification result.
 *
 * Invariants:
 *   - `concerns` is the distinct set of `blocks[*].concern`, ordered by
 *     `CANONICAL_ORDER` (UI -> Logic -> Type -> Style -> Constant).
 *   - `mixed` is true iff `concerns.length >= 2` (Property 4).
 */
export type ClassifyConcernsResult = {
  readonly blocks: readonly ClassifiedBlock[];
  readonly concerns: readonly Concern_Category[];
  readonly mixed: boolean;
};

/**
 * Split a source string into top-level blocks, classify each block, and
 * return the per-block ranges plus the deduplicated concern set ordered
 * canonically plus the `mixed` flag.
 *
 * A source with no top-level declarations produces `concerns === []` and
 * `mixed === false`.
 */
export function classifyConcerns(source: string): ClassifyConcernsResult {
  const raw = splitTopLevelBlocks(source);
  const blocks: ClassifiedBlock[] = raw.map((b) => ({
    startLine: b.startLine,
    endLine: b.endLine,
    concern: classifyBlock(b.text),
  }));

  const seen = new Set<Concern_Category>();
  for (const b of blocks) seen.add(b.concern);

  const concerns: Concern_Category[] = [];
  for (const c of CANONICAL_ORDER) if (seen.has(c)) concerns.push(c);

  return {
    blocks,
    concerns,
    mixed: concerns.length >= 2,
  };
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

/**
 * Remove line comments and block comments from `text`. Line structure is
 * preserved: block comments are replaced with whitespace (but `\n` is
 * kept), and line comments are truncated in place. Column indices are no
 * longer meaningful after stripping, but line indices still map 1:1 to
 * the original source — the caller never reads columns out of the
 * stripped text.
 *
 * String literals are intentionally not tokenized; see module header.
 */
function stripComments(text: string): string {
  const noBlock = text.replace(/\/\*[\s\S]*?\*\//g, (match) =>
    match.replace(/[^\n]/g, " "),
  );
  return noBlock
    .split("\n")
    .map((line) => {
      const idx = line.indexOf("//");
      return idx === -1 ? line : line.slice(0, idx);
    })
    .join("\n");
}

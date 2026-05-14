// Feature: fat-file-refactoring
//
// `any` 탐지기 — design.md 의 "Diagnosis_Engine → `any` 사용처 수집" 5개
// 컨텍스트 정규식을 결정론적으로 적용하는 순수 함수. 파일 시스템 접근이나
// 외부 프로세스 호출 없이 단일 문자열만 소비한다 (Req 2.3).
//
// Karpathy / Zero Magic:
//   - Node stdlib 에 의존하지 않는다. 순수 문자열 + RegExp.
//   - 주석 라인 제외 상태 머신은 `scanner/count-loc.ts` 의 규칙을 그대로
//     복제한다. 두 모듈이 "어떤 라인이 코드 라인인가" 에 대해 동일한
//     정의를 공유하도록 하는 것이 목적이다. 공통 헬퍼로 추출하지 않은
//     이유는 상태 머신이 7 개 분기로 짧고, 두 모듈의 출력(정수 vs 배열)
//     이 달라 복제가 오히려 readability 에 유리하기 때문이다.
//
// 탐지 패턴 우선순위 (task 4.3 가이드, 더 구체적인 패턴이 먼저):
//   1. Record<_, any>            → "record"
//   2. as any                    → "assertion"
//   3. any[]                     → "array"
//   4. <any>                     → "generic"
//   5. : any                     → "variable" | "parameter" | "return"
//
// 동일한 `any` 토큰이 여러 패턴에 잡히면 우선순위가 높은(= 더 구체적인)
// 컨텍스트가 먼저 청구한다. 예: `const x: any[] = []` 은 (3) 이 청구하여
// "array" 한 건만 산출하고 (5) 의 `:\s*any` 는 같은 토큰을 스킵한다.
// `Record<K, any>` 내부의 `any` 는 (1) 이 먼저 청구하므로 (4) `<any>` 가
// 같은 토큰을 중복 라벨링하지 않는다.
//
// `:\s*any\b` 3-way 분기 heuristic (단일 라인만 관찰):
//   - `:` 직전 비-공백 문자가 `)` → "return"    (예: `function foo(): any`)
//   - `:` 가 라인 내 열린 `(` 안에 있음 → "parameter"
//   - 그 외                       → "variable"
// 멀티라인 함수 시그니처의 정밀 분류는 design 이 best-effort 라벨을
// 허용한 범위에 해당한다.

import type { AnyOccurrence, AnyOccurrenceContext } from "../types.ts";

const JSX_COMMENT_ONLY_LINE = /^\{\/\*[\s\S]*\*\/\}$/;

// `:\s*any\b` 매치는 5번째(가장 낮은 우선순위) 패턴이다. 이 매칭이 실제로
// 변수/파라미터/반환 중 어느 컨텍스트였는지는 라인 모양에서 판별 가능
// 하므로, 테이블의 `context` 필드에 `classifyColonContext` 함수를 직접
// 꽂아두어 매처가 후-분류하도록 한다.

type ColonClassifier = (line: string, anyIndex: number) => AnyOccurrenceContext;

type PatternSpec = {
  readonly regex: RegExp;
  readonly context: AnyOccurrenceContext | ColonClassifier;
};

// Ordered highest → lowest specificity. An `any` token already claimed by a
// higher-priority pattern is skipped by every lower-priority one below.
const PATTERNS: readonly PatternSpec[] = [
  { regex: /Record<\s*[^,>]+,\s*any\s*>/g, context: "record" },
  { regex: /\bas\s+any\b/g, context: "assertion" },
  { regex: /\bany\s*\[\s*\]/g, context: "array" },
  { regex: /<\s*any\s*>/g, context: "generic" },
  { regex: /:\s*any\b/g, context: classifyColonContext },
];

/**
 * Detect every `any` usage inside a source string.
 *
 * Output ordering:
 * - Line number ascending (1-based).
 * - Column position (of the `any` token) ascending within each line.
 *
 * Exclusions (shared with `countLoC`):
 * - Blank / whitespace-only lines.
 * - Lines whose trimmed content starts with `//`.
 * - Single-line block comments `/* ... *\/`.
 * - JSX comment-only lines `{/* ... *\/}`.
 * - Lines inside a multi-line block comment, including the opening line.
 *
 * For the rare "closing block comment with trailing code" line, only the
 * text _after_ `*\/` is scanned so matches inside the comment body cannot
 * leak out.
 *
 * Invariants (Property 5):
 * - `detectAnyOccurrences("")` returns `[]`.
 * - A source composed solely of blank / comment lines returns `[]`.
 * - Depends only on its argument; no I/O, no globals. The module-level
 *   `/g` regexes have their `lastIndex` reset on every use so calls do
 *   not leak state to each other.
 */
export function detectAnyOccurrences(source: string): AnyOccurrence[] {
  const occurrences: AnyOccurrence[] = [];
  for (const line of collectEligibleLines(source)) {
    for (const hit of matchLine(line.scannable)) {
      occurrences.push({
        line: line.lineNumber,
        context: hit.context,
        snippet: line.snippet,
      });
    }
  }
  return occurrences;
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

type EligibleLine = {
  readonly lineNumber: number; // 1-based
  readonly scannable: string; // text fed into the regex matchers
  readonly snippet: string; // trimmed raw line reported via AnyOccurrence
};

type MatchHit = {
  readonly anyIndex: number;
  readonly context: AnyOccurrenceContext;
};

/**
 * Collect the lines eligible for `any` matching. Mirrors the state machine
 * in `scanner/count-loc.ts` — a line is eligible iff `countLoC` would count
 * it as code.
 */
function collectEligibleLines(source: string): EligibleLine[] {
  if (source === "") return [];

  const lines = source.split("\n");
  let state: "CODE" | "BLOCK_COMMENT" = "CODE";
  const out: EligibleLine[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] ?? "";
    const trimmed = raw.trim();
    const lineNumber = i + 1;

    // 1. blank line
    if (trimmed === "") continue;

    // 2. inside a multi-line block comment
    if (state === "BLOCK_COMMENT") {
      const closeIdx = raw.indexOf("*/");
      if (closeIdx !== -1) {
        state = "CODE";
        const after = raw.slice(closeIdx + 2);
        const afterTrim = after.trim();
        if (afterTrim !== "" && !afterTrim.startsWith("//")) {
          // Only scan the trailing code — the comment body must not leak.
          out.push({ lineNumber, scannable: after, snippet: afterTrim });
        }
      }
      continue;
    }

    // 3. full-line `//` comment
    if (trimmed.startsWith("//")) continue;

    // 4. JSX comment-only line: `{/* ... *\/}`
    if (JSX_COMMENT_ONLY_LINE.test(trimmed)) continue;

    // 5. single-line block comment: `/* ... *\/`
    if (
      trimmed.startsWith("/*") &&
      trimmed.endsWith("*/") &&
      trimmed.length >= 4
    ) {
      continue;
    }

    // 6. block comment opened on this line with no `*\/` on the same line
    if (trimmed.startsWith("/*") && !trimmed.includes("*/")) {
      state = "BLOCK_COMMENT";
      continue;
    }

    // 7. default: real code line
    out.push({ lineNumber, scannable: raw, snippet: trimmed });
  }

  return out;
}

/**
 * Match `any` usages inside a single line in priority order. The `claimed`
 * set guards against double-classifying the same `any` token: once a
 * higher-priority pattern has taken it, lower-priority ones skip it.
 *
 * Note: distinct `any` tokens on the same line remain distinct occurrences —
 * double-counting is prevented only for the _same_ token index, matching
 * the design's "completeness" property for `any` detection.
 */
function matchLine(line: string): MatchHit[] {
  const claimed = new Set<number>();
  const hits: MatchHit[] = [];

  for (const spec of PATTERNS) {
    // Reset `lastIndex` on the shared `/g` regex so state from a previous
    // call does not silently skip the beginning of `line`.
    spec.regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = spec.regex.exec(line)) !== null) {
      const matched = m[0];
      const rel = matched.search(/\bany\b/);
      if (rel === -1) continue; // defensive: every pattern contains `any`
      const anyIndex = m.index + rel;
      if (!claimed.has(anyIndex)) {
        claimed.add(anyIndex);
        const context =
          typeof spec.context === "function"
            ? spec.context(line, anyIndex)
            : spec.context;
        hits.push({ anyIndex, context });
      }

      // Defensive: guarantee forward progress on a zero-length match.
      if (m.index === spec.regex.lastIndex) spec.regex.lastIndex += 1;
    }
  }

  hits.sort((a, b) => a.anyIndex - b.anyIndex);
  return hits;
}

/**
 * Decide between `"variable"` | `"parameter"` | `"return"` for a `: any`
 * hit on a single line.
 *
 * - `:` preceded by `)` (ignoring whitespace) → `"return"`.
 * - `:` sits inside an unclosed `(...)` pair  → `"parameter"`.
 * - otherwise                                  → `"variable"`.
 *
 * The function walks left from the matched `any` token to locate the `:`
 * that fired the regex, then inspects the preceding non-whitespace char.
 * Bracket depth is counted from the line start up to the `any` index so
 * we can tell parameter lists apart from plain variable annotations.
 */
function classifyColonContext(
  line: string,
  anyIndex: number,
): AnyOccurrenceContext {
  // Walk left from the `any` token to find the `:` that fired this match.
  let colonIdx = anyIndex - 1;
  while (colonIdx >= 0 && /\s/.test(line.charAt(colonIdx))) colonIdx--;
  if (colonIdx < 0 || line.charAt(colonIdx) !== ":") return "variable";

  // Is `)` the first non-whitespace char to the left of the `:` ?
  let before = colonIdx - 1;
  while (before >= 0 && /\s/.test(line.charAt(before))) before--;
  if (before >= 0 && line.charAt(before) === ")") return "return";

  // Count unbalanced `(` up to the `any` index. A positive depth means we
  // are inside a parameter list on this line.
  let depth = 0;
  for (let k = 0; k < anyIndex; k++) {
    const ch = line.charAt(k);
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
  }
  return depth > 0 ? "parameter" : "variable";
}

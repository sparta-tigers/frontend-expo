// Feature: fat-file-refactoring
//
// LoC 산출기 — design.md 의 "Fat_File_Scanner → 핵심 알고리즘 — LoC 산출"
// 을 그대로 옮긴 순수 함수. 터미널 실행 없이 문자열만 받아 결정론적으로
// LoC 를 산출한다 (Req 1.4, 1.5).
//
// Zero Magic (Karpathy):
// - Node 표준 문자열 연산과 단일 정규식만 사용한다. AST 파서, TS Compiler
//   API, 토큰 분석은 일체 도입하지 않는다.
// - 문자열 리터럴 내부의 `//` / `/*` 는 원칙적으로 오탐될 수 있으나, LoC
//   는 _라인 시작 기준_ 의 근사치라는 design 명시를 따른다.
//
// 상태 머신:
//   state ∈ { CODE, BLOCK_COMMENT }   초기값: CODE
//
// 라인 처리 우선순위 (상단부터 평가, 첫 매칭에서 `continue`):
//   1. 빈 라인                         → 카운트 제외
//   2. BLOCK_COMMENT 내부
//      - `*/` 를 찾으면 CODE 로 복귀하고, 같은 라인에 `*/` 뒤로 의미 있는
//        (라인 주석 `//` 로 시작하지 않는) 코드가 남아 있으면 +1
//   3. 라인 전체가 `//` 주석           → 카운트 제외
//   4. `{/* ... */}` JSX 주석 단독     → 카운트 제외
//   5. `/* ... */` 블록 주석 단독       → 카운트 제외
//   6. `/*` 로 시작 + 같은 라인 미종료 → BLOCK_COMMENT 진입, 카운트 제외
//   7. 그 외                           → 코드 라인 (+1)

/**
 * Single-line JSX comment such as `{/* TODO *\/}` that occupies the whole
 * line (leading/trailing whitespace tolerated). Matches the design's regex
 * `^\{\/\*.*\*\/\}$` with a `[\s\S]` character class to be robust against
 * stray carriage returns introduced by CRLF line endings after trimming.
 */
const JSX_COMMENT_ONLY_LINE = /^\{\/\*[\s\S]*\*\/\}$/;

type LocState = "CODE" | "BLOCK_COMMENT";

/**
 * Compute the Lines of Code (LoC) for a source string.
 *
 * Excluded from the count:
 * - Empty / whitespace-only lines.
 * - Lines whose trimmed content starts with `//`.
 * - Single-line block comments `/* ... *\/`.
 * - Single-line JSX comments `{/* ... *\/}`.
 * - Lines inside a multi-line block comment, including the opening line.
 *
 * Included in the count:
 * - The closing line of a multi-line block comment iff code follows the `*\/`
 *   on the same line and is not itself a `//` line-comment.
 * - Every other non-empty, non-comment line.
 *
 * Invariants (Property 3):
 * - `countLoC("")` returns `0`.
 * - A source composed solely of blank / comment lines returns `0`.
 * - Depends only on its argument; no I/O, no globals.
 */
export function countLoC(source: string): number {
  if (source === "") return 0;

  const lines = source.split("\n");
  let state: LocState = "CODE";
  let loc = 0;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    // 1. blank line
    if (trimmed === "") continue;

    // 2. currently inside a multi-line block comment
    if (state === "BLOCK_COMMENT") {
      const closeIdx = trimmed.indexOf("*/");
      if (closeIdx !== -1) {
        state = "CODE";
        const after = trimmed.slice(closeIdx + 2).trim();
        if (after !== "" && !after.startsWith("//")) {
          loc += 1;
        }
      }
      continue;
    }

    // 3. full-line `//` comment
    if (trimmed.startsWith("//")) continue;

    // 4. JSX comment-only line: `{/* ... *\/}`
    if (JSX_COMMENT_ONLY_LINE.test(trimmed)) continue;

    // 5. single-line block comment: `/* ... *\/`
    //    length >= 4 guards against malformed 3-char inputs like `/*\/`.
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
    loc += 1;
  }

  return loc;
}

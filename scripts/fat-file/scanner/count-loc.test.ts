// Feature: fat-file-refactoring, Property 3: LoC 산출의 공백·주석 무시
//
// Validates: Requirements 1.4
//
// 전략:
//   countLoC 는 _라인 단위 상태 머신_ 이므로, 각 의미 단위("code line",
//   "blank", "line comment", "single-line block comment", "multi-line
//   block comment", "JSX comment")를 _아이템_ 으로 모델링하고 그 아이템을
//   임의 순서로 섞어 소스를 만든 뒤 `countLoC(source) === |코드 라인|` 을
//   검증한다. 각 아이템은 자신이 소비하는 연속된 라인과 기여 카운트를
//   함께 들고 있으므로, 다중 라인 블록 주석이 셔플 과정에서 쪼개지지
//   않는다(= 상태 머신이 깨지지 않는다).
//
// Zero Magic:
//   - 주석/코드 라인에 `*/`, `/*`, `//` 같은 파서를 오도할 수 있는 바이트
//     시퀀스가 섞여 들어가지 않도록 ASCII-safe 한 토큰 집합만 사용한다.
//   - 테스트가 AST 나 정규식이 아닌, 실제 구현과 동일한 라인 스캔 규칙을
//     검증하도록 입력 공간을 의도적으로 제한한다.

import fc from "fast-check";
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { countLoC } from "./count-loc.ts";

/**
 * One logical chunk contributed to a source file.
 * `lines`  : physical lines this chunk occupies (kept contiguous in output).
 * `count`  : code lines this chunk should contribute to `countLoC`.
 */
type Item = { readonly lines: readonly string[]; readonly count: number };

// Body text that is safe inside any comment or code line: no `*`, `/`, `{`,
// `}` so we never accidentally form `*/`, `/*`, `//`, or `{/*...*/}`.
const SAFE_CHAR = fc.constantFrom("a", "b", "c", "x", "y", "1", "2", "3", " ");
const safeBody = fc
  .array(SAFE_CHAR, { maxLength: 20 })
  .map((chars) => chars.join(""));

// --- Item arbitraries ------------------------------------------------------

// Code line: `const x = N`. Deterministically a real code line — no leading
// `/`, `*`, or `{`, so the state machine falls through to rule 7.
const codeItem: fc.Arbitrary<Item> = fc
  .nat({ max: 9_999 })
  .map((n) => ({ lines: [`const x = ${n}`], count: 1 }));

// Blank line: empty or whitespace-only (both trim to "").
const blankItem: fc.Arbitrary<Item> = fc
  .nat({ max: 4 })
  .map((spaces) => ({ lines: [" ".repeat(spaces)], count: 0 }));

// Line comment occupying the whole line.
const lineCommentItem: fc.Arbitrary<Item> = safeBody.map((body) => ({
  lines: [`// ${body}`],
  count: 0,
}));

// JSX comment-only line: `{/* ... */}`.
const jsxCommentItem: fc.Arbitrary<Item> = safeBody.map((body) => ({
  lines: [`{/* ${body} */}`],
  count: 0,
}));

// Single-line block comment: `/* ... */`.
const singleBlockItem: fc.Arbitrary<Item> = safeBody.map((body) => ({
  lines: [`/* ${body} */`],
  count: 0,
}));

// Multi-line block comment: opening `/*`, 0..N interior lines that never
// contain `*/`, closing ` */`.
const multiBlockItem: fc.Arbitrary<Item> = fc
  .array(safeBody, { maxLength: 4 })
  .map((interiors) => ({
    lines: ["/*", ...interiors.map((b) => ` * ${b}`), " */"],
    count: 0,
  }));

const anyItem: fc.Arbitrary<Item> = fc.oneof(
  codeItem,
  blankItem,
  lineCommentItem,
  jsxCommentItem,
  singleBlockItem,
  multiBlockItem,
);

// --- Property 3 ------------------------------------------------------------

test("Property 3: countLoC ignores blanks and all comment shapes under arbitrary shuffling", () => {
  fc.assert(
    fc.property(fc.array(anyItem, { maxLength: 40 }), (items) => {
      const expected = items.reduce((sum, item) => sum + item.count, 0);
      const source = items.flatMap((item) => item.lines).join("\n");
      assert.equal(countLoC(source), expected);
    }),
  );
});

// --- Edge-case examples called out by the task ----------------------------

test("countLoC('') === 0", () => {
  assert.equal(countLoC(""), 0);
});

test("source composed solely of blank/comment lines has LoC 0", () => {
  const source = [
    "",
    "   ",
    "// line comment",
    "/* single-line block */",
    "{/* jsx comment */}",
    "/*",
    " * multi-line",
    " * block comment",
    " */",
  ].join("\n");
  assert.equal(countLoC(source), 0);
});

test("code line followed by /* ... */ on the same line counts as 1", () => {
  assert.equal(countLoC("const x = 1; /* trailing */"), 1);
});

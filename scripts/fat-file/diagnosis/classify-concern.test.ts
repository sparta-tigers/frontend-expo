// Feature: fat-file-refactoring, Property 4: Concern 분류와 Mixed 정의 일관성
//
// Validates: Requirements 2.1, 2.2, 2.4
//
// 전략:
//   각 Concern_Category 에 대해 _자기 카테고리로만 분류되는_ 고정 템플릿
//   블록을 준비하고 (UI / Logic / Type / Style / Constant, Logic 은 함수
//   선언 / 화살표 두 변형), 임의 순서로 1..6 개를 이어 붙여 소스를 만든다.
//   각 템플릿은 `export ...\n` 형태이므로 `splitTopLevelBlocks` 가 라인
//   단위로 블록을 분리한다. 기대 `concerns` 는 선택된 카테고리 집합을
//   canonical 순서 (UI → Logic → Type → Style → Constant) 로 필터한 것이고,
//   `mixed === (concerns.length >= 2)` 가 성립해야 한다.
//
// Zero Magic:
//   - PascalCase 이름은 `fc.stringMatching(/^[A-Z][a-zA-Z0-9]{0,5}$/)`,
//     SCREAMING_SNAKE 이름은 `fc.stringMatching(/^[A-Z][A-Z0-9_]{0,5}$/)`
//     로 생성해 고정 식별자 형태 공간만 탐색한다. 템플릿 자체는 중괄호가
//     한 라인 안에서 균형잡혀 있어 상위 분리기가 라인 = 블록 대응을 지킨다.
//   - Logic 변형의 이름은 `use${PascalName}` 로 재포장되므로 UI 분류의
//     PascalCase 함수/화살표 패턴 (`[A-Z]\w*` 앵커) 에 걸리지 않는다.
//   - Style 템플릿은 `StyleSheet.create(` 를 포함해 UI 의 `return (` + JSX
//     조건을 만족시키지 않으면서 Style 규칙에 단독 매칭된다.
//
// Naming note:
//   `classify-concern.ts` 의 파일 단위 퍼사드 함수명은 구현에서
//   `classifyConcerns` 이다 (design.md 의 `classifyFile` 와 동의어).
//   본 테스트는 구현이 실제로 export 하는 심볼을 그대로 호출한다.

import fc from "fast-check";
import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { Concern_Category } from "../types.ts";
import {
    classifyBlock,
    classifyConcerns,
    splitTopLevelBlocks,
} from "./classify-concern.ts";

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

type CategorizedBlock = {
  readonly cat: Concern_Category;
  readonly text: string;
};

const pascalName = fc.stringMatching(/^[A-Z][a-zA-Z0-9]{0,5}$/);
const screamingName = fc.stringMatching(/^[A-Z][A-Z0-9_]{0,5}$/);

const uiBlock: fc.Arbitrary<CategorizedBlock> = pascalName.map((n) => ({
  cat: "UI",
  text: `export function ${n}() { return ( <View><Text>hi</Text></View> ); }\n`,
}));

const logicFnBlock: fc.Arbitrary<CategorizedBlock> = pascalName.map((n) => ({
  cat: "Logic",
  text: `export function use${n}() { return 1; }\n`,
}));

const logicArrowBlock: fc.Arbitrary<CategorizedBlock> = pascalName.map((n) => ({
  cat: "Logic",
  text: `export const use${n} = () => { return 1; };\n`,
}));

const logicBlock: fc.Arbitrary<CategorizedBlock> = fc.oneof(
  logicFnBlock,
  logicArrowBlock,
);

const typeBlock: fc.Arbitrary<CategorizedBlock> = pascalName.map((n) => ({
  cat: "Type",
  text: `export type ${n} = { a: number };\n`,
}));

const styleBlock: fc.Arbitrary<CategorizedBlock> = pascalName.map((n) => ({
  cat: "Style",
  text: `export const ${n}Styles = StyleSheet.create({ wrap: { flex: 1 } });\n`,
}));

const constantBlock: fc.Arbitrary<CategorizedBlock> = screamingName.map(
  (n) => ({
    cat: "Constant",
    text: `export const ${n} = 42;\n`,
  }),
);

const categoryBlock: fc.Arbitrary<CategorizedBlock> = fc.oneof(
  uiBlock,
  logicBlock,
  typeBlock,
  styleBlock,
  constantBlock,
);

const CANONICAL_ORDER: readonly Concern_Category[] = [
  "UI",
  "Logic",
  "Type",
  "Style",
  "Constant",
];

function expectedConcerns(
  blocks: readonly CategorizedBlock[],
): Concern_Category[] {
  const seen = new Set<Concern_Category>();
  for (const b of blocks) seen.add(b.cat);
  return CANONICAL_ORDER.filter((c) => seen.has(c));
}

// ---------------------------------------------------------------------------
// Property 4
// ---------------------------------------------------------------------------

test("Property 4: classifyConcerns returns distinct canonical-ordered set, mixed = (concerns.length >= 2)", () => {
  fc.assert(
    fc.property(
      fc.array(categoryBlock, { minLength: 1, maxLength: 6 }),
      (blocks) => {
        const source = blocks.map((b) => b.text).join("");
        const result = classifyConcerns(source);
        const expected = expectedConcerns(blocks);

        assert.deepEqual(result.concerns, expected);
        assert.equal(result.mixed, expected.length >= 2);

        // Guard: every emitted concern is one of the 5 allowed categories.
        for (const c of result.concerns) {
          assert.ok(CANONICAL_ORDER.includes(c));
        }

        // Guard: per-block classification matches the block we generated.
        // splitTopLevelBlocks pairs one line-template with one block, so
        // `classifyBlock(blockText)` must equal the generator's `cat`.
        const topLevel = splitTopLevelBlocks(source);
        assert.equal(topLevel.length, blocks.length);
        for (let i = 0; i < blocks.length; i++) {
          const tl = topLevel[i];
          assert.ok(tl !== undefined);
          assert.equal(classifyBlock(tl.text), blocks[i]?.cat);
        }
      },
    ),
  );
});

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

test("single-category input has mixed === false", () => {
  const src = `export function Foo() { return ( <View><Text>hi</Text></View> ); }\n`;
  const r = classifyConcerns(src);
  assert.deepEqual(r.concerns, ["UI"]);
  assert.equal(r.mixed, false);
});

test("mixed two-category input (UI + Logic) → mixed === true, canonical order", () => {
  const src =
    `export function Foo() { return ( <View><Text>hi</Text></View> ); }\n` +
    `export function useBar() { return 1; }\n`;
  const r = classifyConcerns(src);
  assert.deepEqual(r.concerns, ["UI", "Logic"]);
  assert.equal(r.mixed, true);
});

test("each generated block is classified into exactly one of the 5 categories", () => {
  const cases: ReadonlyArray<readonly [string, Concern_Category]> = [
    [
      `export function Foo() { return ( <View><Text>hi</Text></View> ); }`,
      "UI",
    ],
    [`export function useFoo() { return 1; }`, "Logic"],
    [`export const useBar = () => { return 1; };`, "Logic"],
    [`export type Foo = { a: number };`, "Type"],
    [
      `export const FooStyles = StyleSheet.create({ wrap: { flex: 1 } });`,
      "Style",
    ],
    [`export const MY_CONST = 42;`, "Constant"],
  ];

  for (const [block, expected] of cases) {
    assert.equal(classifyBlock(block), expected);
  }
});

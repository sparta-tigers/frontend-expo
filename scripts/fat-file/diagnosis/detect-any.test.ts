// Feature: fat-file-refactoring, Property 5: any 탐지 완전성
//
// Validates: Requirements 2.3
//
// 전략:
//   `detectAnyOccurrences` 의 5 개 컨텍스트 (variable / assertion / array /
//   generic / record) 각각에 대해 "한 라인에 정확히 하나의 `any` 토큰" 을
//   심는 injection 라인 템플릿을 준비하고, `any` 가 절대 등장하지 않는
//   안전한 base 라인과 임의 순서로 섞어 소스를 만든다. 각 injection 은
//   (kind, line) 를 기억하므로 셔플 이후에도 자신의 기대 라인 번호와
//   컨텍스트를 알고 있다.
//
//   소스 조립 후:
//     1) 결과 길이 === 주입 개수
//     2) (line, context) 다중집합 일치
//   두 조건을 검증한다.
//
// Zero Magic:
//   - base 라인은 `const b<N> = <N>` 형태로만 생성해 `any` 토큰 부재와
//     "실제 코드 라인" 판정을 동시에 만족시킨다.
//   - injection 라인은 단일 컨텍스트로만 분류되도록 의도적으로 단순화
//     한다. 예를 들어 array 는 `const arr<N>: any[] = []` 처럼 `: any` 가
//     같은 `any` 토큰을 재분류하지 않는 형태를 고른다 — detector 는
//     더 구체적인 `any[]` 패턴이 먼저 청구하기 때문에 "array" 단일 hit 만
//     남는다.
//   - `: any` 분류기는 `variable` / `parameter` / `return` 세 경로를
//     가지지만 본 테스트는 `variable` 경로만 사용한다(현재 구현 계약을
//     그대로 반영).

import fc from "fast-check";
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { detectAnyOccurrences } from "./detect-any.ts";

type Kind = "variable" | "assertion" | "array" | "generic" | "record";
type Injection = { readonly kind: Kind; readonly line: string };

// --- generators ------------------------------------------------------------

// Each injection arbitrary yields exactly one `any` token in a shape that
// the detector classifies into a single context (see "Zero Magic" note).
const variableInjection: fc.Arbitrary<Injection> = fc
  .nat({ max: 999 })
  .map((n) => ({ kind: "variable", line: `let v${n}: any = 1` }));

const assertionInjection: fc.Arbitrary<Injection> = fc
  .nat({ max: 999 })
  .map((n) => ({ kind: "assertion", line: `const a${n} = x as any` }));

const arrayInjection: fc.Arbitrary<Injection> = fc
  .nat({ max: 999 })
  .map((n) => ({ kind: "array", line: `const arr${n}: any[] = []` }));

const genericInjection: fc.Arbitrary<Injection> = fc
  .nat({ max: 999 })
  .map((n) => ({ kind: "generic", line: `const g${n} = foo<any>()` }));

const recordInjection: fc.Arbitrary<Injection> = fc
  .nat({ max: 999 })
  .map((n) => ({
    kind: "record",
    line: `const r${n}: Record<string, any> = {}`,
  }));

const injectionArb: fc.Arbitrary<Injection> = fc.oneof(
  variableInjection,
  assertionInjection,
  arrayInjection,
  genericInjection,
  recordInjection,
);

// Safe base line: ASCII only, never contains `any`, always evaluated as a
// real code line by the detector's comment state machine.
const baseLineArb: fc.Arbitrary<string> = fc
  .nat({ max: 9_999 })
  .map((n) => `const b${n} = ${n}`);

type Chunk =
  | { readonly kind: "base"; readonly line: string }
  | { readonly kind: "injection"; readonly injection: Injection };

const chunkArb: fc.Arbitrary<Chunk> = fc.oneof(
  baseLineArb.map((line): Chunk => ({ kind: "base", line })),
  injectionArb.map((injection): Chunk => ({ kind: "injection", injection })),
);

// --- Property 5 ------------------------------------------------------------

test("Property 5: detectAnyOccurrences recovers every injected any with correct line and context", () => {
  fc.assert(
    fc.property(fc.array(chunkArb, { maxLength: 40 }), (chunks) => {
      const lines: string[] = [];
      const expected: { line: number; context: Kind }[] = [];

      for (const chunk of chunks) {
        if (chunk.kind === "base") {
          lines.push(chunk.line);
        } else {
          lines.push(chunk.injection.line);
          // After push, `lines.length` is the 1-based index of the line we
          // just appended — which is exactly what the detector reports.
          expected.push({
            line: lines.length,
            context: chunk.injection.kind,
          });
        }
      }

      const source = lines.join("\n");
      const got = detectAnyOccurrences(source);

      // 1) cardinality
      assert.equal(got.length, expected.length);

      // 2) (line, context) multiset equality. Sort by `line` for a stable
      //    comparison — each injected line carries at most one `any`, so
      //    the line number alone keys the pair unambiguously.
      const norm = (rows: ReadonlyArray<{ line: number; context: string }>) =>
        [...rows].sort((a, b) => a.line - b.line);

      assert.deepEqual(
        norm(got.map((o) => ({ line: o.line, context: o.context }))),
        norm(expected),
      );
    }),
  );
});

// --- Unit tests: comment-line exclusion -----------------------------------

test("line comments and block comments never produce any occurrences", () => {
  const source = [
    "// let x: any = 1",
    "/* single-line any block */",
    "/*",
    " * let y: any = 2",
    " */",
    "{/* jsx any stuff */}",
  ].join("\n");

  assert.deepEqual(detectAnyOccurrences(source), []);
});

// --- Unit tests: contract edges ------------------------------------------

test("empty source yields no occurrences", () => {
  assert.deepEqual(detectAnyOccurrences(""), []);
});

test("multiple `any` tokens on one line are each reported with the right context", () => {
  // `(x: any, y: any) => any`:
  //   - two `: any` inside the parameter list → "parameter"
  //   - one `: any` preceded by `)`           → "return"
  const source = "const f = (x: any, y: any): any => x";
  const got = detectAnyOccurrences(source);

  assert.equal(got.length, 3);
  assert.ok(got.every((o) => o.line === 1));

  const contexts = got.map((o) => o.context).sort();
  assert.deepEqual(contexts, ["parameter", "parameter", "return"]);
});

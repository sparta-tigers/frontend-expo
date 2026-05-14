// Feature: fat-file-refactoring, Property 10: any 치환 완전성 및 잔존 0
import {
  array,
  constantFrom,
  assert as fcAssert,
  nat,
  property,
  record,
  string,
} from "fast-check";
import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { AnyOccurrence } from "../types.ts";
import { planTypeReplacement } from "./plan-type-replacement.ts";

test("Property 10: any 치환 완전성 및 잔존 0", () => {
  const occArb = record({
    line: nat(),
    context: constantFrom(
      "variable",
      "parameter",
      "return",
      "generic",
      "assertion",
      "array",
      "record",
    ),
    snippet: string(),
  }).map((occ: any): AnyOccurrence => {
    // Generate valid snippets based on context
    let snippet = "";
    if (occ.context === "assertion") snippet = "const a = x as any;";
    else if (occ.context === "array") snippet = "const a: any[] = [];";
    else if (occ.context === "generic") snippet = "const a = f<any>();";
    else if (occ.context === "record")
      snippet = "const a: Record<string, any> = {};";
    else snippet = "let a: any = 1;";
    return { ...occ, snippet };
  });

  fcAssert(
    property(array(occArb), (occurrences) => {
      const replacements = planTypeReplacement(occurrences);

      // 1. R과 A는 라인 번호 기준 1:1 대응
      assert.equal(replacements.length, occurrences.length);
      assert.deepEqual(
        replacements.map((r) => r.originalLine).sort(),
        occurrences.map((o) => o.line).sort(),
      );

      // 2. r.to 문자열에 단어 경계 \bany\b 가 부재하다.
      for (const r of replacements) {
        assert.ok(!/\bany\b/.test(r.to), `any found in r.to: ${r.to}`);

        // 3. unknown-with-guard 일 경우 guardFunction이 존재하며 any가 없음
        if (r.strategy === "unknown-with-guard") {
          assert.ok(r.guardFunction && r.guardFunction.length > 0);
          assert.ok(!/\bany\b/.test(r.guardFunction!));
        }
      }
    }),
  );
});

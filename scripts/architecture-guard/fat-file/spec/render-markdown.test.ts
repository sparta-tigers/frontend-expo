// Feature: fat-file-refactoring, Property 7: Refactoring Spec 마크다운 렌더링 무결성
import {
  Arbitrary,
  array,
  boolean,
  constant,
  constantFrom,
  assert as fcAssert,
  nat,
  option,
  property,
  record,
  string,
} from "fast-check";
import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { RefactoringSpecEntry } from "../types.ts";
import { renderMarkdown } from "./render-markdown.ts";

test("Property 7: Refactoring Spec 마크다운 렌더링 무결성", () => {
  const specArb = record({
    source: record({
      absolutePath: constant("/path.ts"),
      relativePath: constant("path.ts"),
      extension: constant(".ts"),
      content: constant(""),
      loc: nat(),
      priorityTier: constantFrom("TOP", "REVIEW"),
      concerns: array(constantFrom("Logic", "UI")),
      mixed: boolean(),
      anyOccurrences: constant([]),
    }),
    decomposition: array(
      record({
        path: constant("mod.ts"),
        concern: constantFrom("Logic", "UI"),
        expectedLoc: nat(),
        publicApi: array(string()),
      }),
    ),
    typeReplacements: array(
      record({
        originalLine: nat(),
        from: constant("any"),
        to: constant("string"),
        strategy: constantFrom(
          "named-interface",
          "named-type",
          "unknown-with-guard",
        ),
        guardFunction: constant("isString"),
      }),
    ),
    barrelFile: record({
      path: constant("index.ts"),
      reExports: array(string()),
    }),
    exception: option(
      record({
        reason: constant("Too big"),
        userConfirmationRequired: constant(true as const),
      }),
    ),
  }) as Arbitrary<RefactoringSpecEntry>;

  fcAssert(
    property(array(specArb), (specs) => {
      const md = renderMarkdown(specs);

      // 1. Title exists
      assert.ok(md.includes("# Fat File Refactoring Specification"));

      // 2. Each file is rendered
      for (const spec of specs) {
        assert.ok(md.includes(`## 📄 ${spec.source.relativePath}`));
        assert.ok(md.includes(spec.source.priorityTier));
      }
    }),
  );
});

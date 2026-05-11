// Feature: fat-file-refactoring, Property 7: Refactoring Spec 마크다운 렌더링 무결성
import fc from "fast-check";
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { renderMarkdown } from "./render-markdown.ts";
import type { RefactoringSpecEntry } from "../types.ts";

test("Property 7: Refactoring Spec 마크다운 렌더링 무결성", () => {
  const specArb = fc.record({
    source: fc.record({
      absolutePath: fc.constant("/path.ts"),
      relativePath: fc.constant("path.ts"),
      extension: fc.constant(".ts"),
      content: fc.constant(""),
      loc: fc.nat(),
      priorityTier: fc.constantFrom("TOP", "REVIEW"),
      concerns: fc.array(fc.constantFrom("Logic", "UI")),
      mixed: fc.boolean(),
      anyOccurrences: fc.constant([])
    }),
    decomposition: fc.array(fc.record({
      path: fc.constant("mod.ts"),
      concern: fc.constantFrom("Logic", "UI"),
      expectedLoc: fc.nat(),
      publicApi: fc.array(fc.string())
    })),
    typeReplacements: fc.array(fc.record({
      originalLine: fc.nat(),
      from: fc.constant("any"),
      to: fc.constant("string"),
      strategy: fc.constantFrom("named-interface", "named-type", "unknown-with-guard"),
      guardFunction: fc.constant("isString")
    })),
    barrelFile: fc.record({
      path: fc.constant("index.ts"),
      reExports: fc.array(fc.string())
    }),
    exception: fc.option(fc.record({
      reason: fc.constant("Too big"),
      userConfirmationRequired: fc.constant(true as const)
    }))
  }) as fc.Arbitrary<RefactoringSpecEntry>;

  fc.assert(
    fc.property(fc.array(specArb), (specs) => {
      const md = renderMarkdown(specs);

      // 1. Title exists
      assert.ok(md.includes("# Fat File Refactoring Specification"));

      // 2. Each file is rendered
      for (const spec of specs) {
        assert.ok(md.includes(`## 📄 ${spec.source.relativePath}`));
        assert.ok(md.includes(spec.source.priorityTier));
      }
    })
  );
});

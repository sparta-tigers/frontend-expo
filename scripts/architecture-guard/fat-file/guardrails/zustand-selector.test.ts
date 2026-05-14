// Feature: fat-file-refactoring, Property 13: Zustand selector arity 보존 검사
import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { SourceFile } from "../types.ts";
import { checkZustandSelectors } from "./zustand-selector.ts";

test("Property 13: Zustand selector arity 보존 검사", () => {
  const file1: SourceFile = {
    absolutePath: "/p1.ts",
    relativePath: "p1.ts",
    extension: ".ts",
    content: `const a = useMyStore();`, // Violation: no selector
  };

  const file2: SourceFile = {
    absolutePath: "/p2.ts",
    relativePath: "p2.ts",
    extension: ".ts",
    content: `const [a, b] = useMyStore(state => [state.a, state.b]);`, // Violation: no shallow
  };

  const file3: SourceFile = {
    absolutePath: "/p3.ts",
    relativePath: "p3.ts",
    extension: ".ts",
    content: `const [a, b] = useMyStore(state => [state.a, state.b], shallow);`, // Pass
  };

  const file4: SourceFile = {
    absolutePath: "/p4.ts",
    relativePath: "p4.ts",
    extension: ".ts",
    content: `const a = useMyStore(state => state.a);`, // Pass
  };

  const result1 = checkZustandSelectors([file1]);
  assert.equal(result1.passed, false);
  assert.equal(result1.violations.length, 1);

  const result2 = checkZustandSelectors([file2]);
  assert.equal(result2.passed, false);
  assert.equal(result2.violations.length, 1);

  const result3 = checkZustandSelectors([file3, file4]);
  assert.equal(result3.passed, true);
  assert.equal(result3.violations.length, 0);
});

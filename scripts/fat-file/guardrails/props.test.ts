// Feature: fat-file-refactoring, Property 14: Sub-component props 최소성/참조 안정성 검사
import fc from "fast-check";
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { checkPropsStability } from "./props.ts";
import type { SourceFile } from "../types.ts";

test("Property 14: Sub-component props 최소성/참조 안정성 검사", () => {
  const file1: SourceFile = {
    absolutePath: "/p1.tsx", relativePath: "p1.tsx", extension: ".tsx",
    content: `<View style={{ margin: 10 }} />` // Violation: inline object
  };

  const file2: SourceFile = {
    absolutePath: "/p2.tsx", relativePath: "p2.tsx", extension: ".tsx",
    content: `<List data={[1, 2, 3]} />` // Violation: inline array
  };

  const file3: SourceFile = {
    absolutePath: "/p3.tsx", relativePath: "p3.tsx", extension: ".tsx",
    content: `<Button onPress={() => doSomething()} />` // Violation: inline function
  };

  const file4: SourceFile = {
    absolutePath: "/p4.tsx", relativePath: "p4.tsx", extension: ".tsx",
    content: `<View style={styles.container} /><Button onPress={handlePress} />` // Pass
  };

  const result1 = checkPropsStability([file1, file2, file3]);
  assert.equal(result1.passed, false);
  assert.equal(result1.violations.length, 3);

  const result2 = checkPropsStability([file4]);
  assert.equal(result2.passed, true);
  assert.equal(result2.violations.length, 0);
});

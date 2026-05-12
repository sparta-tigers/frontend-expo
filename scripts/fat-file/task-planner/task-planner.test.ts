// Feature: fat-file-refactoring, Property 15: Task_Planner의 결정론적 생성
import { Arbitrary, array, assert as fcAssert, boolean, constant, constantFrom, nat, option, property, record, string } from "fast-check";
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { planTask } from "./index.ts";
import type { RefactoringSpecEntry } from "../types.ts";

test("Property 15: Task_Planner의 결정론적 생성", () => {
  const specArb = record({
    source: record({
      absolutePath: constant("/path.ts"),
      relativePath: constant("path.ts"),
      extension: constant(".ts"),
      content: constant(""),
      loc: nat(),
      priorityTier: constant("TOP"),
      concerns: array(constantFrom("Logic", "UI")),
      mixed: boolean(),
      anyOccurrences: constant([])
    }),
    decomposition: array(record({
      path: constant("mod.ts"),
      concern: constantFrom("Logic", "UI"),
      expectedLoc: nat(),
      publicApi: array(string())
    })),
    typeReplacements: constant([]),
    barrelFile: record({
      path: constant("index.ts"),
      reExports: array(string())
    }),
    exception: option(record({
      reason: constant("Exception"),
      userConfirmationRequired: constant(true as const)
    }))
  }) as Arbitrary<RefactoringSpecEntry>;

  fcAssert(
    property(specArb, (spec) => {
      const task = planTask(spec);

      assert.equal(task.targetFile, spec.source.relativePath);
      assert.equal(task.generatedModules.length, spec.decomposition.length);
      assert.equal(task.expectedLocs.length, spec.decomposition.length);

      for (let i = 0; i < spec.decomposition.length; i++) {
        assert.equal(task.generatedModules[i], spec.decomposition[i].path);
        assert.equal(task.expectedLocs[i], spec.decomposition[i].expectedLoc);
      }

      // 1~8 references
      assert.deepEqual(task.requirementsRefs.slice().sort(), [1, 2, 3, 4, 5, 6, 7, 8]);

      // State check
      if (spec.exception) {
        assert.equal(task.state, "Halted");
      } else {
        assert.equal(task.state, "Pending");
      }
    })
  );
});

// Feature: fat-file-refactoring, Property 15: Task_Planner의 결정론적 생성
import fc from "fast-check";
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { planTask } from "./index.ts";
import type { RefactoringSpecEntry } from "../types.ts";

test("Property 15: Task_Planner의 결정론적 생성", () => {
  const specArb = fc.record({
    source: fc.record({
      absolutePath: fc.constant("/path.ts"),
      relativePath: fc.constant("path.ts"),
      extension: fc.constant(".ts"),
      content: fc.constant(""),
      loc: fc.nat(),
      priorityTier: fc.constant("TOP"),
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
    typeReplacements: fc.constant([]),
    barrelFile: fc.record({
      path: fc.constant("index.ts"),
      reExports: fc.array(fc.string())
    }),
    exception: fc.option(fc.record({
      reason: fc.constant("Exception"),
      userConfirmationRequired: fc.constant(true as const)
    }))
  }) as fc.Arbitrary<RefactoringSpecEntry>;

  fc.assert(
    fc.property(specArb, (spec) => {
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

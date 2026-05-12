// Feature: fat-file-refactoring, Property 8: 모듈 레이아웃과 예외 발생
import { array, assert as fcAssert, boolean, constant, constantFrom, integer, property, record } from "fast-check";
import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { Diagnosis } from "../types.ts";
import { planModules } from "./plan-modules.ts";

test("Property 8: 모듈 레이아웃과 예외 발생", () => {
  const diagnosisArb = record({
    absolutePath: constant("/dummy/path.tsx"),
    relativePath: constant("components/WeatherIcon.tsx"),
    extension: constant(".tsx"),
    content: constant(""),
    priorityTier: constant("REVIEW"),
    loc: integer({ min: 500, max: 2000 }),
    concerns: array(constantFrom("UI", "Logic", "Type", "Style", "Constant"), { minLength: 1, maxLength: 5 }),
    mixed: boolean(),
    anyOccurrences: constant([])
  }).map(d => d as Diagnosis);

  fcAssert(
    property(diagnosisArb, (diagnosis) => {
      const plan = planModules(diagnosis);

      // 1. ModulePlan 은 입력 Diagnosis.concerns 와 1:1 매핑됨 (길이 및 concern 종류)
      assert.equal(plan.decomposition.length, diagnosis.concerns.length);
      assert.deepEqual(
        plan.decomposition.map(m => m.concern).sort(),
        diagnosis.concerns.slice().sort()
      );

      // 2. Exception 발생 시점
      const expectedLocPerConcern = Math.ceil(diagnosis.loc / diagnosis.concerns.length);
      if (expectedLocPerConcern > 300) {
        assert.ok(plan.exception);
        assert.equal(plan.exception.userConfirmationRequired, true);
      } else {
        assert.ok(!plan.exception);
        for (const m of plan.decomposition) {
          assert.ok(m.expectedLoc <= 300);
        }
      }

      // 3. Barrel file
      assert.ok(plan.barrelFile.path.endsWith("index.ts"));
    })
  );
});

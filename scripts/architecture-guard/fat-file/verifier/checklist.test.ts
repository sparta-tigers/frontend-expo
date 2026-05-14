// Feature: fat-file-refactoring, Property 16: Checklist Evaluation

import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { SourceFile } from "../types.ts";
import type { VerificationInput } from "./checklist.ts";
import { evaluateChecklist } from "./checklist.ts";

test("Property 16: Checklist Evaluation", () => {
  const file: SourceFile = {
    absolutePath: "/p.ts",
    relativePath: "p.ts",
    extension: ".ts",
    content: "export const A = 1;\n".repeat(10),
  };

  const genFile: SourceFile = {
    absolutePath: "/p/index.ts",
    relativePath: "p/index.ts",
    extension: ".ts",
    content: "export const A = 1;",
  };

  const input: VerificationInput = {
    originalFile: file,
    generatedModules: [
      {
        plan: {
          path: "p/index.ts",
          concern: "Logic",
          expectedLoc: 1,
          publicApi: ["A"],
        },
        file: genFile,
      },
    ],
    barrelFile: {
      plan: { path: "p/barrel.ts", reExports: ["A"] },
      file: {
        absolutePath: "/p/barrel.ts",
        relativePath: "p/barrel.ts",
        extension: ".ts",
        content: "export { A } from './index';",
      },
    },
    tscBaselineErrors: ["error 1"],
    tscCurrentErrors: ["error 1"],
  };

  const result = evaluateChecklist(input);
  assert.equal(result.passed, true);
  assert.equal(result.checklist.locBound, true);
  assert.equal(result.checklist.singleConcern, true);
  assert.equal(result.checklist.tscBaselineClean, true);
  assert.equal(result.checklist.publicApiPreserved, true);
  assert.equal(result.checklist.anyResidualCount, 0);

  // Test failure
  const inputFail: VerificationInput = {
    ...input,
    tscCurrentErrors: ["error 1", "error 2"],
    generatedModules: [
      {
        plan: input.generatedModules[0].plan,
        file: { ...genFile, content: "export const A = 1; let x: any;" },
      },
    ],
  };

  const resultFail = evaluateChecklist(inputFail);
  assert.equal(resultFail.passed, false);
  assert.equal(resultFail.checklist.tscBaselineClean, false);
  assert.equal(resultFail.checklist.anyResidualCount, 1);
});

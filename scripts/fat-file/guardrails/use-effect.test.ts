// Feature: fat-file-refactoring, Property 12: useEffect 순증가 없음 및 동기화 이펙트 판별
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { checkUseEffect } from "./use-effect.ts";
import type { SourceFile } from "../types.ts";

test("Property 12: useEffect 순증가 없음 및 동기화 이펙트 판별", () => {
  const originalFile: SourceFile = {
    absolutePath: "/path.tsx",
    relativePath: "path.tsx",
    extension: ".tsx",
    content: `
      useEffect(() => {
        // ...
      }, [deps]);
    `
  };

  const newFile1: SourceFile = {
    absolutePath: "/path1.tsx",
    relativePath: "path1.tsx",
    extension: ".tsx",
    content: `
      useEffect(() => {
        // ...
      });
    `
  };

  const newFile2: SourceFile = {
    absolutePath: "/path2.tsx",
    relativePath: "path2.tsx",
    extension: ".tsx",
    content: `
      useEffect(() => {
        // ...
      }, []);
    `
  };

  const result = checkUseEffect(originalFile, [newFile1, newFile2]);
  
  assert.equal(result.originalCount, 1);
  assert.equal(result.newCount, 2);
  assert.equal(result.passed, false); // 2 > 1
  assert.ok(result.syncEffects > 0);
});

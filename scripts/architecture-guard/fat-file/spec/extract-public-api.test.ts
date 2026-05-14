// Feature: fat-file-refactoring, Property 11: Public_API 3축 무손실 추출
import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { SourceFile } from "../types.ts";
import { extractPublicApi } from "./extract-public-api.ts";

test("Property 11: Public_API 3축 무손실 추출", () => {
  const content = `
    export const A = 1;
    export function B() {}
    export class C {}
    export type D = string;
    export interface E {}
    export default function F() {}
    export { G, H as I };
  `;

  const file: SourceFile = {
    absolutePath: "/dummy.ts",
    relativePath: "dummy.ts",
    extension: ".ts",
    content,
  };

  const exports = extractPublicApi(file);

  assert.equal(exports.length, 8);
  assert.ok(exports.find((e) => e.name === "A" && e.kind === "value"));
  assert.ok(exports.find((e) => e.name === "B" && e.kind === "value"));
  assert.ok(exports.find((e) => e.name === "C" && e.kind === "value"));
  assert.ok(exports.find((e) => e.name === "D" && e.kind === "type"));
  assert.ok(exports.find((e) => e.name === "E" && e.kind === "type"));
  assert.ok(exports.find((e) => e.name === "default" && e.kind === "default"));
  assert.ok(exports.find((e) => e.name === "G" && e.kind === "value"));
  assert.ok(exports.find((e) => e.name === "I" && e.kind === "value"));
});

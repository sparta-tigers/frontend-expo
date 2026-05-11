// Feature: fat-file-refactoring, Property 9: 네이밍 규칙 매핑의 건전성
import fc from "fast-check";
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { namingMap } from "./naming-map.ts";

const letterChars = Array.from("abcdefghijklmnopqrstuvwxyz");
const idChars = Array.from("abcdefghijklmnopqrstuvwxyz0123456789");
const idSegmentArb = fc.tuple(
  fc.constantFrom(...letterChars),
  fc.array(fc.constantFrom(...idChars), { minLength: 0, maxLength: 9 })
).map(([first, rest]) => first + rest.join(""));
const kebabArb = fc.array(idSegmentArb, { minLength: 1, maxLength: 5 }).map(parts => parts.join("-"));

test("Property 9: 네이밍 규칙 매핑의 건전성", () => {
  fc.assert(
    fc.property(kebabArb, (featureId) => {
      // Logic
      const logic = namingMap("Logic", featureId);
      assert.match(logic.filename, /^use-[a-z0-9-]+\.ts$/);
      assert.match(logic.symbol, /^use[A-Z][A-Za-z0-9]*$/);

      // UI
      const ui = namingMap("UI", featureId);
      assert.match(ui.filename, /^[A-Z][A-Za-z0-9]*\.tsx$/);
      assert.match(ui.symbol, /^[A-Z][A-Za-z0-9]*$/);

      // Constant
      const constant = namingMap("Constant", featureId);
      assert.match(constant.filename, /^constants\/[a-z0-9-]+\.ts$/);
      assert.match(constant.symbol, /^[A-Z0-9_]+$/);

      // Type
      const typeRule = namingMap("Type", featureId);
      assert.match(typeRule.filename, /^[a-z0-9-]+\.types\.ts$/);
      assert.match(typeRule.symbol, /^[A-Z][A-Za-z0-9]*$/);

      // Style
      const style = namingMap("Style", featureId);
      assert.match(style.filename, /^[a-z0-9-]+\.styles\.ts$/);
      assert.equal(style.symbol, "styles");
    })
  );
});

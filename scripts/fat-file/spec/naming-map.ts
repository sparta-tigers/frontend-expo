// Feature: fat-file-refactoring
import type { Concern_Category } from "../types.ts";

/**
 * Convert PascalCase to kebab-case.
 */
export function pascalToKebab(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

/**
 * Convert kebab-case to PascalCase.
 */
export function kebabToPascal(str: string): string {
  return str
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

/**
 * Convert kebab-case to camelCase.
 */
export function kebabToCamel(str: string): string {
  const pascal = kebabToPascal(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Convert kebab-case to SCREAMING_SNAKE_CASE.
 */
export function kebabToScreamingSnake(str: string): string {
  return str.replace(/-/g, "_").toUpperCase();
}

export interface NamingMapResult {
  filename: string;
  symbol: string;
}

/**
 * Deterministic mapping of (Concern, featureId) to (filename, symbol).
 * Note: featureId can be given in PascalCase or kebab-case, so we first normalize it to kebab-case.
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */
export function namingMap(concern: Concern_Category, featureId: string): NamingMapResult {
  // Normalize featureId to kebab-case
  let kebabFeature = featureId;
  if (!featureId.includes("-") && /^[A-Z]/.test(featureId)) {
    kebabFeature = pascalToKebab(featureId);
  }

  const pascalFeature = kebabToPascal(kebabFeature);

  switch (concern) {
    case "Logic":
      return {
        filename: `use-${kebabFeature}.ts`,
        symbol: `use${pascalFeature}`,
      };
    case "UI":
      return {
        filename: `${pascalFeature}.tsx`,
        symbol: pascalFeature,
      };
    case "Constant":
      return {
        filename: `constants/${kebabFeature}.ts`,
        symbol: kebabToScreamingSnake(kebabFeature),
      };
    case "Type":
      return {
        filename: `${kebabFeature}.types.ts`,
        symbol: pascalFeature,
      };
    case "Style":
      return {
        filename: `${kebabFeature}.styles.ts`,
        symbol: "styles",
      };
    default:
      // Why: TypeScript exhaustiveness check는 컴파일 타임에만 동작함.
      //      런타임에서 예상 범위를 벗어난 값이 들어오면 즉시 에러를 던져 조기 발견한다.
      throw new Error(`[naming-map] Unknown concern category: '${concern as string}'`);
  }
}

// Feature: fat-file-refactoring
import type { SourceFile } from "../types.ts";

export interface PropsGuardrailResult {
  passed: boolean;
  violations: string[];
}

/**
 * Validates: Requirements 8.1, 8.5
 *
 * Flags inline object, array, or function definitions in JSX props.
 * e.g., style={{ ... }}, data={[...]}, onPress={() => ...}
 */
export function checkPropsStability(
  generatedFiles: SourceFile[],
): PropsGuardrailResult {
  const violations: string[] = [];

  for (const file of generatedFiles) {
    if (!file.relativePath.endsWith(".tsx")) continue;

    const lines = file.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Rough heuristic: `<Component prop={{` or `prop={[` or `prop={() =>` or `prop={function`
      if (/\b[a-zA-Z0-9_]+=\{\{/.test(line)) {
        violations.push(
          `File ${file.relativePath}:${i + 1} - Inline object prop detected. Prefer useMemo or stable reference.`,
        );
      } else if (/\b[a-zA-Z0-9_]+=\{\[/.test(line)) {
        violations.push(
          `File ${file.relativePath}:${i + 1} - Inline array prop detected. Prefer useMemo or stable reference.`,
        );
      } else if (
        /\b[a-zA-Z0-9_]+=\{(?:\([^)]*\)|[^=]*)\s*=>/.test(line) ||
        /\b[a-zA-Z0-9_]+=\{function\b/.test(line)
      ) {
        violations.push(
          `File ${file.relativePath}:${i + 1} - Inline function prop detected. Prefer useCallback or stable reference.`,
        );
      }
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

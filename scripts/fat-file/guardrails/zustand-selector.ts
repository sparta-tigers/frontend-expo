// Feature: fat-file-refactoring
import type { SourceFile } from "../types.ts";

export interface ZustandGuardrailResult {
  passed: boolean;
  violations: string[];
}

/**
 * Validates: Requirements 8.4
 * 
 * Flags Zustand `useStore` calls that are missing a selector or might be returning
 * multiple properties without a `shallow` equality function.
 */
export function checkZustandSelectors(generatedFiles: SourceFile[]): ZustandGuardrailResult {
  const violations: string[] = [];

  for (const file of generatedFiles) {
    const lines = file.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match useXStore() or useXStore(state => ...)
      const storeMatch = line.match(/\b(use[A-Za-z0-9]*Store)\s*\(/);
      if (storeMatch) {
        // If it's a bare useStore() call
        if (/\buse[A-Za-z0-9]*Store\s*\(\s*\)/.test(line)) {
          violations.push(`File ${file.relativePath}:${i + 1} - Bare store subscription without selector: ${storeMatch[1]}()`);
        }
        
        // If it returns an array or object literal without 'shallow'
        // This is a rough heuristic. A proper AST parser handles this better.
        if (line.includes("=> [") || line.includes("=> ({")) {
          // Check if shallow is passed as a second argument on the same line
          if (!line.includes("shallow")) {
            violations.push(`File ${file.relativePath}:${i + 1} - Potential missing 'shallow' equality function for multi-property selector in ${storeMatch[1]}`);
          }
        }
      }
    }
  }

  return {
    passed: violations.length === 0,
    violations
  };
}

// Feature: fat-file-refactoring
import type { SourceFile } from "../types.ts";

export interface ZustandGuardrailResult {
  passed: boolean;
  violations: string[];
}

/**
 * Zustand 셀렉터 배열 반환 패턴 탐지
 *
 * Why: 생성 코드에서 `state => [...]` 또는 `state => ({...})` 형태의
 *      복수 값 셀렉터를 감지해 단순 구조분해 패턴으로 교체하도록 유도한다.
 *
 * ⚠ 한계 (Limitation):
 * - 멀티라인 셀렉터: `state =>\n[state.x, state.y]` 는 감지 불가
 * - 주석 내 패턴: `// => [` 오탐 가능
 * - 정확한 검증이 필요하면 AST 파서(@typescript-eslint/typescript-estree) 도입을 검토할 것
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

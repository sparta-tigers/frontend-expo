// Feature: fat-file-refactoring
import type { SourceFile } from "../types.ts";

export interface UseEffectGuardrailResult {
  passed: boolean;
  originalCount: number;
  newCount: number;
  syncEffects: number;
}

/**
 * Validates: Requirements 8.2, 8.3
 *
 * 1. Counts useEffect calls in the original file and across all generated modules.
 * 2. Checks if the total count in generated modules is strictly <= original count.
 * 3. Flags `useEffect(() => {...})` (without dependency array) as sync effects.
 */
export function checkUseEffect(
  originalFile: SourceFile,
  generatedFiles: SourceFile[],
): UseEffectGuardrailResult {
  const countEffects = (content: string) => {
    // Basic regex heuristic to count useEffect(
    const matches = content.match(/\buseEffect\s*\(/g);
    return matches ? matches.length : 0;
  };

  /**
   * useEffect 내 동기적 사이드 이펙트 수 추정
   *
   * Why: useEffect 본체 중 실제로 async 작업 없이 setState를 즉시 호출하는
   *      패턴(동기 이펙트)을 카운트하여 리팩터링 우선순위 판단에 활용한다.
   *      AST 파서가 아닌 정규식 기반이므로 과근사(over-approximate)임을 인지하고 사용.
   */
  const countSyncEffects = (content: string) => {
    // Heuristic: useEffect(..., []) has array, useEffect(...) without array
    // Sync effect = useEffect is called but we don't see a `, [` or `,[` before the closing `)`.
    const syncMatches = content.match(
      /\buseEffect\s*\(\s*(?:async\s*)?(?:\([^)]*\)|[^=]*)\s*=>\s*(?:\{[^}]*\}|[^,)]*)\s*\)/g,
    );
    return syncMatches ? syncMatches.length : 0;
  };

  const originalCount = countEffects(originalFile.content);
  let newCount = 0;
  let syncEffects = 0;

  for (const file of generatedFiles) {
    newCount += countEffects(file.content);
    syncEffects += countSyncEffects(file.content);
  }

  return {
    passed: newCount <= originalCount,
    originalCount,
    newCount,
    syncEffects,
  };
}

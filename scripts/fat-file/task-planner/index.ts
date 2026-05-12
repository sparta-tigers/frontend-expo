// Feature: fat-file-refactoring
import { createHash } from "node:crypto";
import type { RefactoringSpecEntry, RefactoringTask } from "../types.ts";

/**
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4
 */
export function planTask(spec: RefactoringSpecEntry): RefactoringTask {
  // Req 9.1: 1 Task per 1 Spec
  // Req 9.2: Initial state is Pending or Halted
  const state = spec.exception ? "Halted" : "Pending";

  const generatedModules = spec.decomposition.map(m => m.path);
  const expectedLocs = spec.decomposition.map(m => m.expectedLoc);

  // Why: 동일 파일에 대해 항상 동일한 ID를 보장하는 결정론적 생성.
  //      Date.now() + random 조합은 파이프라인 재실행 시 ID가 달라져 상태 추적을 불가능하게 한다.
  const hash = createHash("sha256")
    .update(spec.source.relativePath)
    .digest("hex")
    .slice(0, 12);

  return {
    id: `TASK-${hash}`,
    targetFile: spec.source.relativePath,
    generatedModules,
    expectedLocs,
    requirementsRefs: [1, 2, 3, 4, 5, 6, 7, 8], // Req 9.4
    state
  };
}

export function planTasks(specs: RefactoringSpecEntry[]): RefactoringTask[] {
  return specs.map(planTask);
}

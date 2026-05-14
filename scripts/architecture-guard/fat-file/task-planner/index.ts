// Feature: fat-file-refactoring
import { createHash } from "node:crypto";
import type { RefactoringSpecEntry, RefactoringTask } from "../types.ts";

/**
 * 단일 태스크 생성기
 *
 * Why:
 * Fat File 분해 명세서(RefactoringSpecEntry)를 입력받아 개별적으로 추적/실행 가능한 태스크(RefactoringTask)를 생성함.
 * 결정론적 해시를 ID로 사용하여, 여러 번 파이프라인이 재실행되더라도 동일한 파일은 항상 같은 ID를 부여받도록 설계됨.
 *
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4
 */
export function planTask(spec: RefactoringSpecEntry): RefactoringTask {
  // Req 9.1: 1 Task per 1 Spec
  // Req 9.2: Initial state is Pending or Halted
  const state = spec.exception ? "Halted" : "Pending";

  const generatedModules = spec.decomposition.map((m) => m.path);
  const expectedLocs = spec.decomposition.map((m) => m.expectedLoc);

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
    state,
  };
}

/**
 * 다중 태스크 생성기
 *
 * Why: 명세 배열을 순회하며 planTask를 맵핑하여 전체 태스크 목록을 일괄 생성함.
 */
export function planTasks(
  specs: readonly RefactoringSpecEntry[],
): RefactoringTask[] {
  return specs.map(planTask);
}

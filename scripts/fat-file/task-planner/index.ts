// Feature: fat-file-refactoring
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

  return {
    id: `TASK-${Date.now()}-${Math.floor(Math.random() * 10000)}`, // Simple deterministic-ish ID, for strict deterministic use hashing of relativePath
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

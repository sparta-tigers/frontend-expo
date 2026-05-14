// Feature: fat-file-refactoring
import type { Diagnosis, RefactoringSpecEntry } from "../types.ts";
import { planModules } from "./plan-modules.ts";
import { planTypeReplacement } from "./plan-type-replacement.ts";

export { extractPublicApi } from "./extract-public-api.ts";
export { namingMap } from "./naming-map.ts";
export { planModules } from "./plan-modules.ts";
export { planTypeReplacement } from "./plan-type-replacement.ts";
export { renderMarkdown } from "./render-markdown.ts";

/**
 * Builds a RefactoringSpecEntry for a single Diagnosis.
 */
export function buildSpec(diagnosis: Diagnosis): RefactoringSpecEntry {
  const { decomposition, barrelFile, exception } = planModules(diagnosis);
  const typeReplacements = planTypeReplacement(diagnosis.anyOccurrences);

  return {
    source: diagnosis,
    decomposition,
    typeReplacements,
    barrelFile,
    ...(exception ? { exception } : {}),
  };
}

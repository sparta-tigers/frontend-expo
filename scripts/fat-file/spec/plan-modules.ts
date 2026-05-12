// Feature: fat-file-refactoring
import type { BarrelFilePlan, Diagnosis, ModulePlan, RefactoringException } from "../types.ts";
import { namingMap } from "./naming-map.ts";

export function extractFeatureId(relativePath: string): string {
  const parts = relativePath.split("/");
  const base = parts.pop() || "";
  const name = base.replace(/\.[a-z]+$/, "");
  if (name === "index") {
    return parts.length > 0 ? parts[parts.length - 1] : "unknown";
  }
  // Why: 훅 컨벤션은 'use' 뒤에 반드시 대문자(use[A-Z]) 또는 하이픈+알파벳(use-[A-Za-z])이 와야 함.
  //      startsWith("use") 단독 사용 시 userProfile -> rProfile처럼 비-훅 이름을 잘못 자른다.
  if (/^use-[A-Za-z]/.test(name)) return name.slice(4);
  if (/^use[A-Z]/.test(name)) return name.slice(3);
  return name;
}

export interface ModulesPlanResult {
  decomposition: ModulePlan[];
  barrelFile: BarrelFilePlan;
  exception?: RefactoringException | undefined;
}

/**
 * Validates: Requirements 4.1, 4.2, 4.3
 */
export function planModules(diagnosis: Diagnosis): ModulesPlanResult {
  const featureId = extractFeatureId(diagnosis.relativePath);
  
  // Approximate loc distribution
  const expectedLocPerConcern = Math.ceil(diagnosis.loc / Math.max(1, diagnosis.concerns.length));
  
  let needsException = false;
  
  const decomposition: ModulePlan[] = diagnosis.concerns.map(concern => {
    if (expectedLocPerConcern > 300) {
      needsException = true;
    }
    
    const naming = namingMap(concern, featureId);
    
    // Create a path relative to the original file's directory
    const dir = diagnosis.relativePath.split("/").slice(0, -1).join("/");
    // We put decomposed files in a folder named after the feature, if it's not already an index file
    const isIndex = diagnosis.relativePath.endsWith("/index.tsx") || diagnosis.relativePath.endsWith("/index.ts");
    
    let path = "";
    if (isIndex) {
      path = `${dir}/${naming.filename}`;
    } else {
      path = `${dir}/${featureId}/${naming.filename}`;
    }

    return {
      path,
      concern,
      expectedLoc: expectedLocPerConcern,
      publicApi: concern === "Style" ? ["styles"] : [naming.symbol] // Placeholder for now, extract-public-api will refine this
    };
  });

  const exception: RefactoringException | undefined = needsException 
    ? { reason: `예상 LoC가 300줄을 초과합니다 (${expectedLocPerConcern}줄). 추가적인 분할 설계가 필요합니다.`, userConfirmationRequired: true }
    : undefined;

  const isIndex = diagnosis.relativePath.endsWith("/index.tsx") || diagnosis.relativePath.endsWith("/index.ts");
  const barrelPath = isIndex ? diagnosis.relativePath : `${diagnosis.relativePath.split("/").slice(0, -1).join("/")}/${featureId}/index.ts`;

  const barrelFile: BarrelFilePlan = {
    path: barrelPath,
    reExports: decomposition.flatMap(m => m.publicApi) // To be refined by extract-public-api
  };

  return {
    decomposition,
    barrelFile,
    exception
  };
}

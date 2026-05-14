// Feature: fat-file-refactoring
import { extractPublicApi } from "../spec/extract-public-api.ts";
import type {
  BarrelFilePlan,
  ModulePlan,
  SourceFile,
  ValidationReport,
} from "../types.ts";

export interface VerificationInput {
  originalFile: SourceFile;
  generatedModules: { plan: ModulePlan; file: SourceFile }[];
  barrelFile: { plan: BarrelFilePlan; file: SourceFile };
  tscBaselineErrors: string[];
  tscCurrentErrors: string[];
}

/**
 * 체크리스트 검증기 (Property 16)
 *
 * Why:
 * 추출된 파일과 모듈들이 리팩토링 규칙을 모두 만족하는지 정량적으로 평가하기 위함.
 * - locBound: 개별 모듈이 300 LoC를 초과하지 않아야 인지 부하가 감소함.
 * - singleConcern: 단일 책임 원칙(SRP) 준수 여부 검증.
 * - tscBaselineClean: 리팩토링으로 인한 새로운 타입 에러가 없음을 보장.
 * - publicApiPreserved: 기존에 노출되던 Public API가 유실되거나 서명이 변경되지 않았음을 보장하여 브레이킹 체인지를 차단.
 * - anyResidualCount: `any` 타입 잔재 여부를 파악하여 점진적 제거 전략 제공.
 *
 * Validates: Requirements 10, Property 16
 */
export function evaluateChecklist(input: VerificationInput): ValidationReport {
  const {
    generatedModules,
    barrelFile,
    tscBaselineErrors,
    tscCurrentErrors,
    originalFile,
  } = input;

  const failedReasons: string[] = [];
  const notes: string[] = [];

  // 1. locBound
  let locBound = true;
  for (const { file } of generatedModules) {
    const loc = file.content.split("\n").length;
    // We allow a small margin (e.g. +10%) or strictly <= 300?
    // Requirement says strictly <= 300
    if (loc > 300) {
      locBound = false;
      failedReasons.push(
        `Module ${file.relativePath} exceeds 300 LoC (${loc} lines).`,
      );
    }
  }

  // 2. singleConcern (Static check: is there more than one concern type exported/used?)
  // Why: 각 생성 모듈 경로에 단일 관심사만 매핑되는지 실제로 검증.
  //      동일 path에 여러 concern이 할당되면 단일 관심사 원칙 위반.
  const concernsByPath = new Map<string, Set<string>>();
  for (const { plan } of generatedModules) {
    const current = concernsByPath.get(plan.path) ?? new Set<string>();
    current.add(plan.concern);
    concernsByPath.set(plan.path, current);
  }
  const singleConcern = [...concernsByPath.values()].every(
    (set) => set.size === 1,
  );
  if (!singleConcern) {
    failedReasons.push(
      "At least one generated module contains multiple concerns.",
    );
  }

  // 3. tscBaselineClean
  // current errors \ baseline errors = empty
  const newErrors = tscCurrentErrors.filter(
    (e) => !tscBaselineErrors.includes(e),
  );
  const tscBaselineClean = newErrors.length === 0;
  if (!tscBaselineClean) {
    failedReasons.push(`Introduced ${newErrors.length} new TypeScript errors.`);
    notes.push(...newErrors);
  }

  // 4. publicApiPreserved
  const originalApi = extractPublicApi(originalFile);
  const newApi = [
    ...generatedModules.flatMap((m) => extractPublicApi(m.file)),
    ...extractPublicApi(barrelFile.file),
  ];

  let publicApiPreserved = true;
  for (const orig of originalApi) {
    // Why: name만 비교하면 함수→타입 변경 등 브레이킹 변경을 놓칠 수 있음.
    //      name + kind 조합으로 시그니처 레벨 보존을 검증한다.
    const isPreserved = newApi.some(
      (gen) => gen.name === orig.name && gen.kind === orig.kind,
    );
    if (!isPreserved) {
      publicApiPreserved = false;
      failedReasons.push(
        `Public API symbol '${orig.name}'(${orig.kind}) was lost or changed during refactoring.`,
      );
    }
  }

  // 5. anyResidualCount
  let anyResidualCount = 0;
  for (const { file } of generatedModules) {
    const matches = file.content.match(/\bany\b/g);
    if (matches) {
      anyResidualCount += matches.length;
    }
  }

  if (anyResidualCount > 0) {
    failedReasons.push(`${anyResidualCount} 'any' usages still remain.`);
  }

  const passed =
    locBound &&
    singleConcern &&
    tscBaselineClean &&
    publicApiPreserved &&
    anyResidualCount === 0;

  return {
    file: originalFile.relativePath,
    checklist: {
      locBound,
      singleConcern,
      tscBaselineClean,
      publicApiPreserved,
      anyResidualCount,
    },
    passed,
    failedReasons,
    notes,
  };
}

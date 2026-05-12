/* eslint-disable no-console */
// Feature: fat-file-refactoring
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { runTsc } from "./tsc-diff.ts";

/**
 * TypeScript 컴파일 오류를 파일로 저장합니다 (베이스라인 캡처).
 *
 * Why: 리팩터링 전/후 TS 에러를 스냅샷으로 남겨 회귀를 정량적으로 비교하기 위함.
 *      리팩터링 시작 전 한 번, 완료 후 한 번 실행하여 diff를 확인한다.
 *
 * @param outputPath 결과를 저장할 파일 경로 (예: "tsc-baseline.txt")
 */
export function captureBaseline(outputPath: string): void {
  const errors = runTsc();
  writeFileSync(outputPath, errors.join("\n"), "utf-8");
  console.log(`Captured ${errors.length} TS errors into ${outputPath}`);
}

// Allow running from CLI
// Why: 문자열 템플릿 조합은 Windows 경로 등 특수 환경을 올바르게 처리하지 못함.
//      pathToFileURL은 표준화된 URL 형식을 제공한다.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const target = process.argv[2] || "tsc-baseline.txt";
  captureBaseline(target);
}

import { readFileSync, writeFileSync } from "fs";

const tasksPath = ".kiro/specs/fat-file-refactoring/tasks.md";
const tasksMd = readFileSync(tasksPath, "utf-8");

const genTasks = JSON.parse(readFileSync(".kiro/specs/fat-file-refactoring/generated-tasks.json", "utf-8"));
const scanResult = JSON.parse(readFileSync(".kiro/specs/fat-file-refactoring/scan-result.json", "utf-8"));

let injection = "";
genTasks.forEach((task: any, i: number) => {
  const loc = scanResult.find((s: any) => s.relativePath === task.targetFile)?.loc || 0;
  const tier = scanResult.find((s: any) => s.relativePath === task.targetFile)?.priorityTier || "REVIEW";
  
  injection += `- [ ] 12.${i + 1} Refactor ${task.targetFile} (Priority: ${tier}, LoC: ${loc})\n`;
  injection += `  - Generated modules:\n`;
  task.generatedModules.forEach((mod: string, j: number) => {
    // deduce concern from extension or name roughly, or just leave it
    injection += `    - \`${mod}\` (~${Math.round(task.expectedLocs[j])} LoC)\n`;
  });
  injection += `  - Barrel_File: "원본 경로 얇은 위임 유지"\n`;
  injection += `  - Type replacements: Check refactoring_spec.md\n`;
  injection += `  - Validation checklist: all modules ≤ 300 LoC, single Concern, tsc baseline diff = ∅, Public_API preserved, any residual = 0\n`;
  injection += `  - Render guardrails: G1–G5 전부 pass\n`;
  injection += `  - _Requirements: 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.5, 7.1, 7.2, 7.3, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_\n`;
  injection += `  - _Validates: Property 8, 9, 10, 11, 12, 13, 14, 16_\n\n`;
});

const startTag = "- [ ] 12. (메타-작업) Phase C: Fat File 별 리팩토링 실행";
const endTag = "- [ ] 13. 최종 검증 및 리포트";

const startIndex = tasksMd.indexOf(startTag);
const endIndex = tasksMd.indexOf(endTag);

const newContent = tasksMd.substring(0, startIndex) +
  "- [ ] 12. Phase C: Fat File 별 리팩토링 실행\n\n" + injection +
  tasksMd.substring(endIndex);

writeFileSync(tasksPath, newContent, "utf-8");
console.log("Injected tasks into tasks.md"); // eslint-disable-line no-console

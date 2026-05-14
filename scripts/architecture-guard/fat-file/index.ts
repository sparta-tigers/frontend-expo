/* eslint-disable no-console */
// Feature: fat-file-refactoring
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { diagnose } from "./diagnosis/index.ts";
import { scan } from "./scanner/index.ts";
import { buildSpec, renderMarkdown } from "./spec/index.ts";
import { planTasks } from "./task-planner/index.ts";

const WORKSPACE_ROOT = process.cwd();

async function runPipeline() {
  console.log("1. Scanning files...");
  const targetDirs = ["app", "components", "context", "hooks", "src", "styles"];
  const scanResults = scan({
    rootDir: WORKSPACE_ROOT,
    targets: targetDirs,
    extensions: [".ts", ".tsx"],
    excludeDirs: ["node_modules", "dist", ".expo", ".kiro"],
  });

  const OUTPUT_DIR = "scripts/architecture-guard/fat-file/reports";
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  writeFileSync(
    `${OUTPUT_DIR}/scan-result.json`,
    JSON.stringify(scanResults, null, 2),
    "utf-8",
  );

  console.log(`Found ${scanResults.length} fat files (>= 500 LoC).`);

  const specs = [];

  for (const scanResult of scanResults) {
    const { absolutePath, relativePath, loc } = scanResult;
    console.log(`- Diagnosing ${relativePath} (LoC: ${loc})`);
    const content = readFileSync(absolutePath, "utf-8");
    const diagnosis = diagnose(scanResult, content);

    console.log(`- Building spec for ${relativePath}`);
    const spec = buildSpec(diagnosis);
    specs.push(spec);
  }

  // Generate refactoring_spec.md
  console.log(`Writing ${OUTPUT_DIR}/refactoring_spec.md...`);
  const mdContent = renderMarkdown(specs);
  writeFileSync(`${OUTPUT_DIR}/refactoring_spec.md`, mdContent, "utf-8");

  // Plan Tasks
  const tasks = planTasks(specs);
  writeFileSync(
    `${OUTPUT_DIR}/generated-tasks.json`,
    JSON.stringify(tasks, null, 2),
    "utf-8",
  );

  // Output instructions to update tasks.md
  console.log("Done! Refactoring Spec generated.");
  console.log("Tasks have been generated into generated-tasks.json.");
}

runPipeline().catch(console.error);

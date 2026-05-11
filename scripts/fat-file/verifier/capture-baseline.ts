/* eslint-disable no-console */
// Feature: fat-file-refactoring
import { writeFileSync } from "fs";
import { runTsc } from "./tsc-diff.ts";

export function captureBaseline(outputPath: string) {
  const errors = runTsc();
  writeFileSync(outputPath, errors.join("\n"), "utf-8");
  console.log(`Captured ${errors.length} TS errors into ${outputPath}`);
}

// Allow running from CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const target = process.argv[2] || "tsc-baseline.txt";
  captureBaseline(target);
}

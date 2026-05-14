// Feature: fat-file-refactoring
import { execSync } from "child_process";

export function runTsc(): string[] {
  try {
    execSync("npx tsc --noEmit", { stdio: "pipe" });
    return [];
  } catch (error: any) {
    if (error.stdout) {
      // Parse errors from stdout
      const lines = error.stdout.toString().split("\n");
      const errors = lines.filter((line: string) => line.includes("error TS"));
      return errors;
    }
    return [error.message];
  }
}

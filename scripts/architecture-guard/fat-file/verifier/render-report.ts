// Feature: fat-file-refactoring
import type { ValidationReport } from "../types.ts";

export function renderReport(report: ValidationReport): string {
  let md = `## 🔍 Verification Report: ${report.file}\n\n`;
  md += `**Result:** ${report.passed ? "✅ PASSED" : "❌ FAILED"}\n\n`;

  md += "### Checklist\n";
  md += `- [${report.checklist.locBound ? "x" : " "}] locBound\n`;
  md += `- [${report.checklist.singleConcern ? "x" : " "}] singleConcern\n`;
  md += `- [${report.checklist.tscBaselineClean ? "x" : " "}] tscBaselineClean\n`;
  md += `- [${report.checklist.publicApiPreserved ? "x" : " "}] publicApiPreserved\n`;
  md += `- [${report.checklist.anyResidualCount === 0 ? "x" : " "}] anyResidualCount === 0 (Count: ${report.checklist.anyResidualCount})\n\n`;

  if (report.failedReasons.length > 0) {
    md += "### ❌ Failures\n";
    for (const reason of report.failedReasons) {
      md += `- ${reason}\n`;
    }
    md += "\n";
  }

  if (report.notes.length > 0) {
    md += "### 📝 Notes\n";
    for (const note of report.notes) {
      md += `- ${note}\n`;
    }
    md += "\n";
  }

  return md;
}

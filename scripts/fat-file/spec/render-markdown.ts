// Feature: fat-file-refactoring
import type { RefactoringSpecEntry } from "../types.ts";

/**
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */
export function renderMarkdown(specs: RefactoringSpecEntry[]): string {
  let md = "# Fat File Refactoring Specification\n\n";

  for (const spec of specs) {
    md += `## 📄 ${spec.source.relativePath} (Priority: ${spec.source.priorityTier})\n\n`;
    md += `- **Original LoC:** ${spec.source.loc}\n`;
    md += `- **Concerns:** ${spec.source.concerns.join(", ")}\n\n`;

    if (spec.exception) {
      md += `> [!WARNING] Exception Flagged\n`;
      md += `> ${spec.exception.reason}\n\n`;
    }

    md += `### 🧩 Module Decomposition\n\n`;
    for (const mod of spec.decomposition) {
      md += `#### ${mod.path}\n`;
      md += `- **Concern:** ${mod.concern}\n`;
      md += `- **Expected LoC:** ~${mod.expectedLoc}\n`;
      md += `- **Public API:** \`${mod.publicApi.join(", ")}\`\n\n`;
    }

    md += `### 📦 Barrel File\n\n`;
    md += `- **Path:** ${spec.barrelFile.path}\n`;
    md += `- **Re-exports:** \`${spec.barrelFile.reExports.join(", ")}\`\n\n`;

    if (spec.typeReplacements.length > 0) {
      md += `### 🛡️ Type Safety Improvements (\`any\` Replacements)\n\n`;
      md += `| Line | Original | Strategy | Replacement |\n`;
      md += `|---|---|---|---|\n`;
      for (const rep of spec.typeReplacements) {
        md += `| ${rep.originalLine} | \`${rep.from}\` | ${rep.strategy} | \`${rep.to}\` |\n`;
      }
      md += "\n";
    }

    md += "---\n\n";
  }

  return md;
}

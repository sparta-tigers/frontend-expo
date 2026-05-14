// Feature: fat-file-refactoring
import type { AnyOccurrence, TypeReplacement } from "../types.ts";

/**
 * Validates: Requirements 6.1, 6.2, 6.3
 */
export function planTypeReplacement(
  occurrences: readonly AnyOccurrence[],
): TypeReplacement[] {
  return occurrences.map((occ, idx) => {
    let to = "";
    let strategy: "named-type" | "named-interface" | "unknown-with-guard" =
      "named-interface";
    let guardFunction: string | undefined;

    const baseName = `ExtractedType${idx + 1}`;

    if (occ.context === "assertion") {
      strategy = "unknown-with-guard";
      to = occ.snippet.replace(/\bas\s+any\b/, "as unknown");
      guardFunction = `is${baseName}`;
    } else if (occ.context === "array") {
      strategy = "named-interface";
      to = occ.snippet.replace(/\bany\s*\[\s*\]/, `${baseName}[]`);
    } else if (occ.context === "generic") {
      strategy = "named-interface";
      to = occ.snippet.replace(/<\s*any\s*>/, `<${baseName}>`);
    } else if (occ.context === "record") {
      strategy = "named-interface";
      to = occ.snippet.replace(
        /(Record<\s*[^,]+,\s*)any(\s*>)/,
        `$1${baseName}$2`,
      );
    } else {
      // variable, parameter, return
      strategy = "named-interface";
      to = occ.snippet.replace(/:\s*any\b/, `: ${baseName}`);
    }

    return {
      originalLine: occ.line,
      from: occ.snippet,
      to,
      strategy,
      ...(guardFunction !== undefined ? { guardFunction } : {}),
    };
  });
}

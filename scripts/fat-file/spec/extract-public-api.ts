// Feature: fat-file-refactoring
import type { SourceFile } from "../types.ts";

export interface PublicApiSymbol {
  name: string;
  kind: "value" | "type" | "default";
  signature?: string; // e.g. "() => void" (rough heuristic for static analysis)
}

/**
 * Validates: Requirements 7.1, 7.2
 */
export function extractPublicApi(file: SourceFile): PublicApiSymbol[] {
  const exports: PublicApiSymbol[] = [];
  const lines = file.content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // Default export
    if (trimmed.startsWith("export default ")) {
      exports.push({ name: "default", kind: "default" });
      continue;
    }

    // export type / interface
    let match = trimmed.match(/^export\s+(type|interface)\s+([A-Za-z0-9_]+)/);
    if (match) {
      exports.push({ name: match[2], kind: "type" });
      continue;
    }

    // export const / let / var
    match = trimmed.match(/^export\s+(const|let|var)\s+([A-Za-z0-9_]+)/);
    if (match) {
      exports.push({ name: match[2], kind: "value" });
      continue;
    }

    // export function / class
    match = trimmed.match(/^export\s+(function|class)\s+([A-Za-z0-9_]+)/);
    if (match) {
      exports.push({ name: match[2], kind: "value" });
      continue;
    }
    
    // export { A, B as C }
    match = trimmed.match(/^export\s+\{([^}]+)\}/);
    if (match) {
      const symbols = match[1].split(",").map(s => s.trim()).filter(Boolean);
      for (const sym of symbols) {
        const parts = sym.split(/\s+as\s+/);
        const name = parts.length > 1 ? parts[1] : parts[0];
        // We can't trivially tell if it's type or value from export {}
        // Assume value by default, or type if it has 'type' keyword prefix
        if (name.startsWith("type ")) {
          exports.push({ name: name.slice(5).trim(), kind: "type" });
        } else {
          exports.push({ name, kind: "value" });
        }
      }
    }
  }

  return exports;
}

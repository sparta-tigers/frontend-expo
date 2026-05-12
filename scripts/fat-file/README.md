# scripts/fat-file

Fat File refactoring toolkit. Scans the frontend codebase for files over the LoC threshold, diagnoses concern mixing, and drives the refactoring spec/verifier pipeline.

See `.kiro/specs/fat-file-refactoring/design.md` for the full pipeline.

## Runtime

- Node.js ESM (`"type": "module"` in this folder's `package.json`).
- Runner: [`tsx`](https://github.com/privatenumber/tsx). No pre-build step; `tsx` transpiles each module on the fly.
- Type checking is driven by the local `tsconfig.json` (strict + `isolatedModules`), detached from the Expo root tsconfig so React Native types do not leak into Node script scope.

## Usage

```bash
# Run the CLI entrypoint.
npx tsx scripts/fat-file/index.ts

# Type-check only (matches CI).
npx tsc -p scripts/fat-file/tsconfig.json --noEmit

# Property-based tests (added in later tasks) will live next to each module as *.test.ts
# and also run via `npx tsx`.
```

## Dependencies

Added to the repo root `package.json`:

- `fast-check` — property-based testing framework (design's chosen PBT library).
- `tsx` — TypeScript/ESM runner.
- `@types/node` — Node.js typings required by the `types: ["node"]` compiler option.

## Scope for task 1.1

This commit is scaffolding only. `index.ts` is a placeholder; the scanner, diagnosis engine, spec builder, and verifier are implemented in subsequent tasks (Phase A).

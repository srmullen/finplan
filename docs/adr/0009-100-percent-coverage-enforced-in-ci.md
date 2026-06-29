# 100% coverage enforced in CI

All four coverage metrics (lines, functions, branches, statements) are required at 100% for `src/` and `server/`, enforced via `vitest run --coverage` in CI. Istanbul is used over v8 for accuracy on TypeScript branch detection. The rule is: if a branch can't be tested, it shouldn't be in the code. `src/api/client.ts` is excluded because it is a thin network wrapper with no testable logic. React component tests use per-file `@vitest-environment jsdom` annotations; `node` remains the global default so server and engine tests don't pay a DOM tax.

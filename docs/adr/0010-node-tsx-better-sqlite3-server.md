# Node.js + tsx + better-sqlite3 for the API server

Supersedes [0004-bun-hono-sqlite-api-server](./0004-bun-hono-sqlite-api-server.md).

The backend API server switches from Bun to Node.js 22 as the runtime, using `tsx` to run TypeScript directly and `better-sqlite3` as the SQLite driver. The Hono HTTP framework and the overall server architecture are unchanged.

## Context

ADR 0004 chose Bun for its native TypeScript execution, built-in SQLite (`bun:sqlite`), and single-binary compilation. In practice, Bun's immaturity surfaced as tooling friction — incompatible ecosystem packages, inconsistent behaviour across platforms, and limited long-term confidence for a personal tool that should just work. Node.js 22 is a stable LTS target already in use in the Dagger CI container.

## Decision

- **Runtime**: Node.js 22 (`node:22-alpine` in CI, `node` on the home server).
- **TypeScript execution**: `tsx` — wraps esbuild, runs `.ts` files natively, zero config.
- **SQLite**: `better-sqlite3` — synchronous API nearly identical to `bun:sqlite`; most mature Node SQLite library.
- **HTTP server startup**: `@hono/node-server`'s `serve()`, guarded by `process.argv[1]` so tests import the module without starting a real listener.
- **Single-binary compilation**: dropped — running `tsx server/index.ts` (or via Docker) is sufficient for a single-user personal tool.

## Considered Options

**Keep Bun**: familiar, no migration cost. Rejected — immaturity is the root problem and doesn't improve by waiting.

**Node.js + `ts-node`**: older, slower startup, more config than `tsx`. No advantage.

**Node.js + compile step (`tsc` → `node dist/`)**: removes runtime TypeScript dep, but adds build complexity for no meaningful gain on a personal tool.

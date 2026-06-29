# Bun + Hono + SQLite for the API server

> **Superseded by [0010-node-tsx-better-sqlite3-server](./0010-node-tsx-better-sqlite3-server.md)**

The backend API server uses Bun as the runtime, Hono as the HTTP framework, and SQLite (via `bun:sqlite`) as the database. This stack was chosen over Node.js + Express + better-sqlite3 for operational simplicity on a personal home server: Bun runs TypeScript natively with no build pipeline, `bun:sqlite` is built in with no extra dependency, and `bun build --compile` produces a single self-contained binary for deployment. The Projection engine runs server-side so that AI agents and scripts can get time-series output from a single REST endpoint without re-implementing the engine.

## Considered Options

**Node.js + Hono + better-sqlite3**: the default choice — larger ecosystem, more battle-tested. Requires a `tsc`/`esbuild` build step on the server and a separate SQLite npm package. No meaningful advantage over Bun for this use case.

**Bun + Hono + bun:sqlite (chosen)**: native TypeScript execution, built-in SQLite, single-binary compilation. Less familiar but production-stable. The reduction in moving parts is worth the novelty for a single-user personal tool.

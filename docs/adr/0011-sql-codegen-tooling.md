# SQL codegen tooling — sqlc evaluated and deferred

Evaluates sqlc + `sqlc-gen-typescript` as a path to moving SQL out of `.ts` files and into `.sql` files with typed generated query functions, per the future migration seam established in ADR-0007. Conclusion: sqlc is technically compatible but not adopted yet; inline `better-sqlite3` `db.prepare()` remains.

## Context

`server/stores.ts` embeds ~20 SQL strings inside `db.prepare()` calls. ADR-0007 was written with an explicit migration seam — the store interfaces exist precisely so that a future sqlc-generated implementation can satisfy them without touching handler code. This ADR decides whether to make that move now.

## Evaluation: sqlc + sqlc-gen-typescript

**sqlc** (sqlc-dev/sqlc) parses `.sql` query files against a schema and generates typed query functions. SQLite is a supported target database. The `sqlc-gen-typescript` WASM plugin generates TypeScript and lists `better-sqlite3` as a supported driver, making it nominally compatible with this stack.

**What the generated code looks like.** For a query `SELECT * FROM accounts WHERE id = ?1`, the plugin emits:

```typescript
export function getAccount(db: Database, id: string): GetAccountRow | undefined {
  return db.prepare<GetAccountRow, [string]>(GetAccount).get(id);
}
```

`GetAccountRow` uses SQL column names verbatim (`seed_balance: number`, `amortizing: number`). It does not map to the domain types (`Account` from `src/engine/types`), so the existing `rowToAccount` family of mapper functions must remain. The thin adapter satisfies the store interfaces:

```typescript
const accounts: AccountStore = {
  list:   ()   => listAccounts(db).map(rowToAccount),
  get:    (id) => { const r = getAccount(db, id); return r ? rowToAccount(r) : null; },
  create: (a)  => createAccount(db, a),
  ...
};
```

**What sqlc actually buys here.** SQL moves to `.sql` files (better editor support, syntax linting), and sqlc validates SQL syntax and parameter arity at codegen time. What it does *not* eliminate: the `rowTo*` mapper functions, boolean-from-integer coercions, and JSON column parsing for the `scenarios` table — those remain in the adapter layer regardless.

**What it costs.** sqlc is a Go binary (installed via `brew`, `go install`, or a downloaded release). It is not an npm package. Adding it to CI means either installing Go, downloading the binary in the Dagger pipeline, or using a Docker image. That is a meaningful dependency for a personal tool with a currently simple CI setup. The `sqlc-gen-typescript` plugin is also not yet at a stable v1 release.

## Decision

Defer sqlc adoption. The compatibility is real, but the net gain over inline `db.prepare()` is modest: SQL moves to `.sql` files and gets syntax validation, but the mapper and adapter layers are unchanged. Adding a Go binary to a Node.js personal tool is a non-trivial trade for that gain at the current scale (~20 queries across 5 tables).

The ADR-0007 DI seam remains in place. When — and if — the SQL surface grows significantly, or a production-stable pure-npm codegen option emerges (e.g., drizzle-orm schema + Drizzle Studio, or sqlc-gen-typescript reaching v1), revisit this decision.

## Fallback path

Stay with inline `better-sqlite3` `db.prepare()` in `server/stores.ts`. The store interface boundary (ADR-0007) already provides the right seam for a future migration; no structural change is needed now.

## Considered Options

**Adopt sqlc now** — SQL moves to `.sql` files, build-time SQL validation gained. Rejected: the mapper layer survives anyway, and the Go binary adds toolchain complexity to a Node.js personal tool.

**drizzle-orm** — TypeScript-first, pure npm, first-class `better-sqlite3` support, no separate codegen step. Does not produce `.sql` files (SQL lives in a TypeScript schema DSL). Doesn't satisfy the "SQL in `.sql` files" goal from the issue but is worth considering if type-safe queries become the priority over SQL-in-files.

**Stay with inline `db.prepare()` (chosen)** — no new toolchain, mapper functions unchanged, ADR-0007 seam preserved for a future migration.

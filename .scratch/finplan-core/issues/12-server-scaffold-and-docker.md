Status: ready-for-agent

# Server scaffold + Docker

## What to build

Create the foundational server layer that all subsequent API issues build on. This is a thin vertical slice — no business endpoints yet, just the skeleton everything else plugs into.

Set up a `server/` directory at the repo root containing a Bun + Hono HTTP server. The server shares domain types and the projection engine directly from `../src/engine/` via path imports (no workspace tooling needed — Bun resolves TypeScript natively).

**SQLite schema** (via `bun:sqlite`): create all five tables on startup if they don't exist:
- `accounts` — columns matching the `Account` type (id, name, type, owner, seed_balance, seed_date, rate, amortizing)
- `external_parties` — id, name
- `schedules` — columns matching `Schedule` (id, source_id, destination_id, amount, estimated, frequency, start_date, end_date, terminate_at_zero)
- `adjustments` — id, account_id, date, actual_balance
- `scenarios` — id, name, schedule_overrides (JSON), additional_schedules (JSON), additional_accounts (JSON)

**API key middleware**: every `/api/*` route requires an `Authorization: Bearer <key>` header. The key is read from a `FINPLAN_API_KEY` environment variable. Requests without the correct key receive `401`.

**Static file serving**: in production, the Bun server serves the compiled React app from a `dist/` directory (Vite output). The route `/api/*` is handled by Hono; everything else falls through to the static files.

**Dockerfile**: single container. Build stage runs `vite build` to produce `dist/`. Runtime stage copies the `server/` source and `dist/` into a Bun image. The container exposes one port (default 3000). The SQLite file lives at `/data/finplan.db` inside the container.

**docker-compose.yml**: one service with a named volume mounted at `/data`. `FINPLAN_API_KEY` passed as an environment variable. No other services.

**Vite proxy** (`vite.config.ts`): in dev, proxy `/api/*` to `http://localhost:3000` so the Vite dev server and Bun server can run side-by-side without CORS issues.

**API client** (`src/api/client.ts`): a thin fetch wrapper that reads the API base URL from `import.meta.env.VITE_API_BASE` (defaults to empty string, so relative URLs work in both dev-with-proxy and production-same-origin), attaches `Authorization: Bearer <key>` from `import.meta.env.VITE_API_KEY`, and exports typed helper functions (`get`, `post`, `put`, `del`). This client is the only place in the frontend that knows about auth or the base URL.

## Acceptance criteria

- [ ] `bun run server/index.ts` starts a Hono server that responds to `GET /api/health` with `{ ok: true }`
- [ ] Requests to `/api/*` without the correct `Authorization` header return `401`
- [ ] The SQLite database file is created on first start with all five tables present
- [ ] `docker compose up` starts the container; `GET /api/health` returns `{ ok: true }` on the exposed port
- [ ] In dev (`vite dev` + `bun run server/index.ts`), fetching `/api/health` from the browser proxies correctly to the Bun server
- [ ] `src/api/client.ts` exports `get`, `post`, `put`, `del` with the auth header attached
- [ ] Typecheck clean across both `src/` and `server/`

## Blocked by

None — can start immediately.

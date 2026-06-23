# Query layer interface for server dependency injection

The server is structured around a `createApp(stores)` factory rather than a singleton that closes over a shared `db` import. `createApp` accepts a typed stores object — `{ accounts: AccountStore, schedules: ScheduleStore, parties: ExternalPartyStore, scenarios: ScenarioStore, adjustments: AdjustmentStore }` — and owns auth middleware and schema initialization. Each store interface declares only the methods its handlers call (partial interfaces, not a shared base), with generic CRUD names: `list`, `get`, `create`, `update`, `remove`.

This boundary exists primarily to enable a future migration to SQL-outside-TypeScript tooling (à la sqlc): when that migration happens, only the store implementations change — handler code is untouched. It also enables per-test isolation in `bun test` via in-memory SQLite instances passed to `createApp` without any env-var hacks.

## Considered Options

**Raw `Database` injection** — `createApp(db: Database)` passes the `bun:sqlite` instance directly. Simpler upfront but couples all handler code to the `bun:sqlite` API; every handler would need to change when moving to a generated query layer.

**Query layer interface (chosen)** — handlers call typed store methods; the `bun:sqlite` implementation satisfies those interfaces today; a future sqlc-generated implementation satisfies them later. The DI seam is in the right place from the start.

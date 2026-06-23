Status: done

# Scenarios endpoint + frontend integration

## What to build

Add full CRUD for Scenarios to the API server, and switch ScenarioManager away from AppContext/localStorage. Scenario overrides are stored as JSON columns per ADR-0005.

**Server**: implement five routes under `/api/scenarios`:
- `GET /api/scenarios` — return all scenarios as a JSON array; parse the JSON columns before returning
- `POST /api/scenarios` — create; body is a `Scenario` object; serialize `scheduleOverrides`, `additionalSchedules`, `additionalAccounts` to JSON for storage
- `GET /api/scenarios/:id` — single scenario or 404
- `PUT /api/scenarios/:id` — replace; re-serialize JSON columns
- `DELETE /api/scenarios/:id` — `204`

All routes go through the API key middleware from issue #12.

**Frontend**: introduce a `useScenarios()` hook in `src/hooks/useScenarios.ts` following the same pattern as `useAccounts()` from issue #13. Replace every call to `useApp()` for scenario state in ScenarioManager with `useScenarios()`. Remove `ADD_SCENARIO`, `UPDATE_SCENARIO`, `DELETE_SCENARIO` from AppContext.

## Acceptance criteria

- [ ] `GET /api/scenarios` returns all scenarios with nested `scheduleOverrides`, `additionalSchedules`, `additionalAccounts` correctly deserialized from JSON columns
- [ ] `POST` and `PUT` correctly serialize those fields before writing to SQLite
- [ ] All routes return `401` without the correct API key
- [ ] ScenarioManager reads and mutates scenarios via `useScenarios()` with no AppContext involvement
- [ ] `ADD_SCENARIO`, `UPDATE_SCENARIO`, `DELETE_SCENARIO` are removed from AppContext
- [ ] Typecheck clean; existing tests pass

## Blocked by

- `.scratch/finplan-core/issues/12-server-scaffold-and-docker.md`

Status: done

# Projection endpoint + frontend integration

## What to build

Add the Projection endpoint to the API server, switch ProjectionView to call it instead of running `project()` locally, and remove AppContext entirely now that all entities are served from the API.

**Server**: implement `GET /api/projection` with query parameters:
- `startDate` (required) — ISO date string
- `endDate` (required) — ISO date string
- `scenarioId` (optional) — if provided, load the matching Scenario from the DB and pass it to `project()`

The handler loads all accounts, schedules, and adjustments from SQLite, assembles a `ProjectionInput`, runs `project()` (imported from `../src/engine/projection`), and returns the `ProjectionResult` as JSON. Goes through the API key middleware from issue #12.

**Frontend**: ProjectionView currently calls `project()` locally using data from AppContext. Replace this with a call to `GET /api/projection` — passing the current `startDate`, `endDate`, and active `scenarioId`. The component should fetch the projection result from the server and render it exactly as before. All other data ProjectionView needs (account list for the legend/filter, scenario list for ScenarioManager, adjustments for AdjustmentPanel) should come from the per-resource hooks introduced in issues #13–#17.

Once ProjectionView is fully migrated, AppContext (`src/storage/AppContext.tsx`) and the localStorage store (`src/storage/store.ts`) will be empty of all actions and state — delete both files. Remove `main.tsx`'s `<AppProvider>` wrapper.

## Acceptance criteria

- [ ] `GET /api/projection?startDate=…&endDate=…` returns a `ProjectionResult` matching what `project()` produces for the same inputs
- [ ] `GET /api/projection?startDate=…&endDate=…&scenarioId=…` runs the projection with the named Scenario applied
- [ ] The endpoint returns `401` without the correct API key; `400` if `startDate` or `endDate` are missing
- [ ] ProjectionView fetches from the server; the chart renders identically to before
- [ ] `AppContext.tsx` and `store.ts` are deleted; `<AppProvider>` removed from `main.tsx`
- [ ] No call to `project()` remains in the frontend bundle
- [ ] Typecheck clean; full test suite passes

## Blocked by

- `.scratch/finplan-core/issues/13-accounts-endpoint-and-frontend.md`
- `.scratch/finplan-core/issues/14-external-parties-endpoint-and-frontend.md`
- `.scratch/finplan-core/issues/15-schedules-endpoint-and-frontend.md`
- `.scratch/finplan-core/issues/16-adjustments-endpoint-and-frontend.md`
- `.scratch/finplan-core/issues/17-scenarios-endpoint-and-frontend.md`

Status: done

# Schedules endpoint + frontend integration

## What to build

Add full CRUD for Schedules to the API server, and switch SchedulesView away from AppContext/localStorage.

**Server**: implement five routes under `/api/schedules`:
- `GET /api/schedules` — return all schedules as a JSON array
- `POST /api/schedules` — create; body is a `Schedule` object
- `GET /api/schedules/:id` — single schedule or 404
- `PUT /api/schedules/:id` — replace
- `DELETE /api/schedules/:id` — `204`

All routes go through the API key middleware from issue #12.

**Frontend**: introduce a `useSchedules()` hook in `src/hooks/useSchedules.ts` following the same pattern as `useAccounts()` from issue #13. The hook also needs access to accounts and external parties (for the source/destination dropdowns in ScheduleForm) — it should not fetch those itself; instead SchedulesView should compose `useSchedules()` with `useAccounts()` and `useExternalParties()`. Replace every call to `useApp()` for schedule state in SchedulesView and ScheduleForm with the appropriate hooks. Remove the `ADD_SCHEDULE`, `UPDATE_SCHEDULE`, `DELETE_SCHEDULE` action types and their reducer cases from AppContext.

## Acceptance criteria

- [ ] `GET /api/schedules` returns all schedules; `POST` creates one; `PUT` updates; `DELETE` removes
- [ ] All routes return `401` without the correct API key
- [ ] SchedulesView reads and mutates schedules via `useSchedules()` with no AppContext involvement
- [ ] ScheduleForm source/destination dropdowns are populated from `useAccounts()` and `useExternalParties()` (not AppContext)
- [ ] `ADD_SCHEDULE`, `UPDATE_SCHEDULE`, `DELETE_SCHEDULE` are removed from AppContext
- [ ] Typecheck clean; existing tests pass

## Blocked by

- `.scratch/finplan-core/issues/12-server-scaffold-and-docker.md`

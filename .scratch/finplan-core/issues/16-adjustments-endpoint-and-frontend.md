Status: done

# Adjustments endpoint + frontend integration

## What to build

Add CRUD for Adjustments to the API server, and switch AdjustmentPanel away from AppContext/localStorage.

**Server**: implement routes under `/api/adjustments`:
- `GET /api/adjustments` — return all adjustments as a JSON array
- `POST /api/adjustments` — create; body is an `Adjustment` object
- `DELETE /api/adjustments/:id` — `204` (Adjustments are not updated, only added or deleted)

All routes go through the API key middleware from issue #12.

**Frontend**: introduce a `useAdjustments()` hook in `src/hooks/useAdjustments.ts` following the same pattern as `useAccounts()` from issue #13. AdjustmentPanel currently receives `adjustments` and `accounts` as props from ProjectionView; continue passing `accounts` as a prop (ProjectionView will supply it via `useAccounts()` by the time issue #18 lands), but switch `adjustments` to come from `useAdjustments()` internally. Replace the `dispatch` call for `ADD_ADJUSTMENT` and `DELETE_ADJUSTMENT` with API calls. Remove `ADD_ADJUSTMENT` and `DELETE_ADJUSTMENT` from AppContext.

## Acceptance criteria

- [ ] `GET /api/adjustments` returns all adjustments; `POST` creates one; `DELETE` removes by id
- [ ] All routes return `401` without the correct API key
- [ ] AdjustmentPanel reads and mutates adjustments via `useAdjustments()` with no AppContext involvement
- [ ] `ADD_ADJUSTMENT` and `DELETE_ADJUSTMENT` are removed from AppContext
- [ ] Typecheck clean; existing tests pass

## Blocked by

- `.scratch/finplan-core/issues/12-server-scaffold-and-docker.md`

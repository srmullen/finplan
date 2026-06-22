Status: ready-for-agent

# ExternalParties endpoint + frontend integration

## What to build

Add full CRUD for ExternalParties to the API server, and switch the frontend ExternalPartyForm away from AppContext/localStorage.

**Server**: implement five routes under `/api/external-parties`:
- `GET /api/external-parties` — return all external parties as a JSON array
- `POST /api/external-parties` — create; body is an `ExternalParty` object
- `GET /api/external-parties/:id` — single party or 404
- `PUT /api/external-parties/:id` — replace
- `DELETE /api/external-parties/:id` — `204`

All routes go through the API key middleware from issue #12.

**Frontend**: introduce a `useExternalParties()` hook in `src/hooks/useExternalParties.ts` following the same pattern as `useAccounts()` from issue #13. Replace every call to `useApp()` for external party state in ExternalPartyForm with `useExternalParties()`. Remove the `ADD_PARTY`, `UPDATE_PARTY`, `DELETE_PARTY` action types and their reducer cases from AppContext.

## Acceptance criteria

- [ ] `GET /api/external-parties` returns all parties; `POST` creates one; `PUT` updates; `DELETE` removes
- [ ] All routes return `401` without the correct API key
- [ ] ExternalPartyForm reads and mutates parties via `useExternalParties()` with no AppContext involvement
- [ ] `ADD_PARTY`, `UPDATE_PARTY`, `DELETE_PARTY` are removed from AppContext
- [ ] Typecheck clean; existing tests pass

## Blocked by

- `.scratch/finplan-core/issues/12-server-scaffold-and-docker.md`

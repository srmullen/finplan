Status: done

# Accounts endpoint + frontend integration

## What to build

Add full CRUD for Accounts to the API server, and switch the frontend AccountsView away from AppContext/localStorage to use the new endpoints.

**Server**: implement five routes under `/api/accounts`:
- `GET /api/accounts` — return all accounts as a JSON array
- `POST /api/accounts` — create a new account; body is an `Account` object; respond with the created account
- `GET /api/accounts/:id` — return a single account or 404
- `PUT /api/accounts/:id` — replace a single account; respond with the updated account
- `DELETE /api/accounts/:id` — delete; respond `204`

All routes go through the API key middleware established in issue #12.

**Frontend**: introduce a `useAccounts()` hook in `src/hooks/useAccounts.ts` that fetches `GET /api/accounts` on mount and exposes `accounts`, `addAccount`, `updateAccount`, `deleteAccount` functions that call the API client from issue #12 and re-fetch (or optimistically update) on success. Replace every call to `useApp()` for account state in AccountsView and AccountForm with `useAccounts()`. Remove the `ADD_ACCOUNT`, `UPDATE_ACCOUNT`, `DELETE_ACCOUNT` action types and their reducer cases from AppContext.

## Acceptance criteria

- [ ] `GET /api/accounts` returns all accounts; `POST` creates one; `PUT` updates; `DELETE` removes
- [ ] All routes return `401` without the correct API key
- [ ] AccountsView reads and mutates accounts via `useAccounts()` with no AppContext involvement
- [ ] AccountForm submits to the API; the list refreshes after add/edit/delete
- [ ] `ADD_ACCOUNT`, `UPDATE_ACCOUNT`, `DELETE_ACCOUNT` are removed from AppContext
- [ ] Typecheck clean; existing tests pass

## Blocked by

- `.scratch/finplan-core/issues/12-server-scaffold-and-docker.md`

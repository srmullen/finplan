---
name: new-feature
description: Create an ephemeral git worktree for a new GitHub issue — new branch, derived .env, installed dependencies. Use when the user wants to start work on an issue, "spin up a worktree", or "new feature".
argument-hint: "<issue-number> <short-name>"
disable-model-invocation: true
---

Run from inside the `main` or `dev` worktree:

```
scripts/new-feature.sh <issue-number> <short-name>
```

This is a plain shell script, not an agent-driven process — see `docs/adr/0014-ephemeral-per-feature-worktrees.md` for why. It:

1. Mirrors ship's stacking logic to pick a base ref (the most recently opened PR targeting the current worktree's branch, or that branch's tip).
2. Creates a new sibling worktree at `../issue-<N>-<short-name>` on a new branch of the same name.
3. Copies `.env` into it, deriving a collision-free `PORT`/`VITE_PORT` (and matching `VITE_API_BASE`/`CORS_ORIGIN`) from the issue number.
4. Runs `npm install` in the new worktree.

`<short-name>` should be a short, hand-picked kebab-case slug of the issue title — not a mechanical truncation. Look up the issue (`gh issue view <issue-number>`) if you don't already have a good short name in mind.

Once it finishes, start a fresh session in the new worktree path it prints and continue there (e.g. `/implement` or `/ship`).

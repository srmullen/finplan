# Ephemeral per-feature worktrees replace persistent branch worktrees

Today, feature work happens inside one of two long-lived worktrees (`main`, `dev`), with branches checked out and swapped inside them as work progresses — `ship`'s current step 1 infers the *target* branch from the worktree's directory name on that assumption. This doesn't support running multiple agents on multiple features concurrently: only one branch can be checked out per worktree at a time.

Instead, a `scripts/new-feature.sh <issue#> <short-name>` script creates a brand-new sibling git worktree per feature (e.g. `../issue-54-payment-groups-read-path`), branched off the correct base, with its own `.env` and installed dependencies — ready for an agent to start work in immediately. A matching `scripts/done-feature.sh <issue#>` tears it down once the PR has landed (or been abandoned). `main` and `dev` become fixed reference checkouts only; they're never where feature work happens, and are the two places `new-feature.sh`/`done-feature.sh` are run *from* (their directory name still supplies the target branch — `main` or `dev` — for `new-feature.sh`'s base-branch/stacking logic, which is otherwise unchanged from `ship`'s current step 2).

This is deliberately mechanical, not agent-driven: both scripts are plain shell, not Claude Code skills, so creating/destroying an environment stays fast and deterministic (per the source blog post's core argument — friction kills the habit). Thin skill wrappers may reference them for discoverability, but the scripts themselves have no LLM in the loop.

## Considered Options

**Keep reusing `main`/`dev` worktrees, just automate the `.env`/install steps in place** — lower blast radius, but doesn't unlock concurrent feature work, and doesn't match "ephemeral" — rejected.

**Auto-slugify the full issue title into the branch name** — fully automatic (one argument), but a mechanical slugify can't reproduce the short, hand-compressed names this repo already uses (e.g. issue 54's branch name drops most of the actual issue title). Rejected in favor of taking the short name as an explicit second argument.

**Have `new-feature.sh` end by launching an agent in the new worktree (as in the source blog post)** — rejected: a PRD already exists as the GitHub issue itself (see `docs/agents/issue-tracker.md`), so there's nothing to co-author. The script's job ends when the environment is ready.

## Consequences

- **`ship` loses its steps 1–2.** It no longer computes or creates branches/worktrees; it now assumes it's already running inside a worktree `new-feature.sh` created, on the correct branch. Its remaining steps (implement → fix → ci → push → PR) are unchanged.
- **Port allocation.** Since `src/api/client.ts` calls `VITE_API_BASE` as an absolute URL when set, vite's own dev-server proxy is effectively dead — only the *backend* port strictly needs to be unique for concurrent worktrees to coexist. But `CORS_ORIGIN` must still match whichever port the frontend actually serves on, and vite doesn't currently take a port from config/env. `new-feature.sh` derives both a backend `PORT` (`3000 + issue# % 1000`) and a new `VITE_PORT` (`5173 + issue# % 1000`) from the issue number, writing both into the new worktree's `.env` along with a matching `VITE_API_BASE`/`CORS_ORIGIN`. **Prerequisite:** `package.json`'s `dev` script and/or `vite.config.ts` need a small follow-up change to actually honor `VITE_PORT` — out of scope for this docs-only session since it touches source, not `CONTEXT.md`/ADRs.
- **Database isolation is free.** `DB_PATH` in `.env` is already a relative path (`finplan.db`), and `server/stores.ts` runs `CREATE TABLE IF NOT EXISTS` on first touch. Each worktree directory naturally gets its own empty, self-creating db file without any copying of real data — `new-feature.sh` doesn't need to touch `DB_PATH` at all.
- **`.env` handling.** `FINPLAN_API_KEY`/`VITE_API_KEY` are copied verbatim (shared secret); `PORT`, `VITE_PORT`, `VITE_API_BASE`, `CORS_ORIGIN` are rewritten per the port scheme above; `DB_PATH` is left untouched.
- **Dependency install is unoptimized.** `new-feature.sh` runs a plain `npm install` — no `node_modules` copy/hardlink trick. Simplicity and correctness over shaving install time; revisit only if it proves annoying in practice.
- **Cleanup safety.** `done-feature.sh <issue#>` looks up the PR for that issue's branch and requires it to be in a terminal state — `MERGED`, `CLOSED`, or no PR ever opened at all — before removing the worktree and branch (local + remote). It refuses if the worktree has uncommitted changes, regardless of PR state.

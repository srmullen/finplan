---
name: ship
description: This skill should be used when the user wants to "implement and open a PR", "ship an issue", "implement and create a pull request", "build and ship", or wants to go from a PRD or GitHub issue all the way to an open pull request in one step.
disable-model-invocation: true
---

Implement the work, commit it, and open a pull request.

Run this from inside a feature worktree created by `scripts/new-feature.sh` (see `docs/adr/0014-ephemeral-per-feature-worktrees.md`). Branch and worktree setup are that script's job, not ship's — by the time ship runs, the current branch and its base are already settled.

## Steps

1. Run `/implement` to build, test, and commit the work to the current branch.

2. Run `npm run fix` to auto-fix any lint/format issues, then stage and commit the changes if any were made:
   ```
   npm run fix
   git diff --quiet || (git add -A && git commit -m "chore: apply biome auto-fixes")
   ```
   If `npm run fix` exits with errors for issues it could not auto-fix (e.g. lint violations that require manual intervention), stop and resolve them before continuing.

3. Run `npm run ci` to verify the full CI pipeline passes locally:
   ```
   npm run ci
   ```
   If it fails, diagnose and fix the issues, then re-run until it passes. Commit any fixes before continuing.

4. Push the branch to origin:
   ```
   git push -u origin <branch>
   ```

5. Open a pull request with `gh pr create`, targeting `<target-branch>` (see Notes for how to determine this). Use `Closes #N` in the body to link and auto-close the source issue. If this branch was stacked on another PR's branch, include a stacking note (see Notes). Follow the PR body format below.

## PR body format

```
Closes #N

Stacked on #N — merge after that PR.   ← include only when stacked on another open PR

## Summary
- <bullet summarising what changed and why>

## Test plan
- [ ] <item>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## Notes

- The current branch is named `issue-<N>-<short-name>` by `new-feature.sh`. Infer the issue number `<N>` from that pattern; fall back to the conversation or recent commits (`git log --oneline -10`) if the branch doesn't match it.
- `new-feature.sh` records `TARGET_BRANCH` and `STACKED_ON_PR` in `$(git rev-parse --git-dir)/new-feature-meta`. Read this file for `<target-branch>` and the stacking note; it's per-worktree and untracked, so it's always specific to the current branch.
- Keep the PR title under 70 characters and match the issue title where possible.
- If no issue exists, omit the `Closes` line.
- Omit the "Stacked on" line if `STACKED_ON_PR` is empty.
- Merge order matters: stacked PRs must be merged into `<target-branch>` in order (oldest first).
- Once the PR is merged (or closed), run `scripts/done-feature.sh <N>` from `main`/`dev` to remove this worktree and branch.

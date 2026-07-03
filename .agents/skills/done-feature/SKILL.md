---
name: done-feature
description: Tear down an ephemeral feature worktree created by new-feature once its PR has merged or closed. Use when the user wants to clean up a worktree, "done with this issue", or after a PR merges.
argument-hint: "<issue-number>"
disable-model-invocation: true
---

Run from inside the `main` or `dev` worktree:

```
scripts/done-feature.sh <issue-number>
```

This is a plain shell script — see `docs/adr/0014-ephemeral-per-feature-worktrees.md`. It finds the worktree/branch named `issue-<N>-*`, then refuses to proceed if:

- the worktree has uncommitted changes, or
- its PR (if one was ever opened) is still `OPEN`.

A branch with no PR at all (abandoned before ever pushing) is fine to remove. Otherwise it removes the worktree and deletes the branch locally and on origin.

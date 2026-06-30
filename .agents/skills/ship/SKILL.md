---
name: ship
description: This skill should be used when the user wants to "implement and open a PR", "ship an issue", "implement and create a pull request", "build and ship", or wants to go from a PRD or GitHub issue all the way to an open pull request in one step.
disable-model-invocation: true
---

Implement the work, commit it, and open a pull request.

## Steps

1. Determine the target branch from the worktree name:
   ```
   basename $(git rev-parse --show-toplevel)
   ```
   The directory name of the current worktree is the target branch (e.g. a worktree at `.../dev` targets the `dev` branch). Use this value as `<target-branch>` throughout.

2. Sync with the stack and find the correct base branch:

   **If continuing work on an existing branch:**
   - Identify the base branch (the branch this one was created from).
   - Check whether the base branch still exists on origin:
     ```
     git ls-remote --heads origin <base-branch>
     ```
   - If the output is **empty** (base was merged and deleted):
     - Rebase the current branch onto `origin/<target-branch>`:
       ```
       git fetch origin <target-branch>
       git rebase origin/<target-branch>
       ```
     - Delete the old base branch locally and remotely:
       ```
       git branch -d <base-branch>
       git push origin --delete <base-branch>
       ```
   - If the base branch **still exists**, rebase onto its tip:
     ```
     git fetch origin <base-branch>
     git rebase origin/<base-branch>
     ```

   **If starting a new branch for a new issue:**
   - Find the most recently opened PR targeting `<target-branch>`:
     ```
     gh pr list --base <target-branch> --state open --json headRefName,createdAt \
       --jq 'sort_by(.createdAt) | reverse | .[0].headRefName'
     ```
   - If a PR is returned, create the new branch from its HEAD:
     ```
     git fetch origin <headRefName>
     git checkout -b <new-branch> origin/<headRefName>
     ```
   - If no open PRs exist, branch from `origin/<target-branch>`:
     ```
     git fetch origin <target-branch>
     git checkout -b <new-branch> origin/<target-branch>
     ```
   - Record the upstream PR number (if any) to include in the new PR body.

3. Run `/implement` to build, test, and commit the work to the current branch.

4. Run `npm run fix` to auto-fix any lint/format issues, then stage and commit the changes if any were made:
   ```
   npm run fix
   git diff --quiet || (git add -A && git commit -m "chore: apply biome auto-fixes")
   ```
   If `npm run fix` exits with errors for issues it could not auto-fix (e.g. lint violations that require manual intervention), stop and resolve them before continuing.

5. Run `npm run ci` to verify the full CI pipeline passes locally:
   ```
   npm run ci
   ```
   If it fails, diagnose and fix the issues, then re-run until it passes. Commit any fixes before continuing.

6. Push the branch to origin:
   ```
   git push -u origin <branch>
   ```

7. Open a pull request with `gh pr create`, targeting `<target-branch>`. Use `Closes #N` in the body to link and auto-close the source issue. If this branch was stacked on another PR's branch, include a stacking note. Follow the PR body format below.

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

- The target branch is always inferred from the worktree directory name — never hardcoded.
- Infer the issue number from the conversation, the branch name, or recent commits (`git log --oneline -10`).
- Keep the PR title under 70 characters and match the issue title where possible.
- If no issue exists, omit the `Closes` line.
- Omit the "Stacked on" line if this PR is not stacked on another open PR.
- Merge order matters: stacked PRs must be merged into `<target-branch>` in order (oldest first).

---
name: ship
description: This skill should be used when the user wants to "implement and open a PR", "ship an issue", "implement and create a pull request", "build and ship", or wants to go from a PRD or GitHub issue all the way to an open pull request in one step.
disable-model-invocation: true
---

Implement the work, commit it, and open a pull request.

## Steps

1. Fetch the latest changes for the target branch (default: `main`) and rebase if the current branch is behind:
   ```
   git fetch origin <target-branch>
   git log --oneline HEAD..origin/<target-branch>
   ```
   If the current branch is behind, rebase before implementing:
   ```
   git rebase origin/<target-branch>
   ```

2. Run `/implement` to build, test, and commit the work to the current branch.

3. Run `bun run fix` to auto-fix any lint/format issues, then stage and commit the changes if any were made:
   ```
   bun run fix
   git diff --quiet || (git add -A && git commit -m "chore: apply biome auto-fixes")
   ```
   If `bun run fix` exits with errors for issues it could not auto-fix (e.g. lint violations that require manual intervention), stop and resolve them before continuing.

4. Run `bun run ci` to verify the full CI pipeline passes locally:
   ```
   bun run ci
   ```
   If it fails, diagnose and fix the issues, then re-run until it passes. Commit any fixes before continuing.

5. Push the branch to origin:
   ```
   git push -u origin <branch>
   ```

6. Open a pull request with `gh pr create`. Use `Closes #N` in the body to link and auto-close the source issue. Follow the PR body format below.

## PR body format

```
Closes #N

## Summary
- <bullet summarising what changed and why>

## Test plan
- [ ] <item>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## Notes

- Infer the issue number from the conversation, the branch name, or recent commits (`git log --oneline -10`).
- Keep the PR title under 70 characters and match the issue title where possible.
- If no issue exists, omit the `Closes` line.
- Infer the target branch from `gh pr view --json baseRefName` if a draft PR exists, or default to `main`. Never assume the target without checking.

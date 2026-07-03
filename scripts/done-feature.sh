#!/usr/bin/env bash
# Tear down an ephemeral feature worktree created by scripts/new-feature.sh.
# See docs/adr/0014-ephemeral-per-feature-worktrees.md.
#
# Usage: scripts/done-feature.sh <issue-number>
# Run from inside the "main" or "dev" worktree.
#
# Refuses to remove a worktree with uncommitted changes, or whose PR (if any)
# is still open. A branch with no PR at all is fine to remove.

set -euo pipefail

issue="${1:-}"

if [[ -z "$issue" ]]; then
	echo "Usage: scripts/done-feature.sh <issue-number>" >&2
	exit 1
fi

if ! [[ "$issue" =~ ^[0-9]+$ ]]; then
	echo "error: <issue-number> must be numeric, got '$issue'" >&2
	exit 1
fi

matches=()
current_path=""
while IFS= read -r line; do
	case "$line" in
	"worktree "*)
		current_path="${line#worktree }"
		;;
	"branch refs/heads/issue-${issue}-"*)
		branch_name="${line#branch refs/heads/}"
		matches+=("${current_path}|${branch_name}")
		;;
	esac
done < <(git worktree list --porcelain)

if [[ ${#matches[@]} -eq 0 ]]; then
	echo "error: no worktree found for issue #${issue}" >&2
	exit 1
fi

if [[ ${#matches[@]} -gt 1 ]]; then
	echo "error: multiple worktrees match issue #${issue}:" >&2
	printf '  %s\n' "${matches[@]}" >&2
	exit 1
fi

worktree_path="${matches[0]%%|*}"
branch="${matches[0]#*|}"

echo "Worktree: ${worktree_path}"
echo "Branch:   ${branch}"

if [[ -n "$(git -C "$worktree_path" status --porcelain)" ]]; then
	echo "error: ${worktree_path} has uncommitted changes; commit, stash, or discard them first" >&2
	exit 1
fi

pr_state="$(gh pr list --head "$branch" --state all --json state --jq '.[0].state' 2>/dev/null || true)"
pr_number="$(gh pr list --head "$branch" --state all --json number --jq '.[0].number' 2>/dev/null || true)"

if [[ -n "$pr_state" && "$pr_state" != "null" ]]; then
	if [[ "$pr_state" == "OPEN" ]]; then
		echo "error: PR #${pr_number} for ${branch} is still open; merge or close it first" >&2
		exit 1
	fi
	echo "PR #${pr_number} is ${pr_state}; proceeding with cleanup"
else
	echo "No PR found for ${branch}; proceeding with cleanup"
fi

git worktree remove "$worktree_path"
git branch -D "$branch"

if git ls-remote --exit-code --heads origin "$branch" >/dev/null 2>&1; then
	git push origin --delete "$branch"
	echo "Deleted remote branch ${branch}"
fi

echo "Done: ${worktree_path} and branch ${branch} removed"

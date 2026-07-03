#!/usr/bin/env bash
# Create an ephemeral, per-feature git worktree: new branch, copied/derived
# .env, installed dependencies. See docs/adr/0014-ephemeral-per-feature-worktrees.md.
#
# Usage: scripts/new-feature.sh <issue-number> <short-name>
# Run from inside the "main" or "dev" worktree — that worktree's directory
# name supplies the target branch this feature will eventually PR against.

set -euo pipefail

issue="${1:-}"
short_name="${2:-}"

if [[ -z "$issue" || -z "$short_name" ]]; then
	echo "Usage: scripts/new-feature.sh <issue-number> <short-name>" >&2
	exit 1
fi

if ! [[ "$issue" =~ ^[0-9]+$ ]]; then
	echo "error: <issue-number> must be numeric, got '$issue'" >&2
	exit 1
fi

if ! [[ "$short_name" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
	echo "error: <short-name> must be lowercase kebab-case, got '$short_name'" >&2
	exit 1
fi

repo_root="$(git rev-parse --show-toplevel)"
target_branch="$(basename "$repo_root")"
branch="issue-${issue}-${short_name}"
worktree_path="$(dirname "$repo_root")/${branch}"

if [[ -e "$worktree_path" ]]; then
	echo "error: $worktree_path already exists" >&2
	exit 1
fi

if git -C "$repo_root" show-ref --verify --quiet "refs/heads/${branch}"; then
	echo "error: branch ${branch} already exists" >&2
	exit 1
fi

echo "Target branch: ${target_branch}"

# Mirror ship's stacking logic: stack on the most recently opened PR
# targeting the target branch, if one is open; otherwise branch from the
# target branch's tip.
stacked_pr_number=""
stacked_head="$(gh pr list --base "$target_branch" --state open --json headRefName,createdAt \
	--jq 'sort_by(.createdAt) | reverse | .[0].headRefName' 2>/dev/null || true)"

if [[ -n "$stacked_head" && "$stacked_head" != "null" ]]; then
	stacked_pr_number="$(gh pr list --base "$target_branch" --state open --json number,createdAt \
		--jq 'sort_by(.createdAt) | reverse | .[0].number' 2>/dev/null || true)"
	echo "Stacking on open PR #${stacked_pr_number} (${stacked_head})"
	git -C "$repo_root" fetch origin "$stacked_head"
	base_ref="origin/${stacked_head}"
else
	echo "No open PR targets ${target_branch}; branching from origin/${target_branch}"
	git -C "$repo_root" fetch origin "$target_branch"
	base_ref="origin/${target_branch}"
fi

git -C "$repo_root" worktree add -b "$branch" "$worktree_path" "$base_ref"

# Derive deterministic, collision-free ports from the issue number so
# concurrent feature worktrees can run dev servers side by side.
port_offset=$((issue % 1000))
backend_port=$((3000 + port_offset))
frontend_port=$((5173 + port_offset))

if [[ -f "$repo_root/.env" ]]; then
	sed -E \
		-e "s|^PORT=.*|PORT=${backend_port}|" \
		-e "s|^VITE_API_BASE=.*|VITE_API_BASE=http://localhost:${backend_port}|" \
		-e "s|^CORS_ORIGIN=.*|CORS_ORIGIN=http://localhost:${frontend_port}|" \
		"$repo_root/.env" > "$worktree_path/.env"

	if grep -q '^VITE_PORT=' "$worktree_path/.env"; then
		sed -i.bak -E "s|^VITE_PORT=.*|VITE_PORT=${frontend_port}|" "$worktree_path/.env"
		rm -f "$worktree_path/.env.bak"
	else
		echo "VITE_PORT=${frontend_port}" >> "$worktree_path/.env"
	fi

	echo "Wrote .env (PORT=${backend_port}, VITE_PORT=${frontend_port})"
else
	echo "warning: no .env found at $repo_root/.env to copy" >&2
fi

# Persist stacking metadata in the worktree's own git dir (never in the
# working tree, so it can't be committed) for ship to pick up later.
worktree_git_dir="$(git -C "$worktree_path" rev-parse --git-dir)"
{
	echo "ISSUE=${issue}"
	echo "TARGET_BRANCH=${target_branch}"
	echo "STACKED_ON_PR=${stacked_pr_number}"
} > "$worktree_git_dir/new-feature-meta"

echo "Installing dependencies..."
(cd "$worktree_path" && npm install)

issue_title="$(gh issue view "$issue" --json title --jq '.title' 2>/dev/null || true)"

echo
echo "Ready: ${worktree_path}"
echo "Branch: ${branch} (base: ${base_ref})"
if [[ -n "$issue_title" ]]; then
	echo "Issue #${issue}: ${issue_title}"
fi
echo "Backend port: ${backend_port}  Frontend port: ${frontend_port}"

#!/usr/bin/env bash
# Fix the Codex worker's git remote/branch state on MacminiSirinx.
# Run ON THE MAC inside the clone (e.g. /Users/sirinx/SIRINXDev/sirinx-co):
#
#   ./scripts/fix-codex-remote.sh            # diagnose + fix
#   ./scripts/fix-codex-remote.sh --check    # diagnose only
#
# What it does (non-destructive; rebases, never force-pushes):
#   1. Ensure `origin` points at the canonical GitHub repo.
#   2. Fetch and show divergence between local and origin work branch.
#   3. Rebase local commits onto origin (duplicate doc-fix commits like
#      the A9/skill-count ones become empty and are dropped cleanly).
#   4. Set upstream tracking so plain `git push` works again.

set -euo pipefail

CANONICAL_URL="https://github.com/ton36475-lgtm/sirinx-co.git"
WORK_BRANCH="claude/rust-sirinx-monorepo-migration-mtxxmm"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
    echo "error: run this inside the sirinx-co clone" >&2
    exit 1
fi

current_url=$(git remote get-url origin 2>/dev/null || echo "<none>")
echo "origin url : $current_url"
echo "branch     : $(git branch --show-current)"

if [ "${1:-}" = "--check" ]; then
    git fetch origin "$WORK_BRANCH" 2>/dev/null || echo "fetch failed — check network/auth"
    echo "ahead/behind vs origin/$WORK_BRANCH:"
    git rev-list --left-right --count "origin/$WORK_BRANCH...HEAD" 2>/dev/null \
        || echo "  (branch not tracked yet)"
    exit 0
fi

if [ "$current_url" != "$CANONICAL_URL" ]; then
    if [ "$current_url" = "<none>" ]; then
        git remote add origin "$CANONICAL_URL"
        echo "added origin -> $CANONICAL_URL"
    else
        git remote set-url origin "$CANONICAL_URL"
        echo "fixed origin -> $CANONICAL_URL"
    fi
fi

git fetch origin "$WORK_BRANCH" main

if [ "$(git branch --show-current)" != "$WORK_BRANCH" ]; then
    git checkout "$WORK_BRANCH" 2>/dev/null || git checkout -b "$WORK_BRANCH" "origin/$WORK_BRANCH"
fi

echo "rebasing local commits onto origin/$WORK_BRANCH ..."
if git rebase "origin/$WORK_BRANCH"; then
    echo "rebase clean."
else
    echo
    echo "CONFLICT — resolve per file, prefer origin's MASTER_PLAN.md"
    echo "(it already contains the audit fixes), then: git rebase --continue"
    exit 1
fi

git branch --set-upstream-to="origin/$WORK_BRANCH" "$WORK_BRANCH"
echo
echo "done. verify with: git status -sb   then: git push"

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
    # Surface a wrong/old origin here too — this IS the "remote connect,
    # old service lost" symptom, and --check used to stay silent about it.
    if [ "$current_url" != "$CANONICAL_URL" ]; then
        echo "⚠️  origin does NOT match canonical:"
        echo "      expected: $CANONICAL_URL"
        echo "      actual:   $current_url"
        echo "    run without --check to reset it, then re-run --check."
    fi
    # Only trust ahead/behind if the fetch actually succeeded. Otherwise
    # a stale remote-tracking ref would report a bogus "0 0 in sync" and
    # mask the dead remote — the exact false-positive this fixes.
    if git fetch origin "$WORK_BRANCH" 2>/dev/null; then
        echo "ahead/behind (behind<TAB>ahead) vs origin/$WORK_BRANCH:"
        git rev-list --left-right --count "origin/$WORK_BRANCH...HEAD" 2>/dev/null \
            || echo "  (branch not tracked yet)"
    else
        echo "fetch failed — dead remote, network, or auth."
        echo "ahead/behind: UNKNOWN (ignore any cached value; the remote is unreachable)."
    fi
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

# Guard a dirty tree BEFORE rebasing. A worker running this repair mid-task
# usually has uncommitted changes; git rebase would then abort with
# "cannot rebase: You have unstaged changes" and the old code mislabeled
# that as a merge CONFLICT. Stop early with the correct instruction.
if [ -n "$(git status --porcelain)" ]; then
    echo
    echo "working tree is dirty — commit or stash before repairing the remote:"
    echo "    git stash -u        # set aside local edits"
    echo "    ./scripts/fix-codex-remote.sh"
    echo "    git stash pop       # bring them back after the rebase"
    exit 1
fi

echo "rebasing local commits onto origin/$WORK_BRANCH ..."
if git rebase "origin/$WORK_BRANCH"; then
    echo "rebase clean."
else
    echo
    echo "rebase hit a real merge CONFLICT — resolve per file, prefer origin's"
    echo "MASTER_PLAN.md (it already contains the audit fixes), then:"
    echo "    git rebase --continue"
    exit 1
fi

git branch --set-upstream-to="origin/$WORK_BRANCH" "$WORK_BRANCH"
echo
echo "done. verify with: git status -sb   then: git push"

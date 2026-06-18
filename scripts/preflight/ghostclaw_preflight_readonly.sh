#!/usr/bin/env bash
set -u

# Read-only preflight for GHOSTCLAW / SIRINXDev.
# This script prints local repo status and file presence only. It does not
# mutate files, start services, call APIs, or print secret values.

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 1

say() {
  printf '%s\n' "$*"
}

exists() {
  if [ -e "$1" ]; then
    say "present $1"
  else
    say "missing $1"
  fi
}

say "== Ghostclaw Read-Only Preflight =="
say "root: $ROOT"

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  say "branch: $(git branch --show-current 2>/dev/null || echo unknown)"
  say "-- git status --short --"
  git status --short
else
  say "git: not a git worktree"
fi

say "-- package manager markers --"
[ -f package.json ] && say "package.json: present"
[ -f pnpm-lock.yaml ] && say "pnpm: detected"
[ -f package-lock.json ] && say "npm lock: detected"
[ -f yarn.lock ] && say "yarn lock: detected"
[ -f pyproject.toml ] && say "python pyproject: detected"
[ -f requirements.txt ] && say "python requirements: detected"

say "-- governance files --"
exists AGENTS.md
exists PROJECT_STATE.md
exists NEXT_ACTIONS.md

say "-- docker compose markers --"
if find . -maxdepth 3 -type f \( -name 'docker-compose*.yml' -o -name 'docker-compose*.yaml' -o -name 'compose*.yml' -o -name 'compose*.yaml' \) \
  -not -path './.git/*' -not -path './node_modules/*' | head -1 | grep -q .; then
  find . -maxdepth 3 -type f \( -name 'docker-compose*.yml' -o -name 'docker-compose*.yaml' -o -name 'compose*.yml' -o -name 'compose*.yaml' \) \
    -not -path './.git/*' -not -path './node_modules/*' | sort
else
  say "docker compose: none detected within maxdepth 3"
fi

say "-- docs folders --"
for dir in docs docs/architecture docs/security docs/runbooks docs/memory docs/fusion docs/templates docs/external docs/approval; do
  exists "$dir"
done

say "done: read-only preflight complete"

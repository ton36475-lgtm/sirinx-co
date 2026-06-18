#!/usr/bin/env bash
set -u

# Approved-use-only external repo clone helper.
# It does not install dependencies, start services, copy external source into
# this monorepo, or write secrets. It should be run only after explicit approval.

DEST="${GHOSTCLAW_EXTERNAL_REPOS:-/Users/sirinx/SIRINXDev/_external_repos}"
REPORT_DIR="${GHOSTCLAW_EXTERNAL_REPORT_DIR:-/Users/sirinx/SIRINXDev/_external_repos/_reports}"
STAMP="$(date +%Y%m%d_%H%M%S)"
REPORT="$REPORT_DIR/external-repos-$STAMP.txt"

confirm() {
  printf 'This will clone/update external repositories under %s.\n' "$DEST"
  printf 'It will not install dependencies or start services.\n'
  printf 'Type APPROVE_EXTERNAL_CLONE to continue: '
  read -r answer
  [ "$answer" = "APPROVE_EXTERNAL_CLONE" ]
}

clone_or_fetch() {
  repo_url="$1"
  target="$2"
  branch_hint="$3"

  if [ -d "$target/.git" ]; then
    printf 'existing %s\n' "$target"
    git -C "$target" fetch --depth=1 origin "$branch_hint" >/dev/null 2>&1 || true
  else
    git clone --depth=1 --branch "$branch_hint" "$repo_url" "$target"
  fi

  {
    printf 'repo=%s\n' "$repo_url"
    printf 'path=%s\n' "$target"
    printf 'branch=%s\n' "$(git -C "$target" branch --show-current 2>/dev/null || echo unknown)"
    printf 'commit=%s\n' "$(git -C "$target" rev-parse HEAD 2>/dev/null || echo unknown)"
    printf '\n'
  } >>"$REPORT"
}

if ! confirm; then
  printf 'aborted: approval phrase not provided\n' >&2
  exit 2
fi

mkdir -p "$DEST" "$REPORT_DIR"
: >"$REPORT"

clone_or_fetch "https://github.com/DietrichGebert/ponytail.git" "$DEST/ponytail" "main"
clone_or_fetch "https://github.com/pewdiepie-archdaemon/odysseus.git" "$DEST/odysseus" "main"
clone_or_fetch "https://github.com/zai-org/GLM-5.git" "$DEST/GLM-5" "main"

printf 'external clone report: %s\n' "$REPORT"

#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob

APP_DIR="${APP_DIR:-/opt/sirinx}"
REPO_URL="${REPO_URL:-}"
REPO_BRANCH="${REPO_BRANCH:-main}"

echo "SIRINX server source sync"
echo "app_dir=$APP_DIR"
echo "repo_branch=$REPO_BRANCH"

if [ -z "$REPO_URL" ]; then
  echo "missing REPO_URL; set an approved canonical repo URL or use a source snapshot upload" >&2
  exit 1
fi

case "$APP_DIR" in
  ""|"/")
    echo "unsafe APP_DIR: $APP_DIR" >&2
    exit 1
    ;;
esac

mkdir -p "$(dirname "$APP_DIR")"

if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git fetch --all --prune
  git checkout "$REPO_BRANCH"
  git pull --ff-only origin "$REPO_BRANCH"
elif [ -d "$APP_DIR" ] && [ -n "$(ls -A "$APP_DIR" 2>/dev/null)" ]; then
  echo "existing non-git APP_DIR detected at $APP_DIR; move it aside or use the source snapshot flow instead of destructive replacement" >&2
  exit 1
else
  git clone --branch "$REPO_BRANCH" "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "source sync complete"
if [ -d .git ] && command -v git >/dev/null 2>&1; then
  git rev-parse HEAD
  git status --short
fi

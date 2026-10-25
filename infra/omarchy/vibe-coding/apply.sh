#!/usr/bin/env bash
# =============================================================================
# SIRINX OS — Omarchy (Quattro / v4) vibe-coding settings applier
#
# DRY RUN BY DEFAULT. Nothing is written until --apply is passed.
#
#   bash apply.sh                                  # preview every change
#   bash apply.sh --apply                          # write to $HOME
#   bash apply.sh --verify                         # check an applied install
#   bash apply.sh --rollback --apply                # restore the last run
#   bash apply.sh --apply --install-packages        # also add rustup + toolchain
#   bash apply.sh --apply --target-home=/tmp/h      # rehearsal against a sandbox
#
# Guarantees:
#   * refuses to write when the host is not Omarchy v4 (Lua config era) unless
#     --force-version=4 is given, so configs never land where they are inert;
#   * never overwrites a file without a timestamped backup in
#     ~/.local/state/sirinx-vibe/backup/<run>/;
#   * merges Hyprland bindings and ~/.bashrc through markers instead of
#     replacing them, so existing settings survive;
#   * writes no secrets: the env template holds placeholder names only;
#   * no network, no sudo, no repo mutation, no git/config/agent/tailnet change.
# =============================================================================
set -euo pipefail

BUNDLE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODES_APPLY=0
DO_VERIFY=0
DO_ROLLBACK=0
INSTALL_PACKAGES=0
FORCE_VERSION=""
TARGET_HOME="$HOME"

for arg in "$@"; do
  case "$arg" in
    --apply) MODES_APPLY=1 ;;
    --verify) DO_VERIFY=1 ;;
    --rollback) DO_ROLLBACK=1 ;;
    --install-packages) INSTALL_PACKAGES=1 ;;
    --force-version=*) FORCE_VERSION="${arg#*=}" ;;
    --target-home=*) TARGET_HOME="${arg#*=}" ;;
    -h|--help) sed -n '2,28p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) printf 'apply.sh: unknown argument %s (try --help)\n' "$arg" >&2; exit 2 ;;
  esac
done

TARGET_HOME="${TARGET_HOME%/}"
CONFIG_DIR="$TARGET_HOME/.config"
LOCAL_BIN="$TARGET_HOME/.local/bin"
STATE_DIR="$TARGET_HOME/.local/state/sirinx-vibe"
# Timestamp alone is not unique (two applies in one second would share a run
# directory and overwrite each other's backups), and rollback unwinds runs in
# reverse lexical order, so the name must sort chronologically. Timestamp plus a
# zero-padded sequence does both.
RUN_STAMP="$(date -u '+%Y%m%dT%H%M%SZ')"
RUN_SEQ=1
while [ -d "$STATE_DIR/backup/$RUN_STAMP-$(printf '%04d' "$RUN_SEQ")" ]; do
  RUN_SEQ=$((RUN_SEQ + 1))
done
RUN_DIR="$STATE_DIR/backup/$RUN_STAMP-$(printf '%04d' "$RUN_SEQ")"
JOURNAL="$RUN_DIR/journal.tsv"
DRY=1
[ "$MODES_APPLY" -eq 1 ] && DRY=0

log()  { printf '  %s\n' "$*"; }
step() { printf '\n== %s\n' "$*"; }
warn() { printf '  WARN %s\n' "$*"; }
die()  { printf 'apply.sh: %s\n' "$*" >&2; exit 2; }

have() { command -v "$1" >/dev/null 2>&1; }
sha()  { if have sha256sum; then sha256sum "$1" | cut -d' ' -f1; else shasum -a 256 "$1" | cut -d' ' -f1; fi; }
resolve() { printf '%s' "${1//%HOME%/$TARGET_HOME}" | sed "s|%CONFIG%|$CONFIG_DIR|g; s|%LOCALBIN%|$LOCAL_BIN|g"; }

# --- preflight --------------------------------------------------------------
detect_version() {
  if [ -f "$CONFIG_DIR/hypr/hyprland.lua" ]; then printf '4'
  elif [ -f "$CONFIG_DIR/hypr/hyprland.conf" ]; then printf '3'
  elif [ -d /usr/share/omarchy ]; then printf '4'
  else printf 'unknown'
  fi
}

preflight() {
  step "preflight"
  [ -d "$TARGET_HOME" ] || die "target home does not exist: $TARGET_HOME"
  if [ "$TARGET_HOME" = "$HOME" ] && [ "$(id -u)" -eq 0 ]; then
    die "run as your own user, not root; these are user dotfiles"
  fi

  local version
  version="$(detect_version)"
  if [ -n "$FORCE_VERSION" ]; then
    version="$FORCE_VERSION"
    log "version forced to $version"
  fi
  log "target home      : $TARGET_HOME"
  log "detected omarchy : $version"

  if [ "$version" != "4" ]; then
    if [ "$version" = "3" ]; then
      die "this bundle targets Omarchy Quattro (v4, Lua configs). This host has the v3 .conf layout; writing Lua there would be silently inert."
    fi
    die "cannot confirm Omarchy v4 (no ~/.config/hypr/hyprland.lua). Re-run with --force-version=4 once you have logged into the desktop."
  fi

  if [ "$TARGET_HOME" = "$HOME" ] && [ "$(uname -s)" != "Linux" ]; then
    die "real applies require the Omarchy Linux host; this is $(uname -s). Use --target-home=DIR to rehearse."
  fi
  if [ "$TARGET_HOME" = "$HOME" ] && ! have omarchy; then
    warn "omarchy CLI not on PATH; configs will still be written, menu/bindings take effect after relogin"
  fi
  if [ "$DO_VERIFY" -eq 1 ]; then log "mode             : VERIFY (read-only)"
  elif [ "$DO_ROLLBACK" -eq 1 ]; then log "mode             : ROLLBACK $([ "$DRY" -eq 1 ] && printf 'PREVIEW' || printf 'EXECUTE')"
  elif [ "$DRY" -eq 1 ]; then log "mode             : DRY RUN (nothing is written; pass --apply)"
  else log "mode             : APPLY"; fi
}

# --- state, backups, journal ------------------------------------------------
record() { # action target [backup]
  [ "$DRY" -eq 1 ] && return 0
  mkdir -p "$RUN_DIR/files"
  printf '%s\t%s\t%s\n' "$1" "$2" "${3:-}" >> "$JOURNAL"
}

backup_if_exists() { # target -> echoes backup path or empty
  local target=$1
  [ -e "$target" ] || return 0
  [ "$DRY" -eq 1 ] && return 0
  mkdir -p "$RUN_DIR/files"
  local backup
  backup="$RUN_DIR/files/$(printf '%s' "$target" | tr '/' '_')"
  cp -p "$target" "$backup"
  printf '%s' "$backup"
}

write_out() { # tmpfile target
  local tmp=$1 target=$2
  mkdir -p "$(dirname "$target")"
  cat "$tmp" > "$target"
  rm -f "$tmp"
}

# --- block items (merge into a user-owned file) -----------------------------
build_block() { # source comment out
  { printf '%s >>> sirinx-vibe >>>\n' "$2"; cat "$1"; printf '%s <<< sirinx-vibe <<<\n' "$2"; } > "$3"
}

install_block() { # id source comment targetPlaceholder
  local id=$1 source=$2 cs=$3 target action begin end tmp body backup
  target="$(resolve "$4")"
  begin="$cs >>> sirinx-vibe >>>"
  end="$cs <<< sirinx-vibe <<<"

  if [ ! -e "$target" ]; then action=create
  elif grep -qxF -e "$begin" -- "$target"; then action=merge
  else action=append
  fi

  if [ "$DRY" -eq 1 ]; then
    log "WOULD $action  $id -> $target"
    return 0
  fi

  tmp="$(mktemp "${TMPDIR:-/tmp}/sirinx-vibe.XXXXXX")"
  body="$(mktemp "${TMPDIR:-/tmp}/sirinx-vibe.XXXXXX")"
  cat "$source" > "$body"

  case "$action" in
    create)
      build_block "$body" "$cs" "$tmp"
      write_out "$tmp" "$target"
      record created "$target"
      log "created  $id -> $target"
      ;;
    merge)
      grep -qxF -e "$end" -- "$target" || die "start marker without end marker in $target; repair by hand"
      backup="$(backup_if_exists "$target")"
      awk -v b="$begin" -v e="$end" -v blk="$body" '
        $0==b { print b; while ((getline line < blk) > 0) print line; close(blk); skip=1; next }
        skip && $0==e { skip=0; print e; next }
        skip { next }
        { print }
      ' "$target" > "$tmp"
      write_out "$tmp" "$target"
      record replaced "$target" "$backup"
      log "updated  $id -> $target (block replaced, rest untouched)"
      ;;
    append)
      backup="$(backup_if_exists "$target")"
      cp "$target" "$tmp"
      {
        [ -s "$target" ] && printf '\n'
        printf '%s >>> sirinx-vibe >>>\n' "$cs"
        cat "$body"
        printf '%s <<< sirinx-vibe <<<\n' "$cs"
      } >> "$tmp"
      write_out "$tmp" "$target"
      record replaced "$target" "$backup"
      log "merged   $id -> $target (block appended)"
      ;;
  esac
  rm -f "$body"
}

install_owned() { # id source targetPlaceholder [mode] [refuse_unrelated]
  local id=$1 source=$2 target=$3 mode=${4:-644} refuse=${5:-0} backup
  target="$(resolve "$target")"

  if [ -e "$target" ] && [ "$(sha "$target")" = "$(sha "$source")" ]; then
    log "unchanged $id -> $target"
    return 0
  fi
  if [ -e "$target" ] && [ "$refuse" = "1" ] && ! grep -q -e '"sirinx"' -- "$target"; then
    log "SKIP     $id -> $target holds your own entries; merge the shipped file by hand:"
    log "         $source"
    return 0
  fi

  if [ "$DRY" -eq 1 ]; then
    if [ -e "$target" ]; then log "WOULD replace $id -> $target (backup first)"
    else log "WOULD create  $id -> $target"; fi
    return 0
  fi

  if [ -e "$target" ]; then
    backup="$(backup_if_exists "$target")"
    install -m "$mode" "$source" "$target"
    record replaced "$target" "$backup"
    log "replaced $id -> $target (backup kept)"
  else
    mkdir -p "$(dirname "$target")"
    install -m "$mode" "$source" "$target"
    record created "$target"
    log "created  $id -> $target"
  fi
}

# --- the bundle -------------------------------------------------------------
apply_items() {
  step "dotfiles"
  install_block bindings "$BUNDLE_DIR/dotfiles/hypr-bindings.lua" "--" "%CONFIG%/hypr/bindings.lua"
  install_block bashrc   "$BUNDLE_DIR/dotfiles/bashrc.sirinx.sh"  "#"  "%HOME%/.bashrc"
  install_owned menu     "$BUNDLE_DIR/dotfiles/omarchy-menu.jsonc" "%CONFIG%/omarchy/extensions/omarchy-menu.jsonc" 644 1
  install_owned mise     "$BUNDLE_DIR/dotfiles/mise-sirinx.toml"   "%CONFIG%/mise/conf.d/sirinx.toml" 644 0
  install_owned sirinx   "$BUNDLE_DIR/dotfiles/bin/sirinx"          "%LOCALBIN%/sirinx" 755 0
  install_owned env      "$BUNDLE_DIR/env/sirinx.env.example"       "%CONFIG%/sirinx/sirinx.env.example" 644 0
}

package_plan() {
  step "packages"
  log "Rust must come from rustup, not mise, so the repo's rust-toolchain.toml is honoured."
  log "would run: omarchy-pkg-add rustup"
  log "would run: rustup default stable && rustup component add rustfmt clippy"
  if [ "$INSTALL_PACKAGES" -eq 0 ]; then
    log "(pass --install-packages --apply to execute both)"
    return 0
  fi
  [ "$DRY" -eq 0 ] || die "--install-packages requires --apply"
  if have omarchy-pkg-add; then omarchy-pkg-add rustup
  elif have omarchy; then omarchy pkg add rustup
  else warn "no omarchy package helper found; skipping rustup install"; return 0; fi
  if have rustup; then
    rustup default stable
    rustup component add rustfmt clippy
  else
    warn "rustup still missing after package add; run it again in a new shell"
  fi
}

next_steps() {
  step "next steps (yours, not this script's)"
  log "1. mise install                     # fetch the pinned node 22 + pnpm 10.4.1"
  log "2. exec bash                        # pick up the new ~/.bashrc block"
  log "3. mkdir -p ~/.config/sirinx && install -m 600 ~/.config/sirinx/sirinx.env.example ~/.config/sirinx/sirinx.env"
  log "4. fill SIRINX_CONTROL_URL / tokens in that 600 file only"
  log "5. sirinx health                    # read-only confirmation"
  log "6. relogin (or Super+Alt+Space > Reload) so the menu rows and binds load"
  log "Deliberately NOT done here: tailnet join (MASTER_PLAN C6), agent logins,"
  log "git config, repo clone, pnpm install, any push or deploy."
}

# --- verify -----------------------------------------------------------------
verify_items() {
  local failures=0 version
  step "verify"
  version="$(detect_version)"
  log "omarchy layout   : $version"
  [ "$version" = "4" ] || warn "expected v4 (Lua) layout"

  check_owned() { # id source target
    local target; target="$(resolve "$3")"
    if [ ! -e "$target" ]; then printf '  FAIL %-10s missing %s\n' "$1" "$target"; failures=$((failures+1)); return; fi
    if [ "$(sha "$target")" = "$(sha "$2")" ]; then printf '  PASS %-10s %s\n' "$1" "$target"
    else printf '  FAIL %-10s differs from bundle: %s\n' "$1" "$target"; failures=$((failures+1)); fi
  }
  check_block() { # id target
    local target; target="$(resolve "$2")"
    if [ -e "$target" ] && grep -qxF -e "$3 >>> sirinx-vibe >>>" -- "$target"; then printf '  PASS %-10s block in %s\n' "$1" "$target"
    else printf '  FAIL %-10s no sirinx-vibe block in %s\n' "$1" "$target"; failures=$((failures+1)); fi
  }

  check_block bindings "%CONFIG%/hypr/bindings.lua" "--"
  check_block bashrc "%HOME%/.bashrc" "#"
  check_owned env "$BUNDLE_DIR/env/sirinx.env.example" "%CONFIG%/sirinx/sirinx.env.example"
  check_owned mise "$BUNDLE_DIR/dotfiles/mise-sirinx.toml" "%CONFIG%/mise/conf.d/sirinx.toml"
  check_owned sirinx "$BUNDLE_DIR/dotfiles/bin/sirinx" "%LOCALBIN%/sirinx"

  local menu
  menu="$(resolve "%CONFIG%/omarchy/extensions/omarchy-menu.jsonc")"
  if [ ! -e "$menu" ]; then printf '  FAIL %-10s missing %s\n' menu "$menu"; failures=$((failures+1))
  elif [ "$(sha "$menu")" = "$(sha "$BUNDLE_DIR/dotfiles/omarchy-menu.jsonc")" ]; then printf '  PASS %-10s %s\n' menu "$menu"
  else printf '  WARN %-10s kept for manual merge (your entries): %s\n' menu "$menu"; fi

  if [ -x "$LOCAL_BIN/sirinx" ] && bash -n "$LOCAL_BIN/sirinx"; then printf '  PASS %-10s bash -n\n' syntax
  else printf '  FAIL %-10s sirinx is not executable shell\n' syntax; failures=$((failures+1)); fi
  if [ -f "$TARGET_HOME/.bashrc" ] && bash -n "$TARGET_HOME/.bashrc"; then printf '  PASS %-10s bash -n ~/.bashrc\n' syntax
  else printf '  FAIL %-10s bash -n ~/.bashrc\n' syntax; failures=$((failures+1)); fi

  for tool in mise tmux lazygit; do
    if have "$tool"; then printf '  PASS %-10s %s on PATH\n' tool "$tool"
    else printf '  WARN %-10s %s not on PATH\n' tool "$tool"; fi
  done

  printf '\nverify: %s\n' "$([ "$failures" -eq 0 ] && printf 'ALL CHECKS PASS' || printf "$failures FAILURE(S)")"
  [ "$failures" -eq 0 ]
}

# --- rollback ---------------------------------------------------------------
rollback() { # unwinds every recorded run, newest first, so repeated applies fully revert
  step "rollback"
  [ -d "$STATE_DIR/backup" ] || die "no backups under $STATE_DIR/backup"
  local run found=0
  while IFS= read -r run; do
    [ -f "$run/journal.tsv" ] || continue
    found=1
    log "journal: $run/journal.tsv"
    awk '{ lines[NR]=$0 } END { for (i=NR; i>0; i--) print lines[i] }' "$run/journal.tsv" |
    while IFS="$(printf '\t')" read -r action target backup; do
      case "$action" in
        created)
          if [ "$DRY" -eq 1 ]; then log "WOULD remove  $target"
          else rm -f -- "$target"; log "removed  $target"; fi ;;
        replaced)
          [ -n "$backup" ] || { warn "no backup recorded for $target"; continue; }
          if [ "$DRY" -eq 1 ]; then log "WOULD restore $target from ${backup##*/}"
          else cp -p -- "$backup" "$target"; log "restored $target"; fi ;;
        *) warn "unknown journal action: $action" ;;
      esac
    done
    if [ "$DRY" -eq 0 ]; then
      mkdir -p "$STATE_DIR/rolled-back"
      mv "$run" "$STATE_DIR/rolled-back/$(basename "$run")"
    fi
  done < <(find "$STATE_DIR/backup" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort -r)
  [ "$found" -eq 1 ] || die "no journal found under $STATE_DIR/backup"
  [ "$DRY" -eq 1 ] && log "dry run: pass --apply to execute the rollback (${found} run journal(s) found)"
  log "note: empty directories created by an apply are left in place"
}

# --- main -------------------------------------------------------------------
preflight

if [ "$DO_ROLLBACK" -eq 1 ]; then
  rollback
  printf '\nSTOP POINT: ROLLBACK %s\n' "$([ "$DRY" -eq 1 ] && printf 'PREVIEWED' || printf 'EXECUTED')"
  exit 0
fi

if [ "$DO_VERIFY" -eq 1 ]; then
  if verify_items; then exit 0; else exit 1; fi
fi

apply_items
package_plan
[ "$DRY" -eq 1 ] || step "receipt"
[ "$DRY" -eq 1 ] || log "journal  $JOURNAL"
[ "$DRY" -eq 1 ] || log "backups  $RUN_DIR/files"
next_steps

printf '\nSTOP POINT: %s — zero network, zero sudo, zero secrets, zero repo/git/tailnet changes\n' \
  "$([ "$DRY" -eq 1 ] && printf 'DRY RUN, NOTHING WRITTEN' || printf 'DOTFILES APPLIED')"

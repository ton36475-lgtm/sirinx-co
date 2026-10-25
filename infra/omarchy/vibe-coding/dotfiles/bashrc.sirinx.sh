# shellcheck shell=bash
# SIRINX OS worker shell setup (Omarchy Quattro / v4).
# Installed as a marked block inside ~/.bashrc by
# infra/omarchy/vibe-coding/apply.sh. Omarchy never overwrites ~/.bashrc.
#
# No secrets live here. Real values belong in ~/.config/sirinx/sirinx.env
# (mode 600, outside the repo, never committed).

export SIRINX_REPO="${SIRINX_REPO:-$HOME/SIRINXDev/sirinx-co}"

case ":$PATH:" in
  *":$HOME/.local/bin:"*) ;;
  *) export PATH="$HOME/.local/bin:$PATH" ;;
esac

if [ -f "$HOME/.config/sirinx/sirinx.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$HOME/.config/sirinx/sirinx.env"
  set +a
fi

alias sx='sirinx'
alias sxh='sirinx health'
alias sxs='sirinx session'
alias sxc='sirinx check'
alias sxg='sirinx git'

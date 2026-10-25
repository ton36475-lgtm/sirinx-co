-- SIRINX OS vibe-coding bindings (Omarchy Quattro / v4).
-- These lines are installed into ~/.config/hypr/bindings.lua between the
-- sirinx-vibe markers, so they sit alongside Omarchy defaults and any
-- bindings you already have. Omarchy re-reads binds without a relogin.
--
-- Check for conflicts first:  omarchy menu keybindings --print
-- Remove this block to revert: apply.sh --rollback   (or delete by hand)

-- tmux dev session: repo | health | git
o.bind("SUPER + ALT + V", "SIRINX dev session", "omarchy-launch-terminal sirinx session")

-- bounded, read-only node status (repo, toolchain, tailnet, control API)
o.bind("SUPER + ALT + H", "SIRINX health", "omarchy-launch-terminal sirinx health")

-- lazygit on the monorepo
o.bind("SUPER + ALT + G", "SIRINX lazygit", "omarchy-launch-terminal sirinx git")

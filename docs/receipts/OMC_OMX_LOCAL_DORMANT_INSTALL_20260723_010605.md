# OMC + OMX Local Dormant Install Receipt

Status: `PASS`

Timestamp: `2026-07-23 01:06:05 +0700`

## Scope

- Project: `/Users/sirinx/SIRINXDev/sirinx-agent-native-os`
- Branch: `feat/sirinx-web-line-trust-v1`
- Frozen pre-install HEAD: `efaaccab8b02cc5979b51499f0683f1a847488a6`
- OMC: project-local installation only; disabled immediately; no reload or setup.
- OMX: CLI package only; no package scripts and no `omx setup` execution.

## License decision

- OMC `4.15.6`: MIT license text present upstream.
- OMX `0.20.3`: package metadata declares MIT, but the inspected tag and npm tarball do not contain a root license-text file.
- The human owner explicitly approved a bounded `QUARANTINE_EXCEPTION` for this OMX CLI-only local installation.
- The exception does not authorize vendoring OMX into the canonical source tree, redistribution, production deployment, automatic updates, or setup/config mutation.

## Installed state

### Oh My Claude Code

- Plugin ID: `oh-my-claudecode@omc`
- Version: `4.15.6`
- Marketplace ref: `v4.15.6`
- Marketplace commit: `fa1f5c50e47a62c38de24fec2a50a033b703f196`
- Scope: `local`
- Enabled: `false`
- Project metadata: `.claude/settings.local.json` (covered by the user's global Git ignore)
- `CLAUDE.md`, `.claude/CLAUDE.md`, and `.omc/`: absent

### Oh My Codex

- Package: `oh-my-codex@0.20.3`
- Registry integrity: `sha512-7wlSTA1Nc9c31WX9w8THYPwlaleWV1dk/0WXqRgxpph34EI4oJM+Z4Egv04Nn8wN2SLI9K2LMfeOpNKI+06LGg==`
- Install prefix: `/Users/sirinx/.local`
- CLI link: `/Users/sirinx/.local/bin/omx`
- Package scripts: disabled with `--ignore-scripts`
- `~/.codex/hooks.json` and `~/.codex/.omx/install-state.json`: absent
- Compiled CLI syntax check: passed

## Protected read-back

- `~/.codex/config.toml`: SHA-256 `2e5061454dd6493887a0b61c44d6fdf226797714a63c0abafb467587f24f10ce` (unchanged)
- `~/.codex/AGENTS.md`: SHA-256 `32aa6ef1dba86958a24d80dd5a492dc85bc4ec2393f7f72b73bf106006268868` (unchanged)
- `~/.claude/settings.json`: SHA-256 `4917c0b9d70fec7eb9dfab64f42963bb0025c692401ab42152bd42e114193575` (unchanged)
- Repository `.gitignore`: SHA-256 `9e81517a2dda8db151130594b5cd5b21b118348e33e6ff3239eb3679e4f898f4` (unchanged)

The pre-existing five dirty paths were preserved without modification by this installation. No Claude reload/restart, provider API call, MCP activation, Telegram send, Cloudflare mutation, Git commit, push, merge, or deploy occurred.

## Activation gates

Do not run any of the following without a new exact scoped approval and diff review:

- `claude plugin enable oh-my-claudecode@omc --scope local`
- `/reload-plugins`
- `/oh-my-claudecode:omc-setup --local`
- `omx setup`
- `omx doctor`
- OMX team, tmux, hook, MCP, or auto-update commands

## Targeted rollback

```bash
cd /Users/sirinx/SIRINXDev/sirinx-agent-native-os
claude plugin disable 'oh-my-claudecode@omc' --scope local
claude plugin uninstall 'oh-my-claudecode@omc' --scope local --keep-data
claude plugin marketplace remove omc --scope local

npm uninstall \
  --global \
  --prefix /Users/sirinx/.local \
  --ignore-scripts \
  --no-audit \
  --no-fund \
  oh-my-codex
```


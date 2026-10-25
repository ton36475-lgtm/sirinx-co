# Omarchy vibe-coding settings bundle

Settings for an **Omarchy Quattro (v4, Arch + Hyprland + Quickshell)** box that
works this monorepo as a SIRINX worker node: desktop bindings, menu rows, the
pinned JS toolchain, a worker helper CLI, and a secret-free env template.

Dry run by default. Nothing is written, downloaded, or sent until you say so.

```bash
bash infra/omarchy/vibe-coding/apply.sh              # preview every change
bash infra/omarchy/vibe-coding/apply.sh --apply      # write into $HOME
bash infra/omarchy/vibe-coding/apply.sh --verify     # check an applied install
bash infra/omarchy/vibe-coding/apply.sh --rollback --apply
```

## What it changes

| Item | Target | Mode |
| --- | --- | --- |
| Hyprland bindings | `~/.config/hypr/bindings.lua` | marked block, merged |
| Shell setup | `~/.bashrc` | marked block, merged |
| Menu rows | `~/.config/omarchy/extensions/omarchy-menu.jsonc` | owned file |
| Toolchain pins | `~/.config/mise/conf.d/sirinx.toml` | owned file |
| Helper CLI | `~/.local/bin/sirinx` | owned file, 0755 |
| Env template | `~/.config/sirinx/sirinx.env.example` | owned file, no values |

Bindings added: `Super+Alt+V` dev session, `Super+Alt+H` health, `Super+Alt+G`
lazygit. Menu: `Super+Space` → SIRINX → session / health / env / agent lanes /
lazygit / check / control-API probe.

`sirinx health` is read-only and bounded: repo state, toolchain versions,
tailnet state, one `curl --max-time 5` to `$SIRINX_CONTROL_URL/health`, agent
CLI presence, free disk. `sirinx env` prints `SET`/`unset` only, never a value.
`sirinx agents` lists the launchers Omarchy installs lazily (claude, codex,
opencode, hermes, agy, copilot, crush) plus whether their config directories
exist — presence only; it never opens a credential file.

Agent sign-in stays yours, on purpose: Omarchy ships the launchers and manages
them through mise, and this bundle neither authenticates nor copies sessions
between machines (`omarchy agent account copy` is the sanctioned path if you
want that).

## Why the version gate

Omarchy v4 moved the configs from `~/.config/hypr/*.conf` to `~/.config/hypr/*.lua`
and the user dotfiles from `~/.local/share/omarchy` to `/usr/share/omarchy`. Lua
bindings written onto a v3 box would be read by nobody, so `apply.sh` detects
`hyprland.lua` vs `hyprland.conf` and **refuses** rather than writing inert
config. Override only when you know better: `--force-version=4`.

## Safety rules it enforces

- Dry run unless `--apply`; refuses to run as root; refuses real applies off Linux.
- Every replaced file is copied to `~/.local/state/sirinx-vibe/backup/<run>/files/`
  and journalled. `--rollback` unwinds **every** recorded run, newest first, so
  three applies followed by one rollback still lands on your original files; runs
  it has undone move to `rolled-back/` and are never applied twice.
- `~/.bashrc` and `bindings.lua` are edited between `>>> sirinx-vibe >>>` markers,
  never replaced, so your existing settings and Omarchy defaults survive.
- An `omarchy-menu.jsonc` that already has your own entries is left alone and
  reported as `SKIP` — merge `dotfiles/omarchy-menu.jsonc` by hand.
- No secrets are written or read: the env template carries placeholder names
  only, and `.env`/`.env.*` stay forbidden by `AGENTS.md`.
- No sudo, no network, no repo mutation, no `git config`, no agent login, no
  tailnet change, no push, no deploy.

## Rust is rustup's job

`rust-toolchain.toml` pins `stable` + `rustfmt` + `clippy`, and only rustup
honours that file. Omarchy's Install > Development > Rust installs Rust through
mise, which bypasses it. So the package step is:

```bash
omarchy-pkg-add rustup
rustup default stable && rustup component add rustfmt clippy
```

`--apply --install-packages` runs both for you; otherwise they are printed only.

## Deliberate non-goals

Tailnet join stays in `infra/omarchy/omarchy_tailscale_join.sh` and is still an
open owner decision (`MASTER_PLAN` C6). This bundle does not clone the repo,
run `pnpm install`, log into an agent CLI, edit git config, or touch the control
plane. Nothing here is executed automatically on login.

## Rehearsing without an Omarchy machine

```bash
mkdir -p /tmp/sx-home/.config/hypr && touch /tmp/sx-home/.config/hypr/hyprland.lua
bash apply.sh --target-home=/tmp/sx-home --force-version=4                     # preview
bash apply.sh --target-home=/tmp/sx-home --force-version=4 --apply
bash apply.sh --target-home=/tmp/sx-home --force-version=4 --verify
bash apply.sh --target-home=/tmp/sx-home --force-version=4 --rollback --apply
```

## Reachability (measured 2026-10-23)

The tailnet now carries a peer named **`omarchy`** (100.87.189.34, linux, online,
relayed, 3 Tailscale SSH host keys), so the join half of `MASTER_PLAN` C6 is done
— but this bundle still cannot be applied from the Mac mini:

```
$ ssh sirinx@100.87.189.34 true
remote software version Tailscale
tailscale: tailnet policy does not permit you to SSH as user "sirinx"
```

`root` and `omarchy` get no session either, and the peer advertises no LAN
address, so there is no side door. Until the ACL grants an SSH user (or a key is
installed for a normal sshd), the host's Omarchy version stays **UNVERIFIED** and
nothing here has been applied to it.

## Verification run

| Check | Result |
| --- | --- |
| `bash -n` on `apply.sh`, `sirinx`, `bashrc.sirinx.sh` | rc 0 |
| `shellcheck -S warning` on all three | rc 0 |
| `luac -p dotfiles/hypr-bindings.lua` | rc 0 |
| `omarchy-menu.jsonc` parsed after comment strip | 8 rows, valid object |
| rehearsal: preview → apply → apply → verify | `ALL CHECKS PASS`, one marker block per file |
| rehearsal: rollback after three applies | `.bashrc` and `bindings.lua` byte-identical to pre-apply; all four created files removed |
| v3 host and undetectable host | refused, exit 2, nothing written |
| `sirinx env` with values set | printed `SET`, never a value |
| repo chain `fmt` / `clippy -D warnings` / `test` / `npm run check` / `control:test` | rc 0, 507/507 |

Nothing was applied to a real Omarchy host: there is still no route to one
(`MASTER_PLAN` C6/C7 open).

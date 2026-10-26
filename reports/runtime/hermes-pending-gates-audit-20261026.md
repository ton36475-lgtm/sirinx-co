# Hermes pending gates — measured audit (2026-10-26)

Status: `AUDIT / 1 OF 6 SATISFIED / 5 STILL GATED / 0 BYPASSED`

The Mac mini's Hermes work was handed over as a list of six pending gates. This
file separates what is **actually done** from what only looks done, using
commands run on this host today. Nothing here was installed, deployed, restarted
or approved on the strength of the list alone.

## Verdict table

| # | Gate | Measured state today | Verdict |
| --- | --- | --- | --- |
| 1 | npm upgrade 12.2.0 (Rule 7) | `npm -v` → **12.0.2**; `npm view npm version` → **12.2.1**; binary resolves to `~/.hermes/node/bin/npm`, i.e. Hermes' own pm store, not Homebrew | **NOT DONE** |
| 2 | llama server + scope + audit | `llama-server` exists (`/opt/homebrew/bin/llama-server`, brew `llama.cpp`) but **no process is running** and no `.gguf` >100 MB exists under `$HOME`. Port 8080 is held by `mlx_lm.server --model mlx-community/Qwen3-4B-4bit`, which `config.yaml` already declares as provider `mlx-local` (`http://127.0.0.1:8080/v1`), and `/v1/models` answers **200** | **PARTIAL — local inference already served by mlx-local; the llama.cpp server itself is not running and has no model** |
| 3 | approve ElevenLabs (provider + key) | `hermes status --full` → `ElevenLabs ✗ (not set)`; no `ELEVENLABS_*` env var; no `elevenlabs` entry in `~/.hermes/config.yaml` | **NOT DONE** |
| 4 | B2 deploy (VYCE + Modal + Confluent + OpenRouter rotation) | No deploy surface in this repo (`grep -ri 'vyce\|b2 deploy'` → 0 hits). VYCE exists only as kanban task `t_e50835d6` (`FUSION-R05`), status `ready`, diagnosed "Ready for 407.8h with no worker". Modal is still the placeholder line in `config.yaml` — "set real `.modal.run` URL before enabling". Confluent: no config anywhere. OpenRouter key is set (`sk-o…2a56`) but no rotation record exists | **NOT DONE — and the item is undefined in this repo; it is also a deploy, so it needs approval on its own** |
| 5 | approve webhook (`TELEGRAM_WEBHOOK_URL` + `SECRET`, gateway restart) | `hermes status --full` → `Telegram ✗ not configured (home: 5320654632)`; 0 `TELEGRAM_*` env vars. The gateway's live platforms are `api_server` + `webhook`, but that is Hermes' own dynamic-webhook platform, **not** the Telegram webhook | **NOT DONE** |
| 5b | approve sandbox (remote exec on `omarchy` 100.87.189.34 + scope + budget) | `hermes status --full` → `Terminal Backend: local`, `Sudo: enabled` (no remote backend configured). Peer `omarchy` is **offline, last seen 13 h ago**; its 3 Tailscale SSH host keys are still advertised | **BLOCKED — host is off; nothing to configure against** |

"Strix" (named in the handover) is **not installed**: `which strix` is empty and
no `strix` Python module resolves. It is an offensive-security tool, so it needs
an explicit target and an authorization statement before either an install or a
run is justified; a list entry alone is not that.

## What this session actually changed

| Change | Evidence |
| --- | --- |
| Cline CLI upgraded **3.0.72 → 3.0.73** on the Mac mini, in **both** global prefixes | There were two installs: `~/.local` (npm's configured `prefix -g`) and `/opt/homebrew`, and the Oct-16 `/opt/homebrew/bin/cline` was still 3.0.72. `npm install -g cline@3.0.73` updated `~/.local`; `npm install -g --prefix /opt/homebrew cline@3.0.73` brought the second one up. Now `/Users/sirinx/.local/bin/cline` → `3.0.73` (first on PATH) **and** `/opt/homebrew/bin/cline` → `3.0.73`; `cline --help` runs. npm's `allow-scripts` policy blocked the `postinstall` nudge helper in both cases, which the package already treats as optional (`|| true`) — the bin resolver is pure Node and works without it |
| Tailnet SSH policy half of **C6** confirmed live | `tailscale debug netmap` → 2 SSH rules, the **`accept` rule is first**, `holdAndDelegate` second (previously it was the only rule) |
| VM `vm-2-126-ubuntu` re-measured | `online=True`, **`sshHostKeys: 0`** (Tailscale SSH still off), OpenSSH banner `SSH-2.0-OpenSSH_9.6p1 Ubuntu`, all five local keys × three users denied, `ssh-agent` holds no identities, only TCP 22/443 open |

Not done, deliberately: no npm bump (Hermes' toolchain store is `hermes pm`'s to
move), no llama-server start (no model to serve), no provider keys written, no
gateway restart, no deploy, no remote-exec backend, no Strix install.

## The exact next command per gate

```bash
# 1 — npm, via the store's own tool rather than a raw global install
hermes pm lock --bump npm 12.2.1 && hermes pm install && hermes pm doctor

# 2 — only if llama.cpp (GGUF) is wanted on top of mlx-local; pick a model first
#     e.g. llama-server -m <model.gguf> --port 8081 --host 127.0.0.1
#     (8080 is taken by mlx_lm.server and must stay that way for provider mlx-local)

# 3 — key goes to the vault/`.env`, never the repo
hermes model          # add/provider ElevenLabs, key_env only

# 5 — needs the bot token + a public URL + a secret, then one restart
hermes gateway setup  # Telegram platform, webhook mode
hermes gateway restart && hermes gateway status

# 5b — after the host is powered on
ssh root@100.87.189.34 'tailscale status'   # ACL now accepts; host must be online
```

Gate 4 has no command yet: VYCE, Confluent and "B2" have no defined endpoint,
credential or target in this repository. It should be rewritten as a real
deploy packet (host, artifact, rollback) before it is approved, otherwise
approving it approves nothing.

## Verification

| Check | Result |
| --- | --- |
| `hermes status --full` | read; API keys, auth providers, platforms, gateway, backend captured above |
| `hermes pm status` | schema 1; only plugin artifacts (`homeassistant`, `spotify`) carry `update_available`, not npm |
| `tailscale status --json` | `VM-2-126-ubuntu online=True sshHostKeys=0`; `omarchy online=False sshHostKeys=3` |
| `cline --version` after upgrade | `3.0.73` from `~/.local/bin/cline` **and** from `/opt/homebrew/bin/cline`; `cline --help` prints usage |
| `npm run check` (repo) | exit 0 |

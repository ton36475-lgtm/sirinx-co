# Omarchy handoff — accelerated package + channel decision — 2026-10-20

Status: `PACKAGE_BUILT / DELIVERY_BLOCKED`
Goal as asked: move the AI work to Omarchy "fast", through the Hermes Telegram fusion community chat.
Truth: the package is ready and byte-verified; **neither channel can move it today**, for two
different reasons (target offline; the bot has no document-upload code path).

## 1. What actually has to move

| Set | Size | Decision |
| --- | --- | --- |
| `reports/` + `receipts/` + `exports/` (170 files) | 23.6 MB | **ship** — irreplaceable evidence |
| `cline-bot/` (28,560 files) | 368 MB | **do not ship** — reinstall from npm on the target |

Shipping node_modules over any chat channel is the slow path. Rebuilding is one command and
removes 94% of the payload: 392 MB / 28,560 files → 23.6 MB / 1 file.

The archive was rebuilt after this report was written so the payload contains its own plan:
170 files, 23,599,081 B.

## 2. Package (built, verified)

`node scripts/omarchy-handoff-package.mjs --date=2026-10-20`

```text
exports/omarchy-handoff/
  sirinx-ai-evidence-2026-10-20.tar.gz   23,599,081 B   sha256 0fb749d8f98eb65c6437523956b60124012285f26db1537946c3942b01b6fbe1
  SHA256SUMS
  MANIFEST.json
```

Checks run: `node --check` rc 0 · `shasum -a 256 -c SHA256SUMS` → `OK` · archive listing 170 entries
= manifest `files: 170` · single chunk (23.6 MB < the 45 MB cap), so no `split` path was exercised.

The script caps at `--max-mb` (default 45) and splits with `split -b` when an archive grows past the
Telegram Bot API 50 MB document ceiling, so a future larger payload stays sendable.

## 3. Channels

### A. Taildrop (preferred, actual data path)

```bash
tailscale file cp exports/omarchy-handoff/* omarchy-aiagent:
```

Blocked: `aiagent 100.67.78.88` is **offline, last seen 3d ago**; no `omarchy*` node exists in the
tailnet at all (see `omarchy-tailscale-onboard-20261020.md`). Taildrop also needs `tailscaled`
running inside WSL2 with Taildrop enabled — that is the pending A37/C6 join.

### B. Hermes Telegram fusion community chat (as requested)

Reality check on the code in this repo:

- `services/telegram-command-bot/src/sender.mjs:134` is the only Telegram call: `sendMessage`.
  There is **no `sendDocument`, no multipart/FormData** anywhere in the service, so a community-chat
  upload cannot be issued by the current bot at all — not a permission problem, a missing code path.
- `scripts/telegram-notify-preview.mjs` is text-only, and stays dry-run unless `--send`,
  `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, and `SIRINX_TELEGRAM_CONFIRM=SEND` are all present.
  This run: `mode: dry-run`, `tokenConfigured: false`, `chatIdConfigured: false` →
  `exports/telegram-preview-latest.json` holds the notice, nothing left the machine.
- `GO_LIVE_GATE` row `telegram_send` is still closed (C5), so even the notice needs an owner ticket.

So the fusion chat can carry the **notice + digest** today (once the gate opens) and can carry the
**file** only after a `sendDocument` path is implemented and gated. Adding that capability is a new
external-effect surface and was not implemented here.

## 4. Fastest order once the target is back

1. Join the tailnet inside Omarchy (A37 script) → `tailscale ping macminisirinx`.
2. `tailscale file cp exports/omarchy-handoff/* omarchy-aiagent:` (23.6 MB, one file).
3. On the target: `tar -xzf …` then `npm install -g @cline/cli@3.0.73 rea-agents@6.7.0 chrome-devtools-mcp@1.11.0`.
4. Verify: `shasum -a 256 -c SHA256SUMS` on the target, then `rea --version` = 6.7.0, `cline --version` = 3.0.73.

Fusion-chat fallback (only if a document path is added and `telegram_send` opens): upload the single
23.6 MB archive, target side verifies the same sha256.

## 5. Effects

No network call, no Telegram send, no Taildrop, no queue mutation, no clone, no deploy. The only
writes were `exports/omarchy-handoff/*` and `exports/telegram-preview-latest.json`.

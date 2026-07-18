# Telegram Control Plane

Status: dry-run only.

## Goal

Prepare Telegram as a mobile approval and status surface for SIRINX OS without sending real messages or creating real BotFather tokens during this phase.

## Bot Policy

Use BotFather manually or through a later confirmed Computer Use action. Creating a bot token is a persistent access credential and must not happen silently.

## Required Environment

```bash
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_OWNER_IDS=
SIRINX_TELEGRAM_CONFIRM=
```

## Gateway Config (Command Center)

Canonical, redacted config resolution lives in
`services/telegram-command-bot/src/config.mjs` and powers the bot scaffold.
Inspect the effective gateway config at any time (read-only, no secrets
printed — booleans and counts only):

```bash
npm run telegram:config
```

Mode reporting:

| Mode | Meaning |
| ---- | ------- |
| `dry-run` | One or more required env values missing; see `missing` list |
| `env-ready-gate-held` | All env values present, but the durable `telegram_send` gate (migration 0003) still holds |

`liveSendReady` stays `false` until the `telegram_send` gate is opened through
an `OPS-TG-…` ticket per `GO_LIVE_GATE_CHECKLIST.md`, even when the
environment is fully provisioned.

Config inputs:

| Env var | Purpose |
| ------- | ------- |
| `TELEGRAM_BOT_TOKEN` | BotFather token, provisioned outside the repo |
| `TELEGRAM_CHAT_ID` | Target chat for Command Center alerts |
| `TELEGRAM_OWNER_IDS` | Comma-separated owner allowlist |
| `TELEGRAM_ALLOWED_COMMANDS` | Comma-separated override; defaults to `/status,/gates,/sync-plan,/stop` |
| `SIRINX_TELEGRAM_CONFIRM` | Must be exactly `SEND` (with `--send`) for real sends |

Night Watch alert levels routed through this lane: `success`,
`success_warning`, `failure` (aligned with
`services/hermes-api` `classifyNightWatchCallback().telegramLevel`).

The GHOSTCLAW · Hermes V3 Command Center site itself stays read-only with no
outbound requests; the Telegram lane lives in
`services/telegram-command-bot` and `scripts/telegram-notify-preview.mjs`.

## Commands

Dry-run preview:

```bash
npm run telegram:preview
```

Dry-run bot capability view:

```bash
npm run telegram:bot:dry-run
```

Real send is disabled unless:

1. The user explicitly approves the next real send.
2. `TELEGRAM_BOT_TOKEN` is set outside the repo.
3. `TELEGRAM_CHAT_ID` is set outside the repo.
4. `SIRINX_TELEGRAM_CONFIRM=SEND`.
5. The script is run with `--send`.

## Allowed Commands

- `/status`
- `/gates`
- `/sync-plan`
- `/stop`

## Blocked Commands

- deploy
- push
- Cloudflare mutation
- production DB write
- customer send
- paid API
- direct shell
- raw filesystem mirror

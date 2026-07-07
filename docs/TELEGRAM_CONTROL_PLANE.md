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

# Hermes agent in Telegram — recheck (2026-10-23)

Status: `LIVE / POLLING / INBOUND_TRAFFIC_TODAY / NO_MESSAGE_SENT_BY_THIS_PASS`

Question: can the Hermes agent run in Telegram on this host? Measured answer:
**yes, and it is running** — including the messages that produced this task.

## 1. Bot identity and transport

The token is present in both env files (46 chars; the value was never printed):

| File | `TELEGRAM_BOT_TOKEN` |
| --- | --- |
| `~/.hermes/.env` | present |
| `~/.hermes/profiles/solis/.env` | present |

One bounded `getMe`:

```
ok: True   id: 8719485384   username: MultiAgentAiCompany_bot   name: AI Company
```

One bounded `getWebhookInfo`: `url: ''`, `pending_update_count: 0`, no
`last_error_message` — i.e. long-polling, no webhook, no backlog. Delivery is
long-polling (`TELEGRAM_ALLOWED_USERS` and `TELEGRAM_HOME_CHANNEL` are set).

## 2. Runtime state after the 0.22.5 update (A49)

`~/.hermes/logs/gateway.log`:

```
2026-10-23 21:37:50  [Telegram] Telegram polling confirmed healthy: getUpdates progressing
2026-10-23 21:37:50  [Telegram] Connected to Telegram (polling mode)
2026-10-23 21:37:50  gateway.run: ✓ telegram connected
```

Inbound messages are being processed today, i.e. **after** the update restart:

| Time | Chat | First words |
| --- | --- | --- |
| 20:26:17 | 5320654632 | `Vibe coding to reconfig her…` |
| 21:18:10 | 5320654632 | `Approve` |
| **22:21:33** | 5320654632 | `ตรวจทุกๆระบบการทำงาน` |

The 22:21 message is the strongest evidence: it arrived well after the 21:41
restart and the gateway routed it to the agent, so the round trip works on the
new version, not just on the pre-update one. (A 2026-10-17 group round trip —
inbound question, 2059-char reply to `-1004337494357` — is the older proof.)

## 3. Profile matrix

| Config | `telegram` |
| --- | --- |
| `~/.hermes/config.yaml` (default profile) | `enabled: true`, api_server :8642 |
| `~/.hermes/profiles/solis/config.yaml` | `enabled: false` (delivery routes pre-wired: agent_response / approvals / errors → telegram) |

The multiplexer re-scanned 15 profiles with `0 adapter(s) connected` each, so the
**default profile** owns the single Telegram adapter. Only one poller exists —
no duplicate-`getUpdates` conflict.

## 4. The status/CLI discrepancy (cosmetic, not a fault)

`hermes status --full` prints `Telegram ✗ not configured (home: 5320654632)`
even though the gateway is connected. Cause: the status command evaluates the
`solis` profile (where telegram is disabled), while the adapter lives in the
default profile. Treat the gateway log, not this row, as runtime truth.

## 5. Transport noise (self-healing)

```
[Telegram] Sticky Telegram path 149.154.166.110 failed; re-walking IPv4 literals
[Telegram] Telegram API transport recovered via api.telegram.org
```

Repeats roughly every 12 minutes and recovers each time — a path-selection
warning, not an auth or token failure.

## 6. What this pass did not do

No message was sent (the `telegram_send` gate stays closed and nothing needed
sending). No config change, no secret printed, no restart, no token rotation.
If the lane ever needs re-proving end to end, send one DM to
`@MultiAgentAiCompany_bot` and watch for the `inbound message: platform=telegram`
line plus a `response ready: platform=telegram`.

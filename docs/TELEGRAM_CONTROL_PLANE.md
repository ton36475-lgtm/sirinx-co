# Telegram Control Plane

Status: implemented locally; live activation remains operator-gated.

## Goal

Provide Telegram as a mobile approval and alert surface without letting a
static config flag, an unauthenticated HTTP request, or an in-memory gate
create a real send.

## Runtime boundaries

| Service | Default | Responsibility |
| --- | ---: | --- |
| `sirinx-control` | `127.0.0.1:8711` | Bearer-protected, Postgres-backed gate authority |
| Node dev-control long-tail | `127.0.0.1:8790` | CenterBrain, A2A plans, truthful OmniRoute evidence |
| Telegram command bot | `127.0.0.1:8791` | Fixed-destination `/send` boundary and dry-run webhook inspection |
| Hermes A2A | `127.0.0.1:9000` | Read-only health, agent-card, and knowledge evidence |

The mutable fallback in `services/telegram-command-bot/src/config.mjs` is
always held and is never live authority. A live attempt re-reads
`sirinx-control /api/gates` immediately before the Telegram provider call.
That response must prove all of the following:

- exactly one `telegram_send` gate is `open`;
- its ticket matches `OPS-TG-…`;
- `persistence.backend` is `postgres` and `persistence.durable` is `true`;
- the persistence observation and gate read are fresh;
- every required environment value is present.

Missing, stale, malformed, memory-backed, or contradictory evidence resolves
to effective `hold`.

## Required environment

Provision values in the host secret store, never in the repo or Obsidian:

```bash
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_OWNER_IDS=
SIRINX_TELEGRAM_CONFIRM=SEND
CONTROL_API_TOKEN=
DATABASE_URL=
SIRINX_CONTROL_URL=http://127.0.0.1:8711
```

Optional listener configuration:

```bash
DEV_CONTROL_API_PORT=8790
TELEGRAM_BOT_PORT=8791
TELEGRAM_ALLOWED_ORIGINS=http://localhost:8710
```

`TELEGRAM_CHAT_ID` is the only outbound destination. `/send` rejects
`chatId`, `chat_id`, `destination`, or `to` supplied by a caller.
`TELEGRAM_OWNER_IDS` is the inbound-owner allowlist; it is not a substitute
for Bearer authorization on live sends.

## Read-only checks

```bash
npm run telegram:preflight
npm run telegram:config
npm run telegram:bot:dry-run
npm run telegram:preview
curl -sS http://127.0.0.1:8711/ready
curl -sS http://127.0.0.1:8791/status
curl -sS http://127.0.0.1:8790/api/a2a-sync
curl -sS 'http://127.0.0.1:8790/api/omniroute?probeHermes=true'
```

`telegram:preflight` is GET-only and prints environment presence booleans,
exact service identities, and stable HOLD blockers. It never reads `.env`,
starts or stops a process, changes a gate, or calls Telegram. Rust `/health`
is liveness only; `/ready` separately requires configured auth, a successful
Store refresh, and declared durable Postgres persistence.

Mode reporting:

| Mode | Meaning |
| --- | --- |
| `dry-run` | One or more Telegram environment requirements are missing |
| `env-ready-gate-unavailable` | Env is ready, but authenticated durable evidence is unavailable |
| `env-ready-gate-held` | Durable authority was read and the effective gate remains held |
| `live-ready` | Env and fresh Postgres-backed OPS-TG evidence are ready; no send has occurred |

`live-ready` is capability evidence, not a delivery receipt.

## Local stack manager

The local lifecycle wrapper manages only the exact `8711` Rust authority,
`8790` Node long-tail API, and `8791` Telegram gateway topology:

```bash
npm run telegram:stack -- preflight
npm run telegram:stack -- start
npm run telegram:stack -- status
npm run telegram:stack -- stop
```

`start` inherits the already-provisioned process environment; it never loads
`.env`. Admission requires boolean-only environment readiness, `cargo`,
`node`, `lsof`, `ps`, and the local `shlock` primitive, and proves that all
three required loopback ports are free.
After spawn, health identity is not enough: the manager also verifies the
listener belongs to the detached child process group. Runtime ownership state
is mode-restricted under `.runtime/telegram-stack/` and records only PIDs,
ports, command signatures, and process-start fingerprints. `stop` signals a
tracked process group only when those ownership checks still match, waits for
the whole group to exit, and never kills an unvalidated or merely
port-occupying process. A validated dead-owner lock can be reclaimed; an
invalid or live lock fails closed. If a leader disappears while its process
group survives, state is retained for inspection and no unvalidated signal is
sent. A partial start that never captured a process fingerprint likewise
returns explicitly labeled `unresolvedSpawnPids` instead of treating the PID
as safe to stop later.

The manager itself performs no Telegram send, provider call, gate decision, or
schema migration. `PostgresStore::connect` is connect-only; all database
migrations are a separate ticketed release step through the explicit
one-connection migrator. Stack-start receipts must report
`managerDirectExternalWrites:false` and `childMigrationWritesPossible:false`.
They still do not prove the child made no ordinary durable reads or writes
after startup.

## Operator-controlled live sequence

Only the human operator issues the gate decision after reviewing the
`OPS-TG-…` ticket and the exact message. Do not edit `config.mjs` to open it.

1. Verify the Rust authority reports Postgres persistence:

   ```bash
   npm run telegram:preflight
   curl --fail -sS http://127.0.0.1:8711/api/gates \
     -H "Authorization: Bearer $CONTROL_API_TOKEN"
   ```

2. Open the durable gate with the reviewed ticket:

   ```bash
   curl --fail -sS -X POST \
     http://127.0.0.1:8711/api/gates/telegram_send/decision \
     -H "Authorization: Bearer $CONTROL_API_TOKEN" \
     -H "content-type: application/json" \
     -d '{"state":"open","ticket":"OPS-TG-REPLACE-WITH-REVIEWED-TICKET"}'
   ```

3. Send exactly one approved, replay-safe request. Both live endpoints require
   Bearer auth and a unique `Idempotency-Key`:

   ```bash
   curl --fail-with-body -sS -X POST http://127.0.0.1:8791/send \
     -H "Authorization: Bearer $CONTROL_API_TOKEN" \
     -H "Idempotency-Key: OPS-TG-REPLACE-send-001" \
     -H "content-type: application/json" \
     -d '{"text":"hello","dryRun":false}'
   ```

   Or route an approved A2A alert:

   ```bash
   curl --fail-with-body -sS -X POST \
     http://127.0.0.1:8790/api/a2a-sync/plan \
     -H "Authorization: Bearer $CONTROL_API_TOKEN" \
     -H "Idempotency-Key: OPS-TG-REPLACE-a2a-001" \
     -H "content-type: application/json" \
     -d '{"messageType":"alert","dryRun":false}'
   ```

   Only `alert` and `approval_request` A2A types route to Telegram. Omitting
   `dryRun:false` remains a no-provider dry run.

4. Accept delivery only when the receipt has `sent:true`,
   `providerCalled:true`, Telegram HTTP success, and Telegram body `ok:true`.
   A timeout or ambiguous provider result is `externalWriteOutcome:"unknown"`;
   do not retry under a new idempotency key until reconciled.

   Current replay caches are process-local and expire after a bounded TTL;
   `/send` and `/api/a2a-sync/plan` do not yet share a durable delivery ledger.
   Until that ledger exists, do not submit the same logical message through
   both endpoints and do not restart either process while reconciling an
   ambiguous outcome.

5. Re-hold immediately after the approved send:

   ```bash
   curl --fail -sS -X POST \
     http://127.0.0.1:8711/api/gates/telegram_send/decision \
     -H "Authorization: Bearer $CONTROL_API_TOKEN" \
     -H "content-type: application/json" \
     -d '{"state":"hold"}'
   ```

## Allowed inbound commands

- `/status`
- `/gates`
- `/sync-plan`
- `/stop`

Webhook inspection remains dry-run only; it executes no command and sends no
reply. Deploy, push, Cloudflare mutation, production writes, customer sends,
paid APIs, direct shell, agent auto-start, cmux creation, and MCP execution
remain outside this gateway.

## Agent handshake truth

The A2A registry currently contains 15 unique identities and OmniRoute has 10
configured lanes with 23 static routes. Claude Cowork and Kimi Code are
separate identities. Installed/running app or CLI evidence is reported as
`runtime-surface-observed-handshake-unverified`; it becomes identity evidence
only when an explicit handshake receipt is supplied. Kimi Code advertises ACP
over stdio, which is not reported as MCP. OpenCode has one bounded write
receipt at `reports/runtime/opencode-handshake-20260720-001/HANDSHAKE.json`;
that proves the one job, not a persistent route or Telegram delivery.

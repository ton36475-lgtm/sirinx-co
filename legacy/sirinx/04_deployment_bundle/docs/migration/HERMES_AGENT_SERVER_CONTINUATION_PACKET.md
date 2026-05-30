# SIRINX Hermes Agent Server Continuation Packet

## Purpose

Give Hermes Agent on this workstation a deterministic, governed sequence for pushing the current SIRINX state to the server team without skipping review, source delivery, or server-side bootstrap.

This packet does not authorize live cutover. It prepares the exact steps Hermes must continue once:

- reviewed artifacts are ready
- the receiving side is reachable
- the approved runtime source payload is available on the target host

## Hermes Execution Contract

Hermes may:

- run the governed review flow
- build the reviewed handoff bundle
- build a governed source snapshot
- upload reviewed artifacts and the approved source payload
- continue with server-side source sync or receiver install after approved connection exists
- stage Hermes brain-skill runtime and starter packets on the target host
- collect DB readiness evidence through the Database Steward lane

Hermes must not:

- change DNS
- install TLS blindly
- reload a live reverse proxy without approval
- inject production secrets from chat
- declare deployment complete if the target host has only the review bundle and not the runtime source

## Local Commands Hermes Must Run First

From the canonical repo root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\infra\scripts\full-system-review.ps1
```

Expected outputs:

- `artifacts/review/<timestamp>/SIRINX_FULL_SYSTEM_REVIEW.json`
- `artifacts/review/<timestamp>/SIRINX_FULL_SYSTEM_REVIEW.md`
- `artifacts/validation/SIRINX_MULTI_AGENT_VALIDATION_<timestamp>.json`
- `artifacts/live-handoff/SIRINX_MULTI_AGENT_HANDOFF_<timestamp>.zip`
- `artifacts/source-snapshots/SIRINX_SOURCE_SNAPSHOT_<timestamp>.zip`

If Hermes needs to refresh only the runtime source payload without rerunning the full review, it may run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\infra\scripts\build-source-snapshot.ps1
```

## Delivery Modes

### Mode A - Approved Git Source On Server

Use this if the target server is allowed to pull the canonical repo directly.

Server-side command:

```bash
APP_DIR=/opt/sirinx \
REPO_URL=<approved_git_url> \
REPO_BRANCH=main \
bash infra/scripts/server-source-sync.sh
```

### Mode B - Approved Source Snapshot Upload

Use this if the target host must receive files from this workstation instead of pulling Git directly.

Upload both:

- latest reviewed handoff zip
- latest source snapshot zip

Example transfer pattern once SSH is approved:

```bash
scp SIRINX_MULTI_AGENT_HANDOFF_<stamp>.zip <user>@<host>:/tmp/
scp SIRINX_SOURCE_SNAPSHOT_<stamp>.zip <user>@<host>:/tmp/
```

Then on the server:

```bash
mkdir -p /opt/sirinx
cd /opt/sirinx
unzip /tmp/SIRINX_SOURCE_SNAPSHOT_<stamp>.zip
mkdir -p /opt/sirinx-handoff
cd /opt/sirinx-handoff
unzip /tmp/SIRINX_MULTI_AGENT_HANDOFF_<stamp>.zip
```

The runtime source lives in `/opt/sirinx`. The reviewed handoff packet lives in `/opt/sirinx-handoff`.

## Receiver Bootstrap Command

Once the full runtime source is present on the target host:

```bash
cd /opt/sirinx
bash infra/scripts/server-receiver-install.sh
```

This will:

- create `.env` from `.env.example` if missing
- create server-local secret placeholders if missing
- render a reverse-proxy config from approved host variables
- validate `docker compose config`
- optionally stage the public runtime locally on the server
- stage Hermes brain-skill runtime and mentor/apprentice starter packets

## Hermes Brain Skill and Database Bootstrap

Receiver install now also prepares the controlled specialist-lane runtime. Hermes may run these commands explicitly when it needs refreshed evidence:

```bash
cd /opt/sirinx
bash infra/scripts/hermes-brain-bootstrap.sh
bash infra/scripts/db-ops-preflight.sh
```

Optional DB evidence collection through the bootstrap wrapper:

```bash
cd /opt/sirinx
SIRINX_STAGE_DATABASE=1 bash infra/scripts/hermes-brain-bootstrap.sh
```

Expected outputs:

- `runtime/hermes/brain-skills`
- `runtime/hermes/agent-packets/db/DATABASE_STEWARD_STARTER.json`
- `runtime/hermes/agent-packets/mentor/HERMES_MENTOR_STARTER.json`
- `runtime/hermes/agent-packets/apprentice/JUNIOR_AGENT_FIRST_TASKS.json`
- `artifacts/hermes-bootstrap/<timestamp>/`
- `artifacts/db-preflight/<timestamp>/`

## Approved Host Override Flow

The canonical public example remains `sirinx.co`, but the receiver flow supports an approved host override at install time.

If the approved public FQDN for this rollout is `www.sirin.co`, Hermes or the server operator may run:

```bash
cd /opt/sirinx
PUBLIC_PRIMARY_HOST=www.sirin.co \
PUBLIC_SERVER_ALIASES="sirin.co" \
TLS_CERT_BASENAME=sirin.co \
bash infra/scripts/server-receiver-install.sh
```

If the approved public FQDN remains the canonical example:

```bash
cd /opt/sirinx
PUBLIC_PRIMARY_HOST=sirinx.co \
PUBLIC_SERVER_ALIASES="www.sirinx.co" \
TLS_CERT_BASENAME=sirinx.co \
bash infra/scripts/server-receiver-install.sh
```

Do not guess hostnames. Use only the FQDNs approved by the domain owner and server team.

## Immediate Backend Staging

To stage the public app locally on the target server without DNS cutover:

```bash
cd /opt/sirinx
SIRINX_STAGE_PUBLIC=1 bash infra/scripts/server-receiver-install.sh
```

This stages:

- `sirinx-redis`
- `sirinx-public`

Then validate:

```bash
bash infra/scripts/server-cutover-smoke.sh http://127.0.0.1:3000/
```

Automation services remain gated until PostgreSQL/pgvector approval and secret review are complete.

## Required Review Before Claiming Completion

Hermes must confirm:

- target host has the full runtime source, not only the review bundle
- `server-preflight.sh` passes
- a rendered reverse-proxy config exists in the generated nginx output folder
- local server smoke passes on `http://127.0.0.1:3000/`
- Hermes brain bootstrap has produced starter packets for Mentor and Apprentice lanes
- DB preflight evidence exists before any database staging claim is made
- no DNS/TLS/reverse-proxy reload happened without approval

## Rollback Note

If local server staging fails, stop the staged containers and keep the route unchanged:

```bash
cd /opt/sirinx
docker compose -f docker-compose.yml stop sirinx-public sirinx-redis
```

## Audit Trail Note

Hermes must preserve:

- review JSON
- validation JSON
- reviewed handoff zip checksum
- source snapshot checksum
- server preflight output
- receiver install summary log
- local target smoke output

# Hermes Database and Brain Skill Setup Runbook

## Purpose

Give Hermes Agent and the receiving server operator a deterministic sequence for:

- staging Hermes runtime support
- preparing PostgreSQL and pgvector readiness evidence
- creating brain-skill directories
- creating mentor and apprentice packets

This runbook does not authorize live cutover, DNS changes, TLS installation, or destructive database changes.

## Preconditions

- approved runtime source is present on the target host
- reviewed handoff bundle is available for reference
- server operator has approved shell access
- `docker compose config` succeeds locally on the target host

## Step 1 - Prepare Source And Review Packet

On the workstation:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\infra\scripts\full-system-review.ps1
```

Deliver both:

- reviewed handoff zip
- source snapshot zip or approved Git source

## Step 2 - Receiver Bootstrap

On the target host:

```bash
cd /opt/sirinx
bash infra/scripts/server-receiver-install.sh
```

This renders reverse-proxy config, creates local `.env` if missing, stages secret placeholders, and triggers Hermes brain bootstrap.

## Step 3 - Hermes Brain Bootstrap

The receiver flow calls:

```bash
bash infra/scripts/hermes-brain-bootstrap.sh
```

Expected outputs:

- `runtime/hermes/brain-skills`
- `runtime/hermes/agent-packets/db`
- `runtime/hermes/agent-packets/mentor`
- `runtime/hermes/agent-packets/apprentice`
- `artifacts/hermes-bootstrap/<timestamp>/`

## Step 4 - Database Preflight

To gather DB readiness evidence without live migration:

```bash
cd /opt/sirinx
bash infra/scripts/db-ops-preflight.sh
```

Optional explicit staging flags:

```bash
SIRINX_STAGE_DATABASE=1 bash infra/scripts/hermes-brain-bootstrap.sh
```

## Step 5 - Junior Agent Enablement

Junior agents may continue only after a mentor packet exists. First tasks should be limited to:

- path existence checks
- contract validation
- bundle refresh
- compose dry validation
- DB preflight evidence collection

They must not execute:

- live reverse-proxy changes
- secrets injection
- production DB migration
- DNS/TLS cutover

## Rollback Note

If DB preflight or brain bootstrap fails, stop staged automation services, keep `sirinx-public` local only, and preserve artifacts for Validator review.

## Audit Trail Note

Save:

- `artifacts/hermes-bootstrap/<timestamp>/`
- DB preflight output
- source snapshot checksum
- reviewed handoff checksum
- validator output
- operator and approver identity

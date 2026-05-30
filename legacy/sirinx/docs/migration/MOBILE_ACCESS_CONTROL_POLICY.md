# Mobile Access Control Policy

## Purpose

Define safe mobile control for SIRINX operations without exposing raw shell, direct database access, or automation admin surfaces.

## Default Mode

Mobile access is read-only by default.

Allowed mobile capabilities:

- health status
- approval queue
- queue and DLQ visibility
- CRM triage
- post-deploy checks
- read-only telemetry
- Omniscient Dashboard live activity feed
- Solis EMS / LISINER freshness cards
- incident acknowledgement

Blocked mobile capabilities:

- raw shell
- direct DB/Redis access
- n8n admin exposure
- production secret viewing
- DNS/TLS changes
- remote hardware control
- deployment cutover without approval packet

## Authentication

- SSO required.
- MFA required.
- Privileged actions require approval packet and audit log.
- Device loss must trigger session revocation.

## Audit Trail Note

Log actor, device/session, action, approval id, timestamp, and rollback target.

## Rollback Note

If mobile access exposes privileged control, disable the mobile route, revoke sessions, rotate affected credentials, and restore read-only mode.

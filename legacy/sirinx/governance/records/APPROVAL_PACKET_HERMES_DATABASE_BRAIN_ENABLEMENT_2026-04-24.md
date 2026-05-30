# Approval Packet - Hermes Database and Brain Enablement

## Status

`Draft - Human Approval Required`

## Change Summary

This packet covers governed enablement of:

- Database Steward specialist lane
- Mentor and Apprentice starter-packet flow
- Hermes server-side brain-skill bootstrap
- DB preflight evidence generation

## Scope

- contracts
- prompts
- internal runbooks
- server bootstrap scripts
- bundle manifest updates

## Risks

- specialist lanes could be mistaken for broader autonomy if not constrained by validators
- DB bootstrap scripts could be misused as migration scripts if approval boundaries are ignored
- junior agents could drift if mentor packets are missing or stale

## Required Safeguards

- validator gate required for DB and apprentice packets
- no destructive SQL in bootstrap scripts
- no live DNS/TLS/reverse-proxy changes
- no production secret injection from repo or chat

## Rollback Note

Disable specialist-lane execution, stop automation staging, remove generated runtime packets, and revert to the prior server receiver flow if any lane widens privilege or bypasses validation.

## Audit Trail Note

Retain:

- diff
- validation output
- server preflight output
- DB preflight output
- bootstrap summary
- bundle checksum

## Approval Requirements

- engineering reviewer
- security reviewer
- server owner
- final human approver

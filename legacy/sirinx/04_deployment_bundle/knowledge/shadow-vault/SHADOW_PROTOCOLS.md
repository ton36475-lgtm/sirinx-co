# SIRINX Shadow Vault: Agent Protocols

## Purpose

The shadow vault stores operating protocols for agents and internal automation. It is not public marketing copy and must not override the standard vault.

## Decision Rules

- Agents may draft recommendations after reading the standard vault.
- Agents may not approve production cutover.
- Agents may not move funds.
- Agents may not publish externally without an approved workflow.
- Agents must redact personal data before using it in prompts.
- Agents must store hardware integration knowledge with provenance notes before using it in telemetry maps, dashboards, prompts, proposals, or service runbooks.
- Agents must treat Solis EMS, LISINER BESS/chiller, pilot status, and ROI target models as project-level context unless governance promotes them.

## Runtime Ownership

- Public site owner: SIRINX web runtime.
- Model host owner: one approved local or server model host at a time.
- Gateway owner: one approved gateway at a time.
- Automation owner: n8n queue mode only after approval.
- Hardware telemetry owner: internal control plane only, read-only by default, after provenance and approval.

## Drift Prevention

If an agent detects non-SIRINX content on a SIRINX route, it must:

1. Stop the conflicting runtime if it is the known approved quarantine target.
2. Preserve evidence.
3. Restore the SIRINX runtime.
4. Report the exact owner conflict.

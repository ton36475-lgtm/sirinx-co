# n8n / MCP Automation Runbook

Status: planned local-first automation backbone.

## Purpose

n8n, MCP servers, and thClaws jobs provide event-driven automation only after
policy and approval gates are satisfied.

## Default Flow

```text
Input -> Normalize Task -> Load Context -> Policy Check -> Approval Check
-> Local Worker / Dry Run -> Evidence Log -> Memory Delta -> Stop
```

## Allowed Before Activation

- Draft workflow maps.
- Define schemas.
- Create approval packets.
- Inspect local configs without printing secrets.
- Prepare dry-run plans.

## Blocked Before Approval

- Starting MCP servers.
- Connecting live external accounts.
- Mutating third-party services.
- Sending Telegram/Slack/email/customer messages.
- Running paid providers.
- Public webhook exposure.

## Required Evidence

Every automation must record trigger, input summary, policy decision, external
services touched, output artifact, rollback path, and approval state.

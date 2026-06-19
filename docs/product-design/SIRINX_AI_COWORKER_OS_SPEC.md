# SIRINX AI Co-worker OS Product Design Spec

Status: LOCAL ONLY - WAITING FOR APPROVAL
Date: 2026-06-07
Proof status: LOCAL
Source: user-provided SIRINX AI Co-worker OS image set

## Goal

Turn the SIRINX AI Co-worker OS concept into a productized local-first service
lane that can generate offers, content, workflow templates, Mission Control
panels, and evidence packets before any external activation.

## Users

- SME owner
- Solo founder
- Small team operator
- Agency operator
- Internal AI systems builder

## Problem

Many businesses already use AI, but the work remains scattered:

- The owner still thinks through every strategy manually.
- Content, reports, meetings, admin, finance, and video tasks remain separate.
- AI output is not connected to business context.
- There is no task state, owner, evidence, or approval gate.

## Product Promise

Install AI as a governed co-worker team:

```text
Marketing + Content + Admin + Finance + Video + Workflow Design
```

## User Flow

```text
Business owner request
-> Intake questionnaire
-> Context pack
-> Select co-worker modules
-> Generate workflow map
-> Generate task packets
-> Produce local drafts
-> QC and evidence packet
-> Human approval
-> Manual activation or future automation
```

## Screens

### 1. Overview

Purpose: show installed AI co-workers, system mode, active work, pending
approvals, and last evidence packet.

States:

- Empty setup
- Local-only active
- Needs approval
- Blocked by missing data

### 2. Co-worker Departments

Purpose: list Marketing, Content, Admin, Finance, Video, and Workflow
co-workers with scope and boundaries.

### 3. Workflow Builder

Purpose: create a task packet from business context.

### 4. Evidence Packets

Purpose: show local proof of generated outputs, checksums, QC decisions, and
blocked external actions.

### 5. Content Factory

Purpose: generate local poster/video/caption plans for the service itself and
for future customers.

### 6. Approval Queue

Purpose: keep external activation gated.

## Wireframe

```text
┌────────────────────────────────────────────┐
│ SIRINX AI Co-worker OS                     │
│ Mode: LOCAL ONLY | Pending approvals: 0    │
├───────────────┬───────────────┬────────────┤
│ Marketing     │ Content       │ Admin      │
│ 5 tasks       │ 4 tasks       │ 3 tasks    │
├───────────────┼───────────────┼────────────┤
│ Finance       │ Video         │ Workflow   │
│ 4 tasks       │ 3 tasks       │ 2 tasks    │
├────────────────────────────────────────────┤
│ Active Workflow                            │
│ Intake -> Context -> Task -> Draft -> QC   │
├────────────────────────────────────────────┤
│ Evidence Packet                            │
│ latest: P0-AI-COWORKER-OS-CONTENT-BATCH01 │
└────────────────────────────────────────────┘
```

## Design Tokens

- Background: near black / deep navy
- Primary accent: electric cyan
- Secondary accent: violet
- Trust accent: teal
- Finance accent: green
- Warning accent: amber
- Danger accent: red
- Radius: 8px or less for dense dashboard surfaces
- Typography: clean Thai-readable sans for marketing, monospace for console
  evidence

## Components

- System mode badge
- Co-worker card
- Module checklist
- Workflow stepper
- Task packet card
- Evidence packet card
- Approval gate strip
- Local-only warning banner
- Content batch table

## API / Data Draft

```json
{
  "coworker_id": "marketing",
  "name": "Marketing Co-worker",
  "status": "local_draft",
  "scope": ["persona", "campaign", "content_calendar"],
  "blocked_actions": ["live_post", "paid_ads_mutation", "crm_mutation"],
  "latest_evidence_packet": null
}
```

## Acceptance Criteria

- The brand package exists under `brands/sirinx-ai-coworker-os/`.
- The six modules plus bonus video co-worker are documented.
- The workflow is local-only and approval-gated.
- The spec identifies blocked external actions.
- The next gates are explicit and atomic.
- No provider call, live post, push, deploy, or customer-data intake happens.

## Test Checklist

- [ ] Markdown files exist.
- [ ] No production credentials are referenced.
- [ ] No live-post instruction is enabled.
- [ ] Claims needing evidence are marked.
- [ ] Continuation board includes the new lane.
- [ ] `git diff --check` passes for touched files.

## Required Evidence

- File tree
- SHA256 checksums
- Local continuation board entry
- Manual review decision
- Future browser screenshot if Mission Control panel is implemented

## Approval Gate

Next safe gate:

```text
APPROVE_AI_COWORKER_OS_CONTENT_BATCH01_LOCAL_ONLY
```

Still blocked:

```text
live_post
provider_call
Telegram live send
deploy
push
customer data
production credentials
paid API execution
```

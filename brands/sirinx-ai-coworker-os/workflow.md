# SIRINX AI Co-worker OS Workflow

Status: local-only delivery workflow

## Delivery Pipeline

```text
Business Intake
-> Context Pack
-> Co-worker Role Cards
-> Workflow Map
-> Task Packet
-> Local Draft Execution
-> QC
-> Evidence Packet
-> Human Approval
-> Manual Activation or Future Automation
```

## Local-Only Implementation Surfaces

1. Brand and offer files under `brands/sirinx-ai-coworker-os/`.
2. Product design spec under `docs/product-design/`.
3. Mission Control panel spec for active co-workers.
4. Content factory batch output under `outputs/content-factory/`.
5. Evidence packet under `outputs/evidence/`.
6. Manual post prep packet, not live posting.

## AI Co-worker Task Packet

Each task packet must include:

- Request
- Business context
- Assigned co-worker
- Inputs
- Output format
- Risk level
- Approval requirement
- Evidence requirement
- Stop conditions

## Team Runtime Model

```text
Human Owner
-> Hermes / Mission Control
-> Co-worker Router
-> Marketing / Content / Admin / Finance / Video / Workflow Co-worker
-> Local Output
-> QA / Evidence
-> Human Approval
```

## Stop Conditions

Stop immediately if the task requires:

- Real customer data
- Production credentials
- Platform API mutation
- Live post
- Payment or banking action
- Legal, tax, or regulated financial advice
- External scanning
- Public deploy

## First Local Batch

Recommended batch:

```text
P0-AI-COWORKER-OS-CONTENT-BATCH01
```

Deliverables:

- 5 poster copy drafts
- 5 short video scripts
- 5 carousel outlines
- 1 landing page structure
- 1 offer sheet draft
- 1 manual post prep packet
- 1 evidence packet

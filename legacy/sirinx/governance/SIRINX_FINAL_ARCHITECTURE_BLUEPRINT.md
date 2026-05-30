# SIRINX Final Architecture Blueprint

## Status

`Server-Ready Hold Draft`

This blueprint consolidates the recovered SIRINX website, governance layer, cyber-physical field context, and server handoff path. It does not authorize production deployment by itself.

## Planes

| Plane | Domain | Purpose | Public Ingress |
| --- | --- | --- | --- |
| Public Revenue Plane | `sirinx.co` | Public website, packages, trust pages, lead forms, SEO/AEO, Track Record drafts | Yes, through approved reverse proxy |
| Internal Control Plane | `ops.sirinx.co` | CRM, approvals, triage, reporting, queue/DLQ visibility, health checks | Zero Trust only |
| Agent Execution Plane | `agents.sirinx.internal` | n8n, queue workers, AI orchestration, telemetry processors, validators | No public ingress |

## Immutable Package Facts

- Brand: SIRINX
- Slogan: Clean Tech • Smart Future
- Thai headline: หยุดจ่ายค่าไฟทิ้งทิ้ง... แล้วเปลี่ยนหลังคาให้เป็นสินทรัพย์
- Thai footer: เปลี่ยนค่าใช้จ่าย ให้เป็นการลงทุนที่สร้างผลตอบแทน
- START: 125,000 THB + VAT 7% | AIKO 1U+ (5kW+) | Solis 5kW | Premium DC Cable 6 sqmm
- PRO: 315,000 THB + VAT 7% | AIKO 1U+ (8kW+) Seamless Black | 6kW Hybrid | GSL ENERGY 16.08kWh
- ENTERPRISE BESS: 4,990,000 THB + VAT 7% | 175kWp solar array | 125kW 3-Phase | Premium Liquid-Cooled BESS 261kWh

## Cyber-Physical Context Boundary

LISINER liquid-cooled BESS, Solis EMS/inverter observations, pilot completion estimate, and ROI target model are governed project-level context. They may support engineering, telemetry mapping, and proposal work, but they do not become global package truth without approval.

## Omniscient Ops Dashboard

The internal control plane includes a governed Omniscient Dashboard for:

- n8n queue and worker visibility
- pgvector retrieval metadata
- Solis EMS telemetry freshness
- LISINER BESS/chiller health review
- approval and audit waiting states

Reference:

- `governance/OMNISCIENT_DASHBOARD_ARCHITECTURE.md`

## Governed Multi-Agent Execution

The agent execution plane follows a five-stage pipeline:

1. Hermes Orchestrator -> routing JSON only
2. Cyber-Physical Analyst -> structured analysis only
3. Sovereign Creator -> structured narrative only
4. Validator Agent -> schema/path/fact-lock checks only
5. Delivery Agent -> bundle assembly only

Machine-readable handoffs are defined by:

- `ORCHESTRATION_SCHEMA.json`
- `.ops/contracts/*.json`
- `MULTI_AGENT_SYSTEM_PROMPTS.md`

## Runtime Owners

- Public site owner: SIRINX web runtime.
- Gateway owner: one approved gateway at a time.
- Model host owner: one approved model host at a time.
- Automation owner: n8n queue mode only after approval.

## Server-Ready Hold Gate

Deployment remains blocked until the server team provides approved access, environment, storage, DNS/Zero Trust ownership, backup target, outbound access, and maintenance window.

## Rollback Note

If this blueprint conflicts with a newer approved architecture, preserve this file as audit evidence and promote the newer packet only after human review.

## Audit Trail Note

Save the selected repo, branch, validation outputs, deployment bundle manifest, server preflight results, and approval packet before production deployment.

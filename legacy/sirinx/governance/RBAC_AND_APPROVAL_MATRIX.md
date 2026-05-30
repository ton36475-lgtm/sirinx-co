# RBAC And Approval Matrix

## Roles

| Role | Scope | Allowed | Not Allowed |
| --- | --- | --- | --- |
| Public viewer | `sirinx.co` | View public content, submit public lead forms | Access ops, agents, raw data, or secrets |
| Sales operator | `ops.sirinx.co` | Review leads, prepare quotes, update non-sensitive statuses | Change infrastructure, secrets, or financial approvals |
| Engineering operator | `ops.sirinx.co` | Run diagnostics, deploy approved builds, view service health | Approve own production cutover |
| Automation agent | `agents.sirinx.internal` | Execute scoped tasks with least-privilege tokens | Move money, publish unapproved campaigns, access unrelated projects |
| Owner approver | Approval packet | Approve cutover, rollback, secrets rotation, pricing updates | Bypass audit trail |

## Approval Gates

| Action | Required Approval | Evidence |
| --- | --- | --- |
| Public DNS/proxy cutover | Owner approver + engineering operator | Build logs, smoke results, rollback note |
| Database migration | Owner approver + engineering operator | Dry-run export/import, backup snapshot, rollback test |
| Automation profile enablement | Owner approver | Workflow list, token scope, kill switch |
| Pricing or legal copy change | Owner approver | Source of truth update and copy review |
| Secret rotation | Engineering operator | Rotation timestamp and affected services |
| Hardware promotion to Locked Package Fact | Owner approver + engineering operator | Source evidence, package impact, rollback target |
| Field-observed hardware stack promotion | Owner approver + engineering operator | Stack record, field evidence, confidence rationale, package impact |
| Pilot promotion to package evidence | Owner approver + engineering operator + sales reviewer | Pilot status, measured data, limitations, affected package/claim |
| Field-validated project context promotion | Owner approver + sales/engineering reviewer | Context record, source evidence, redaction status, claim boundaries |
| ROI model approval for executive use | Owner approver + sales/engineering reviewer | Model record, assumptions, sensitivity range, evidence links |
| High-impact ROI claim publication | Owner approver + sales/engineering reviewer | Assumptions, evidence, claim status, corrected-copy rollback |
| Revenue-plane track record publication | Owner approver + sales/engineering reviewer | Creative record, source evidence, redaction status, rollback copy |
| Telemetry ingestion activation | Owner approver + engineering operator | Schema, redaction tests, retention policy, rollback target |
| Telemetry schema change | Engineering operator + reviewer | Schema diff, compatibility note, quarantine behavior |
| Hardware integration telemetry activation | Owner approver + engineering operator | Provenance record, protocol map, read-only boundary, redaction test, rollback target |
| Remote hardware control or write command | Owner approver + engineering operator + site/customer permission | Security review, permission boundary, command rollback, emergency stop |

## Agent Delegation Rule

The second brain or agent layer may recommend actions after knowledge is promoted into the standard vault, but it cannot approve:

- Production cutover.
- Real money movement.
- Secret changes.
- Legal/tax claims.
- External publishing that affects public users.
- Hardware promotion into Locked Package Facts.
- Field-observed hardware stack promotion into package truth.
- Pilot promotion into package truth or ROI guarantee.
- Field-validated project context promotion into public proof or package truth.
- ROI model approval for executive or public use.
- High-impact ROI claims such as `250,000 -> 50,000`.
- Revenue-plane track record publication.
- Telemetry production activation.
- Telemetry redaction or retention policy approval.
- Hardware telemetry activation.
- Remote hardware control or write commands.

# SIRINX Canonical Operating System

## Status

`SERVER-READY HOLD MODE`

The SIRINX stack is consolidated around a single canonical repository, governed facts, and a server handoff package. No production deployment, DNS change, secret injection, or live cutover is authorized until the server team provides approved access details and a human approval packet is signed.

## Canonical Repository

`C:\Users\Ton36\OneDrive\เอกสาร\Playground\sirinx`

This repository is the writer-of-record for:

- Public SIRINX website recovery.
- SIRINX governance.
- Deployment bundle staging.
- Server handoff documentation.
- Safe cyber-physical telemetry requirements.

## Immutable Business Facts

- Brand: SIRINX
- Slogan: Clean Tech • Smart Future
- Thai headline: หยุดจ่ายค่าไฟทิ้งทิ้ง... แล้วเปลี่ยนหลังคาให้เป็นสินทรัพย์
- Thai footer: เปลี่ยนค่าใช้จ่าย ให้เป็นการลงทุนที่สร้างผลตอบแทน

## Package Truth

| Package | Price | Hardware Truth |
| --- | --- | --- |
| START | 125,000 THB + VAT 7% | AIKO 1U+ (5kW+) / Solis 5kW / Premium DC Cable 6 sqmm |
| PRO | 315,000 THB + VAT 7% | AIKO 1U+ (8kW+) Seamless Black / 6kW Hybrid / GSL ENERGY 16.08kWh |
| ENTERPRISE BESS | 4,990,000 THB + VAT 7% | 175kWp solar array / 125kW 3-Phase / Premium Liquid-Cooled BESS 261kWh |

Vendor observations such as LISINER and Solis field interfaces remain field-validated context. They do not overwrite global package truth without explicit governance promotion.

## Field-Validated Context

The following are project-level intelligence only:

- Observed battery cabinet type: LISINER liquid-cooled BESS with integrated chiller system.
- Observed inverter / EMS context: Solis EMS / Solis industrial inverter interface.
- Pilot project completion estimate: 85-90%.
- ROI target scenario: reduce monthly electricity cost from approximately 250,000 THB toward approximately 50,000-70,000 THB.

Required statement:

“The 250,000 THB to 50,000–70,000 THB reduction model is a validated project scenario and sales modeling target derived from specific assumptions, not a universal guaranteed outcome.”

## System Planes

| Plane | Domain | Boundary |
| --- | --- | --- |
| Public Revenue Plane | `sirinx.co` | Public website, package display, trust pages, lead forms, SEO/AEO, premium Track Record visuals |
| Internal Control Plane | `ops.sirinx.co` | CRM, approvals, triage, reporting, SSO, MFA, Zero Trust |
| Agent Execution Plane | `agents.sirinx.internal` | n8n queue workers, Redis, PostgreSQL-backed services, AI orchestration, no public ingress |

## Runtime Owner Rules

- Public website runtime: Docker service `sirinx-public` on port `3000`.
- Redis and databases: private network only.
- n8n: disabled by default under the `automation` profile until approved.
- Windows OpenClaw: gateway/control-plane owner only, not SIRINX public runtime.
- Ubuntu PM2: do not let legacy Ghost/Zenith services claim the SIRINX public website port.

## Production Build Hardening

- Production builds must not load Manus debug/runtime plugins or source-location collectors.
- JavaScript obfuscation is opt-in only through `VITE_ENABLE_JS_OBFUSCATION=true`; it must not be the default release path.
- Route trees and non-critical assistant widgets must remain lazy-loaded so the public revenue plane loads before optional control surfaces.
- Chat markdown must use the lightweight SIRINX renderer unless a future approval packet accepts the bundle and security cost of a heavier renderer.
- The validator must fail if any built JavaScript asset exceeds 500,000 bytes without an explicit performance exception.

## Canonical Governance Files

- `governance/LOCKED_BUSINESS_FACTS.md`
- `governance/OMNISCIENT_DASHBOARD_ARCHITECTURE.md`
- `governance/SIRINX_FINAL_ARCHITECTURE_BLUEPRINT.md`
- `governance/REPO_CONSOLIDATION_MATRIX.md`
- `governance/RBAC_AND_APPROVAL_MATRIX.md`
- `governance/DATA_CONTRACTS.md`
- `governance/DESIGN.md`
- `governance/OBSERVABILITY_CONTRACT.md`
- `governance/CUSTOM_AI_FRAMEWORK_ARCHITECTURE.md`
- `governance/DEPLOYMENT_AND_SECRETS_POLICY.md`
- `governance/FIELD_VALIDATED_HARDWARE_CONTEXT.md`
- `knowledge/shadow-vault/HARDWARE_TELEMETRY_PROTOCOL.md`
- `docs/migration/SERVER_HANDOFF_FINAL.md`

## Prohibited Imports

Do not import or activate:

- Gambling, CHOKMA, lottery, baccarat, or betting automation.
- Proxy rotation, stealth identity rotation, fingerprint spoofing, or evasion tooling.
- Unauthorized scraping/publishing flows.
- Production secrets or raw `.env` files.
- GitHub visibility/collaborator changes without human approval.
- Live DNS/TLS/reverse-proxy cutover without approval.

## Required Validation

Run these before handoff or deployment:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File infra\scripts\overlap-audit.ps1
corepack pnpm run check
corepack pnpm run test
corepack pnpm run build
docker compose -f docker-compose.yml config
```

## Deployment Gate

Stop before deployment until the server team provides:

- Server IP/hostname.
- SSH username and approved key path.
- Sudo policy.
- Storage and backup target.
- DNS / Zero Trust owner confirmation.
- Outbound access confirmation.
- Maintenance window.

## Rollback Note

Rollback is file-scoped. Revert only the failing patch, restore the last known-good handoff bundle, and rerun overlap audit plus check/test/build before retrying.

## Audit Trail Note

Preserve validation logs, handoff bundle manifest, SHA256 checksum, and approval packet with every release candidate.

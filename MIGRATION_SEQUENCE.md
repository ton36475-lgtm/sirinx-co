# Migration Sequence

## PR-MONO-001 - Repo Inventory And Quarantine

Status: current.

Outputs:

- governance files
- merge map
- quarantine report
- topology docs
- release gates

## PR-MONO-002 - Public Website

Candidate sources:

- `sirinx`
- `sirinx-solar-energy/sirinx-app`
- current `sirinx-co/public/index.html`

Rules:

- public only
- no internal links
- no localhost
- no API secrets
- no admin tools

## PR-MONO-003 - Dev Dashboard / Control API

Candidate sources:

- current VibeAllCoding HQ
- `sirinx` governed multi-agent handoff patterns
- `automation-dashboard`

Rules:

- local/dev only
- Cloudflare Access required before public route

## PR-MONO-004 - Mobile Command

Candidate sources:

- `oz_mobile_app`
- `ghost-claw-os`
- `automation-mobile-app`

Rules:

- approval queue only
- no direct worker filesystem access
- no production writes from mobile

## PR-MONO-005 - Node Topology

Candidate sources:

- `oz-corp-omega-dual-node`
- current Office Brain topology notes

Rules:

- scripts stay dry-run until reviewed

## Later PRs

Continue one bounded migration per PR. Deduplicate dependencies in PR-MONO-008 only after imports are mapped.

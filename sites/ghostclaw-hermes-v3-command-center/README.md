# GHOSTCLAW · Hermes V3 Command Center

A bilingual, owner-only Sites briefing surface for the 47 Ronin operating flow,
held safety gates, B1/B2 verification lane, and evidence-first boundary.
The published status is a curated source-verification receipt, not live runtime telemetry.

## Safety contract

- Read-only presentation with no operator controls.
- No live data sources, outbound requests, or persistence.
- No production-write path.
- Owner-only authorization is enforced by the Sites hosting access policy;
  deployment is refused unless that policy has one allowed user and no groups.
- The worker also requires the platform-authenticated user header and returns
  `401` before rendering when it is absent. It does not store or display it.

## Local verification

Requires Node.js 22.13.0 or newer.

```text
npm run build
npm test
npm run lint
npm run typecheck
```

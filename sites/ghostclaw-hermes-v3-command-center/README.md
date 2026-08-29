# GHOSTCLAW · Hermes V3 Command Center

A bilingual, owner-only Sites briefing surface for the 47 Ronin operating flow,
held safety gates, B1/B2 verification lane, and evidence-first boundary.
The published status is a curated source-verification receipt, not live runtime telemetry.

## Production receipt

- URL: <https://ghostclaw-hermes-command-center.e-galli.chatgpt.site>
- Sites version: `appgver_f10b41d7f3cc81918b9f95889a8aa2cd`
- Deployment: `appgdep_6a5baa33224081919d750fbfde16c626` (`succeeded`)
- Access policy at release: custom, one allowed account, zero groups
- Sites source-repository commit: `42d5abe15cdb992ce454c3fb3dfcc3c9fd7621ae`
- Archive: 23 files, `sha256:53ed04c7db5a8133410986c5b83db6ba2cc2195465a15c53a4a9eedfa3c1dad0`

The automated browser verifier cannot reach the production domain under the
current enterprise network policy. The deployment receipt, access policy, and
local build/render tests are the release evidence; authenticated visual smoke
testing remains an operator check.

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

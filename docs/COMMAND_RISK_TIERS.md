# Command Risk Tiers

Risk tiers let the broker unlock command visibility while preserving execution
boundaries.

## T0 - Read Only

Read-only inspection. Default decision: `ALLOW_READONLY`.

Examples:

- `git status`
- list files
- read docs
- inspect architecture

## T1 - Local Validation

Local validation without external write. Default decision:
`ALLOW_LOCAL_VALIDATION`.

Examples:

- lint
- unit tests
- typecheck
- static asset scan

## T2 - Scoped File Generation

Narrow local artifact or patch generation. Default decision:
`ALLOW_SCOPED_WRITE`.

Examples:

- generate docs
- create fixture JSON
- write runtime manifests
- create non-destructive patches

## T3 - Risky Local Mutation

Commands that can change local runtime or repo state. Default decision:
`REQUIRE_HUMAN_REVIEW`.

Examples:

- install dependencies
- database migrations
- overwrite generated assets
- run unknown scripts

## T4 - External or Production Action

Commands that can mutate external systems or production. Default decision:
`REQUIRE_HUMAN_REVIEW`.

Examples:

- Cloudflare Pages deploy
- git push
- connector sync write
- provider API write action

## T5 - Always Denied

Commands that violate system boundaries. Default decision: `DENY`.

Examples:

- exfiltrate credentials
- disable logging
- bypass auth or rate limits
- hide execution history
- approve all without policy

# TestSprite MCP Validation Layer Spec

Status: DRY-RUN COMPLETE - LOCAL ONLY - WAITING FOR SECRET/CONFIG APPROVAL

## Feature

TestSprite MCP Validation Layer

## Goal

Add an AI testing enforcement layer between AI-generated code and Part 8 human
approval so SIRINX does not accelerate bug shipment as code generation speed
increases.

## Why

SIRINX already has fast generation and strong human approval gates:

```text
Codex ultracode / Hermes TUI -> Part 8 Approval Gate
```

The missing layer is autonomous validation:

```text
Codex ultracode / Hermes TUI
-> TestSprite MCP validation
-> Part 8 Approval Gate
```

Without a validation agent, Part 8 becomes the first serious quality barrier.
With TestSprite, Part 8 receives evidence-backed test reports, reproducible
failures, and fix recommendations before human sign-off.

## Source Facts

Verified public documentation says:

- TestSprite MCP Server is a Model Context Protocol integration.
- It can be added to Claude Code with:
  `claude mcp add TestSprite --env API_KEY=your_api_key -- npx @testsprite/testsprite-mcp@latest`
- VS Code-style MCP config uses command `npx @testsprite/testsprite-mcp@latest`.
- The checked npm package version during dry-run was `0.0.38`.
- The checked npm package declares `node >=22`; local dry-run observed
  `node v26.0.0`.
- The env key shown by TestSprite docs is `API_KEY`.
- TestSprite positions itself as autonomous testing for AI-driven IDEs and
  Claude Code.

Unverified or marketing-derived until independently benchmarked:

- Claims such as pass-rate improvement from `42%` to `93%`.
- Exact credit burn for SIRINX apps.
- Fit for authenticated SIRINX flows.

## Scope

This spec lane permits only:

- Local documentation.
- Example MCP configuration with placeholder key only.
- App-to-test mapping.
- Approval packet.
- Proof model.
- No executable MCP server.

## Apps To Map First

| App                    | Validation target                         | Priority |
| ---------------------- | ----------------------------------------- | -------- |
| `apps/mission-control` | UI workflow, Git Evidence, dashboard tabs | P0       |
| `apps/web-sirinx`      | Public site routes, lead capture paths    | P1       |
| `apps/solar-admin`     | Admin UX and business workflows           | P1       |

## Proposed MCP Config Example

This file must remain an example until a separate activation approval exists.
Do not place a real key in repo docs.

```json
{
  "mcpServers": {
    "TestSprite": {
      "command": "npx",
      "args": ["@testsprite/testsprite-mcp@latest"],
      "env": {
        "API_KEY": "TESTSPRITE_API_KEY_PLACEHOLDER"
      }
    }
  }
}
```

## Proposed Workflow

```text
Codex/Hermes implements local feature
-> local lint/typecheck/build/unit tests
-> prepare TestSprite PRD/app map
-> run TestSprite MCP only after install/credential approval
-> collect report and replay/failure evidence
-> feed bug report back to Codex/Hermes
-> repeat until quality threshold is met
-> submit to Part 8 human approval
```

## Test Quality Gate

Initial local policy:

| Gate           | Rule                                                           |
| -------------- | -------------------------------------------------------------- |
| Test plan      | TestSprite must map to a SIRINX spec/PRD or local app route.   |
| Evidence       | Every result must have report path, timestamp, and app target. |
| Pass threshold | Target at least 90% pass rate before Part 8 submission.        |
| Failures       | Must classify as product bug, test fragility, or environment.  |
| Secrets        | No production credentials or customer data.                    |

## Explicitly Blocked

- No real API key in repo.
- No MCP server start.
- No cloud sandbox run.
- No provider call.
- No browser login using real customer data.
- No production URL test.
- No deploy.
- No push.
- No public tunnel.
- No Telegram/LINE/Facebook live send.

## Next Gate

Dry-run package inspection completed after:

```text
APPROVE_TESTSPRITE_MCP_INSTALL_DRY_RUN_LOCAL_ONLY
```

Config write and live MCP testing may start only after separate approvals:

```text
APPROVE_TESTSPRITE_API_KEY_LOCAL_SECRET_SETUP
APPROVE_TESTSPRITE_MCP_CONFIG_WRITE_LOCAL_ONLY
```

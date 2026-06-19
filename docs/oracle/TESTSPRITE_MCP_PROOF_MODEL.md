# TestSprite MCP Proof Model

Status: LOCAL SPEC - WAITING FOR MCP INSTALL APPROVAL

## Claim

TestSprite can become a validation evidence layer for SIRINX only after its
reports are linked to local feature specs, app targets, timestamps, and
reproducible failure records.

## Proof Boundary

This spec supports:

- `LOCAL`
- `LOCAL_SOURCE_CAPTURE`

It does not support by itself:

- `EVIDENCED` test success
- `COMMITTED`
- `EXTERNAL`
- `PROVEN`

Those require a real test run, report artifact, local evidence manifest, and
optional commit/external anchoring.

## Evidence Inputs

| Input                  | Role                           |
| ---------------------- | ------------------------------ |
| SIRINX app spec/PRD    | intent and acceptance criteria |
| local app target       | URL/route under local control  |
| TestSprite config      | MCP connection plan            |
| TestSprite report      | future validation evidence     |
| replay/failure record  | proof for bugs and fix loop    |
| local evidence packet  | bridge into Oracle Provenance  |
| Part 8 approval packet | human decision boundary        |

## Promotion Rule

| From       | To        | Required                                      |
| ---------- | --------- | --------------------------------------------- |
| UNVERIFIED | LOCAL     | local spec and config example exist           |
| LOCAL      | EVIDENCED | TestSprite report captured as local artifact  |
| EVIDENCED  | COMMITTED | report/manifest committed or Git note linked  |
| COMMITTED  | EXTERNAL  | approved external verification or attestation |
| EXTERNAL   | PROVEN    | reproducible chain documented                 |

## Blocked Language

- Do not say "TestSprite is installed" from this spec.
- Do not say "tests passed" without a report artifact.
- Do not say "ready for production" from TestSprite alone.
- Do not say "PROVEN" without evidence chain.

## Failure States

| State            | Meaning                            | Next Action                    |
| ---------------- | ---------------------------------- | ------------------------------ |
| CONFIG_ONLY      | spec exists, no MCP server started | wait for install approval      |
| MCP_CONNECTED    | future server visible to IDE       | run local dummy target only    |
| REPORT_CAPTURED  | future test report exists          | classify failures              |
| NEEDS_FIX        | app bug found                      | route to Codex/Hermes fix loop |
| TEST_FRAGILE     | flaky test or selector issue       | repair test plan               |
| ENVIRONMENT_FAIL | local server/auth/data issue       | fix environment before claims  |

## Timeline Event Template

```text
event_id: te-YYYYMMDD-testsprite-mcp-<app>
title: TestSprite MCP validation report captured
proof_status: EVIDENCED
claims:
  - TestSprite ran against a local SIRINX app target.
  - Report artifact was captured locally.
evidence_refs:
  - ev-YYYYMMDD-testsprite-report
  - ev-YYYYMMDD-testsprite-replay
```

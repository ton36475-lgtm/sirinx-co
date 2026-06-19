# Headroom-to-Hermes Adapter Spec

Status: PROTOTYPE COMPLETE - LOCAL ONLY - WAITING FOR EVIDENCE-WIRING APPROVAL

## Feature

Headroom-to-Hermes Adapter

## Goal

Use Headroom as a local, reversible context-compression helper for Hermes team
work without activating proxy mode, wrapping CLIs, or mutating live Hermes
routing.

## Why

Headroom was installed in an isolated local venv and verified with a
provider-free compression smoke. This makes it a promising candidate for
compressing large local tool-output payloads before they enter Hermes/Codex
review packets.

The first adapter must be deliberately conservative:

```text
local content packet -> headroom.compress() -> compressed preview + metrics
```

It must not become:

```text
transparent proxy -> live provider mutation -> hidden compression side effects
```

## Current Verified Local State

| Item                 | State                                         |
| -------------------- | --------------------------------------------- |
| Headroom repo        | cloned under GitHub Trending read-only intake |
| Install target       | `tools/repo-intake/2026-06-06/venvs/headroom` |
| CLI version/help     | passed                                        |
| Python import        | passed                                        |
| Rust SmartCrusher    | import passed                                 |
| `pip check`          | passed                                        |
| Compression smoke    | 8,366 tokens -> 3,579 tokens, 4,787 saved     |
| Provider call        | false                                         |
| Proxy/server started | false                                         |

## Scope

Spec-only scope:

- Define adapter contract.
- Define inputs and outputs.
- Define blocked activation paths.
- Define future Rust-first bridge direction.
- No executable adapter code.

Prototype scope approved and completed:

- Read a local Markdown/JSON/text file.
- Compress only selected large content blocks.
- Emit original path, compressed preview, tokens before/after, transforms, and
  retrieval warning.
- Write a local evidence summary.
- Never overwrite source files.

## Adapter Contract

Future command shape:

```bash
hermes-headroom-adapter compress-file \
  --input outputs/evidence/<lane>/review-source-excerpts.md \
  --output outputs/evidence/<lane>/headroom-compressed-preview.md \
  --metrics outputs/evidence/<lane>/headroom-metrics.json \
  --mode smart-crusher-only
```

Future JSON metrics shape:

```json
{
  "adapter": "hermes-headroom-adapter",
  "mode": "smart-crusher-only",
  "input_path": "outputs/evidence/example/review-source-excerpts.md",
  "tokens_before": 0,
  "tokens_after": 0,
  "tokens_saved": 0,
  "compression_ratio": 0,
  "transforms_applied": [],
  "provider_call": false,
  "proxy_started": false,
  "source_overwritten": false
}
```

## Hermes Integration Point

Use Headroom only as a pre-review compression utility for:

- large local evidence excerpts
- repo-intake scan outputs
- generated logs
- structured JSON arrays
- repeated tool outputs

Prototype result:

```text
input: outputs/evidence/mercury-skills/2026-06-06-safe-import-triage/review-required.md
tokens_before: 2432
tokens_after: 856
tokens_saved: 1576
provider_call: false
proxy_started: false
mcp_started: false
```

Do not use it for:

- system prompts
- approval tokens
- security policies
- API keys or secret-like data
- final user-facing copy
- Part 8 sign-off text

## Rust-First Direction

The adapter should be Rust-first when implemented:

- Rust CLI for file IO, manifest writing, and safety policy.
- Python venv call boundary only for Headroom's current Python API.
- Future replacement can bind directly to Rust-backed compression pieces if
  Headroom exposes stable APIs.

## Explicitly Blocked

- No `headroom proxy`.
- No `headroom wrap`.
- No `headroom init`.
- No `headroom install`.
- No `headroom mcp`.
- No transparent provider proxy.
- No Hermes live routing mutation.
- No Codex/OpenClaw config mutation.
- No provider call.
- No deploy.
- No push.
- No public tunnel.
- No external mutation.

## Next Gate

Prototype work completed after:

```text
APPROVE_HEADROOM_HERMES_ADAPTER_PROTOTYPE_LOCAL_ONLY
```

Wiring to recurring evidence packets may start only after:

```text
APPROVE_HEADROOM_HERMES_ADAPTER_WIRE_TO_EVIDENCE_PACKETS_LOCAL_ONLY
```

MCP mode may be considered only after:

```text
APPROVE_HEADROOM_MCP_DRY_RUN_LOCAL_ONLY
```

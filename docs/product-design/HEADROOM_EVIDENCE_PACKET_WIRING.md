# Headroom Evidence Packet Wiring

## Purpose

Use the local Headroom adapter to create compressed previews for evidence
packets while keeping original evidence files as the source of truth.

## Local Tools

- Adapter: `tools/local-bin/hermes-headroom-adapter.rs`
- Wire wrapper: `tools/local-bin/headroom-evidence-wire.rs`
- Mode: `safe-universal-local`

## Evidence Contract

For each input evidence file, the wiring lane may create:

- `<label>-compressed-preview.md`
- `<label>-headroom-metrics.json`
- `<label>-headroom-index.md`

The source evidence file is never overwritten.

## Blocked Actions

- Headroom proxy activation
- Headroom MCP activation
- Hermes live routing mutation
- Provider calls
- Deploy
- Push
- Public tunnel
- External mutation

## Next Gate

`APPROVE_HEADROOM_EVIDENCE_WIRING_ADD_TO_STANDARD_QA_LOCAL_ONLY`

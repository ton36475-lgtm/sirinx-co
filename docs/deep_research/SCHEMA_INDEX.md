# Deep Research Schema Index

Status: local-only schema index

## Machine-Readable Schemas

| Schema | Purpose |
| --- | --- |
| `schemas/deep-research-job-packet.schema.json` | Validates a research job packet before any run starts |
| `schemas/deep-research-evidence-pack.schema.json` | Validates extracted evidence units, source quality records, and claim verification records |

## Examples

| Example | Purpose |
| --- | --- |
| `docs/deep_research/examples/solar_bess_payback_job_packet.example.json` | Example local-first job packet for verifying Solar + BESS payback claims |
| `docs/deep_research/examples/solar_bess_evidence_pack.example.json` | Example evidence pack that marks a payback claim as unverified until external evidence and modeling exist |

## Boundary

These files do not run research by themselves.

They are contracts for a future local pipeline and keep the following blocked:

- provider calls
- paid research portals
- public endpoints
- confidential raw-file uploads
- secret reads
- publication or external mutation

## Next Implementation Step

Create a local validator script that:

1. loads the schemas;
2. validates example packets;
3. writes a runtime validation report under `.ghostclaw_runtime`;
4. does not call external APIs.

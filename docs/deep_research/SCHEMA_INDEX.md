# Deep Research Schema Index

Status: local-only schema index

## Machine-Readable Schemas

| Schema                                              | Purpose                                                                                    |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `schemas/deep-research-job-packet.schema.json`      | Validates a research job packet before any run starts                                      |
| `schemas/deep-research-evidence-pack.schema.json`   | Validates extracted evidence units, source quality records, and claim verification records |
| `schemas/deep-research-source-registry.schema.json` | Validates source registry records before retrieval or report-pack generation               |

## Examples

| Example                                                                  | Purpose                                                                                                   |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `docs/deep_research/examples/solar_bess_payback_job_packet.example.json` | Example local-first job packet for verifying Solar + BESS payback claims                                  |
| `docs/deep_research/examples/solar_bess_evidence_pack.example.json`      | Example evidence pack that marks a payback claim as unverified until external evidence and modeling exist |

## System Design Docs

| Document                                            | Purpose                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------- |
| `docs/deep_research/SOVEREIGN_DEEP_RESEARCH_OS.md`  | Operating-system level research architecture                           |
| `docs/deep_research/DEEP_RESEARCH_SYSTEM_DESIGN.md` | GHOSTCLAW execution design, lifecycle, agent mesh, and integration map |
| `docs/deep_research/DEEP_RESEARCH_OUTPUT_PACK.md`   | Required report/output pack for each serious research job              |

## Boundary

These files do not run research by themselves.

They are contracts for a future local pipeline and keep the following blocked:

- provider calls
- paid research portals
- public endpoints
- confidential raw-file uploads
- secret reads
- publication or external mutation

## Local Validator

Use:

```bash
python3 scripts/a2a/a2a_deep_research_system.py
```

The validator/factory:

1. loads the example job packet and evidence pack;
2. generates a local `source_registry.json` placeholder;
3. performs standard-library structural checks;
4. writes a local report pack under `.ghostclaw_runtime`;
5. writes a runtime validation report under `.ghostclaw_runtime`;
6. does not call external APIs, browse, install models, publish, or mutate
   external systems.

# pgvector RAG Memory Skill

## Purpose

Stage pgvector-backed retrieval contracts and knowledge chunk schemas without bypassing governance truth.

## When To Use

- defining retrieval payloads
- planning Postgres/pgvector adoption
- documenting knowledge chunk safety

## Inputs

- `docker-compose.yml`
- `infra/postgres/init/001-enable-pgvector.sql`
- retrieval schemas

## Outputs

- retrieval schemas
- memory protocol docs
- staged DB readiness notes

## Hard Constraints

- pgvector is staged, not auto-live
- governance truth remains the source of truth
- no unapproved migration cutover

## Validation Checklist

- schemas parse
- compose still renders
- field context is not promoted to package truth

## May Touch

- `schemas/rag_chunk.schema.json`
- `schemas/retrieval_result.schema.json`
- `knowledge/shadow-vault/HARDWARE_TELEMETRY_PROTOCOL.md`
- `governance/OBSERVABILITY_CONTRACT.md`

## Must Not Touch

- production databases
- locked package facts

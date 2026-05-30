# Local LLM Offline Drafting Skill

## Purpose

Guide safe use of local LLMs for offline drafting, summarization, and internal-only content preparation.

## When To Use

- drafting internal summaries
- offline narrative exploration
- preparing redacted working copy for Creator review

## Inputs

- redacted source material
- locked facts
- approved scenario language

## Outputs

- draft summaries
- internal prompts
- redacted narrative candidates

## Hard Constraints

- no production secrets
- no raw customer PII without redaction
- no automatic fact promotion from LLM output

## Validation Checklist

- inputs are redacted
- outputs are marked draft/internal until validated
- locked facts remain unchanged

## May Touch

- `MULTI_AGENT_SYSTEM_PROMPTS.md`
- `knowledge/shadow-vault/BRAIN_SKILL_BOOTSTRAP_PROTOCOL.md`
- `docs/migration/HERMES_DATABASE_BRAIN_SETUP_RUNBOOK.md`

## Must Not Touch

- production credentials
- DNS/TLS
- live automation profiles

# AGENTS.md Repo Governance Skill

## Purpose

Keep root and nested `AGENTS.md` files aligned with SIRINX governance, validation rules, and handoff boundaries.

## When To Use

- adding or patching repo instructions
- reconciling nested scope rules
- reviewing drift between runtime, docs, and handoff expectations

## Inputs

- `AGENTS.md`
- nested `AGENTS.md` files
- workspace policies

## Outputs

- patched governance instructions
- clarified scope rules
- updated validation references

## Hard Constraints

- do not mutate locked facts
- do not widen production privileges
- do not create duplicate active governance truths

## Validation Checklist

- root `AGENTS.md` exists and is non-empty
- nested `AGENTS.md` files exist where required
- instructions match current repo structure

## May Touch

- `AGENTS.md`
- `apps/web/AGENTS.md`
- `docs/design/AGENTS.md`
- `infra/AGENTS.md`
- `knowledge/AGENTS.md`
- `schemas/AGENTS.md`
- `tests/AGENTS.md`

## Must Not Touch

- production secrets
- live DNS/TLS config
- locked package facts without approval

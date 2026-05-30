# Playwright E2E Validation Skill

## Purpose

Maintain browser-level validation scaffolds for package facts, mobile layouts, media rules, and handoff bundle checks.

## When To Use

- adding E2E coverage targets
- documenting manual browser validation
- preparing future Playwright adoption

## Inputs

- `tests/e2e/*.spec.ts`
- public routes
- bundle and design requirements

## Outputs

- Playwright scaffold files
- run instructions
- skipped-safe verification notes

## Hard Constraints

- scaffolds must stay truthful if Playwright is not installed
- no production credentials in tests
- no fake passing claims

## Validation Checklist

- scaffold files exist
- each file documents what it verifies
- runtime assumptions are explicit

## May Touch

- `tests/e2e/`
- `tests/AGENTS.md`
- `docs/migration/PRODUCTION_READINESS_CHECKLIST.md`

## Must Not Touch

- production auth
- private data

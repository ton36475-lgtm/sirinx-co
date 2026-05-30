# n8n Queue Mode Skill

## Purpose

Preserve queue-mode rules, Redis isolation, and runner boundaries for approved automation staging.

## When To Use

- patching Compose
- documenting n8n roles
- reviewing worker/runner separation

## Inputs

- `docker-compose.yml`
- durability and observability docs

## Outputs

- queue-mode config notes
- worker boundary docs
- validation references

## Hard Constraints

- Redis stays private
- queue mode only when approved
- no live automation activation without approval

## Validation Checklist

- compose contains queue mode
- Redis is private
- runner image is documented

## May Touch

- `docker-compose.yml`
- `infra/backup/PG_DURABILITY_POLICY.md`
- `governance/OBSERVABILITY_CONTRACT.md`

## Must Not Touch

- live n8n profiles
- production secrets

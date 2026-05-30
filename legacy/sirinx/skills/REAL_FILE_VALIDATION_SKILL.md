# Real-File Validation Skill

## Purpose

Verify that required deliverables exist physically on disk and are not placeholder-only.

## When To Use

- before claiming handoff readiness
- after bundle rebuilds
- after adding schemas, skills, or system prompts

## Inputs

- repo tree
- bundle manifest
- required file lists

## Outputs

- pass/fail evidence
- missing file list
- empty file list

## Hard Constraints

- do not treat docs-only reasoning as validation
- fail on missing or empty required files
- fail on placeholder-only docs

## Validation Checklist

- required files exist
- required files are non-empty
- bundle references resolve
- placeholder-only docs are absent

## May Touch

- `infra/scripts/validate-real-files.sh`
- `infra/scripts/validate-handoff-bundle.sh`
- `.ops/contracts/HANDOFF_BUNDLE_MANIFEST.json`

## Must Not Touch

- live environments
- unrelated repos

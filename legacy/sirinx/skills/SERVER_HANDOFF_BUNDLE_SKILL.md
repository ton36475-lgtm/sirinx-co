# Server Handoff Bundle Skill

## Purpose

Assemble a safe, reviewable server handoff bundle with real files only.

## When To Use

- rebuilding `04_deployment_bundle`
- updating upload manuals
- adding governance or infra artifacts to server review

## Inputs

- `.ops/contracts/HANDOFF_BUNDLE_MANIFEST.json`
- `infra/scripts/build-handoff-bundle.ps1`
- migration docs

## Outputs

- bundle directory
- manifest files
- checksum file

## Hard Constraints

- no node_modules, dist, caches, keystores, plaintext secrets
- no historical drift docs as active bundle artifacts
- do not claim deploy-ready from bundle generation alone

## Validation Checklist

- bundle exists
- `MANIFEST.md`, `MANIFEST.json`, and `CHECKSUMS.SHA256.txt` exist
- excludes are enforced

## May Touch

- `04_deployment_bundle/`
- `infra/scripts/build-handoff-bundle.ps1`
- `docs/migration/DATACENTER_UPLOAD_OPERATIONS_MANUAL.md`

## Must Not Touch

- production servers
- live reverse proxy

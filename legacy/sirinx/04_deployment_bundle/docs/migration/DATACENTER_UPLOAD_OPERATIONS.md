# SIRINX Data Center Upload Operations

This is the canonical current entrypoint for the Data Center upload flow.

Use the detailed operational runbook in:

- `docs/migration/DATACENTER_UPLOAD_OPERATIONS_MANUAL.md`

Minimum governed requirements before upload:

- run `powershell -NoProfile -ExecutionPolicy Bypass -File .\infra\scripts\full-system-review.ps1`
- run `C:\Program Files\Git\bin\bash.exe infra/scripts/pre-deploy-check.sh`
- run `C:\Program Files\Git\bin\bash.exe infra/scripts/smoke-test.sh`
- confirm `04_deployment_bundle/MANIFEST.md`, `MANIFEST.json`, and `CHECKSUMS.SHA256.txt` exist
- confirm the latest reviewed zip and source snapshot artifacts were generated
- confirm no plaintext secrets, keystores, caches, or build junk enter the upload set

Stop at `SERVER-READY HOLD MODE`. Upload is for review and onboarding only, not production cutover.

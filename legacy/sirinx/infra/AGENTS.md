Read `../AGENTS.md` first.

Scope: Docker Compose, backup policy, validators, handoff packaging, dry-run deployment scripts.

Rules:
- dry-run first, no silent cutover
- secrets remain server-local only
- n8n runs in queue mode when enabled
- Redis stays private
- PostgreSQL durability must document base backup, WAL, and restore drill
- handoff bundle must exclude secrets, caches, `node_modules`, and historical drift
- Hermes brain bootstrap and DB preflight scripts must stay staging-first and non-destructive
- mentor/apprentice starter packets must be generated from canonical docs and contracts only

Validation:
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\infra\scripts\full-system-review.ps1`
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\infra\scripts\build-source-snapshot.ps1`
- `docker compose -f docker-compose.yml config`
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\infra\scripts\build-handoff-bundle.ps1`
- `C:\Program Files\Git\bin\bash.exe infra/scripts/ultimate-validator.sh`

Server continuation:
- keep `infra/scripts/server-source-sync.sh`, `infra/scripts/server-receiver-install.sh`, and `infra/scripts/render-public-site-config.sh` in sync with the migration docs
- handoff docs must distinguish review bundle upload from full runtime source delivery
- reverse-proxy config must be rendered from approved host variables; do not hardcode new public domains into live steps without approval

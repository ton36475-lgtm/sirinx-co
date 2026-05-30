#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob

ROOT_DEFAULT="/c/Users/Ton36/OneDrive/เอกสาร/Playground/sirinx"
ROOT="${1:-$ROOT_DEFAULT}"
if [ ! -d "$ROOT" ]; then
  ROOT="$(pwd)"
fi
cd "$ROOT"

fail() {
  echo "PRE_DEPLOY_FAIL: $*" >&2
  exit 1
}

echo "== SIRINX pre-deploy check =="

[ -f ".env.example" ] || fail ".env.example missing"
[ -s ".env.example" ] || fail ".env.example is empty"

required_env_keys=(
  "PORT"
  "PUBLIC_PRIMARY_HOST"
  "PUBLIC_SERVER_ALIASES"
  "OPS_PUBLIC_HOST"
  "TLS_CERT_BASENAME"
  "SIRINX_PUBLIC_BASE_URL"
  "DATABASE_URL"
  "JWT_SECRET"
  "HERMES_RUNTIME_ROOT"
  "BRAIN_SKILL_ROOT"
  "AGENT_PACKET_ROOT"
  "SIRINX_STAGE_DATABASE"
  "SIRINX_STAGE_HERMES"
)

for key in "${required_env_keys[@]}"; do
  grep -Eq "^${key}=" ".env.example" || fail "required env key not listed in .env.example: ${key}"
done

if find . \
  -path "./.git" -prune -o \
  -path "./node_modules" -prune -o \
  -path "./dist" -prune -o \
  -path "./build" -prune -o \
  -path "./cache" -prune -o \
  -path "./.cache" -prune -o \
  -path "./artifacts" -prune -o \
  -path "./04_deployment_bundle" -prune -o \
  -path "./secrets" -prune -o \
  -name ".env" -print | grep -q .; then
  fail "plaintext .env file detected in repo"
fi

python_cmd=""
if command -v python >/dev/null 2>&1 && python --version >/dev/null 2>&1; then
  python_cmd="python"
elif command -v python3 >/dev/null 2>&1 && python3 --version >/dev/null 2>&1; then
  python_cmd="python3"
elif command -v py >/dev/null 2>&1; then
  python_cmd="py"
fi
[ -n "$python_cmd" ] || fail "python runtime not found"

"$python_cmd" - <<'PY'
from pathlib import Path
import re

root = Path(".")
skip_parts = {".git", "node_modules", "dist", "build", "cache", ".cache", "artifacts", "04_deployment_bundle", "secrets", "__pycache__"}
skip_exact = {".env.example", ".env.local.example", "pnpm-lock.yaml"}
allowed_suffixes = {".md", ".txt", ".yml", ".yaml", ".json", ".ts", ".tsx", ".js", ".jsx", ".sh", ".py", ".example", ".sql", ".toml", ""}
assignment = re.compile(r"\b(?:API_KEY|SECRET|PRIVATE_KEY|JWT_SECRET|DATABASE_URL)\b\s*[:=]\s*([^\s#]+)")
allow_markers = ("", '""', "''", "${", "<", "example", "optional", "changeme", "replace", "your_", "xxx")

hits = []
for path in root.rglob("*"):
    if not path.is_file():
        continue
    if any(part in skip_parts for part in path.parts):
        continue
    if path.name in skip_exact:
        continue
    if path.suffix.lower() not in allowed_suffixes:
        continue
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        text = path.read_text(encoding="utf-8", errors="ignore")
    if path.suffix.lower() == ".md":
        continue
    for idx, line in enumerate(text.splitlines(), start=1):
        match = assignment.search(line)
        if not match:
            continue
        value = match.group(1).strip().strip('\'"')
        lowered = value.lower()
        if any(marker in lowered for marker in allow_markers):
            continue
        hits.append(f"{path}:{idx}:{line.strip()}")

if hits:
    raise SystemExit("PRE_DEPLOY_FAIL: suspicious secret-like assignments detected:\n" + "\n".join(hits[:20]))
PY

[ -f "docker-compose.yml" ] || fail "docker-compose.yml missing"
[ -s "docker-compose.yml" ] || fail "docker-compose.yml is empty"
[ -f "infra/docker/Dockerfile.sirinx" ] || fail "infra/docker/Dockerfile.sirinx missing"

if [ -f "nginx.conf" ] && [ ! -s "nginx.conf" ]; then
  fail "nginx.conf exists but is empty"
fi

if [ -f "app.yaml" ] && [ ! -s "app.yaml" ]; then
  fail "app.yaml exists but is empty"
fi

grep -Eq '^PORT=3000$' ".env.example" || fail ".env.example must declare PORT=3000"
grep -Eq 'process\.env\.PORT' "server/_core/index.ts" || fail "server runtime must stay port-configurable"
grep -Eq '3000:3000' "docker-compose.yml" || fail "docker-compose.yml must expose 3000:3000 for sirinx-public"

if grep -R -n -E 'localhost:8000|127\.0\.0\.1:8000' server infra/docker docker-compose.yml >/dev/null 2>&1; then
  fail "legacy 8000 runtime binding found in active runtime configs"
fi

echo "pre-deploy-check: ok"

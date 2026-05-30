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
  echo "VALIDATION_FAIL: $*" >&2
  exit 1
}

bundle_dir="04_deployment_bundle"
[ -d "$bundle_dir" ] || fail "bundle directory missing"
[ -f "$bundle_dir/MANIFEST.md" ] || fail "bundle MANIFEST.md missing"
[ -f "$bundle_dir/MANIFEST.json" ] || fail "bundle MANIFEST.json missing"
[ -f "$bundle_dir/CHECKSUMS.SHA256.txt" ] || fail "bundle CHECKSUMS.SHA256.txt missing"

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
import json

bundle = Path("04_deployment_bundle")
contract = json.loads((Path(".ops/contracts/HANDOFF_BUNDLE_MANIFEST.json")).read_text(encoding="utf-8"))

for rel in contract["requiredFiles"]:
    target = bundle / rel
    if not target.exists():
        raise SystemExit(f"VALIDATION_FAIL: bundle missing required file: {rel}")
    if target.is_file() and target.stat().st_size <= 0:
        raise SystemExit(f"VALIDATION_FAIL: bundle file empty: {rel}")

for directory in contract["requiredDirectories"]:
    target = bundle / directory["path"]
    if not target.exists():
        raise SystemExit(f"VALIDATION_FAIL: bundle missing directory: {directory['path']}")
PY

"$python_cmd" - <<'PY'
from pathlib import Path
import re

root = Path("04_deployment_bundle")
missing = []
for doc in root.rglob("*.md"):
    text = doc.read_text(encoding="utf-8", errors="replace")
    for line_no, line in enumerate(text.splitlines(), start=1):
        for match in re.finditer(r"`([^`]+)`", line):
            ref = match.group(1)
            if not re.match(r"^(governance|docs/migration|docs/design|infra|knowledge|\.ops|skills|schemas|agents/system_prompts|tests/e2e)/", ref):
                continue
            if any(ch in ref for ch in "*?"):
                continue
            target = root / Path(ref)
            if not target.exists():
                missing.append(f"{doc.relative_to(root)}:{line_no} -> {ref}")

if missing:
    raise SystemExit("VALIDATION_FAIL: bundle has broken markdown references:\n" + "\n".join(missing[:50]))
PY

if find "$bundle_dir" \( \
  -path "*/node_modules/*" -o \
  -path "*/dist/*" -o \
  -path "*/build/*" -o \
  -path "*/.git/*" -o \
  -path "*/artifacts/*" -o \
  -path "*/secrets/*" -o \
  -path "*/.cache/*" -o \
  -path "*/cache/*" -o \
  -path "*/__pycache__/*" -o \
  -name ".env" -o \
  -name "*.pem" -o \
  -name "*.key" -o \
  -name "*.p12" -o \
  -name "*.pfx" \
  \) -print | grep -q .; then
  fail "forbidden artifact detected inside handoff bundle"
fi

while IFS= read -r file; do
  [ -s "$file" ] || fail "EMPTY FILE: $file"
done < <(find "$bundle_dir" -type f)

echo "validate-handoff-bundle: ok"

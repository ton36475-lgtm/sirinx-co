# Deep Research Control Plane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first Deep Research control plane that turns research goals into validated job packets, evidence packs, runtime status, Mission Control visibility, and Obsidian pulses without external execution.

**Architecture:** The control plane stays file-queue and runtime-artifact based. Codex owns local schemas, validators, report generation, and Mission Control fixtures; KOB owns planning/context compression; any retrieval/provider/browser/model execution remains behind future broker leases.

**Tech Stack:** Python standard library, JSON Schema documents, Markdown docs, Mission Control React fixture, GHOSTCLAW A2A runtime folders, Obsidian pulse script.

---

### Task 1: Extend Deep Research Runtime Status

**Files:**

- Modify: `/Users/sirinx/SIRINXDev/sirinx-agent-native-os/scripts/a2a/a2a_deep_research_system.py`
- Modify: `/Users/sirinx/SIRINXDev/sirinx-agent-native-os/policies/deep_research_os.yaml`
- Test: runtime reports under `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/logs/`

- [ ] **Step 1: Add job-class metadata**

Add a `JOB_CLASSES` list with class IDs, descriptions, output names, and gate labels:

```python
JOB_CLASSES = [
    {
        "id": "claim_verification",
        "purpose": "Check whether a material claim is supported.",
        "first_output": "claim_evidence_matrix.csv",
        "gate": "retrieval_lane",
    },
    {
        "id": "visual_evidence_audit",
        "purpose": "Verify layout-heavy PDFs, tables, charts, and screenshots.",
        "first_output": "visual_evidence_manifest.json",
        "gate": "visual_rag_lane",
    },
]
```

- [ ] **Step 2: Run local status generator**

Run:

```bash
python3 scripts/a2a/a2a_deep_research_system.py
```

Expected: `status` remains `ready_for_local_review_only`; no external action is attempted.

- [ ] **Step 3: Compile the script**

Run:

```bash
PYTHONPYCACHEPREFIX=/tmp/ghostclaw-pycache python3 -m py_compile scripts/a2a/a2a_deep_research_system.py
```

Expected: command exits successfully.

### Task 2: Add Read-Only Mission Control Fixture

**Files:**

- Create: `/Users/sirinx/SIRINXDev/sirinx-agent-native-os/apps/mission-control/src/fixtures/deepResearchSystemStatus.json`
- Modify: `/Users/sirinx/SIRINXDev/sirinx-agent-native-os/scripts/a2a/a2a_deep_research_system.py`

- [ ] **Step 1: Write fixture from runtime report**

Extend the generator so it writes the same sanitized status to:

```text
apps/mission-control/src/fixtures/deepResearchSystemStatus.json
```

The fixture must not contain raw sources, secrets, tokens, private browser
session data, or large logs.

- [ ] **Step 2: Validate JSON**

Run:

```bash
python3 - <<'PY'
import json
from pathlib import Path
json.loads(Path("apps/mission-control/src/fixtures/deepResearchSystemStatus.json").read_text())
print("deep research fixture json ok")
PY
```

Expected: `deep research fixture json ok`.

### Task 3: Add Read-Only Mission Control Tab

**Files:**

- Modify: `/Users/sirinx/SIRINXDev/sirinx-agent-native-os/apps/mission-control/src/App.tsx`

- [ ] **Step 1: Import fixture**

Add:

```ts
import deepResearchSystemStatusFixture from "./fixtures/deepResearchSystemStatus.json";
```

- [ ] **Step 2: Add a panel key**

Extend the panel key union with:

```ts
| "deepResearch"
```

- [ ] **Step 3: Render status only**

Create a panel that displays counts, docs, schemas, blocked actions, job
classes, and next safe actions. Do not add execution buttons.

- [ ] **Step 4: Typecheck Mission Control**

Run:

```bash
pnpm exec tsc -p apps/mission-control/tsconfig.json --noEmit
```

Expected: no TypeScript errors.

### Task 4: Add Local Job Factory

**Files:**

- Create: `/Users/sirinx/SIRINXDev/sirinx-agent-native-os/scripts/a2a/a2a_deep_research_new_job.py`
- Modify: `/Users/sirinx/SIRINXDev/sirinx-agent-native-os/docs/deep_research/RESEARCH_JOB_PACKET_TEMPLATE.md`

- [ ] **Step 1: Create a job packet from local metadata**

The script should accept `--project`, `--goal`, `--job-class`, and optional local
source paths. It should write to:

```text
/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/deep_research/jobs/
```

- [ ] **Step 2: Block external URLs by default**

If a source begins with `http://` or `https://`, mark it as `needs_retrieval_lane`
and do not fetch it.

- [ ] **Step 3: Compile**

Run:

```bash
PYTHONPYCACHEPREFIX=/tmp/ghostclaw-pycache python3 -m py_compile scripts/a2a/a2a_deep_research_new_job.py
```

Expected: command exits successfully.

### Task 5: Add Source Registry Validator

**Files:**

- Create: `/Users/sirinx/SIRINXDev/sirinx-agent-native-os/schemas/deep-research-source-registry.schema.json`
- Create: `/Users/sirinx/SIRINXDev/sirinx-agent-native-os/scripts/a2a/a2a_deep_research_validate_pack.py`

- [ ] **Step 1: Define source registry fields**

Required fields:

```json
{
  "source_id": "src_001",
  "source_type": "pdf",
  "source_uri": "local-path-or-url-reference",
  "source_hash": "sha256:pending",
  "confidentiality": "internal",
  "retrieval_state": "local_available"
}
```

- [ ] **Step 2: Validate pack shape**

The validator checks job packet, source registry, evidence units, and claim
verification records without importing third-party dependencies.

- [ ] **Step 3: Run validation**

Run:

```bash
python3 scripts/a2a/a2a_deep_research_validate_pack.py --examples
```

Expected: examples pass or report exact missing fields.

### Task 6: Record Status And Obsidian Pulse

**Files:**

- Modify: `/Users/sirinx/SIRINXDev/sirinx-agent-native-os/PROJECT_STATE.md`
- Modify: `/Users/sirinx/SIRINXDev/sirinx-agent-native-os/NEXT_ACTIONS.md`
- Runtime: `/Users/sirinx/SIRINXDev/.ghostclaw_runtime/a2async/memory/obsidian_sync.jsonl`

- [ ] **Step 1: Update project state**

Record the control-plane file paths, runtime report paths, and blocked actions.

- [ ] **Step 2: Update next actions**

Add unchecked actions for Mission Control fixture, read-only tab, local job
factory, source registry validator, and report-pack generator.

- [ ] **Step 3: Write one concise Obsidian pulse**

Run:

```bash
python3 scripts/a2a/a2a_obsidian_sync.py \
  --title "Deep Research Control Plane" \
  --summary "Added local-first Deep Research control-plane design and implementation plan. Retrieval, providers, scraping, publication, push, deploy, and connector writes remain blocked." \
  --source "/Users/sirinx/SIRINXDev/sirinx-agent-native-os/docs/deep_research/DEEP_RESEARCH_CONTROL_PLANE.md" \
  --next-action "Create a read-only Mission Control fixture before opening any retrieval lane."
```

Expected: digest pulse is appended without secrets.

### Task 7: Scoped Lane Validation

**Files:**

- Modify: `/Users/sirinx/SIRINXDev/sirinx-agent-native-os/policies/a2a_scoped_lanes.json`

- [ ] **Step 1: Add new files to lane allowlist**

Add:

```text
docs/deep_research/DEEP_RESEARCH_CONTROL_PLANE.md
docs/superpowers/plans/2026-06-27-deep-research-control-plane.md
```

- [ ] **Step 2: Run scoped lane status**

Run:

```bash
python3 scripts/a2a/a2a_scoped_lane_status.py --lane deep-research-system-design-lane --strict
```

Expected: ready for scoped review, with unrelated dirty lanes counted but not included.

- [ ] **Step 3: Create patch backup**

Run:

```bash
mkdir -p /tmp/ghostclaw-patches
git diff -- AGENTS.md NEXT_ACTIONS.md PROJECT_STATE.md docs/deep_research docs/superpowers/plans policies/a2a_scoped_lanes.json policies/deep_research_os.yaml scripts/a2a/a2a_deep_research_system.py schemas/deep-research-evidence-pack.schema.json schemas/deep-research-job-packet.schema.json > /tmp/ghostclaw-patches/deep-research-control-plane.patch
```

Expected: patch file exists. Do not stage or commit unless explicitly requested.

## Self-Review

- Spec coverage: control plane, job classes, runtime status, Mission Control
  fixture, job factory, source validator, memory pulse, and lane validation are
  covered.
- Placeholder scan: no `TBD`, `TODO`, or unspecified implementation step is
  required for the next worker to proceed.
- Type consistency: job class, evidence pack, source registry, and Mission
  Control fixture names are stable across tasks.

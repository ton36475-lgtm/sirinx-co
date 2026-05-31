import json
import sys
from pathlib import Path


EXPECTED_AGENT_IDS = ["Hermes", "Analyst", "Creator", "Validator", "Delivery"]
EXPECTED_STAGES = ["route", "analyze", "create", "validate", "deliver"]
EXPECTED_SPECIALIST_LANES = ["DatabaseSteward", "Mentor", "Apprentice"]


def fail(message: str) -> None:
    print(f"CONTRACT_VALIDATION_FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def read_json(path: Path) -> dict:
    if not path.exists():
        fail(f"missing file: {path}")
    if path.stat().st_size <= 0:
        fail(f"empty file: {path}")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON in {path}: {exc}")


def main() -> None:
    root = Path(__file__).resolve().parents[2]

    contract_paths = [
        root / "ORCHESTRATION_SCHEMA.json",
        root / ".ops" / "contracts" / "ORCHESTRATOR_SCHEMA.json",
        root / ".ops" / "contracts" / "ANALYST_SCHEMA.json",
        root / ".ops" / "contracts" / "CREATOR_SCHEMA.json",
        root / ".ops" / "contracts" / "DATABASE_STEWARD_SCHEMA.json",
        root / ".ops" / "contracts" / "VALIDATOR_SCHEMA.json",
        root / ".ops" / "contracts" / "DELIVERY_SCHEMA.json",
        root / ".ops" / "contracts" / "MENTOR_BOOTSTRAP_SCHEMA.json",
        root / ".ops" / "contracts" / "HANDOFF_BUNDLE_MANIFEST.json",
    ]

    contracts = {path.name: read_json(path) for path in contract_paths}

    orchestration = contracts["ORCHESTRATION_SCHEMA.json"]
    workflow_stage_enum = orchestration["properties"]["workflow_stage"]["enum"]
    assigned_agent_enum = orchestration["properties"]["assigned_agent"]["enum"]
    next_agent_enum = orchestration["properties"]["next_agent"]["enum"]

    if workflow_stage_enum != EXPECTED_STAGES:
        fail("workflow stages drifted from expected five-stage pipeline")

    if assigned_agent_enum != EXPECTED_AGENT_IDS:
        fail("assigned agent enum drifted from expected five-agent roster")

    expected_next_agents = ["Hermes", "Analyst", "Creator", "Validator", "Delivery", None]
    if next_agent_enum != expected_next_agents:
        fail("next_agent enum drifted from expected routing values")

    execution_mode_enum = orchestration["properties"]["execution_mode"]["enum"]
    if execution_mode_enum != ["standard", "specialist-lane"]:
        fail("execution_mode enum drifted from expected values")

    specialist_lane_enum = orchestration["properties"]["specialist_lane"]["enum"]
    expected_specialist_values = ["DatabaseSteward", "Mentor", "Apprentice", None]
    if specialist_lane_enum != expected_specialist_values:
        fail("specialist_lane enum drifted from expected values")

    role_checks = {
        "ORCHESTRATOR_SCHEMA.json": ("Hermes", "route"),
        "ANALYST_SCHEMA.json": ("Analyst", "analyze"),
        "CREATOR_SCHEMA.json": ("Creator", "create"),
        "VALIDATOR_SCHEMA.json": ("Validator", "validate"),
        "DELIVERY_SCHEMA.json": ("Delivery", "deliver"),
    }

    for filename, (agent_id, stage) in role_checks.items():
        schema = contracts[filename]
        if schema["properties"]["assigned_agent"]["const"] != agent_id:
            fail(f"{filename} assigned_agent const mismatch")
        if schema["properties"]["workflow_stage"]["const"] != stage:
            fail(f"{filename} workflow_stage const mismatch")

    specialist_checks = {
        "DATABASE_STEWARD_SCHEMA.json": "DatabaseSteward",
        "MENTOR_BOOTSTRAP_SCHEMA.json": "Mentor",
    }

    for filename, lane in specialist_checks.items():
        schema = contracts[filename]
        if schema["properties"]["specialist_lane"]["const"] != lane:
            fail(f"{filename} specialist_lane const mismatch")

    prompt_file = root / "MULTI_AGENT_SYSTEM_PROMPTS.md"
    if not prompt_file.exists() or prompt_file.stat().st_size <= 0:
        fail("MULTI_AGENT_SYSTEM_PROMPTS.md missing or empty")

    shared_contract_file = root / "shared" / "_core" / "agentContracts.ts"
    if not shared_contract_file.exists() or shared_contract_file.stat().st_size <= 0:
        fail("shared/_core/agentContracts.ts missing or empty")

    shared_contract_text = shared_contract_file.read_text(encoding="utf-8")
    for token in EXPECTED_AGENT_IDS + EXPECTED_STAGES + EXPECTED_SPECIALIST_LANES:
        if token not in shared_contract_text:
            fail(f"shared contract file missing token: {token}")

    manifest = contracts["HANDOFF_BUNDLE_MANIFEST.json"]
    for required_key in ["requiredFiles", "requiredDirectories", "bundleExcludes", "validationGates"]:
        if required_key not in manifest:
            fail(f"handoff bundle manifest missing key: {required_key}")

    if not manifest["requiredFiles"]:
        fail("handoff bundle manifest has no required files")

    for relative in manifest["requiredFiles"]:
        path = root / relative
        if not path.exists():
            fail(f"manifest required file missing in repo: {relative}")
        if path.is_file() and path.stat().st_size <= 0:
            fail(f"manifest required file empty in repo: {relative}")

    for directory in manifest["requiredDirectories"]:
        path = root / directory["path"]
        if not path.exists():
            fail(f"manifest required directory missing in repo: {directory['path']}")

    print("contract validation: ok")


if __name__ == "__main__":
    main()

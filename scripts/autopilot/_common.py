#!/usr/bin/env python3
"""Shared helpers for Ghostclaw Autopilot scripts."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import re
import sys
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[2]
RUNTIME_ROOT = Path(os.environ.get("GHOSTCLAW_RUNTIME_ROOT", "~/SIRINXDev/.ghostclaw_runtime")).expanduser()
AUTOPILOT_ROOT = RUNTIME_ROOT / "autopilot"
LEASE_ROOT = RUNTIME_ROOT / "leases"
AUDIT_ROOT = RUNTIME_ROOT / "audit"
REPORT_ROOT = RUNTIME_ROOT / "reports"
KILL_SWITCH_FILE = RUNTIME_ROOT / "kill_switch" / "STOP_ALL"
ADAPTER_REGISTRY_PATH = PROJECT_ROOT / "policies" / "autopilot_adapter_registry.json"
BUDGET_LEDGER_ROOT = RUNTIME_ROOT / "budgets"
RATE_LEDGER_ROOT = RUNTIME_ROOT / "rate_limits"
COMMAND_HASH_ROOT = RUNTIME_ROOT / "command_hashes"

SECRET_PATTERNS = (
    re.compile(r"sk-[A-Za-z0-9_-]{12,}"),
    re.compile(r"(api[_-]?key|token|secret|password)\s*[:=]\s*[^,\s]+", re.I),
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
)

LOCAL_ACTION_TYPES = {
    "inspect",
    "local_artifact",
    "local_modify",
}

FALLBACK_ADAPTER_REQUIREMENTS = {
    "n8n_workflow_activation": ("workflow_name", "rate_limit_key", "rollback_command"),
    "social_publish": ("channel", "rate_limit_key", "rollback_command"),
    "email_or_line_send": ("channel", "opt_in_proof", "rate_limit_key", "rollback_command"),
    "deploy": ("target_environment", "tests_green", "backup_ready", "rollback_command"),
    "git_remote_mutation": ("target_remote", "tests_green", "rollback_command"),
}


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).astimezone().isoformat(timespec="seconds")


def today() -> str:
    return dt.date.today().isoformat()


def ensure_runtime() -> None:
    for path in (
        AUTOPILOT_ROOT / "queue",
        AUTOPILOT_ROOT / "running",
        AUTOPILOT_ROOT / "completed",
        AUTOPILOT_ROOT / "failed",
        AUTOPILOT_ROOT / "skipped",
        AUTOPILOT_ROOT / "quarantined",
        LEASE_ROOT,
        AUDIT_ROOT,
        REPORT_ROOT,
        BUDGET_LEDGER_ROOT,
        RATE_LEDGER_ROOT,
        COMMAND_HASH_ROOT,
        RUNTIME_ROOT / "kill_switch",
    ):
        path.mkdir(parents=True, exist_ok=True)


def mask(value: Any) -> Any:
    if isinstance(value, dict):
        return {k: mask(v) for k, v in value.items()}
    if isinstance(value, list):
        return [mask(v) for v in value]
    if not isinstance(value, str):
        return value
    masked = value
    for pattern in SECRET_PATTERNS:
        masked = pattern.sub("[MASKED]", masked)
    return masked


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return ""


def load_adapter_registry() -> dict[str, Any]:
    try:
        return json.loads(ADAPTER_REGISTRY_PATH.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return {"version": 0, "adapters": {}}


def registry_adapter(action_type: str) -> dict[str, Any]:
    registry = load_adapter_registry()
    adapter = registry.get("adapters", {}).get(action_type)
    return adapter if isinstance(adapter, dict) else {}


def is_local_action(action_type: str) -> bool:
    return action_type in LOCAL_ACTION_TYPES


def is_external_allowed_lease(payload: dict[str, Any]) -> bool:
    return (
        str(payload.get("policy_decision", "")) == "auto_allow_with_limits"
        and not is_local_action(str(payload.get("action_type", "")))
    )


def load_hard_blocks() -> set[str]:
    text = read_text(PROJECT_ROOT / "policies" / "blocked_actions.yaml")
    items: set[str] = set()
    active = False
    for raw in text.splitlines():
        line = raw.rstrip()
        if line.startswith("hard_blocked_actions:") or line.startswith("blocked_actions:"):
            active = True
            continue
        if active and line and not line.startswith(" ") and not line.startswith("-"):
            active = False
        if active:
            match = re.match(r"\s*-\s*([A-Za-z0-9_-]+)", line)
            if match:
                items.add(match.group(1))
    return items


def detect_hard_block(text: str) -> list[str]:
    lowered = text.lower()
    blocks = []
    keyword_map = {
        "print_secret": ("print secret", "show secret", "dump env", ".env"),
        "read_private_key": ("private key", "ssh key", ".pem"),
        "read_browser_profile": ("browser profile", "chrome profile", "cookie"),
        "read_password_store": ("keychain", "password store"),
        "exfiltrate_credentials": ("exfiltrate", "send credentials", "upload token"),
        "disable_auth": ("disable auth", "auth_enabled=false"),
        "bind_raw_database_public": ("database public", "db public"),
        "bind_raw_model_public": ("model public", "raw model port"),
        "bind_vector_database_public": ("vector db public", "chroma public", "qdrant public"),
        "disable_security_check": ("disable security", "turn off security"),
        "quota_bypass": ("bypass quota", "free credit bypass"),
        "captcha_bypass": ("bypass captcha", "solve captcha automatically"),
        "spam_non_opt_in": ("spam", "non opt-in", "non-opt-in"),
        "destructive_delete_without_backup": ("rm -rf", "delete without backup"),
        "deploy_failed_tests": ("deploy despite failing", "deploy failed tests"),
        "spend_over_budget_cap": ("ignore budget", "over budget"),
        "linkedin_personal_session_automation": ("linkedin automation", "linkedin session"),
    }
    configured = load_hard_blocks()
    for block, keywords in keyword_map.items():
        if block in configured and any(keyword in lowered for keyword in keywords):
            blocks.append(block)
    return sorted(set(blocks))


def adapter_contract_status(task: dict[str, Any]) -> tuple[str, list[str]]:
    action_type = str(task.get("action_type", ""))
    if action_type in LOCAL_ACTION_TYPES:
        return "not_required_for_local_artifact", []

    adapter = registry_adapter(action_type)
    requirements = tuple(adapter.get("required_fields", ())) or FALLBACK_ADAPTER_REQUIREMENTS.get(action_type)
    if not requirements:
        return "unknown_action_type", [f"unknown action_type: {action_type or 'missing'}"]

    missing: list[str] = []
    if task.get("adapter_contract_validated") is not True:
        missing.append("missing adapter contract validation")
    for field in requirements:
        if task.get(field) in (None, "", False):
            missing.append(f"missing {field}")

    missing.extend(validate_adapter_contract(action_type, task, adapter))

    if missing:
        return "missing", missing
    return "validated", []


def validate_adapter_contract(action_type: str, task: dict[str, Any], adapter: dict[str, Any]) -> list[str]:
    validators = {
        "docker_localhost_start": validate_docker_localhost_start,
        "external_repo_clone": validate_external_repo_clone,
        "provider_api_smoke": validate_provider_api_smoke,
        "mcp_connector_activation": validate_mcp_connector_activation,
    }
    validator = validators.get(action_type)
    if not validator:
        return []
    return validator(task, adapter)


def validate_docker_localhost_start(task: dict[str, Any], adapter: dict[str, Any]) -> list[str]:
    issues: list[str] = []
    bind = str(task.get("localhost_bind", ""))
    allowed_hosts = tuple(adapter.get("loopback_hosts", ("127.0.0.1", "localhost")))
    if bind and not bind.startswith(allowed_hosts):
        issues.append("localhost_bind must use loopback only")
    if "auth_required" in task and adapter.get("require_auth") is True and task.get("auth_required") is not True:
        issues.append("auth_required must be true")
    return issues


def validate_external_repo_clone(task: dict[str, Any], adapter: dict[str, Any]) -> list[str]:
    issues: list[str] = []
    target_repository = str(task.get("target_repository", ""))
    allowed = set(adapter.get("allowed_repositories", []))
    if target_repository and target_repository not in allowed:
        issues.append("target_repository is not allowed")

    prefix = Path(str(adapter.get("allowed_path_prefix", "/Users/sirinx/SIRINXDev/_external_repos"))).expanduser()
    target_path_value = str(task.get("target_path", ""))
    if target_path_value:
        target_path = Path(target_path_value).expanduser()
        try:
            target_path.relative_to(prefix)
        except ValueError:
            issues.append("target_path is outside allowed external repo root")
    return issues


def validate_provider_api_smoke(task: dict[str, Any], adapter: dict[str, Any]) -> list[str]:
    issues: list[str] = []
    provider_name = str(task.get("provider_name", ""))
    providers = adapter.get("providers", {})
    provider = providers.get(provider_name) if isinstance(providers, dict) else None
    if not provider:
        if provider_name:
            issues.append("provider_name is not allowed")
        return issues

    try:
        requested_cap = float(task.get("budget_cap_usd", 0))
    except (TypeError, ValueError):
        issues.append("budget_cap_usd must be numeric")
        return issues
    provider_cap = float(provider.get("budget_cap_usd", 0))
    if requested_cap > provider_cap:
        issues.append("budget_cap_usd exceeds provider cap")
    expected_rate_key = provider.get("rate_limit_key")
    if expected_rate_key and task.get("rate_limit_key") != expected_rate_key:
        issues.append("rate_limit_key does not match provider policy")
    return issues


def validate_mcp_connector_activation(task: dict[str, Any], adapter: dict[str, Any]) -> list[str]:
    issues: list[str] = []
    connector_name = str(task.get("connector_name", ""))
    allowed = set(adapter.get("allowed_connectors", []))
    if connector_name and connector_name not in allowed:
        issues.append("connector_name is not allowed")
    if "auth_required" in task and adapter.get("require_auth") is True and task.get("auth_required") is not True:
        issues.append("auth_required must be true")
    return issues


def command_hash(command: str) -> str:
    normalized = command.replace("\r\n", "\n").replace("\r", "\n")
    return f"sha256:{hashlib.sha256(normalized.encode('utf-8')).hexdigest()}"


def list_field(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [value] if value else []
    if isinstance(value, list):
        return [str(item) for item in value if item not in (None, "")]
    return [str(value)]


def command_hash_metadata(task: dict[str, Any]) -> dict[str, Any]:
    action_type = str(task.get("action_type", ""))
    commands = list_field(task.get("allowed_commands"))
    declared_hashes = list_field(task.get("allowed_command_hashes"))
    computed = [{"command": command, "hash": command_hash(command)} for command in commands]
    computed_hashes = [item["hash"] for item in computed]

    if is_local_action(action_type):
        status = "not_required"
        issues: list[str] = []
    elif not commands and not declared_hashes:
        status = "missing"
        issues = ["missing allowed command hash manifest"]
    elif commands and declared_hashes and set(declared_hashes) != set(computed_hashes):
        status = "mismatch"
        issues = ["declared command hashes do not match allowed_commands"]
    elif commands:
        status = "verified"
        issues = []
    else:
        status = "declared_only"
        issues = []

    return {
        "command_hash_status": status,
        "command_hash_issues": issues,
        "allowed_command_hashes": declared_hashes or computed_hashes,
        "allowed_command_count": len(commands),
        "allowed_commands": computed,
    }


def budget_ledger_metadata(task: dict[str, Any]) -> dict[str, Any]:
    estimated_raw = task.get("estimated_cost_usd", 0)
    cap_raw = task.get("budget_cap_usd", 0)
    try:
        estimated = float(estimated_raw or 0)
        cap = float(cap_raw or 0)
    except (TypeError, ValueError):
        return {
            "budget_ledger_status": "blocked",
            "budget_ledger_issues": ["budget values must be numeric"],
        }

    if estimated <= 0 and cap <= 0:
        return {
            "budget_ledger_status": "not_required",
            "budget_ledger_issues": [],
            "budget_category": task.get("budget_category", "none"),
            "estimated_cost_usd": 0,
            "budget_cap_usd": 0,
        }
    if cap <= 0:
        return {
            "budget_ledger_status": "blocked",
            "budget_ledger_issues": ["budget_cap_usd is required for paid actions"],
            "budget_category": task.get("budget_category", task.get("action_type", "unknown")),
            "estimated_cost_usd": estimated,
            "budget_cap_usd": cap,
        }
    if estimated > cap:
        return {
            "budget_ledger_status": "blocked",
            "budget_ledger_issues": ["estimated_cost_usd exceeds budget_cap_usd"],
            "budget_category": task.get("budget_category", task.get("action_type", "unknown")),
            "estimated_cost_usd": estimated,
            "budget_cap_usd": cap,
        }
    return {
        "budget_ledger_status": "planned",
        "budget_ledger_issues": [],
        "budget_category": task.get("budget_category", task.get("action_type", "unknown")),
        "estimated_cost_usd": estimated,
        "budget_cap_usd": cap,
    }


def rate_ledger_metadata(task: dict[str, Any]) -> dict[str, Any]:
    rate_key = str(task.get("rate_limit_key", ""))
    if not rate_key:
        return {
            "rate_ledger_status": "not_required",
            "rate_ledger_issues": [],
            "rate_limit_key": "",
        }
    if not re.match(r"^[A-Za-z0-9_.:-]+$", rate_key):
        return {
            "rate_ledger_status": "blocked",
            "rate_ledger_issues": ["rate_limit_key contains unsupported characters"],
            "rate_limit_key": rate_key,
        }
    return {
        "rate_ledger_status": "planned",
        "rate_ledger_issues": [],
        "rate_limit_key": rate_key,
    }


def execution_guard_issues(lease: dict[str, Any]) -> list[str]:
    if not is_external_allowed_lease(lease):
        return []
    issues: list[str] = []
    if lease.get("command_hash_status") not in ("verified", "declared_only"):
        issues.extend(list_field(lease.get("command_hash_issues")) or ["command hash verification missing"])
    if lease.get("budget_ledger_status") == "blocked":
        issues.extend(list_field(lease.get("budget_ledger_issues")))
    if lease.get("rate_ledger_status") == "blocked":
        issues.extend(list_field(lease.get("rate_ledger_issues")))
    return issues


def append_jsonl(path: Path, payload: dict[str, Any]) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(mask(payload), ensure_ascii=False, sort_keys=True) + "\n")
    return path


def record_runtime_ledgers(lease: dict[str, Any]) -> dict[str, str]:
    ensure_runtime()
    lease_id = str(lease.get("lease_id", "unknown"))
    recorded: dict[str, str] = {}
    if lease.get("budget_ledger_status") == "planned":
        path = BUDGET_LEDGER_ROOT / f"{today()}.jsonl"
        append_jsonl(
            path,
            {
                "event": "budget_lease_reserved",
                "timestamp": now_iso(),
                "lease_id": lease_id,
                "budget_category": lease.get("budget_category"),
                "estimated_cost_usd": lease.get("estimated_cost_usd", 0),
                "budget_cap_usd": lease.get("budget_cap_usd", 0),
            },
        )
        recorded["budget_ledger"] = str(path)
    if lease.get("rate_ledger_status") == "planned":
        safe_key = re.sub(r"[^A-Za-z0-9_.:-]+", "_", str(lease.get("rate_limit_key", "unknown")))
        path = RATE_LEDGER_ROOT / f"{today()}-{safe_key}.jsonl"
        append_jsonl(
            path,
            {
                "event": "rate_lease_reserved",
                "timestamp": now_iso(),
                "lease_id": lease_id,
                "rate_limit_key": lease.get("rate_limit_key"),
            },
        )
        recorded["rate_ledger"] = str(path)
    if lease.get("command_hash_status") in ("verified", "declared_only"):
        path = COMMAND_HASH_ROOT / f"{lease_id}.json"
        write_json(
            path,
            {
                "lease_id": lease_id,
                "command_hash_status": lease.get("command_hash_status"),
                "allowed_command_hashes": lease.get("allowed_command_hashes", []),
                "allowed_command_count": lease.get("allowed_command_count", 0),
            },
        )
        recorded["command_hash_manifest"] = str(path)
    return recorded


def audit(event: dict[str, Any]) -> Path:
    ensure_runtime()
    entry = {
        "timestamp": now_iso(),
        **mask(event),
    }
    path = AUDIT_ROOT / f"{today()}.jsonl"
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(entry, ensure_ascii=False, sort_keys=True) + "\n")
    return path


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict[str, Any]) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(mask(payload), ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return path


def stable_id(prefix: str, text: str) -> str:
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()[:10]
    stamp = dt.datetime.now().strftime("%Y%m%d%H%M%S")
    return f"{prefix}-{stamp}-{digest}"


def kill_switch_on() -> bool:
    return KILL_SWITCH_FILE.exists()


def parser(description: str) -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description=description)
    p.add_argument("--goal", default="", help="Goal or task text.")
    p.add_argument("--project", default="GHOSTCLAW", help="Project id.")
    p.add_argument("--task-file", type=Path, help="JSON task/manifest path.")
    p.add_argument("--lease-file", type=Path, help="JSON lease path.")
    p.add_argument("--output", type=Path, help="Output path.")
    return p


def load_task(args: argparse.Namespace) -> dict[str, Any]:
    if args.task_file:
        return read_json(args.task_file)
    goal = args.goal.strip()
    if not goal:
        goal = "Generate local autopilot status"
    return {
        "task_id": stable_id("TASK", goal),
        "project": args.project,
        "goal": goal,
        "created_at": now_iso(),
    }


def print_json(payload: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(mask(payload), ensure_ascii=False, indent=2, sort_keys=True) + "\n")

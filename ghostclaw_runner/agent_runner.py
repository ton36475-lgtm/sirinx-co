#!/usr/bin/env python3
"""Local file-queue runner for GHOSTCLAW role inboxes.

The runner is intentionally local-first. By default it does not call an LLM
provider; it reads task envelopes, loads the role prompt, writes a deterministic
outbox result, and records audit logs. Provider calls require both --execute and
--allow-provider-call.
"""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


ROLE_ORDER = ["hermes", "opus", "glm52", "deepseek", "agy", "kob"]
DEFAULT_RUNTIME_ROOT = "~/SIRINXDev/.ghostclaw_runtime/a2a2a"
DEFAULT_LITELLM_URL = "http://127.0.0.1:4000/v1/chat/completions"

SECRET_PATTERNS = [
    re.compile(r"(sk-[A-Za-z0-9_-]{12,})"),
    re.compile(r"(kob_[A-Za-z0-9_-]{8,})"),
    re.compile(r"([A-Za-z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)[A-Za-z0-9_]*=)([^\s]+)", re.I),
    re.compile(r"(Bearer\s+)([A-Za-z0-9._-]+)", re.I),
]


@dataclass(frozen=True)
class AgentSpec:
    role: str
    doctrine_file: str
    fallback_prompt_file: str
    default_model: str
    default_actions: tuple[str, ...]


AGENTS: dict[str, AgentSpec] = {
    "hermes": AgentSpec(
        role="hermes",
        doctrine_file="02_HERMES_COMMANDER_DOCTRINE.md",
        fallback_prompt_file="hermes.md",
        default_model="local/hermes-policy",
        default_actions=(
            "classify mission state",
            "validate dependency order",
            "route next task envelope",
            "write commander audit note",
        ),
    ),
    "opus": AgentSpec(
        role="opus",
        doctrine_file="03_OPUS_ARCHITECTURE_DOCTRINE.md",
        fallback_prompt_file="opus.md",
        default_model="anthropic/claude-opus-4.8",
        default_actions=(
            "review goal and constraints",
            "produce architecture-first plan",
            "define build dependencies",
            "handoff scoped task to Codex",
        ),
    ),
    "glm52": AgentSpec(
        role="glm52",
        doctrine_file="05_GLM_DEEPSEEK_WORKER_DOCTRINE.md",
        fallback_prompt_file="glm52.md",
        default_model="zai/glm-5.2",
        default_actions=(
            "analyze code task locally",
            "draft implementation notes",
            "flag missing context",
            "return patch proposal only",
        ),
    ),
    "deepseek": AgentSpec(
        role="deepseek",
        doctrine_file="05_GLM_DEEPSEEK_WORKER_DOCTRINE.md",
        fallback_prompt_file="deepseek.md",
        default_model="deepseek/deepseek-v4-pro",
        default_actions=(
            "inspect department-specific task",
            "draft focused technical notes",
            "flag risk and verification needs",
            "return worker report only",
        ),
    ),
    "agy": AgentSpec(
        role="agy",
        doctrine_file="05_GLM_DEEPSEEK_WORKER_DOCTRINE.md",
        fallback_prompt_file="agy.md",
        default_model="google/gemini-3.5-flash-high",
        default_actions=(
            "inspect UI and integration task shape",
            "draft fast scaffold notes",
            "flag missing screenshots or acceptance criteria",
            "return report-only implementation hints",
        ),
    ),
    "kob": AgentSpec(
        role="kob",
        doctrine_file="06_KOB_VALIDATOR_DOCTRINE.md",
        fallback_prompt_file="kob.md",
        default_model="kob/local-validator",
        default_actions=(
            "validate command intent",
            "check broker policy",
            "prepare local validation command plan",
            "return no-execution audit record",
        ),
    ),
}


def now_iso() -> str:
    return dt.datetime.now(dt.UTC).replace(microsecond=0).isoformat()


def repo_root_from_file() -> Path:
    return Path(__file__).resolve().parents[1]


def expand_path(value: str | Path) -> Path:
    return Path(os.path.expanduser(str(value))).resolve()


def mask_secret_text(text: str) -> str:
    masked = text
    for pattern in SECRET_PATTERNS:
        if pattern.groups >= 2:
            masked = pattern.sub(lambda match: f"{match.group(1)}<masked>", masked)
        else:
            masked = pattern.sub("<masked>", masked)
    return masked


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True, ensure_ascii=True) + "\n", encoding="utf-8")


def append_jsonl(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(data, sort_keys=True, ensure_ascii=True) + "\n")


def safe_name(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]+", "-", value).strip("-") or "task"


def ensure_runtime(runtime_root: Path) -> None:
    for base in ["inbox", "outbox", "running", "logs"]:
        (runtime_root / base).mkdir(parents=True, exist_ok=True)
    for base in ["pending", "running", "waiting_review", "blocked", "completed", "failed"]:
        (runtime_root / "tasks" / base).mkdir(parents=True, exist_ok=True)
    for role in ROLE_ORDER:
        for base in ["inbox", "outbox", "running"]:
            (runtime_root / base / role).mkdir(parents=True, exist_ok=True)
        for base in ["pending", "running", "waiting_review", "blocked", "completed", "failed"]:
            (runtime_root / "tasks" / base / role).mkdir(parents=True, exist_ok=True)


def kill_switch_active(runtime_root: Path) -> bool:
    return (runtime_root / "kill_switch" / "STOP_ALL").exists()


def load_json(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"invalid JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise ValueError("task envelope must be a JSON object")
    return data


def truthy_lease_flag(value: Any) -> bool:
    return value is True or str(value).strip().lower() in {"true", "1", "yes", "allow", "allowed"}


def parse_lease_time(value: Any) -> dt.datetime | None:
    if not value:
        return None
    text = str(value).strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        parsed = dt.datetime.fromisoformat(text)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=dt.UTC)
    return parsed


def provider_lease_valid(lease: dict[str, Any], now: dt.datetime | None = None) -> tuple[bool, str]:
    now = now or dt.datetime.now(dt.UTC)
    status = str(lease.get("status") or lease.get("decision") or "").strip().lower()
    if status and status not in {"active", "approved", "valid", "allow", "allowed"}:
        return False, f"lease_status_{status}"

    allowed = (
        truthy_lease_flag(lease.get("provider_call_allowed"))
        or truthy_lease_flag(lease.get("allow_provider_call"))
        or truthy_lease_flag(lease.get("allowProviderCall"))
        or truthy_lease_flag(lease.get("valid"))
    )
    if not allowed:
        return False, "provider_call_not_allowed_by_lease"

    expires_at = parse_lease_time(lease.get("expires_at") or lease.get("expiresAt"))
    if expires_at and expires_at <= now:
        return False, "lease_expired"

    if truthy_lease_flag(lease.get("secret_read_allowed")) or truthy_lease_flag(lease.get("external_write_allowed")):
        return False, "lease_requests_blocked_capability"

    return True, "lease_valid"


def load_provider_lease(path_text: str | None) -> tuple[bool, str, dict[str, Any]]:
    if not path_text:
        return False, "missing_provider_lease", {}
    path = expand_path(path_text)
    if not path.exists():
        return False, "provider_lease_not_found", {"path": str(path)}
    try:
        lease = load_json(path)
    except ValueError as exc:
        return False, f"invalid_provider_lease:{exc}", {"path": str(path)}
    valid, reason = provider_lease_valid(lease)
    return valid, reason, {"path": str(path), "lease_id": str(lease.get("lease_id") or lease.get("id") or "")}


def task_files(runtime_root: Path, role: str) -> list[Path]:
    direct = sorted((runtime_root / "inbox" / role).glob("*.json"))
    pending = sorted((runtime_root / "tasks" / "pending").glob(f"*{role}*.json"))
    return direct + pending


def move_task(path: Path, target_dir: Path) -> Path:
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / path.name
    if target.exists():
        stamp = dt.datetime.now().strftime("%H%M%S")
        target = target_dir / f"{path.stem}-{stamp}{path.suffix}"
    path.replace(target)
    return target


def prompt_dir(repo_root: Path) -> Path:
    return repo_root / "ghostclaw_runner" / "prompts"


def load_prompt(repo_root: Path, brain_root: Path, spec: AgentSpec) -> tuple[str, str]:
    doctrine_path = brain_root / spec.doctrine_file
    fallback_path = prompt_dir(repo_root) / spec.fallback_prompt_file
    if doctrine_path.exists():
        return doctrine_path.read_text(encoding="utf-8"), str(doctrine_path)
    if fallback_path.exists():
        return fallback_path.read_text(encoding="utf-8"), str(fallback_path)
    return (
        f"You are the local {spec.role} worker. Produce a safe local-only result.",
        "generated:fallback",
    )


def extract_text(value: Any) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        for key in ["content", "text", "body", "message"]:
            if key in value:
                return extract_text(value[key])
        return json.dumps(value, sort_keys=True, ensure_ascii=True)
    if isinstance(value, list):
        return "\n".join(extract_text(item) for item in value)
    if value is None:
        return ""
    return str(value)


def normalize_task(task: dict[str, Any], path: Path, role: str) -> dict[str, Any]:
    task_id = str(task.get("task_id") or task.get("id") or path.stem)
    goal = extract_text(
        task.get("goal")
        or task.get("input")
        or task.get("message")
        or task.get("content")
        or task.get("payload")
        or ""
    )
    context_refs = task.get("context_refs") or task.get("artifacts") or task.get("source_refs") or []
    if not isinstance(context_refs, list):
        context_refs = [context_refs]
    return {
        "task_id": safe_name(task_id),
        "role": role,
        "raw_to_agent": task.get("to_agent"),
        "raw_from_agent": task.get("from_agent"),
        "goal": mask_secret_text(goal),
        "goal_hash": sha256_text(goal),
        "goal_preview": mask_secret_text(goal[:240]),
        "priority": task.get("priority", "normal"),
        "context_refs": [mask_secret_text(extract_text(item)) for item in context_refs],
    }


def build_local_result(normalized: dict[str, Any], spec: AgentSpec, prompt_source: str, prompt: str, mode: str) -> dict[str, Any]:
    return {
        "created_at": now_iso(),
        "runner": "ghostclaw_agent_runner",
        "status": "dry_run_completed" if mode == "dry-run" else "local_execution_completed",
        "provider_call": False,
        "role": spec.role,
        "model": spec.default_model,
        "prompt_source": prompt_source,
        "prompt_sha256": sha256_text(prompt),
        "task": normalized,
        "output": {
            "summary": (
                f"{spec.role} received task {normalized['task_id']} and generated a local-only "
                "handoff record. No provider, deploy, connector, Docker, or secret access occurred."
            ),
            "planned_actions": list(spec.default_actions),
            "handoff": {
                "next_owner": "codex" if spec.role in {"opus", "glm52", "deepseek", "agy"} else "hermes",
                "requires_human_review": False,
                "safe_to_dispatch_locally": True,
            },
        },
        "safety": {
            "no_provider_call": True,
            "no_secret_read": True,
            "no_external_write": True,
            "no_git_mutation": True,
        },
    }


def call_litellm(url: str, model: str, api_key: str | None, system_prompt: str, user_prompt: str) -> dict[str, Any]:
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 1200,
    }
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as response:  # nosec: local URL by default, opt-in only
        body = response.read().decode("utf-8", errors="replace")
    return json.loads(body)


def build_provider_result(
    normalized: dict[str, Any],
    spec: AgentSpec,
    prompt_source: str,
    prompt: str,
    litellm_url: str,
    model: str,
) -> dict[str, Any]:
    user_prompt = (
        f"Task ID: {normalized['task_id']}\n"
        f"Priority: {normalized['priority']}\n"
        f"Goal:\n{normalized['goal']}\n\n"
        f"Context refs:\n{json.dumps(normalized['context_refs'], indent=2, ensure_ascii=True)}"
    )
    api_key = os.environ.get("LITELLM_API_KEY")
    try:
        response = call_litellm(litellm_url, model, api_key, prompt, user_prompt)
        content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
        return {
            "created_at": now_iso(),
            "runner": "ghostclaw_agent_runner",
            "status": "provider_call_completed",
            "provider_call": True,
            "role": spec.role,
            "model": model,
            "prompt_source": prompt_source,
            "prompt_sha256": sha256_text(prompt),
            "task": normalized,
            "output": {"content": mask_secret_text(content), "raw_response_keys": sorted(response.keys())},
            "safety": {
                "provider_call_opt_in": True,
                "no_secret_logged": True,
                "no_external_write": True,
                "no_git_mutation": True,
            },
        }
    except (urllib.error.URLError, TimeoutError, OSError, KeyError, json.JSONDecodeError) as exc:
        return {
            "created_at": now_iso(),
            "runner": "ghostclaw_agent_runner",
            "status": "provider_call_failed",
            "provider_call": True,
            "role": spec.role,
            "model": model,
            "prompt_source": prompt_source,
            "prompt_sha256": sha256_text(prompt),
            "task": normalized,
            "output": {"error": mask_secret_text(str(exc))},
            "safety": {
                "provider_call_opt_in": True,
                "no_secret_logged": True,
                "no_external_write": True,
                "no_git_mutation": True,
            },
        }


def process_task(
    runtime_root: Path,
    repo_root: Path,
    brain_root: Path,
    role: str,
    path: Path,
    mode: str,
    allow_provider_call: bool,
    litellm_url: str,
    model_override: str | None,
) -> dict[str, Any]:
    spec = AGENTS[role]
    running_path = move_task(path, runtime_root / "running" / role)
    try:
        task = load_json(running_path)
        normalized = normalize_task(task, running_path, role)
        prompt, prompt_source = load_prompt(repo_root, brain_root, spec)
        model = model_override or spec.default_model
        if mode == "execute" and allow_provider_call:
            result = build_provider_result(normalized, spec, prompt_source, prompt, litellm_url, model)
        else:
            result = build_local_result(normalized, spec, prompt_source, prompt, mode)
        out_path = runtime_root / "outbox" / role / f"{normalized['task_id']}.result.json"
        write_json(out_path, result)
        completed_path = move_task(running_path, runtime_root / "tasks" / "completed" / role)
        append_jsonl(
            runtime_root / "logs" / "runner-events.jsonl",
            {
                "created_at": now_iso(),
                "event": "task_completed",
                "role": role,
                "task_id": normalized["task_id"],
                "result_path": str(out_path),
                "completed_path": str(completed_path),
                "provider_call": result["provider_call"],
            },
        )
        return result
    except Exception as exc:  # noqa: BLE001 - write failure artifact instead of crashing the runner loop.
        failed_path = move_task(running_path, runtime_root / "tasks" / "failed" / role)
        result = {
            "created_at": now_iso(),
            "runner": "ghostclaw_agent_runner",
            "status": "failed",
            "provider_call": False,
            "role": role,
            "task": {"task_id": failed_path.stem},
            "output": {"error": mask_secret_text(str(exc)), "failed_path": str(failed_path)},
        }
        out_path = runtime_root / "outbox" / role / f"{failed_path.stem}.failed.json"
        write_json(out_path, result)
        append_jsonl(
            runtime_root / "logs" / "runner-events.jsonl",
            {"created_at": now_iso(), "event": "task_failed", "role": role, "path": str(failed_path)},
        )
        return result


def process_available_tasks(
    runtime_root: Path,
    repo_root: Path,
    brain_root: Path,
    roles: list[str],
    mode: str,
    allow_provider_call: bool,
    litellm_url: str,
    model_override: str | None,
    once: bool,
) -> list[dict[str, Any]]:
    processed: list[dict[str, Any]] = []
    for role in roles:
        for path in task_files(runtime_root, role):
            processed.append(
                process_task(
                    runtime_root=runtime_root,
                    repo_root=repo_root,
                    brain_root=brain_root,
                    role=role,
                    path=path,
                    mode=mode,
                    allow_provider_call=allow_provider_call,
                    litellm_url=litellm_url,
                    model_override=model_override,
                )
            )
            if once:
                return processed
    return processed


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run local GHOSTCLAW role inboxes")
    parser.add_argument("--runtime-root", default=os.environ.get("GHOSTCLAW_A2A2A_RUNTIME", DEFAULT_RUNTIME_ROOT))
    parser.add_argument("--repo-root", default=str(repo_root_from_file()))
    parser.add_argument("--brain-root", default=None)
    parser.add_argument("--agent", choices=[*ROLE_ORDER, "all"], default="all")
    parser.add_argument("--once", action="store_true", help="Process at most one queued task.")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--dry-run", action="store_true", help="Write local deterministic result. This is the default.")
    mode.add_argument("--execute", action="store_true", help="Execute the runner loop. Provider calls still require opt-in.")
    parser.add_argument("--allow-provider-call", action="store_true", help="Allow an opt-in LiteLLM provider call.")
    parser.add_argument(
        "--provider-lease-path",
        default=None,
        help="Command Broker lease JSON required before provider calls are allowed.",
    )
    parser.add_argument("--litellm-url", default=os.environ.get("LITELLM_URL", DEFAULT_LITELLM_URL))
    parser.add_argument("--model", default=None, help="Optional model override for provider calls.")
    parser.add_argument("--watch", action="store_true", help="Poll inboxes repeatedly until stopped or max cycles is reached.")
    parser.add_argument("--poll-interval", type=float, default=5.0, help="Seconds between watch cycles.")
    parser.add_argument("--max-cycles", type=int, default=0, help="Maximum watch cycles. 0 means no limit.")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    runtime_root = expand_path(args.runtime_root)
    repo_root = expand_path(args.repo_root)
    brain_root = expand_path(args.brain_root or repo_root / "_OBSIDIAN_GHOSTCLAW_BRAIN")
    ensure_runtime(runtime_root)

    mode = "execute" if args.execute else "dry-run"
    roles = ROLE_ORDER if args.agent == "all" else [args.agent]
    if mode == "execute" and args.allow_provider_call:
        lease_valid, lease_reason, lease_meta = load_provider_lease(args.provider_lease_path)
        if not lease_valid:
            append_jsonl(
                runtime_root / "logs" / "runner-events.jsonl",
                {
                    "created_at": now_iso(),
                    "event": "blocked",
                    "reason": lease_reason,
                    "lease": lease_meta,
                    "provider_call_requested": True,
                },
            )
            print(f"blocked: provider call requires valid Command Broker lease ({lease_reason})")
            return 2

    processed: list[dict[str, Any]] = []
    cycles = 0
    while True:
        if kill_switch_active(runtime_root):
            append_jsonl(
                runtime_root / "logs" / "runner-events.jsonl",
                {"created_at": now_iso(), "event": "blocked", "reason": "kill_switch_active", "cycle": cycles + 1},
            )
            print("blocked: kill switch active")
            return 2

        cycles += 1
        processed.extend(
            process_available_tasks(
                runtime_root=runtime_root,
                repo_root=repo_root,
                brain_root=brain_root,
                roles=roles,
                mode=mode,
                allow_provider_call=args.allow_provider_call,
                litellm_url=args.litellm_url,
                model_override=args.model,
                once=args.once,
            )
        )

        if not args.watch:
            break
        if args.once and processed:
            break
        if args.max_cycles > 0 and cycles >= args.max_cycles:
            break
        time.sleep(max(0.1, args.poll_interval))

    summary = {
        "created_at": now_iso(),
        "mode": mode,
        "watch": bool(args.watch),
        "cycles": cycles,
        "provider_call_allowed": bool(args.allow_provider_call),
        "processed": len(processed),
        "roles_checked": roles,
    }
    write_json(runtime_root / "logs" / "runner-summary.json", summary)
    print(json.dumps(summary, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

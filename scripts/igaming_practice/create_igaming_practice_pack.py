#!/usr/bin/env python3
"""Create a local-only iGaming engineering practice pack.

This emits markdown/CSV/JSON practice artifacts only. It does not build a real
gaming product, touch payments, call APIs, open ports, or process real user
data.
"""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path


DEFAULT_RUNTIME_ROOT = (
    Path.home()
    / "SIRINXDev"
    / ".ghostclaw_runtime"
    / "igaming_practice"
)


def now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def build_plan(pack_id: str, role: str, focus: str) -> str:
    return f"""# iGaming Engineering Practice Pack

Created: {now_iso()}
Pack ID: {pack_id}
Role: {role}
Focus: {focus}

## Objective

Prepare for a senior/lead full-stack skill test by practicing high-integrity
backend, ledger, realtime, security, and observability work in a local-only
toy environment.

## Safety Boundary

- no real gambling system
- no betting/odds engine
- no real payment provider
- no real crypto transaction
- no public deployment
- no customer/player data
- no secret printing

## Seven-Day Drill

| Day | Drill | Output |
|---|---|---|
| 1 | Architecture whiteboard | one-page system map |
| 2 | Ledger model | schema and transaction examples |
| 3 | Idempotent webhook | replay-safe deposit flow |
| 4 | Concurrency | double-withdrawal race test plan |
| 5 | Realtime | wallet event stream design |
| 6 | Security | origin, secrets, webhook, admin controls |
| 7 | Observability | metrics, alerts, incident drill |

## Interview Story

I focused on correctness first: double-entry ledger, idempotent webhook
handling, transaction boundaries, safe realtime delivery, defensive security,
and measurable observability. I intentionally kept the lab local-only and did
not implement gambling mechanics or real payment movement.
"""


def build_architecture(role: str) -> str:
    return f"""# Local Practice Architecture

Role target: {role}

```text
Browser UI
  -> API Gateway
  -> Auth Guard
  -> Wallet API
  -> Ledger Service
  -> Simulated Payment Webhook
  -> Realtime Event Stream
  -> Audit Log
  -> Metrics Summary
```

## Services

| Service | Responsibility |
|---|---|
| Auth Guard | local test identity and role checks |
| Wallet API | available balance, withdrawal request, balance view |
| Ledger Service | append-only balanced transactions |
| Webhook Simulator | simulated deposit events and replay handling |
| Realtime Stream | balance and withdrawal status events |
| Audit Log | immutable local event record |
| Metrics Summary | latency, errors, duplicate webhooks, ledger rejects |

## Design Principle

Persist and commit authoritative financial state before emitting realtime UI
events. The frontend displays state; it does not decide financial truth.
"""


def build_quiz() -> list[dict[str, str]]:
    return [
        {
            "topic": "ledger",
            "question": "Why should wallet balance not be directly edited without ledger entries?",
            "expected_signal": "Mentions auditability, reconciliation, append-only history, and corrections via reversal transactions.",
        },
        {
            "topic": "idempotency",
            "question": "How do you handle the same payment webhook arriving twice?",
            "expected_signal": "Stores idempotency key, returns duplicate-safe response, and credits exactly once.",
        },
        {
            "topic": "concurrency",
            "question": "Two withdrawals arrive at the same time. How do you prevent double spend?",
            "expected_signal": "Mentions transaction isolation, row/advisory locks, reserved balance, or safe queueing.",
        },
        {
            "topic": "realtime",
            "question": "When should a balance-updated event be emitted?",
            "expected_signal": "After database commit, with rehydration fallback and stale-event protection.",
        },
        {
            "topic": "security",
            "question": "Where should service-role keys live?",
            "expected_signal": "Backend/server only, never frontend, never logs, rotate and scope secrets.",
        },
        {
            "topic": "observability",
            "question": "Which metrics reveal payment or ledger trouble?",
            "expected_signal": "Duplicate webhook count, unbalanced rejects, pending withdrawal age, reconciliation mismatch, error/latency.",
        },
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description="Create local iGaming practice artifacts.")
    parser.add_argument("--pack-id", default="senior-fullstack-ledger-practice")
    parser.add_argument("--role", default="Senior / Lead Full-Stack Developer")
    parser.add_argument("--focus", default="ledger, idempotency, realtime, security, observability")
    parser.add_argument("--runtime-root", default=str(DEFAULT_RUNTIME_ROOT))
    args = parser.parse_args()

    output_dir = Path(args.runtime_root).expanduser() / args.pack_id
    output_dir.mkdir(parents=True, exist_ok=True)

    manifest = {
        "created_at": now_iso(),
        "pack_id": args.pack_id,
        "role": args.role,
        "focus": args.focus,
        "mode": "local_training_only",
        "live_actions": {
            "real_gambling": False,
            "real_payment": False,
            "crypto_transfer": False,
            "public_deploy": False,
            "customer_data": False,
        },
    }

    write_json(output_dir / "practice_manifest.json", manifest)
    write_text(output_dir / "practice_plan.md", build_plan(args.pack_id, args.role, args.focus))
    write_text(output_dir / "local_architecture.md", build_architecture(args.role))
    write_csv(output_dir / "interview_quiz.csv", build_quiz())
    write_text(
        output_dir / "incident_drill.md",
        """# Incident Drill

## Scenario

A simulated payment provider sends the same deposit webhook three times.

## Expected Response

1. Confirm signature and timestamp in the toy simulator.
2. Look up idempotency key.
3. Confirm exactly one ledger transaction was posted.
4. Return duplicate-safe response for replayed events.
5. Record duplicate webhook metric.
6. Add regression test if behavior was not covered.

## Pass Criteria

- no double credit
- balanced ledger
- audit trail links all webhook attempts
- duplicate metric increments
""",
    )
    print(f"created={output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

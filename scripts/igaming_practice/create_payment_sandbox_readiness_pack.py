#!/usr/bin/env python3
"""Create a local-only payment sandbox readiness pack.

This script emits local practice artifacts only. It never connects to a payment
provider, never reads real credentials, never moves money, and never opens a
public callback URL.
"""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path


DEFAULT_RUNTIME_ROOT = Path.home() / "SIRINXDev" / ".ghostclaw_runtime" / "igaming_practice"


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


def sandbox_events() -> list[dict[str, str]]:
    return [
        {
            "case_id": "deposit-ok",
            "event_type": "deposit.confirmed",
            "idempotency_key": "sandbox-deposit-001",
            "amount_minor": "10000",
            "expected_result": "post balanced fake-money deposit once",
        },
        {
            "case_id": "deposit-replay",
            "event_type": "deposit.confirmed",
            "idempotency_key": "sandbox-deposit-001",
            "amount_minor": "10000",
            "expected_result": "return duplicate-safe result and do not credit twice",
        },
        {
            "case_id": "invalid-signature",
            "event_type": "deposit.confirmed",
            "idempotency_key": "sandbox-deposit-002",
            "amount_minor": "10000",
            "expected_result": "reject and create no ledger entry",
        },
        {
            "case_id": "withdrawal-settled",
            "event_type": "withdrawal.settled",
            "idempotency_key": "sandbox-withdrawal-001",
            "amount_minor": "4000",
            "expected_result": "settle once after pending withdrawal exists",
        },
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description="Create payment sandbox readiness artifacts.")
    parser.add_argument("--pack-id", default="payment-provider-sandbox-readiness")
    parser.add_argument("--provider", default="sandbox-provider")
    parser.add_argument("--runtime-root", default=str(DEFAULT_RUNTIME_ROOT))
    args = parser.parse_args()

    output_dir = Path(args.runtime_root).expanduser() / args.pack_id
    output_dir.mkdir(parents=True, exist_ok=True)

    manifest = {
        "created_at": now_iso(),
        "pack_id": args.pack_id,
        "provider": args.provider,
        "mode": "sandbox_only",
        "real_money": False,
        "live_provider_call": False,
        "public_callback_url": False,
        "real_customer_data": False,
    }

    write_json(output_dir / "sandbox_manifest.json", manifest)
    write_csv(output_dir / "sandbox_event_cases.csv", sandbox_events())
    write_text(
        output_dir / "provider_sandbox_contract.md",
        f"""# Provider Sandbox Contract

Created: {now_iso()}
Provider label: {args.provider}

## Contract

All events are fake-money sandbox events. Currency is `TEST`. No live provider
keys are used.

Required fields:

- provider
- eventId
- idempotencyKey
- eventType
- userId
- amountMinor
- currency
- createdAt
- signatureStatus

## Processing Rules

1. Reject invalid signature status.
2. Reject stale timestamp.
3. Reject non-positive amount.
4. Reject unknown event type.
5. Store idempotency key before posting ledger entries.
6. Post only balanced double-entry transactions.
7. Emit realtime event only after commit.
8. Write audit event for every accepted, rejected, and duplicate event.
""",
    )
    write_text(
        output_dir / "live_go_no_go_checklist.md",
        """# Live Go / No-Go Checklist

Live is NO-GO unless every item is true:

- license review complete
- payment provider explicitly allows the use case
- KYC/KYB/AML process ready
- age verification ready
- geofence policy ready
- responsible gambling controls ready
- privacy policy ready
- tax/accounting review complete
- security review and penetration test complete
- incident response plan ready
- reconciliation process ready
- rollback and kill switch ready

If any item is missing, remain in sandbox mode.
""",
    )
    print(f"created={output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""SIRINX spend breaker.

Fail-safe helper for future ops workflows. It does not move money or change ad
accounts. It evaluates reported spend against configured thresholds and emits a
machine-readable decision for approval queues.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict, dataclass


@dataclass
class SpendDecision:
    status: str
    spend_thb: float
    warning_threshold_thb: float
    hard_stop_threshold_thb: float
    action: str
    approval_required: bool


def decide(spend_thb: float, warning_threshold_thb: float, hard_stop_threshold_thb: float) -> SpendDecision:
    if spend_thb >= hard_stop_threshold_thb:
        return SpendDecision(
            status="hard_stop",
            spend_thb=spend_thb,
            warning_threshold_thb=warning_threshold_thb,
            hard_stop_threshold_thb=hard_stop_threshold_thb,
            action="pause_campaigns_pending_human_review",
            approval_required=True,
        )
    if spend_thb >= warning_threshold_thb:
        return SpendDecision(
            status="warning",
            spend_thb=spend_thb,
            warning_threshold_thb=warning_threshold_thb,
            hard_stop_threshold_thb=hard_stop_threshold_thb,
            action="notify_ops_and_require_review_before_scale",
            approval_required=True,
        )
    return SpendDecision(
        status="ok",
        spend_thb=spend_thb,
        warning_threshold_thb=warning_threshold_thb,
        hard_stop_threshold_thb=hard_stop_threshold_thb,
        action="no_change",
        approval_required=False,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate spend thresholds without making external changes.")
    parser.add_argument("--spend-thb", type=float, required=True)
    parser.add_argument("--warning-thb", type=float, default=5000.0)
    parser.add_argument("--hard-stop-thb", type=float, default=10000.0)
    args = parser.parse_args()

    if args.warning_thb < 0 or args.hard_stop_thb <= 0 or args.warning_thb > args.hard_stop_thb:
        print("Invalid thresholds", file=sys.stderr)
        return 2

    print(json.dumps(asdict(decide(args.spend_thb, args.warning_thb, args.hard_stop_thb)), ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

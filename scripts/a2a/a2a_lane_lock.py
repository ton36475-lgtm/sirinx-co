#!/usr/bin/env python3
"""Acquire, release, or inspect A2A executor lane locks."""

from __future__ import annotations

import argparse
from pathlib import Path

from _common import ensure_runtime, now_iso, read_json, runtime_path, slugify, write_json


def lock_path(lane: str) -> Path:
    return runtime_path("state", "lane_locks", f"{slugify(lane)}.json")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Manage local A2A lane locks")
    sub = parser.add_subparsers(dest="command", required=True)

    acquire = sub.add_parser("acquire")
    acquire.add_argument("--lane", required=True)
    acquire.add_argument("--executor", required=True)
    acquire.add_argument("--lease-id", required=True)

    release = sub.add_parser("release")
    release.add_argument("--lane", required=True)
    release.add_argument("--executor", required=True)
    release.add_argument("--lease-id", required=True)

    status = sub.add_parser("status")
    status.add_argument("--lane", default="")
    return parser


def acquire(lane: str, executor: str, lease_id: str) -> int:
    path = lock_path(lane)
    if path.exists():
        current = read_json(path)
        if current.get("executor") != executor or current.get("lease_id") != lease_id:
            report = {
                "created_at": now_iso(),
                "status": "blocked",
                "reason": "lane_already_locked",
                "requested": {"lane": slugify(lane), "executor": executor, "lease_id": lease_id},
                "current": current,
            }
            out = runtime_path("quarantined", f"lane-lock-{slugify(lane)}.json")
            write_json(out, report)
            print(f"blocked {out}")
            return 2
    payload = {
        "created_at": now_iso(),
        "updated_at": now_iso(),
        "lane": slugify(lane),
        "executor": executor,
        "lease_id": lease_id,
        "status": "locked",
    }
    write_json(path, payload)
    print(f"locked {path}")
    return 0


def release(lane: str, executor: str, lease_id: str) -> int:
    path = lock_path(lane)
    if not path.exists():
        print("no lock")
        return 0
    current = read_json(path)
    if current.get("executor") != executor or current.get("lease_id") != lease_id:
        print("blocked: lock owned by another executor or lease")
        return 2
    path.unlink()
    print(f"released {path}")
    return 0


def status(lane: str) -> int:
    if lane:
        paths = [lock_path(lane)]
    else:
        paths = sorted(runtime_path("state", "lane_locks").glob("*.json"))
    if not paths:
        print("no locks")
        return 0
    for path in paths:
        if path.exists():
            print(path.read_text(encoding="utf-8").strip())
    return 0


def main() -> int:
    args = build_parser().parse_args()
    ensure_runtime()
    if args.command == "acquire":
        return acquire(args.lane, args.executor, args.lease_id)
    if args.command == "release":
        return release(args.lane, args.executor, args.lease_id)
    return status(args.lane)


if __name__ == "__main__":
    raise SystemExit(main())

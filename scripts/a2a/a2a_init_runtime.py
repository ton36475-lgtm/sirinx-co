#!/usr/bin/env python3
"""Initialize the local A2A runtime folder tree."""

from __future__ import annotations

from _common import RUNTIME_DIRS, RUNTIME_ROOT, ensure_runtime, now_iso, write_json


def main() -> int:
    ensure_runtime()
    state = {
        "runtime_root": str(RUNTIME_ROOT),
        "created_at": now_iso(),
        "dirs": RUNTIME_DIRS,
        "transport": "local_file_queue",
        "public_server_enabled": False,
        "default_mode": "dry_run",
    }
    write_json(RUNTIME_ROOT / "state" / "runtime.json", state)
    print(f"initialized {RUNTIME_ROOT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

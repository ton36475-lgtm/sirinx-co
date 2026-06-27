#!/usr/bin/env python3
"""Write queue state counts for the local A2A runtime."""

from __future__ import annotations

from _common import ensure_runtime, kill_switch_active, now_iso, runtime_path, summarize_counts, write_json


def main() -> int:
    ensure_runtime()
    state = {"created_at": now_iso(), "kill_switch_active": kill_switch_active(), "queue_counts": summarize_counts()}
    out = runtime_path("state", "queue_state.json")
    write_json(out, state)
    print(f"wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Collect A2A artifact references into one manifest."""

from __future__ import annotations

from _common import ensure_runtime, now_iso, runtime_path, write_json


def main() -> int:
    ensure_runtime()
    artifacts = sorted(str(path) for path in runtime_path("artifacts").glob("*"))
    manifest = {"created_at": now_iso(), "artifact_count": len(artifacts), "artifacts": artifacts}
    out = runtime_path("state", "artifact_manifest.json")
    write_json(out, manifest)
    print(f"wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

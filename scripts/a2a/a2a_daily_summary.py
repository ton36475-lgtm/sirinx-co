#!/usr/bin/env python3
"""Write a markdown daily summary for A2A runtime state."""

from __future__ import annotations

from _common import ensure_runtime, kill_switch_active, now_iso, runtime_path, summarize_counts, write_text


def main() -> int:
    ensure_runtime()
    counts = summarize_counts()
    lines = [
        "# A2A Daily Summary",
        "",
        f"- Created at: {now_iso()}",
        f"- Kill switch active: {kill_switch_active()}",
        "- Queue counts:",
    ]
    for name, count in sorted(counts.items()):
        lines.append(f"  - {name}: {count}")
    lines.extend(
        [
            "",
            "## Notes",
            "",
            "- Scaffolding phase uses local file queue transport.",
            "- No provider call, repo clone, Docker start, deploy, publish, push, or public endpoint is required for this summary.",
        ]
    )
    out = runtime_path("memory", "daily_summary.md")
    write_text(out, "\n".join(lines) + "\n")
    print(f"wrote {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

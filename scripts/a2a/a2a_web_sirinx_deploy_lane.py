#!/usr/bin/env python3
"""Create a local-only web-sirinx generated-assets and deploy-lane manifest."""

from __future__ import annotations

import json
import re
import subprocess
from collections import Counter
from pathlib import Path
from typing import Any

from _common import ensure_runtime, now_iso, runtime_path, write_json, write_text
from a2a_command_broker import decide, load_policy

REPO_ROOT = Path(__file__).resolve().parents[2]
WEB_ROOT = REPO_ROOT / "apps" / "web-sirinx"
DIST_ROOT = WEB_ROOT / "dist" / "public"
FIXTURE_PATH = REPO_ROOT / "apps" / "mission-control" / "src" / "fixtures" / "webSirinxDeployStatus.json"

BROKER_ACTIONS = [
    "inspect",
    "web_sirinx_dist_manifest",
    "web_sirinx_static_asset_check",
    "web_sirinx_build_validation",
    "simulate_deploy_plan",
    "web_sirinx_pages_deploy",
    "deploy",
    "production_deploy",
    "push",
    "approve_all_actions",
]


def git_status(paths: list[str]) -> list[dict[str, str]]:
    proc = subprocess.run(
        ["git", "status", "--porcelain=v1", "--", *paths],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    if proc.returncode != 0:
        return [{"status": "!!", "path": proc.stderr.strip() or "git status failed"}]
    rows: list[dict[str, str]] = []
    for raw in proc.stdout.splitlines():
        if not raw:
            continue
        rows.append({"status": raw[:2], "path": raw[3:]})
    return rows


def status_counts(rows: list[dict[str, str]]) -> dict[str, int]:
    counts: Counter[str] = Counter()
    for row in rows:
        status = row["status"].strip() or "M"
        path = row["path"]
        if "/dist/public/assets/" in path:
            bucket = "asset"
        elif path.endswith(".html"):
            bucket = "html"
        elif path.endswith(("sitemap.xml", "robots.txt", "manifest.json", "_headers", "_redirects")):
            bucket = "static_config"
        else:
            bucket = "source_or_other"
        counts[f"{status}:{bucket}"] += 1
        counts[f"{status}:total"] += 1
    return dict(sorted(counts.items()))


def static_file_snapshot() -> list[dict[str, Any]]:
    required = ["_headers", "_redirects", "sitemap.xml", "robots.txt", "manifest.json", "index.html"]
    rows = []
    for name in required:
        path = DIST_ROOT / name
        rows.append(
            {
                "name": name,
                "path": str(path),
                "exists": path.exists(),
                "bytes": path.stat().st_size if path.exists() else 0,
            }
        )
    return rows


def collect_asset_reference_issues(limit: int = 80) -> list[dict[str, str]]:
    if not DIST_ROOT.exists():
        return [{"html": str(DIST_ROOT), "asset": "", "issue": "dist_public_missing"}]
    pattern = re.compile(r"""(?:src|href)=["']/?(assets/[^"']+)["']""")
    issues: list[dict[str, str]] = []
    for html_path in sorted(DIST_ROOT.rglob("*.html")):
        text = html_path.read_text(encoding="utf-8", errors="replace")
        for asset in sorted(set(pattern.findall(text))):
            asset_path = DIST_ROOT / asset
            if not asset_path.exists():
                issues.append(
                    {
                        "html": str(html_path.relative_to(REPO_ROOT)),
                        "asset": asset,
                        "issue": "referenced_asset_missing",
                    }
                )
                if len(issues) >= limit:
                    return issues
    return issues


def file_counts() -> dict[str, int]:
    if not DIST_ROOT.exists():
        return {"distExists": 0, "htmlFiles": 0, "assetFiles": 0, "totalFiles": 0}
    return {
        "distExists": 1,
        "htmlFiles": len(list(DIST_ROOT.rglob("*.html"))),
        "assetFiles": len(list((DIST_ROOT / "assets").glob("*"))) if (DIST_ROOT / "assets").exists() else 0,
        "totalFiles": len([path for path in DIST_ROOT.rglob("*") if path.is_file()]),
    }


def broker_decisions() -> list[dict[str, str]]:
    policy = load_policy()
    rows = []
    for action in BROKER_ACTIONS:
        result = decide(policy, "codex-local", action, "canonical_remote_pending")
        rows.append(
            {
                "tool": "codex-local",
                "action": action,
                "decision": result.get("decision", "blocked"),
                "reason": result.get("reason", ""),
                "requiredGate": result.get("required_gate", ""),
            }
        )
    return rows


def build_report() -> dict[str, Any]:
    ensure_runtime()
    dist_rows = git_status(["apps/web-sirinx/dist/public"])
    source_rows = git_status(
        [
            "apps/web-sirinx/package.json",
            "apps/web-sirinx/server/_core",
            "apps/web-sirinx/client/src",
            "apps/web-sirinx/vite.config.ts",
            "apps/web-sirinx/server/staticSeoBuild.ts",
        ]
    )
    issues = collect_asset_reference_issues()
    decisions = broker_decisions()
    decision_counts = dict(Counter(item["decision"] for item in decisions))
    deploy_blocked = any(
        item["action"] in {"web_sirinx_pages_deploy", "deploy", "production_deploy", "push"}
        and item["decision"].startswith("blocked")
        for item in decisions
    )
    report = {
        "updatedAt": now_iso(),
        "mode": "local_read_only_web_sirinx_deploy_lane",
        "generatedBy": "scripts/a2a/a2a_web_sirinx_deploy_lane.py",
        "summary": {
            "distChangedFiles": len(dist_rows),
            "sourceChangedFiles": len(source_rows),
            "htmlFiles": file_counts()["htmlFiles"],
            "assetFiles": file_counts()["assetFiles"],
            "missingAssetReferences": len(issues),
            "brokerDecisionCounts": decision_counts,
            "deployBlocked": deploy_blocked,
            "overallStatus": "deploy_blocked_local_manifest_ready" if deploy_blocked else "ready_for_deploy_preflight",
        },
        "distFileCounts": file_counts(),
        "distGitStatusCounts": status_counts(dist_rows),
        "sourceGitStatusCounts": status_counts(source_rows),
        "staticFiles": static_file_snapshot(),
        "assetReferenceIssues": issues,
        "brokerDecisions": decisions,
        "distChangedSamples": dist_rows[:80],
        "sourceChangedSamples": source_rows[:40],
        "policyBoundary": [
            "read_only_manifest",
            "no_git_add_dot",
            "no_push",
            "no_cloudflare_deploy",
            "no_wrangler_publish",
            "no_provider_call",
            "no_secret_read_or_print",
            "deploy_requires_clean_scoped_lane",
            "deploy_requires_cloudflare_target_and_rollback_plan",
        ],
        "nextSafeActions": [
            "Review asset reference issues before staging dist assets.",
            "Run web-sirinx check, test, and build in a clean scoped lane before deploy.",
            "Stage only web-sirinx source plus matching generated dist assets after validation.",
            "Deploy to Cloudflare Pages only after target/auth/rollback evidence is bound.",
        ],
    }
    return report


def build_markdown(report: dict[str, Any]) -> str:
    lines = [
        "# web-sirinx Generated Assets and Deploy Lane",
        "",
        f"- Created: `{report['updatedAt']}`",
        f"- Mode: `{report['mode']}`",
        f"- Status: `{report['summary']['overallStatus']}`",
        f"- Dist changed files: `{report['summary']['distChangedFiles']}`",
        f"- Source changed files: `{report['summary']['sourceChangedFiles']}`",
        f"- HTML files: `{report['summary']['htmlFiles']}`",
        f"- Asset files: `{report['summary']['assetFiles']}`",
        f"- Missing asset references: `{report['summary']['missingAssetReferences']}`",
        "",
        "## Boundary",
        "",
    ]
    lines.extend(f"- `{item}`" for item in report["policyBoundary"])
    lines.extend(["", "## Static Files", ""])
    for item in report["staticFiles"]:
        lines.append(f"- `{item['name']}` exists=`{str(item['exists']).lower()}` bytes=`{item['bytes']}`")
    lines.extend(["", "## Broker Decisions", ""])
    for item in report["brokerDecisions"]:
        lines.append(
            f"- `{item['decision']}` `{item['tool']}/{item['action']}` - {item['reason']} "
            f"(gate: `{item['requiredGate'] or 'none'}`)"
        )
    lines.extend(["", "## Asset Reference Issues", ""])
    if report["assetReferenceIssues"]:
        lines.extend(
            f"- `{item['issue']}` `{item['html']}` -> `{item['asset']}`"
            for item in report["assetReferenceIssues"]
        )
    else:
        lines.append("- none")
    lines.extend(["", "## Next Safe Actions", ""])
    lines.extend(f"- {item}" for item in report["nextSafeActions"])
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    report = build_report()
    json_path = runtime_path("logs", "web_sirinx_deploy_lane.json")
    markdown_path = runtime_path("logs", "web_sirinx_deploy_lane.md")
    write_json(json_path, report)
    write_text(markdown_path, build_markdown(report))
    write_json(FIXTURE_PATH, report)
    print(
        json.dumps(
            {
                "fixture": str(FIXTURE_PATH),
                "json_report": str(json_path),
                "markdown_report": str(markdown_path),
                "dist_changed_files": report["summary"]["distChangedFiles"],
                "source_changed_files": report["summary"]["sourceChangedFiles"],
                "missing_asset_references": report["summary"]["missingAssetReferences"],
                "overall_status": report["summary"]["overallStatus"],
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

from sirinx_graph_memory.mcp_server import READ_ONLY_TOOL_NAMES, tool_specs
from sirinx_graph_memory.obsidian_projection import inventory_vault, project_vault
from sirinx_graph_memory.paths import RUNTIME_ENV


def test_advertised_tools_are_exact_read_only_set():
    tools = tool_specs()
    names = tuple(tool.name for tool in tools)
    assert names == READ_ONLY_TOOL_NAMES
    assert {
        "list_prs",
        "get_pr_impact",
        "triage_prs",
    }.isdisjoint(names)
    forbidden_fragments = (
        "github",
        "approve",
        "delete",
        "admin",
        "write",
        "save",
        "reflect",
        "triage",
    )
    assert all(
        not any(fragment in name.lower() for fragment in forbidden_fragments)
        for name in names
    )
    for tool in tools:
        assert tool.inputSchema["additionalProperties"] is False
        assert "project_path" not in tool.inputSchema["properties"]
        assert "graph_path" not in tool.inputSchema["properties"]


def test_stdio_server_lists_only_read_tools(sample_graph, tmp_path: Path):
    vault = tmp_path / "SIRINX"
    vault.mkdir()
    (vault / "Architecture.md").write_text(
        "# Architecture\n\nHermes coordinates a local graph memory fabric.\n",
        encoding="utf-8",
    )
    inventory = inventory_vault(vault)
    project_vault(vault, expected_inventory_digest=inventory.snapshot_digest)
    projection_digest = "sha256:" + ("a" * 10) + "0087420123" + ("b" * 44)
    projection_root = sample_graph.parents[1] / "obsidian-projection"
    original_projection = projection_root / inventory.snapshot_digest.removeprefix(
        "sha256:"
    )
    selected_projection = projection_root / projection_digest.removeprefix("sha256:")
    original_projection.rename(selected_projection)
    projection_manifest_path = selected_projection / "manifest.json"
    projection_manifest = json.loads(
        projection_manifest_path.read_text(encoding="utf-8")
    )
    projection_manifest["snapshot_digest"] = projection_digest
    projection_manifest_path.write_text(
        json.dumps(projection_manifest, sort_keys=True),
        encoding="utf-8",
    )
    graph = json.loads(sample_graph.read_text(encoding="utf-8"))
    graph["nodes"].extend(
        [
            {
                "id": "src/contact.py::contact",
                "label": "contact",
                "source_file": "/Users/sirinx/repo/owner@example.com",
                "file_type": "function",
                "community": 0,
            },
            {
                "id": "src/credential.py::credential_source",
                "label": "credential_source",
                "source_file": "sk-proj-123456789012345678901234567890",
                "file_type": "function",
                "community": 0,
            },
        ]
    )
    sample_graph.write_text(json.dumps(graph, sort_keys=True), encoding="utf-8")

    async def run():
        env = dict(os.environ)
        env[RUNTIME_ENV] = str(sample_graph.parents[1])
        parameters = StdioServerParameters(
            command=sys.executable,
            args=["-m", "sirinx_graph_memory.cli", "serve-readonly"],
            env=env,
        )
        async with stdio_client(parameters) as streams:
            async with ClientSession(streams[0], streams[1]) as session:
                await session.initialize()
                tools = await session.list_tools()
                assert tuple(tool.name for tool in tools.tools) == READ_ONLY_TOOL_NAMES
                result = await session.call_tool("graph_stats", {})
                assert "Nodes: 4" in result.content[0].text
                snapshot_info = await session.call_tool(
                    "obsidian_snapshot_info",
                    {"snapshot_digest": projection_digest},
                )
                assert projection_digest in snapshot_info.content[0].text
                assert "REDACTED_PHONE" not in snapshot_info.content[0].text
                projection = await session.call_tool(
                    "query_obsidian_projection",
                    {
                        "snapshot_digest": projection_digest,
                        "query": "Hermes graph memory",
                        "limit": 2,
                        "max_chars": 3000,
                    },
                )
                assert projection_digest in projection.content[0].text
                assert "local graph memory fabric" in projection.content[0].text
                assert '"provider_calls":0' in projection.content[0].text

                pii_result = await session.call_tool("get_node", {"label": "contact"})
                assert "owner@example.com" not in pii_result.content[0].text
                assert "/Users/sirinx" not in pii_result.content[0].text
                assert "[REDACTED_EMAIL]" in pii_result.content[0].text
                assert "/Users/[REDACTED_USER]" in pii_result.content[0].text

                secret_argument = "sk-proj-123456789012345678901234567890"
                denied_input = await session.call_tool(
                    "query_graph", {"question": secret_argument}
                )
                assert denied_input.isError is True
                assert denied_input.content[0].text == "Policy error: request denied"
                assert secret_argument not in denied_input.content[0].text

                denied_output = await session.call_tool(
                    "get_node", {"label": "credential_source"}
                )
                assert denied_output.isError is True
                assert denied_output.content[0].text == "Policy error: request denied"
                assert "sk-proj-" not in denied_output.content[0].text

                unknown = await session.call_tool("unknown_tool", {})
                assert unknown.isError is True

    asyncio.run(run())

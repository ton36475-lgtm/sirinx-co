"""Read-only, fixed-root MCP server over stdio only."""

from __future__ import annotations

import asyncio
from typing import Any

from mcp import types
from mcp.server import Server
from mcp.server.stdio import stdio_server

from .errors import GraphMemoryPolicyError
from .paths import graph_path
from .readonly_graph import ReadOnlyCodeGraph
from .readonly_projection import ReadOnlyObsidianProjection
from .security import secret_kinds

READ_ONLY_TOOL_NAMES = (
    "query_graph",
    "get_node",
    "get_neighbors",
    "get_community",
    "god_nodes",
    "graph_stats",
    "shortest_path",
    "obsidian_snapshot_info",
    "query_obsidian_projection",
)


def tool_specs() -> list[types.Tool]:
    return [
        types.Tool(
            name="query_graph",
            description="Read structural code context from the fixed local graph.",
            inputSchema={
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "question": {"type": "string", "minLength": 1, "maxLength": 500},
                    "mode": {
                        "type": "string",
                        "enum": ["bfs", "dfs"],
                        "default": "bfs",
                    },
                    "depth": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 6,
                        "default": 3,
                    },
                    "token_budget": {
                        "type": "integer",
                        "minimum": 100,
                        "maximum": 8000,
                        "default": 2000,
                    },
                    "context_filter": {
                        "type": "array",
                        "maxItems": 8,
                        "items": {"type": "string", "maxLength": 64},
                    },
                },
                "required": ["question"],
            },
        ),
        types.Tool(
            name="get_node",
            description="Read one code-graph node from the fixed local graph.",
            inputSchema={
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "label": {"type": "string", "minLength": 1, "maxLength": 256}
                },
                "required": ["label"],
            },
        ),
        types.Tool(
            name="get_neighbors",
            description="Read direct neighbors of one code-graph node.",
            inputSchema={
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "label": {"type": "string", "minLength": 1, "maxLength": 256},
                    "relation_filter": {"type": "string", "maxLength": 64},
                },
                "required": ["label"],
            },
        ),
        types.Tool(
            name="get_community",
            description="Read members of one local graph community.",
            inputSchema={
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "community_id": {
                        "type": "integer",
                        "minimum": 0,
                        "maximum": 100000,
                    }
                },
                "required": ["community_id"],
            },
        ),
        types.Tool(
            name="god_nodes",
            description="Read the most connected nodes in the fixed local graph.",
            inputSchema={
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "top_n": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 100,
                        "default": 10,
                    }
                },
            },
        ),
        types.Tool(
            name="graph_stats",
            description="Read node, edge, community, and confidence counts.",
            inputSchema={
                "type": "object",
                "additionalProperties": False,
                "properties": {},
            },
        ),
        types.Tool(
            name="shortest_path",
            description="Read a bounded shortest path between two code concepts.",
            inputSchema={
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "source": {"type": "string", "minLength": 1, "maxLength": 256},
                    "target": {"type": "string", "minLength": 1, "maxLength": 256},
                    "max_hops": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 20,
                        "default": 8,
                    },
                },
                "required": ["source", "target"],
            },
        ),
        types.Tool(
            name="obsidian_snapshot_info",
            description=(
                "Verify and describe one exact sanitized Obsidian projection snapshot."
            ),
            inputSchema={
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "snapshot_digest": {
                        "type": "string",
                        "pattern": "^sha256:[0-9a-f]{64}$",
                    }
                },
                "required": ["snapshot_digest"],
            },
        ),
        types.Tool(
            name="query_obsidian_projection",
            description=(
                "Query one exact sanitized Obsidian projection with bounded results."
            ),
            inputSchema={
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "snapshot_digest": {
                        "type": "string",
                        "pattern": "^sha256:[0-9a-f]{64}$",
                    },
                    "query": {"type": "string", "minLength": 1, "maxLength": 256},
                    "limit": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 8,
                        "default": 5,
                    },
                    "max_chars": {
                        "type": "integer",
                        "minimum": 2000,
                        "maximum": 12000,
                        "default": 6000,
                    },
                },
                "required": ["snapshot_digest", "query"],
            },
        ),
    ]


def build_server() -> Server:
    graph = ReadOnlyCodeGraph(graph_path())
    projection = ReadOnlyObsidianProjection()
    server = Server("sirinx-graph-memory-readonly")
    handlers = {
        "query_graph": graph.query_graph,
        "get_node": graph.get_node,
        "get_neighbors": graph.get_neighbors,
        "get_community": graph.get_community,
        "god_nodes": graph.god_nodes,
        "graph_stats": graph.graph_stats,
        "shortest_path": graph.shortest_path,
        "obsidian_snapshot_info": projection.snapshot_info,
        "query_obsidian_projection": projection.query,
    }

    @server.list_tools()
    async def list_tools() -> list[types.Tool]:
        return tool_specs()

    @server.call_tool()
    async def call_tool(
        name: str, arguments: dict[str, Any] | None
    ) -> types.CallToolResult:
        is_error = False
        try:
            safe_arguments = dict(arguments or {})
            if secret_kinds(safe_arguments):
                raise GraphMemoryPolicyError("request denied")
            handler = handlers.get(name)
            if handler is None:
                raise GraphMemoryPolicyError("unknown read-only tool")
            else:
                result = handler(safe_arguments)
            if not isinstance(result, str) or secret_kinds({"result": result}):
                raise GraphMemoryPolicyError("response denied")
        except GraphMemoryPolicyError:
            # Never echo policy exceptions: upstream messages or user input
            # could contain the secret/PII that caused the denial.
            result = "Policy error: request denied"
            is_error = True
        except Exception:
            result = "Graph query failed"
            is_error = True
        return types.CallToolResult(
            content=[types.TextContent(type="text", text=result)],
            isError=is_error,
        )

    return server


def serve_stdio() -> None:
    server = build_server()

    async def run() -> None:
        async with stdio_server() as streams:
            await server.run(
                streams[0],
                streams[1],
                server.create_initialization_options(),
            )

    asyncio.run(run())

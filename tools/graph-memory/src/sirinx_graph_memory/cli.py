"""Narrow CLI. There are deliberately no approve/delete/admin commands."""

from __future__ import annotations

import argparse
import json
import sys

from pydantic import ValidationError

from .context_contract import (
    MAX_CONTEXT_REQUEST_BYTES,
    canonical_bundle_json,
    parse_context_request_json,
    retrieve_context_bundle,
)
from .errors import GraphMemoryPolicyError, SecretDetectedError
from .graph_index import build_code_graph
from .mcp_server import READ_ONLY_TOOL_NAMES, serve_stdio
from .obsidian_projection import (
    inventory_canonical_vault,
    project_canonical_vault,
)
from .queue import list_proposals
from .workflow import submit_proposal_json

COMMAND_NAMES = (
    "index",
    "serve-readonly",
    "propose",
    "list-proposals",
    "obsidian-inventory",
    "obsidian-project",
    "retrieve-context",
    "policy",
)


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="sirinx-graph-memory")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("index", help="build fixed local code-only graph")

    subparsers.add_parser("serve-readonly", help="serve fixed graph via stdio MCP only")
    subparsers.add_parser("propose", help="read one proposal JSON object from stdin")

    listing = subparsers.add_parser(
        "list-proposals", help="read sanitized queued proposals"
    )
    listing.add_argument("--limit", type=int, default=20)
    subparsers.add_parser(
        "obsidian-inventory",
        help="explicitly inventory the fixed canonical vault read-only",
    )
    project = subparsers.add_parser(
        "obsidian-project",
        help="project the fixed vault after an exact inventory digest",
    )
    project.add_argument("--inventory-digest", required=True)
    subparsers.add_parser(
        "retrieve-context",
        help="read one fixed-root ContextBundleV1 request from stdin",
    )
    subparsers.add_parser("policy", help="print the fixed capability policy")
    return parser


def _print_json(value) -> None:
    print(json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2))


def _read_bounded_stdin(*, name: str, max_bytes: int) -> str:
    binary = getattr(sys.stdin, "buffer", None)
    if binary is not None:
        payload = binary.read(max_bytes + 1)
        if len(payload) > max_bytes:
            raise GraphMemoryPolicyError(f"{name} exceeds 64 KiB")
        try:
            return payload.decode("utf-8")
        except UnicodeDecodeError:
            raise GraphMemoryPolicyError(f"{name} must be UTF-8") from None
    payload = sys.stdin.read(max_bytes + 1)
    if len(payload.encode("utf-8")) > max_bytes:
        raise GraphMemoryPolicyError(f"{name} exceeds 64 KiB")
    return payload


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    try:
        if args.command == "index":
            _print_json(build_code_graph())
        elif args.command == "serve-readonly":
            serve_stdio()
        elif args.command == "propose":
            payload = sys.stdin.read(65537)
            if len(payload.encode("utf-8")) > 65536:
                raise GraphMemoryPolicyError("proposal payload exceeds 64 KiB")
            print(submit_proposal_json(payload))
        elif args.command == "list-proposals":
            _print_json(list_proposals(limit=args.limit))
        elif args.command == "obsidian-inventory":
            _print_json(inventory_canonical_vault())
        elif args.command == "obsidian-project":
            _print_json(project_canonical_vault(args.inventory_digest))
        elif args.command == "retrieve-context":
            payload = _read_bounded_stdin(
                name="context request",
                max_bytes=MAX_CONTEXT_REQUEST_BYTES,
            )
            request = parse_context_request_json(payload)
            print(canonical_bundle_json(retrieve_context_bundle(request)))
        elif args.command == "policy":
            _print_json(
                {
                    "authority": "HERMES_OBSIDIAN",
                    "agent_access": "READ_ALL_WRITE_PROPOSAL_ONLY",
                    "mcp_transport": "stdio",
                    "provider_call": "DENY",
                    "external_write": "DENY",
                    "mcp_tools": list(READ_ONLY_TOOL_NAMES),
                    "commands": list(COMMAND_NAMES),
                }
            )
        return 0
    except SecretDetectedError as exc:
        print(str(exc), file=sys.stderr)
        return 3
    except (GraphMemoryPolicyError, ValidationError) as exc:
        # Validation errors are safe here because secret-shaped input was
        # rejected before Pydantic validation.
        boundary = "context" if args.command == "retrieve-context" else "proposal"
        print(f"{boundary} policy error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())

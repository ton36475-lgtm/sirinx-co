# SIRINX Shared Graph Memory (local-only)

This package provides two deliberately separate local capabilities:

1. a Graphify code-only index with a read-only MCP surface over stdio; and
2. a LangGraph/LangChain proposal workflow that queues sanitized memory
   candidates for Hermes review.

It is not a durable memory authority. Hermes plus the canonical SIRINX
Obsidian vault remain authoritative. This package cannot approve, delete, or
write Obsidian memory.

## Safety boundary

- no provider inference
- no HTTP MCP transport
- no Graphify installer, hook, or automatic agent configuration
- no global install
- no PR/GitHub tools on the MCP surface
- no arbitrary graph path on the MCP surface
- no raw secret persistence
- no raw ContextBundle query persistence
- proposal queue is append-only and project-local

The upstream Graphify MCP advertises GitHub/PR tools in addition to graph
queries. This package therefore does **not** launch `graphify-mcp` directly.
It exposes only:

`query_graph`, `get_node`, `get_neighbors`, `get_community`, `god_nodes`,
`graph_stats`, `shortest_path`, `obsidian_snapshot_info`, and
`query_obsidian_projection`.

## Project-local setup

From this directory:

```bash
uv sync --locked
uv run pytest
```

No global or user configuration is written.

## Build the code graph

```bash
uv run sirinx-graph-memory index
```

The wrapper runs the exact Graphify mode:

```text
extract <fixed-repo-root> --code-only --no-cluster --force --out <fixed-runtime-root>
```

Provider environment variables are removed from the child environment, its
home/config/cache paths are isolated under `.runtime/`, and Python socket
connects are denied by a `sitecustomize` guard. The Graphify installer is never
called. `--force` is mandatory so every index is a complete deterministic scan
rather than an incremental fragment.

## Read-only stdio MCP

```bash
uv run sirinx-graph-memory serve-readonly
```

This process speaks MCP on stdin/stdout only. It accepts no host, port,
transport, project-path, or graph-path argument.

## Retrieve ContextBundleV1

`retrieve-context` is a separate fixed-root CLI command; it does not add an MCP
tool. It accepts one JSON object on stdin, capped at 64 KiB:

```bash
printf '%s\n' '{
  "schema_version": "1.0.0",
  "task_id": "task-example-001",
  "goal_spec_digest": "sha256:<64-lowercase-hex>",
  "repository_id": "sirinx-co",
  "base_sha": "1f05814c3e9d173e525234d69b3ce7f2d1b01a57",
  "query": "goal execution registry",
  "max_items": 8
}' | uv run sirinx-graph-memory retrieve-context
```

The response contains `query_digest`, never the raw query. Its exact code
snapshot binds the approved 40-hex base SHA to SHA-256 digests of the fixed
`graph.json` and Graphify `manifest.json`. Items carry typed source
provenance (including the exact source-file SHA-256 for code), snapshot,
content, and item digests, evidence class, and `authority=context_only`. The
bundle is capped at 16 items (at most eight per source) and 24,000 UTF-8 text
bytes, with `provider_calls=0` and `external_calls=0`. Graph edges marked
`AMBIGUOUS` are excluded unless the stdin request explicitly opts in.

An optional `obsidian_snapshot_digest` can query only an already-created,
exact-digest sanitized projection. It never inventories or projects the live
vault. The published output contract is
`schemas/context-bundle.schema.json`.

## Submit a proposal

Pass JSON on stdin so proposal content does not enter argv or shell history:

```bash
uv run sirinx-graph-memory propose < proposal.json
```

The proposal is secret-scanned, strictly validated, PII-redacted, content
addressed, and then appended to `.runtime/proposals.jsonl`. LangGraph checkpoints
the sanitized proposal locally in SQLite. Re-submitting identical content is
idempotent.

Agents may query and propose. Only Hermes may review a proposal and separately
promote approved content through the existing Obsidian sync process.

## Read-only Obsidian projection

The vault is never scanned automatically. The first explicit command performs
inventory only and prints counts/digests without note content:

```bash
uv run sirinx-graph-memory obsidian-inventory
```

Projection requires the exact digest from that inventory:

```bash
uv run sirinx-graph-memory obsidian-project \
  --inventory-digest sha256:<inventory-digest>
```

The command re-inventories the fixed canonical vault and fails if anything
changed. LangGraph runs deterministic verify/chunk/persist stages, while
LangChain provides local `Document` and text splitting only. Output is written
under `.runtime/obsidian-projection/<digest>/`; the vault remains read-only.

After an explicit projection exists, agents can use the same project-local
stdio MCP to call `obsidian_snapshot_info` or `query_obsidian_projection`.
Both tools require the exact `sha256:<digest>` and accept no vault or file
path. Query count and response size are bounded, projection file digests are
verified on every call and before an existing projection can be reused. Policy
denials and unknown tools return MCP `isError=true`, and the result remains
proposal-only context rather than authoritative memory.

Excluded or blocked content includes `.obsidian`, hidden directories/files,
non-Markdown attachments, all symlinks (escaping symlinks are separately
counted), oversized notes, invalid UTF-8/binary content, and secret-shaped
notes. Email, phone, Mac home-path, LINE user ID, and IPv4 PII are redacted in
included notes. Credential detection includes common provider keys, GLM share
keys, Telegram bot tokens, Slack tokens, JWTs, Hugging Face tokens, GitLab
tokens, private keys, credential headers, and explicit credential assignments.

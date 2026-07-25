# Dependency and license audit

Status: PASS (project-local resolution)

The direct dependency inventory is machine-readable in
`dependency-inventory.json`. Graphify `0.9.25` was inspected from its PyPI wheel:
package metadata declares Apache-2.0 and the wheel contains `LICENSE`,
`LICENSE-MIT`, and `NOTICE`.

Only `graphifyy[mcp]` is selected. Provider extras such as `openai`,
`anthropic`, `gemini`, `kimi`, `ollama`, and `bedrock` are not selected.

Lock verification:

1. `uv.lock` SHA-256:
   `175ec491e52f0e4764f33325160cbbfe14e1ee6852de6dc682d42e6b72a59c0a`.
2. 96 packages are resolved for Python `>=3.12,<3.15`.
3. Direct runtime versions match `pyproject.toml`.
4. No `openai`, `anthropic`, `boto3`, `google-generativeai`, `google-genai`, or
   `tiktoken` package appears in the lock.
5. `uv sync --locked` succeeds inside this directory.
6. Focused tests set provider keys to canary values and prove the Graphify child
   environment strips them.
7. Installed direct-package license metadata:
   - graphifyy 0.9.25 — Apache-2.0 metadata; wheel also contains MIT text/NOTICE
   - langchain 1.3.14 — MIT
   - langchain-text-splitters 1.1.2 — MIT
   - langgraph 1.2.9 — MIT
   - langgraph-checkpoint-sqlite 3.1.0 — MIT
   - mcp 1.28.1 — MIT
   - pydantic 2.13.4 — MIT
   - pytest 9.1.1 — MIT
   - ruff 0.15.22 — MIT

LangSmith is present transitively through LangChain but is not a model-provider
SDK. `LANGSMITH_API_KEY` and `LANGCHAIN_API_KEY` are removed, and all tracing
flags are forced off before any workflow runs. No LangSmith client is created
by this package.

The final forced Graphify code-graph smoke produced a fixed local graph with
3,926 nodes and 8,394 edges under the ignored `.runtime/` directory. The
command returned only
exit code, byte counts, and SHA-256 digests; raw stdout/stderr were not returned
or persisted by this package. The subprocess cwd and `GRAPHIFY_OUT` are both
fixed beneath that runtime directory; a regression test verifies that no
repo-root `graphify-out/` is created.

# External Component Intake Evidence — 2026-07-21

Verdict: `STATIC_CATALOG_VALIDATED_NOT_ADMITTED`

Claim ceiling: `PRIMARY_SOURCE_RESEARCH_AND_HOLD_ONLY`

## Scope

This packet converts the requested Cloudflare MCP/computer MCP, Codex, Claude,
Kimi, Hermes, Telegram, LINE Official, A2A, swarm/harness, API/database, QA,
reverse-engineering, and local-model landscape into a closed research catalog.
It makes future one-component-at-a-time intake reviewable. It does not perform
the install or live connection request.

The false effect flags below mean this packet performed no such action. They do
not erase separately observed pre-existing, unreconciled binaries or model
listings; those are represented explicitly as `EXISTING_UNRECONCILED`.

## Exact baseline

| Field | Observation |
| --- | --- |
| repository | `/Users/sirinx/SIRINXDev/sirinx-co` |
| branch | `agent/b1-b2-command-center` |
| HEAD | `1f05814c3e9d173e525234d69b3ce7f2d1b01a57` |
| worktree | dirty with extensive user-owned tracked/untracked work; preserved |
| host | `Mac14,3`, 8 GiB RAM, 8 logical CPUs |
| free disk | 14,268,520 KiB on `/System/Volumes/Data` |
| workload floor | 15,728,640 KiB (15 GiB) |
| resource admission | `HOLD_BELOW_15_GIB` |
| implementation authority | `APPROVE_IMPLEMENTATION` scoped to safe local code/docs |
| external authority | no install, connector, provider, Cloudflare, send, push, merge, or deploy grant |

Protected `.env`, browser, keychain, and Hermes configuration/auth files were
not read.

## Research findings frozen in the catalog

### Cloudflare and MCP

- Current MCP baseline is revision `2025-11-25` over Streamable HTTP; legacy
  HTTP+SSE is deprecated.
- First SIRINX candidate is stateless `createMcpHandler()` with
  documentation-only tools and no Durable Object. Stateful `McpAgent` remains
  held for state/tenancy/retention/deletion/migration review.
- The Cloudflare API Code Mode MCP is reference-only because its search/execute
  surface can reach mutating account APIs.
- The current v1 registry cannot truthfully represent a Portal as deny-all:
  portal management tools remain exposed. Portal activation requires a v2
  registry and independent effective-tool read-back.

Primary sources: [Cloudflare remote MCP](https://developers.cloudflare.com/agents/model-context-protocol/guides/remote-mcp-server/),
[MCP Portal](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals/),
[MCP transport](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports),
and [authorization](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization).

### A2A

- The A2A source repository is on the v1.0.1 line and the wire header remains
  `A2A-Version: 1.0`.
- The stable JavaScript SDK is 0.3.14; v1 is beta and the v1 TCK is alpha.
- Cloudflare's example pins the 0.3 SDK and remote Workers AI, so it is not a
  stable v1/config-free/no-provider-call SIRINX runtime.
- The official Rust SDK is retained as a future compatibility adapter/TCK
  target. It does not replace SIRINX durable tasks, leases, identity, approvals,
  or receipts.

Primary sources: [A2A releases](https://github.com/a2aproject/A2A/releases),
[A2A specification](https://a2a-protocol.org/latest/specification/),
[A2A JavaScript releases](https://github.com/a2aproject/a2a-js/releases), and
[A2A TCK](https://github.com/a2aproject/a2a-tck).

### Existing agent harnesses and API/database stack

- Reconcile the existing Codex, Hermes, and Kimi binaries rather than install a
  second copy. Exact local digest/upstream lineage remains incomplete.
- Keep Axum and SQLx. Do not add another API generator, ORM, self-hosted backend
  control plane, or agent orchestrator.
- Codex/Hermes/Kimi are workers, not approval authority. MCP, ACP, CLI, or
  desktop presence is not A2A evidence.
- Goose and OpenAI Agents Python are excluded as overlapping orchestrators.

Claude Code/Cowork remains a disabled client/connector surface in the separate
MCP/A2A connection plan. It is not represented as a permissive open-source
install candidate by this portfolio, and no Claude configuration was read or
changed.

Primary sources include [Codex](https://github.com/openai/codex),
[Hermes Agent](https://github.com/NousResearch/hermes-agent),
[Kimi Code](https://github.com/MoonshotAI/kimi-code),
[Axum](https://github.com/tokio-rs/axum), and
[SQLx](https://github.com/transact-rs/sqlx).

### QA and messaging

- Playwright and Inspect AI remain held candidates; browser/native/sandbox
  footprint and effect surfaces require exact receipts.
- Keep the existing fixed-destination Telegram adapter. Do not add grammY or
  Teloxide while they fill no current gap.
- The LINE Node SDK is the narrow future candidate after tag/npm artifact
  parity. The LINE MCP server is excluded because it combines broad read/write
  tools and a browser-downloading dependency path.

Primary sources: [Playwright](https://github.com/microsoft/playwright),
[Inspect AI](https://github.com/UKGovernmentBEIS/inspect_ai),
[LINE Node SDK](https://github.com/line/line-bot-sdk-nodejs), and
[LINE signature verification](https://developers.line.biz/en/docs/messaging-api/verify-webhook-signature/).

### Models on Mac mini M2 8 GiB

- GLM-5.2 official BF16 is 1.51 TB and FP8 is 756 GB: `REJECT_LOCAL_RESOURCE`.
- Kimi K3 is 2.8T; the announcement says weights are due 2026-07-27, but no
  artifact license exists on this snapshot. Its lower-bound MXFP4 storage is
  about 1.4 TB: `HOLD_ARTIFACT_LICENSE / REJECT_LOCAL`.
- Best future publisher-hosted coding pilot is Qwen2.5-Coder 1.5B GGUF
  Q4_K_M (1.12 GB, Apache-2.0). Granite 3.3 2B Q4_K_M (1.55 GB,
  Apache-2.0) is the fallback.
- The existing local `qwen3.5:2b` conversion is
  `QUARANTINE_UNPINNED` until its manifest, digest, upstream revision, runtime
  revision, and bounded resource receipt are captured.

Primary sources: [GLM-5.2](https://huggingface.co/zai-org/GLM-5.2/tree/main),
[GLM-5.2 FP8](https://huggingface.co/zai-org/GLM-5.2-FP8/tree/main),
[Kimi K3](https://www.kimi.com/blog/kimi-k3),
[Qwen2.5-Coder GGUF](https://huggingface.co/Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF/tree/main),
and [Granite GGUF](https://huggingface.co/ibm-granite/granite-3.3-2b-instruct-GGUF/tree/main).

## Closed artifacts

| Artifact | Role |
| --- | --- |
| `schemas/agent-runtime/external-component-intake.v1.schema.json` | strict Draft 2020-12 shape and false-effect constants |
| `config/agent-runtime/external-components.research-only.v1.json` | 26-entry closed catalog and four held waves |
| `scripts/validate-external-component-intake.mjs` | outer byte pins plus complete per-component/per-wave semantic pins |
| `scripts/validate-external-component-intake.test.mjs` | promotion, identity, license, version, overlap, resource, and no-I/O negatives |
| `docs/agent-runtime/EXTERNAL_COMPONENT_INTAKE.md` | architecture and rollout contract |
| `docs/knowledge/SIRINX_REPO_INTAKE_GATE_V1.md` | missing Repo Intake Gate evidence target |

Pinned bytes:

```text
catalog sha256 2c796db789c919c630ef425387ed75a0cba94a98886cd40299195e47451482ec
schema  sha256 64127fbcb2595f606060c2fb627c2af414e1a18779d4c14d2bb50f271256d5eb
```

## Focused validation

```text
node scripts/validate-external-component-intake.mjs
node --test scripts/validate-external-component-intake.test.mjs
```

Result: validator PASS, 11/11 focused external-intake tests PASS, and 9/9
Repo Intake Gate tests PASS (including plaintext HTTP rejection). Negatives
reject:

- duplicate JSON keys;
- authority/proof/clone/install/run/connect promotion;
- component removal/reordering or publisher/source/disposition rewrite;
- unknown-license promotion, publisher-license/source substitution, revision,
  provenance, ticket, artifact, or resource-policy rewrite;
- inherited `toJSON`, custom prototype, accessor, symbol, sparse-array, cycle,
  shared-reference, or JavaScript `Proxy` attempts to mask a semantic rewrite
  or execute a property trap;
- A2A 0.3/v1 mismatch removal;
- Cloudflare Code Mode and LINE MCP quarantine removal;
- GLM/Kimi local-fit promotion and local Qwen provenance promotion;
- install-wave activation, membership/criteria/stop-point drift, duplicates, or
  unknown component IDs;
- traversal, unexpected imports, dynamic capability loaders, and
  network/subprocess/environment/database/provider/secret-read primitives in
  the validator.

## Independent review

Final latest-byte verdicts:

- code/catalog review: `CLEAN`;
- adversarial schema/validator red-team: `CLEAN` after remediation and re-test;
- evidence verifier: `VERIFIED` for this static dirty-worktree candidate only.

The red-team first reproduced semantic re-pin bypasses across license/source,
revision/provenance, LINE quarantine/wave criteria, and local-model evidence.
Complete per-component and per-wave pins plus composite negatives closed those
paths. It then reproduced inherited/custom `toJSON` masking, standard-prototype
pollution, and descriptor/get-trap Proxy masking. Recursive plain-graph checks,
descriptor-only serialization, `util.types.isProxy` before traversal, and
regression probes closed those paths. Final Proxy trap counters remained zero.

Independent reviewers re-ran the canonical validator and 11/11 focused tests.
The author-run Repo Intake Gate file passed 9/9 including three loopback route
tests; the evidence verifier independently ran the six pure tests and
source-reviewed the listener tests under its no-service boundary. External
publisher pages were not re-fetched by the reviewers, so the catalog remains a
dated primary-source research snapshot rather than a continuous external
attestation.

A later reviewer resource sample was lower than the catalog snapshot but still
below the 15 GiB floor. This does not change the decision: all install waves
remain `HOLD`, and a fresh action-time measurement is mandatory.

## Effect receipt

```text
clone=false
install=false
postinstall=false
model_download=false
model_inference=false
mcp_start=false
mcp_connect=false
a2a_live=false
provider_call=false
cloudflare_mutation=false
message_send=false
push=false
merge=false
deploy=false
production_ready=false
```

Next safe action: obtain a separately reviewed one-target resource recovery
grant, re-measure at or above the operation-specific threshold, then complete
wave 0 provenance reconciliation. No new runtime should be installed before
that read-only packet is independently accepted.

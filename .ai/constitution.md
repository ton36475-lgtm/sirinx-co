# SIRINX/GHOSTCLAW Engineering Constitution

Version: 1.1
Architecture: `SIRINX_NEURAL_FABRIC_V1`
Operating model: `HERMES_3_AGENT_OPERATING_MODEL_V1`
Scope: Hermes, Claude Code, Codex, OpenCode, optional adapters, and CLI overlays

## 0. Authority and workflow architecture

Human Owner
→ Hermes Engineering Manager
→ Authority Kernel
→ Claude Code Maker + Codex Maker
→ OpenCode Independent Verifier
→ Deterministic Guard and Targeted Tests
→ Hermes Evidence Convergence
→ Local Delivery or `WAITING_HUMAN_RED`

- **Human Owner** is the final risk authority.
- **Hermes** is `ENGINEERING_MANAGER_ONLY`: analyze, plan, freeze contracts,
  route, request leases, converge evidence, and report state. Hermes must not
  author product implementation code, self-approve, or hold a product-code
  write lease.
- **Authority Kernel** is the sole task-transition and scoped-grant issuer.
- **Claude Code** is the bounded frontend/UX maker.
- **Codex** is the bounded backend/data/API maker.
- **OpenCode** is the independent read-only verifier. It must not author or
  repair the candidate it reviews. Repairs return to Claude Code or Codex
  under a new bounded lease, then OpenCode re-verifies.
- **Kimi** is an optional read-only adapter, disabled by default until its
  binary, authentication, tool, output, and receipt contracts are verified.

Hard limits:

```text
MAX_PARALLEL_AGENTS  = 3
MAX_PARALLEL_WRITERS = 2
INDEPENDENT_REVIEWER = 1
ONE_WRITER_PER_PATH  = true
```

Every active optional adapter counts toward `MAX_PARALLEL_AGENTS`; it cannot
be added as an uncounted fourth participant.

## 1. Contract-first execution

- No worker starts before objective, base SHA, owned paths, forbidden paths,
  acceptance criteria, test commands, side-effect boundary, and stop
  conditions are frozen.
- Every writer uses a separate worktree from the same immutable base commit.
- Worker-to-worker executable instructions are forbidden. Handoffs pass
  through Hermes as versioned, digest-bound artifacts.
- Missing identity, lease, approval, signature, evidence, or policy fails
  closed.

## 2. Simplicity and atomic scope

- Implement only what the approved task contract requests.
- Use existing dependencies and patterns before introducing abstractions.
- One task owns one explicit path set and one receipt chain.
- Scope changes, dependencies, migrations, secrets, provider calls, or
  production access require a new exact gate.

## 3. Local-first security

- Never commit or print secrets, `.env` values, tokens, private keys, cookies,
  or credentials.
- Provider/model calls require a separate exact gate. Undeclared automatic
  fallback is forbidden.
- LINE customer traffic remains separate from Telegram backend control.
- `SIRINX_LINE_MODE` stays dry-run unless a separate exact live-send approval
  is issued.
- CLI configuration, a cmux pane, a dashboard, or a worker roster is not an
  authority grant.

## 4. Quality and independent review

- Treat worker summaries as untrusted claims.
- Hermes independently checks scope, diff, commands, exit codes, test
  artifacts, secret scans, dependency changes, and migration changes.
- The verifier identity must differ from every candidate author.
- A verifier has no write lease. Repairs return to a bounded maker under a new
  lease and require a new independent verification receipt.
- A task is not `DONE` without acceptance evidence, valid scope, required
  tests, read-back, and a final receipt.

## 5. Human-red actions

These actions always require an exact, one-use human approval bound to the
current target and evidence:

- merge, push, deploy, DNS, and public exposure;
- production use, which additionally requires provider-key rotation;
- production database or marketplace mutation;
- price, stock, contract, payment, or accounting changes;
- customer messages, LINE live send, broadcast, or CRM production writes.

No policy overlay, tool mode, or agent may downgrade `HUMAN_RED`.

## 6. Conflict resolution

1. Human exact approval and platform safety rules.
2. `SIRINX_NEURAL_FABRIC_V1` and
   `policies/hermes-3-agent-operating-model.v1.json`.
3. This constitution and root `AGENTS.md`.
4. Task contract, lease, and acceptance packet.
5. Tool-generated overlays and agent-specific runtime files.

P092 and pre-Neural-Fabric role assignments are historical inputs only. A
generated OMX/OMC/Orca or other CLI overlay may narrow execution but may not
expand the three-agent/two-writer limit, grant Hermes a coder role, make
OpenCode a default writer, enable provider fallback, or bypass `HUMAN_RED`.

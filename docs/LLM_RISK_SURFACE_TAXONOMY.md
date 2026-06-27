# LLM Risk Surface Taxonomy

Status: defensive taxonomy for production LLM application design.

This file intentionally avoids attack prompts, bypass recipes, evasion examples,
or reproducible attack steps. It describes risk surfaces and system controls.

## Taxonomy Table

| Risk Surface               | Defensive Definition                                                                                                          | Typical Assets At Risk                            | Primary Controls                                                                        | GHOSTCLAW Owner            |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------- |
| Instruction Conflict       | Competing instructions from user, system, tool output, retrieval, or memory create ambiguity about what the agent should obey | policy integrity, workflow correctness            | policy precedence, conflict detector, immutable system rules, decision logging          | Fleet Orchestrator + Admin |
| Contextual Framing Abuse   | The task context makes a risky request appear benign or out of scope for safety review                                        | safety classifier, user trust boundary            | intent classifier, task scope check, domain risk labels, escalation path                | Content + Admin            |
| Semantic Obfuscation       | Input representation makes semantic risk harder to classify                                                                   | classifiers, logging, downstream sanitizer        | canonicalization, encoding normalization, Unicode hygiene, semantic classifier ensemble | Admin                      |
| Indirect Prompt Injection  | External content attempts to influence the agent beyond its data role                                                         | RAG context, tools, private data                  | content-as-data boundary, source trust labels, retrieval quarantine, tool gating        | Fleet Orchestrator         |
| Tool Abuse                 | Agent attempts a tool action outside policy or outside the active task lease                                                  | files, shell, browser, APIs, deploy surface       | permission broker, least privilege, dry-run, allowlist, command/action manifest         | Admin + Finance            |
| Data Exfiltration          | Sensitive information leaves its allowed boundary through output, tool calls, logs, or connector payloads                     | secrets, customer data, private docs, credentials | DLP, redaction, secret scan, egress policy, no-secret logging                           | Admin                      |
| Output Handling Risk       | Downstream systems trust model output without validation                                                                      | web app, database, shell, HTML, SQL, CRM          | schema validation, sanitizer, transaction preview, no direct execution, review gate     | Fleet Orchestrator         |
| Agent Memory Contamination | Persistent workspace files or memory notes introduce untrusted instructions into future agent context                         | AGENTS/CLAUDE files, memory, runbooks, docs       | signed source policy, hash review, memory writeback gate, quarantine                    | Admin + Fleet Orchestrator |

## Defensive Detection Signals

Use signals rather than attack examples:

- conflicting role or authority claims
- request asks for tool use that exceeds task scope
- external content contains imperative language directed at the agent
- output contains secrets, credentials, or private identifiers
- output is executable or interpretable by downstream systems
- request requires production mutation, public publishing, payment, deploy, or customer messaging
- task tries to merge unrelated trust zones
- persistent memory or agent instruction files change without an owned commit,
  review note, or source hash

## Control Stack

```text
Normalize input
-> classify intent and risk surface
-> apply policy decision
-> isolate context by trust zone
-> generate only within allowed scope
-> validate output
-> broker tools with least privilege
-> log and monitor every decision
```

## GHOSTCLAW Mapping

| GHOSTCLAW Layer          | Control                                         |
| ------------------------ | ----------------------------------------------- |
| Zero Prompting templates | Stable role scope and refusal language          |
| Ship Protocol            | Structured task packet and validation checklist |
| Fleet Orchestrator       | Policy route and task stage control             |
| Vault                    | Evidence, hash, review, and decision history    |
| Admin co-worker          | QA, safety review, and escalation               |
| Finance co-worker        | Budget, rate limit, and cost-risk checks        |

## Production Acceptance Criteria

- Every tool action has an explicit allow/deny decision.
- External content is marked as untrusted data.
- No model output is directly executed by shell, SQL, browser automation, deploy, or connector tools.
- Sensitive data is classified before entering context.
- Public-facing answers pass output safety validation.
- Red-team findings become tests or policy rules.
- Agent memory writeback is reviewed, source-linked, and reversible.

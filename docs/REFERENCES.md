# GHOSTCLAW Documentation References

Status: reference map for the LLM production safety article workflow.

## GHOSTCLAW Docs Identified In This Repo

The repository contains GHOSTCLAW/SIRINX documentation across these primary
areas:

| Area                      | Representative docs                                                                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Architecture              | `docs/architecture/GHOSTCLAW_MASTER_ARCHITECTURE.md`, `docs/architecture/WORKFLOW_MAP.md`                                               |
| A2A / KOB / Codex / Manus | `docs/a2async/A2A_KOB_CODEX_SYNC_V2.md`, `docs/a2async/LOCAL_CODEX_KOB_MANUS_A2A_RUNBOOK.md`, `docs/a2async/A2A_TASK_SCHEMA.md`         |
| Autopilot                 | `docs/autopilot/FULL_AUTO_SYSTEM.md`, `docs/autopilot/AUTOPILOT_POLICY_SPEC.md`, `docs/autopilot/AUTO_VERIFICATION_POLICY.md`           |
| Security and policy       | `docs/security/LOCAL_FIRST_SECURITY_POLICY.md`, `docs/security/SECRET_HANDLING_POLICY.md`, `docs/policies/PRODUCTION_MUTATION_RULES.md` |
| Deep research             | `docs/deep_research/SOVEREIGN_DEEP_RESEARCH_OS.md`, `docs/deep_research/EVIDENCE_UNIT_SCHEMA.md`                                        |
| Product design            | `docs/product-design/CODEX_PRODUCT_DESIGN_LAYER.md`, `docs/product-design/PRODUCT_REVIEW_GATE.md`                                       |
| Research memory           | `docs/research_memory/VISUAL_RAG_ADAPTER.md`, `docs/research_memory/VISUAL_EVIDENCE_SCHEMA.md`                                          |
| Runbooks                  | `docs/runbooks/CODEX_WORKER_RUNBOOK.md`, `docs/runbooks/N8N_MCP_AUTOMATION_RUNBOOK.md`                                                  |
| Agent and memory          | `AGENTS.md`, `CLAUDE.md`, `docs/memory/HERMES_OBSIDIAN_MEMORY_PROTOCOL.md`                                                              |

## External Defensive References

- OWASP Gen AI Security Project, OWASP Top 10 for LLM Applications 2025:
  <https://genai.owasp.org/llm-top-10/>
- OWASP Top 10 for Large Language Model Applications project page:
  <https://owasp.org/www-project-top-10-for-large-language-model-applications/>
- NIST AI Risk Management Framework:
  <https://www.nist.gov/itl/ai-risk-management-framework>
- NIST AI RMF 1.0 PDF:
  <https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf>
- NIST AI RMF Playbook:
  <https://airc.nist.gov/airmf-resources/playbook/>
- NIST SP 800-218 Secure Software Development Framework:
  <https://csrc.nist.gov/pubs/sp/800/218/final>

## Citation Use

Use these references only for defensive engineering:

- OWASP: risk categories and mitigation framing.
- NIST AI RMF: governance, mapping, measurement, and management of AI risk.
- NIST SSDF: secure software development practices around LLM applications.

Do not use references to introduce bypass details, attack payloads, or
reproducible jailbreak procedures.

## Source Draft Handling

The internal source draft reviewed for the current article contained
operational adversarial detail. It is tracked only through the sanitized review
document:

- `docs/LLM_SAFETY_DRAFT_SANITIZATION_REVIEW.md`

Do not publish the raw draft. If future versions need specific claims about
named research systems, model-family behavior, attack-success rates, or latency
figures, verify those claims from primary sources before inclusion.

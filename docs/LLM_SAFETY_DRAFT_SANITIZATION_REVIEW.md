# LLM Safety Draft Sanitization Review

Status: source draft reviewed and converted into defensive publication-safe
material.

Source attachment:
`/Users/sirinx/.codex/attachments/46cd9444-c052-4bf4-8b3e-c04dce1b1647/pasted-text.txt`

## Review Decision

The source draft contains detailed adversarial framing and operational language
that is not appropriate to publish directly. It has been converted into
defensive architecture language in:

- `docs/LLM_PRODUCTION_SAFETY_ARCHITECTURE.md`
- `docs/LLM_RISK_SURFACE_TAXONOMY.md`
- `docs/ARTICLE_SAFETY_QA_CHECKLIST.md`

No jailbreak prompts, bypass instructions, reproducible attack steps, evasion
recipes, or obfuscation procedures were copied into the publication article.

## Sanitization Map

| Source draft theme                          | Publication-safe conversion                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| Competing helpfulness and safety objectives | Helpfulness vs Safety and Model Safety vs Application Safety                   |
| Mechanistic interpretability claims         | Caveated hypothesis language; no layer/head/percentage claim treated as fact   |
| Role/context manipulation descriptions      | Contextual Framing Abuse risk surface                                          |
| Encoded or transformed input descriptions   | Semantic Obfuscation risk surface and canonicalization control                 |
| Forced answer-shape descriptions            | Instruction Conflict and Output Handling Risk                                  |
| Low-resource language discussion            | Multilingual risk coverage and classifier evaluation requirement               |
| Long-context drift and memory contamination | Context isolation, memory hygiene, and Agent Memory Contamination risk surface |
| Agent-file persistence discussion           | Signed/owned memory source, hash review, and memory writeback gate             |
| Tool-driven agent abuse                     | Tool Permission Broker and execution lease control                             |
| Multimodal adversarial media discussion     | Multimodal Intake Hardening                                                    |

## Removed From Public Article

The following categories were intentionally excluded:

- direct attack examples
- prompt templates
- text transformation recipes
- roleplay or simulated-environment instructions
- executable kill-chain details
- credential, callback, or command-and-control language beyond high-level risk
  naming
- numeric performance claims that lack verified primary citations
- claims about specific model families that would require fresh source
  verification

## Claims Requiring Citation Before Publication

The draft included specific claims that should not be published as factual
without primary-source verification:

- exact percentages for attack success reduction
- exact latency values for boundary verification systems
- precise layer ranges or attention-head localization claims
- claims about specific vendor/model family filtering behavior
- named defensive frameworks that may refer to research prototypes rather than
  standardized production controls

If these claims are needed later, create a separate research task that gathers
primary papers, official documentation, benchmark setup, and reproduction notes.

## Production-Safe Additions Made

- Added mechanistic interpretability caveats.
- Added Agent Memory Contamination as an explicit risk surface.
- Added secure planner and dynamic validator pattern.
- Added control/data flow separation pattern.
- Added signed context boundary pattern.
- Added multimodal intake hardening pattern.
- Preserved OWASP and NIST as defensive references only.

## QA Result

This source is approved only as a sanitized input to defensive architecture
docs. It is not approved as a raw public article.

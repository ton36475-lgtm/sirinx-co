# Article Safety QA Checklist

Use this checklist before publishing any LLM safety article or importing it into
GHOSTCLAW knowledge surfaces.

## Hard Blocks

- [ ] No jailbreak prompts.
- [ ] No bypass instructions.
- [ ] No reproducible attack steps.
- [ ] No evasion guidance using encoding, roleplay, prefix forcing, symbol
      substitution, or obfuscation.
- [ ] No hidden chain-of-thought extraction instructions.
- [ ] No instructions for disabling policy, auth, monitoring, or safety gates.

## Required Framing

- [ ] Attack-technique wording has been converted into risk-surface wording.
- [ ] Model Safety and Application Safety are separated.
- [ ] Mechanistic interpretability claims include caveats and uncertainty.
- [ ] Specific numeric claims from drafts have primary citations or have been
      removed.
- [ ] Named research/framework claims are marked as candidate patterns unless
      verified from primary sources.
- [ ] OWASP is used as a defensive risk taxonomy only.
- [ ] NIST AI RMF is used as a governance framework only.
- [ ] NIST SSDF is used as secure development guidance only.
- [ ] The final text supports production design, monitoring, and governance.

## Architecture Coverage

- [ ] User Input.
- [ ] Input Normalization / Canonicalization.
- [ ] Intent & Risk Classifier.
- [ ] Policy Decision Engine.
- [ ] Context Isolation Layer.
- [ ] LLM Core.
- [ ] Output Safety Validator.
- [ ] Tool Permission Broker.
- [ ] Audit Log / Monitoring / Red-Team Feedback.

## Required Risk Surfaces

- [ ] Instruction Conflict.
- [ ] Contextual Framing Abuse.
- [ ] Semantic Obfuscation.
- [ ] Indirect Prompt Injection.
- [ ] Tool Abuse.
- [ ] Data Exfiltration.
- [ ] Output Handling Risk.
- [ ] Agent Memory Contamination, if the article covers agentic systems.

## GHOSTCLAW Workflow Fit

- [ ] The article maps to Fleet Orchestrator responsibilities.
- [ ] A Ship Protocol payload exists for the article workflow.
- [ ] Admin co-worker owns safety QA.
- [ ] Vault/audit/monitoring are included as evidence layers.
- [ ] References are public, reputable, and defensive.

## Publication Decision

Use this decision table:

| Result                                               | Action                               |
| ---------------------------------------------------- | ------------------------------------ |
| All hard blocks clear and required framing complete  | Public technical publication allowed |
| Any hard block fails                                 | Do not publish; rewrite              |
| Architecture incomplete                              | Hold for engineering review          |
| References missing                                   | Hold for citation review             |
| Claims overstate model internals                     | Add caveats or remove claim          |
| Source draft contains operational adversarial detail | Publish sanitized article only       |

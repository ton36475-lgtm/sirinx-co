# Mercury Skills -> Hermes Install Summary

## Source
cosmicstack-labs/mercury-agent-skills

## Install Mode
Local-only, audit-first, whitelist-only.

## Installed Destination
/Users/sirinx/.hermes/skills/mercury-whitelist

## Hermes Runtime Visibility
- staging/audit copy: /Users/sirinx/.hermes/skills/mercury-whitelist
- global user-skill scan path copy: /Users/sirinx/.hermes/skills/<category>/<skill>/SKILL.md
- active profile mirror: /Users/sirinx/.hermes/profiles/shogun/skills/<category>/<skill>/SKILL.md
- reason for profile mirror: this Hermes CLI lists active-profile skills; the nested mercury-whitelist staging path alone was not visible in `hermes skills list`.

## Audit Result
- all skills: 130
- category candidates: 62
- rejected by category: 68
- rejected by risky path/name: 0
- manual-review keyword hits: 32
- installed approved skills: 62

## Verification Result
- `hermes doctor`: exit 0
- `hermes skills check`: exit 0
- `hermes skills audit`: exit 0
- `hermes skills list` after active-profile mirror: 9 hub-installed, 76 builtin, 73 local, 158 enabled, 0 disabled
- Mercury whitelist skills visible in Hermes list include: agent-audit-logging, api-design, ui-design-system, react-patterns, product-strategy, secure-coding, test-strategy.
- `hermes skills audit` reports existing findings from already installed hub/community skills such as axolotl and unsloth; Mercury whitelist skills were installed from the local audit list and kept under the local-only execution boundary.
- offline preload test: `hermes -s secure-coding,product-strategy,ui-design-system,test-strategy prompt-size` exit 0; Hermes help states this command runs offline with no API call.
- live one-shot prompt test was not run because this install round stays local-only and provider calls remain closed.
- `hermes skills inspect <name>` was attempted for three Mercury skills but hung without output; those inspect processes were terminated and the list/profile evidence above is the trusted verification source.

## Reports
- AUDIT_POLICY.md
- all-skills.txt
- whitelist-candidates.txt
- rejected-by-category.txt
- rejected-by-risky-path.txt
- risk-scan.txt
- risk-hit-summary.txt
- content-risk-skills.txt
- strict-clean-skills.txt
- approved-skills.txt
- approved-skills-summary.md
- installed-skills.txt
- direct-installed-skills.txt
- profile-shogun-installed-skills.txt
- hermes-doctor.txt
- hermes-skills-list.txt
- hermes-skills-list-profile-after.txt
- hermes-skills-list-local-profile-after.txt
- hermes-skills-check.txt
- hermes-skills-audit.txt
- hermes-skills-audit-profile-after.txt
- hermes-prompt-size-mercury-preload.txt

## Next Test Prompt for Hermes
Use Mercury whitelist skills plus SIRINX local-first rules.
Inspect the SIRINXDev repo and create:
1. repo summary
2. recommended skills to use
3. SDD HTML mockup workflow
4. implementation task packets
5. PRE_APPROVAL_PACKET
Do not edit files yet.
Do not deploy, push, or publish.

# Mercury Skills Audit Policy

Final install policy: local-only, whitelist categories plus risky path/name exclusions.

## Allowed Categories

development, ai-ml, backend, frontend, devops, testing-qa, product, design, security

## Path/Name Exclusions

media-download, download, scraping, scraper, twitter, x-twitter, account-manager, automation/social, captcha, proxy, fingerprint, bypass, spam, offensive, exploit, credential, cookie, session

## Content Audit Handling

content-risk-skills.txt is retained for manual evidence. In this repo, most hits are defensive or documentation contexts such as token budgets, design tokens, auth examples, secrets-management guidance, or secure-coding checklists. No hit is used to authorize secret reads, deploys, provider calls, bypass, scraping, social automation, or account automation.

## Counts

- All skills: 130
- Category candidates: 62
- Rejected by category: 68
- Rejected by risky path/name: 0
- Content keyword manual-review hits: 32
- Final installed approved skills: 62

Read `../AGENTS.md` first.

Scope: Vitest coverage, Playwright scaffolds, regression tests, and review checks.

Rules:
- every confirmed bug should add a regression test or validation step
- Playwright scaffolds must document what they verify and how to run
- tests may be skipped safely when runtime or tooling is not installed, but they must stay truthful about that state
- no test may require production secrets

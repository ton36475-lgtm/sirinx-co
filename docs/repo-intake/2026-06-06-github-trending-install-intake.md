# GitHub Trending Install Intake - 2026-06-06

Status: `INSTALL_ALL_BLOCKED`
Source: <https://github.com/trending>

## Summary

The GitHub Trending first page was captured as a local manifest and triage
matrix. Bulk install is blocked because it would execute unreviewed third-party
code across several ecosystems.

## Completed

- First-page manifest:
  `outputs/repo-intake/2026-06-06-github-trending-first-page/TRENDING_FIRST_PAGE_MANIFEST.json`
- Triage matrix:
  `outputs/repo-intake/2026-06-06-github-trending-first-page/REPO_TRIAGE_MATRIX.md`
- Evidence packet:
  `outputs/evidence/github-trending/2026-06-06-first-page-intake/`

## Recommended Queue

1. Read-only clone and inspect P0 repos.
2. Run secret/script risk scan on cloned repos.
3. Create per-repo install packet.
4. Install only selected repos with exact package-manager gate.

## Next Gate

```text
APPROVE_GITHUB_TRENDING_CLONE_READONLY_2026_06_06
```

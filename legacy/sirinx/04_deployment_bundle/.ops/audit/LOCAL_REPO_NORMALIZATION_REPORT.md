# Local Repo Normalization Report

## Status

`Normalized For Documentation Continuation`

## Repository Choice

The canonical writer repo is `C:\Users\Ton36\OneDrive\เอกสาร\Playground\sirinx` because it is a valid git repository on branch `main` and already contains the recovered website, governance docs, and server handoff artifacts.

`C:\Users\Ton36\Downloads\sirinx-main` is present but has no top-level `.git`; it is treated as reference material only.

## Actions Taken

- No destructive git commands were run.
- No lock files were removed.
- No repository visibility or collaborator settings were changed.
- No production secrets were read or written.
- Missing governance/handoff directories were created for documentation targets.
- Workspace project boundaries were documented so SIRINX, CHOKMA, dashboard, trading, and control-plane assets do not overlap.
- A repeatable SIRINX overlap audit script was added under `infra/scripts/overlap-audit.ps1`.

## Remaining Risks

- The repo has many pre-existing uncommitted changes. They were preserved.
- Final production deployment requires human approval and server-team access details.
- Top-level workspace still contains unrelated apps by design; they are excluded through the consolidation map rather than moved destructively.

## Rollback Note

To roll back this normalization layer, revert only the documentation and script files added in this continuation. Do not reset unrelated pre-existing work.

## Audit Trail Note

Preserve `git status --short`, validation output, and handoff bundle manifest with this report.

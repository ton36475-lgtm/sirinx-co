# Security Notes

## Local Control Node Restrictions
- All credentials and sensitive environment variables must be kept strictly local.
- Never write API keys or SSH keys inside the Obsidian vault or codebase.
- Any security testing (FinalRecon, Pentest Swarm) must use strict safe wrapper scripts that restrict target execution strictly to allowlisted domains.

## Target Allowlist Rules
- Only localhost (`127.0.0.1`) and owned assets (`sirinx.co`, `ghostclaws.local`) are allowed.
- Zero tolerance for external/third-party targeting.

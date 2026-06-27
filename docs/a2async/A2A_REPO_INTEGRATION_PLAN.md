# A2A Repo Integration Plan

External repositories are integrated through a registry, not by ad hoc clone
commands. Source code from third-party projects remains outside this monorepo.

## External Root

`~/SIRINXDev/_external_repos/`

## Registry Files

- `registry/external_git_repos.yaml`
- `registry/repo_roles.yaml`
- `registry/integration_order.yaml`
- `docs/external/EXTERNAL_REPOS_LOCK.md`

## Integration Phases

1. Register repo metadata and role.
2. Validate whitelist.
3. Clone only approved entries into the external root.
4. Audit README, LICENSE, SECURITY, package, Python, Docker, and workflow files.
5. Record commit hash and risk notes.
6. Wire only local adapters, runbooks, and policy references.
7. Start services only after a separate localhost-only runtime gate.

## Skip Rules

- Skip PixelRAG until an official repo/paper/playground is verified.
- Skip SIRINX canonical remote assumptions; detect local git remotes first.
- Skip any repo with a conflicting non-git directory unless read-only audit can
  continue safely.

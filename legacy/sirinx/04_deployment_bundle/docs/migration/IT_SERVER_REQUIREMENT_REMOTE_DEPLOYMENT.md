# IT Server Requirement: Remote Deployment

## Purpose

List the minimum server details required before Codex or the server team can perform governed SIRINX pre-deployment validation.

## Required From Server Team

- Server IP or hostname.
- SSH username and approved authentication method.
- Approved source delivery mode: direct Git source, local source snapshot, or both.
- Approved repo URL and branch if the target host is allowed to pull source directly.
- Sudo policy and whether passwordless sudo is allowed.
- OS distribution and version.
- CPU, RAM, disk size, and mount layout.
- Deployment path, expected owner, and write permissions.
- Server-local runtime path for Hermes brain-skill assets and starter packets, if different from `/opt/sirinx/runtime/hermes`.
- Docker Engine and Docker Compose availability.
- `unzip`, `rsync`, or equivalent file-transfer/extract tooling availability.
- Reverse proxy owner and config path.
- DNS owner and cutover authority.
- Approved public FQDN list, primary host, alias hosts, and TLS certificate basename.
- TLS certificate plan.
- Backup target and retention policy.
- Outbound network access policy.
- Maintenance window.

## Security Requirements

- No production secrets sent through chat.
- No raw SSH private keys committed to repo.
- No direct DB/Redis public exposure.
- SSO + MFA for internal control plane.
- Zero Trust or VPN for ops routes.

## Validation Commands

```bash
uname -a
id
df -h
docker --version
docker compose version
unzip -v
test -w /opt/sirinx && echo writable
test -w /opt/sirinx/runtime || mkdir -p /opt/sirinx/runtime
```

## Stop Condition

If server details are missing or ambiguous, stop at connect-ready handoff mode and request the missing details.

## Rollback Note

If server validation changes host state unexpectedly, revert only the touched file/config and preserve command evidence.

## Audit Trail Note

Save SSH target, command output, timestamp, operator, and any failed checks.

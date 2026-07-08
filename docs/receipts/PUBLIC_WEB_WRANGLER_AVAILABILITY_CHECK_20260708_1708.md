# Public Web Wrangler Availability Check - 2026-07-08 17:08 +0700

Status: `WRANGLER_NOT_AVAILABLE_DEPLOY_BLOCKED`
Branch: `feat/sirinx-web-line-trust-v1`
Local HEAD: `9147e70ef97e3238cf039a0b7e4a8f43dbd9225b`

## Scope

This receipt confirms whether Wrangler is already available locally after the
approved preview deploy command stopped at `command not found: wrangler`.

No install, deploy, provider mutation, auth flow, secret read, package
modification, PR/merge, webhook activation, analytics mutation, CRM/customer
storage, DNS mutation, or database migration was performed.

## Commands

```text
pnpm --dir apps/public-web exec wrangler --version
npm ls wrangler --depth=0 --workspaces=false
find . \( -path './.git' -o -path './.ghostclaw_runtime' -o -path './outputs' -o -path './tools' \) -prune -o \( -path '*/node_modules/.bin/wrangler' -o -name 'wrangler' \) -print
```

## Results

- `pnpm --dir apps/public-web exec wrangler --version`: failed with
  `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL` and `Command "wrangler" not found`.
- `npm ls wrangler --depth=0 --workspaces=false`: no Wrangler dependency found.
- Local binary search: no Wrangler binary found in the active workspace.

## Next Gate

Choose one exact path:

1. Approve a package/tool install path for Wrangler.
2. Provide an exact deploy command using an already available provider CLI.
3. Run the deploy externally and provide the resulting preview URL/evidence.

Wrangler installation and authentication remain separate gates from deploy.

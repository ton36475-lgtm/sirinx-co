# Public Web Preview Deploy Gate Runbook

Status: `DEPLOY_GATE_WAITING_FOR_REAL_COMMAND`
Date: 2026-07-08
Scope: `apps/public-web` preview deploy gate only

## Current State

- Branch `feat/sirinx-web-line-trust-v1` is pushed to `origin`.
- Local build script exists: `pnpm --dir apps/public-web build`.
- Vite client output path is `apps/public-web/dist/public`.
- No tracked deploy provider config was found in this repo.
- `apps/public-web/package.json` has no deploy script.
- Local CLI discovery did not find `wrangler`, `vercel`, `netlify`,
  `firebase`, or `flyctl` on `PATH`.
- No deploy, PR/merge, webhook activation, production analytics mutation,
  CRM/customer storage, or production action is authorized by this runbook.

## Valid Preview Deploy Gate Requirements

A preview deploy gate must include:

- exact approval token
- exact target
- exact command
- no `<...>` placeholder
- no inferred provider
- no database migration command
- no secret print/read step

Valid shape:

```text
APPROVE_DEPLOY_WEB_SIRINX_PREVIEW_20260708
Allowed command: <real executable command with target and arguments>
```

## Candidate Command Templates

These are templates only. They are not approvals and must not be run unless the
owner confirms the provider, account/auth state, project target, installed CLI,
and every argument, then sends the exact gate again with no `<...>` placeholder.

Cloudflare Pages:

```text
APPROVE_DEPLOY_WEB_SIRINX_PREVIEW_20260708
Allowed command: pnpm --dir apps/public-web build && wrangler pages deploy apps/public-web/dist/public --project-name <confirmed-cloudflare-pages-project> --branch feat/sirinx-web-line-trust-v1
```

Vercel:

```text
APPROVE_DEPLOY_WEB_SIRINX_PREVIEW_20260708
Allowed command: pnpm --dir apps/public-web build && vercel deploy <confirmed-vercel-target-or-project-command>
```

Netlify:

```text
APPROVE_DEPLOY_WEB_SIRINX_PREVIEW_20260708
Allowed command: pnpm --dir apps/public-web build && netlify deploy --dir apps/public-web/dist/public
```

If the selected provider requires a different build output format, adapter
directory, project link, team, site ID, or deploy config, the exact command must
come from that provider setup rather than from this runbook.

## Stop Conditions

Stop if:

- the command contains `<...>`
- provider CLI is not installed or not authenticated
- command tries to run `db:push`
- command reads or prints secrets
- command targets production instead of preview
- command mutates webhook, analytics, CRM, customer data, DNS, or database

## Next Safe Action

Owner chooses the real preview provider and sends a new exact gate with a full
command. Until then, continue local validation and manual review only.

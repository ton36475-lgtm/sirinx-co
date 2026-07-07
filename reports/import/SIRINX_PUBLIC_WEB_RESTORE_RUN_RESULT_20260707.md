# SIRINX Public Web Restore Run Result

Date: 2026-07-07
Branch: `codex/restore-public-web-source-20260707`
Target: `apps/public-web/`
Source: `ton36475-lgtm/sirinx@main`

## Result

Status: `RESTORE_IMPORTED_AND_VALIDATED_ON_RECOVERY_BRANCH`

The public web source was restored locally into `apps/public-web/` on the recovery branch. The restore scope was corrected to include the shared `brands/` configuration required by `client/src/contexts/BrandContext.tsx`.

During scoped review, staged `git diff --check` found whitespace-only issues in imported upstream files. The affected files were normalized for trailing whitespace / final blank-line cleanliness only before the local commit gate.

## Changed Recovery Logic

- `scripts/restore-public-web-from-sirinx.mjs` now imports `brands/`.
- `scripts/verify-public-web-import.mjs` now verifies `brands/sirinx/config.ts`.
- `SIRINX_PUBLIC_WEB_IMPORT_MANIFEST_20260707.json` now lists `brands/`.
- `docs/SIRINX_PUBLIC_WEB_SOURCE_RECOVERY_20260707.md` now documents the `brands/` dependency.

## Validation

Passed:

- `node scripts/verify-public-web-import.mjs`
- `pnpm --dir apps/public-web install --ignore-scripts`
- `pnpm --config.verify-deps-before-run=false --dir apps/public-web check`
- `pnpm --config.verify-deps-before-run=false --dir apps/public-web build`
- `pnpm web:check`
- `pnpm web:build`
- `python3 -m json.tool SIRINX_PUBLIC_WEB_IMPORT_MANIFEST_20260707.json`
- scoped `git diff --check`

Notes:

The pnpm v11 pre-run dependency status check requires an `approve-builds` decision for `esbuild` when run with the original bare commands. This packet did not run `pnpm approve-builds`. Instead, validation installed dependencies with `--ignore-scripts` and used `verify-deps-before-run=false` so check/build could run without approving dependency lifecycle scripts.

## Safety

Not performed:

- deploy
- git push
- Cloudflare/R2/D1/KV/DNS mutation
- LINE/Telegram/email/customer send
- provider/model call
- secret read or print
- `pnpm approve-builds`

## Next Safe Gate

Review the imported diff and open a scoped commit gate for the recovery branch. Push, deploy, Cloudflare mutation, and production changes remain separate exact gates.

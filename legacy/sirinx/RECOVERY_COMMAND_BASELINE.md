# Recovery Command Baseline

This document merges the working conclusions and command flow established across the recovery chat into one active baseline for this repo.

## Current operating truth

- This is a real SIRINX full-stack codebase, not a prompt-only artifact.
- The main blocker is environment assembly and local runtime restoration, not source-code loss.
- Work remains in rescue-first mode.
- Do not redesign.
- Do not start multilingual work.
- Do not refactor unrelated areas.

## Distinction that must stay explicit

- Implemented: code or config exists in the repo
- Validated: the code or config was proven in a real run
- Production-ready: safe and complete enough for real release

These are not the same.

## Core commands already established in the recovery flow

### Bootstrap and validation

```powershell
corepack pnpm install
corepack pnpm run check
corepack pnpm run test
corepack pnpm run build
corepack pnpm run dev
```

### Known-good local runtime target

```powershell
http://127.0.0.1:3000/
```

### Live runtime focus for the next increment

After adding a valid `DATABASE_URL` to `.env.local` or `.env`, re-run:

```powershell
corepack pnpm run dev
```

Then verify these routes first:

- `/`
- `/contact`
- `/assessment`

## What the previous validated recovery pass proved

- dependency bootstrap completed
- typecheck passed
- tests passed
- build passed
- local dev boot passed
- public routes rendered SIRINX content
- assets loaded on audited public pages

## What the previous live route audit observed

Public routes previously verified in a booted recovery copy:

- `/`
- `/about`
- `/solar-carport`
- `/solutions`
- `/industries`
- `/projects`
- `/contact`
- `/assessment`
- `/partner`
- `/blog`

Recurring blockers observed during that runtime audit:

1. unresolved analytics env placeholders caused malformed script requests
2. `analytics.trackPageView` failed with `Database not available`
3. auth warnings appeared, but public page rendering still worked

## Minimum env restoration order

1. `DATABASE_URL`
2. auth and OAuth values
3. `VITE_ANALYTICS_ENDPOINT` and `VITE_ANALYTICS_WEBSITE_ID`
4. Forge server integration values
5. frontend Forge and optional frontend-only values

## What is safe to do next

- sync the validated recovery fixes into this active repo
- install dependencies in this repo
- run `check`, `test`, and `build`
- boot locally
- restore `DATABASE_URL` before broader integration work

## What stays deferred

- redesign
- multilingual rollout
- provider parity
- chatbot parity
- speculative architecture work

## Immediate next command after dependencies are installed

```powershell
Set-Location "C:\Users\Ton36\OneDrive\เอกสาร\Playground\sirinx"; corepack pnpm run dev
```

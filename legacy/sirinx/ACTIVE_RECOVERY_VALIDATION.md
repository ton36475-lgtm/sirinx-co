# Active Recovery Validation

Date: 2026-04-18
Repo: `C:\Users\Ton36\OneDrive\เอกสาร\Playground\sirinx`

## Purpose

Preserve the first real validation pass after syncing the recovery baseline into the active repo inside the writable workspace.

## Recovery changes now present in this repo

- cross-platform `dev` and `start` scripts via `cross-env`
- runtime regression test for package scripts
- repo rule update in `AGENTS.md`
- safe `.env.example` and `.env.local.example` templates
- recovery baseline summary in `RECOVERY_COMMAND_BASELINE.md`

## Exact commands run

```powershell
corepack pnpm install
corepack pnpm run check
corepack pnpm run test
corepack pnpm run build
corepack pnpm run dev
```

## Results

### Dependency bootstrap

- `corepack pnpm install`: passed
- observed warning:
  - `@builder.io/vite-plugin-jsx-loc` has unmet peer expectation for Vite `^4 || ^5`
- observed note:
  - `pnpm` ignored build scripts for `@tailwindcss/oxide` and `esbuild` during install

### Typecheck

- `corepack pnpm run check`: passed

### Test

- `corepack pnpm run test`: passed
- result:
  - `7` test files passed
  - `125` tests passed
- note:
  - one expected stderr path in `server/routers.test.ts` logs an LLM failure scenario, but the test suite still passes

### Build

- `corepack pnpm run build`: passed
- warnings still present:
  - `VITE_ANALYTICS_ENDPOINT` undefined in `index.html`
  - `VITE_ANALYTICS_WEBSITE_ID` undefined in `index.html`
  - large chunk-size warnings after minification

### Dev boot

- `corepack pnpm run dev`: booted successfully in this repo
- during this validation run, port `3000` was reported busy and the app moved to `3002`
- verified response:
  - `HTTP 200` at `http://127.0.0.1:3002/`
- observed page title:
  - `SIRINX | Solar Carport ผลิตไฟฟ้าจากที่จอดรถ ลดค่าไฟ 30-100% คืนทุน 3-5 ปี พร้อม EV Charger & AI Energy`

## Important environment note

The first `test` and `build` attempts failed inside sandbox with `spawn EPERM`.
The same commands passed when re-run outside sandbox.

This means:

- implemented: yes
- validated in the active repo: yes
- production-ready: no

And specifically:

- the earlier `EPERM` result was an execution-environment restriction
- it was not evidence of a code regression in this repo

## Remaining blockers

- `DATABASE_URL` is still the first meaningful env value to restore
- analytics env placeholders still need real values or explicit local suppression
- auth and Forge integrations remain env-incomplete

## Exact next step

Add a valid local `DATABASE_URL`, then re-run:

```powershell
Set-Location "C:\Users\Ton36\OneDrive\เอกสาร\Playground\sirinx"; corepack pnpm run dev
```

Then verify:

- `/`
- `/contact`
- `/assessment`

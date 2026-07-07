# SIRINX Public Web Source Restored

Date: 2026-07-07T02:58:50.079Z
Source repo: https://github.com/ton36475-lgtm/sirinx.git
Source ref: main
Target path: apps/public-web

Imported paths:
- package.json
- pnpm-lock.yaml
- vite.config.ts
- tsconfig.json
- components.json
- drizzle.config.ts
- client
- server
- shared
- brands
- drizzle
- patches

Required validation:
- node scripts/verify-public-web-import.mjs
- pnpm --dir apps/public-web install --ignore-scripts
- pnpm --config.verify-deps-before-run=false --dir apps/public-web check
- pnpm --config.verify-deps-before-run=false --dir apps/public-web build

Safety: no deploy, no Cloudflare mutation, no secret read/print, no live-send.

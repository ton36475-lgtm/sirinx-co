# SIRINX/GHOSTCLAW Project Context

## Overview

SIRINX is an agent-native OS ecosystem powering GHOSTCLAW autonomous operations. The monorepo (`sirinx-agent-native-os`) contains:

- `apps/`: runnable products (web-sirinx, mission-control, dev-command-center)
- `packages/`: shared TypeScript libraries (project-os-core, command-broker, database, thclaws-runtime)
- `tests/`: cross-package regression tests
- `docs/`, `registry/`, `00_COMMAND_CENTER/`: architecture, migrations, state

## Tech Stack

- **Runtime**: Node.js + TypeScript (pnpm workspace)
- **Frontend**: Next.js (web-sirinx)
- **Backend**: tRPC, Fastify
- **Database**: PostgreSQL + Prisma
- **AI/Agent**: OpenCode, Codex CLI, codex-mcp-server
- **LINE**: LINE Messaging API via MCP (dry-run only)

## Key Constraints

- Local-first: no auto-deploy, push, or publish
- LINE mode: SIRINX_LINE_MODE=dry-run, SIRINX_LINE_AUTO_REPLY_APPROVED=false
- Production LINE traffic goes through sirinx.co/api/line/webhook
- Codex review required for all substantive changes

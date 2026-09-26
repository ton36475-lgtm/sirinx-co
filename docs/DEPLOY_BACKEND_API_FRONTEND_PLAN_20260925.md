# Backend -> API -> Frontend Deployment Plan

Status: plan only. No deploy, link, migration, secret retrieval, DNS mutation, or tunnel mutation is performed by this plan.

Date: 2026-09-25

## 1. Target topology

The documented production topology is:

```text
Internet
  -> Cloudflare www.sirinx.co
  -> Cloudflare tunnel
  -> sirinx-web :8080

Operators
  -> Cloudflare Access dev.sirinx.co
  -> Cloudflare tunnel
  -> sirinx-control :8711
  -> dev-control-api :8790
  -> dev-dashboard :8710
```

There are three API surfaces that must not be conflated:

| Surface | Owner | Port | Purpose | Exposure |
|---|---|---:|---|---|
| Public Rust web API | `sirinx-web` | 8080 | Landing pages, lead intake, ROI/API routes | Public through Cloudflare |
| Private control API | `sirinx-control` | 8711 | Gates, pending work, A2A sync, control authority | Private only, bearer token |
| Node long-tail API | `dev-control-api` | 8790 | Dashboards, A2A/OmniRoute, evidence and dry-run workflows | Private only |
| Public web tRPC API | `apps/public-web` Express server | app port | `/api/trpc` for public-web admin/blog/lead features | Same origin as frontend |

The public web tRPC server is part of the frontend deployable, not the Rust control plane. Decide whether the production frontend uses the Rust public API, the public-web tRPC API, or both before deployment.

## 2. Deployment order

### Phase 0. Freeze and scope

1. Choose the exact candidate SHA.
2. Separate the public-web repair diff from unrelated dirty work.
3. Record the target environment, candidate SHA, image tags, migration set, and rollback tag.
4. Confirm the operator ticket and the `deploy` gate.

Stop if the candidate SHA or target environment is not fixed.

### Phase 1. Supabase data plane

Supabase is a dependency of the Rust services, not a deployment target of the Node public-web app.

1. Select the intended project. The known `SIRINX` project ref is `frmpnjxynvpdsnoaqtnz` in Tokyo. Do not use the `Ghost` project by accident.
2. Create a backup and record the current schema/migration state.
3. Provision separate credentials:
   - Migration connection: direct administrative connection, migration job only.
   - Legacy web/control connection: connect-only, no DDL at startup.
   - Agent runtime connection: dedicated non-owner login for `AGENT_RUNTIME_DATABASE_URL`.
4. Provision the two `NOLOGIN` roles required by migrations `0005` and `0006` under a bootstrap ticket.
5. Apply migrations `0001` through `0006` through a separately ticketed migration job. Do not run migrations from application startup.
6. Verify from a read-back connection:
   - All expected tables exist.
   - RLS and forced RLS are enabled where required.
   - Runtime role has only the documented grants.
   - `anon`, `authenticated`, and `service_role` have no forbidden runtime privileges.
   - Startup attestation passes for the runtime login.
7. Run the disposable empty/prior-state migration and rollback suite before production.

Do not reuse the Supabase owner, `service_role`, or migration credential for the runtime service.

### Phase 2. Rust backend

Build both images from the same candidate SHA:

```bash
docker build --target web     -t sirinx-web:<sha>     .
docker build --target control -t sirinx-control:<sha> .
```

Start the public web service first:

```bash
docker run --rm -p 8080:8080 \
  -e DATABASE_URL="<legacy-web-non-owner-url>" \
  sirinx-web:<sha>
```

Start the control plane separately:

```bash
docker run --rm -p 8711:8711 \
  -e DATABASE_URL="<legacy-control-non-owner-url>" \
  -e AGENT_RUNTIME_DATABASE_URL="<agent-runtime-non-owner-url>" \
  -e CONTROL_API_TOKEN="<operator-secret>" \
  sirinx-control:<sha>

Note: the current control process does not yet construct the dedicated agent-runtime store. Passing this variable is preparation only, not runtime authority evidence.
```

Verification before routing traffic:

```bash
curl -fsS http://127.0.0.1:8080/health
curl -fsS http://127.0.0.1:8080/metrics
curl -fsS http://127.0.0.1:8711/health
curl -fsS http://127.0.0.1:8711/metrics
curl -fsS -H "Authorization: Bearer $CONTROL_API_TOKEN" http://127.0.0.1:8711/api/gates
```

Required observations:

- Web health is 200.
- Control health is 200.
- Persistence reports `backend=postgres` and `durable=true`.
- All mutation gates remain `hold` until their own tickets open.
- The runtime authority does not fall back to memory or an owner credential.

### Phase 3. API plane

#### 3A. Public web tRPC API

Build and start `apps/public-web` as one deployable:

```bash
pnpm --dir apps/public-web check
pnpm --dir apps/public-web test
pnpm --dir apps/public-web build
pnpm --dir apps/public-web start
```

The frontend and `/api/trpc` must use the same origin. Do not introduce a cross-origin tRPC dependency unless CORS and cookies are explicitly designed and tested.

Verify:

```bash
curl -fsS http://127.0.0.1:<public-web-port>/api/trpc/<smoke-query>
```

The tRPC surface includes public lead submission, blog reads, page analytics, and admin procedures. Admin procedures must not be enabled without authentication review.

#### 3B. Private Node API

Run `services/dev-control-api` only on the private control plane:

```bash
DEV_CONTROL_API_HOST=127.0.0.1 \
DEV_CONTROL_API_PORT=8790 \
node services/dev-control-api/server.mjs
```

Verify locally with the service's own smoke endpoints and `npm run control:test`. Do not expose port 8790 publicly.

### Phase 4. Frontend

1. Build the exact candidate frontend:

```bash
pnpm --dir apps/public-web build
```

2. Serve the generated `dist/public` assets through the same public-web runtime that serves `/api/trpc`, or through a deliberate static host with a verified rewrite to the API origin.
3. Verify the real browser path:
   - Homepage and hero slides.
   - `/projects` and `/projects/holatel-rim-nan`.
   - Footer certification assets.
   - Local reviewed project photos.
   - Mobile viewport and no horizontal overflow.
   - Lead form and API submission without duplicate or lost requests.
4. Confirm no placeholder image fallback is used for the reviewed portfolio.

### Phase 5. Edge routing

Only after backend, API, and frontend health checks pass:

1. Choose the tunnel. The current read-only state shows `sirinx-hybrid-tunnel` has no active connection, and `dev.sirinx.co` has no DNS record.
2. Validate ingress locally before creating any route.
3. Open the `cloudflare_dns` gate through a ticket.
4. Route `www.sirinx.co` to the public web origin.
5. Route `dev.sirinx.co` only behind Cloudflare Access.
6. Verify the apex redirect only if it is part of the approved change.
7. Run external health and browser read-back after the route is live.

Vercel is a separate decision. The existing `ghostclaw/public-web` Vercel project builds a minimal `api/index.js` lambda and is not linked to this checkout. Do not point the production domain at it without a separate Vercel application design and approval.

## 3. Acceptance gates

| Gate | Evidence required | Current state |
|---|---|---|
| Candidate scope | Exact SHA and clean public-web diff | Not satisfied, dirty tree |
| Supabase data | Backup, migration receipt, RLS/role read-back | Not available |
| Rust web | Image digest, health 200, metrics | Local in-memory only |
| Rust control | Token-protected health, durable Postgres, gates | Local memory only |
| Public tRPC | Same-origin smoke and auth review | Not externally deployed |
| Private API | Private-network smoke and token check | Not externally deployed |
| Frontend | Build, browser, asset and lead-flow read-back | Local checks only |
| Edge | Tunnel ingress, DNS, Access and rollback receipt | Held |
| Vercel | Correct app config, env names, preview verification | Wrong/unlinked project observed |

## 4. Rollback

1. Stop or drain the affected route.
2. Restore the previous image tag for `sirinx-web` and `sirinx-control`.
3. Stop the tunnel and restore the prior DNS state if the edge change is the cause.
4. Revert the frontend to the previous verified asset bundle.
5. Do not roll back a database by disabling RLS, using `service_role`, or deleting runtime tables.
6. Database rollback requires a reviewed migration job and snapshot, separate from the application rollback.

## 5. Current blockers

- Target platform is not decided between the documented Cloudflare/Rust topology and the separate Vercel project.
- No Supabase linkage or read-only database connection is available.
- All five control gates are held.
- Cloudflare tunnel has no active connection.
- `dev.sirinx.co` DNS is empty.
- The working tree contains extensive pre-existing changes.

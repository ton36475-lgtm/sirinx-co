# Rust Services Deploy Runbook

Status: **deploy gate = hold.** This runbook prepares everything up to —
but not including — the act of deploying. Opening the `deploy` gate in
`sirinx-control` (with a ticket) is a human decision.

## Build images

```bash
docker build --target web     -t sirinx-web .
docker build --target control -t sirinx-control .
```

Both stages come out of one `cargo build --release`; runtime images are
distroless (no shell, nonroot user, rustls — no OpenSSL).

## Run

```bash
# Public web + lead API (in-memory without DATABASE_URL)
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://…supabase…" \
  sirinx-web

# Control plane (binds 127.0.0.1 inside the container network)
docker run -p 8711:8711 \
  -e DATABASE_URL="postgresql://…supabase…" \
  -e CONTROL_API_TOKEN="<random 32+ chars>" \
  sirinx-control
```

`DATABASE_URL` and `CONTROL_API_TOKEN` come from the operator's secret
store — never from the repo.

The commands above describe the existing web/control compatibility path. They
do not activate the durable 47-role runtime. That runtime has a separate
least-privilege database contract in
[`docs/agent-runtime/POSTGRES_RUNTIME_AUTHORITY.md`](docs/agent-runtime/POSTGRES_RUNTIME_AUTHORITY.md)
and must use a dedicated `AGENT_RUNTIME_DATABASE_URL`; it must never reuse the
Postgres owner, migration credential, Supabase `postgres`, or Supabase
`service_role`.

## Database authority rollout (held)

The database rollout is split into separately receipted actions. A generic
deploy approval does not authorize any of them.

1. A bootstrap ticket creates the two non-login group roles and an
   environment-specific runtime login in the database/host secret store. No
   password or connection URL is written to the repository or report.
2. A production-migration ticket supplies a direct administrative connection
   only to the migration job and applies the reviewed migration set.
3. A secret-provisioning ticket supplies only the non-owner runtime connection
   to the future agent-runtime service.
4. Runtime startup attests role attributes, ownership, RLS, policies, exact
   grants, and forbidden capabilities before accepting work.
5. A deploy ticket may be considered only after the disposable empty/prior
   migration suite and rollback drill pass against the same candidate SHA.

Migration authority and runtime authority must not share a pool or credential.
Application startup is not accepted as production migration evidence.

## Production topology (planned, behind held gates)

```
Internet → Cloudflare (www.sirinx.co) → tunnel → sirinx-web :8080
Operators → Cloudflare Access (dev.sirinx.co) → tunnel → sirinx-control :8711
                                                       → dev-dashboard :8710
```

Cloudflare tunnel/DNS/Access changes stay behind the `cloudflare_dns`
gate per `CLOUDFLARE_EDGE_PLAN.md`.

## Verify after any deploy

```bash
curl -fsS https://www.sirinx.co/health
curl -fsS https://www.sirinx.co/metrics
curl -fsS -H "Authorization: Bearer $CONTROL_API_TOKEN" https://dev.sirinx.co/api/gates
```

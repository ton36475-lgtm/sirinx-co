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
distroless (no shell, nonroot user, rustls — no OpenSSL). Builder and runtime
base images are pinned by digest in `Dockerfile`; review any digest update as a
separate supply-chain change.

## Run

```bash
# Public web + lead API (in-memory without DATABASE_URL)
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://…supabase…" \
  sirinx-web

# Control plane (explicit container bind; default remains loopback-only)
docker run -p 127.0.0.1:8711:8711 \
  -e DATABASE_URL="postgresql://…supabase…" \
  -e CONTROL_API_TOKEN="<random 32+ chars>" \
  -e CONTROL_BIND_ADDR="0.0.0.0" \
  -e A2A_ENDPOINT="<peer-reachable-control-url>" \
  sirinx-control
```

`DATABASE_URL` and `CONTROL_API_TOKEN` come from the operator's secret
store — never from the repo.

`sirinx-control` stays loopback-only by default. Set
`CONTROL_BIND_ADDR=0.0.0.0` only inside the isolated production container
network, with `CONTROL_API_TOKEN` provisioned and the operator surface kept
behind Cloudflare Access. Publishing port 8711 without this explicit bind
remains fail-closed.

The host mapping remains loopback-only so a host-managed tunnel can reach it
without exposing the control port directly. A non-loopback container bind also
refuses to start unless `DATABASE_URL`, `CONTROL_API_TOKEN`, and a valid
peer-reachable `A2A_ENDPOINT` are all present.

`A2A_ENDPOINT` must be the reviewed URL that peer nodes can actually reach;
the local default `http://127.0.0.1:8711` is intentionally unsuitable for a
shared container deployment. Verify the advertised value through
`GET /api/a2a/card` before registering the node.

Building and locally smoking these images is preparation, not deployment.
This repository does not yet name a registry, runtime host/orchestrator, image
promotion command, or rollback target. `/api/actions` reports gate
authorization only; it is not a deploy executor. Stop after image evidence
until those targets and separate `GO-LIVE-DEPLOY-WEB-…` and
`GO-LIVE-DEPLOY-CONTROL-…` tickets are supplied. Each ticket must bind one
immutable image digest, one target, one expiry/nonce, and its own tested
rollback receipt; neither ticket authorizes the other service.

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

Verify response content as well as HTTP status: `/health` must identify
`sirinx-web`, `/metrics` must expose `sirinx_web_…`, and the authenticated
control response must contain the five canonical gates. Static landing-page
HTML at those paths is not Rust-service evidence.

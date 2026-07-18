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

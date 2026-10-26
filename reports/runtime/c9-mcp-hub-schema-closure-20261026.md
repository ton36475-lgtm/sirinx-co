# C9 closed at the origin — no unauthenticated schema surface on mcp.sirinx.co — 2026-10-26

Status: `CLOSED AT ORIGIN / NO CLOUDFLARE MUTATION / MCP STILL SERVES 42 TOOLS`

C9 offered two routes: put `mcp.sirinx.co` behind Cloudflare Access, or close
`/openapi.json` and `/docs` at the hub origin. The origin route was chosen because it
needs no cloud mutation, no Access policy and no token that this host does not have.

## What was open

`https://mcp.sirinx.co/openapi.json` and `/docs` answered **200 without auth** while
`/health` and `/mcp` correctly answered 401 — the schema published every route and
payload shape to anyone who asked.

## The change

`/Users/sirinx/hermes/bluezy-orch/src/hermes_agents/hub.py`, one line:

```python
app = FastAPI(title="hermes-mcp-hub", version="2.0.5",
              docs_url=None, redoc_url=None, openapi_url=None)  # C9: no unauthenticated schema surface
```

Backup: `hub.py.bak-20261026-c9`. The launchd job `ai.bluezy.hub` was kickstarted; it
reports pid 34913, status -15 (previous instance), and the uvicorn log shows
`Application startup complete`.

## Evidence

| Surface | Before | After |
|---|---:|---:|
| `127.0.0.1:8765/openapi.json` | 200 | **404** |
| `127.0.0.1:8765/docs` | 200 | **404** |
| `127.0.0.1:8765/redoc` | 200 | **404** |
| `https://mcp.sirinx.co/openapi.json` | 200 | **404** |
| `https://mcp.sirinx.co/docs` | 200 | **404** |
| `https://mcp.sirinx.co/health` | 401 | 401 (unchanged) |
| `https://mcp.sirinx.co/mcp` | 401 | 401 (unchanged) |

Auth and tool serving were re-proven, not assumed (hub token from
`/Users/sirinx/hermes/config/.env`, never printed):

```
POST /mcp initialize   → 200 {"protocolVersion":"2026-07-28","serverInfo":{"name":"hermes-mcp-hub","version":"2.0.5"}}
POST /mcp tools/list   → 200 in 8.95s, 42 tools (serena__replace_content, …)
```

`tools/list` fanned out across the hub's 35 stdio servers, so it needs a generous client
timeout; that behaviour is unchanged by this fix.

## Not done, deliberately

- No Cloudflare Access application, DNS record, tunnel ingress or WAF rule was touched —
  the edge still routes `mcp.sirinx.co` to `:8765` exactly as before.
- The hub's `/mcp` and `/health` remain token-gated by `MCP_HUB_TOKEN`; no credential was
  read into the repo, echoed, or rotated.
- If Access is still wanted as a second layer, C9's first option remains available as a
  separate owner action.

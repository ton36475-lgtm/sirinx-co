# SLayer MCP Local Config Runbook

## Status

SLayer is installed as an external local semantic database layer and has a
repo-local MCP config. It is not connected to production credentials and is not
running as a persistent service.

## External Repo

- Path: `/Users/sirinx/SIRINXDev/_external_repos/slayer`
- Commit: `9a76112b22ef1f5afa6b7d62a1cef694883c5b6b`
- Package: `motley-slayer`
- Version: `0.8.0`
- License: MIT
- Python: `>=3.11`

Do not vendor this external repo into the monorepo. Keep local environment
folders inside the external repo ignored by that repo's local exclude file.

## Verified Demo Storage

- Storage path:
  `/Users/sirinx/SIRINXDev/_external_repos/slayer/.local-demo/slayer_data`
- Datasource: `jaffle_shop`
- Models: `customers`, `items`, `orders`, `products`, `stores`, `supplies`,
  `tweets`

## Local MCP Config

- Ignored config slot: `.mcp.local/slayer-mcp.json`
- Ignored runbook slot: `.mcp.local/slayer-mcp-runbook.md`
- Ignored repo client config: `.mcp.json`
- Server name: `SLayerDemo`
- Command:
  `/Users/sirinx/SIRINXDev/_external_repos/slayer/.venv/bin/slayer`
- Args:
  `mcp --storage /Users/sirinx/SIRINXDev/_external_repos/slayer/.local-demo/slayer_data`

## Verification Commands

```bash
python3 -m json.tool .mcp.json >/tmp/sirinx-mcp.pretty.json
python3 -m json.tool .mcp.local/slayer-mcp.json >/tmp/slayer-mcp.pretty.json

cd /Users/sirinx/SIRINXDev/_external_repos/slayer
source .venv/bin/activate
slayer mcp --help
slayer datasources --storage .local-demo/slayer_data list
slayer models --storage .local-demo/slayer_data list
slayer query --storage .local-demo/slayer_data --format json \
  '{"source_model":"orders","measures":["*:count","order_total:sum"],"dimensions":["stores.name"],"order":[{"column":"order_total_sum","direction":"desc"}],"limit":2}'
```

## Boundaries

Allowed in this lane:

- Local demo storage verification
- Local MCP config shape validation
- Local query smoke against bundled demo data

Blocked without a separate approval packet:

- Production database credentials
- Public host binding
- Long-running MCP service
- Global MCP client mutation outside this repo
- Provider calls
- Deploy, push, publish

## Next Gates

- `APPROVE_SLAYER_MCP_HANDSHAKE_LOCAL_ONLY`
- `APPROVE_SLAYER_PRODUCTION_DATASOURCE_APPROVAL_PACKET`

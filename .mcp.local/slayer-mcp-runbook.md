# SLayer MCP Local Config Runbook

## Status

Local config slot created, but SLayer MCP is not globally active.

## Local Repo

- Path: `/Users/sirinx/SIRINXDev/_external_repos/slayer`
- Mode: external repo, not vendored into this monorepo
- Verified storage: `/Users/sirinx/SIRINXDev/_external_repos/slayer/.local-demo/slayer_data`
- Verified datasource: `jaffle_shop`

## Local MCP Config

- Path: `.mcp.local/slayer-mcp.json`
- Git status: ignored by `.mcp.local/`
- Server name: `SLayerDemo`
- Command: `/Users/sirinx/SIRINXDev/_external_repos/slayer/.venv/bin/slayer`
- Args: `mcp --storage /Users/sirinx/SIRINXDev/_external_repos/slayer/.local-demo/slayer_data`

## Activation Boundary

This lane only writes local config and evidence. It does not start the MCP
server as a persistent service, mutate a global MCP client, connect production
databases, call providers, publish, deploy, push, or open a public tunnel.

## Verified Local Checks

Use these checks before a later activation gate:

```bash
python3 -m json.tool .mcp.local/slayer-mcp.json >/tmp/slayer-mcp.pretty.json
cd /Users/sirinx/SIRINXDev/_external_repos/slayer
source .venv/bin/activate
slayer mcp --help
slayer datasources --storage .local-demo/slayer_data list
slayer models --storage .local-demo/slayer_data list
```

## Next Gate

`APPROVE_ACTIVATE_SLAYER_MCP_LOCAL_CLIENT_ONLY`

After this approval, merge `mcpServers.SLayerDemo` into the target MCP client
config and verify a local MCP handshake. Production database credentials still
need a separate approval packet.

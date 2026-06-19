# TestSprite MCP Local Config Runbook

## Status

Local config slot created, but TestSprite MCP is not active.

## Local Secret Slot

- Path: `.env.testsprite.local`
- Git status: ignored by `.env.*`
- Mode: owner-only
- Required variable: `API_KEY`

Do not commit the local secret file and do not copy the API key into tracked
docs, evidence packets, screenshots, or chat logs.

## Local MCP Config

- Path: `.mcp.local/testsprite-mcp.json`
- Git status: ignored by `.mcp.local/`
- Server name: `TestSprite`
- Package: `@testsprite/testsprite-mcp@latest`
- Secret source: `.env.testsprite.local`

## Activation Boundary

This lane only writes local config and evidence. It does not start the MCP
server, run TestSprite cloud validation, call providers, mutate Hermes routing,
publish, deploy, push, or open a public tunnel.

## Next Gate

`APPROVE_TESTSPRITE_REAL_KEY_INSERTED_VERIFY_LOCAL_ONLY`

After a real key is inserted locally, verify only key presence and config shape.
Starting the server still needs a separate approval.

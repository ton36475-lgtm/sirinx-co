# OpenCode LINE Official MCP

Status: staged disabled; no server start, package install, credential read, or
LINE API call has occurred.

The project-local OpenCode configuration registers LINE's official preview MCP
package as `line_official` and defines a `projectread` subagent. The server is
intentionally `enabled: false` because the upstream tool surface combines
read-only account metadata with message sends, broadcasts, follower/profile
reads, and rich-menu mutations.

## Current boundary

- The package is pinned to `@line/line-bot-mcp-server@0.5.0`.
- `LINE_CHANNEL_ACCESS_TOKEN` is referenced through OpenCode environment
  substitution; no value belongs in this repo or Obsidian.
- All `line_official_*` tools are denied globally.
- `projectread` can read only this worktree and cannot edit, run shell, invoke
  subagents, or access external directories.
- Only `get_message_quota` and `get_rich_menu_list` are staged as `ask` for
  `projectread`; the disabled server still prevents either call today.
- Profile/follower reads and every send/broadcast/rich-menu mutation remain
  denied.

## Separate activation gate

Activation requires an operator-reviewed external-read ticket naming the LINE
Official Account, the exact read tool, purpose, retention policy, and a
host-provisioned token. After that review, enable only the server for the
bounded session and retain OpenCode's per-tool approval prompts. Do not enable
message or mutation tools under a project-read ticket.

Any real send remains a separate customer-messaging action and is not
authorized by this configuration.


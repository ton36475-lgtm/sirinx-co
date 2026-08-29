# OpenCode A2A Write Handshake Job

- Job ID: `OPS-A2A-OPENCODE-20260720-001`
- Requested agent: `opencode`
- Expected CLI version: `1.18.3`
- Requested model: `opencode/deepseek-v4-flash-free`
- Mode: bounded local write
- Allowed write: `RESULT.md` in this directory only
- Forbidden: edits outside this directory, shell commands, package installs,
  Git operations, Telegram or customer messages, deploys, secret/config reads,
  session sharing, MCP calls, and agent spawning

## Task

Create `RESULT.md` in this directory. It must contain:

1. The exact Job ID.
2. `agent: opencode`.
3. `model: opencode/deepseek-v4-flash-free`.
4. `status: handshake-acknowledged`.
5. `write-scope: RESULT.md only`.
6. A short statement that this receipt proves one bounded OpenCode write job,
   but does not prove a persistent A2A connection or Telegram delivery.
7. `external-actions: one explicitly requested free-model inference; no other external action`.

Do not modify `JOB.md`. Stop immediately after writing `RESULT.md`.

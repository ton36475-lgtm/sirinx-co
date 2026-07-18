# Mac Node TCC Permissions Runbook

Purpose: stop macOS "app would like to access files" prompts on SIRINX
worker nodes (Mac mini M2 and any future Mac node) the sanctioned way —
pre-granting TCC permissions once — instead of auto-clicking dialogs.

Never auto-click TCC dialogs and never disable SIP/TCC. Both remove the
last human control and approve access for *any* process, not just ours.

## Level 1 — One-time grant in System Settings (single machine)

The file prompts come from the *host process* that runs the agent
(Terminal, iTerm2, VS Code), not from the agent itself.

1. System Settings → Privacy & Security → **Full Disk Access**.
2. Enable the app that hosts the agent sessions (e.g. Terminal / iTerm2 /
   Visual Studio Code).
3. Restart that app. Per-folder prompts (Desktop, Documents, Downloads,
   network volumes) stop for everything launched inside it.

If automation prompts appear (`osascript`, UI scripting), also grant the
host app **Accessibility** and approve the per-app **Automation** pairs
once.

## Level 2 — PPPC profile via MDM (repeatable, fleet-wide)

For supervised/MDM-enrolled Macs, Apple's mechanism for pre-approval is
a Privacy Preferences Policy Control (PPPC) payload. Template:
`infra/macos/sirinx-node-pppc.mobileconfig`.

Steps:

1. Find the designated code requirement of the host binary:

   ```bash
   codesign -dr - /Applications/iTerm.app
   ```

2. Put the `identifier` and the printed `designated => ...` string into
   the template's `CodeRequirement` field.
3. Deploy through your MDM (Full Disk Access via PPPC only applies on
   MDM-enrolled devices; it cannot be sideloaded by double-click).

## Temporary grant lifecycle (build window)

Chosen mode for mac-mini-m2: grant Full Disk Access only for the system
build window, then revoke when the build is done.

Enable (start of build window):

1. System Settings → Privacy & Security → Full Disk Access → toggle ON
   for the agent host app. Restart that app.
2. Record the grant in the table below with the date.

Revoke (end of build window) — either:

- System Settings → Privacy & Security → Full Disk Access → toggle OFF
  (keeps the entry listed, permission denied), or
- reset from Terminal so the entry disappears entirely and macOS will
  prompt again next time:

  ```bash
  # per app (example: iTerm2)
  tccutil reset SystemPolicyAllFiles com.googlecode.iterm2
  # Terminal.app
  tccutil reset SystemPolicyAllFiles com.apple.Terminal
  # VS Code
  tccutil reset SystemPolicyAllFiles com.microsoft.VSCode
  ```

3. Restart the app, verify a file prompt appears again, and mark the
   grant as revoked in the table below.

## Rules

- Grant to the narrowest host that needs it, not to `bash`/`sh`.
- Keep the granted-apps list in this file up to date per node.
- Revoke with System Settings or `tccutil reset` when a node is retired.

## Current grants

| Node | App granted | Scope | Granted | Revoked | Approved by |
| --- | --- | --- | --- | --- | --- |
| mac-mini-m2 | (fill in) | Full Disk Access — temporary, build window only | | pending | |

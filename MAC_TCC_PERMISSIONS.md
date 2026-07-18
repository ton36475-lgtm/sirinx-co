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

## Rules

- Grant to the narrowest host that needs it, not to `bash`/`sh`.
- Keep the granted-apps list in this file up to date per node.
- Revoke with System Settings or `tccutil reset` when a node is retired.

## Current grants

| Node | App granted | Scope | Date | Approved by |
| --- | --- | --- | --- | --- |
| mac-mini-m2 | (fill in) | Full Disk Access | | |

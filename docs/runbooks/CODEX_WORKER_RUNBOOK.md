# Codex Worker Runbook

Status: local-only worker procedure.

## Role

Codex is an implementation worker. It inspects, plans, edits approved scopes,
verifies, and reports. It does not own deployment, external service activation,
or final approval.

## Default Procedure

1. Confirm repo root and branch.
2. Check dirty state.
3. Read relevant governance files.
4. Produce or follow a task packet.
5. Stop for approval before edits if the gate requires it.
6. Apply the smallest approved patch.
7. Run targeted validation.
8. Report summary, files, commands, validation, risks, approvals, and next
   action.

## Safety Defaults

- Do not print secrets.
- Do not run deploy/push/publish commands.
- Do not start Docker or MCP servers without approval.
- Do not install global packages.
- Do not overwrite unrelated dirty work.
- Do not move canonical/legacy paths without approval.

## Completion Rule

Completion claims require current verification evidence or must be labeled as
unverified.

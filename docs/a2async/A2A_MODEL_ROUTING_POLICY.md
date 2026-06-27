# A2A Model Routing Policy

Model routing is alias-based. Adapters must resolve real provider IDs from the
installed tools before execution.

| Task class                                | Primary alias      | Confirmed route / fallback                                                                             |
| ----------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------ |
| architecture, deep planning               | `opus-5`           | `anthropic/claude-opus-4.8` confirmed ready                                                            |
| fast summary, routing                     | `fable-5`          | `anthropic/claude-fable-5` candidate currently credit-blocked; fallback to `anthropic/claude-opus-4.8` |
| repo execution                            | `codex-local`      | use active Codex worker/session or local Codex CLI; do not use KOB-hosted Codex models for this task   |
| OpenCode review or execution              | `opencode`         | local CLI discovered as `opencode`; lease required before scoped execution                             |
| AGY / Antigravity 2 scaffold or execution | `agy-antigravity2` | local CLI discovered as `agy`; lease required before scoped execution                                  |
| Manus artifact review                     | `codex-local`      | Codex inspects exported artifacts and prepares scoped docs/UI patches                                  |
| long context                              | `glm-5.2`          | local chunking or queued review                                                                        |
| local light reasoning                     | `ollama-local`     | no-provider dry run                                                                                    |

## Rules

- Do not hard-code paid provider calls into dispatch.
- Do not call external APIs in scaffolding.
- Do not route repo execution through KOB-hosted Codex models for this task.
- Treat `codex-5.6` as a legacy/profile label only unless local discovery
  proves a concrete executable route.
- Route OpenCode and AGY through executor leases and lane locks before any repo
  mutation.
- If a model is missing, write a policy block or fallback artifact.
- Large-context routing must estimate cost and context size before provider
  execution.

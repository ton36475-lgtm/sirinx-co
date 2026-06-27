# A2A Agent Cards

Agent cards describe worker identity, capability, model profile, runtime, and
policy boundary. JSON cards live under `agents/a2a/`.

## Required Fields

- `agent_id`
- `name`
- `role`
- `model_profile`
- `runtime`
- `capabilities`
- `default_tasks`
- `local_only`
- `blocked_actions`

## Registered Agents

| Agent                    | Role                                                           |
| ------------------------ | -------------------------------------------------------------- |
| `kob-cli-opus`           | Senior planning and synthesis                                  |
| `kob-cli-fable`          | Fast routing and compression                                   |
| `hermes-project-planner` | Project planning and external tool payload routing             |
| `codex-5-6`              | Repo execution worker                                          |
| `codex-local`            | Active Codex desktop/session repo executor                     |
| `opencode`               | Scoped coding/review executor, lease required                  |
| `agy-antigravity2`       | Scoped fast scaffold/refactor executor, lease required         |
| `deerflow`               | Long-horizon artifact runtime                                  |
| `flowise`                | RAG/chatbot/Agentflow builder                                  |
| `odysseus`               | Private workspace UI                                           |
| `n8n`                    | Automation workflow backbone                                   |
| `ponytail`               | Code minimalism review gate                                    |
| `manus`                  | Visual spec, HTML, website, slide, and video artifact producer |

## Safety Baseline

Every agent card is local-only in this phase. Cards do not grant the right to
start services, open ports, call providers, publish content, deploy, push, or
read secrets.

OpenCode and AGY can be scoped executors only after an executor lease and lane
lock exist. Codex-local remains the repo safety supervisor and final reviewer.

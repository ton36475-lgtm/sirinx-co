# GHOSTCLAW Local Agent Runner

`ghostclaw_runner/agent_runner.py` is the Fast Fix for A2A2A role dispatch.
It gives Hermes, Opus, GLM-5.2, DeepSeek, AGY Antigravity, and KOB a real
local inbox poller.

Default behavior is safe and local:

- reads `inbox/<role>/*.json`
- loads the role doctrine from `_OBSIDIAN_GHOSTCLAW_BRAIN` when present
- falls back to `ghostclaw_runner/prompts/<role>.md`
- writes `outbox/<role>/<task>.result.json`
- moves task envelopes into `tasks/completed/<role>/`
- appends `logs/runner-events.jsonl`
- does not call providers unless explicitly allowed

Example dry run:

```bash
python3 ghostclaw_runner/agent_runner.py --agent opus --once --dry-run
```

Bounded local watch mode:

```bash
python3 ghostclaw_runner/agent_runner.py \
  --agent all \
  --watch \
  --max-cycles 10 \
  --poll-interval 2 \
  --dry-run
```

Use `--max-cycles` for operator-reviewed runs. Leaving it at `0` watches until
the process is stopped, but still writes deterministic local dry-run results by
default.

Provider calls are opt-in only, local-router oriented, and require a Command
Broker lease:

```bash
python3 ghostclaw_runner/agent_runner.py \
  --agent opus \
  --once \
  --execute \
  --allow-provider-call \
  --provider-lease-path /Users/sirinx/SIRINXDev/.ghostclaw_runtime/command_broker/leases/provider-smoke.json \
  --litellm-url http://127.0.0.1:4000/v1/chat/completions
```

Do not use provider mode until LiteLLM routing, budget caps, and a valid Command
Broker lease are confirmed. Without that lease the runner fails closed before
moving any task from the inbox.

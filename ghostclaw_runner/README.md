# GHOSTCLAW Local Agent Runner

`ghostclaw_runner/agent_runner.py` is the Fast Fix for A2A2A role dispatch.
It gives Hermes, Opus, GLM-5.2, DeepSeek, and KOB a real local inbox poller.

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

Provider calls are opt-in only and still local-router oriented:

```bash
python3 ghostclaw_runner/agent_runner.py \
  --agent opus \
  --once \
  --execute \
  --allow-provider-call \
  --litellm-url http://127.0.0.1:4000/v1/chat/completions
```

Do not use provider mode until LiteLLM routing, budget caps, and Command Broker
policy are confirmed.

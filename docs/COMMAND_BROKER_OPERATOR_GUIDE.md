# Command Broker Operator Guide

Use this guide when the user asks to "unlock every command" or "approve all".
The correct interpretation is brokered command visibility, not unsafe
execution.

## Operator Flow

1. Generate the production broker lane:
   `python3 scripts/a2a/a2a_command_broker_production_lane.py`
2. Review Mission Control `Command Broker` panel.
3. Confirm the command risk tier.
4. Confirm required evidence.
5. Open a scoped executor lease only when the command needs local mutation.
6. Keep production actions blocked until deployment evidence is complete.

## Do Not Do

- Do not run `git add .`.
- Do not deploy from a dirty lane.
- Do not copy or print secrets.
- Do not disable logging.
- Do not turn `approve all` into a policy bypass.
- Do not let browser UI execute local shell commands.

## Deploy Lane

The pending `web-sirinx` deploy lane is visible to the broker, but actual
Cloudflare deploy remains blocked until check, test, build, asset manifest,
target binding, rollback, and health evidence are complete.

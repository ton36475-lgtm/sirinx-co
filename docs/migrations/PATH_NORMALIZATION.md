# Path Normalization

Locked root:
`~/SIRINXDev/sirinx-agent-native-os`

Old paths to remove from scripts/configs:
- `/Users/user_name/Documents`
- `/Users/sirinx/sirinx-os`
- `/ghost-claw-workspace`

Rule:
All local-first commands must run from the locked root unless explicitly scoped to `tools/`, `security-lab/`, or `legacy/`.

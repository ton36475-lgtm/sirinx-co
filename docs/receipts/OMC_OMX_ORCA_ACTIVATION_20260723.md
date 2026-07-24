# OMC, OMX, Orca, and Sub-agent Model Routing Receipt

Date: 2026-07-23 (Asia/Bangkok)

Repository: `/Users/sirinx/SIRINXDev/sirinx-agent-native-os`

Branch: `feat/sirinx-web-line-trust-v1`

Base HEAD: `efaaccab8b02cc5979b51499f0683f1a847488a6`

Status: `LOCAL_CONFIGURATION_VERIFIED`

## OMC

- Package: `oh-my-claudecode@omc`
- Version: `4.15.6`
- Scope: project local
- State: enabled
- Project settings digest:
  `33e4f2bb4ec808eb4438a49c86a68c4d3f0a9d6d4a05e70991f2484f7569c839`
- Verification: `claude plugin list` reports `Status: enabled`

No existing Claude session was hot-reloaded by this packet. Claude has no
verified non-interactive reload command for an existing session; use the
plugin's `/reload-plugins` command inside the intended project-local Claude
session or start a fresh session when a provider call is explicitly intended.

## OMX

- Package: `oh-my-codex`
- Version: `0.20.3`
- Scope: project
- Install mode: plugin
- MCP mode: none
- Team mode: enabled
- Project model config digest:
  `bfd49c422fbfe800063b8358049a10daec352dca73284f8fae0914eefd75c3f1`
- Agent profile count: 22
- Agent profile manifest digest:
  `87408c84837342a35e1cb9513888f3810b945c7bbd6821430eadcab98d4320e6`
- Doctor: 19 passed, 0 warnings, 0 failed

Every generated sub-agent profile and every `agentModels` entry is pinned to:

```text
gpt-5.3-codex-spark
```

The standard, spark, team, low-complexity team, and child-agent defaults are
also pinned to the same exact model. The stale sentence in the Metis role that
previously named `gpt-5.6-terra` was corrected to
`gpt-5.3-codex-spark`.

The primary/frontier leader remains `gpt-5.6-sol`; this receipt changes only
the approved sub-agent lanes. No canonical-project OMX agent run was started.

Protected global Codex files remained unchanged:

| File | SHA-256 |
|---|---|
| `/Users/sirinx/.codex/config.toml` | `2e5061454dd6493887a0b61c44d6fdf226797714a63c0abafb467587f24f10ce` |
| `/Users/sirinx/.codex/AGENTS.md` | `32aa6ef1dba86958a24d80dd5a492dc85bc4ec2393f7f72b73bf106006268868` |

## Orca

- Official cask: `stablyai/orca/orca`
- Version: `1.4.152`
- Application: `/Applications/Orca.app`
- CLI: `/opt/homebrew/bin/orca`
- Download SHA-256:
  `340b0c55a485477e1483db5c39c4547dfec8a93a611ea393dfc0c1201ce1265e`
- Code signature: valid
- Notarization: accepted
- Developer ID: `Lovecast LLC (6CX3WHS9HZ)`
- Runtime: `not_running`
- Graph: `not_running`

The unqualified Homebrew cask token `orca` collides with a different package.
Use the fully qualified `stablyai/orca/orca` token for inspection, update, or
uninstall.

No Orca app launch, login, repository registration, agent session, worktree,
mobile pairing, automation, merge, or provider call occurred.

## Exact-model manager proof

A separate research-only control repository invoked a single manager with:

```text
model=gpt-5.3-codex-spark
sandbox=read-only
session=ephemeral
approval=never
```

The first attempt exhausted its context and produced no artifact. The bounded
retry completed. The main reviewer independently verified and corrected its
evidence before producing:

- `/Users/sirinx/Documents/Codex/2026-07-21-a2a-livesync-hermes-agents-telegram-commander/research/pytorch-knowledge-manager/PYTORCH_KNOWLEDGE_MAP.md`
- `/Users/sirinx/Documents/Codex/2026-07-21-a2a-livesync-hermes-agents-telegram-commander/research/pytorch-knowledge-manager/PYTORCH_RESEARCH_RECEIPT.json`

Local research commit:
`0a4b138a24b0c77006428e4dc7509a632679c7db`

The collaboration-service model registry did not expose
`gpt-5.3-codex-spark`; it exposed only newer service models. No substitution
was made. The exact approved model was used through the authenticated local
Codex CLI instead.

## Security note

A provider credential became visible in process-environment diagnostic output
during inspection. Its value is intentionally excluded from this receipt,
Obsidian, and all user-facing output. Rotate the affected provider credential
and avoid environment-bearing process inspection in future diagnostics.

## External actions not executed

- provider call from OMC, OMX, Orca, or the canonical project
- MCP activation
- LINE/Telegram message
- Cloudflare mutation
- Git push, merge, or release

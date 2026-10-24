# Hermes launchd jobs (Mac mini M2)

The gateway already had a LaunchAgent (`ai.hermes.gateway`). These two close the
gap measured on 2026-10-24: the dashboard was a `nohup` process that would not
come back after a reboot, and the WhatsApp bridge had no supervisor of its own.

| Job | Process | Policy |
| --- | --- | --- |
| `ai.hermes.gateway` | `hermes gateway run --external-supervisor` | pre-existing, `KeepAlive.SuccessfulExit=false` |
| `ai.hermes.dashboard` | `hermes -p default dashboard --port 9119 --host 127.0.0.1 --open-profile solis --no-open` | `RunAtLoad`, relaunch on crash, park on clean exit |
| `ai.hermes.whatsapp-bridge` | `bash ~/.hermes/bin/whatsapp-bridge-launchd.sh` | same, but the wrapper **parks** while WhatsApp is disabled or unpaired |

All three are per-user (`gui/$UID`) agents, `LimitLoadToSessionType = Aqua +
Background`, pinned to `HERMES_HOME=/Users/sirinx/.hermes` so the profile
fallback warning stays out of the logs.

## Install / refresh

```bash
cp infra/macmini/launchd/ai.hermes.dashboard.plist      ~/Library/LaunchAgents/
cp infra/macmini/launchd/ai.hermes.whatsapp-bridge.plist ~/Library/LaunchAgents/
install -m 755 infra/macmini/launchd/whatsapp-bridge-launchd.sh ~/.hermes/bin/

launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/ai.hermes.dashboard.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/ai.hermes.whatsapp-bridge.plist
```

Re-bootstrap after editing a plist (`bootout` first); `launchctl kickstart -k
gui/$(id -u)/<label>` restarts a running job.

## Why the WhatsApp wrapper parses `.env` instead of always starting the bridge

The bridge cannot start without a session that is still paired with the phone.
On 2026-10-24 the stored session was logged out, so every start died with
`❌ Logged out. Delete session and restart to re-authenticate.` and the gateway
retried 61 times at 300 s. A plain `KeepAlive` job would turn that into a
`launchd` crash loop.

`whatsapp-bridge-launchd.sh` therefore reads `WHATSAPP_ENABLED` and checks
`whatsapp/session/creds.json`; when either is missing it logs `parked: …` and
exits **0**, which `KeepAlive.SuccessfulExit=false` treats as "stay parked".

When the bridge does run it uses the adapter's own argv
(`node bridge.js --port 3000 --session <dir> --mode self-chat`), which the
Hermes adapter adopts over `/health` (`_reuse_running_bridge`) instead of
spawning a second one — `adapter.py` even prints `Disconnecting (external
bridge left running)` when it did not spawn the child.

## Re-enable WhatsApp

```bash
hermes whatsapp                                        # scan the QR with the phone
sed -i '' 's/^WHATSAPP_ENABLED=false$/WHATSAPP_ENABLED=true/' ~/.hermes/.env
launchctl kickstart -k gui/$(id -u)/ai.hermes.whatsapp-bridge
```

Rollback for either job: `launchctl bootout gui/$(id -u)/<label>` and delete the
plist from `~/Library/LaunchAgents`.

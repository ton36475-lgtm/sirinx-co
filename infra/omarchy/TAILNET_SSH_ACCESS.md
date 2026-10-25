# Tailnet SSH access to the Omarchy node (measured 2026-10-23, re-measured 2026-10-25)

Status: `BLOCKED — policy action is holdAndDelegate at an unused URL` ·
this file is the exact patch + verification; it does not apply anything.

## What is actually blocking

`tailscale debug netmap` on the Mac mini returns the tailnet's SSH policy, and it
contains **one** rule:

```json
{
  "action": { "holdAndDelegate": "https://unused/machine/ssh/action/$SRC_NODE_ID/to/$DST_NODE_ID?local_user=$LOCAL_USER" },
  "principals": [ { "nodeIP": "100.121.170.83" }, … 26 entries … ]
}
```

The Mac mini (`100.90.189.112`) **is** one of those 26 principals, so the rule
already covers this source — the only defect is the action itself.
`holdAndDelegate` means Tailscale SSH cannot accept a session by itself: it must
delegate the approval to that URL, and `https://unused/...` is a placeholder, so
the approval can never succeed. That is why every attempt from the Mac mini ends
with:

```
remote software version Tailscale
tailscale: tailnet policy does not permit you to SSH as user "sirinx"
Connection closed by 100.87.189.34 port 22
```

It is not a missing host key, not a user that does not exist, and not the
node's `--ssh=false` join flag: the peer advertises **3** Tailscale SSH host
keys, so the SSH server is up. `root` and `omarchy` are refused identically.

Node facts (for the patch):

| | |
| --- | --- |
| peer | `omarchy` · `omarchy.tail73d7f2.ts.net` · `100.87.189.34` · linux · online |
| owner | `tondhm.z99@gmail.com` |
| Mac mini (source) | `100.90.189.112` |
| LAN/mDNS side door | **changed 2026-10-25**: `omarchy.local` now resolves to `192.168.1.138`, `:22` answers `SSH-2.0-OpenSSH_10.5` and offers `publickey,password`; password auth rejects `sirinx`, `ubuntu`, `tondhm` (both `password` and `keyboard-interactive`), so the LAN path still needs the correct OS account name. SMB anonymous probing and `_ssh._tcp` mDNS return nothing, so the name cannot be read off the wire |

## The change (admin console → Access controls → SSH)

Add an `accept` rule for this pair, above the existing `holdAndDelegate` rule:

```jsonc
"ssh": [
  {
    "action": "accept",
    "src":    ["100.90.189.112"],   // mac-mini M2
    "dst":    ["100.87.189.34"],    // omarchy
    "users":  ["autogroup:nonroot"] // any non-root local user on that box
  },
  {
    // leave the existing holdAndDelegate rule in place for everything else
    "action": { "holdAndDelegate": "https://unused/machine/ssh/action/$SRC_NODE_ID/to/$DST_NODE_ID?local_user=$LOCAL_USER" },
    "principals": [ /* unchanged */ ]
  }
]
```

Notes:

- `users` may name one OS user explicitly (e.g. `["sirinx"]`) once you know which
  account exists on the box; `autogroup:nonroot` avoids guessing.
- Narrowing `src`/`dst` by IP keeps the grant to this one pair. Tags work too if
  the node is tagged.
- Nothing else in the policy needs to change; the placeholder rule can stay for
  every other destination.
- Rollback = delete the added rule (the original policy is a single
  `holdAndDelegate` rule, quoted above).

## Verify the grant (read-only)

```sh
ssh -o BatchMode=yes -o ConnectTimeout=6 sirinx@100.87.189.34 'id -un; . /etc/os-release; echo $PRETTY_NAME'
```

Expected: a username and the Omarchy/Arch version. If it still refuses, the
`src` identity is wrong — check `tailscale status` for this host's IP in the
admin console's Machines list.

## Then apply the settings bundle

```sh
bash infra/omarchy/vibe-coding/remote-apply.sh --user=<that user> --preview
bash infra/omarchy/vibe-coding/remote-apply.sh --user=<that user> --apply
```

`remote-apply.sh` copies the bundle to `~/.cache/sirinx-vibe-bundle` on the node,
runs `apply.sh` preview first, then `--apply` and `--verify` only when asked. It
refuses on a non-zero SSH preflight and prints this file's path, so a policy
regression cannot look like a settings failure.

## Why this cannot be done from the CLI

`tailscale` (1.9x on this host) has no ACL/policy writer: the subcommand list is
`up/set/get/login/status/metrics/ping/nc/ssh/serve/funnel/service/file/cert/
lock/whois/drive/...`, and `tailscale debug` exposes no `acl` verb. This node is
the tailnet **owner and admin** (`cap/is-owner`, `cap/is-admin` in
`tailscale status --json`), so the authority exists — the transport does not.
Two ways to land the patch:

1. **API, scripted** — mint an access token (admin console → Settings → Keys →
   API access token) and run the checked-in applier. It reads the live policy,
   prepends the rule, writes with `If-Match`, re-reads to confirm, and can probe
   the host afterwards:

   ```sh
   TAILSCALE_API_TOKEN=... npm run tailnet:ssh                    # dry run
   TAILSCALE_API_TOKEN=... npm run tailnet:ssh -- --apply --check-host
   npm run tailnet:ssh:test                                      # 12 offline tests
   ```

   Idempotent: a second `--apply` prints `accept rule already present` and writes
   nothing. A concurrent console edit makes the write fail with HTTP 412 instead
   of overwriting it. Offline preview against a saved policy:
   `node scripts/tailnet-ssh-apply.mjs --policy-file=/tmp/acl.json --json`.
2. **Console** — paste the rule from above into Access controls → SSH. Needs the
owner's browser session; this host has no API key stored anywhere in the repo
(`grep tskey-api` → no hits) and no browser holds a tailnet session: Chrome's
three profiles, Safari, Firefox and Brave all have **0** `tailscale.com`
cookies (measured 2026-10-25), and reading Chrome's cookie key would require a
Keychain prompt that cannot be answered unattended (`security find-generic-password
-s "Chrome Safe Storage"` times out, rc 124).

## What this file does not do

No ACL edit, no API token, no SSH key installed, no `tailscale up` change, no
sudo, no service restart. There is no `TAILSCALE_API_KEY` on this host, so the
policy change is a console/API action by the tailnet owner; `npm run tailnet:ssh`
performs it only when that owner supplies a token.

## Applier verification (2026-10-25)

| Check | Result |
| --- | --- |
| `node --check scripts/tailnet-ssh-apply.mjs` | rc 0 |
| `npm run tailnet:ssh:test` | 12/12 pass |
| offline dry run on a policy shaped like the live netmap | inserts `accept` above `holdAndDelegate`, `grants`/`tests`/`autoApprovers` untouched, exit 0 |
| second apply on its own output | `changed: false`, `already present` |
| no token, no `--policy-file` | refuses with exit 2 before any network call |
| rule targets | `src 100.90.189.112` → `dst 100.87.189.34`, users `root` + `autogroup:nonroot` |

# SIRINX Agent Mesh Postman: local dry run

This folder contains a Postman v2.1 collection and an environment for local,
loopback-only inspection of the SIRINX agent mesh. The collection never starts,
stops, installs, or configures a service. Run it only against services that you
started and verified separately.

## Import

Import both files into Postman, then select **SIRINX Agent Mesh - Local Dry
Run**:

- `SIRINX_Agent_Mesh_Local_Dry_Run.postman_collection.json`
- `SIRINX_Agent_Mesh_Local_Dry_Run.postman_environment.json`

The pre-request guard skips a request if any configured base URL is not an
exact HTTP loopback URL (`127.0.0.1`, `localhost`, or `[::1]`). The shipped
defaults are:

| Service | Base URL | Purpose |
| --- | --- | --- |
| `sirinx-web` | `http://127.0.0.1:8080` | Health, package catalog, and pure ROI calculation |
| Rust `sirinx-control` | `http://127.0.0.1:8711` | Health, held gates, pending work, A2A card, and pure route selection |
| Node long-tail control | `http://127.0.0.1:8712` | Health and local-only truth/runtime/planning contracts |
| Optional Brain | `http://127.0.0.1:8787` | Health only; absence is allowed |

## Important port split

The current Rust control service and imported Node control service both default
to port `8711`, so they cannot bind at the same time on the same address. This
collection keeps Rust on `8711` and targets the future Node long-tail split on
`8712`. Configure the Node process outside Postman with
`DEV_CONTROL_API_PORT=8712` before starting it. Postman does not launch or
reconfigure either service.

## Strict non-mutation contract

The collection is operationally read-only. It contains health and metadata
GETs, the pure ROI calculator POST, pure A2A route selection, and the Hermes
spec-first plan/dry-run POST. None of these requests is intended to persist
state or execute a command.

There is no mutation opt-in and no disposable-backend assumption. Lead intake,
analytics intake, pending-work creation, A2A peer sync, gate decisions, and
action execution are absent from the collection.

`control_token` and `brain_token` are intentionally blank secret variables.
When a token is required, set only its Postman **current value** and keep
exports blank. The collection adds a bearer header only when the matching
variable is non-empty; it never prints either value.

The collection also excludes every Node `/write` route, live messaging,
provider invocation, Cloudflare mutation, billing, merge, and deploy surfaces.
The OpenRouter Fusion request is a GET of local readiness metadata only; it
does not call OpenRouter.

## Built-in checks

Every response is checked for a successful status and JSON body. Endpoint tests
then verify the expected shape. Collection-level checks verify:

- every configured base URL remains loopback-only;
- no secret-bearing response key is present;
- `externalWrites`, `canCallProvider`, and `commandExecuted` are `false`
  wherever those fields appear;
- related denial flags such as provider execution, deploy, push, publish, and
  external execution remain `false` wherever present;
- Rust control gates remain `hold`.

Runtime checks are evidence only for the request that just completed. An
offline optional Brain or a Node service still bound to `8711` is not reported
as ready by this collection.

## Static validation

From the repository root:

```sh
jq empty postman/SIRINX_Agent_Mesh_Local_Dry_Run.postman_collection.json \
  postman/SIRINX_Agent_Mesh_Local_Dry_Run.postman_environment.json

jq -r '.. | objects | select(has("request")) | [.request.method, (.request.url.raw // .request.url)] | @tsv' \
  postman/SIRINX_Agent_Mesh_Local_Dry_Run.postman_collection.json \
  | rg -n '/api/actions|/api/gates/[^[:space:]]+/decision|/write(?:[/?[:space:]]|$)|/(telegram|cloudflare|billing|merge|deploy)(?:[/?[:space:]]|$)|/(provider-call|invoke|execute|live-call)(?:[/?[:space:]]|$)'
```

The second command must return no matches (exit status `1`). It scans request
methods and URLs only, so documentation of excluded surfaces does not create a
false positive.

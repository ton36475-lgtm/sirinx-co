# Local release evidence conductor

This directory contains a fail-closed, local/preflight-only check for PR release
evidence. It reads one JSON file, prints one compact JSON result, and performs no
network, GitHub, billing, database, browser, merge, push, or deploy action.

```bash
node scripts/release/release-conductor.mjs \
  --evidence /absolute/path/to/release-evidence.json \
  --repository ton36475-lgtm/sirinx-co \
  --pr 8 \
  --sha b7ba23f86471797e330d334de4d6112813b45a9e \
  --browser-target https://ghostclaw-hermes-command-center.e-galli.chatgpt.site/ \
  --web-subject sha256:<trusted-web-release-subject> \
  --control-subject sha256:<trusted-control-release-subject>
```

Exit `0` is used only for `--help`. Every evidence evaluation exits `2`, even
when `packetShapeValid` is true, because trusted issuer verification and atomic
nonce claiming are not available. Exit `64` means the command or JSON input was
invalid. `preflightReady`, `mergeGateReady`, `rustDeployGateReady`,
`receiptAuthorityVerified`, `executionAuthorityGranted`,
`externalActionsExecuted`, and `productionComplete` are always false. The next
action is always `BLOCKED_UNVERIFIED_AUTHORITY`.

Important: receipt IDs, ticket IDs, approver IDs, nonces, timestamps, targets,
and digests are checked only for required shape, freshness, separation, and SHA
binding. This local tool does not query an authoritative ticket system, verify
an issuer identity or signature, consume an approval, or prove that an external
receipt is genuine. A caller-authored `consumed: false` value does not claim a
nonce and replaying the same packet cannot create authority. `SHAPE_VALID` and
`packetShapeValid: true` mean only that the closed local schema accepted the
packet. They are not PASS states or execution handoffs. Authoritative systems,
an atomic one-use claim store, and a human release owner must verify and consume
the receipts at action time; until those integrations exist this tool cannot
advance the release.

## Evidence envelope

Use `schemaVersion: "sirinx.release.evidence.v2"` and bind the envelope to the
same `repository`, numeric `pullRequest`, full 40-character `headSha`, and
`authorId` supplied by the release owner. The first six objects plus two
per-service deploy packets form eight ordered gates:

1. `billing`: external GitHub Billing `UNLOCKED` acknowledgement with a validity
   window.
2. `ci`: successful `GITHUB_ACTIONS` workflow run bound to the exact head SHA.
3. `migrations`: passed `0003` and `0004` receipt from Postgres marked both
   `disposable: true` and `disposed: true`.
4. `browserSmoke`: authenticated HTTPS smoke receipt bound to the exact SHA and
   exact `--browser-target`, with the exact owner/read-only/no-error assertion
   set and a validity window.
5. `review`: independent approval bound to the exact SHA; reviewer and PR
   author must differ.
6. `mergeAuthorization`: unconsumed, expiring, nonce-bearing approval with
   `scope: "merge-pr"`; self-approval is rejected and authorization lasts no
   longer than one hour.
7. `rustDeploy["sirinx-web"]`: an unconsumed ticket/authorization with
   `scope: "rust-service-deploy"`, an exact public production target, immutable
   web artifact digest, and its own tested rollback receipt. Those fields are
   hashed into `releaseSubjectFingerprint` and must match `--web-subject`.
8. `rustDeploy["sirinx-control"]`: a different unconsumed ticket,
   authorization, nonce, private production target, control artifact digest,
   and tested rollback receipt. One ticket, authorization, nonce, target,
   artifact, or rollback receipt cannot cover both services. Each deploy
   authorization lasts no longer than one hour. Its subject fingerprint must
   match `--control-subject`.

The expected subject fingerprints must come from a separately trusted release
record. Supplying fingerprints computed from the same caller-authored JSON only
checks internal binding; it does not establish provenance or authority.

The test fixture in `release-conductor.test.mjs` is the canonical field-level
example. The envelope and every nested object use closed schemas: every unknown
field, whether benign or secret-like, is rejected. Do not put secrets into any
allowed string field; this validator does not inspect or redact arbitrary
values.

Run the focused verification with:

```bash
node --check scripts/release/release-conductor.mjs
node --test scripts/release/release-conductor.test.mjs
```

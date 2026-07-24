# Resource Cleanup Review Request Evidence — 2026-07-21

Verdict: `FRESH_LOCAL_OBSERVATIONS_BOUND / COLLECTED_NOT_APPROVED / NO_CLEANUP / PRODUCTION_HOLD`

## Scope

This evidence refreshes only candidate C01:
`/Users/sirinx/SIRINXDev/sirinx-co/target`. It does not grant cleanup, implement
an executor, claim complete action-time evidence, or authorize the deferred
build/database/browser/model work.

The governing plan bytes have SHA-256
`859a31f0ed505450f78321d738f43b0d4f204ed745834b1436ab000536470ad1`;
the domain-separated A23 plan hash is
`57a56f10f23c7874c0788bf9bd065e2fd7707764df6996acceb030f86885162c`.

The closed observation packet is
`config/agent-runtime/resource-cleanup.review-request.v1.json`. Its request
digest is
`aecc0a0e0f6dd93bd1e4967a4ccbc754d9a7e003f432a9b086acaa19b09d8896`;
it expires at `2026-07-21T04:51:31+07:00` and cannot be refreshed by editing
the timestamp because every field is digest-bound. Expiry turns it into
historical review evidence, never reusable action-time evidence.

Latest-byte artifact pins after adversarial remediation:

| Artifact | SHA-256 |
|---|---|
| Request packet | `d7c700253d3b6a6666cb3f321960be00e3aa91a834cef3f0f232df7b7d661ec2` |
| Draft 2020-12 schema | `c9d2eb3a24fba841823b9ae89ab7e94dbb23602cdde488f347768558dac0fca8` |
| Pure validator | `a799948bf1bea32bfc3db3d92b80e75fb0638cc715c18400c86c7892531297bc` |
| Focused tests | `8ef57ad4de825dcd6290fbb0dff77e58cf21a4ef834c253ed242a889817dddae` |
| Contract documentation | `c0a55a0e3295b423caa4cd0d2cd2c717921c0e955f8c26cfcada7fbddecfa251` |

## Fresh observation

Captured read-only at `2026-07-21T03:51:31+07:00`:

| Field | Observation |
|---|---:|
| Repository branch | `agent/b1-b2-command-center` |
| Repository HEAD | `1f05814c3e9d173e525234d69b3ce7f2d1b01a57` |
| Protected-path-excluded porcelain-v2 entries | 256 |
| Path/status digest | `2aa76cd732e044d450d6c17a5b5425d3537e35e11ac7997bbfa6bf475118663b` |
| Filesystem / mount | `/dev/disk3s5` / `/System/Volumes/Data` |
| Free | `13,625,216 KiB` |
| Target device / inode | `16777232` / `35550880` |
| Target mode / link count | `0755` / `6` |
| Allocated / logical | `3,125,988 KiB` / `3,098,930 KiB` |
| Descendants | 27,787 |
| Regular files / directories | 26,826 / 961 |
| Symlinks / special files | 0 / 0 |
| Complete hard-link groups | 5,492 groups / 18,716 entries |
| Incomplete hard-link groups | 0 |
| Metadata-only inventory digest | `9f12ae322a275f3374eb31d61234bfd9b2444fe636c67e1d9a0c711b4c71661d` |
| Visible target references from target-scoped `lsof` | 0 records / 0 processes |

The Git observation excluded `.env` and `.env.*` content. The target inventory
read metadata only; it did not hash file content. The `lsof` result is limited
to processes visible to the current principal and is not promoted to complete
`ProcessEvidenceV1`.

The original inventory's “0 hard links” wording was ambiguous. A separate
metadata pass showed 18,716 entries in complete internal link sets and zero
incomplete groups. The request records both counts so “complete sets” cannot be
misreported as “no hard links.”

## Resource arithmetic

```text
current free                       13,625,216 KiB
plus nominal target allocation     3,125,988 KiB
nominal projected free            16,751,204 KiB
absolute 15 GiB floor             15,728,640 KiB
nominal headroom above floor        1,022,564 KiB
conservative 20 GiB target        20,971,520 KiB
shortfall to conservative target   4,220,316 KiB
```

The projection crosses the absolute floor only. APFS sharing, clones, sparse
allocation, filesystem concurrency, and cleanup overhead can reduce or obscure
actual reclaim. Guaranteed minimum reclaim remains zero until an action-time
collector proves otherwise, so the packet is not approval-ready.

### Independent current read-back

At the final independent read-back, `2026-07-21T04:29:38+07:00`, the target
identity and allocation still matched, but free space had fallen to
`11,818,956 KiB`, a decrease of `1,806,260 KiB` from the packet. The current
nominal arithmetic became:

```text
11,818,956 + 3,125,988 = 14,944,944 KiB
15 GiB floor             = 15,728,640 KiB
current nominal deficit  =    783,696 KiB
```

Thus C01 alone no longer nominally reaches the workload floor. The packet is
retained as immutable capture-time evidence and must not be presented as
current capacity or cleanup readiness.

## Tool identity observation

No Cargo or Rustup command was executed. Metadata and bytes identify:

- `/Users/sirinx/.cargo/bin/cargo` as a symlink to `rustup`;
- `/Users/sirinx/.cargo/bin/rustup`, SHA-256
  `aeb4105778ca1bd3c6b0e75768f581c656633cd51368fa61289b6a71696ac7e1`;
- repository selector `rust-toolchain.toml` with mutable channel `stable`;
- selected local Cargo candidate
  `/Users/sirinx/.rustup/toolchains/stable-aarch64-apple-darwin/bin/cargo`,
  SHA-256
  `ab0f670cc50bc74a6f79bc2250a9310515f71ab81d513748ce5a7f309808b3bf`.

The exact Cargo/Rust revisions were not probed and `RUSTUP_TOOLCHAIN` is not
bound in the A23 plan. The operation preview is therefore review material, not
`ExecutableIdentityV1` or executable admission.

## Independent red-team result

The review rejected a live Node approval collector. Required remediation
includes descriptor-relative no-follow traversal, ancestor/mount identity,
metadata-first hard-link refusal, two stable content passes, complete bounded
process and Git evidence, zero optimistic APFS reclaim credit, crash-safe output,
and replay/host/boot binding. These requirements are captured in
`docs/agent-runtime/RESOURCE_CLEANUP_REVIEW_REQUEST.md` for a future narrow Rust
collector.

The pure closed schema/validator and canonical packet pass 10 focused Vitest
cases, including strict Draft 2020-12 compilation, actual-packet validation,
plan/operation/exclusion pinning, checked arithmetic, hard-link accounting,
expiry, false-authority promotion, unknown fields, Proxy/accessor traps, and a
source scan excluding collector, filesystem, process, network, environment,
and write primitives. This proves only deterministic local validation of the
recorded proposal.

`npm run check` and the complete dev-control suite also pass (42 files,
326/326 tests). An adversarial review initially found a mutable validated
return, inclusive expiry, and schema/runtime tool-path mismatch. The validator
now returns a distinct deeply frozen clone, rejects exact-expiry use, and pins
both executable paths in Draft 2020-12; direct reproductions and the focused
suite pass, and the final latest-byte code-review verdict is `CLEAN`.

The independent evidence verdict is `VERIFIED` only for static,
proposal-only, recorded-observation scope. It explicitly classifies runtime
cleanup as `BLOCKED/HOLD`, treats the final no-effect list as a historical
attestation, and identifies the current disk drift above as material.

## Remaining blockers

- durable B10 cleanup authority, replay ledger, held circuit transition, and
  one-use human grant are absent;
- canonical full worktree, content-bound target manifest, complete process
  evidence, and action-time executable identity are absent;
- the mutable `stable` selector and exact revisions are unbound;
- offline recovery and guaranteed APFS reclaim are unproved;
- nominal free space remains below the conservative 20 GiB working target;
- executor, route, dispatch, and cleanup effects remain absent.

No cleanup, deletion, Trash move, install, build, database/model/service start,
provider call, MCP/A2A connection, Cloudflare mutation, Telegram/LINE send,
Git push/merge, or deploy occurred.

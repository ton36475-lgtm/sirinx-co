# Next.js 16.3 Command Center source/lock receipt

Status: `SOURCE_LOCK_VERIFIED / INSTALL_BUILD_RUNTIME_UNVERIFIED`

Observed at: `2026-08-16T08:10:19+07:00`

## Frozen scope

- Repository: `/Users/sirinx/SIRINXDev/sirinx-co`
- Branch: `agent/b1-b2-command-center`
- Base commit: `17382ad4a42f6ba787e99e4c52f2c9d5cec07a9c`
- Base tree: `25c7f42d706462cbcf67e710841774d5366a74f1`
- Package: `sites/ghostclaw-hermes-v3-command-center`
- Changed paths:
  - `MASTER_PLAN.md`
  - `package.json`
  - `package-lock.json`
  - `tests/rendered-html.test.mjs`
  - `vite.config.ts`
  - `reports/runtime/NEXTJS_16_3_COMMAND_CENTER_SOURCE_LOCK_20260816.md`

No other product source, configuration, or test path in `sirinx-co` was changed
in this slice.

## Exact toolchain candidate

| Package | Pinned version | Reason |
|---|---:|---|
| `next` | `16.3.1` | Stable Next.js 16.3 patch |
| `eslint-config-next` | `16.3.1` | Match Next.js |
| `react` | `19.2.8` | Match patched RSC peer set |
| `react-dom` | `19.2.8` | Match patched RSC peer set |
| `react-server-dom-webpack` | `19.2.8` | Fix `GHSA-wx67-qw84-cm4g` range |
| `vinext` | `1.0.0-beta.6` | Removes vulnerable `image-size` dependency; exact prerelease pin |
| `@vitejs/plugin-rsc` | `0.5.34` | Required Vinext peer |
| `vite` | `8.2.1` | Outside current Vite advisory ranges |
| `@cloudflare/vite-plugin` | `1.52.1` | Patched Cloudflare build chain |
| `wrangler` | `4.123.0` | Required Cloudflare plugin peer and patched build chain |

The existing `@vitejs/plugin-react@6.0.2`, Node `v22.23.1`, and project engine
floor `>=22.13.0` satisfy the candidate peer and engine ranges.

## TDD receipt

RED was observed before each lock repair:

1. The direct dependency contract failed on React `19.2.6` versus required
   `19.2.8`.
2. The transitive dependency contract failed on `@babel/core@7.29.0` versus
   required `7.29.7`.
3. The Cloudflare behavior contract failed because `compatibility_date` and
   the local-observability default were implicit.

GREEN after exact manifest pins, package-lock-only resolution, an explicit
behavior-preserving `compatibility_date: "2026-05-15"`, and
`X_LOCAL_OBSERVABILITY=false` by default:

```text
node --test tests/rendered-html.test.mjs
tests 7, pass 7, fail 0

npm ls --package-lock-only --all --json
problemCount 0

npm audit --package-lock-only --json
info 0, low 0, moderate 0, high 0, critical 0, total 0

git diff --check -- <four changed product paths>
PASS
```

All ten direct registry version, tarball, and integrity bindings matched the
current npm registry metadata. The lock is JSON-valid, lockfile version 3, and
contains 651 package records. The offline dependency contract additionally
binds the audited transitive versions, rejects `image-size`, checks the
Cloudflare and Vinext peer declarations, and requires a single locked copy of
React/RSC, Vinext, Vite, and Wrangler.

## Hash bindings

| Path | Base SHA-256 | Candidate SHA-256 |
|---|---|---|
| `MASTER_PLAN.md` | `dc8ee4450b64e82fb06a4e50c14c111b3e41945e6755d42ad5740a819b191072` | `c2e34b5004c4b11a7c9c957ab64e6b284a6475b03083eb3993ce0ce91643563f` |
| `package.json` | `9ec9c5f14d2e1d1c102894be1ae70412c161458f593215402680c5da894a8fcc` | `8865d80975a3ac6bac1d436984aff481369d34391fdb533ec48157c9eea2497a` |
| `package-lock.json` | `6aff324776d361de59552a84b0e87933b5d8002bad2f932f37973dce0ae94d46` | `b12e97a4fbb280c4a94ac8cb38b18366c098be04ddb347d790a6a9a16b963aa2` |
| `tests/rendered-html.test.mjs` | `0ec3f3b69cdcb513487ccc15108a612df7670d43decd0956f5daf43787e27c8f` | `5a41a4ba3b3701dc684e64699247e6b12822389376f5511a97bc7c384b7d2e0e` |
| `vite.config.ts` | `1bf34e7e5ec70cdbbff016be78cf0e37120e754396783498590aa505a95652ec` | `979eb3496220daed6a1d2bf6ac4ab7be5b6ea8cbb46ff88d9883a5ad63186fd4` |

## Claim ceiling

This receipt proves only the source manifest, lock graph, registry bindings,
deterministic contract tests, and static audit result. Existing `node_modules`
still contains the older dependency set and the rendered tests can load the
previous `dist/server/index.js` artifact.

A read-only `npm ls --depth=0 --json` against that pre-existing installed tree
exits with `ELSPROBLEMS`: its direct packages still resolve to the earlier
Next `16.2.6`, React/RSC `19.2.6`, Vinext `0.0.50`, Vite `8.0.13`, Cloudflare
Vite plugin `1.37.1`, and Wrangler `4.92.0` set, with legacy extraneous
packages. By contrast, `npm ls --package-lock-only --all --json` reports zero
problems for the candidate lock. This split is expected until the separately
gated isolated install and fresh-build validation occurs; it is not runtime
upgrade evidence.

It does not prove:

- installation from the candidate lock;
- lint or typecheck against the candidate packages;
- a fresh Vinext/Vite/Cloudflare production build;
- preview or production runtime behavior;
- Cloudflare upload, deployment, route, binding, or account state;
- Telegram, A2A, mobile-node, OCI, or provider activity.

No dependency installation, lifecycle script, build, server start, browser
start, provider call, deploy, commit, push, or external message occurred.

## Next isolated gate

`GC-COMMAND-CENTER-NEXT-16-3-ISOLATED-BUILD-VALIDATION-V1` must bind:

1. this exact repository, commit, tree, four candidate hashes, and a clean
   isolated worktree;
2. sufficient disk headroom and a bounded scratch/output directory;
3. one lock-frozen install with scripts disabled until independently reviewed;
4. lint, typecheck, fresh production build, and seven source/render tests;
5. a build-artifact digest proving `dist/server/index.js` came from this lock;
6. a post-build contract proving `dist/.openai/hosting.json` exists and exactly
   matches the frozen source hosting configuration;
7. a bounded loopback preview smoke test with no provider or deployment call;
8. terminal cleanup/disposition receipts for processes and scratch artifacts.

Any install, build, preview start, Cloudflare call, deployment, or source
promotion remains a separate effect and is not authorized by this receipt.

## Primary references

- Next.js v16.3.1 release: <https://github.com/vercel/next.js/releases/tag/v16.3.1>
- React RSC advisory: <https://github.com/react/react/security/advisories/GHSA-wx67-qw84-cm4g>
- Vite filesystem advisory: <https://github.com/vitejs/vite/security/advisories/GHSA-fx2h-pf6j-xcff>
- Cloudflare Workers SDK releases: <https://github.com/cloudflare/workers-sdk/releases>
- Vinext releases: <https://github.com/cloudflare/vinext/releases>
- Cloudflare Workers best practices: <https://developers.cloudflare.com/workers/best-practices/workers-best-practices/>

# Cargo lock refresh, Hermes toolchain pins, and the vite 8 / vitest 5 blocker — 2026-10-26

Status: `CARGO UPDATED / TOOLCHAIN PINNED / VITE TRIO STILL HELD (root cause found)`

## 1. Cargo

`cargo update` moved 22 packages inside their semver ranges (tokio 1.53.3 → 1.54.1,
plus serde/prost/tonic-family transitive bumps). `Cargo.lock` +44 / −44.

| Gate | Result |
|---|---|
| `cargo fmt --all --check` | rc 0 |
| `cargo clippy --workspace --all-targets -- -D warnings` | rc 0 (16.9 s) |
| `cargo test --workspace` | rc 0, **227 passed, 0 failed** |

Backup of the previous lock: `/tmp/Cargo.lock.bak`.

## 2. Hermes toolchain (`hermes pm`)

The venv is lockfile-managed by `hermes pm`, not pip — `pip list --outdated` is
meaningless there and forcing pip upgrades would desync `uv.lock`. The supported path
was used instead:

```
hermes pm update --check      # dry run
hermes pm update gh git npm
```

| Tool | Before | After |
|---|---|---|
| npm | 12.0.2 | **12.2.1** ✓ pinned |
| git | 2.53.0+3 | **2.56.0+4** ✓ pinned (POSIX still uses system git by design) |
| gh | 2.97.0 | ✗ **failed** — `too many values to unpack (expected 2, got 3)` inside `pm update`; the pin was not rewritten |
| node / python / uv / ripgrep / ffmpeg / chromium / cua-driver | — | up to date / already at pinned version |

`hermes pm doctor` after the run reports every installed entry ✓, including
`npm 12.2.1` and `python 3.14.9`. Gateway stayed healthy throughout:
`/health` 200 `0.22.5`.

## 3. Why vite 8 + vitest 5 still cannot land

Retried after the majors pass with the trio installed together (vite 8.3.5,
@vitejs/plugin-react 6.1.2, vitest 5.0.5): `tsc` rc 0, but **6 of 412 tests fail**:

| Test | Failure |
|---|---|
| `shared/siteContentConsumers.test.tsx` (2) | rendered markup has no `aria-label`, text is raw keys |
| `client/src/test/ProjectImage.test.tsx` (3) | same — English/Thai/Chinese labels missing |
| `client/src/components/three/SolarHeroScene.test.tsx` (1) | reduced-motion frame assertion |

Root cause found this round, and it is **not** the mock-call indexing I patched first:
`client/src/i18n/pages/*.ts` (10 files) import `../index`, while every other module and
the test import `@/i18n`. Under vitest 2 both resolve to one module instance, so the
page dictionary lands in the mocked `registerPageTranslations` spy. Under vite 8's
resolver they are **two module instances**: the page registration goes to the real i18n
registry, the component reads the mocked hook, and `register.mock.calls` stays empty
(measured: `REG_CALLS 0`). Rewriting the 10 page files to import `@/i18n` did not unify
them either — the spy still received zero calls.

So the remaining work is a test-infrastructure change, not a dependency bump: give the
suite one shared i18n mock keyed on the resolved module id (or render with the real
`LanguageProvider` instead of mocking i18n), then re-attempt the trio. The trio was
reverted to the exact previous `package.json` + lockfile; `vitest` is 412/412 again.

What did stay from that attempt is nothing — the defensive test edits from the earlier
pass are already committed, and the working tree is clean apart from `Cargo.lock`.

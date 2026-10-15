# R30-P1 receipt — 2026-09-28 (Lane A, freebuff in cmux)

Received: `docs/3d/HERO_DUPLICATE_DECISION_20260928.md` (the packaged deliverable), plus the
merged `apps/public-web/client/src/components/three/SolarHeroScene.tsx` and its test.

Verdict received: **merge — the 1,200-point solar dust flow only — then retire
`hero-solar-core/` under `APPROVE_HERO_DUPLICATE_DELETE`.** Nothing was deleted; the folder
is on disk unchanged; no gate was consumed.

Validation re-run from `apps/public-web` against the merged tree:

- `pnpm exec tsc --noEmit` — exit 0.
- `pnpm vitest run --root . client server shared` — 47 files / 359 tests pass (R29 baseline
  47 / 358). `SolarHeroScene.test.tsx` is 8 of those, up from 7.
- `pnpm build` — exit 0, prerendered province pages regenerated.
- Bundle delta measured from two real builds of the same file: hero lazy chunk
  6,489 → 7,059 B min (2,871 → 3,130 B gzip); shared `three.module` chunk byte-identical;
  entry chunk unchanged and never reaches three.

Red proof observed twice, both mutations real defects, source restored and sha256-verified
between runs:

- `Points` removed from `disposeGpuResources` → `expected "spy" to be called 1 times, but
  got 0 times` (1 failed | 7 passed).
- `renderer.dispose()` removed from cleanup → same failure shape on the pre-existing
  idempotent-dispose test.

Ownership deviation declared: `SolarHeroScene.test.tsx` was edited (4 mock classes + 1 test)
because the merge cannot load under the old `three` mock and the red proof requires the new
feature to be covered. This is the component's own test file, untracked R29 work owned by no
other lane. Reported rather than hidden.

Unverified, and named as such: no real-browser render of the merged hero (no
Playwright/puppeteer installed; installing needs its own approval; a direct headless-Chrome
attempt aborted with `CVDisplayLinkCreateWithCGDisplay failed`), and the particle field's
appearance on `/` — it was authored for a different camera than the receiving scene.

Incident recorded: a bare `vite build` empties `dist/public` (`emptyOutDir: true`), which
broke the two `shared/crawlReachability.test.ts` tests that crawl the built HTML. The full
`pnpm build` restored the prerendered output and the suite went back to green. `dist/` is
gitignored; nothing outside it changed.

Side effects: network: localhost only (static-file server on 127.0.0.1:8123 for one
headless-Chrome attempt, stopped); provider_calls: 0; install: false; secrets_read: false;
deploy: false. No commit, no push, no delete, no `git clean/checkout/stash/reset`.

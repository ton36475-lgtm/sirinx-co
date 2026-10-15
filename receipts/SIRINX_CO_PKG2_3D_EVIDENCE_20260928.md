# PKG-2 receipt — 2026-09-28

Received: new `SolarHeroScene.test.tsx` and `EnergyFlowShader.test.ts`, plus the evidence report.

Validation attempted from `apps/public-web`:
- Focused Vitest: EnergyFlowShader tests passed (3); SolarHeroScene suite currently fails (6 of 7 assertions) and is not a green lifecycle suite.
- `npx vitest run --root . client shared`: failed because the existing `ProvinceScenes.test.ts` reduced-motion assertion fails (1) and new SolarHeroScene tests fail (6). Overall exact suite totals must be re-run and recorded after test-harness correction.
- `npx tsc --noEmit`: invoked; result not captured in the available command output, therefore unverified.
- `npm test`: failed on the same ProvinceScenes reduced-motion assertion and the SolarHeroScene suite; exact totals require a clean output capture.

Deliberate dispose break/red/restore/green cycle: **not performed**. Tests remain unverified for resource cleanup. No claim of pass is made.

Hero implementation assessment: SolarHeroScene misses resize DPR re-cap, hidden-document rAF pause, context loss/restore, actual cleanup handoff/idempotent disposal, true one-frame reduced-motion behavior, and screen-reader textual fallback. hero-solar-core duplicate remains present because its distinct particle system/shader/style/demo have not been merged; report lists unique pieces and explains the ownership boundary.

R28a `AUTHORIZE_ALL_AUTOMATIC_SAFE_PIPELINE` is blanket approval and authorizes no individually gated action. No R28a history was changed.

Side effects: network: none; provider_calls: none; deploy: false; secrets_read: false. No commit, push, page wiring, or deploy.

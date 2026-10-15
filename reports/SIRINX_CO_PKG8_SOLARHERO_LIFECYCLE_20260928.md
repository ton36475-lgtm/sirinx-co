# SolarHeroScene lifecycle remediation

Date: 2026-09-28

## Scope and changes

Only `apps/public-web/client/src/components/three/SolarHeroScene.tsx` was changed. The lifecycle now caps pixel ratio at 2 both on creation and resize; pauses scheduling while `document.hidden` or offscreen and resumes when eligible; prevents default on WebGL context loss, cancels the frame loop, disposes scene GPU objects behind an idempotence guard, and re-renders/resumes on restoration. Unmount disconnects observers/listeners and disposes renderer/resources once. The canvas is `aria-hidden`; its parent supplies an accessible `role="img"` and descriptive label without visible text. Reduced-motion still renders one static frame.

Three.js is currently imported through a static namespace to make initialization deterministic within the test harness, replacing the prior dynamic import. This changes the prior lazy-import code-splitting behavior and should be reconsidered before this component is wired into a page.

## Verification

Baseline reported by coordinator: 1 failed / 46 passed test files; 6 failed / 352 passed tests.

Final results:

- `npx vitest run --root . client/src/components/three`: **3 passed files, 15 passed tests**.
- `npx tsc --noEmit`: **passed**.
- `npm test`: **47 passed files, 358 passed tests**, zero failures.

All six previously failing behavior areas now pass the supplied test suite: accessible decorative canvas and parent label, initial and resize DPR cap, hidden-document frame stop, offscreen pause, context loss/restoration event handling, and idempotent unmount disposal. Existing reduced-motion static-frame test also passes.

The tests verify event handling and output, not actual GPU reallocation on physical context restoration. Restoration relies on Three.js renderer context restoration and its re-upload/recompile of retained geometry/material state, then explicitly repaints and restarts the loop. No real browser/device context-loss cycle was exercised. The tests themselves were not modified. No test is believed incorrect based on the executed results.

## Side effects and gates

network: none  
provider_calls: none  
deploy: false  
secrets_read: false  
No commit or push performed. The component remains unwired.

## Test harness note

Vitest emits React `act(...)` environment warnings from the existing test setup; they do not fail the suite.

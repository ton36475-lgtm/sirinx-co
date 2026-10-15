# PKG-2 3D evidence report — 2026-09-28

## Scope and result
Added direct tests for `SolarHeroScene` and `EnergyFlowShader`. The new scene tests intentionally assert lifecycle, canvas accessibility and behavioral requirements. Source inspection immediately shows multiple requirements are not implemented. The component is not wired into any page.

## Requirement audit: SolarHeroScene vs province scenes

| Requirement | SolarHeroScene | ProvinceSolarScene | ProvinceYieldChart3D |
| --- | --- | --- | --- |
| Dynamic/lazy import | Three dynamically imported in effect, but shader is static import | Three and controls dynamically imported | Three and controls dynamically imported |
| DPR <= 2 initially | Yes | Yes | Yes |
| Re-cap DPR on resize | **No**; resize only updates size/aspect | **No**; resize only updates size/aspect | **No**; resize only updates size/aspect |
| Pause rAF when document.hidden | **No**; no visibility listener | **No** | **No** |
| Pause offscreen | **Partial**; skips drawing but schedules rAF continuously | **Partial**; same | **Partial**; same |
| Lost context | **No** listener | Prevents default on lost | Prevents default on lost |
| Restore context | **No** | **No** | **No** |
| Idempotent dispose / resource release | **Fails**; async callback returns a cleanup function that React never receives; outer cleanup only cancels current rAF, often zero | Cleanup is stored and releases explicit resources; repeated calls are not separately guarded | Cleanup is stored and releases explicit resources; repeated calls are not separately guarded |
| Reduced motion single static frame | **Fails**; the loop continues scheduling frames indefinitely and renders repeatedly | **Fails**; tick schedules continuously and renders repeatedly at static noon | **Fails**; tick schedules continuously and renders repeatedly |
| Decorative canvas aria-hidden + SR fallback | Canvas/host aria-hidden, but there is no meaningful screen-reader fallback | Canvas aria-hidden and visible HTML data overlay | Canvas aria-hidden and visible figcaption/data overlay |

The separate production measurement reported for the province components is consistent with source inspection: reduced-motion does not stop their loops, and lost context is not restored.

## Test evidence / red proof
The added scene tests have not yet completed an observed red/green mutation cycle. `dispose()` is already defective in the checked-in source, so the resource-release test is expected to fail without a deliberate mutation. This is **unverified**, not a pass. Do not treat the historical R28a 82-test count as evidence for these files.

## hero-solar-core verdict
**Merge verdict: do not delete the folder yet; preserve it as an unmerged source payload, so the duplicate-implementation defect remains open.** The folder contains unique work not present in SolarHeroScene: a 1,200-particle flow and particle update loop, time-distorted icosahedron shader with Fresnel rim, independently configurable particle/rotation speeds, a standalone demo, and a distinct presentation stylesheet. Deleting now would lose those unique parts. Correct resolution requires merging the particle/core shader behavior into SolarHeroScene, then retiring the duplicate class/preview/styles. The assignment allows edits in hero-solar-core only, not SolarHeroScene.tsx, so this lane cannot safely perform that merge without exceeding file ownership. No files in the folder were deleted or modified.

## R28a gate correction
R28a's `AUTHORIZE_ALL_AUTOMATIC_SAFE_PIPELINE` is blanket approval, not approval for any individually gated operation. It clears no specific item. R28a history is not rewritten.

## Side effects
network: none; provider_calls: none; deploy: false; secrets_read: false. No commit or push. No page wiring.

## Validation status
The requested real Vitest, TypeScript, and npm test commands and checksum verification must be recorded with their actual output before this report can be considered complete. Current known status: lifecycle/red-proof cycle unverified; core duplication unresolved due ownership restriction.

# hero-solar-core

Self-contained Three.js + GLSL hero: distorted icosahedral solar core, Fresnel rim glow, 1,200-particle flow.

React mount (put the ref'd div inside `<div class="hero-solar">`, and `import './hero-solar-core/solar-core.css'`):

```tsx
const core = new SolarEnergyCore(mount.current!)
core.start()
return () => core.dispose()   // required
```

`dispose()` is idempotent — safe to call twice: cancels the rAF loop, removes the resize +
visibilitychange listeners, and disposes every geometry, material, light and the renderer.
Pixel ratio is capped at 2 (re-capped on resize); the loop pauses while `document.hidden`.

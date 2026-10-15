# ART ENGINEERING BRIEF — www.sirinx.co (PKG-6, Lane A)

Status: LOCAL_ONLY · 2026-09-28 · Gate consumed: **none**
Owner per `docs/media/LANE_ASSIGNMENT_20260928.md` §2: **Lane A (freebuff)**
Rule followed: every claim cites a real file in the repo. Claims that could not be
pinned to a file were cut, per the Lane A order.

---

## 1. Art direction (one sentence)

Dark clean-tech editorial: real engineering photographed with real astronomy —
obsidian structure, solar-amber energy, restrained cyan data — where every number
shown is sourced and every decorative element is aria-hidden.

Evidence: `apps/public-web/client/src/index.css` (brand tokens §"SIRINX Brand Tokens"),
`apps/public-web/client/src/components/three/ProvinceSolarScene.tsx` (figcaption
disclaimer pattern), `docs/3d/IMAGE_SYNTHESIS_PROMPT_CATALOG_20260928.md` §1.

## 2. Palette (all values from real files)

| Role | Value | Source file |
| --- | --- | --- |
| Brand primary (logo cyan) | `oklch(0.72 0.17 192)` | `client/src/index.css` `--color-brand` |
| Light-theme accent (orange family) | `oklch(0.65 0.18 45)` | `client/src/index.css` `--accent-primary` (light `:root`) |
| Dark background | `oklch(0.12 0.02 260)` | `client/src/index.css` `.dark --background` |
| Dark accent cyan | `oklch(0.82 0.17 192)` | `client/src/index.css` `.dark --accent-primary` |
| Dark accent amber | `oklch(0.82 0.17 80)` | `client/src/index.css` `.dark --accent-secondary` |
| 3D energy amber (GLSL uniform) | `0xffb800` | `client/src/components/three/SolarHeroScene.tsx` (`uColorCore`), `EnergyFlowShader.ts` header comment |
| 3D energy cyan (GLSL uniform) | `0x00f0ff` | same, `uColorGlow` |
| Structural steel | `0x78716c` | `ProvinceSolarScene.tsx` (`steel` material) |
| Panel blue + emissive | `0x0ea5e9` / `0x0c4a6e` | `ProvinceSolarScene.tsx` (`panelMat`) |
| Ground / fog | `0x1c1917` / `0x0c0a09` | `ProvinceSolarScene.tsx` (ground material, `scene.fog`) |
| Sun disc | `0xfbbf24` | `ProvinceSolarScene.tsx` (`sunDisc`) |
| Tone mapping | ACES filmic, exposure 1.05–1.1 | `ProvinceSolarScene.tsx`, `SolarHeroScene.tsx` |

Palette law: cyan is reserved for brand/logo and data; amber is reserved for energy
and sunlight; structure stays neutral stone/graphite. The dark theme is the canonical
rendering mood for 3D scenes; the light theme exists for day-mode pages.

## 3. Typographic scale

| Token | Value | Source |
| --- | --- | --- |
| Display font | `"Space Grotesk", system-ui, sans-serif` | `client/src/index.css` `--font-display` (headings bound via `h1..h6` rule in `@layer base`) |
| Body font | `"IBM Plex Sans Thai", system-ui, sans-serif` | `client/src/index.css` `--font-body` |
| Hero H1 scale | `text-4xl sm:text-5xl lg:text-6xl xl:text-7xl`, `leading-[1.1]` | `client/src/components/HeroSlideshow.tsx` (line ~365) |
| Section H2 scale | `text-2xl lg:text-3xl font-bold` | `client/src/pages/About.tsx`, `Pricing.tsx`, `Solutions.tsx` (consistent pattern) |
| Card/H3 scale | `text-sm font-semibold` (display) | `About.tsx`, `Projects.tsx` |
| Body copy | `text-sm lg:text-base leading-relaxed` | `client/src/components/ProvinceLongform.tsx` |
| Data/labels | `text-xs`–`text-sm`, `font-medium` | `Layout.tsx`, `Pricing.tsx` |

Type law: display font carries numerals in headlines; body font must be the Thai-capable
IBM Plex Sans Thai; numbers in data overlays are never stylized smaller than `text-xs`
and always sit beside their source line.

## 4. Motion grammar (easing / duration / stagger)

Single source of truth: `apps/public-web/shared/motionTokens.ts`
(tested by `shared/motionTokens.test.ts`, 8/8 red-provable per
`receipts/SIRINX_CO_PKG1_MOTION_TOKENS_20260928.md`).

| Grammar | Token | Value |
| --- | --- | --- |
| Durations | `instant → heroCrossfade` | 0 / 0.15 / 0.2 / 0.25 / 0.35 / 0.5 / 0.8 / 1.2 s — micro ≤ 0.3 s, hero ≤ 1.5 s LCP ceiling |
| Easings | `easeOutCubic` `[0.33,1,0.68,1]`, `easeOutQuart` `[0.25,1,0.5,1]`, `editorial` `[0.16,1,0.3,1]`, `easeInOutCubic` `[0.65,0,0.35,1]`, `linear` | `motionTokens.ts` — editorial for hero slides, linear for continuous 3D flows |
| Springs | `snappy` 400/30 · `smooth` 260/24 · `gentle` 170/22, mass=1 | `motionTokens.ts` |
| Staggers | tight 0.04 · standard 0.08 · loose 0.12 | `motionTokens.ts` |

Motion law (current state, honest): homepage entry motion is **disabled** —
`shared/motionFlags.ts` exports `MOTION_HOME_ENABLED = false` ("Keep homepage motion
disabled until real LCP measurements are available"), so `static-motion` shim pages
render static while 13 inner pages use `framer-motion` directly. The decision record is
`docs/3d/MOTION_DECISION_20260928.md`; flipping the flag needs
`APPROVE_MOTION_HOME_ENABLED_TRUE` after real LCP numbers (PKG-5). No hardcoded
durations anywhere: consumers must read tokens.

## 5. 3D camera language

| Scene | Camera grammar | Source |
| --- | --- | --- |
| Province solar carport | Orbit camera start (14, 9, 14), target (0, 1.6, 0), distance clamp 8–32, polar clamp just above horizon, fog 30–90 | `client/src/components/three/ProvinceSolarScene.tsx` |
| Province yield infographic | Map-of-Thailand column chart, one column per real lat/lon, highlight = current province, height/colour encode real specificYield | `client/src/components/three/ProvinceYieldChart3D.tsx` header + `provinceEnergyStats.ts` |
| Hero energy core | Fixed camera (0, 1.2, 8.5) fov 45, mouse-parallax lerp factor 0.04, slow rotations 0.15/0.08/−0.05 rad/s, additive-blend conduit ring radius 2.8 | `client/src/components/three/SolarHeroScene.tsx` |
| Sun animation | 06:00 → 18:30 loop placing the sun by **real NOAA position** for the province's coordinates, solstice reference day; reduced-motion renders one static solar-noon frame | `ProvinceSolarScene.tsx` `placeSun()` + `shared/sunMath.ts` |

Camera law: the sun is never placed decoratively — it comes from `sunMath.ts`; the
camera never clips through the model (distance clamps); fog grounds the scene in the
dark palette; tone mapping is always ACES.

## 6. Illustration style rules

From `docs/3d/IMAGE_SYNTHESIS_PROMPT_CATALOG_20260928.md` §1 (allowed/prohibited list)
and the data-bound extension §2b + `docs/media/prompts/README.md`:

1. Photoreal editorial or precise CAD/infographic — never cartoon, never fantasy props.
2. Prohibited: cartoonish elements, floating fantasy objects, blurry textures,
   sci-fi clutter, watermarks, oversaturation.
3. Any image asserting a figure must be generated from
   `docs/media/prompts/prompts-bound-20260928.json` (values parsed from
   `shared/provinceEnergyData.ts`, sun from `shared/sunMath.ts`) and must ship with the
   PVGIS disclaimer. Number-free structural/product prompts stay number-free.
4. Prefer **not** generating at all where the site already has a real asset: 77/77
   province illustrations are rendered locally from PVGIS + NOAA
   (`docs/seo/generate-province-images.mjs` pipeline) — generation slots must earn
   their cost. The selection is now made: exactly **3 slots** qualify, each with its
   justification and rejected alternatives —
   `docs/3d/IMAGE_SYNTHESIS_PROMPT_CATALOG_20260928.md` §2c (both provider gates
   remain NOT APPROVED and nothing has been generated).
5. Delivery format per image: AVIF q82 > WebP q85 > progressive JPG,
   breakpoints 640/1024/1600/2560 (catalog §3).

## 7. Accessibility rules (evidence-bound)

### 7a. PRODUCTION RULES from the PKG-5 measurements (normative — apply to every current and future 3D/illustration component)

These three defects were measured on live production components by PKG-5
(`docs/media/WEBGL_PERF_BUDGET_20260928.md`). Fixes are assigned to Lane B3 and are
**not** this brief's owner's files. This section encodes them as rules so they cannot
recur in any new component, and so the fixes have a written acceptance bar:

- **RULE-A11Y-1 (reduced motion):** every WebGL scene MUST stop animating under
  `prefers-reduced-motion: reduce` and render exactly one static frame. Currently
  violated by `ProvinceYieldChart3D.tsx` (keeps animating on desktop and mobile) while
  `ProvinceSolarScene.tsx` is the correct reference. WCAG 2.2.2 / 2.3.3.
  Acceptance: canvas-scoped screenshot diff is static under reduced motion, measured
  with the PKG-5 pass-5 method (canvas-rect-clipped diff, not an rAF counter).
- **RULE-A11Y-2 (context loss):** every WebGL canvas MUST handle both
  `webglcontextlost` (preventDefault) and `webglcontextrestored` (rebuild or visibly
  degrade), and MUST show a visible fallback message when the context stays lost.
  Measured baseline: `webglcontextlost` fired 2/2 canvases, `webglcontextrestored` 0/2
  in all 4 configurations — scenes silently freeze looking like a deliberate static
  illustration. Acceptance: forced context loss ends in either restored rendering or a
  visible message, never a silent freeze.
- **RULE-A11Y-3 (text alternative):** every decorative canvas MUST expose a text
  alternative for screen readers — `aria-label` or `aria-describedby` on the canvas, or
  the HTML data overlay tied to it — stating what the scene depicts and, where figures
  are shown, the sourced figures + source line. Measured baseline: canvases are
  `aria-hidden="true"` with no label, no description, empty parent — no text alternative
  exists at all. Acceptance: screen-reader pass names the scene and its data.
- **RULE-A11Y-4 (no regression):** no new 3D/illustration component may be wired into a
  page until RULE-A11Y-1…3 pass on it. Re-measurement follows the method recorded in
  `docs/media/WEBGL_PERF_BUDGET_20260928.md`; a component that has never been measured
  in a real browser is `unverified`, not compliant.

### 7b. Accessibility rules (evidence-bound)

- Every WebGL canvas is decorative and `aria-hidden` — all data lives in the HTML
  overlay with the source line: `ProvinceSolarScene.tsx` figcaption ("แหล่งข้อมูล: …"),
  `SolarHeroScene.tsx` (`setAttribute("aria-hidden","true")`).
- `prefers-reduced-motion: reduce` → one static frame (solar noon) instead of animation:
  `ProvinceSolarScene.tsx` tick loop, `SolarHeroScene.tsx` (parallax listener skipped).
  **Measured defect (PKG-5, real browser runs): `ProvinceYieldChart3D` keeps animating
  under reduced-motion** on desktop and mobile while `ProvinceSolarScene` stops — WCAG
  2.2.2/2.3.3. This brief's claim is the *target*, not yet true of the yield chart.
- Rendering pauses when the canvas is off-screen (IntersectionObserver) and rAF is
  cancelled on unmount in all three scene components. **Measured defect (PKG-5): a lost
  WebGL context is never restored** — `webglcontextlost` fired 2/2 canvases,
  `webglcontextrestored` 0/2 in all 4 configurations; scenes silently freeze on the last
  frame with no message.
- Focus visibility is enforced site-wide (`focus-visible` outlines; see
  `index.css` `@layer base` outline rule and interactive patterns in `Layout.tsx`).
- Alt/figcaption text must read meaningfully without the image, and any figure in it
  must match `shared/provinceEnergyData.ts` exactly (PKG-4 criterion,
  `docs/media/ILLUSTRATION_COVERAGE_20260928.md`).

## 8. Asset budget

| Item | Budget / current state | Source |
| --- | --- | --- |
| GPU DPR cap | `min(devicePixelRatio, 2)`, re-capped on resize | all three three.ts components |
| Antialias | only when `devicePixelRatio < 1.5` | same |
| Draw calls | InstancedMesh: one draw per material for 48 panels + 12 pillars | `ProvinceSolarScene.tsx` |
| Particles (hero) | ~1,200, DPR cap 2, pause on hidden tab, idempotent dispose | `client/src/hero-solar-core/README.md` + `hero-solar-core.ts` |
| Bundle | three.js dynamically imported — never in entry chunk | `ProvinceSolarScene.tsx` / `ProvinceYieldChart3D.tsx` / `SolarHeroScene.tsx` import pattern |
| Province images | 77/77 provinces, WebP + AVIF both served | `apps/public-web/client/public/provinces/` + verified live 200s in `reports/SIRINX_CO_ILLUSTRATION_COMMAND_SET_20260928.md` |
| Image sizes | AVIF q82 / WebP q85; hero 2560w max, cards ≤1600w | catalog §3 |
| Performance guardrails | Home motion off until LCP measured; LCP-safe token ceiling ≤1.5 s | `motionFlags.ts`, `motionTokens.ts`, `MOTION_DECISION_20260928.md` |
| Real-measured numbers (PKG-5, Playwright, lab-only) | CLS 0.000 (7/7 runs) · LCP min/median/max 684/1,552/1,844 ms (6/7 inside the 1,800 ms good band) · 3D never the LCP element · lab single-machine numbers, not field/RUM | `docs/media/WEBGL_PERF_BUDGET_20260928.md` |

## 9. Companion documents

- `docs/3d/IMAGE_SYNTHESIS_PROMPT_CATALOG_20260928.md` — prompt catalog (extended §2b)
- `docs/media/prompts/` — data-bound prompt generator + JSON
- `docs/3d/MOTION_DECISION_20260928.md` — motion architecture decision record
- `docs/media/ILLUSTRATION_COVERAGE_20260928.md` — per-route coverage map (PKG-4)
- `docs/media/LANE_ASSIGNMENT_20260928.md` — ownership and gates

Side effects: `network: none · provider_calls: 0 · deploy: false · secrets_read: false`

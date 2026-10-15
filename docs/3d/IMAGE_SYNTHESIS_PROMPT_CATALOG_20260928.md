# Prompt & Image Synthesis Catalog — SIRINX Art Engineering (2026-09-28)

Status: LOCAL_ONLY · Target: www.sirinx.co · Models: ChatGPT (DALL-E 3) / Gemini 3.8 Flash Image Thinking

## 1. Visual Identity & Design System Invariants

- **Color Harmony**: 
  - Primary Dark: Deep Obsidian `#080c14` / Jet Carbon `#0b1220`
  - Solar Core Accent: Solar Amber Gold `#FFB800` / `#F59E0B`
  - Cyber Kinetic Accent: High-velocity Cyan `#00F0FF` / `#00d2ff`
  - Industrial Structure: Cold Galvanized Steel `#78716c` / `#27272a`
- **Lighting Direction**: Real sun elevation angles (NOAA calibrated: 45° to 75° depending on time of day).
- **Prohibited Attributes**: No cartoonish elements, no imaginary floating fantasy weapons, no blurry textures, no unrealistic sci-fi clutter.

---

## 2. Production Prompts for Team & VM Server Generation

### Concept A: High-End Architectural Commercial Solar Carport (Hero & Solutions)
```text
An architectural masterpiece photograph of an ultra-modern commercial solar carport installed in an industrial park in Thailand. Sleek black photovoltaic bifacial panels mounted on a minimalist dark architectural steel frame. High-end EV charging stations illuminated with subtle cyan LED status lights. Beautiful golden hour lighting casting long soft shadows across polished wet asphalt with realistic water reflections. In the background, lush tropical trees contrasting with clean engineering lines. Shot on Hasselblad H6D-100c, 35mm lens, f/8, photorealistic, Ray-traced global illumination, 8k resolution, crisp details, editorial architecture magazine style --no cartoon, text, watermark, oversaturated, low-res.
```

### Concept B: Holographic AI Energy Core & Telemetry (AI/Technology Hub)
```text
A clean-tech industrial AI command center visualizing distributed solar energy grid telemetry. In the center, a 3D translucent holographic wireframe model of a solar carport hovering above a clean minimalist matte black workstation. Flowing particles of golden solar energy converging into digital data streams in cyan and amber. Subtle glowing UI graphs showing kilowatt-hour efficiency curves. Ambient lighting in a dark obsidian server room. Depth of field focusing on the energy hologram, cinematic volumetric lighting, Octane render aesthetic, high-tech enterprise energy management --no sci-fi fantasy weapons, clutter, messy UI, noise.
```

### Concept C: Exploded 3D Engineering Structure (Technical Detail & B2B Trust)
```text
Isometric 3D exploded engineering render of a heavy-duty commercial solar carport system. Detailed floating layers showing: structural foundation piles, galvanized C-channel steel frame, waterproof gutter channel, high-efficiency monocrystalline solar panels with anti-reflective glass, micro-inverters, and cable routing trays. Clean studio lighting on neutral dark slate gray background. CAD precision, hyper-detailed mechanical joints, subtle metallic reflections, realistic textures, Dieter Rams inspired industrial design aesthetic, 8k.
```

### Concept D: BESS (Battery Energy Storage System) + Solar Integration
```text
State-of-the-art commercial Battery Energy Storage System (BESS) container enclosure situated beside an industrial solar carport facility. Matte dark titanium container casing with active cooling ventilation grilles, sleek vertical amber-cyan LED battery status indicators, clean underground cable trenches. Crisp morning light, sharp architectural shadows, hyper-realistic industrial product photography, 8k resolution.
```

---

## 2b. Data-Bound Prompts (PKG-3b extension, Lane A, 2026-09-28)

The section-2 prompts above are **not bound to the site's real dataset** — their
photographic direction is correct, but they assert no number, so they cannot drift.
For slots that DO carry figures, the data-bound prompt set lives in
`docs/media/prompts/` and is **generated from real repo data** by
`docs/media/prompts/build-from-real-data.mjs`:

- yield / irradiation parsed from `apps/public-web/shared/provinceEnergyData.ts`
  (77/77 provinces verified at generation time)
- sun elevation/azimuth imported live from `apps/public-web/shared/sunMath.ts`
  (the same NOAA math `ProvinceSolarScene.tsx` renders)
- reference day 2026-06-21 (June solstice), local Thailand time (UTC+7)
- every performance-adjacent prompt carries the PVGIS disclaimer string;
  the structural/product prompts (C/D extensions) are deliberately number-free

Bound figures at generation time: Phuket = max 1,510.98 kWh/kWp/yr (1 of 77),
Trat = min 1,286.82, national mean 1,373.51; Phuket 17:30 sun = 16.45°/292.2°,
Phuket solar noon 12:30 = 74.44°/358.5°, Bangkok 17:30 = 16.67°/290.74°.

Bound set: `docs/media/prompts/prompts-bound-20260928.json` ·
Which prompts were bound and which were left alone, and why:
`docs/media/prompts/README.md`.

## 2c. Generation Slot Selection — which few slots genuinely need a generated image (Lane A, 2026-09-28)

The site's 77/77 province illustrations already render locally from real PVGIS + NOAA
data with no external image API. Any spend must be justified slot by slot. Selection
criteria (from PKG-4 coverage, `docs/media/ILLUSTRATION_COVERAGE_20260928.md`): (a) no
real photo exists, (b) no 3D/code equivalent exists, (c) conversion value, (d) a generated
image is the *only* way to get the asset — people, real projects and live numbers must
never be synthetic.

**SELECTED — 3 slots, in priority order:**

| # | Slot | Prompt (this catalog / bound JSON) | Why generation is justified |
| --- | --- | --- | --- |
| 1 | `/solar-carport` structural section | §2 Concept C + `engineering-exploded-structure` (number-free) | PKG-4 Priority 1. No real photo of an exploded structural view can exist; no 3D component shows the layer stack (piles → C-channel → gutter → panels → micro-inverters). Trust-building B2B asset on the money page. |
| 2 | `/strategy` AI telemetry section | §2 Concept B + `national-yield-telemetry-hologram` (data-bound to the 77 real yields) | PKG-4 Priority 2. The concept is a data visualization of the real dataset; a generated hero-scale render communicates it where no photo and no shipped 3D component exists on that route. |
| 3 | `/solutions` BESS section | §2 Concept D + `bess-industrial-storage` (number-free) | PKG-4 Priority 2. No site photo of a BESS container; industrial product render fills the only gap on the six-solution page. |

**REJECTED slots, each with its reason (do not revisit without new evidence):**

- `/` hero — real 6-photo slideshow + `SolarHeroScene` 3D already shipped; a generated
  hero would compete with real photography on the most LCP-sensitive page (PKG-5 baseline).
- `/solar-carport/:province` (77 pages) — fully served by real-data renders + 3D scenes.
- `/projects`, `/projects/:slug` — real installation photos exist and must stay real.
- `/about`, `/partner` — people and events; only real photography is acceptable.
- `/home-solution`, `/industries`, `/blog` — stock/temporary imagery acceptable; the
  durable answer is a real photo shoot, not synthetic brand imagery.
- `/pricing`, `/investment` — live numbers (prices, tax rules) belong in HTML/SVG,
  where they update; a generated image hardcodes stale claims.
- `/assessment` — the roof-tilt preview should be a **WebGL component built in code**
  under the brief's RULE-A11Y-1…4, not a generated image.
- `/contact`, `/line` — no illustration needed.

**Execution status:** `APPROVE_PAID_IMAGE_PROVIDER_CALL` is **NOT APPROVED** and no
budget cap is set — nothing has been generated. `APPROVE_MEDIA_PROMOTE_TO_PUBLIC` was
later granted but found to have **no eligible object**: quarantine held only
`dry-run-plan.json` (a plan document, no media), so it was recorded granted-and-unused
in `reports/SIRINX_CO_LANE_A_PKG3B_PKG6_20260928.md` (gate ledger) without promoting
anything. If the provider gate is ever granted, it covers exactly these 3 prompts,
output lands in `.media-staging/_quarantine/`, and promotion uses the already-granted
promote gate — one round trip, no second approval needed.

## 3. Web Optimization & Delivery Spec for VM Server Pipeline

1. **Format Priority**: AVIF (quality 82) > WebP (quality 85) > Progressive Fallback JPG.
2. **Responsive Breakpoints**:
   - `sm`: 640w
   - `md`: 1024w
   - `lg`: 1600w
   - `xl`: 2560w (2x retina hero)
3. **Toolchain (on VM)**:
   ```bash
   sharp -i input.png -o output.avif --quality 82
   sharp -i input.png -o output.webp --quality 85
   ```

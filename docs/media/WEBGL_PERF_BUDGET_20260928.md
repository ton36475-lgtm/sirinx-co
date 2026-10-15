# WEBGL PERF & A11Y BUDGET — sirinx.co (PKG-5, measured 2026-09-28)

- Owner: coordinator lane (surface:7) · Gates consumed: **NONE** (read-only measurement)
- Report: `reports/SIRINX_CO_PKG5_WEBGL_MEASURED_20260928.md` · Receipt: `receipts/SIRINX_CO_PKG5_WEBGL_MEASURED_20260928.md`
- Target: `https://www.sirinx.co` production, measured 2026-09-28 15:33–15:40 +07

This replaces the previous state of this package, which was "not measured". It is now
measured. Two of the three headline numbers are good, and three real defects were found
that no report on disk had recorded.

---

## 0. How it was measured, and what that does and does not license

**Unblocked without a gate.** The Browser Agent Bridge extension in Chrome is off, which
is what blocked the earlier round. That was not a hard blocker: the project venv already
had Playwright installed, and Google Chrome 154.0.8037.58 was already installed. Driving
`channel="chrome"` from the existing Playwright gave a real browser with no install step,
no dependency change, and no gate.

**Lab data, not field data.** Single samples, headless, one machine, one network path.
This is not CrUX or RUM. It tells you what this configuration does; it does not tell you
what your users experience. Treat every threshold below as "measured here", never as
"field good".

**Six passes, because the early passes produced misleading numbers.** This is recorded
because the wrong turns are the useful part:

| Pass | What it did | Why it was not enough |
| --- | --- | --- |
| 1 | LCP/CLS/FCP/TTFB on 3 URLs × desktop+mobile | counted canvases at `load` only |
| 2 | late canvas re-sample, LCP element id | used my own rAF count as a frame-rate proxy |
| 3 | canvas pixel readback | WebGL readback is cleared without `preserveDrawingBuffer`; a broken regex too |
| 4 | full-page screenshot hash | diff was not scoped to the canvas, so it proved nothing |
| 5 | **screenshot clipped to each canvas rect** | this is the decisive test |
| 6 | mean-luma / grey-level analysis | needed because this session has no vision input |

Passes 2–4 each would have supported a confident, wrong claim. They are kept in
`data/tmp_webgl_measure/` so the next person does not repeat them.

---

## 1. Core Web Vitals — 7 of 7 runs succeeded

| Page | Viewport | LCP | LCP element | CLS | FCP | TTFB | Long tasks |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | desktop 1440 | **684 ms** | `IMG.absolute.inset-0` (hero) | 0.000 | 684 | 415 | 58 ms |
| `/` | mobile 390 @3x | **916 ms** | `IMG.h-full.w-full` (hero) | 0.000 | 840 | 47 | — |
| `/solar-carport/bangkok/` | desktop | **1844 ms** | `H1.font-display.text-3xl` | 0.000 | 264 | 55 | 89, **599**, 222 ms |
| `/solar-carport/bangkok/` | mobile | **1552 ms** | `DIV.flex.flex-wrap` (stat row) | 0.000 | 364 | 46 | 91, 61, 97 ms |
| `/solar-carport/chiang-mai/` | desktop | **1348 ms** | `H1.font-display.text-3xl` | 0.000 | 408 | 280 | 57, 52 ms |
| `/solar-carport/chiang-mai/` | mobile | **1596 ms** | `DIV.flex.flex-wrap` | 0.000 | 408 | 151 | 61 ms |
| `/solar-carport/bangkok/` | desktop + reduced-motion | **1588 ms** | `H1.font-display.text-3xl` | 0.000 | 320 | 89 | 78, 63 ms |

**LCP min / median / max = 684 / 1552 / 1844 ms. CLS = 0.000 on every single run.**

Three things worth stating plainly:

1. **CLS is genuinely perfect.** Zero layout shift across all seven runs, including the
   pages that mount two WebGL canvases after load. Whatever the 3D costs, it is not
   costing layout stability. This is the strongest number on the site.
2. **One run crossed the 1800 ms "good" line**: Bangkok desktop at 1844 ms, with a single
   599 ms long task in the same run. That is the one place to look first.
3. **The 3D is not the LCP.** On province pages the LCP element is the `H1` (desktop) or
   the stat `DIV` (mobile); on the homepage it is the hero `IMG`. Not once was a `<canvas>`
   the largest contentful paint.

**Consequence for the motion decision:** the reason the homepage motion flag was held at
`false` pending LCP data is now partly answered. Enabling motion on Home does not compete
with the hero image for LCP, because the hero image *is* the LCP and it paints at 684 ms
with the current static behaviour. That is one argument for flipping the flag, and it is
an argument, not a clearance. See §5.

---

## 2. DEFECT 1 — `ProvinceYieldChart3D` ignores `prefers-reduced-motion`

Screenshots clipped to each canvas rect, hashed 1.5 s apart. `True` = the canvas
repainted, i.e. it is still animating.

| Case | `prefers-reduced-motion` | `ProvinceSolarScene` (canvas 0) | `ProvinceYieldChart3D` (canvas 1) |
| --- | --- | --- | --- |
| desktop, normal | false | animating | animating |
| desktop, reduced | **true** | **stopped** ✅ | **still animating** ❌ |
| mobile, normal | false | animating | animating |
| mobile, reduced | **true** | **stopped** ✅ | **still animating** ❌ |

`matchMedia('(prefers-reduced-motion: reduce)').matches` was confirmed `true` in both
reduced cases, so the media query was genuinely active in the page — the component is
simply not consulting it.

`ProvinceSolarScene` implements this correctly. `ProvinceYieldChart3D` does not, on both
desktop and mobile. Continuous motion for a user who has asked the operating system to
stop it is a WCAG 2.3.3 (Animation from Interactions) and 2.2.2 (Pause, Stop, Hide)
concern, and it also burns battery on the exact devices least able to afford it.

**Owner:** this is `ProvinceYieldChart3D.tsx`, which the PKG-2 lane was told not to edit.
It needs a new owner. It is a small, well-specified fix.

---

## 3. DEFECT 2 — a lost WebGL context is never recovered, and never reported

Forced via `WEBGL_lose_context` on both canvases, then observed for 3 s.

| Case | `webglcontextlost` fired | `webglcontextrestored` fired | GL state after 3 s |
| --- | --- | --- | --- |
| desktop, normal | 2 / 2 | **0** | `LOST, LOST` |
| desktop, reduced-motion | 2 / 2 | **0** | `LOST, LOST` |
| mobile, normal | 2 / 2 | **0** | `LOST, LOST` |
| mobile, reduced-motion | 2 / 2 | **0** | `LOST, LOST` |

Every canvas lost its context and **none recovered**. There is no
`webglcontextrestored` handler, so the scene never rebuilds its GPU resources. On a real
device this is the normal path, not an exotic one: context loss happens on GPU driver
reset, on iOS memory pressure, when a tab is backgrounded on a constrained GPU, and on
some Android Chrome driver bugs.

**What the user is left with**, measured rather than asserted (this session has no vision
input, so the appearance is quantified instead of eyeballed):

| Canvas | before: mean luma / non-black / grey levels | after: mean luma / non-black / grey levels |
| --- | --- | --- |
| `ProvinceSolarScene` | 21.88 / 87.3% / 249 | 19.06 / 92.2% / **248** |
| `ProvinceYieldChart3D` | 16.00 / 62.2% / 233 | 18.29 / 91.8% / **225** |

The canvas does **not** go blank. The browser preserves the last composited frame — 248
and 225 distinct grey levels survive, so there is still a real image on screen. The
failure mode is therefore the quiet one: the 3D silently freezes into what looks like a
static illustration, with no error, no message, and no resumption.

Confirmed alongside: `document.querySelectorAll('canvas').length === 2` (still mounted),
`opacity === "1"` on both, and no user-facing WebGL/graphics message anywhere in the
rendered text. A user cannot tell that anything failed, and the chart stops updating if
the data behind it would have changed.

---

## 4. DEFECT 3 — the 3D content has no text alternative

Measured on the live province page:

- `canvas[aria-hidden="true"]` — correct, a decorative/duplicated canvas should be hidden
- `aria-label` — **null on both canvases**
- `aria-describedby` — **null on both canvases**
- canvas text content — **empty on both**
- parent element `innerText` — **empty on both**

So the canvases are correctly excluded from the accessibility tree, and there is
**nothing at all** standing in for them. `aria-hidden` without an equivalent is not an
accessibility feature; it is the removal of a feature. Screen-reader and text-agent users
get no version of the solar scene or the yield chart — and per the site's own AEO work,
LLM crawlers parsing the rendered text get nothing either.

This is the cheapest of the three defects to fix and the one with the widest reach.

---

## 5. What this does NOT clear, and the decision it feeds

**It does not clear `APPROVE_MOTION_HOME_ENABLED_TRUE`.** The order's addendum held the
flag at `false` because the homepage is the primary conversion path and LCP was
unmeasured. It is now measured, and the relevant facts are:

- homepage LCP 684 ms desktop / 916 ms mobile with the flag **off**;
- the 3D and motion have never been the LCP element on any page measured;
- CLS is 0.000, so the lazy 3D mount is not destabilising layout.

That is favourable evidence. It is not a measurement of the flag being **on**, which
does not exist yet. The honest next step is to measure the flag-on variant in the same
harness before flipping, not after.

**Recommended order of work, all of it local and reversible:**

1. Fix Defect 3 (text alternative) — smallest change, largest reach.
2. Fix Defect 1 (reduced motion in `ProvinceYieldChart3D`) — small, and it is a WCAG issue.
3. Fix Defect 2 (`webglcontextrestored` + a visible fallback message) — medium.
4. Then, and only then, re-measure the homepage with `MOTION_HOME_ENABLED = true` and
   compare against the 684 / 916 ms baseline above.

Items 1–3 change behaviour of already-shipped components, so they are code changes to
live files and need an owner assigned in the ownership matrix. They are not gates; they
are scheduling.

---

## 6. Reproduction

```bash
cd /Users/sirinx/project-hermes/data/tmp_webgl_measure
/Users/sirinx/project-hermes/.venv/bin/python measure_webgl_perf.py   # pass 1, CWV
/Users/sirinx/project-hermes/.venv/bin/python probe_pass5.py          # pass 5, scoped animation
/Users/sirinx/project-hermes/.venv/bin/python probe_pass6.py          # pass 6, luminance
```

Raw output: `vitals.json`, `vitals_pass2.json`, `vitals_pass3.json`, `vitals_pass4.json`.

Side effects of producing this document: `network: yes — read-only GETs to www.sirinx.co`
· `provider_calls: none` · `deploy: false` · `secrets_read: false` · `installs: none`

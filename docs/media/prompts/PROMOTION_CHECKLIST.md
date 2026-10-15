# PROMOTION CHECKLIST — quarantine → client/public/ (Lane A, PKG-3b)

Status: LOCAL_ONLY · 2026-09-28 · Written **before any media exists**
Owner per `docs/media/LANE_ASSIGNMENT_20260928.md` §2 + Coordinator confirmation:
**Lane A (freebuff)** — `docs/media/prompts/**`
Applies to: every file promoted out of `.media-staging/_quarantine/` into
`apps/public-web/client/public/`, now and in the future.

Gates at time of writing:

| Gate | Status |
| --- | --- |
| `APPROVE_PAID_IMAGE_PROVIDER_CALL` | NOT APPROVED — no media can exist yet |
| `APPROVE_MEDIA_PROMOTE_TO_PUBLIC` | GRANTED (2026-09-28), unused — no eligible object existed; ledger in `reports/SIRINX_CO_LANE_A_PKG3B_PKG6_20260928.md` |

A promotion consumes BOTH: media must exist lawfully (provider gate), then may leave
quarantine (promote gate). One without the other is not a promotion.

---

## 0. Scope gate (run before anything else)

- [ ] The file is inside `.media-staging/_quarantine/` **right now** (not `2026-08-21/`,
      not `2026-09-25-private-review/` — those are outside this checklist's scope).
- [ ] Its provenance is the approved slot list — catalog
      `docs/3d/IMAGE_SYNTHESIS_PROMPT_CATALOG_20260928.md` §2c SELECTED (3 slots).
      A file from any other slot is rejected even if perfect.
- [ ] The matching entry in `prompts-bound-20260928.json` exists (prompt id + bindings).

## 1. Format

- [ ] Primary: **AVIF, quality 82** (falls back gracefully) — toolchain per catalog §3.
- [ ] Secondary: **WebP, quality 85**.
- [ ] Tertiary fallback: progressive **JPG**.
- [ ] All three encoded from one source render (no independent re-crops).
- [ ] `sharp`/encoder flags recorded in the manifest entry for the file.

## 2. Dimensions & responsive set

Per catalog §3 breakpoints — every slot ships the full set or it does not ship:

- [ ] `640w` (sm) · `1024w` (md) · `1600w` (lg) · `2560w` (xl, hero/2x retina) —
      each in AVIF + WebP + JPG.
- [ ] Aspect ratio consistent across the set (no mixed crops between widths).
- [ ] Slot-appropriate aspect: hero-adjacent 1792x1024 source; section 1536x1024;
      technical/product 1024x1024 (matches `dimensions` in the bound JSON).
- [ ] File-size sanity: hero AVIF ≤ ~120 KB at 1280w-equivalent (the existing province
      AVIFs run 20–53 KB — a generated hero far above that needs a re-look before
      promotion, not after).

## 3. Disclaimer & honesty

- [ ] Every image whose prompt asserts a figure (data-bound prompts) carries the
      disclaimer string from `prompts-bound-20260928.json` **visible or machine-readably
      attached** at point of use (figcaption/alt/adjacent copy), not only in the manifest.
- [ ] Number-free prompts (structural/product) use their narrower disclaimer
      ("no performance figures depicted").
- [ ] No figure appears **in** the rendered image that is not in `dataBindings`
      (an image-model-rendered number is treated as fabricated and blocks promotion).
- [ ] Alt text at point of use passes the PKG-4 criteria
      (`docs/media/ILLUSTRATION_COVERAGE_20260928.md` §3): no "image of…" filler,
      figures match `shared/provinceEnergyData.ts` exactly, citable sentence form.

## 4. Manifest (per file, written into quarantine before promotion)

Every promoted file must have a manifest row in the promotion manifest containing:

- [ ] `prompt_id` — matches `prompts-bound-20260928.json`
- [ ] `model` + `seed` + `dimensions` — from the actual generation call
- [ ] `provider_cost` — actual spend for the file (budget-cap accounting)
- [ ] `sha256` — of the source render and of each delivered derivative
- [ ] `encoder_settings` — format/quality per derivative
- [ ] `disclaimer` — the exact string shipped with it
- [ ] `timestamp` (ISO-8601) and `generated_by` (lane/machine)
- [ ] `gate_evidence` — the approval string reference for both consumed gates

## 5. Promotion procedure (once 0–4 all pass)

1. Write the manifest into `.media-staging/_quarantine/promotion-manifest-<date>.json`
   **before** moving anything.
2. `sha256` every file; record in the manifest.
3. Move files into the mapped `client/public/` location for the slot.
4. Re-run `shasum -c` from the destination directory.
5. Update `docs/media/ILLUSTRATION_COVERAGE_20260928.md` (PKG-4 owner's file — request
   the update from that lane, do not edit it) so the coverage map reflects the new asset.
6. Write report + receipt + `.sha256` sidecars; verify sidecars from their own directories.

## 6. Hard rejections (any one blocks promotion, no exceptions)

- File not in `_quarantine/` at promotion time.
- Slot not in the §2c SELECTED list.
- Missing/incorrect disclaimer or manifest row.
- A rendered number that is not bound to real data.
- No `provider_cost` recorded (spend must be attributable against the budget cap).
- WebGL/3D equivalent already exists for the slot (generation would be redundant spend).

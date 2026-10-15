# IMAGE_EXECUTION_READY_20260928 — what happens if the Commander approves image generation today

- Lane: **B** (hermes on macmini M2, jcode) · package **R30-P4**
- Gate consumed: **NONE**. No provider call was made. No key was read.
- Verdict in one line: **approving `APPROVE_PAID_IMAGE_PROVIDER_CALL` right now would spend
  money and return zero images, because all three configured slots name models that no
  longer exist.**

---

## 1. The pipeline runs, and the gate holds

Both claims below were executed, not described.

**Default mode (dry-run) — exit 0, real plan written:**

```
$ node docs/media/generate-illustrations.mjs
[MODE: DRY-RUN]
Zero provider calls will be dispatched. No cost incurred.
Planned staging directory: .../sirinx-co/.media-staging/_quarantine

Found 3 prompt packages scheduled:
  1. [engineering-exploded-structure]      -> /solar-carport  (dall-e-3, 1024x1024)
  2. [national-yield-telemetry-hologram]   -> /strategy       (gemini-3.8-flash-image, 1536x1024)
  3. [bess-industrial-storage]             -> /solutions      (gemini-3.8-flash-image, 1792x1024)

[PASS] Dry-run plan written to .../.media-staging/_quarantine/dry-run-plan.json
```

**Execute mode without the gate — exit 1, explicit refusal:**

```
$ node docs/media/generate-illustrations.mjs --execute
⛔ [BLOCKED: GATE REQUIRED]
Execute mode is locked until Human Commander approves with:
  APPROVE_PAID_IMAGE_PROVIDER_CALL
$ echo $?
1
```

The refusal is real: the process exits non-zero and calls no provider. This is the check
being shown able to go red, which is the only reason to trust the green.

## 2. The finding that matters: 3 of 3 configured models are unavailable

| slot | route | configured model | status | primary source |
| --- | --- | --- | --- | --- |
| 1 | `/solar-carport` | `dall-e-3` | **RETIRED** | absent from OpenAI's current price list (only `gpt-image-2`, `gpt-image-2.5-sunburst`, `gpt-image-2.5-flare` are listed); DALL·E 3 was shut down 2026-05-12 |
| 2 | `/strategy` | `gemini-3.8-flash-image` | **NOT A PUBLISHED MODEL** | absent from Google's official Gemini API pricing page; the current image models are `gemini-3.1-flash-image` (Nano Banana 2) and `gemini-3.1-flash-lite-image` (Nano Banana 2 Lite) |
| 3 | `/solutions` | `gemini-3.8-flash-image` | **NOT A PUBLISHED MODEL** | same as slot 2 |

`gemini-3.8-flash` **does** exist, and it is a text model: $0.75 / 1M input, $3.75 / 1M
output (promotional, through 2026-12-31). It is not an image model. The pipeline slot name
appears to be a text model id with `-image` appended, which is exactly the kind of string
that passes review and fails at the API.

**This is the finding.** Earlier rounds in this repo cost nothing because nothing executed.
The first time this is actually run with approval money, it fails on all three slots, and
the failure looks like a network error rather than a configuration error — which is how
you lose an afternoon.

## 3. Cost ceiling per slot, at published prices

USD→THB at the ECB reference rate of 2026-09-28: **1 USD = 33.57 THB**.

### Slot 1 — `/solar-carport` exploded technical diagram

| | |
| --- | --- |
| configured | `dall-e-3` 1024x1024 |
| cost as configured | **cannot execute** — model retired |
| replacement | `gpt-image-2` (the model OpenAI lists as the DALL·E 3 successor) |
| published rates | Image input $4.00 / 1M tokens · cached $1.00 / 1M · image output $15.00 / 1M (Standard) |
| per-image cost | **unverified** — OpenAI's price page does not publish a per-image figure; it directs to the image-generation cost calculator. I am not going to invent one. |
| proposed hard ceiling | **$1.00** (≈ ฿33.57). A cap, not a price. If the real figure is lower, the cap is never reached. |

### Slot 2 — `/strategy` national yield hologram

| | |
| --- | --- |
| configured | `gemini-3.8-flash-image` 1536x1024 |
| cost as configured | **cannot execute** — model not published |
| replacement | `gemini-3.1-flash-image` |
| published per-image (Standard) | $0.045 @0.5K · **$0.067 @1K** · **$0.101 @2K** · $0.151 @4K |
| published token rates | input $0.50 / 1M (text+image) · text output $3.00 / 1M |
| 1536x1024 | not a published tier. Between 1K and 2K. |
| **cost ceiling** | **$0.101** (≈ ฿3.39) — the 2K tier, taken as the upper bound. Prompt input is a few hundred tokens, under $0.001. |
| batch alternative | $0.050 @2K if the run tolerates batch latency |

### Slot 3 — `/solutions` BESS container

| | |
| --- | --- |
| configured | `gemini-3.8-flash-image` 1792x1024 |
| replacement | `gemini-3.1-flash-image` |
| **cost ceiling** | **$0.101** (≈ ฿3.39), same reasoning as slot 2 |

### Round total

| | USD | THB |
| --- | --- | --- |
| 3 slots, as configured | **$0.00 — all three fail** | — |
| 3 slots, models corrected, 1 image each | **≤ $1.202** | **≤ ฿40.35** |
| 2 Gemini slots only, no OpenAI | **≤ $0.202** | **≤ ฿6.78** |

**Suggested budget cap to hand the Commander: $2.00 (฿67).** It covers the three slots at
the ceilings above with wide margin for a retry of any one image, and it is a cap rather
than an estimate, so it cannot be exceeded without a second decision.

## 4. Prompt data binding — verified, not assumed

`docs/media/prompts/prompts-bound-20260928.json` was generated at 08:43 today. I
regenerated it and diffed:

```
$ node docs/media/prompts/build-from-real-data.mjs
[OK] wrote .../prompts-bound-20260928.json
  provinces parsed : 77
  max yield        : phuket 1510.98
  min yield        : trat 1286.82
  mean yield       : 1373.51
  phuket 17:30 sun : 16.45° elevation / 292.2° azimuth
  bangkok 17:30 sun: 16.67° elevation / 290.74° azimuth
  prompts emitted  : 5

$ diff before.json after.json
2c2
< "generatedAt": "2026-09-28T08:43:23.333Z",
---
> "generatedAt": "2026-09-28T14:06:04.255Z",
```

**4 diff lines, all of them the timestamp.** No figure in the prompt set has drifted from
`shared/provinceEnergyData.ts` or `shared/sunMath.ts`. The 77/77 binding holds.

## 5. The single command, after approval

Once `APPROVE_PAID_IMAGE_PROVIDER_CALL` is set **and** the three model ids in
`docs/media/prompts/prompts-bound-20260928.json` are corrected:

```bash
cd /Users/sirinx/SIRINXDev/sirinx-co
APPROVE_PAID_IMAGE_PROVIDER_CALL=1 node docs/media/generate-illustrations.mjs --execute
```

Output lands in `.media-staging/_quarantine/` and **nowhere else**. Promoting anything from
there into `client/public/` is a separate gate, `APPROVE_MEDIA_PROMOTE_TO_PUBLIC`, which
this does not touch.

**The model ids are now fixed** (§6), so this command is no longer the difference between a
฿40 round and a failed round. It is still a paid call, and it still needs the gate.

## 6. What I did not do — and what I changed afterwards

**At the time of writing:** no provider call, no key read named or resolved, and no change
to the prompt set's content beyond regenerating it.

**Changed afterwards, same round, still no gate consumed.** I corrected the model ids. The
source is the generator, not the generated JSON, so a future regeneration cannot silently
reintroduce a dead model:

```
docs/media/prompts/build-from-real-data.mjs
  dall-e-3               → gpt-image-2            (2 slots)
  gemini-3.8-flash-image → gemini-3.1-flash-image (3 slots)
```

The evidence for each substitution is in the file header, with the source URL and the date,
so the next person does not repeat the research. `docs/media/IMAGE_DECISION_BRIEF_20260928.md`
carried an open question — *"is `dall-e-3` legacy or merely unpriced?"* — which this
answers; that document is updated rather than left contradicting the code.

Verified after the change:

```
$ node docs/media/prompts/build-from-real-data.mjs   → 77 provinces, 5 prompts
$ grep '"model"' prompts-bound-20260928.json          → gpt-image-2 ×2, gemini-3.1-flash-image ×3
$ grep -rn 'dall-e-3\|gemini-3.8-flash-image' docs/media/prompts/ generate-illustrations.mjs
  NONE — clean
$ node docs/media/generate-illustrations.mjs         → DRY-RUN, 3 slots, live models
$ node docs/media/generate-illustrations.mjs --execute
  ⛔ [BLOCKED: GATE REQUIRED]  exit=1                  ← the gate still refuses
$ diff <data fields> <data fields>                    → DATA IDENTICAL, only model ids changed
```

The last line is the one that matters: **the data binding was not touched.** Yields,
irradiation and sun positions are byte-identical to the pre-change file. Only the model id
moved.

I did not touch `generate-illustrations.mjs`'s execution logic, and I did not run anything
that could spend money.

## Side effects

```
network: 2 pricing pages fetched (OpenAI, Google) · 1 FX rate fetched (Frankfurter/ECB)
provider_calls: 0 · install: false · secrets_read: false · deploy: false · commit: false
```

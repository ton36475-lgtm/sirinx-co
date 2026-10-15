# Image generation — decision brief and cost bound (R29, 2026-09-28)

For `APPROVE_PAID_IMAGE_PROVIDER_CALL`. Everything here was produced without spending
money. **Zero images have been generated.**

## What you would be approving, exactly

Three images, and only these three. The pipeline now loads them from the catalog-approved
slot list and **refuses to substitute anything else**:

| # | id | route | model | size | why generation is the only option |
| --- | --- | --- | --- | --- | --- |
| 1 | `engineering-exploded-structure` | `/solar-carport` | gpt-image-2 *(was dall-e-3, retired)* | 1024×1024 | no photo of an exploded structural stack can exist; no 3D component shows the layer stack (piles → C-channel → gutter → panels → micro-inverters) |
| 2 | `national-yield-telemetry-hologram` | `/strategy` | gemini-3.1-flash-image *(was gemini-3.8-flash-image, never published)* | 1536×1024 | a visualisation of the real 77-province dataset; no photo and no shipped 3D component on that route |
| 3 | `bess-industrial-storage` | `/solutions` | gemini-3.1-flash-image *(was gemini-3.8-flash-image, never published)* | 1792×1024 | no site photo of a BESS container exists |

> **Resolved 2026-09-28, Lane B (R30-P4).** The model column above was corrected in the
> generator `docs/media/prompts/build-from-real-data.mjs`, not in the generated JSON, and the
> JSON was regenerated. The open question this brief left — "is `dall-e-3` legacy or merely
> unpriced?" — is answered below. Evidence and cost ceilings:
> `docs/media/IMAGE_EXECUTION_READY_20260928.md`.

All three carry a disclaimer string in the manifest. Slot 2's numbers are bound to the real
dataset via `shared/provinceEnergyData.ts`; slots 1 and 3 deliberately contain **no**
performance figures at all.

## A defect I found and fixed before you were asked to approve anything

The pipeline as Lane A left it scheduled **four** prompts, and its list had drifted away
from the catalog's justification. If you had approved it as it stood:

- it would have generated **`hero-commercial-solar-carport` for the homepage `/`** — a slot
  that was never justified and never selected. Generating the homepage hero silently, as
  the side effect of approving three unrelated images, is exactly the failure this gate
  exists to prevent;
- it would have **missed** `national-yield-telemetry-hologram`, the one data-bound slot
  that actually justified spend;
- the bound prompt file additionally contained two Phuket province images, which
  contradicts the catalog's own reasoning that all 77 provinces already render locally from
  real data and need no generated artwork.

`docs/media/generate-illustrations.mjs` now reads the approved slots from
`docs/media/prompts/prompts-bound-20260928.json` and fails loudly if the file is missing or
a slot is absent. Verified by mutation: removing the file → hard error, exit 1; removing one
approved slot → hard error, exit 1; restoring → 3 slots again. The pipeline can no longer
disagree with the document that justifies the spend.

## Cost bound

The count is the real control here, and it is now structurally capped at **3**.

Authoritative OpenAI pricing (fetched from `developers.openai.com/api/docs/pricing`,
2026-09-28) lists image generation in **tokens**, not per image:
`gpt-image-2` at $4.00 / 1M input and $15.00 / 1M output; `gpt-image-2.5-sunburst` and
`-flare` at $8.00 / 1M input and $30.00 / 1M output.

**`dall-e-3` is not on that page at all. RESOLVED — it is retired, not merely unpriced.**
DALL·E 3 was shut down on **2026-05-12** and API requests to it now fail. The page lists
only `gpt-image-2`, `gpt-image-2.5-sunburst` and `gpt-image-2.5-flare`. Slot 1 has been
moved to `gpt-image-2`.

**The Google side was worse, and this brief did not check it.** All three slots named
`gemini-3.8-flash-image`, which **is not a published model**. `gemini-3.8-flash` is real
but is a **text** model ($0.75 in / $3.75 out per 1M). The image models are
`gemini-3.1-flash-image` (Nano Banana 2) and `gemini-3.1-flash-lite-image`. The old id was
the text model id with `-image` appended. Slots 2 and 3 have been moved to
`gemini-3.1-flash-image`, published at **$0.045 / $0.067 / $0.101 / $0.151 per image** for
0.5K / 1K / 2K / 4K. Source: `ai.google.dev/gemini-api/docs/pricing`, fetched 2026-09-28.

The consequence matters more than the price: **approving the spend before this correction
would have produced zero images for a non-zero cost**, and the failure would have looked
like a network error rather than a configuration error.

Order of magnitude, from the published token rates: a ~1K image is on the order of a
thousand-plus output tokens, so **a few cents per image**, and **well under a quarter of a
dollar for all three**. Any budget cap you set comfortably above that will not be the
binding constraint. Treat this as an estimate to be confirmed at execution time, not a
quote.

## What approval would and would not do

- **Would:** call the image provider for the 3 slots, writing only into
  `.media-staging/_quarantine/`. Nothing reaches `client/public/`.
- **Would not:** put anything live. Promotion to `public/` is a separate gate,
  `APPROVE_MEDIA_PROMOTE_TO_PUBLIC`.
- **Would not:** commit, push or deploy. That is `APPROVE_PUSH_TO_MAIN_SIRINX_CO`.

## Recommendation

The spend is small, the slots are justified slot by slot, and the pipeline fails closed
rather than substituting. Slot 1's model question is now **settled**: `dall-e-3` is retired
and has been replaced with `gpt-image-2`, where published pricing exists. The remaining
caveat is narrower than it was — OpenAI publishes token rates rather than a per-image
figure, so slot 1's exact per-image cost stays unverified and is handled with a cap.

A cap of **$2.00** (≈ ฿67) is comfortably above the ≤ $1.202 ceiling for all three slots and
small enough that an accidental loop cannot do real damage. **$1.00, as originally
proposed, no longer has the same margin** once slot 2 and 3 are priced at the 2K tier.

## Side effects of producing this brief

`network: read-only fetch of public pricing documentation and web search` ·
`provider_calls: none` · `no image generated` · `no spend` · `deploy: false` ·
`secrets_read: false`

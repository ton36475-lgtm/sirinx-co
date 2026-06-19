# ADS ANDROMEDA Brand Video Operating System

Status: locked-local-standard
Owner: SIRINXDev

This folder defines the repeatable ADS ANDROMEDA video prompt system:

```text
brand.md
  -> design.md
  -> frame.md
  -> voice.md
  -> prompt-template.md
  -> shot-list.md
  -> hyperframes-spec.md
  -> heygen-avatar.md
  -> andromeda-character-bible.md
  -> avatar.md
  -> lore.md
  -> motion-style.md
  -> knowledge-base.md
  -> shorts-library.md
  -> series-frame.md
  -> episode-pack.md
  -> campaign-offers.md
```

Use these files before generating any ADS ANDROMEDA video prompt, storyboard,
HTML preview, HyperFrames composition, HeyGen script, Gemini/Veo prompt, Kling
prompt, Runway prompt, or internal campaign spec.

## Files

| File | Purpose |
|---|---|
| `brand.md` | Brand identity, audience, claims, avoid list, compliance notes |
| `design.md` | Visual language, color system, camera, typography, composition |
| `frame.md` | 10-second scene-by-scene video direction |
| `voice.md` | Thai voice direction and scripts |
| `prompt-template.md` | Copy-ready prompts for Gemini/Veo, HeyGen, HyperFrames, and Codex |
| `shot-list.md` | Production shot list, camera, product-card, and QA notes |
| `hyperframes-spec.md` | Local-only HyperFrames HTML composition contract |
| `heygen-avatar.md` | Local-only HeyGen presenter/avatar setup spec |
| `andromeda-character-bible.md` | Recurring Andromeda AI CEO character standard |
| `avatar.md` | Canonical visual lock for Andromeda |
| `lore.md` | Brand universe and command-center story rules |
| `motion-style.md` | 6-8 second motion and transition standard |
| `knowledge-base.md` | 100-topic content source for the series |
| `shorts-library.md` | Production-ready episode bank and batch plan |
| `series-frame.md` | Master 8-second frame for Andromeda Marketing Tips |
| `episode-pack.md` | EP01-EP03 educational scripts and scene plans |
| `campaign-offers.md` | Approved offer register and content ratio rules |
| `hyperframes/andromeda-marketing-tips-preview.html` | Local browser preview for EP01-EP03 |

## Usage In Codex

```bash
cd ~/SIRINXDev/sirinx-agent-native-os/brands/ads-andromeda
codex
```

Then prompt:

```text
Read brand.md, design.md, frame.md, and voice.md.
Create a Gemini Omni Flash 10-second Thai video prompt for ADS ANDROMEDA.
Do not generate long on-screen Thai text.
Use voiceover instead of text.
Keep only verified products:
1. Facebook Page 2021, 1,000 followers, 350 THB
2. BM3 Verify, 1,800 THB
3. Coming Soon
```

## Usage In ChatGPT

```text
Use ADS ANDROMEDA brand.md + design.md + frame.md + voice.md.
Create a 10-second Gemini Omni Flash video prompt.
Do not put long Thai text on the video. Use Thai voiceover instead.
```

## Safety

- Do not imply official Meta/Facebook partnership.
- Do not claim guaranteed ad approval, ban-proof results, or platform immunity.
- Do not expose private inventory details unless approved for the campaign.
- Do not generate long Thai text on screen; use voiceover for Thai messaging.
- Do not publish or send externally without explicit approval.

## Implemented Extensions

- `shot-list.md` for production notes.
- `hyperframes-spec.md` for HTML video rendering specs.
- `heygen-avatar.md` for presenter setup.
- `andromeda-character-bible.md` for recurring character consistency.
- `avatar.md` for canonical character visual lock.
- `lore.md` for the Andromeda Command Center universe.
- `motion-style.md` for short-form video movement rules.
- `knowledge-base.md` for 100 reusable content topics.
- `shorts-library.md` for the starter episode bank.
- `series-frame.md` for 6-8 second educational clips.
- `episode-pack.md` for the first three episodes.
- `campaign-offers.md` for inventory and offer guardrails.
- `hyperframes/andromeda-marketing-tips-preview.html` for local preview.

## Next Extensions

- `APPROVE_ADS_ANDROMEDA_HYPERFRAMES_RENDER_LOCAL_ONLY`
- `APPROVE_ADS_ANDROMEDA_HEYGEN_VIDEO_GENERATE`
- `APPROVE_ADS_ANDROMEDA_VIDEO_PUBLISH`

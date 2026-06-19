# ADS ANDROMEDA Prompt Template

version: 1.0
status: locked-local-standard
inputs:
  - brand.md
  - design.md
  - frame.md
  - voice.md

## Universal Instruction

Read `brand.md`, `design.md`, `frame.md`, and `voice.md` first. Generate an AI
video prompt that preserves ADS ANDROMEDA brand identity, premium enterprise
style, and the approved 10-second frame plan.

Do not generate long Thai on-screen text. Use Thai voiceover instead. Keep
product cards short and readable.

## Gemini Omni Flash / Veo Prompt

```text
Create a 10-second vertical 9:16 premium brand video for ADS ANDROMEDA.

Use this brand identity:
- Premium Facebook Advertising Infrastructure
- Audience: agencies, marketers, ecommerce, SME
- Tone: premium, trustworthy, futuristic, professional

Visual style:
- luxury cyberpunk
- galaxy command center
- electric blue and purple galaxy lighting
- holographic enterprise dashboard
- futuristic Thai female CEO
- cinematic commercial camera

Text rules:
- no long Thai text on screen
- no Thai typo
- logo only when possible
- product cards may show short labels and numbers

Scene 1, 0-2 seconds:
Purple galaxy appears. Electric blue energy forms the ADS ANDROMEDA logo.
Slow push-in. Thai female voice says: "ADS ANDROMEDA".

Scene 2, 2-5 seconds:
Futuristic Thai female CEO appears inside a holographic galaxy command center.
Show Facebook, Business Manager, and Pages infrastructure nodes. Smooth orbit
camera. Voice says: "โครงสร้างพื้นฐานสำหรับการตลาดดิจิทัลยุคใหม่".

Scene 3, 5-8 seconds:
Show premium hologram product cards:
1. Facebook Page 2021, 1,000 followers, 350 THB
2. BM3 Verify, 1,800 THB
3. Coming Soon
Voice says: "พร้อมให้บริการด้วยบัญชีและเพจคุณภาพ".

Scene 4, 8-10 seconds:
Hero shot with CEO, logo, and clean galaxy command center background.
Voice says: "สอบถามสต็อกล่าสุดกับ ADS ANDROMEDA ได้เลย".

Final frame:
Centered ADS ANDROMEDA logo, clean premium blue-purple finish, no crowded text.

Avoid:
- cute or cartoon style
- cheap design
- overcrowded UI
- fake dashboard metrics
- guaranteed platform outcomes
- implying official Meta/Facebook partnership
```

## HeyGen / Avatar Prompt

```text
Create a Thai female executive presenter video for ADS ANDROMEDA.
Use a premium, confident, professional tone.
Background: galaxy command center with subtle holographic ad network nodes.
Use minimal on-screen text: ADS ANDROMEDA logo and short product cards only.
Voice script:
ADS ANDROMEDA
โครงสร้างพื้นฐานสำหรับการตลาดดิจิทัลยุคใหม่
พร้อมให้บริการด้วยบัญชีและเพจคุณภาพ
สอบถามสต็อกล่าสุดกับ ADS ANDROMEDA ได้เลย
```

## HyperFrames / HTML Video Prompt

```text
Build a 10-second 9:16 HTML video composition for ADS ANDROMEDA.
Use a black/deep navy background, electric blue and purple galaxy glow, a
central logo reveal, holographic product cards, and a premium enterprise
dashboard aesthetic. Use GSAP-style smooth timing. Keep text short and avoid
Thai paragraphs. Include voiceover script from voice.md as captions metadata,
not large visible text.
```

## Codex Task Prompt

```text
Read brand.md, design.md, frame.md, and voice.md.
Create a Gemini Omni Flash 10-second Thai video prompt for ADS ANDROMEDA.
Do not generate long on-screen Thai text.
Use voiceover instead of text.
Keep only verified products:
1. Facebook Page 2021, 1,000 followers, 350 THB
2. BM3 Verify, 1,800 THB
3. Coming Soon
Return:
- final prompt
- scene timing table
- negative prompt
- compliance notes
```

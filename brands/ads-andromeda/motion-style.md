# Andromeda Motion Style

Status: local-only motion standard
Owner: SIRINXDev
Applies to: Gemini Omni Flash, Veo, HyperFrames, HeyGen, Kling, Runway

This file locks how Andromeda short videos move. Use it with `avatar.md`,
`lore.md`, `series-frame.md`, and `shorts-library.md`.

No provider call, render, publish, or live send is authorized by this file.

## Motion Standard

```yaml
duration: 6-8 seconds
aspect_ratio: 9:16

camera:
  - slow cinematic
  - smooth portrait push
  - controlled orbit
  - stable hero lock

movement:
  - smooth
  - minimal
  - premium
  - readable

transition:
  - hologram dissolve
  - soft light wipe
  - galaxy node reveal
  - product card slide from depth

ui:
  - floating panels
  - clean icon row
  - one dashboard concept per scene
  - enough spacing for mobile readability

text:
  - minimal
  - icon only when possible
  - short English labels
  - no long Thai paragraphs

voice:
  language: Thai
  voice: female
  tone: confident, friendly, professional
```

## Timing Pattern

| Segment | Time | Motion |
|---|---:|---|
| Hook | 0-2s | Andromeda appears with slow push-in and topic hologram |
| Explain | 2-5s | 2-3 icons reveal with hologram dissolve |
| Close | 5-8s | Andromeda faces camera, logo/soft brand cue settles |

## Gemini Omni Flash Prompt Add-On

```text
Use slow cinematic camera movement, smooth hologram dissolve transitions,
floating UI panels, minimal text, and Thai female voiceover. Keep the duration
6-8 seconds. Make all labels large enough for mobile. Avoid busy motion, fast
cuts, long Thai text, or unreadable dashboard details.
```

## HyperFrames Notes

- Use CSS end-state layout before animation.
- Animate only opacity, x, y, scale, rotation, color, and glow.
- Use finite loops only; never `repeat: -1`.
- Keep scene structure deterministic and synchronous.
- Product cards and icon labels must not shift layout during animation.

## Avoid

- Fast glitch cuts.
- Overcrowded dashboards.
- Tiny Thai captions.
- Explosive meme transitions.
- Excessive neon rainbow.
- Shaky camera.
- Aggressive sales energy.

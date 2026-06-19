# ADS ANDROMEDA HyperFrames Spec

Status: local-only HTML video spec
Owner: SIRINXDev
Source files: `brand.md`, `design.md`, `frame.md`, `voice.md`, `shot-list.md`

This file specifies how to implement the ADS ANDROMEDA 10-second brand video as
a HyperFrames HTML composition. It is a build-ready spec, not a render request.

No HyperFrames provider call, preview, render, TTS, publish, deploy, or live
send is authorized by this file.

## Local Preview Artifact

The approved local-only preview file is:

```text
hyperframes/andromeda-marketing-tips-preview.html
```

It previews the `Andromeda Marketing Tips` short-form education series and uses
the same visual identity gate. It is a browser preview artifact, not a final
render.

## Visual Identity Gate

Before writing any HyperFrames HTML:

1. Read `design.md`.
2. Treat `design.md` as the visual identity source of truth.
3. Use the colors, camera, character, and text constraints from that file.
4. Do not use default UI colors or generic SaaS dashboard styling.

## Composition Contract

| Field | Value |
|---|---|
| Composition id | `ads-andromeda-10s` |
| Width | 1080 |
| Height | 1920 |
| Duration | 10 seconds |
| Aspect ratio | 9:16 |
| FPS target | 30 |
| Render mode | Local preview/render only after future approval |
| Animation engine | GSAP timeline |
| Determinism | No `Math.random()`, `Date.now()`, async timeline construction, or infinite repeat |

## Track Plan

| Track | Index | Purpose |
|---|---:|---|
| Background | 0 | Galaxy field, command-center depth, electric energy lines |
| Main visuals | 1 | Logo, CEO silhouette/illustration, holographic dashboards |
| Product cards | 2 | Approved product-card panels |
| Voice/audio | 3 | Voiceover audio when available; muted video only if video media exists |
| Captions/labels | 4 | Minimal English/number labels only |

## Scene Timing

| Scene | Time | Elements | Motion |
|---|---:|---|---|
| Scene 01 | 0-2s | Galaxy background, logo lockup, energy ring | Slow push-in, logo glow reveal, finite energy pulse |
| Scene 02 | 2-5s | Thai female CEO, FB/BM/Page nodes, dashboard field | Orbit illusion with parallax layers and node traces |
| Scene 03 | 5-8s | Three product cards | Cards enter from depth into stable readable positions |
| Scene 04 | 8-10s | CEO hero, ADS ANDROMEDA logo, clean CTA frame | Visuals settle, glow compresses into final logo lock |

## Layout Rules

- Build the hero frame for each scene as static HTML/CSS before animation.
- Use full-frame `.scene-content` containers:

```css
.scene-content {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 96px 72px;
  gap: 24px;
}
```

- Reserve absolute positioning for decorative rings, stars, node traces, and
  background glow only.
- Product cards must use stable dimensions and responsive text sizing so numbers
  do not overflow on 1080x1920.
- Do not nest cards inside decorative cards.

## Suggested Palette From Design

| Token | Hex | Use |
|---|---|---|
| `--space-black` | `#050713` | Background |
| `--deep-navy` | `#0B1026` | Dashboard panels |
| `--electric-blue` | `#22D3EE` | Energy lines and active nodes |
| `--galaxy-purple` | `#7C3AED` | Accent glow |
| `--clean-white` | `#F8FAFC` | Logo and product card text |
| `--premium-gold` | `#F5C76B` | Rare premium accent only |

## Timeline Notes

The implementation should register one paused GSAP timeline:

```js
window.__timelines = window.__timelines || {};
const tl = gsap.timeline({ paused: true });
window.__timelines["ads-andromeda-10s"] = tl;
```

Use `gsap.from()` for entrances into CSS-defined end states and `gsap.to()` for
exits. Do not animate `display`, `visibility`, media playback, or video element
dimensions.

## Composition Skeleton

```html
<div
  data-composition-id="ads-andromeda-10s"
  data-width="1080"
  data-height="1920"
>
  <section class="scene scene-brand" data-scene="01">...</section>
  <section class="scene scene-ecosystem" data-scene="02">...</section>
  <section class="scene scene-products" data-scene="03">...</section>
  <section class="scene scene-close" data-scene="04">...</section>

  <style>
    [data-composition-id="ads-andromeda-10s"] {
      width: 1080px;
      height: 1920px;
      overflow: hidden;
      background: #050713;
      color: #F8FAFC;
      font-family: "Sora", "Space Grotesk", system-ui, sans-serif;
    }
  </style>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
  <script>
    window.__timelines = window.__timelines || {};
    const tl = gsap.timeline({ paused: true });
    window.__timelines["ads-andromeda-10s"] = tl;
  </script>
</div>
```

## Product Card Text

Use only:

```text
Facebook Page 2021
1,000 followers
350 THB

BM3 Verify
1,800 THB

Coming Soon
```

## Voiceover Track

Use `voice.md` as source. If audio is added later, place it as a separate
`<audio>` element with `data-track-index="3"` and `data-duration="10"`. If
video media is used, keep video muted and use separate audio.

## Acceptance Checklist

| Check | Requirement |
|---|---|
| HyperFrames contract | Has `data-composition-id`, width, height, and registered paused timeline |
| Duration | `data-duration` and timeline match 10 seconds |
| Deterministic | No random/time/async timeline construction |
| Safety | No provider call, no render, no publish unless future approval exists |
| Branding | Palette and layout trace to `design.md` |
| Product truth | Only approved cards are present |
| Mobile readability | Cards readable at 1080x1920 and mobile preview scale |

## Future Approval Needed

Use a separate explicit approval before any of these:

```text
APPROVE_ADS_ANDROMEDA_HYPERFRAMES_RENDER_LOCAL_ONLY
APPROVE_ADS_ANDROMEDA_VIDEO_PUBLISH
```

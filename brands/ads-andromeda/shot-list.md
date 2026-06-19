# ADS ANDROMEDA Shot List

Status: local-only production spec
Owner: SIRINXDev
Source files: `brand.md`, `design.md`, `frame.md`, `voice.md`

This file turns the locked 10-second ADS ANDROMEDA frame direction into a
production-ready shot list for Gemini/Veo, HeyGen, HyperFrames, Kling, Runway,
or a human editor.

No provider call, render, publish, or live send is authorized by this file.

## Creative Lock

| Field | Value |
|---|---|
| Format | Vertical short video |
| Aspect ratio | 9:16 |
| Duration | 10 seconds |
| Style | Luxury cyberpunk, premium enterprise, galaxy command center |
| Character | Futuristic Thai female CEO |
| Voice | Thai female, premium, confident, clear |
| Text rule | Logo and short English/number labels only; Thai meaning goes in voiceover |

## Product Truth

Only these cards are allowed in the current cut:

| Product | Detail | Price |
|---|---|---:|
| Facebook Page 2021 | 1,000 followers | 350 THB |
| BM3 Verify | verified BM3 inventory | 1,800 THB |
| Coming Soon | future stock placeholder | no price |

## Shot Timeline

| Shot | Time | Objective | Visual Direction | Camera | Voice / Audio | On-Screen Text |
|---|---:|---|---|---|---|---|
| Shot 01 | 0-2s | Establish brand | Purple galaxy opens into electric blue energy lines. ADS ANDROMEDA logo forms in a clean premium lockup. | Slow push-in from deep space toward logo. | "ADS ANDROMEDA" | `ADS ANDROMEDA` |
| Shot 02 | 2-5s | Show infrastructure | Futuristic Thai female CEO appears inside holographic command center. Facebook, Business Manager, and Page nodes orbit as infrastructure, not as official partnership marks. | Orbit around CEO, slight parallax on dashboard layers. | "โครงสร้างพื้นฐานสำหรับการตลาดดิจิทัลยุคใหม่" | `Facebook`, `BM`, `Pages` |
| Shot 03 | 5-8s | Show approved products | Three premium hologram product-card panels slide in. Keep cards readable and uncluttered. | Frontal hero-card push with small depth movement. | "พร้อมให้บริการด้วยบัญชีและเพจคุณภาพ" | `Page 2021`, `1,000`, `350 THB`, `BM3 Verify`, `1,800 THB`, `Coming Soon` |
| Shot 04 | 8-10s | Close with CTA | CEO returns to center. Logo and glow ring lock. Background clears to premium galaxy command room. | Hero shot, slow final dolly, no shake. | "สอบถามสต็อกล่าสุดกับ ADS ANDROMEDA ได้เลย" | `ADS ANDROMEDA` |

## Shot 03 Product-Card Layout

Cards should be built as three stable panels, not floating random tags:

```text
Card 01
Label: Facebook Page 2021
Detail: 1,000 followers
Price: 350 THB

Card 02
Label: BM3 Verify
Detail: verified BM3 inventory
Price: 1,800 THB

Card 03
Label: Coming Soon
Detail: future stock placeholder
Price: none
```

## Editor Notes

- Keep all Thai copy in voiceover unless a later approval explicitly allows
  Thai text overlays.
- Do not imply official Meta or Facebook partnership.
- Do not say guaranteed ad approval, ban-proof, no-risk, or platform immunity.
- Do not show private inventory screens, credentials, customer data, tokens, or
  real account IDs.
- Use premium dashboard visuals, abstract nodes, and product cards instead of
  screenshots from real platforms.

## QA Checklist

| Gate | Pass Condition |
|---|---|
| Brand | ADS ANDROMEDA appears in first 2 seconds and final frame |
| Product truth | Only approved three cards appear |
| Compliance | No official partnership or guarantee claims |
| Thai text | No long Thai text on screen |
| Readability | Product card numbers are legible on mobile |
| Duration | Final cut remains 10 seconds |
| CTA | CTA is voice-led and does not pressure or overclaim |

## Next Safe Extension

Create `campaign-offers.md` only after inventory, pricing, and compliance copy
are approved for the specific campaign.

# ADS ANDROMEDA HeyGen Avatar Spec

Status: local-only avatar and presenter spec
Owner: SIRINXDev
Source files: `brand.md`, `design.md`, `frame.md`, `voice.md`, `shot-list.md`, `andromeda-character-bible.md`

This file defines the approved presenter direction for a HeyGen avatar video.
No provider call is authorized. It does not create an avatar, upload an image,
generate a voice, call HeyGen, render a video, publish, deploy, or send a
message.

## Avatar Role

| Field | Value |
|---|---|
| Name | Andromeda |
| Role | AI Marketing Commander |
| Character | Futuristic Thai female CEO / Andromeda AI CEO |
| Age direction | Adult |
| Persona | Confident, calm, premium, helpful |
| Setting | Galaxy command center with enterprise dashboard depth |
| Wardrobe | Modern executive black/navy outfit with subtle electric blue or purple accent |
| Camera | Waist-up presenter, clean framing, no clutter |

## Avatar Create Packet

This is the local create packet approved for future HeyGen UI/API entry. It is
not proof that an external avatar has been created.

```yaml
avatar_name: Andromeda
role: AI Marketing Commander
brand: ADS ANDROMEDA
appearance:
  adult_futuristic_thai_female: true
  wardrobe: black cyber-luxury executive suit
  palette: purple-blue galaxy, electric cyan, deep navy
environment: advertising command room / galaxy command center
voice:
  language: Thai
  gender: female
  tone: confident, friendly, professional
content_rule:
  educate_first: true
  sell_second: true
  no_long_thai_text_overlay: true
safety:
  no_official_meta_facebook_partnership_claim: true
  no_guaranteed_ad_approval_claim: true
  no_private_data_or_credentials: true
```

## Voice Direction

| Field | Value |
|---|---|
| Language | Thai |
| Voice | Thai female |
| Tone | Premium, confident, clear |
| Speed | Medium, not rushed |
| Emotion | Trustworthy and composed |
| Delivery | Commercial presenter, not exaggerated |

## 10-Second Script

```text
ADS ANDROMEDA
โครงสร้างพื้นฐานสำหรับการตลาดดิจิทัลยุคใหม่
พร้อมให้บริการด้วยบัญชีและเพจคุณภาพ
สอบถามสต็อกล่าสุดกับ ADS ANDROMEDA ได้เลย
```

## 15-Second Alternative Script

```text
ADS ANDROMEDA คือระบบบัญชีและเพจสำหรับยิงแอด Facebook ระดับพรีเมียม
พร้อมตรวจสอบก่อนส่งมอบ และมีทีมซัพพอร์ตดูแล
สอบถามสต็อกล่าสุดกับ ADS ANDROMEDA ได้เลย
```

## Screen Layout

| Time | Presenter | Background | Overlay |
|---|---|---|---|
| 0-2s | Presenter centered, slight smile | Logo glow forms behind presenter | `ADS ANDROMEDA` |
| 2-5s | Presenter turns slightly toward hologram | FB/BM/Page node graph appears | `Facebook`, `BM`, `Pages` |
| 5-8s | Presenter gestures to product cards | Product cards slide in beside presenter | approved card text only |
| 8-10s | Presenter faces camera | Clean logo final frame | `ADS ANDROMEDA` |

## HeyGen Prompt Draft

```text
Create a vertical 9:16 premium presenter video for ADS ANDROMEDA.
Use an adult futuristic Thai female CEO presenter in a luxury cyberpunk galaxy
command center. The presenter should speak Thai with a premium, confident, clear
female voice. Keep the camera waist-up, clean, and stable. Use holographic
enterprise dashboard elements behind her. Show only minimal English/number
labels on screen. Do not show long Thai text overlays.

Script:
ADS ANDROMEDA
โครงสร้างพื้นฐานสำหรับการตลาดดิจิทัลยุคใหม่
พร้อมให้บริการด้วยบัญชีและเพจคุณภาพ
สอบถามสต็อกล่าสุดกับ ADS ANDROMEDA ได้เลย

Approved product cards:
1. Facebook Page 2021, 1,000 followers, 350 THB
2. BM3 Verify, 1,800 THB
3. Coming Soon
```

## Negative Prompt / Avoid List

- Do not imply official Meta or Facebook partnership.
- Do not claim guaranteed ad approval, ban-proof results, or platform immunity.
- Do not show private credentials, account IDs, customer data, tokens, or real
  backend dashboards.
- Do not add Thai text overlays beyond the approved brand name if Thai rendering
  quality is uncertain.
- Do not use cute, cartoon, cheap, crowded, or meme-like visual style.
- Do not use emergency, pressure, or scarcity claims.

## Compliance Checklist

| Gate | Pass Condition |
|---|---|
| Consent | Only use an avatar or likeness that SIRINX has rights to use |
| Product truth | Only approved three product cards appear |
| Claim safety | No guarantee, no official partnership, no immunity claims |
| Voice quality | Thai voice is clear and does not distort product names |
| Text quality | No long Thai text on screen |
| Local-only | No HeyGen API/UI generation without future explicit approval |

## Future Approval Needed

Use a separate explicit approval before any of these:

```text
APPROVE_ADS_ANDROMEDA_HEYGEN_VIDEO_GENERATE
APPROVE_ADS_ANDROMEDA_HEYGEN_EXPORT
APPROVE_ADS_ANDROMEDA_VIDEO_PUBLISH
```

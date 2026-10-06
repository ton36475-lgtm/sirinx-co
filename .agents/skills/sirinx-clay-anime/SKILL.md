# SIRINX Claystyle 3D + Anime.js Frontend Skill

## Purpose
Implement the SIRINX.org Knowledge/AEO/GEO frontend as a premium Solar Intelligence experience extending the canonical SIRINX.co information architecture.

## Motion standard
Use Anime.js as the primary UI motion engine. The current public-web package already uses Vite/esbuild and Three.js; add `animejs` through the normal dependency/lockfile workflow on a writable coding node before importing it from `animejs`.

Preferred modules:
- `animate` for component and HUD motion
- `createTimeline` for hero choreography
- `stagger` for bento/policy cards
- `splitText` only where typography animation materially improves comprehension
- `waapi` for lightweight decorative motion where appropriate

Respect `prefers-reduced-motion`. Do not use motion to hide evidence, status, eligibility, prices, or source labels.

## Visual system
- Obsidian background
- soft clay surfaces
- cyan interaction accent
- solar-gold energy accent
- glass HUD panels
- Three.js/R3F for the 3D solar scene
- tactile depth, soft shadows, controlled bloom; avoid generic neon overload

## Information architecture
1. Hero: Solar Intelligence + interactive 3D estimator
2. Policy Engine: evidence-backed status cards
3. 3D Energy Lab: Rooftop / Carport / BESS / EV
4. AI + Cloud: evidence engine + source-backed INET capabilities
5. Province Knowledge Graph: 77-province entry
6. Conversion: Assessment -> Site Survey -> Load Profile -> Engineering -> Proposal

## Truth protocol
Never convert simulation into official entitlement. Every policy claim needs source/status/update metadata. Distinguish:
ACTIVE, LAW, REGULATION, OFFICIAL_POLICY, IMPLEMENTATION_PENDING, ANNOUNCED_DATE_PENDING, EXPIRED, UNKNOWN.

## Agent routing
- Hermes: orchestration and evidence intake
- L1: source collection
- L2: claim extraction/scoring
- L3: UX/system specification
- L4: implementation and verification
- L5: research/advisory
- OpenCode/Cline/Codex-class coding agents: implementation only after the L3 artifact exists
- Blender/3D agents: mesh/material/scene work
- Figma/Product Design: visual system and interaction review
- Manus/HeyGen: media generation when service capacity is available
- GitHub: branch/PR/evidence trail
- Vercel/Cloudflare: preview/edge verification only after release gates pass

Model output is never authority. Planned graph is never actual graph. Reported is never verified.

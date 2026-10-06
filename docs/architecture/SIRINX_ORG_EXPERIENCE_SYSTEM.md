# SIRINX.org — Solar Intelligence Experience System

Status: DESIGN-SPEC / branch-only
Branch: feat/sirinx-org-clay-anime
Release: BLOCKED until evidence gates pass

## 01 — Product thesis

SIRINX.org is not a brochure and not a generic AI landing page.
It is the public intelligence layer that turns:
policy -> evidence -> status -> simulation -> engineering -> proposal.

SIRINX.co remains the conversion/engineering baseline.
SIRINX.org becomes the knowledge, evidence and interactive decision layer.

## 02 — Experience architecture

1. SIGNAL — Hero shows the energy transition as a living system.
2. PROOF — Claim Registry exposes source/status/date instead of vague claims.
3. EXPLORE — 3D Energy Lab lets users manipulate roof, carport, load, sun and storage.
4. DECIDE — policy cards distinguish LAW / REGULATION / OFFICIAL_POLICY / PENDING / UNKNOWN.
5. ENGINEER — estimator converts inputs into an engineering scenario, never into a legal entitlement.
6. CONVERT — assessment -> site survey -> load profile -> engineering -> proposal.

## 03 — Hero: Energy Command Deck

Visual:
- obsidian clay environment
- solar roof as the hero object
- cyan energy flow
- solar-gold daylight arc
- glass HUD panels
- subtle depth/parallax
- no generic AI robot imagery

Motion:
- Anime.js timeline owns DOM choreography.
- Three.js/R3F owns spatial rendering.
- stagger is used for evidence/KPI reveal.
- WAAPI may be used for lightweight UI-only motion.
- reduced-motion disables non-essential choreography.

Hero controls:
[สำรวจระบบ] [ตรวจสิทธิ์/มาตรการ] [ประเมินไซต์]

Live HUD:
Generation / Self-consumption / Export / Storage / Evidence confidence

## 04 — Evidence rail

Every policy statement must carry:
- claim_id
- source
- status
- effective/announcement date when known
- last_verified
- confidence
- simulation_or_official flag

UI states:
VERIFIED
OFFICIAL_POLICY
IMPLEMENTATION_PENDING
ANNOUNCED_DATE_PENDING
UNKNOWN
EXPIRED

Never display a simulation output as an official entitlement.

## 05 — 3D Energy Lab

Scene objects:
- roof plane
- PV modules
- inverter
- BESS
- EV charger
- load nodes
- sun path
- grid connection

Interaction:
- drag/select roof
- change orientation
- add/remove PV modules
- toggle BESS
- toggle EV load
- change daytime load
- scrub sun/time
- compare scenarios

Scenario tabs:
ROOFTOP / CARPORT / BESS / EV / HYBRID

The scene is an engineering visualization, not a structural certification.

## 06 — Policy-to-engineering bridge

Do not place policy facts as decorative cards only.

Example flow:
User selects province
-> utility/context selected
-> bill profile
-> daytime load
-> roof/carport area
-> system type
-> policy status
-> scenario calculation
-> evidence panel
-> assessment CTA

The calculation layer must return:
- estimate
- assumptions
- source references
- uncertainty/range
- eligibility status
- missing evidence

## 07 — Motion grammar

Anime.js timelines:
A. bootSequence
B. heroReveal
C. evidenceReveal
D. policyStagger
E. labEnter
F. scenarioTransition
G. proposalHandoff

Motion rules:
- never animate critical numeric claims without semantic context
- never hide source/status during motion
- no infinite distracting loops
- preserve keyboard/focus order
- respect prefers-reduced-motion

## 08 — Visual hierarchy

Primary:
Solar intelligence object

Secondary:
Evidence / policy / energy flow

Tertiary:
Engineering details

Avoid:
- excessive glass cards
- neon everywhere
- stock solar imagery as hero
- fake AI dashboards
- unsupported ROI promises
- fake GPU specifications

## 09 — INET integration

INET is positioned as infrastructure context:
Enterprise Cloud / VM / Backup / DRaaS / S3 / DBaaS / Hybrid Cloud / Web Hosting.

Only source-verified claims may become UI facts.
Unverified GPU model/specification claims remain research metadata.

## 10 — Agentic architecture

Hermes = orchestration.
GhostClaw = policy gate.
Claim Registry = evidence authority.
Trajectory Controller = execution state.
Models = reasoning capability, never authority.
Three.js = spatial rendering.
Anime.js = motion orchestration.

No model may promote REPORTED -> VERIFIED.

## 11 — Performance budgets

Target:
- fast first contentful experience
- lazy-load 3D scene
- adaptive DPR
- pause rendering when offscreen
- reduced scene complexity on mobile
- defer heavy assets
- no blocking analytics
- no unnecessary animation on low-power devices

## 12 — Conversion architecture

CTA hierarchy:
1. ตรวจสิทธิ์และมาตรการ
2. ประเมินไซต์
3. ขอ Site Survey
4. ส่ง Load Profile
5. ขอ Engineering Proposal

No premature “ซื้อเลย” CTA.

## 13 — Release evidence

Required before promotion:
- source diff evidence
- dependency/lockfile evidence
- typecheck/build evidence
- unit/static evidence
- browser runtime evidence
- asset/media origin evidence
- API evidence
- Cloudflare edge evidence
- control-path evidence
- production verification

PR merged != production complete.

## 14 — Definition of done

A release candidate is complete only when:
- motion system is deterministic
- 3D scene is interactive
- policy state is explicit
- every claim has evidence state
- simulation is clearly separated from eligibility
- mobile fallback works
- reduced-motion works
- browser runtime passes
- release gates are green

Until then: branch-only / no merge / no deploy / no DNS.

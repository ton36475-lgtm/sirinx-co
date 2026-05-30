# Claude Design To Codex Handoff Rules

## Purpose

Prevent design-export drift when moving artifacts from design tools into the canonical SIRINX repo.

## Rules

- exported ZIPs are reference input, not production output
- Codex must patch canonical runtime files in `client/`
- large visual concepts may be staged in `apps/web/`
- design packets must link every section back to a canonical runtime or documentation path
- any content touching pricing, hardware, ROI, or track record must be validated against governance docs before merge

## Required Mapping

- hero and CTA sections -> runtime page components
- track record imagery -> `docs/migration/TRACK_RECORD_MEDIA_POLICY.md`
- fact-sensitive copy -> `governance/LOCKED_BUSINESS_FACTS.md`
- motion/performance guidance -> `docs/design/VERCEL_DEPLOY_CHECKLIST.md`

## Prohibited

- direct deployment from design exports
- adding guaranteed ROI language
- creating a second truth source for package facts
- importing unrelated brands or gambling content


# Executive UI Directive: Premium Real-World Track Record Imagery

## Record Status

`Design Governance Directive`

This directive governs visual assets for SIRINX Track Record pages and revenue-plane proof sections. It is a UI and evidence-control rule, not a claim verification record by itself.

## Directive

Track Record pages must use premium real-world imagery only, such as:

- solar carport installations
- smart hotel / energy-management installations
- comparable commercial, industrial, clean-tech, BESS, EV charger, or EMS installations
- anonymized real project photos approved for use
- real equipment, monitoring dashboard, site, or installation-detail photos with approved redaction

## Visual Asset Contract

```json
{
  "directiveId": "executive-ui-track-record-imagery-2026-04-23",
  "pageScope": "Track Record pages and revenue-plane proof sections",
  "imageryPolicy": "premium_real_world_only",
  "allowedImagery": [
    "solar carport installation",
    "smart hotel energy installation",
    "commercial or industrial solar installation",
    "BESS or EMS installation detail",
    "EV charger installation",
    "monitoring dashboard screenshot with redaction",
    "approved anonymized project photo"
  ],
  "blockedImagery": [
    "casino, lottery, gambling, betting, or CHOKMA assets",
    "fantasy render presented as real project",
    "stock image presented as SIRINX work",
    "AI-generated site photo presented as real installation",
    "unapproved customer logo, signboard, address, meter serial, bill, or face",
    "low-trust ad banner styling"
  ],
  "requiredEvidence": [
    "visual asset path",
    "source or owner",
    "permission status",
    "redaction status",
    "linked track record creative record",
    "claim status of nearby copy"
  ],
  "publicationStatus": "draft | internal_only | public_ready | published",
  "reviewRequired": true
}
```

## Allowed Use

- Track Record hero images.
- Proof cards for solar carport, smart hotel, BESS, EV charger, EMS, or comparable installations.
- Anonymous case-study imagery when the site/customer identity is redacted.
- Engineering-detail imagery such as inverters, cabinets, monitoring screens, cable trays, mounting, roof/carport structure, or meter panels when approved.

## Not Allowed

- Do not use gambling, lottery, casino, betting, or CHOKMA visual assets in SIRINX track record pages.
- Do not present AI-generated, stock, or conceptual images as real track record evidence.
- Do not expose customer identity, exact location, signage, meter serials, raw bills, faces, or private facility details without approval.
- Do not use low-trust promo collage or banner styling for executive track record sections.
- Do not let visuals imply verified performance, ROI, legal approval, BOI eligibility, ESG certification, or package truth unless the adjacent claim status supports it.

## Creative Direction

- Premium real-world photography with clean composition, deep clean-energy blue, graphite, solar gold, and white space.
- Wide establishing image plus close-up engineering detail where possible.
- Use visible status badges: `Verified`, `Pilot`, `Field Observed`, `Target Model`, or `Review Required`.
- Pair every metric with assumptions or evidence status.
- If a visual is conceptual or rendered, it must be labeled as `Concept Visual` and cannot be used as a Track Record proof image.

## Evidence Needed Before Public Use

- Asset file path or DAM/Drive reference.
- Source owner and permission status.
- Redaction status.
- Linked track record creative record.
- Linked pilot, hardware, ROI, or field context record if visual supports a proof point.
- Reviewer and approver signoff.

## Rollback Note

If an unapproved or non-real-world image is published as track record evidence, remove the image, restore the last approved asset, downgrade the section to `Review Required`, and preserve the before/after diff.

## Audit Trail Note

Save the original asset, redacted asset, source/permission note, linked governance record, reviewer/approver, public copy before/after, and rollback target.

# Sovereign Deep Research Job Packet Template

Status: local-only template

Use this packet before any deep research run.

## Job Metadata

```yaml
job_id: DR-YYYYMMDD-001
project: SIRINX / AGM / AI Money / Other
requested_by: operator
created_at: YYYY-MM-DDTHH:MM:SS+07:00
mode: local_first
confidentiality: internal
```

## Research Goal

What decision must this research support?

```text
Example: Verify whether a Solar + BESS system can reach 3-year payback in
Thailand commercial-building scenarios, and identify assumptions where the
claim is true or false.
```

## Inputs

```yaml
inputs:
  videos: []
  transcripts: []
  pdfs: []
  screenshots: []
  urls: []
  tables: []
  notes: []
```

## Scope

```yaml
claim_types:
  - technical
  - financial
  - market
  - regulatory
  - operational
  - strategic
geography:
  - Thailand
time_window:
  preferred_recency_years: 3
source_budget:
  max_sources_total: 60
  min_sources_per_material_claim: 2
  max_search_loops_per_claim: 3
```

## Source Policy

Preferred:

- primary law/regulation
- government data
- standards bodies
- peer-reviewed or technical papers
- vendor datasheets when technical claims concern that vendor's product
- reputable industry reports
- direct competitor pages for market/offer analysis

Use with caution:

- marketing pages
- sponsored posts
- social screenshots
- unaudited influencer claims
- old statistics

Blocked unless explicitly allowed:

- confidential client documents outside the allowlist
- private browser sessions
- service-role keys
- paid research portals
- scraping behind login walls

## Evidence Requirements

Every material claim must produce:

- evidence ID
- source ID
- claim type
- claim text
- source excerpt or structured summary
- timestamp/page/region when available
- confidence score
- conflict state
- assumptions
- citation URL or local source path

## Output Requirements

```yaml
outputs:
  - claims.json
  - evidence_units.json
  - claim_evidence_matrix.csv
  - contradiction_log.md
  - source_quality_table.csv
  - scenario_model.json
  - research_report.md
  - executive_summary.md
  - action_roadmap.md
```

## Verification Gates

- [ ] Each material claim has evidence or is marked unverified.
- [ ] Video-derived claims include timestamps.
- [ ] Tables/charts/PDF claims include page or crop references.
- [ ] Financial claims include assumptions and scenario ranges.
- [ ] Conflicting evidence is not hidden.
- [ ] Sponsored or marketing sources are labeled.
- [ ] Output separates observation, inference, assumption, and recommendation.

## Hard Stops

Stop or quarantine the job if:

- input asks for secret extraction;
- confidential raw files would leave local storage without a redaction policy;
- source requires bypassing login, captcha, quota, or paid access;
- report would make a legal/financial/safety recommendation without confidence and expert-review labels;
- requested output requires public publishing or external mutation.

## Final Answer Format

```text
Summary:
Confidence:
Claims Verified:
Claims Partially Supported:
Claims Rejected:
Unverified Claims:
Key Assumptions:
Business Feasibility:
Risks:
Next Actions:
Sources:
```

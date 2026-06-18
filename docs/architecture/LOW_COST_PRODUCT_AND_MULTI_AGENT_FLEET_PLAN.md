# Low-Cost Product And Multi-Agent Fleet Plan

Status: local-only operating model. No deployment, provider call, external
account setup, or live fleet dispatch is approved by this document.

## Purpose

This document integrates the `$100/month product stack` and `multi-agent fleet`
operating pattern into the GHOSTCLAW / SIRINXDev plan. The goal is to make MVP
shipping cheap while making production survival explicit: usage limits, budget
guards, approval gates, queue limits, and clear upgrade points.

## Product Stack Under 100 USD / Month

The first 100 USD should be treated as the coding/fleet budget, not as unlimited
infrastructure budget.

| Layer | Default Choice | Cost Posture | Guardrail |
|---|---|---|---|
| Coding agent | Claude Code / Codex subscription tier | Primary paid budget | Use for implementation and review, not unbounded background loops |
| Frontend | Vercel Hobby / free tier | Free to start | Preview first, monitor function/edge usage, upgrade only when needed |
| Database | Neon or Supabase free tier | Free to start | Enforce row/storage limits and backup policy before real users |
| Auth | Clerk free tier | Free to start | Track MAU thresholds and avoid surprise user-based billing |
| Object storage | Cloudflare R2 | Low cost, no egress bandwidth charge | Lifecycle cleanup, signed URLs, object naming policy |
| Email | Resend free tier | Free to start | Transactional only at MVP; cap daily sends |
| Payments | Stripe | Per transaction | Keep payment webhooks approval-gated until production hardening |
| Analytics | PostHog free/startup tier | Free/low cost | Track events selectively, avoid noisy autocapture by default |
| Cache / queue | Upstash Redis / Vector | Free or pay-as-you-go | Rate limit every AI/API-heavy endpoint |
| Heavy workers | Cloud Run / Modal / Fly.io | Usage-based | Route only bounded jobs; queue concurrency and timeout required |

## Production Survival Rules

MVPs are easy to launch. Production fails when costs leak invisibly. Every
product lane must ship with these controls before public usage:

- Per-user quota.
- Per-project quota.
- Per-day and per-month budget cap.
- AI model routing policy.
- Retry limit.
- Queue concurrency limit.
- Storage lifecycle cleanup.
- R2 object namespace policy.
- Rate limiting through Redis or equivalent.
- Admin kill switch.
- Billing/usage ledger.
- PRE_APPROVAL_PACKET before production deployment.

## Cost Leak Surfaces

| Surface | Failure Mode | Control |
|---|---|---|
| Compute | Background workers keep running | Job timeout and queue cap |
| Database | Logs/events grow without bounds | Retention policy and cold archive |
| Storage | User uploads accumulate | Lifecycle cleanup and per-plan quotas |
| Egress | Media/download traffic spikes | Prefer R2 and signed links |
| AI API | Agents loop or retry too much | Budget governor, cache, model router |
| Email | Abuse or looped notification | Verified domain, daily cap, dedupe |
| Analytics | High-volume noisy events | Event allowlist |

## Multi-Agent Fleet Pattern

Fleet execution is useful only when every worker has a bounded role and the
orchestrator can stop waste quickly.

```text
Human Commander
  -> Hermes / Fleet Orchestrator
  -> Task Queue
  -> Headless Codex Workers
  -> Visible Tmux Coders
  -> Test / Lint / Build Callbacks
  -> Judge / Review Agent
  -> Approval Gate
  -> Merge / Commit / Deploy only after approval
```

## Fleet Roles

| Role | Responsibility | Hard Limit |
|---|---|---|
| Planner | Break goal into task packets | No file mutation |
| Builder | Implement approved task | One bounded task per worker |
| Reviewer | Inspect diff and risk | No source mutation |
| Test Runner | Run targeted checks | No deploy/push |
| Judge | Compare outputs and choose next action | No hidden execution |
| Cost Governor | Track budget, tokens, retries, runtime | Can stop fleet |
| Reporter | Produce evidence and next gate | Must mark unverified claims |

## Mac Mini M2 Fleet Defaults

Start small before copying high-capacity screenshots.

- Default local parallelism: 2 to 4 workers.
- Increase only after checking RAM, CPU, thermal state, and token budget.
- Use read-only/review workers before write workers.
- Keep visible tmux workers for high-risk operations.
- Avoid `bypass permissions` outside sandbox repos.
- Stop every batch at an approval packet.

## Agent Loop Policy

Every worker loop must follow:

```text
Discovery -> Planning -> Execution -> Verification -> Iteration -> Handoff
```

Open-ended exploration is allowed only in read-only research mode. Production
implementation should use closed loops with clear goals, steps, evals, retry
limits, and stop conditions.

## Integration With Downstream Projects

### AGM AUTOFLOW / AUTOGLOW

- Use R2 for generated media/export packs.
- Use queue limits for storyboard/render jobs.
- Put AI generation behind credits per project.
- Keep Google Flow handoff manual-assisted until policy and audit pass.

### SIRINX Solar / OPAL

- Use Postgres free tier until quote volume or audit retention requires paid.
- Cache repeated pricing/BOQ calculations.
- Avoid paid model calls for deterministic engineering calculations.

### Phitsanulok United News

- Rate limit content ingestion.
- Require human editorial approval before publish.
- Keep media archive lifecycle-managed.

### Kusala / Final Farewell

- Treat customer data as high trust.
- Use production-grade backup and access controls before real families.
- Do not rely on free-tier database for sensitive production records.

### Ads Andromeda / ADS Queen

- Use per-campaign budget caps.
- Separate draft content from rendered assets.
- Require manual approval before paid ads or social posting.

## Integration With Existing Control Plane

- `GHOSTCLAW_MASTER_ARCHITECTURE.md`: fleet and cost guard are first-class
  system layers.
- `WORKFLOW_MAP.md`: budget and production gates sit before approval packet.
- `FUSION_MODE_SPEC.md`: model council must report cost and approval state.
- `LOCAL_FIRST_SECURITY_POLICY.md`: external billing surfaces are approval
  locked.
- `PRE_APPROVAL_PACKET_TEMPLATE.md`: production actions must state cost and
  rollback.

## External References To Recheck Before Live Use

Pricing and limits change. Recheck official pages before production decisions:

- Claude pricing: `https://claude.com/pricing`
- Vercel pricing/plans: `https://vercel.com/pricing`
- Cloudflare R2 pricing: `https://developers.cloudflare.com/r2/pricing/`
- Neon pricing: `https://neon.com/pricing`
- Supabase pricing: `https://supabase.com/pricing`
- Clerk pricing: `https://clerk.com/pricing`
- Resend pricing: `https://resend.com/pricing`
- Upstash pricing: `https://upstash.com/`

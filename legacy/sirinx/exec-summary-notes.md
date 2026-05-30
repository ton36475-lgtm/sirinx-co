# Key Findings from สรุปผู้บริหาร PDF

## Architecture
- Frontend: Next.js (App Router) — SEO-friendly, responsive
- Admin: Payload CMS — headless CMS, Draft/Publish workflow, RBAC
- Data: Supabase — Postgres DB, Auth, Storage, Edge Functions, Cron
- Automation: n8n (self-hosted) — form→CRM→alerts
- Testing: Playwright — cross-browser automated tests
- Agent: Codex (GPT-5.3) + OMX + Manus

## Data Model Collections
pages, services, industries, projects, strategy_assets, media, executive, certificates, leads, qa_reports, daily_ops_logs

## Key Numbers to Update
- ลดค่าไฟฟ้า: **30-100%** (เพราะมีระบบ BESS แบตเตอรี่)
- Solar Farm 2 Node: Royal Park + Holatel Rim Nan
- CEO: Pitoon Yingyosruangrong

## Sprint Roadmap (6 Sprints, ~17 weeks)
1. Foundation (3w): AGENTS.md, Repo, Payload+Supabase, Sitemap
2. Content & Backend (3w): CMS collections, content, Manus skills
3. Automation & SEO (3w): n8n flows, SEO, blog articles
4. QA & Polishing (3w): Playwright tests, UI/UX, KPI dashboard
5. Pre-Launch Review (3w): Checklist, dry-run publish
6. Go-Live & Handover (2w): Domain, SSL, final QA, training

## KPIs
- Lead Metrics: qualified leads/month, conversion rate
- Sales Pipeline: proposals, deals, velocity
- Website: traffic, bounce rate, session duration
- Content: articles, SEO rankings
- Quality: % tests passed, review issues, PDPA incidents
- Trust: certificates, testimonials

## Risk Matrix
- Risk A (review required): financial claims, tax, ROI, BOI/DBD, PDPA
- Risk B (verify): project images, hero text, form logic
- Risk C (communicate): SEO, internal links, metadata, CTA colors

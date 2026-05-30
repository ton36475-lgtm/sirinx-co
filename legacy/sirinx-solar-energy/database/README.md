# SIRINX Database — Supabase Setup

## Prerequisites
- Supabase project created at https://supabase.com
- Service role key and URL from Project Settings → API

## Setup Steps

### 1. Run Schema Migration
In Supabase Dashboard → SQL Editor, run `schema.sql`:
```sql
-- Copy and paste contents of schema.sql
```

Or via Supabase CLI:
```bash
supabase db push
```

### 2. Seed 77 Province SEO Pages
Run `seed.sql` in SQL Editor after schema is applied.

### 3. Configure Environment Variables
Add to `sirinx-app/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

## Tables

| Table | Purpose |
|-------|---------|
| `leads` | CRM leads from Facebook, website, referrals |
| `customers` | Converted customers with plan/MRR data |
| `installations` | Solar installation records with ROI data |
| `contractors` | EPC contractor network by province |
| `seo_pages` | 77 province SEO landing pages |
| `agent_tasks` | 47 Ronin agent task tracking |
| `campaigns` | Marketing campaign performance |
| `system_metrics` | Platform KPI time-series data |

## RLS Policies
RLS is enabled on `leads`, `customers`, `installations`, `contractors`.
Service role has full access. Add authenticated user policies as needed.

## Indexes
All status and province columns are indexed for fast filtering.

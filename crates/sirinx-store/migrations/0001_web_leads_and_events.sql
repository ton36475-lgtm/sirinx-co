-- Phase R2: web funnel persistence for www.sirinx.co (sirinx-web).
-- Named web_* to stay clear of the existing pipeline_leads tables.

create table if not exists public.web_leads (
    id uuid primary key,
    status text not null default 'new',
    business_type text not null,
    monthly_electric_bill double precision not null check (monthly_electric_bill > 0),
    available_area_sqm double precision not null check (available_area_sqm > 0),
    interest jsonb not null default '[]'::jsonb,
    source text not null,
    consent jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists web_leads_status_idx on public.web_leads (status);
create index if not exists web_leads_created_at_idx on public.web_leads (created_at desc);

create table if not exists public.web_analytics_events (
    id bigint generated always as identity primary key,
    event text not null,
    payload jsonb not null default '{}'::jsonb,
    page text not null,
    consent jsonb not null,
    created_at timestamptz not null default now()
);

create index if not exists web_analytics_events_event_idx on public.web_analytics_events (event);

-- Server connects with a privileged role; browsers must not touch these
-- tables through PostgREST, so RLS is on with no public policies.
alter table public.web_leads enable row level security;
alter table public.web_analytics_events enable row level security;

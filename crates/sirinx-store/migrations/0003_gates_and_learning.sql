-- B1: release-gate state survives restarts.
create table if not exists public.web_control_gates (
    name text primary key,
    state text not null default 'hold' check (state in ('hold', 'open')),
    ticket text,
    updated_at timestamptz not null default now()
);

-- B2: self-learning loop — every failure is recorded, resolutions
-- become lessons that guide future retries.
create table if not exists public.web_failure_events (
    id bigint generated always as identity primary key,
    component text not null,
    error text not null,
    context jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists web_failure_events_component_idx
    on public.web_failure_events (component);

create table if not exists public.web_lessons (
    id bigint generated always as identity primary key,
    pattern text not null unique,
    resolution text not null,
    hits bigint not null default 0,
    updated_at timestamptz not null default now()
);

alter table public.web_control_gates enable row level security;
alter table public.web_failure_events enable row level security;
alter table public.web_lessons enable row level security;

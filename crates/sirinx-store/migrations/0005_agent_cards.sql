-- B15: durable A2A peer registry. Gates (B1) already survive restarts;
-- OmniRoute's in-memory-only card map does not, so every registered
-- agent (Mac mini, PC node, cloud worker, a real Codex node) vanishes
-- whenever sirinx-control restarts. This closes that gap the same way.

create table if not exists public.web_agent_cards (
    id text primary key,
    name text not null,
    capabilities jsonb not null default '[]'::jsonb,
    endpoint text not null default '',
    priority integer not null default 0,
    updated_at timestamptz not null default now()
);

alter table public.web_agent_cards enable row level security;

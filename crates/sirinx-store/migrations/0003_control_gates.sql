-- Durable release-gate decisions for the Rust control plane.
-- The five known gates start held; opening one always requires a ticket.

create table if not exists public.web_control_gates (
    name text primary key check (btrim(name) <> ''),
    state text not null default 'hold' check (state in ('hold', 'open')),
    ticket text,
    updated_at timestamptz not null default now(),
    constraint web_control_gates_ticket_check check (
        (state = 'hold' and ticket is null)
        or (state = 'open' and nullif(btrim(ticket), '') is not null)
    )
);

insert into public.web_control_gates (name, state, ticket)
values
    ('deploy', 'hold', null),
    ('cloudflare_dns', 'hold', null),
    ('telegram_send', 'hold', null),
    ('customer_messaging', 'hold', null),
    ('adaptive_sync', 'hold', null)
on conflict (name) do nothing;

-- Server-only table: RLS is enabled intentionally with no public policies.
alter table public.web_control_gates enable row level security;

-- iGaming ledger sandbox schema.
-- Purpose: local/sandbox practice for ledger, webhook, withdrawal, audit, and
-- observability design. This migration is not a live gambling/payment system.
--
-- Safety boundary:
-- - No real player/customer data.
-- - No real deposits or withdrawals.
-- - No live payment provider credentials.
-- - No public endpoint exposure.
-- - RLS is enabled on all tables.
-- - Only service_role receives table access by default.

create extension if not exists pgcrypto;

create table if not exists public.igaming_sandbox_accounts (
  id uuid primary key default gen_random_uuid(),
  external_ref text not null unique,
  label text not null,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint igaming_sandbox_accounts_status_check check (
    status in ('active', 'frozen', 'closed')
  )
);

create table if not exists public.igaming_sandbox_wallets (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.igaming_sandbox_accounts(id),
  currency text not null default 'TEST',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint igaming_sandbox_wallets_currency_check check (currency = 'TEST'),
  constraint igaming_sandbox_wallets_status_check check (
    status in ('active', 'frozen', 'closed')
  ),
  constraint igaming_sandbox_wallets_account_currency_unique unique (account_id, currency)
);

create table if not exists public.igaming_sandbox_ledger_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_ref text not null unique,
  transaction_type text not null,
  status text not null default 'posted',
  idempotency_key text,
  source_event_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint igaming_sandbox_ledger_transactions_type_check check (
    transaction_type in ('deposit', 'withdrawal_settlement', 'bonus', 'reversal')
  ),
  constraint igaming_sandbox_ledger_transactions_status_check check (
    status in ('posted', 'reversed', 'rejected')
  )
);

create table if not exists public.igaming_sandbox_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.igaming_sandbox_ledger_transactions(id),
  ledger_account text not null,
  side text not null,
  amount_minor bigint not null,
  currency text not null default 'TEST',
  sequence integer not null,
  created_at timestamptz not null default now(),
  constraint igaming_sandbox_ledger_entries_side_check check (side in ('debit', 'credit')),
  constraint igaming_sandbox_ledger_entries_amount_check check (amount_minor > 0),
  constraint igaming_sandbox_ledger_entries_currency_check check (currency = 'TEST'),
  constraint igaming_sandbox_ledger_entries_sequence_unique unique (transaction_id, sequence)
);

create table if not exists public.igaming_sandbox_payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_ref text not null,
  idempotency_key text not null,
  event_type text not null,
  account_id uuid references public.igaming_sandbox_accounts(id),
  amount_minor bigint not null,
  currency text not null default 'TEST',
  signature_status text not null default 'not_checked',
  processing_status text not null default 'received',
  ledger_transaction_id uuid references public.igaming_sandbox_ledger_transactions(id),
  received_at timestamptz not null default now(),
  provider_created_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  constraint igaming_sandbox_payment_events_event_unique unique (provider, event_ref),
  constraint igaming_sandbox_payment_events_idempotency_unique unique (provider, idempotency_key),
  constraint igaming_sandbox_payment_events_type_check check (
    event_type in ('deposit.confirmed', 'withdrawal.settled', 'withdrawal.failed')
  ),
  constraint igaming_sandbox_payment_events_amount_check check (amount_minor > 0),
  constraint igaming_sandbox_payment_events_currency_check check (currency = 'TEST'),
  constraint igaming_sandbox_payment_events_signature_check check (
    signature_status in ('valid', 'invalid', 'not_checked')
  ),
  constraint igaming_sandbox_payment_events_processing_check check (
    processing_status in ('received', 'posted', 'duplicate', 'rejected', 'quarantined')
  )
);

create table if not exists public.igaming_sandbox_withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  request_ref text not null unique,
  wallet_id uuid not null references public.igaming_sandbox_wallets(id),
  amount_minor bigint not null,
  currency text not null default 'TEST',
  status text not null default 'requested',
  ledger_transaction_id uuid references public.igaming_sandbox_ledger_transactions(id),
  requested_at timestamptz not null default now(),
  settled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint igaming_sandbox_withdrawal_requests_amount_check check (amount_minor > 0),
  constraint igaming_sandbox_withdrawal_requests_currency_check check (currency = 'TEST'),
  constraint igaming_sandbox_withdrawal_requests_status_check check (
    status in ('requested', 'settled', 'rejected', 'cancelled')
  )
);

create table if not exists public.igaming_sandbox_audit_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  account_id uuid references public.igaming_sandbox_accounts(id),
  transaction_id uuid references public.igaming_sandbox_ledger_transactions(id),
  request_ref text,
  severity text not null default 'info',
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint igaming_sandbox_audit_events_severity_check check (
    severity in ('info', 'warn', 'security', 'critical')
  )
);

create table if not exists public.igaming_sandbox_risk_signals (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.igaming_sandbox_accounts(id),
  signal_type text not null,
  severity text not null default 'low',
  source text not null default 'sandbox',
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint igaming_sandbox_risk_signals_severity_check check (
    severity in ('low', 'medium', 'high', 'critical')
  )
);

create index if not exists igaming_sandbox_ledger_entries_transaction_idx
  on public.igaming_sandbox_ledger_entries(transaction_id);

create index if not exists igaming_sandbox_ledger_entries_account_idx
  on public.igaming_sandbox_ledger_entries(ledger_account);

create index if not exists igaming_sandbox_payment_events_idempotency_idx
  on public.igaming_sandbox_payment_events(provider, idempotency_key);

create index if not exists igaming_sandbox_withdrawal_wallet_status_idx
  on public.igaming_sandbox_withdrawal_requests(wallet_id, status);

create index if not exists igaming_sandbox_audit_events_created_idx
  on public.igaming_sandbox_audit_events(created_at desc);

create or replace view public.igaming_sandbox_ledger_transaction_totals
with (security_invoker = true) as
select
  transaction_id,
  sum(case when side = 'debit' then amount_minor else 0 end) as debit_total_minor,
  sum(case when side = 'credit' then amount_minor else 0 end) as credit_total_minor,
  (
    sum(case when side = 'debit' then amount_minor else 0 end) =
    sum(case when side = 'credit' then amount_minor else 0 end)
  ) as is_balanced,
  count(*) as entry_count
from public.igaming_sandbox_ledger_entries
group by transaction_id;

create or replace function public.set_igaming_sandbox_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_igaming_sandbox_accounts_updated_at on public.igaming_sandbox_accounts;
create trigger set_igaming_sandbox_accounts_updated_at
before update on public.igaming_sandbox_accounts
for each row
execute function public.set_igaming_sandbox_updated_at();

drop trigger if exists set_igaming_sandbox_wallets_updated_at on public.igaming_sandbox_wallets;
create trigger set_igaming_sandbox_wallets_updated_at
before update on public.igaming_sandbox_wallets
for each row
execute function public.set_igaming_sandbox_updated_at();

alter table public.igaming_sandbox_accounts enable row level security;
alter table public.igaming_sandbox_wallets enable row level security;
alter table public.igaming_sandbox_ledger_transactions enable row level security;
alter table public.igaming_sandbox_ledger_entries enable row level security;
alter table public.igaming_sandbox_payment_events enable row level security;
alter table public.igaming_sandbox_withdrawal_requests enable row level security;
alter table public.igaming_sandbox_audit_events enable row level security;
alter table public.igaming_sandbox_risk_signals enable row level security;

revoke all on public.igaming_sandbox_accounts from public;
revoke all on public.igaming_sandbox_wallets from public;
revoke all on public.igaming_sandbox_ledger_transactions from public;
revoke all on public.igaming_sandbox_ledger_entries from public;
revoke all on public.igaming_sandbox_payment_events from public;
revoke all on public.igaming_sandbox_withdrawal_requests from public;
revoke all on public.igaming_sandbox_audit_events from public;
revoke all on public.igaming_sandbox_risk_signals from public;
revoke all on public.igaming_sandbox_ledger_transaction_totals from public;

grant select, insert, update, delete on public.igaming_sandbox_accounts to service_role;
grant select, insert, update, delete on public.igaming_sandbox_wallets to service_role;
grant select, insert, update, delete on public.igaming_sandbox_ledger_transactions to service_role;
grant select, insert, update, delete on public.igaming_sandbox_ledger_entries to service_role;
grant select, insert, update, delete on public.igaming_sandbox_payment_events to service_role;
grant select, insert, update, delete on public.igaming_sandbox_withdrawal_requests to service_role;
grant select, insert, update, delete on public.igaming_sandbox_audit_events to service_role;
grant select, insert, update, delete on public.igaming_sandbox_risk_signals to service_role;
grant select on public.igaming_sandbox_ledger_transaction_totals to service_role;

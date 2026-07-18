-- Shared cross-node pending-work queue for the control plane.
-- Inserts fire pg_notify('web_pending_work', id) so any connected node
-- (Mac mini, PC node, cloud worker) can LISTEN and react immediately.

create table if not exists public.web_pending_work (
    id uuid primary key,
    source text not null,
    title text not null,
    detail jsonb not null default '{}'::jsonb,
    status text not null default 'pending',
    claimed_by text,
    claimed_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists web_pending_work_status_idx on public.web_pending_work (status);

create or replace function public.notify_web_pending_work()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    perform pg_notify('web_pending_work', new.id::text);
    return new;
end;
$$;

drop trigger if exists web_pending_work_notify on public.web_pending_work;
create trigger web_pending_work_notify
after insert on public.web_pending_work
for each row execute function public.notify_web_pending_work();

alter table public.web_pending_work enable row level security;

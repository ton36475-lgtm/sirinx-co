-- B12: record real completion timestamps on the shared work queue, so
-- every node (Mac mini, PC, cloud, Telegram gateway) sees the same
-- server-trusted "done at" time instead of a client-supplied one.

alter table public.web_pending_work
    add column if not exists completed_at timestamptz,
    add column if not exists completed_by text;

create index if not exists web_pending_work_completed_at_idx
    on public.web_pending_work (completed_at);

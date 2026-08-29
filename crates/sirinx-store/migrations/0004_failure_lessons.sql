-- B2 self-learning recovery records. These tables deliberately retain no raw
-- invocation arguments and no error-message text: only bounded tool names,
-- closed classifications, structured guidance, and counters are durable.

create table if not exists public.web_failure_events (
    id uuid primary key,
    run_id uuid not null,
    tool_name text not null check (
        char_length(btrim(tool_name)) between 1 and 128
    ),
    error_kind text not null check (
        error_kind in ('bad_args', 'failed', 'unknown')
    ),
    attempt integer not null check (attempt > 0),
    created_at timestamptz not null default now()
);

create index if not exists web_failure_events_run_attempt_idx
    on public.web_failure_events (run_id, attempt);
create index if not exists web_failure_events_tool_created_idx
    on public.web_failure_events (tool_name, created_at desc);

create table if not exists public.web_lessons (
    id uuid primary key,
    tool_name text not null check (
        char_length(btrim(tool_name)) between 1 and 128
    ),
    error_kind text not null check (
        error_kind in ('bad_args', 'failed', 'unknown')
    ),
    guidance_kind text not null check (
        guidance_kind in (
            'validate_arguments',
            'retry_transient_failure',
            'verify_tool_availability'
        )
    ),
    occurrences bigint not null default 1 check (occurrences > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint web_lessons_dedupe_key unique (
        tool_name,
        error_kind,
        guidance_kind
    )
);

create index if not exists web_lessons_tool_occurrences_idx
    on public.web_lessons (tool_name, occurrences desc, updated_at desc);

-- Server-only tables: RLS is enabled intentionally with no public policies.
alter table public.web_failure_events enable row level security;
alter table public.web_lessons enable row level security;

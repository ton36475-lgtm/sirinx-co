-- P2 durable agent-runtime groundwork. This migration is expand-only: it
-- creates an isolated, server-only ledger and does not rewrite prior web data.

create table public.agent_runtime_tasks (
    task_id varchar(160) primary key check (
        task_id ~ '^TASK-[A-Za-z0-9._-]+$'
    ),
    -- This enforces the closed top-level JSON shape and cheap scalar checks.
    -- Nested item uniqueness, date-time formats, and other deep semantics stay
    -- authoritative in the typed Rust TaskEnvelope validator.
    envelope jsonb not null check (
        jsonb_typeof(envelope) = 'object'
        and envelope ?& array[
            'schemaVersion', 'taskId', 'createdAt', 'goal', 'constraints',
            'nonGoals', 'requestedBy', 'dataClass', 'repository',
            'requestedRoleIds', 'actionManifest', 'budgets',
            'stopConditions', 'idempotencyKey'
        ]
        and envelope - array[
            'schemaVersion', 'taskId', 'createdAt', 'goal', 'constraints',
            'nonGoals', 'requestedBy', 'dataClass', 'repository',
            'requestedRoleIds', 'actionManifest', 'budgets',
            'stopConditions', 'idempotencyKey', 'planHash', 'scopeHash',
            'approvalTicketIds'
        ] = '{}'::jsonb
        and jsonb_typeof(envelope -> 'schemaVersion') = 'string'
        and envelope ->> 'schemaVersion' = '1.0'
        and jsonb_typeof(envelope -> 'taskId') = 'string'
        and envelope ->> 'taskId' = task_id
        and jsonb_typeof(envelope -> 'createdAt') = 'string'
        and jsonb_typeof(envelope -> 'goal') = 'string'
        and char_length(envelope ->> 'goal') between 1 and 4096
        and jsonb_typeof(envelope -> 'constraints') = 'array'
        and jsonb_typeof(envelope -> 'nonGoals') = 'array'
        and jsonb_typeof(envelope -> 'requestedBy') = 'object'
        and jsonb_typeof(envelope -> 'dataClass') = 'string'
        and envelope ->> 'dataClass' in (
            'PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'
        )
        and jsonb_typeof(envelope -> 'repository') = 'object'
        and case
            when jsonb_typeof(envelope -> 'requestedRoleIds') = 'array'
                then jsonb_array_length(envelope -> 'requestedRoleIds') > 0
            else false
        end
        and jsonb_typeof(envelope -> 'actionManifest') = 'array'
        and jsonb_typeof(envelope -> 'budgets') = 'object'
        and case
            when jsonb_typeof(envelope -> 'stopConditions') = 'array'
                then jsonb_array_length(envelope -> 'stopConditions') > 0
            else false
        end
        and jsonb_typeof(envelope -> 'idempotencyKey') = 'string'
        and envelope ->> 'idempotencyKey' = idempotency_key
        and (
            not (envelope ? 'planHash')
            or jsonb_typeof(envelope -> 'planHash') = 'null'
            or (
                jsonb_typeof(envelope -> 'planHash') = 'string'
                and envelope ->> 'planHash' ~ '^[0-9a-f]{64}$'
            )
        )
        and (
            not (envelope ? 'scopeHash')
            or jsonb_typeof(envelope -> 'scopeHash') = 'null'
            or (
                jsonb_typeof(envelope -> 'scopeHash') = 'string'
                and envelope ->> 'scopeHash' ~ '^[0-9a-f]{64}$'
            )
        )
        and (
            not (envelope ? 'approvalTicketIds')
            or jsonb_typeof(envelope -> 'approvalTicketIds') = 'array'
        )
    ),
    idempotency_key varchar(256) not null unique check (
        char_length(idempotency_key) between 16 and 256
    ),
    state varchar(32) not null check (state in (
        'DRAFT', 'TRIAGED', 'PLANNED', 'QUEUED', 'LEASED', 'RUNNING',
        'CHECKING', 'GUARDED', 'WAITING_APPROVAL', 'EXECUTING',
        'VERIFYING', 'RECEIPTED', 'SUCCEEDED', 'FAILED', 'BLOCKED',
        'CANCELED', 'QUARANTINED', 'INPUT_REQUIRED', 'AUTH_REQUIRED',
        'EFFECT_UNKNOWN', 'DEAD_LETTER'
    )),
    version bigint not null check (version > 0),
    created_at timestamptz not null,
    updated_at timestamptz not null,
    check (updated_at >= created_at)
);

create index agent_runtime_tasks_state_updated_idx
    on public.agent_runtime_tasks (state, updated_at);

create table public.agent_runtime_runs (
    run_id varchar(160) primary key check (
        run_id ~ '^RUN-[A-Za-z0-9._-]+$'
    ),
    task_id varchar(160) not null references public.agent_runtime_tasks(task_id)
        on delete restrict,
    stage_id varchar(160) not null check (btrim(stage_id) <> ''),
    role_id smallint not null check (role_id between 1 and 47),
    principal_id varchar(256) not null check (btrim(principal_id) <> ''),
    action_class varchar(1) not null check (action_class in ('A', 'B', 'C', 'D', 'X')),
    state varchar(32) not null check (state in (
        'DRAFT', 'TRIAGED', 'PLANNED', 'QUEUED', 'LEASED', 'RUNNING',
        'CHECKING', 'GUARDED', 'WAITING_APPROVAL', 'EXECUTING',
        'VERIFYING', 'RECEIPTED', 'SUCCEEDED', 'FAILED', 'BLOCKED',
        'CANCELED', 'QUARANTINED', 'INPUT_REQUIRED', 'AUTH_REQUIRED',
        'EFFECT_UNKNOWN', 'DEAD_LETTER'
    )),
    attempt integer not null check (attempt > 0),
    version bigint not null check (version > 0),
    blocker varchar(1024),
    result_receipt_id varchar(160),
    created_at timestamptz not null,
    updated_at timestamptz not null,
    check (updated_at >= created_at),
    constraint agent_runtime_runs_stage_attempt_key unique (task_id, stage_id, attempt),
    constraint agent_runtime_runs_task_run_key unique (task_id, run_id)
);

create index agent_runtime_runs_task_state_idx
    on public.agent_runtime_runs (task_id, state);
create index agent_runtime_runs_principal_state_idx
    on public.agent_runtime_runs (principal_id, state);

create table public.agent_runtime_task_events (
    event_id bigint generated always as identity primary key,
    task_id varchar(160) not null references public.agent_runtime_tasks(task_id)
        on delete restrict,
    run_id varchar(160) references public.agent_runtime_runs(run_id)
        on delete restrict,
    event_sequence bigint not null check (event_sequence > 0),
    from_state varchar(32) not null check (from_state in (
        'DRAFT', 'TRIAGED', 'PLANNED', 'QUEUED', 'LEASED', 'RUNNING',
        'CHECKING', 'GUARDED', 'WAITING_APPROVAL', 'EXECUTING',
        'VERIFYING', 'RECEIPTED', 'SUCCEEDED', 'FAILED', 'BLOCKED',
        'CANCELED', 'QUARANTINED', 'INPUT_REQUIRED', 'AUTH_REQUIRED',
        'EFFECT_UNKNOWN', 'DEAD_LETTER'
    )),
    to_state varchar(32) not null check (to_state in (
        'DRAFT', 'TRIAGED', 'PLANNED', 'QUEUED', 'LEASED', 'RUNNING',
        'CHECKING', 'GUARDED', 'WAITING_APPROVAL', 'EXECUTING',
        'VERIFYING', 'RECEIPTED', 'SUCCEEDED', 'FAILED', 'BLOCKED',
        'CANCELED', 'QUARANTINED', 'INPUT_REQUIRED', 'AUTH_REQUIRED',
        'EFFECT_UNKNOWN', 'DEAD_LETTER'
    )),
    entity_version bigint not null check (entity_version > 1),
    actor_principal_id varchar(256) not null check (btrim(actor_principal_id) <> ''),
    blocker varchar(1024),
    occurred_at timestamptz not null,
    constraint agent_runtime_task_events_sequence_key unique (task_id, event_sequence),
    constraint agent_runtime_task_events_task_run_fk
        foreign key (task_id, run_id)
        references public.agent_runtime_runs(task_id, run_id)
        on delete restrict,
    check (from_state <> to_state)
);

create index agent_runtime_task_events_task_time_idx
    on public.agent_runtime_task_events (task_id, event_sequence);
create index agent_runtime_task_events_run_idx
    on public.agent_runtime_task_events (run_id) where run_id is not null;

create table public.agent_runtime_stage_leases (
    lease_id varchar(160) primary key check (
        lease_id ~ '^LEASE-[A-Za-z0-9._-]+$'
    ),
    task_id varchar(160) not null references public.agent_runtime_tasks(task_id)
        on delete restrict,
    run_id varchar(160) not null references public.agent_runtime_runs(run_id)
        on delete restrict,
    role_id smallint not null check (role_id between 1 and 47),
    principal_id varchar(256) not null check (btrim(principal_id) <> ''),
    repository_path varchar(2048) not null check (
        repository_path like '/%'
        and repository_path <> '/'
        and right(repository_path, 1) <> '/'
    ),
    worktree_id varchar(256) not null check (btrim(worktree_id) <> ''),
    paths text[] not null check (cardinality(paths) > 0),
    resources text[] not null default '{}',
    source_write boolean not null,
    nonce_digest varchar(64) not null unique check (
        nonce_digest ~ '^[0-9a-f]{64}$'
    ),
    state varchar(16) not null check (state in (
        'ACTIVE', 'EXPIRED', 'REVOKED', 'RELEASED'
    )),
    issued_at timestamptz not null,
    heartbeat_due_at timestamptz not null,
    expires_at timestamptz not null,
    version bigint not null check (version > 0),
    check (heartbeat_due_at > issued_at and expires_at >= heartbeat_due_at),
    check (not source_write or role_id between 37 and 41),
    constraint agent_runtime_stage_leases_task_run_fk
        foreign key (task_id, run_id)
        references public.agent_runtime_runs(task_id, run_id)
        on delete restrict
);

create index agent_runtime_stage_leases_run_idx
    on public.agent_runtime_stage_leases (run_id);
create index agent_runtime_stage_leases_active_expiry_idx
    on public.agent_runtime_stage_leases (heartbeat_due_at, expires_at)
    where state = 'ACTIVE';
create unique index agent_runtime_stage_leases_active_run_key
    on public.agent_runtime_stage_leases (run_id) where state = 'ACTIVE';
create unique index agent_runtime_stage_leases_active_writer_key
    on public.agent_runtime_stage_leases (repository_path, worktree_id)
    where state = 'ACTIVE' and source_write;

create table public.agent_runtime_action_tickets (
    ticket_id varchar(160) primary key check (
        ticket_id ~ '^TKT-[A-Za-z0-9._-]+$'
    ),
    task_id varchar(160) not null references public.agent_runtime_tasks(task_id)
        on delete restrict,
    run_id varchar(160) references public.agent_runtime_runs(run_id)
        on delete restrict,
    action_class varchar(1) not null check (action_class in ('C', 'D')),
    target varchar(2048) not null check (btrim(target) <> ''),
    commit_sha varchar(40) not null check (commit_sha ~ '^[0-9a-f]{40}$'),
    plan_hash varchar(64) not null check (plan_hash ~ '^[0-9a-f]{64}$'),
    scope_hash varchar(64) not null check (scope_hash ~ '^[0-9a-f]{64}$'),
    action_digest varchar(64) not null check (action_digest ~ '^[0-9a-f]{64}$'),
    data_class varchar(32) not null check (data_class in (
        'PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'
    )),
    limits jsonb not null check (jsonb_typeof(limits) = 'object'),
    rollback_ref varchar(2048) not null check (btrim(rollback_ref) <> ''),
    verification_ref varchar(2048) not null check (btrim(verification_ref) <> ''),
    requester_principal_id varchar(256) not null check (btrim(requester_principal_id) <> ''),
    state varchar(24) not null check (state in (
        'PENDING', 'APPROVED', 'DENIED', 'CONSUMED', 'EXPIRED', 'CANCELED'
    )),
    expires_at timestamptz not null,
    version bigint not null check (version > 0),
    created_at timestamptz not null,
    updated_at timestamptz not null,
    check (expires_at > created_at and updated_at >= created_at),
    constraint agent_runtime_action_tickets_task_run_fk
        foreign key (task_id, run_id)
        references public.agent_runtime_runs(task_id, run_id)
        on delete restrict
);

create index agent_runtime_action_tickets_task_state_idx
    on public.agent_runtime_action_tickets (task_id, state);
create index agent_runtime_action_tickets_expiry_idx
    on public.agent_runtime_action_tickets (state, expires_at);
create index agent_runtime_action_tickets_run_idx
    on public.agent_runtime_action_tickets (run_id) where run_id is not null;

create table public.agent_runtime_approval_grants (
    grant_id varchar(160) primary key check (
        grant_id ~ '^GRANT-[A-Za-z0-9._-]+$'
    ),
    ticket_id varchar(160) not null unique references public.agent_runtime_action_tickets(ticket_id)
        on delete restrict,
    approver_principal_id varchar(256) not null check (btrim(approver_principal_id) <> ''),
    approval_assertion_digest varchar(64) not null check (
        approval_assertion_digest ~ '^[0-9a-f]{64}$'
    ),
    nonce_digest varchar(64) not null unique check (nonce_digest ~ '^[0-9a-f]{64}$'),
    state varchar(16) not null check (state in (
        'ACTIVE', 'CONSUMED', 'EXPIRED', 'REVOKED'
    )),
    issued_at timestamptz not null,
    expires_at timestamptz not null,
    consumed_at timestamptz,
    version bigint not null check (version > 0),
    check (expires_at > issued_at),
    check (
        (state = 'CONSUMED' and consumed_at is not null)
        or (state <> 'CONSUMED' and consumed_at is null)
    )
);

create index agent_runtime_approval_grants_state_expiry_idx
    on public.agent_runtime_approval_grants (state, expires_at);

create table public.agent_runtime_outbox (
    outbox_id bigint generated always as identity primary key,
    task_id varchar(160) not null references public.agent_runtime_tasks(task_id)
        on delete restrict,
    run_id varchar(160) references public.agent_runtime_runs(run_id)
        on delete restrict,
    grant_id varchar(160) references public.agent_runtime_approval_grants(grant_id)
        on delete restrict,
    effect_key varchar(256) not null unique check (btrim(effect_key) <> ''),
    topic varchar(256) not null check (btrim(topic) <> ''),
    payload jsonb not null check (jsonb_typeof(payload) = 'object'),
    payload_digest varchar(64) not null check (payload_digest ~ '^[0-9a-f]{64}$'),
    state varchar(24) not null check (state in (
        'PENDING', 'CLAIMED', 'DELIVERED', 'FAILED', 'EFFECT_UNKNOWN', 'DEAD_LETTER'
    )),
    available_at timestamptz not null,
    claim_owner varchar(256),
    claim_expires_at timestamptz,
    attempt_count integer not null default 0 check (attempt_count >= 0),
    delivered_at timestamptz,
    error_code varchar(128),
    created_at timestamptz not null,
    constraint agent_runtime_outbox_task_run_fk
        foreign key (task_id, run_id)
        references public.agent_runtime_runs(task_id, run_id)
        on delete restrict
);

create index agent_runtime_outbox_ready_idx
    on public.agent_runtime_outbox (available_at, outbox_id)
    where state = 'PENDING';
create index agent_runtime_outbox_task_idx
    on public.agent_runtime_outbox (task_id);
create index agent_runtime_outbox_run_idx
    on public.agent_runtime_outbox (run_id) where run_id is not null;
create unique index agent_runtime_outbox_grant_effect_key
    on public.agent_runtime_outbox (grant_id) where grant_id is not null;

create table public.agent_runtime_inbox_dedupe (
    source_peer varchar(256) not null check (btrim(source_peer) <> ''),
    idempotency_key varchar(256) not null check (btrim(idempotency_key) <> ''),
    payload_digest varchar(64) not null check (payload_digest ~ '^[0-9a-f]{64}$'),
    task_id varchar(160) references public.agent_runtime_tasks(task_id)
        on delete restrict,
    run_id varchar(160) references public.agent_runtime_runs(run_id)
        on delete restrict,
    processed_at timestamptz not null,
    primary key (source_peer, idempotency_key),
    check (run_id is null or task_id is not null),
    constraint agent_runtime_inbox_dedupe_task_run_fk
        foreign key (task_id, run_id)
        references public.agent_runtime_runs(task_id, run_id)
        on delete restrict
);

create index agent_runtime_inbox_dedupe_task_idx
    on public.agent_runtime_inbox_dedupe (task_id) where task_id is not null;
create index agent_runtime_inbox_dedupe_run_idx
    on public.agent_runtime_inbox_dedupe (run_id) where run_id is not null;

create table public.agent_runtime_verification_runs (
    verification_id varchar(160) primary key check (btrim(verification_id) <> ''),
    task_id varchar(160) not null references public.agent_runtime_tasks(task_id)
        on delete restrict,
    maker_run_id varchar(160) not null references public.agent_runtime_runs(run_id)
        on delete restrict,
    checker_run_id varchar(160) not null references public.agent_runtime_runs(run_id)
        on delete restrict,
    attempt integer not null check (attempt > 0),
    state varchar(24) not null check (state in (
        'PENDING', 'RUNNING', 'PASSED', 'FAILED', 'BLOCKED', 'UNVERIFIED'
    )),
    verdict varchar(24),
    evidence_digest varchar(64) check (evidence_digest ~ '^[0-9a-f]{64}$'),
    version bigint not null check (version > 0),
    created_at timestamptz not null,
    updated_at timestamptz not null,
    check (maker_run_id <> checker_run_id and updated_at >= created_at),
    constraint agent_runtime_verification_runs_attempt_key unique (maker_run_id, attempt),
    constraint agent_runtime_verification_runs_maker_task_fk
        foreign key (task_id, maker_run_id)
        references public.agent_runtime_runs(task_id, run_id)
        on delete restrict,
    constraint agent_runtime_verification_runs_checker_task_fk
        foreign key (task_id, checker_run_id)
        references public.agent_runtime_runs(task_id, run_id)
        on delete restrict
);

create index agent_runtime_verification_runs_task_idx
    on public.agent_runtime_verification_runs (task_id);
create index agent_runtime_verification_runs_checker_idx
    on public.agent_runtime_verification_runs (checker_run_id);
create unique index agent_runtime_verification_runs_active_maker_key
    on public.agent_runtime_verification_runs (maker_run_id)
    where state in ('PENDING', 'RUNNING');

create table public.agent_runtime_receipts (
    receipt_id varchar(160) primary key check (
        receipt_id ~ '^RECEIPT-[A-Za-z0-9._-]+$'
    ),
    task_id varchar(160) not null references public.agent_runtime_tasks(task_id)
        on delete restrict,
    run_id varchar(160) not null unique references public.agent_runtime_runs(run_id)
        on delete restrict,
    role_id smallint not null check (role_id between 1 and 47),
    principal_id varchar(256) not null check (btrim(principal_id) <> ''),
    commit_sha varchar(40) not null check (commit_sha ~ '^[0-9a-f]{40}$'),
    plan_hash varchar(64) not null check (plan_hash ~ '^[0-9a-f]{64}$'),
    scope_hash varchar(64) not null check (scope_hash ~ '^[0-9a-f]{64}$'),
    action_digest varchar(64) not null check (action_digest ~ '^[0-9a-f]{64}$'),
    result varchar(24) not null check (result in (
        'PASS', 'FAIL', 'BLOCKED', 'UNVERIFIED', 'CANCELED', 'EFFECT_UNKNOWN'
    )),
    artifact_digests text[] not null default '{}',
    verification_receipt_id varchar(160),
    started_at timestamptz not null,
    ended_at timestamptz not null,
    chain_sequence bigint not null check (chain_sequence > 0),
    previous_receipt_hash varchar(64),
    receipt_hash varchar(64) not null unique check (receipt_hash ~ '^[0-9a-f]{64}$'),
    check (ended_at >= started_at),
    check (
        verification_receipt_id is null
        or verification_receipt_id <> receipt_id
    ),
    check (previous_receipt_hash is null or previous_receipt_hash ~ '^[0-9a-f]{64}$'),
    check (
        (chain_sequence = 1 and previous_receipt_hash is null)
        or (chain_sequence > 1 and previous_receipt_hash is not null)
    ),
    constraint agent_runtime_receipts_task_sequence_key unique (task_id, chain_sequence),
    constraint agent_runtime_receipts_task_hash_key unique (task_id, receipt_hash),
    constraint agent_runtime_receipts_task_receipt_key unique (task_id, receipt_id),
    constraint agent_runtime_receipts_receipt_run_key unique (receipt_id, run_id),
    constraint agent_runtime_receipts_task_run_fk
        foreign key (task_id, run_id)
        references public.agent_runtime_runs(task_id, run_id)
        on delete restrict,
    constraint agent_runtime_receipts_task_predecessor_fk
        foreign key (task_id, previous_receipt_hash)
        references public.agent_runtime_receipts(task_id, receipt_hash)
        on delete restrict,
    -- Immediate same-task FK intentionally requires the checker receipt first.
    constraint agent_runtime_receipts_verification_fk
        foreign key (task_id, verification_receipt_id)
        references public.agent_runtime_receipts(task_id, receipt_id)
        on delete restrict
);

create unique index agent_runtime_receipts_task_root_key
    on public.agent_runtime_receipts (task_id) where previous_receipt_hash is null;
create unique index agent_runtime_receipts_task_successor_key
    on public.agent_runtime_receipts (task_id, previous_receipt_hash)
    where previous_receipt_hash is not null;
create index agent_runtime_receipts_verification_idx
    on public.agent_runtime_receipts (verification_receipt_id)
    where verification_receipt_id is not null;

alter table public.agent_runtime_runs
    add constraint agent_runtime_runs_result_receipt_fk
    foreign key (result_receipt_id, run_id)
    references public.agent_runtime_receipts(receipt_id, run_id)
    on delete restrict;

create table public.agent_runtime_model_catalog (
    catalog_id bigint generated always as identity primary key,
    provider varchar(128) not null check (btrim(provider) <> ''),
    model varchar(256) not null check (btrim(model) <> ''),
    revision varchar(256) not null check (btrim(revision) <> ''),
    capabilities jsonb not null check (jsonb_typeof(capabilities) = 'object'),
    data_policy jsonb not null check (jsonb_typeof(data_policy) = 'object'),
    egress_policy jsonb not null check (jsonb_typeof(egress_policy) = 'object'),
    input_cost_per_million numeric(20, 8) check (input_cost_per_million >= 0),
    output_cost_per_million numeric(20, 8) check (output_cost_per_million >= 0),
    observed_at timestamptz not null,
    verified_at timestamptz,
    expires_at timestamptz not null,
    evidence_receipt_id varchar(160) references public.agent_runtime_receipts(receipt_id)
        on delete restrict,
    state varchar(16) not null check (state in ('OBSERVED', 'ELIGIBLE', 'INELIGIBLE', 'EXPIRED')),
    version bigint not null check (version > 0),
    constraint agent_runtime_model_catalog_revision_key unique (provider, model, revision),
    check (expires_at > observed_at)
);

create index agent_runtime_model_catalog_eligibility_idx
    on public.agent_runtime_model_catalog (provider, model, state, expires_at desc);
create index agent_runtime_model_catalog_receipt_idx
    on public.agent_runtime_model_catalog (evidence_receipt_id)
    where evidence_receipt_id is not null;

create table public.agent_runtime_a2a_peers (
    peer_id varchar(256) primary key check (btrim(peer_id) <> ''),
    card_digest varchar(64) not null check (card_digest ~ '^[0-9a-f]{64}$'),
    protocol_version varchar(64) not null check (btrim(protocol_version) <> ''),
    endpoint varchar(2048) not null check (btrim(endpoint) <> ''),
    capabilities jsonb not null check (jsonb_typeof(capabilities) = 'object'),
    trust_state varchar(24) not null check (trust_state in (
        'UNVERIFIED', 'VERIFIED', 'QUARANTINED', 'REVOKED', 'EXPIRED'
    )),
    observed_at timestamptz not null,
    verified_at timestamptz,
    expires_at timestamptz not null,
    evidence_receipt_id varchar(160) references public.agent_runtime_receipts(receipt_id)
        on delete restrict,
    version bigint not null check (version > 0),
    check (expires_at > observed_at)
);

create index agent_runtime_a2a_peers_trust_expiry_idx
    on public.agent_runtime_a2a_peers (trust_state, expires_at);
create index agent_runtime_a2a_peers_receipt_idx
    on public.agent_runtime_a2a_peers (evidence_receipt_id)
    where evidence_receipt_id is not null;

create table public.agent_runtime_artifacts (
    artifact_id varchar(160) primary key check (btrim(artifact_id) <> ''),
    task_id varchar(160) not null references public.agent_runtime_tasks(task_id)
        on delete restrict,
    run_id varchar(160) references public.agent_runtime_runs(run_id)
        on delete restrict,
    kind varchar(128) not null check (btrim(kind) <> ''),
    sha256_digest varchar(64) not null check (sha256_digest ~ '^[0-9a-f]{64}$'),
    size_bytes bigint not null check (size_bytes >= 0),
    media_type varchar(256) not null check (btrim(media_type) <> ''),
    data_class varchar(32) not null check (data_class in (
        'PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'
    )),
    storage_ref varchar(2048) not null check (btrim(storage_ref) <> ''),
    creator_principal_id varchar(256) not null check (btrim(creator_principal_id) <> ''),
    created_at timestamptz not null,
    constraint agent_runtime_artifacts_storage_key unique (storage_ref),
    constraint agent_runtime_artifacts_task_run_fk
        foreign key (task_id, run_id)
        references public.agent_runtime_runs(task_id, run_id)
        on delete restrict
);

create index agent_runtime_artifacts_task_idx
    on public.agent_runtime_artifacts (task_id, created_at);
create index agent_runtime_artifacts_run_idx
    on public.agent_runtime_artifacts (run_id) where run_id is not null;
create index agent_runtime_artifacts_digest_idx
    on public.agent_runtime_artifacts (sha256_digest);

create function public.reject_agent_runtime_append_only_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    raise exception '% is append-only', tg_table_name using errcode = '55000';
end;
$$;

create trigger agent_runtime_task_events_append_only_rows
before update or delete on public.agent_runtime_task_events
for each row execute function public.reject_agent_runtime_append_only_mutation();
create trigger agent_runtime_task_events_append_only_truncate
before truncate on public.agent_runtime_task_events
for each statement execute function public.reject_agent_runtime_append_only_mutation();

create trigger agent_runtime_receipts_append_only_rows
before update or delete on public.agent_runtime_receipts
for each row execute function public.reject_agent_runtime_append_only_mutation();
create trigger agent_runtime_receipts_append_only_truncate
before truncate on public.agent_runtime_receipts
for each statement execute function public.reject_agent_runtime_append_only_mutation();

create trigger agent_runtime_inbox_dedupe_append_only_rows
before update or delete on public.agent_runtime_inbox_dedupe
for each row execute function public.reject_agent_runtime_append_only_mutation();
create trigger agent_runtime_inbox_dedupe_append_only_truncate
before truncate on public.agent_runtime_inbox_dedupe
for each statement execute function public.reject_agent_runtime_append_only_mutation();

create trigger agent_runtime_artifacts_append_only_rows
before update or delete on public.agent_runtime_artifacts
for each row execute function public.reject_agent_runtime_append_only_mutation();
create trigger agent_runtime_artifacts_append_only_truncate
before truncate on public.agent_runtime_artifacts
for each statement execute function public.reject_agent_runtime_append_only_mutation();

-- Server-only boundary. No public policies are created. FORCE makes table-owner
-- access fail closed too; production must use an explicitly privileged server role.
alter table public.agent_runtime_tasks enable row level security;
alter table public.agent_runtime_tasks force row level security;
alter table public.agent_runtime_task_events enable row level security;
alter table public.agent_runtime_task_events force row level security;
alter table public.agent_runtime_runs enable row level security;
alter table public.agent_runtime_runs force row level security;
alter table public.agent_runtime_stage_leases enable row level security;
alter table public.agent_runtime_stage_leases force row level security;
alter table public.agent_runtime_action_tickets enable row level security;
alter table public.agent_runtime_action_tickets force row level security;
alter table public.agent_runtime_approval_grants enable row level security;
alter table public.agent_runtime_approval_grants force row level security;
alter table public.agent_runtime_outbox enable row level security;
alter table public.agent_runtime_outbox force row level security;
alter table public.agent_runtime_inbox_dedupe enable row level security;
alter table public.agent_runtime_inbox_dedupe force row level security;
alter table public.agent_runtime_verification_runs enable row level security;
alter table public.agent_runtime_verification_runs force row level security;
alter table public.agent_runtime_receipts enable row level security;
alter table public.agent_runtime_receipts force row level security;
alter table public.agent_runtime_model_catalog enable row level security;
alter table public.agent_runtime_model_catalog force row level security;
alter table public.agent_runtime_a2a_peers enable row level security;
alter table public.agent_runtime_a2a_peers force row level security;
alter table public.agent_runtime_artifacts enable row level security;
alter table public.agent_runtime_artifacts force row level security;

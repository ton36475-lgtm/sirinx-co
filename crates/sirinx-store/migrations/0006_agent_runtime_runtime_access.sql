-- P2.1 least-privilege runtime authority. Role provisioning is deliberately
-- outside the migration path: operators must create both NOLOGIN group roles
-- under a separately ticketed bootstrap action before this migration runs.

set local search_path = pg_catalog;

do $agent_runtime_roles$
declare
    owner_role pg_roles%rowtype;
    app_role pg_roles%rowtype;
begin
    select * into owner_role
    from pg_roles
    where rolname = 'sirinx_agent_runtime_owner';
    if not found then
        raise exception 'required NOLOGIN role sirinx_agent_runtime_owner is absent'
            using errcode = '28000';
    end if;

    select * into app_role
    from pg_roles
    where rolname = 'sirinx_agent_runtime_app';
    if not found then
        raise exception 'required NOLOGIN role sirinx_agent_runtime_app is absent'
            using errcode = '28000';
    end if;

    if owner_role.rolcanlogin or app_role.rolcanlogin then
        raise exception 'agent-runtime owner and app roles must both be NOLOGIN'
            using errcode = '28000';
    end if;

    if owner_role.rolinherit or not app_role.rolinherit then
        raise exception 'agent-runtime owner must be NOINHERIT and app must be INHERIT'
            using errcode = '28000';
    end if;

    if owner_role.rolsuper
        or owner_role.rolcreatedb
        or owner_role.rolcreaterole
        or owner_role.rolreplication
        or owner_role.rolbypassrls
        or app_role.rolsuper
        or app_role.rolcreatedb
        or app_role.rolcreaterole
        or app_role.rolreplication
        or app_role.rolbypassrls
    then
        raise exception 'agent-runtime group roles must not carry elevated attributes'
            using errcode = '28000';
    end if;

    if exists (
        select 1 from pg_auth_members membership
        where membership.member in (owner_role.oid, app_role.oid)
    ) then
        raise exception 'agent-runtime owner and app roles must not inherit any role'
            using errcode = '28000';
    end if;
end
$agent_runtime_roles$;

-- Remove ambient and prior runtime grants before adding the exact capability
-- matrix below. The eight groundwork tables intentionally stay inaccessible.
revoke all privileges on table public.agent_runtime_tasks from public;
revoke all privileges on table public.agent_runtime_task_events from public;
revoke all privileges on table public.agent_runtime_runs from public;
revoke all privileges on table public.agent_runtime_stage_leases from public;
revoke all privileges on table public.agent_runtime_action_tickets from public;
revoke all privileges on table public.agent_runtime_approval_grants from public;
revoke all privileges on table public.agent_runtime_outbox from public;
revoke all privileges on table public.agent_runtime_inbox_dedupe from public;
revoke all privileges on table public.agent_runtime_verification_runs from public;
revoke all privileges on table public.agent_runtime_receipts from public;
revoke all privileges on table public.agent_runtime_model_catalog from public;
revoke all privileges on table public.agent_runtime_a2a_peers from public;
revoke all privileges on table public.agent_runtime_artifacts from public;

revoke all privileges on table public.agent_runtime_tasks
    from sirinx_agent_runtime_app;
revoke all privileges on table public.agent_runtime_task_events
    from sirinx_agent_runtime_app;
revoke all privileges on table public.agent_runtime_runs
    from sirinx_agent_runtime_app;
revoke all privileges on table public.agent_runtime_stage_leases
    from sirinx_agent_runtime_app;
revoke all privileges on table public.agent_runtime_action_tickets
    from sirinx_agent_runtime_app;
revoke all privileges on table public.agent_runtime_approval_grants
    from sirinx_agent_runtime_app;
revoke all privileges on table public.agent_runtime_outbox
    from sirinx_agent_runtime_app;
revoke all privileges on table public.agent_runtime_inbox_dedupe
    from sirinx_agent_runtime_app;
revoke all privileges on table public.agent_runtime_verification_runs
    from sirinx_agent_runtime_app;
revoke all privileges on table public.agent_runtime_receipts
    from sirinx_agent_runtime_app;
revoke all privileges on table public.agent_runtime_model_catalog
    from sirinx_agent_runtime_app;
revoke all privileges on table public.agent_runtime_a2a_peers
    from sirinx_agent_runtime_app;
revoke all privileges on table public.agent_runtime_artifacts
    from sirinx_agent_runtime_app;

-- Table-level REVOKE does not remove grants recorded directly on columns.
-- Clear those ACLs for both runtime principals before granting the reviewed
-- column matrix. Identifiers come only from the fixed list and pg_catalog.
do $agent_runtime_column_acl$
declare
    runtime_table text;
    runtime_columns text;
begin
    foreach runtime_table in array array[
        'agent_runtime_tasks',
        'agent_runtime_task_events',
        'agent_runtime_runs',
        'agent_runtime_stage_leases',
        'agent_runtime_action_tickets',
        'agent_runtime_approval_grants',
        'agent_runtime_outbox',
        'agent_runtime_inbox_dedupe',
        'agent_runtime_verification_runs',
        'agent_runtime_receipts',
        'agent_runtime_model_catalog',
        'agent_runtime_a2a_peers',
        'agent_runtime_artifacts'
    ]
    loop
        select string_agg(format('%I', attribute.attname), ', ' order by attribute.attnum)
        into strict runtime_columns
        from pg_attribute attribute
        join pg_class relation on relation.oid = attribute.attrelid
        join pg_namespace namespace on namespace.oid = relation.relnamespace
        where namespace.nspname = 'public'
          and relation.relname = runtime_table
          and attribute.attnum > 0
          and not attribute.attisdropped;

        execute format(
            'revoke all privileges (%s) on table public.%I from public',
            runtime_columns,
            runtime_table
        );
        execute format(
            'revoke all privileges (%s) on table public.%I from sirinx_agent_runtime_app',
            runtime_columns,
            runtime_table
        );
    end loop;
end
$agent_runtime_column_acl$;

revoke create on schema public from public;
revoke create on schema public from sirinx_agent_runtime_app;
grant usage on schema public to sirinx_agent_runtime_app;

revoke all privileges on sequence public.agent_runtime_task_events_event_id_seq
    from public;
revoke all privileges on sequence public.agent_runtime_task_events_event_id_seq
    from sirinx_agent_runtime_app;
revoke all privileges on sequence public.agent_runtime_outbox_outbox_id_seq
    from public;
revoke all privileges on sequence public.agent_runtime_outbox_outbox_id_seq
    from sirinx_agent_runtime_app;
revoke all privileges on sequence public.agent_runtime_model_catalog_catalog_id_seq
    from public;
revoke all privileges on sequence public.agent_runtime_model_catalog_catalog_id_seq
    from sirinx_agent_runtime_app;
grant usage on sequence public.agent_runtime_task_events_event_id_seq
    to sirinx_agent_runtime_app;

-- Every read is column-scoped so startup attestation can reject accidental
-- table-wide grants as well as access to new columns added by later migrations.
grant select (
    task_id, envelope, idempotency_key, state, version, created_at, updated_at
) on table public.agent_runtime_tasks to sirinx_agent_runtime_app;
grant insert (
    task_id, envelope, idempotency_key, state, version, created_at, updated_at
) on table public.agent_runtime_tasks to sirinx_agent_runtime_app;
grant update (state, version, updated_at)
    on table public.agent_runtime_tasks to sirinx_agent_runtime_app;

grant select (
    task_id, run_id, event_sequence, from_state, to_state,
    entity_version, actor_principal_id, blocker, occurred_at
) on table public.agent_runtime_task_events to sirinx_agent_runtime_app;
grant insert (
    task_id, run_id, event_sequence, from_state, to_state,
    entity_version, actor_principal_id, blocker, occurred_at
) on table public.agent_runtime_task_events to sirinx_agent_runtime_app;

grant select (
    run_id, task_id, stage_id, role_id, principal_id, action_class, state,
    attempt, version, blocker, result_receipt_id, created_at, updated_at
) on table public.agent_runtime_runs to sirinx_agent_runtime_app;
grant insert (
    run_id, task_id, stage_id, role_id, principal_id, action_class, state,
    attempt, version, blocker, result_receipt_id, created_at, updated_at
) on table public.agent_runtime_runs to sirinx_agent_runtime_app;
grant update (state, version, blocker, result_receipt_id, updated_at)
    on table public.agent_runtime_runs to sirinx_agent_runtime_app;

grant select (
    lease_id, task_id, run_id, role_id, principal_id, repository_path,
    worktree_id, paths, resources, source_write, nonce_digest, state,
    issued_at, heartbeat_due_at, expires_at, version
) on table public.agent_runtime_stage_leases to sirinx_agent_runtime_app;
grant insert (
    lease_id, task_id, run_id, role_id, principal_id, repository_path,
    worktree_id, paths, resources, source_write, nonce_digest, state,
    issued_at, heartbeat_due_at, expires_at, version
) on table public.agent_runtime_stage_leases to sirinx_agent_runtime_app;
grant update (state, version, heartbeat_due_at, expires_at)
    on table public.agent_runtime_stage_leases to sirinx_agent_runtime_app;

grant select (
    receipt_id, task_id, run_id, role_id, principal_id, commit_sha, plan_hash,
    scope_hash, action_digest, result, artifact_digests,
    verification_receipt_id, started_at, ended_at, chain_sequence,
    previous_receipt_hash, receipt_hash
) on table public.agent_runtime_receipts to sirinx_agent_runtime_app;
grant insert (
    receipt_id, task_id, run_id, role_id, principal_id, commit_sha, plan_hash,
    scope_hash, action_digest, result, artifact_digests,
    verification_receipt_id, started_at, ended_at, chain_sequence,
    previous_receipt_hash, receipt_hash
) on table public.agent_runtime_receipts to sirinx_agent_runtime_app;

-- Policies are command-specific and permissive only for the capability group.
-- FORCE RLS remains enabled on every table from migration 0005.
create policy agent_runtime_tasks_app_select
    on public.agent_runtime_tasks as permissive for select
    to sirinx_agent_runtime_app using (true);
create policy agent_runtime_tasks_app_insert
    on public.agent_runtime_tasks as permissive for insert
    to sirinx_agent_runtime_app with check (true);
create policy agent_runtime_tasks_app_update
    on public.agent_runtime_tasks as permissive for update
    to sirinx_agent_runtime_app using (true) with check (true);

create policy agent_runtime_task_events_app_select
    on public.agent_runtime_task_events as permissive for select
    to sirinx_agent_runtime_app using (true);
create policy agent_runtime_task_events_app_insert
    on public.agent_runtime_task_events as permissive for insert
    to sirinx_agent_runtime_app with check (true);

create policy agent_runtime_runs_app_select
    on public.agent_runtime_runs as permissive for select
    to sirinx_agent_runtime_app using (true);
create policy agent_runtime_runs_app_insert
    on public.agent_runtime_runs as permissive for insert
    to sirinx_agent_runtime_app with check (true);
create policy agent_runtime_runs_app_update
    on public.agent_runtime_runs as permissive for update
    to sirinx_agent_runtime_app using (true) with check (true);

create policy agent_runtime_stage_leases_app_select
    on public.agent_runtime_stage_leases as permissive for select
    to sirinx_agent_runtime_app using (true);
create policy agent_runtime_stage_leases_app_insert
    on public.agent_runtime_stage_leases as permissive for insert
    to sirinx_agent_runtime_app with check (true);
create policy agent_runtime_stage_leases_app_update
    on public.agent_runtime_stage_leases as permissive for update
    to sirinx_agent_runtime_app using (true) with check (true);

create policy agent_runtime_receipts_app_select
    on public.agent_runtime_receipts as permissive for select
    to sirinx_agent_runtime_app using (true);
create policy agent_runtime_receipts_app_insert
    on public.agent_runtime_receipts as permissive for insert
    to sirinx_agent_runtime_app with check (true);

-- Harden the append-only trigger function itself. Trigger bindings retain the
-- function OID, so runtime callers need no EXECUTE privilege on this function.
alter function public.reject_agent_runtime_append_only_mutation()
    set search_path = pg_catalog;
revoke all privileges on function public.reject_agent_runtime_append_only_mutation()
    from public;
revoke all privileges on function public.reject_agent_runtime_append_only_mutation()
    from sirinx_agent_runtime_app;

-- Supabase may carry explicit or default ACLs for its API roles. Remove all
-- table/column/sequence/function capabilities when those roles exist, then
-- prove that inherited grants did not leave an effective path. The dynamic
-- form keeps the same migration usable on self-hosted Postgres where these
-- roles are absent.
do $agent_runtime_external_acl$
declare
    external_role text;
    runtime_table text;
    runtime_columns text;
    runtime_relation oid;
    runtime_attribute record;
    runtime_sequence text;
begin
    foreach external_role in array array['anon', 'authenticated', 'service_role']
    loop
        if not exists (
            select 1 from pg_roles where rolname = external_role
        ) then
            continue;
        end if;

        foreach runtime_table in array array[
            'agent_runtime_tasks',
            'agent_runtime_task_events',
            'agent_runtime_runs',
            'agent_runtime_stage_leases',
            'agent_runtime_action_tickets',
            'agent_runtime_approval_grants',
            'agent_runtime_outbox',
            'agent_runtime_inbox_dedupe',
            'agent_runtime_verification_runs',
            'agent_runtime_receipts',
            'agent_runtime_model_catalog',
            'agent_runtime_a2a_peers',
            'agent_runtime_artifacts'
        ]
        loop
            select relation.oid,
                   string_agg(
                       format('%I', attribute.attname),
                       ', ' order by attribute.attnum
                   )
            into strict runtime_relation, runtime_columns
            from pg_attribute attribute
            join pg_class relation on relation.oid = attribute.attrelid
            join pg_namespace namespace on namespace.oid = relation.relnamespace
            where namespace.nspname = 'public'
              and relation.relname = runtime_table
              and attribute.attnum > 0
              and not attribute.attisdropped
            group by relation.oid;

            execute format(
                'revoke all privileges on table public.%I from %I',
                runtime_table,
                external_role
            );
            execute format(
                'revoke all privileges (%s) on table public.%I from %I',
                runtime_columns,
                runtime_table,
                external_role
            );

            if has_table_privilege(external_role, runtime_relation, 'SELECT')
                or has_table_privilege(external_role, runtime_relation, 'INSERT')
                or has_table_privilege(external_role, runtime_relation, 'UPDATE')
                or has_table_privilege(external_role, runtime_relation, 'DELETE')
                or has_table_privilege(external_role, runtime_relation, 'TRUNCATE')
                or has_table_privilege(external_role, runtime_relation, 'REFERENCES')
                or has_table_privilege(external_role, runtime_relation, 'TRIGGER')
            then
                raise exception '% retains effective table privilege on public.%',
                    external_role, runtime_table using errcode = '42501';
            end if;

            for runtime_attribute in
                select attribute.attnum
                from pg_attribute attribute
                where attribute.attrelid = runtime_relation
                  and attribute.attnum > 0
                  and not attribute.attisdropped
            loop
                if has_column_privilege(
                    external_role, runtime_relation, runtime_attribute.attnum, 'SELECT'
                ) or has_column_privilege(
                    external_role, runtime_relation, runtime_attribute.attnum, 'INSERT'
                ) or has_column_privilege(
                    external_role, runtime_relation, runtime_attribute.attnum, 'UPDATE'
                ) or has_column_privilege(
                    external_role, runtime_relation, runtime_attribute.attnum, 'REFERENCES'
                ) then
                    raise exception '% retains effective column privilege on public.%',
                        external_role, runtime_table using errcode = '42501';
                end if;
            end loop;
        end loop;

        foreach runtime_sequence in array array[
            'agent_runtime_task_events_event_id_seq',
            'agent_runtime_outbox_outbox_id_seq',
            'agent_runtime_model_catalog_catalog_id_seq'
        ]
        loop
            execute format(
                'revoke all privileges on sequence public.%I from %I',
                runtime_sequence,
                external_role
            );

            if has_sequence_privilege(
                external_role, format('public.%I', runtime_sequence), 'USAGE'
            ) or has_sequence_privilege(
                external_role, format('public.%I', runtime_sequence), 'SELECT'
            ) or has_sequence_privilege(
                external_role, format('public.%I', runtime_sequence), 'UPDATE'
            ) then
                raise exception '% retains effective privilege on sequence public.%',
                    external_role, runtime_sequence using errcode = '42501';
            end if;
        end loop;

        execute format(
            'revoke all privileges on function public.reject_agent_runtime_append_only_mutation() from %I',
            external_role
        );

        if has_function_privilege(
            external_role,
            'public.reject_agent_runtime_append_only_mutation()',
            'EXECUTE'
        ) then
            raise exception '% retains effective runtime sequence/function privilege',
                external_role using errcode = '42501';
        end if;
    end loop;
end
$agent_runtime_external_acl$;

-- Ownership is isolated from both the migration login and runtime capability
-- role. No LOGIN role or credential is created in this migration.
alter table public.agent_runtime_tasks owner to sirinx_agent_runtime_owner;
alter table public.agent_runtime_task_events owner to sirinx_agent_runtime_owner;
alter table public.agent_runtime_runs owner to sirinx_agent_runtime_owner;
alter table public.agent_runtime_stage_leases owner to sirinx_agent_runtime_owner;
alter table public.agent_runtime_action_tickets owner to sirinx_agent_runtime_owner;
alter table public.agent_runtime_approval_grants owner to sirinx_agent_runtime_owner;
alter table public.agent_runtime_outbox owner to sirinx_agent_runtime_owner;
alter table public.agent_runtime_inbox_dedupe owner to sirinx_agent_runtime_owner;
alter table public.agent_runtime_verification_runs owner to sirinx_agent_runtime_owner;
alter table public.agent_runtime_receipts owner to sirinx_agent_runtime_owner;
alter table public.agent_runtime_model_catalog owner to sirinx_agent_runtime_owner;
alter table public.agent_runtime_a2a_peers owner to sirinx_agent_runtime_owner;
alter table public.agent_runtime_artifacts owner to sirinx_agent_runtime_owner;
alter sequence public.agent_runtime_task_events_event_id_seq
    owner to sirinx_agent_runtime_owner;
alter sequence public.agent_runtime_outbox_outbox_id_seq
    owner to sirinx_agent_runtime_owner;
alter sequence public.agent_runtime_model_catalog_catalog_id_seq
    owner to sirinx_agent_runtime_owner;
alter function public.reject_agent_runtime_append_only_mutation()
    owner to sirinx_agent_runtime_owner;

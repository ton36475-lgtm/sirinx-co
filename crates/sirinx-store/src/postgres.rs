use async_trait::async_trait;
use serde::de::DeserializeOwned;
use sqlx::postgres::{PgConnection, PgPool, PgPoolOptions};
use sqlx::{Connection, Row};
use uuid::Uuid;

use sirinx_core::{
    bounded_recovery_tool_name, AnalyticsEvent, FailureEvent, Gate, Lead, LeadStatus, Lesson,
    PendingWork,
};

use crate::{AgentRuntimeStoreError, Store, StoreError};

/// Supabase / Postgres backend.
///
/// Connect with the Supabase connection string (use the pooler URL in
/// production), e.g.
/// `postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres`.
pub struct PostgresStore {
    pool: PgPool,
}

/// Dedicated, non-migrating Postgres authority for the durable agent runtime.
///
/// Construction fails closed unless the connected login satisfies the complete
/// P2.1 role, ownership, RLS, policy, and grant attestation. Keeping this pool
/// separate prevents the legacy migration-capable [`PostgresStore`] from being
/// passed into the runtime persistence seam.
pub struct AgentRuntimePostgresStore {
    pool: PgPool,
}

impl PostgresStore {
    /// Open the legacy web/control pool without running migrations.
    ///
    /// Schema changes are a separately ticketed operation through
    /// [`migrate_postgres_once`]. Application startup must never hold DDL
    /// authority or count as migration evidence.
    pub async fn connect(database_url: &str) -> Result<Self, StoreError> {
        let pool = PgPoolOptions::new()
            .max_connections(8)
            .connect(database_url)
            .await?;
        Ok(Self { pool })
    }

    pub fn pool(&self) -> &PgPool {
        &self.pool
    }
}

/// Apply the embedded migration set over one explicit administrative
/// connection, then disconnect. Runtime constructors never call this path.
pub async fn migrate_postgres_once(database_url: &str) -> Result<(), StoreError> {
    let mut connection = PgConnection::connect(database_url).await?;
    sqlx::migrate!("./migrations")
        .run(&mut connection)
        .await
        .map_err(|err| StoreError::Backend(err.to_string()))
}

impl AgentRuntimePostgresStore {
    /// Open a runtime-only pool without running migrations.
    ///
    /// Each physical connection is forced to `row_security = on`, and the
    /// pool is returned only after the connected login passes admission.
    pub async fn connect_runtime(database_url: &str) -> Result<Self, AgentRuntimeStoreError> {
        let pool = PgPoolOptions::new()
            .max_connections(8)
            .after_connect(|connection, _metadata| {
                Box::pin(async move {
                    sqlx::query("set row_security = on")
                        .execute(connection)
                        .await?;
                    Ok(())
                })
            })
            .connect(database_url)
            .await
            .map_err(runtime_backend)?;
        let store = Self { pool };
        if let Err(error) = store.attest_runtime().await {
            store.pool.close().await;
            return Err(error);
        }
        Ok(store)
    }

    /// Re-run the same fail-closed admission checks used at construction.
    pub async fn attest_runtime(&self) -> Result<(), AgentRuntimeStoreError> {
        let mut connection = self.pool.acquire().await.map_err(runtime_backend)?;
        attest_runtime_connection(&mut connection).await
    }

    pub(crate) fn pool(&self) -> &PgPool {
        &self.pool
    }
}

fn runtime_backend(error: impl ToString) -> AgentRuntimeStoreError {
    AgentRuntimeStoreError::Backend(error.to_string())
}

fn runtime_admission_failure(reason: &'static str) -> AgentRuntimeStoreError {
    AgentRuntimeStoreError::Backend(format!("agent-runtime Postgres admission failed: {reason}"))
}

async fn require_admission_query(
    connection: &mut PgConnection,
    query: &'static str,
    reason: &'static str,
) -> Result<(), AgentRuntimeStoreError> {
    let row = sqlx::query(query)
        .fetch_one(connection)
        .await
        .map_err(runtime_backend)?;
    if row
        .try_get::<bool, _>("admitted")
        .map_err(runtime_backend)?
    {
        Ok(())
    } else {
        Err(runtime_admission_failure(reason))
    }
}

async fn attest_runtime_connection(
    connection: &mut PgConnection,
) -> Result<(), AgentRuntimeStoreError> {
    require_admission_query(
        connection,
        r#"select coalesce((
               select current_user = session_user
                  and login.rolcanlogin
                  and not login.rolsuper
                  and not login.rolcreatedb
                  and not login.rolcreaterole
                  and not login.rolreplication
                  and not login.rolbypassrls
                  and current_setting('row_security') = 'on'
                  and pg_has_role(current_user, 'sirinx_agent_runtime_app', 'MEMBER')
                  and not pg_has_role(
                      current_user,
                      'sirinx_agent_runtime_owner',
                      'MEMBER'
                  )
                  and (
                      select count(*) = 1
                         and bool_and(membership.roleid = app.oid)
                      from pg_auth_members membership
                      cross join pg_roles app
                      where membership.member = login.oid
                        and app.rolname = 'sirinx_agent_runtime_app'
                  )
                  and (
                      select count(*) = 1
                         and bool_and(membership.member = login.oid)
                      from pg_auth_members membership
                      cross join pg_roles app
                      where membership.roleid = app.oid
                        and app.rolname = 'sirinx_agent_runtime_app'
                  )
                  and not exists (
                      select 1 from pg_database database
                      where database.datname = current_database()
                        and database.datdba = login.oid
                  )
                  and not has_database_privilege(
                      current_user,
                      current_database(),
                      'CREATE'
                  )
                  and has_schema_privilege(current_user, 'public', 'USAGE')
                  and not has_schema_privilege(current_user, 'public', 'CREATE')
               from pg_roles login
               where login.rolname = current_user
           ), false)
           and coalesce((
               select not app.rolcanlogin
                  and app.rolinherit
                  and not app.rolsuper
                  and not app.rolcreatedb
                  and not app.rolcreaterole
                  and not app.rolreplication
                  and not app.rolbypassrls
                  and not exists (
                      select 1 from pg_auth_members membership
                      where membership.member = app.oid
                  )
               from pg_roles app
               where app.rolname = 'sirinx_agent_runtime_app'
           ), false)
           and coalesce((
               select not owner.rolcanlogin
                  and not owner.rolinherit
                  and not owner.rolsuper
                  and not owner.rolcreatedb
                  and not owner.rolcreaterole
                  and not owner.rolreplication
                  and not owner.rolbypassrls
                  and not exists (
                      select 1 from pg_auth_members membership
                      where membership.member = owner.oid
                  )
               from pg_roles owner
               where owner.rolname = 'sirinx_agent_runtime_owner'
           ), false) as admitted"#,
        "runtime login or prerequisite role attributes are unsafe",
    )
    .await?;

    require_admission_query(
        connection,
        r#"with external_roles as (
               select oid, rolname from pg_roles
               where rolname in ('anon', 'authenticated', 'service_role')
           ), runtime_relations as (
               select relation.oid
               from pg_class relation
               join pg_namespace namespace on namespace.oid = relation.relnamespace
               where namespace.nspname = 'public'
                 and relation.relkind = 'r'
                 and relation.relname like 'agent_runtime\_%' escape '\'
           ), runtime_sequences as (
               select relation.oid
               from pg_class relation
               join pg_namespace namespace on namespace.oid = relation.relnamespace
               where namespace.nspname = 'public'
                 and relation.relkind = 'S'
                 and relation.relname in (
                     'agent_runtime_task_events_event_id_seq',
                     'agent_runtime_outbox_outbox_id_seq',
                     'agent_runtime_model_catalog_catalog_id_seq'
                 )
           )
           select not exists (
               select 1
               from external_roles external_role
               cross join runtime_relations relation
               where has_table_privilege(external_role.oid, relation.oid, 'SELECT')
                  or has_table_privilege(external_role.oid, relation.oid, 'INSERT')
                  or has_table_privilege(external_role.oid, relation.oid, 'UPDATE')
                  or has_table_privilege(external_role.oid, relation.oid, 'DELETE')
                  or has_table_privilege(external_role.oid, relation.oid, 'TRUNCATE')
                  or has_table_privilege(external_role.oid, relation.oid, 'REFERENCES')
                  or has_table_privilege(external_role.oid, relation.oid, 'TRIGGER')
                  or exists (
                      select 1
                      from pg_attribute attribute
                      where attribute.attrelid = relation.oid
                        and attribute.attnum > 0
                        and not attribute.attisdropped
                        and (
                            has_column_privilege(
                                external_role.oid, relation.oid,
                                attribute.attnum, 'SELECT'
                            )
                            or has_column_privilege(
                                external_role.oid, relation.oid,
                                attribute.attnum, 'INSERT'
                            )
                            or has_column_privilege(
                                external_role.oid, relation.oid,
                                attribute.attnum, 'UPDATE'
                            )
                            or has_column_privilege(
                                external_role.oid, relation.oid,
                                attribute.attnum, 'REFERENCES'
                            )
                        )
                  )
           ) and not exists (
               select 1
               from external_roles external_role
               cross join runtime_sequences runtime_sequence
               where has_sequence_privilege(
                   external_role.oid, runtime_sequence.oid, 'USAGE'
               ) or has_sequence_privilege(
                   external_role.oid, runtime_sequence.oid, 'SELECT'
               ) or has_sequence_privilege(
                   external_role.oid, runtime_sequence.oid, 'UPDATE'
               )
           ) and not exists (
               select 1
               from external_roles external_role
               where has_function_privilege(
                   external_role.oid,
                   'public.reject_agent_runtime_append_only_mutation()',
                   'EXECUTE'
               )
           ) as admitted"#,
        "a Supabase API role retains effective agent-runtime privileges",
    )
    .await?;

    require_admission_query(
        connection,
        r#"with expected(relname) as (values
               ('agent_runtime_tasks'),
               ('agent_runtime_task_events'),
               ('agent_runtime_runs'),
               ('agent_runtime_stage_leases'),
               ('agent_runtime_action_tickets'),
               ('agent_runtime_approval_grants'),
               ('agent_runtime_outbox'),
               ('agent_runtime_inbox_dedupe'),
               ('agent_runtime_verification_runs'),
               ('agent_runtime_receipts'),
               ('agent_runtime_model_catalog'),
               ('agent_runtime_a2a_peers'),
               ('agent_runtime_artifacts')
           ), owner_role as (
               select oid from pg_roles
               where rolname = 'sirinx_agent_runtime_owner'
           ), inspected as (
               select expected.relname, relation.oid, relation.relkind,
                      relation.relrowsecurity, relation.relforcerowsecurity,
                      relation.relowner, owner_role.oid as owner_oid
               from expected
               cross join owner_role
               left join pg_namespace namespace
                 on namespace.nspname = 'public'
               left join pg_class relation
                 on relation.relnamespace = namespace.oid
                and relation.relname = expected.relname
           )
           select count(oid) = 13
              and coalesce(bool_and(
                  relkind = 'r'
                  and relrowsecurity
                  and relforcerowsecurity
                  and relowner = owner_oid
              ), false)
              and (
                  select count(*) = 13
                  from pg_class relation
                  join pg_namespace namespace on namespace.oid = relation.relnamespace
                  where namespace.nspname = 'public'
                    and relation.relkind = 'r'
                    and relation.relname like 'agent_runtime\_%' escape '\'
              ) as admitted
           from inspected"#,
        "runtime tables are missing, wrongly owned, or not FORCE RLS",
    )
    .await?;

    require_admission_query(
        connection,
        r#"with allowed(relname) as (values
               ('agent_runtime_tasks'),
               ('agent_runtime_task_events'),
               ('agent_runtime_runs'),
               ('agent_runtime_stage_leases'),
               ('agent_runtime_receipts')
           ), columns as (
               select relation.oid as relation_oid, relation.relname,
                      attribute.attnum, attribute.attname
               from allowed
               join pg_namespace namespace on namespace.nspname = 'public'
               join pg_class relation
                 on relation.relnamespace = namespace.oid
                and relation.relname = allowed.relname
               join pg_attribute attribute on attribute.attrelid = relation.oid
               where relation.relkind = 'r'
                 and attribute.attnum > 0
                 and not attribute.attisdropped
           )
           select count(*) = 63
              and coalesce(bool_and(
                  has_column_privilege(
                      current_user, relation_oid, attnum, 'SELECT'
                  ) = not (
                      relname = 'agent_runtime_task_events'
                      and attname = 'event_id'
                  )
                  and has_column_privilege(
                      current_user, relation_oid, attnum, 'INSERT'
                  ) = not (
                      relname = 'agent_runtime_task_events'
                      and attname = 'event_id'
                  )
                  and has_column_privilege(
                      current_user, relation_oid, attnum, 'UPDATE'
                  ) = case relname
                      when 'agent_runtime_tasks' then
                          attname = any(array['state', 'version', 'updated_at'])
                      when 'agent_runtime_runs' then
                          attname = any(array[
                              'state', 'version', 'blocker',
                              'result_receipt_id', 'updated_at'
                          ])
                      when 'agent_runtime_stage_leases' then
                          attname = any(array[
                              'state', 'version', 'heartbeat_due_at', 'expires_at'
                          ])
                      else false
                  end
                  and not has_column_privilege(
                      current_user, relation_oid, attnum, 'REFERENCES'
                  )
                  and not has_table_privilege(
                      current_user, relation_oid, 'SELECT'
                  )
                  and not has_table_privilege(
                      current_user, relation_oid, 'INSERT'
                  )
                  and not has_table_privilege(
                      current_user, relation_oid, 'UPDATE'
                  )
                  and not has_table_privilege(
                      current_user, relation_oid, 'DELETE'
                  )
                  and not has_table_privilege(
                      current_user, relation_oid, 'TRUNCATE'
                  )
                  and not has_table_privilege(
                      current_user, relation_oid, 'REFERENCES'
                  )
                  and not has_table_privilege(
                      current_user, relation_oid, 'TRIGGER'
                  )
              ), false) as admitted
           from columns"#,
        "implemented runtime table grants do not match the exact column matrix",
    )
    .await?;

    require_admission_query(
        connection,
        r#"with forbidden(relname) as (values
               ('agent_runtime_action_tickets'),
               ('agent_runtime_approval_grants'),
               ('agent_runtime_outbox'),
               ('agent_runtime_inbox_dedupe'),
               ('agent_runtime_verification_runs'),
               ('agent_runtime_model_catalog'),
               ('agent_runtime_a2a_peers'),
               ('agent_runtime_artifacts')
           ), columns as (
               select relation.oid as relation_oid,
                      attribute.attnum
               from forbidden
               join pg_namespace namespace on namespace.nspname = 'public'
               join pg_class relation
                 on relation.relnamespace = namespace.oid
                and relation.relname = forbidden.relname
               join pg_attribute attribute on attribute.attrelid = relation.oid
               where relation.relkind = 'r'
                 and attribute.attnum > 0
                 and not attribute.attisdropped
           )
           select count(*) > 0
              and coalesce(bool_and(
                  not has_column_privilege(
                      current_user, relation_oid, attnum, 'SELECT'
                  )
                  and not has_column_privilege(
                      current_user, relation_oid, attnum, 'INSERT'
                  )
                  and not has_column_privilege(
                      current_user, relation_oid, attnum, 'UPDATE'
                  )
                  and not has_column_privilege(
                      current_user, relation_oid, attnum, 'REFERENCES'
                  )
                  and not has_table_privilege(
                      current_user, relation_oid, 'DELETE'
                  )
                  and not has_table_privilege(
                      current_user, relation_oid, 'TRUNCATE'
                  )
                  and not has_table_privilege(
                      current_user, relation_oid, 'TRIGGER'
                  )
              ), false) as admitted
           from columns"#,
        "runtime login can access an unimplemented groundwork table",
    )
    .await?;

    require_admission_query(
        connection,
        r#"with expected(relname, command, needs_using, needs_check) as (values
               ('agent_runtime_tasks', 'r', true, false),
               ('agent_runtime_tasks', 'a', false, true),
               ('agent_runtime_tasks', 'w', true, true),
               ('agent_runtime_task_events', 'r', true, false),
               ('agent_runtime_task_events', 'a', false, true),
               ('agent_runtime_runs', 'r', true, false),
               ('agent_runtime_runs', 'a', false, true),
               ('agent_runtime_runs', 'w', true, true),
               ('agent_runtime_stage_leases', 'r', true, false),
               ('agent_runtime_stage_leases', 'a', false, true),
               ('agent_runtime_stage_leases', 'w', true, true),
               ('agent_runtime_receipts', 'r', true, false),
               ('agent_runtime_receipts', 'a', false, true)
           ), app_role as (
               select oid from pg_roles
               where rolname = 'sirinx_agent_runtime_app'
           ), matched as (
               select expected.*, policy.oid as policy_oid,
                      policy.polpermissive, policy.polroles,
                      policy.polqual, policy.polwithcheck, policy.polrelid,
                      app_role.oid as app_oid
               from expected
               cross join app_role
               left join pg_namespace namespace on namespace.nspname = 'public'
               left join pg_class relation
                 on relation.relnamespace = namespace.oid
                and relation.relname = expected.relname
               left join pg_policy policy
                 on policy.polrelid = relation.oid
                and policy.polcmd::text = expected.command
           )
           select count(policy_oid) = 13
              and coalesce(bool_and(
                  polpermissive
                  and polroles = array[app_oid]::oid[]
                  and case when needs_using
                      then pg_get_expr(polqual, polrelid, true) = 'true'
                      else polqual is null
                  end
                  and case when needs_check
                      then pg_get_expr(polwithcheck, polrelid, true) = 'true'
                      else polwithcheck is null
                  end
              ), false)
              and (
                  select count(*) = 13
                  from pg_policy policy
                  join pg_class relation on relation.oid = policy.polrelid
                  join pg_namespace namespace on namespace.oid = relation.relnamespace
                  where namespace.nspname = 'public'
                    and relation.relname like 'agent_runtime\_%' escape '\'
              ) as admitted
           from matched"#,
        "runtime RLS policies are missing, public, duplicated, or overbroad",
    )
    .await?;

    require_admission_query(
        connection,
        r#"with owner_role as (
               select oid from pg_roles
               where rolname = 'sirinx_agent_runtime_owner'
           ), expected(relname, app_usage) as (values
               ('agent_runtime_task_events_event_id_seq', true),
               ('agent_runtime_outbox_outbox_id_seq', false),
               ('agent_runtime_model_catalog_catalog_id_seq', false)
           ), inspected as (
               select expected.relname, expected.app_usage,
                      runtime_sequence.oid, runtime_sequence.relkind,
                      runtime_sequence.relowner, owner_role.oid as owner_oid
               from expected
               cross join owner_role
               left join pg_namespace namespace on namespace.nspname = 'public'
               left join pg_class runtime_sequence
                 on runtime_sequence.relnamespace = namespace.oid
                and runtime_sequence.relname = expected.relname
           )
           select count(oid) = 3
              and coalesce(bool_and(
                  relkind = 'S'
                  and relowner = owner_oid
                  and has_sequence_privilege(
                      current_user, oid, 'USAGE'
                  ) = app_usage
                  and not has_sequence_privilege(
                      current_user, oid, 'SELECT'
                  )
                  and not has_sequence_privilege(
                      current_user, oid, 'UPDATE'
                  )
              ), false) as admitted
           from inspected"#,
        "runtime sequence ownership or grants are unsafe",
    )
    .await?;

    require_admission_query(
        connection,
        r#"with owner_role as (
               select oid from pg_roles
               where rolname = 'sirinx_agent_runtime_owner'
           )
           select coalesce((
               select runtime_function.proowner = owner_role.oid
                  and not runtime_function.prosecdef
                  and runtime_function.proconfig = array['search_path=pg_catalog']::text[]
                  and not has_function_privilege(
                      current_user, runtime_function.oid, 'EXECUTE'
                  )
                  and not exists (
                      select 1
                      from aclexplode(coalesce(
                          runtime_function.proacl,
                          acldefault('f', runtime_function.proowner)
                      )) acl
                      where acl.grantee = 0
                        and acl.privilege_type = 'EXECUTE'
                  )
               from pg_proc runtime_function
               join pg_namespace namespace
                 on namespace.oid = runtime_function.pronamespace
               cross join owner_role
               where namespace.nspname = 'public'
                 and runtime_function.proname = 'reject_agent_runtime_append_only_mutation'
                 and runtime_function.pronargs = 0
           ), false) as admitted"#,
        "append-only trigger function ownership, search_path, or ACL is unsafe",
    )
    .await?;

    Ok(())
}

/// Wire-format string for a serde snake_case enum (e.g. `LeadStatus::New`
/// → `"new"`), so the database always stores the public API vocabulary.
fn enum_str<T: serde::Serialize>(value: &T) -> Result<String, StoreError> {
    match serde_json::to_value(value).map_err(|e| StoreError::Backend(e.to_string()))? {
        serde_json::Value::String(s) => Ok(s),
        other => Err(StoreError::Backend(format!(
            "expected string-serialized enum, got {other}"
        ))),
    }
}

fn row_to_lead(row: &sqlx::postgres::PgRow) -> Result<Lead, StoreError> {
    let value = serde_json::json!({
        "id": row.try_get::<Uuid, _>("id").map_err(StoreError::from)?,
        "status": row.try_get::<String, _>("status").map_err(StoreError::from)?,
        "businessType": row.try_get::<String, _>("business_type").map_err(StoreError::from)?,
        "monthlyElectricBill": row.try_get::<f64, _>("monthly_electric_bill").map_err(StoreError::from)?,
        "availableAreaSqm": row.try_get::<f64, _>("available_area_sqm").map_err(StoreError::from)?,
        "interest": row.try_get::<serde_json::Value, _>("interest").map_err(StoreError::from)?,
        "source": row.try_get::<String, _>("source").map_err(StoreError::from)?,
        "consent": row.try_get::<serde_json::Value, _>("consent").map_err(StoreError::from)?,
    });
    serde_json::from_value(value).map_err(|e| StoreError::Backend(e.to_string()))
}

fn row_to_gate(row: &sqlx::postgres::PgRow) -> Result<Gate, StoreError> {
    let value = serde_json::json!({
        "name": row.try_get::<String, _>("name").map_err(StoreError::from)?,
        "state": row.try_get::<String, _>("state").map_err(StoreError::from)?,
        "ticket": row.try_get::<Option<String>, _>("ticket").map_err(StoreError::from)?,
    });
    serde_json::from_value(value).map_err(|err| StoreError::Backend(err.to_string()))
}

fn enum_from_string<T: DeserializeOwned>(value: String) -> Result<T, StoreError> {
    serde_json::from_value(serde_json::Value::String(value))
        .map_err(|err| StoreError::Backend(err.to_string()))
}

fn row_to_failure(row: &sqlx::postgres::PgRow) -> Result<FailureEvent, StoreError> {
    let attempt = row.try_get::<i32, _>("attempt").map_err(StoreError::from)?;
    Ok(FailureEvent {
        id: row.try_get("id").map_err(StoreError::from)?,
        run_id: row.try_get("run_id").map_err(StoreError::from)?,
        tool: row.try_get("tool_name").map_err(StoreError::from)?,
        error_kind: enum_from_string(row.try_get("error_kind").map_err(StoreError::from)?)?,
        attempt: u32::try_from(attempt)
            .map_err(|_| StoreError::Backend("invalid failure attempt".into()))?,
    })
}

fn row_to_lesson(row: &sqlx::postgres::PgRow) -> Result<Lesson, StoreError> {
    let occurrences = row
        .try_get::<i64, _>("occurrences")
        .map_err(StoreError::from)?;
    Ok(Lesson {
        id: row.try_get("id").map_err(StoreError::from)?,
        tool: row.try_get("tool_name").map_err(StoreError::from)?,
        error_kind: enum_from_string(row.try_get("error_kind").map_err(StoreError::from)?)?,
        guidance: enum_from_string(row.try_get("guidance_kind").map_err(StoreError::from)?)?,
        occurrences: u64::try_from(occurrences)
            .map_err(|_| StoreError::Backend("invalid lesson occurrence count".into()))?,
    })
}

#[async_trait]
impl Store for PostgresStore {
    async fn insert_lead(&self, lead: &Lead) -> Result<(), StoreError> {
        sqlx::query(
            r#"insert into web_leads
               (id, status, business_type, monthly_electric_bill, available_area_sqm, interest, source, consent)
               values ($1, $2, $3, $4, $5, $6, $7, $8)"#,
        )
        .bind(lead.id)
        .bind(enum_str(&lead.status)?)
        .bind(enum_str(&lead.draft.business_type)?)
        .bind(lead.draft.monthly_electric_bill)
        .bind(lead.draft.available_area_sqm)
        .bind(serde_json::to_value(&lead.draft.interest).map_err(|e| StoreError::Backend(e.to_string()))?)
        .bind(&lead.draft.source)
        .bind(serde_json::to_value(lead.draft.consent).map_err(|e| StoreError::Backend(e.to_string()))?)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn get_lead(&self, id: Uuid) -> Result<Option<Lead>, StoreError> {
        let row = sqlx::query("select * from web_leads where id = $1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        row.as_ref().map(row_to_lead).transpose()
    }

    async fn update_lead_status(&self, id: Uuid, next: LeadStatus) -> Result<Lead, StoreError> {
        let mut tx = self.pool.begin().await?;
        let row = sqlx::query("select * from web_leads where id = $1 for update")
            .bind(id)
            .fetch_optional(&mut *tx)
            .await?
            .ok_or(StoreError::NotFound)?;
        let mut lead = row_to_lead(&row)?;
        lead.transition(next)?;
        sqlx::query("update web_leads set status = $2, updated_at = now() where id = $1")
            .bind(id)
            .bind(enum_str(&lead.status)?)
            .execute(&mut *tx)
            .await?;
        tx.commit().await?;
        Ok(lead)
    }

    async fn delete_lead(&self, id: Uuid) -> Result<bool, StoreError> {
        let result = sqlx::query("delete from web_leads where id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }

    async fn count_leads(&self) -> Result<u64, StoreError> {
        let row = sqlx::query("select count(*) as n from web_leads")
            .fetch_one(&self.pool)
            .await?;
        Ok(row.try_get::<i64, _>("n").map_err(StoreError::from)? as u64)
    }

    async fn insert_event(&self, event: &AnalyticsEvent) -> Result<(), StoreError> {
        sqlx::query(
            r#"insert into web_analytics_events (event, payload, page, consent)
               values ($1, $2, $3, $4)"#,
        )
        .bind(&event.event)
        .bind(&event.payload)
        .bind(&event.page)
        .bind(serde_json::to_value(event.consent).map_err(|e| StoreError::Backend(e.to_string()))?)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn count_events(&self) -> Result<u64, StoreError> {
        let row = sqlx::query("select count(*) as n from web_analytics_events")
            .fetch_one(&self.pool)
            .await?;
        Ok(row.try_get::<i64, _>("n").map_err(StoreError::from)? as u64)
    }

    async fn insert_pending_work(&self, item: &PendingWork) -> Result<(), StoreError> {
        sqlx::query(
            r#"insert into web_pending_work (id, source, title, detail)
               values ($1, $2, $3, $4)"#,
        )
        .bind(item.id)
        .bind(&item.source)
        .bind(&item.title)
        .bind(&item.detail)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn list_pending_work(&self) -> Result<Vec<PendingWork>, StoreError> {
        let rows = sqlx::query(
            "select id, source, title, detail from web_pending_work where status = 'pending' order by created_at",
        )
        .fetch_all(&self.pool)
        .await?;
        rows.iter()
            .map(|row| {
                Ok(PendingWork {
                    id: row.try_get("id").map_err(StoreError::from)?,
                    source: row.try_get("source").map_err(StoreError::from)?,
                    title: row.try_get("title").map_err(StoreError::from)?,
                    detail: row.try_get("detail").map_err(StoreError::from)?,
                })
            })
            .collect()
    }

    async fn count_pending_work(&self) -> Result<u64, StoreError> {
        let row =
            sqlx::query("select count(*) as n from web_pending_work where status = 'pending'")
                .fetch_one(&self.pool)
                .await?;
        Ok(row.try_get::<i64, _>("n").map_err(StoreError::from)? as u64)
    }

    async fn upsert_gate(&self, gate: &Gate) -> Result<(), StoreError> {
        sqlx::query(
            r#"insert into web_control_gates (name, state, ticket)
               values ($1, $2, $3)
               on conflict (name) do update
               set state = excluded.state,
                   ticket = excluded.ticket,
                   updated_at = now()"#,
        )
        .bind(&gate.name)
        .bind(enum_str(&gate.state)?)
        .bind(&gate.ticket)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn list_gates(&self) -> Result<Vec<Gate>, StoreError> {
        let rows = sqlx::query("select name, state, ticket from web_control_gates order by name")
            .fetch_all(&self.pool)
            .await?;
        rows.iter().map(row_to_gate).collect()
    }

    async fn get_gate(&self, name: &str) -> Result<Option<Gate>, StoreError> {
        let row = sqlx::query("select name, state, ticket from web_control_gates where name = $1")
            .bind(name)
            .fetch_optional(&self.pool)
            .await?;
        row.as_ref().map(row_to_gate).transpose()
    }

    async fn record_failure(&self, event: &FailureEvent) -> Result<(), StoreError> {
        sqlx::query(
            r#"insert into web_failure_events
               (id, run_id, tool_name, error_kind, attempt)
               values ($1, $2, $3, $4, $5)"#,
        )
        .bind(event.id)
        .bind(event.run_id)
        .bind(bounded_recovery_tool_name(&event.tool))
        .bind(enum_str(&event.error_kind)?)
        .bind(
            i32::try_from(event.attempt.max(1))
                .map_err(|_| StoreError::Backend("failure attempt exceeds storage range".into()))?,
        )
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn failure_events_for_run(&self, run_id: Uuid) -> Result<Vec<FailureEvent>, StoreError> {
        let rows = sqlx::query(
            r#"select id, run_id, tool_name, error_kind, attempt
               from web_failure_events
               where run_id = $1
               order by attempt, id"#,
        )
        .bind(run_id)
        .fetch_all(&self.pool)
        .await?;
        rows.iter().map(row_to_failure).collect()
    }

    async fn upsert_lesson(&self, lesson: &Lesson) -> Result<Lesson, StoreError> {
        let row = sqlx::query(
            r#"insert into web_lessons
               (id, tool_name, error_kind, guidance_kind, occurrences)
               values ($1, $2, $3, $4, 1)
               on conflict (tool_name, error_kind, guidance_kind) do update
               set occurrences = case
                       when web_lessons.occurrences = 9223372036854775807
                           then web_lessons.occurrences
                       else web_lessons.occurrences + 1
                   end,
                   updated_at = now()
               returning id, tool_name, error_kind, guidance_kind, occurrences"#,
        )
        .bind(lesson.id)
        .bind(bounded_recovery_tool_name(&lesson.tool))
        .bind(enum_str(&lesson.error_kind)?)
        .bind(enum_str(&lesson.guidance)?)
        .fetch_one(&self.pool)
        .await?;
        row_to_lesson(&row)
    }

    async fn lessons_for_tool(&self, tool: &str) -> Result<Vec<Lesson>, StoreError> {
        let rows = sqlx::query(
            r#"select id, tool_name, error_kind, guidance_kind, occurrences
               from web_lessons
               where tool_name = $1
               order by occurrences desc, updated_at desc, id"#,
        )
        .bind(bounded_recovery_tool_name(tool))
        .fetch_all(&self.pool)
        .await?;
        rows.iter().map(row_to_lesson).collect()
    }
}

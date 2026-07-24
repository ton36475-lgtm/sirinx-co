//! Disposable Postgres acceptance entrypoint for the P2.1 runtime authority.
//!
//! The fixture must externally provision the NOLOGIN owner/app roles and a
//! distinct runtime login. This ignored test never treats a missing fixture as
//! a pass: invoking it without every required environment variable is a test
//! failure.

use serde_json::json;
use sirinx_core::AgentTask;
use sirinx_store::{migrate_postgres_once, AgentRuntimePostgresStore, AgentRuntimeStore};
use sqlx::{Connection, PgConnection, Row};

const MIGRATION_URL_ENV: &str = "TEST_AGENT_RUNTIME_MIGRATION_URL";
const RUNTIME_URL_ENV: &str = "TEST_AGENT_RUNTIME_DATABASE_URL";
const SCENARIO_ENV: &str = "TEST_AGENT_RUNTIME_SCENARIO";

fn required_env(name: &str) -> String {
    std::env::var(name).unwrap_or_else(|_| panic!("{name} is required for this ignored test"))
}

fn disposable_task() -> AgentTask {
    AgentTask::new(
        "TASK-disposable-001",
        "idempotency-disposable-001",
        json!({
            "schemaVersion": "1.0",
            "taskId": "TASK-disposable-001",
            "createdAt": "2026-07-20T12:34:56Z",
            "goal": "Prove the disposable least-privilege task path",
            "constraints": ["Disposable Postgres only"],
            "nonGoals": ["No external effects"],
            "requestedBy": {
                "principalId": "disposable-operator",
                "assertionRef": "ASSERTION-disposable-001"
            },
            "dataClass": "INTERNAL",
            "repository": {
                "path": "/disposable/repo",
                "commitSha": "a".repeat(40),
                "worktreeId": "disposable-worktree"
            },
            "planHash": "b".repeat(64),
            "scopeHash": "c".repeat(64),
            "requestedRoleIds": [37, 42],
            "actionManifest": [{
                "action": "verify",
                "class": "B",
                "target": "crates/sirinx-store"
            }],
            "budgets": {
                "maxSteps": 20,
                "maxRuntimeSeconds": 300,
                "maxOutputBytes": 1048576,
                "maxExternalCalls": 0,
                "maxCostUsd": 0
            },
            "stopConditions": ["Stop on authority mismatch"],
            "idempotencyKey": "idempotency-disposable-001",
            "approvalTicketIds": ["TKT-disposable-001"]
        }),
        1_000,
    )
    .expect("disposable task envelope must be valid")
}

async fn execute_script(connection: &mut PgConnection, script: &str) {
    sqlx::raw_sql(script)
        .execute(connection)
        .await
        .expect("disposable migration script must succeed");
}

async fn migrate_prior_state(migration_url: &str) {
    let mut connection = PgConnection::connect(migration_url)
        .await
        .expect("connect disposable prior-state migration database");

    execute_script(
        &mut connection,
        include_str!("../migrations/0001_web_leads_and_events.sql"),
    )
    .await;
    execute_script(
        &mut connection,
        include_str!("../migrations/0002_pending_work.sql"),
    )
    .await;

    sqlx::query(
        r#"insert into public.web_leads
           (id, status, business_type, monthly_electric_bill,
            available_area_sqm, interest, source, consent)
           values (
               '00000000-0000-0000-0000-000000000601'::uuid,
               'new', 'warehouse', 1000, 100, '[]'::jsonb,
               'agent-runtime-prior-state',
               '{"analytics":false,"marketing_contact":false}'::jsonb
           )"#,
    )
    .execute(&mut connection)
    .await
    .expect("seed preserved web lead");
    sqlx::query(
        r#"insert into public.web_pending_work (id, source, title, detail)
           values (
               '00000000-0000-0000-0000-000000000602'::uuid,
               'agent-runtime-prior-state', 'preserve', '{}'::jsonb
           )"#,
    )
    .execute(&mut connection)
    .await
    .expect("seed preserved pending work");

    execute_script(
        &mut connection,
        include_str!("../migrations/0003_control_gates.sql"),
    )
    .await;
    execute_script(
        &mut connection,
        include_str!("../migrations/0004_failure_lessons.sql"),
    )
    .await;

    let gate_count = sqlx::query("select count(*)::bigint as count from public.web_control_gates")
        .fetch_one(&mut connection)
        .await
        .expect("read migrated control gates")
        .try_get::<i64, _>("count")
        .expect("decode gate count");
    assert_eq!(gate_count, 5, "migration 0003 must seed exactly five gates");

    execute_script(
        &mut connection,
        include_str!("../migrations/0005_agent_runtime_core.sql"),
    )
    .await;
    execute_script(
        &mut connection,
        include_str!("../migrations/0006_agent_runtime_runtime_access.sql"),
    )
    .await;

    for (table, id) in [
        ("public.web_leads", "00000000-0000-0000-0000-000000000601"),
        (
            "public.web_pending_work",
            "00000000-0000-0000-0000-000000000602",
        ),
    ] {
        let query = format!("select count(*)::bigint as count from {table} where id = $1::uuid");
        let count = sqlx::query(&query)
            .bind(id)
            .fetch_one(&mut connection)
            .await
            .expect("read preserved prior-state sentinel")
            .try_get::<i64, _>("count")
            .expect("decode prior-state sentinel count");
        assert_eq!(count, 1, "prior-state sentinel must survive 0003-0006");
    }
}

#[tokio::test]
#[ignore = "requires an externally provisioned disposable Postgres fixture"]
async fn agent_runtime_postgres_disposable() {
    let migration_url = required_env(MIGRATION_URL_ENV);
    let runtime_url = required_env(RUNTIME_URL_ENV);
    let scenario = required_env(SCENARIO_ENV);

    match scenario.as_str() {
        "empty" => migrate_postgres_once(&migration_url)
            .await
            .expect("apply embedded migrations over one administrative connection"),
        "prior-state" => migrate_prior_state(&migration_url).await,
        other => panic!("{SCENARIO_ENV} must be empty or prior-state, received {other:?}"),
    }

    let store = AgentRuntimePostgresStore::connect_runtime(&runtime_url)
        .await
        .expect("least-privilege runtime login must pass admission");
    let task = disposable_task();
    let created = store
        .create_task(&task)
        .await
        .expect("permitted task insert must execute");
    assert_eq!(created, task);
    assert_eq!(
        store
            .get_task(&task.task_id)
            .await
            .expect("permitted task read must execute"),
        Some(task)
    );
    assert_eq!(
        store
            .get_task("TASK-disposable-missing")
            .await
            .expect("allowed task read must execute"),
        None
    );
    store
        .attest_runtime()
        .await
        .expect("runtime admission must remain stable on pool reuse");
    assert!(
        AgentRuntimePostgresStore::connect_runtime(&migration_url)
            .await
            .is_err(),
        "migration/owner authority must never pass runtime admission"
    );

    let mut runtime_connection = PgConnection::connect(&runtime_url)
        .await
        .expect("connect disposable runtime login for negative probes");
    assert!(
        sqlx::query("delete from public.agent_runtime_tasks where false")
            .execute(&mut runtime_connection)
            .await
            .is_err(),
        "runtime login must not receive DELETE"
    );
    assert!(
        sqlx::query("truncate table public.agent_runtime_tasks")
            .execute(&mut runtime_connection)
            .await
            .is_err(),
        "runtime login must not receive TRUNCATE, which is outside RLS"
    );
    assert!(
        sqlx::query("update public.agent_runtime_tasks set envelope = envelope where false")
            .execute(&mut runtime_connection)
            .await
            .is_err(),
        "runtime login must not update immutable task-envelope columns"
    );
    assert!(
        sqlx::query("update public.agent_runtime_task_events set blocker = blocker where false")
            .execute(&mut runtime_connection)
            .await
            .is_err(),
        "append-only events must not receive UPDATE"
    );
    assert!(
        sqlx::query("update public.agent_runtime_receipts set result = result where false")
            .execute(&mut runtime_connection)
            .await
            .is_err(),
        "append-only receipts must not receive UPDATE"
    );
    assert!(
        sqlx::query("select count(*) from public.agent_runtime_action_tickets")
            .fetch_one(&mut runtime_connection)
            .await
            .is_err(),
        "runtime login must not read groundwork tables"
    );
    assert!(
        sqlx::query("create table public.agent_runtime_forbidden_probe (id integer)")
            .execute(&mut runtime_connection)
            .await
            .is_err(),
        "runtime login must not create schema objects"
    );
}

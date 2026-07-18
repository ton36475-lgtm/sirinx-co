//! Disposable-Postgres coverage for migrations 0003 and 0004.
//!
//! Runs only when `TEST_DATABASE_URL` is set. The database must be disposable:
//! this test exercises persisted gate decisions and recovery records.

use sirinx_core::{FailureEvent, FailureKind, Gate, GateState, Lesson, LessonGuidance};
use sirinx_store::{PostgresStore, Store};
use uuid::Uuid;

#[tokio::test]
async fn durable_gates_and_recovery_round_trip_against_real_postgres() {
    let Ok(url) = std::env::var("TEST_DATABASE_URL") else {
        eprintln!("TEST_DATABASE_URL not set; skipping B1/B2 postgres integration test");
        return;
    };

    let store = PostgresStore::connect(&url)
        .await
        .expect("connect + apply migrations 0001-0004");

    let applied: i64 = sqlx::query_scalar(
        "select count(*) from _sqlx_migrations where version in (3, 4) and success",
    )
    .fetch_one(store.pool())
    .await
    .expect("read sqlx migration ledger");
    assert_eq!(applied, 2, "migrations 0003 and 0004 must both be applied");

    for table in ["web_control_gates", "web_failure_events", "web_lessons"] {
        let rls: bool =
            sqlx::query_scalar("select relrowsecurity from pg_class where oid = to_regclass($1)")
                .bind(format!("public.{table}"))
                .fetch_one(store.pool())
                .await
                .expect("inspect RLS flag");
        assert!(rls, "{table} must have row-level security enabled");
    }

    let gates = store.list_gates().await.expect("list seeded gates");
    assert_eq!(gates.len(), 5);
    assert!(gates
        .iter()
        .all(|gate| gate.state == GateState::Hold && gate.ticket.is_none()));

    let invalid_open = Gate {
        name: "deploy".into(),
        state: GateState::Open,
        ticket: None,
    };
    assert!(store.upsert_gate(&invalid_open).await.is_err());
    assert_eq!(
        store.get_gate("deploy").await.unwrap().unwrap().state,
        GateState::Hold
    );

    let ticket = format!("GO-LIVE-DEPLOY-TEST-{}", Uuid::new_v4());
    store
        .upsert_gate(&Gate {
            name: "deploy".into(),
            state: GateState::Open,
            ticket: Some(ticket.clone()),
        })
        .await
        .expect("ticketed open persists");
    let opened = store.get_gate("deploy").await.unwrap().unwrap();
    assert_eq!(opened.state, GateState::Open);
    assert_eq!(opened.ticket.as_deref(), Some(ticket.as_str()));

    store
        .upsert_gate(&Gate {
            name: "deploy".into(),
            state: GateState::Hold,
            ticket: None,
        })
        .await
        .expect("restore held deploy gate");

    let run_id = Uuid::new_v4();
    let tool = format!("postgres-integration-{run_id}");
    let failure = FailureEvent::new(run_id, &tool, FailureKind::Failed, 1);
    store
        .record_failure(&failure)
        .await
        .expect("record failure");
    assert_eq!(
        store.failure_events_for_run(run_id).await.unwrap(),
        vec![failure]
    );

    let lesson = Lesson::new(
        &tool,
        FailureKind::Failed,
        LessonGuidance::RetryTransientFailure,
    );
    let first = store.upsert_lesson(&lesson).await.expect("insert lesson");
    let second = store.upsert_lesson(&lesson).await.expect("dedupe lesson");
    assert_eq!(first.occurrences, 1);
    assert_eq!(second.id, first.id);
    assert_eq!(second.occurrences, 2);
    assert_eq!(store.lessons_for_tool(&tool).await.unwrap(), vec![second]);
}

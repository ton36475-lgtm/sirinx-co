use sirinx_core::{
    ActionClass, AgentRun, AgentRuntimeError, AgentTask, LeaseState, RuntimeState, StageLease,
    StateTransition,
};

fn task(version: u64) -> AgentTask {
    let task_id = "TASK-overflow-001";
    let idempotency_key = "idempotency-overflow-001";
    let value = AgentTask {
        task_id: task_id.into(),
        idempotency_key: idempotency_key.into(),
        envelope: serde_json::json!({
            "schemaVersion": "1.0", "taskId": task_id,
            "createdAt": "2026-07-20T12:34:56Z", "goal": "Synthetic atomicity check",
            "constraints": ["No runtime effects"], "nonGoals": ["No deployment"],
            "requestedBy": {"principalId": "test-actor", "assertionRef": "ASSERTION-test-001"},
            "dataClass": "INTERNAL",
            "repository": {"path": "/repo", "commitSha": "a".repeat(40), "worktreeId": "test-worktree"},
            "planHash": "b".repeat(64), "scopeHash": "c".repeat(64),
            "requestedRoleIds": [37, 42],
            "actionManifest": [{"action": "edit", "class": "B", "target": "src/synthetic.rs"}],
            "budgets": {"maxSteps": 1, "maxRuntimeSeconds": 1, "maxOutputBytes": 1024,
                "maxExternalCalls": 0, "maxCostUsd": 0},
            "stopConditions": ["Stop on rejection"], "idempotencyKey": idempotency_key,
            "approvalTicketIds": ["TKT-synthetic-001"]
        }),
        state: RuntimeState::Draft,
        version,
        created_at_unix_ms: 1_000,
        updated_at_unix_ms: 1_000,
    };
    value.validate().unwrap();
    value
}

fn run(version: u64) -> AgentRun {
    let value = AgentRun {
        version,
        ..AgentRun::new(
            "RUN-overflow-001",
            "TASK-overflow-001",
            "stage-test",
            37,
            "test-actor",
            ActionClass::B,
            1,
            1_000,
        )
        .unwrap()
    };
    value.validate().unwrap();
    value
}

fn lease(version: u64) -> StageLease {
    let value = StageLease {
        lease_id: "LEASE-overflow-001".into(),
        task_id: "TASK-overflow-001".into(),
        run_id: "RUN-overflow-001".into(),
        role_id: 37,
        principal_id: "test-actor".into(),
        repository_path: "/repo".into(),
        worktree_id: "test-worktree".into(),
        paths: vec!["src/synthetic.rs".into()],
        resources: vec![],
        source_write: true,
        nonce_digest: "d".repeat(64),
        issued_at_unix_ms: 1_000,
        expires_at_unix_ms: 10_000,
        heartbeat_due_at_unix_ms: 5_000,
        version,
        state: LeaseState::Active,
    };
    value.validate_persisted().unwrap();
    value
}

fn transition(version: u64) -> StateTransition {
    StateTransition {
        expected_version: version,
        next_state: RuntimeState::Triaged,
        at_unix_ms: 2_000,
        blocker: None,
        actor_principal_id: "test-actor".into(),
    }
}

#[test]
fn task_overflow_rejection_preserves_every_field() {
    let before = task(u64::MAX);
    let mut after = before.clone();
    assert_eq!(
        after.apply_transition(&transition(u64::MAX)),
        Err(AgentRuntimeError::VersionOverflow)
    );
    assert_eq!(after, before);
}

#[test]
fn run_overflow_rejection_preserves_every_field() {
    let before = run(u64::MAX);
    let mut after = before.clone();
    assert_eq!(
        after.apply_transition(&transition(u64::MAX)),
        Err(AgentRuntimeError::VersionOverflow)
    );
    assert_eq!(after, before);
}

#[test]
fn heartbeat_overflow_rejection_preserves_every_field() {
    let before = lease(u64::MAX);
    let mut after = before.clone();
    assert_eq!(
        after.heartbeat(u64::MAX, 2_000, 6_000, 11_000),
        Err(AgentRuntimeError::VersionOverflow)
    );
    assert_eq!(after, before);
}

#[test]
fn release_overflow_rejection_preserves_every_field() {
    let before = lease(u64::MAX);
    let mut after = before.clone();
    assert_eq!(
        after.release(u64::MAX, 2_000),
        Err(AgentRuntimeError::VersionOverflow)
    );
    assert_eq!(after, before);
}

#[test]
fn task_can_reach_max_version_without_wrapping() {
    let before = task(u64::MAX - 1);
    let mut after = before.clone();
    after.apply_transition(&transition(u64::MAX - 1)).unwrap();
    assert_eq!(
        after,
        AgentTask {
            state: RuntimeState::Triaged,
            version: u64::MAX,
            updated_at_unix_ms: 2_000,
            ..before
        }
    );
    after.validate().unwrap();
}

#[test]
fn run_can_reach_max_version_without_wrapping() {
    let before = run(u64::MAX - 1);
    let mut after = before.clone();
    after.apply_transition(&transition(u64::MAX - 1)).unwrap();
    assert_eq!(
        after,
        AgentRun {
            state: RuntimeState::Triaged,
            version: u64::MAX,
            updated_at_unix_ms: 2_000,
            ..before
        }
    );
    after.validate().unwrap();
}

#[test]
fn heartbeat_can_reach_max_version_at_current_deadline() {
    let before = lease(u64::MAX - 1);
    let mut after = before.clone();
    after.heartbeat(u64::MAX - 1, 5_000, 6_000, 11_000).unwrap();
    assert_eq!(
        after,
        StageLease {
            version: u64::MAX,
            heartbeat_due_at_unix_ms: 6_000,
            expires_at_unix_ms: 11_000,
            ..before
        }
    );
    after.validate_persisted().unwrap();
}

#[test]
fn release_can_reach_max_version_at_current_deadline() {
    let before = lease(u64::MAX - 1);
    let mut after = before.clone();
    after.release(u64::MAX - 1, 5_000).unwrap();
    assert_eq!(
        after,
        StageLease {
            version: u64::MAX,
            state: LeaseState::Released,
            ..before
        }
    );
    after.validate_persisted().unwrap();
}

#[test]
fn transition_rejection_order_is_preserved_at_max_version() {
    let before = task(u64::MAX);
    let cases = [
        (
            StateTransition {
                expected_version: 0,
                ..transition(u64::MAX)
            },
            AgentRuntimeError::InvalidVersion,
        ),
        (
            transition(u64::MAX - 1),
            AgentRuntimeError::VersionConflict {
                expected: u64::MAX - 1,
                actual: u64::MAX,
            },
        ),
        (
            StateTransition {
                at_unix_ms: 999,
                ..transition(u64::MAX)
            },
            AgentRuntimeError::InvalidTimestampOrder,
        ),
        (
            StateTransition {
                next_state: RuntimeState::Running,
                ..transition(u64::MAX)
            },
            AgentRuntimeError::InvalidTransition {
                from: RuntimeState::Draft,
                to: RuntimeState::Running,
            },
        ),
    ];
    for (request, error) in cases {
        let mut after = before.clone();
        assert_eq!(after.apply_transition(&request), Err(error));
        assert_eq!(after, before);
    }
}

#[test]
fn lease_rejection_order_is_preserved_at_max_version() {
    let active = lease(u64::MAX);
    let released = StageLease {
        state: LeaseState::Released,
        ..active.clone()
    };
    let cases = [
        (
            active.clone(),
            u64::MAX - 1,
            2_000,
            AgentRuntimeError::VersionConflict {
                expected: u64::MAX - 1,
                actual: u64::MAX,
            },
        ),
        (released, u64::MAX, 2_000, AgentRuntimeError::LeaseNotActive),
        (
            active.clone(),
            u64::MAX,
            999,
            AgentRuntimeError::InvalidTimestampOrder,
        ),
        (active, u64::MAX, 5_001, AgentRuntimeError::LeaseExpired),
    ];
    for (before, expected, now, error) in cases {
        let mut released = before.clone();
        assert_eq!(released.release(expected, now), Err(error.clone()));
        assert_eq!(released, before);
        let mut extended = before.clone();
        assert_eq!(extended.heartbeat(expected, now, 6_000, 11_000), Err(error));
        assert_eq!(extended, before);
    }
}

#[test]
fn heartbeat_invalid_extension_precedes_overflow() {
    let before = lease(u64::MAX);
    for (due, expiry) in [(2_000, 11_000), (12_000, 11_000), (6_000, 9_999)] {
        let mut after = before.clone();
        assert_eq!(
            after.heartbeat(u64::MAX, 2_000, due, expiry),
            Err(AgentRuntimeError::InvalidLeaseTiming)
        );
        assert_eq!(after, before);
    }
}

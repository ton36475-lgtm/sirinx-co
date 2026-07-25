use serde_json::json;
use sirinx_autoloop::{
    run_goal, GoalExecutionProfile, GoalRunState, GoalSpec, LoopOutcome, MAX_GOAL_STEPS,
};

#[test]
fn public_goal_path_is_local_provider_free_and_effect_free() {
    let report = run_goal(GoalSpec::new("review the local architecture")).unwrap();

    assert_eq!(
        report.execution_profile,
        GoalExecutionProfile::LocalNoProviderNoEffect
    );
    assert_eq!(report.status, GoalRunState::Passed);
    assert_eq!(report.outcome, LoopOutcome::Completed);
    assert_eq!(report.steps_used, 1);
    assert_eq!(report.evidence.tool_invocations, 1);
    assert_eq!(report.evidence.retry_attempts, 0);
    assert_eq!(report.evidence.provider_calls, 0);
    assert_eq!(report.evidence.network_calls, 0);
    assert_eq!(report.evidence.subprocesses_started, 0);
    assert_eq!(report.evidence.filesystem_reads, 0);
    assert_eq!(report.evidence.filesystem_writes, 0);
    assert_eq!(report.evidence.external_effects, 0);
    assert_eq!(report.evidence.external_writes, 0);
    assert!(report.evidence.has_no_effects());
    assert_eq!(report.tool_names, ["inspect"]);
}

#[test]
fn one_permitted_step_is_completed_not_budget_exhausted() {
    let report = run_goal(GoalSpec::new("one step only").with_max_steps(1)).unwrap();
    assert_eq!(report.max_steps, 1);
    assert_eq!(report.steps_used, 1);
    assert_eq!(report.outcome, LoopOutcome::Completed);
}

#[test]
fn untrusted_json_cannot_embed_authority_or_capability_fields() {
    let forbidden_fields = [
        ("approval", json!("approved")),
        ("gate", json!({ "mode": "approved", "ticket": "T-1" })),
        ("ticket", json!("T-1")),
        ("tools", json!(["provider", "shell"])),
        ("tool", json!("shell")),
        ("args", json!({ "command": "whoami" })),
        ("argTemplates", json!({ "inspect": {} })),
        ("targetAgents", json!(["hermes-agent"])),
        ("provider", json!("openai")),
        ("executionProfile", json!("unrestricted")),
    ];

    for (field, value) in forbidden_fields {
        let mut input = json!({
            "goal": "inspect local state",
            "maxSteps": 1
        });
        input.as_object_mut().unwrap().insert(field.into(), value);
        let error = serde_json::from_value::<GoalSpec>(input).unwrap_err();
        assert!(
            error.to_string().contains("unknown field"),
            "{field} unexpectedly failed for a different reason: {error}"
        );
    }
}

#[test]
fn step_budget_is_bounded_at_the_deserialization_boundary() {
    let oversized: GoalSpec = serde_json::from_value(json!({
        "goal": "inspect local state",
        "maxSteps": MAX_GOAL_STEPS + 1
    }))
    .unwrap();
    assert!(run_goal(oversized).is_err());

    let zero: GoalSpec = serde_json::from_value(json!({
        "goal": "inspect local state",
        "maxSteps": 0
    }))
    .unwrap();
    assert!(run_goal(zero).is_err());
}

#[test]
fn result_evidence_round_trips_with_explicit_zero_counters() {
    let report = run_goal(GoalSpec::new("serialize evidence")).unwrap();
    let encoded = serde_json::to_value(&report).unwrap();

    assert_eq!(encoded["status"], "passed");
    assert_eq!(encoded["executionProfile"], "local_no_provider_no_effect");
    assert_eq!(encoded["evidence"]["providerCalls"], 0);
    assert_eq!(encoded["evidence"]["networkCalls"], 0);
    assert_eq!(encoded["evidence"]["subprocessesStarted"], 0);
    assert_eq!(encoded["evidence"]["filesystemReads"], 0);
    assert_eq!(encoded["evidence"]["filesystemWrites"], 0);
    assert_eq!(encoded["evidence"]["externalEffects"], 0);
    assert_eq!(encoded["evidence"]["externalWrites"], 0);
    assert_eq!(encoded["evidence"]["retryAttempts"], 0);

    let decoded: sirinx_autoloop::GoalRunReport = serde_json::from_value(encoded).unwrap();
    assert_eq!(decoded.status, GoalRunState::Passed);
    assert!(decoded.evidence.has_no_effects());
}

#[test]
fn serialized_report_does_not_disclose_goal_tool_args_or_output() {
    const SENTINEL_GOAL: &str = "SENTINEL_GOAL_MUST_NOT_LEAVE_THE_RUNNER";
    let report = run_goal(GoalSpec::new(SENTINEL_GOAL)).unwrap();
    let encoded = serde_json::to_string(&report).unwrap();

    assert!(!encoded.contains(SENTINEL_GOAL));
    assert!(!encoded.contains("\"args\""));
    assert!(!encoded.contains("\"output\""));
    assert!(!encoded.contains("\"history\""));
}

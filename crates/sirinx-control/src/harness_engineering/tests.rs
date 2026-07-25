use std::collections::BTreeSet;
use std::path::PathBuf;

use sirinx_agents::{
    EngineeringAdapterSlot, EngineeringPrincipal, EngineeringRunMode, EngineeringRunPlan,
    EngineeringRunRole, EngineeringWorkerRequest, EngineeringWriteLease,
    FutureAdapterIdentityBinding, KnownAdapter,
};

use super::*;

const BASE_SHA: &str = "1f05814c3e9d173e525234d69b3ce7f2d1b01a57";

fn digest(character: char) -> String {
    format!("sha256:{}", character.to_string().repeat(64))
}

fn registry_lease(id: &str, path: &str) -> EngineeringWriteLease {
    EngineeringWriteLease {
        lease_id: id.to_owned(),
        nonce: format!("{id}-nonce"),
        issued_at_unix_seconds: 100,
        expires_at_unix_seconds: 200,
        owned_path_prefixes: vec![path.to_owned()],
    }
}

fn source_writer() -> EngineeringWorkerRequest {
    EngineeringWorkerRequest {
        principal: EngineeringPrincipal::Adapter(EngineeringAdapterSlot::Known(
            KnownAdapter::Codex,
        )),
        instance_id: "codex-1".to_owned(),
        role: EngineeringRunRole::SourceWriter,
        base_sha: BASE_SHA.to_owned(),
        worktree: PathBuf::from("/worktrees/codex"),
        future_identity: None,
        write_lease: Some(registry_lease("registry-writer", "src/lib.rs")),
    }
}

fn verifier() -> EngineeringWorkerRequest {
    EngineeringWorkerRequest {
        principal: EngineeringPrincipal::Adapter(EngineeringAdapterSlot::Known(
            KnownAdapter::OpenCode,
        )),
        instance_id: "reviewer-1".to_owned(),
        role: EngineeringRunRole::IndependentVerifier,
        base_sha: BASE_SHA.to_owned(),
        worktree: PathBuf::from("/worktrees/reviewer"),
        future_identity: None,
        write_lease: None,
    }
}

fn plan() -> HarnessEngineeringPlanV1 {
    let mut plan = HarnessEngineeringPlanV1 {
        schema_version: "1.0.0".to_owned(),
        task_id: "task-001".to_owned(),
        plan_id: "plan-001".to_owned(),
        goal_spec_digest: digest('a'),
        context_bundle_digest: digest('b'),
        repository_id: "sirinx-co".to_owned(),
        expected_clean_start: true,
        run_plan: EngineeringRunPlan {
            mode: EngineeringRunMode::SourceWriting,
            repository_root: PathBuf::from("/repo"),
            worktree_root: PathBuf::from("/worktrees"),
            base_sha: BASE_SHA.to_owned(),
            evaluated_at_unix_seconds: 110,
            workers: vec![source_writer(), verifier()],
        },
        path_leases: vec![PathLeaseV1 {
            schema_version: "1.0.0".to_owned(),
            lease_id: "lease-001".to_owned(),
            task_id: "task-001".to_owned(),
            plan_digest: digest('0'),
            scope_digest: digest('0'),
            principal_id: "known:codex:codex-1".to_owned(),
            instance_id: "codex-1".to_owned(),
            worktree: "/worktrees/codex".to_owned(),
            base_sha: BASE_SHA.to_owned(),
            exact_paths: vec!["src/lib.rs".to_owned()],
            issued_at_unix_seconds: 100,
            expires_at_unix_seconds: 200,
            nonce: "lease-nonce-001".to_owned(),
            max_files: 1,
            max_bytes: 10_000,
            lease_digest: digest('0'),
        }],
        test_command_ids: vec![TestCommandId::RustControlHarnessTests],
        stop_conditions: MANDATORY_STOP_CONDITIONS.into_iter().collect(),
        budgets: HarnessBudgetsV1 {
            max_active_agents: 3,
            max_writers: 2,
            independent_verifiers: 1,
            max_repair_cycles: 2,
            max_test_commands: 4,
            max_command_seconds: 300,
            max_run_seconds: 3_600,
        },
        denials: HarnessDenialsV1::all_denied(),
        evaluated_at_unix_seconds: 110,
        issued_at_unix_seconds: plan.evaluated_at_unix_seconds,
        expires_at_unix_seconds: 200,
        nonce: "plan-nonce-001".to_owned(),
        plan_digest: digest('0'),
        scope_digest: digest('0'),
    };
    plan.scope_digest = scope_digest_for(&plan);
    plan.plan_digest = plan_digest_for(&plan);
    plan.path_leases[0].scope_digest = plan.scope_digest.clone();
    plan.path_leases[0].plan_digest = plan.plan_digest.clone();
    plan.path_leases[0].lease_digest = lease_digest_for(&plan.path_leases[0]);
    plan
}

fn grant(plan: &HarnessEngineeringPlanV1) -> AdmissionGrantV1 {
    let mut grant = AdmissionGrantV1 {
        schema_version: "1.0.0".to_owned(),
        task_id: plan.task_id.clone(),
        action: "local_harness_engineering_source_write_and_tests".to_owned(),
        plan_digest: plan.plan_digest.clone(),
        scope_digest: plan.scope_digest.clone(),
        base_sha: BASE_SHA.to_owned(),
        approver_principal: "human-owner".to_owned(),
        issued_at_unix_seconds: 100,
        expires_at_unix_seconds: 180,
        nonce: "grant-nonce-001".to_owned(),
        max_repair_cycles: 2,
        decision: AdmissionDecision::Approve,
        grant_digest: digest('0'),
    };
    grant.grant_digest = grant_digest_for(&grant);
    grant
}

fn context(plan: &HarnessEngineeringPlanV1) -> RetrievalEvidenceV1 {
    RetrievalEvidenceV1 {
        schema_version: "1.0.0".to_owned(),
        command_id: RETRIEVAL_COMMAND_ID.to_owned(),
        context_bundle: ContextBundleRefV1 {
            schema_version: "1.0.0".to_owned(),
            task_id: plan.task_id.clone(),
            goal_spec_digest: plan.goal_spec_digest.clone(),
            repository_id: plan.repository_id.clone(),
            base_sha: BASE_SHA.to_owned(),
            graph_snapshot_digest: digest('c'),
            obsidian_snapshot_digest: None,
            query_digest: digest('d'),
            item_count: 2,
            total_text_bytes: 200,
            provider_calls: 0,
            external_calls: 0,
            bundle_digest: plan.context_bundle_digest.clone(),
        },
        stdout_sha256: digest('e'),
        stderr_sha256: digest('f'),
        stdout_bytes: 512,
        stderr_bytes: 0,
        exit_code: 0,
        fixed_argv_verified: true,
        shell_used: false,
        network_denied: true,
        provider_environment_scrubbed: true,
        provider_calls: 0,
        external_calls: 0,
        secret_output_detected: false,
        secret_private_read_detected: false,
        external_write_attempted: false,
        deploy_attempted: false,
        push_attempted: false,
        message_send_attempted: false,
        raw_query_persisted: false,
        vault_inventory_attempted: false,
        vault_projection_attempted: false,
    }
}

fn maker_receipt(lease: &PathLeaseV1) -> MakerReceiptV1 {
    let started_at_unix_seconds = lease.issued_at_unix_seconds.saturating_add(1).max(120);
    let git_evidence = GitDiffEvidenceV1 {
        schema_version: "1.0.0".to_owned(),
        repository_root: "/repo".to_owned(),
        worktree: lease.worktree.clone(),
        observed_head_sha: BASE_SHA.to_owned(),
        clean_start_observed: true,
        fixed_argv_verified: true,
        shell_used: false,
        collector_network_denied: true,
        provider_environment_scrubbed: true,
        provider_calls: 0,
        external_calls: 0,
        secret_output_detected: false,
        secret_private_read_detected: false,
        external_write_attempted: false,
        deploy_attempted: false,
        push_attempted: false,
        message_send_attempted: false,
        diff_sha256: digest('1'),
        changed_paths: vec![ChangedPathV1 {
            path: "src/lib.rs".to_owned(),
            previous_path: None,
            status: GitPathStatus::Modified,
            bytes_changed: 50,
        }],
    };
    let git_evidence_digest = git_evidence_digest_for(&git_evidence);
    MakerReceiptV1 {
        principal_id: lease.principal_id.clone(),
        lease_digest: lease.lease_digest.clone(),
        patch_digest: digest('1'),
        artifact_digests: vec![git_evidence_digest],
        git_evidence,
        started_at_unix_seconds,
        finished_at_unix_seconds: started_at_unix_seconds + 1,
        provider_calls: 0,
        external_calls: 0,
        network_denied: true,
        provider_environment_scrubbed: true,
        secret_output_detected: false,
        secret_private_read_detected: false,
        external_write_attempted: false,
        deploy_attempted: false,
        push_attempted: false,
        message_send_attempted: false,
    }
}

fn replacement_lease(
    plan: &HarnessEngineeringPlanV1,
    cycle: u8,
    issued_at_unix_seconds: u64,
) -> PathLeaseV1 {
    let mut lease = plan.path_leases[0].clone();
    lease.lease_id = format!("lease-repair-{cycle}");
    lease.nonce = format!("lease-repair-nonce-{cycle}");
    lease.issued_at_unix_seconds = issued_at_unix_seconds;
    lease.expires_at_unix_seconds = plan.expires_at_unix_seconds;
    lease.lease_digest = lease_digest_for(&lease);
    lease
}

fn test_receipt(passed: bool, started_at_unix_seconds: u64) -> TestExecutionReceiptV1 {
    TestExecutionReceiptV1 {
        command_id: TestCommandId::RustControlHarnessTests,
        exit_code: if passed { 0 } else { 1 },
        stdout_sha256: digest('3'),
        stderr_sha256: digest('4'),
        stdout_bytes: 120,
        stderr_bytes: 0,
        fixed_argv_verified: true,
        shell_used: false,
        network_denied: true,
        provider_environment_scrubbed: true,
        secret_output_detected: false,
        secret_private_read_detected: false,
        external_write_attempted: false,
        deploy_attempted: false,
        push_attempted: false,
        message_send_attempted: false,
        timed_out: false,
        started_at_unix_seconds,
        finished_at_unix_seconds: started_at_unix_seconds + 1,
        provider_calls: 0,
        external_calls: 0,
    }
}

fn ready_run() -> (
    HarnessEngineeringPlanV1,
    HarnessEngineeringRunV1,
    AdmissionNonceLedgerV1,
) {
    let plan = plan();
    let mut run = HarnessEngineeringRunV1::new(plan.clone(), "run-001", 110).unwrap();
    run.load_context(&context(&plan), "retrieval-port", 111)
        .unwrap();
    let mut nonce_ledger = AdmissionNonceLedgerV1::default();
    run.admit(&grant(&plan), &mut nonce_ledger, 112).unwrap();
    run.start_makers(113).unwrap();
    (plan, run, nonce_ledger)
}

#[test]
fn harness_engineering_happy_path_requires_tests_and_independent_verifier() {
    let (plan, mut run, _nonce_ledger) = ready_run();
    run.complete_makers(&[maker_receipt(&plan.path_leases[0])], 121)
        .unwrap();
    run.record_tests(&[test_receipt(true, 122)], 124).unwrap();
    run.begin_verification(125).unwrap();
    let reviewed_head = run.receipt_head().to_owned();
    let patch = run
        .receipt_events()
        .iter()
        .rev()
        .find_map(|event| event.patch_digest.clone())
        .unwrap();
    run.finish_verification(
        &VerifierReceiptV1 {
            principal_id: "known:opencode:reviewer-1".to_owned(),
            reviewed_chain_head: reviewed_head,
            reviewed_patch_digest: patch,
            decision: VerifierDecision::Pass,
            artifact_digests: vec![digest('5')],
            has_write_lease: false,
            provider_calls: 0,
            external_calls: 0,
            network_denied: true,
            provider_environment_scrubbed: true,
            secret_output_detected: false,
            secret_private_read_detected: false,
            external_write_attempted: false,
            deploy_attempted: false,
            push_attempted: false,
            message_send_attempted: false,
            started_at_unix_seconds: 126,
            finished_at_unix_seconds: 127,
        },
        127,
    )
    .unwrap();
    assert_eq!(run.state(), HarnessState::ValidationPassed);
    run.verify_chain().unwrap();
    assert!(run
        .receipt_events()
        .iter()
        .all(|event| event.provider_calls == 0 && event.external_calls == 0));
}

#[test]
fn out_of_lease_change_is_a_nonrepairable_policy_stop() {
    let (plan, mut run, _nonce_ledger) = ready_run();
    let mut receipt = maker_receipt(&plan.path_leases[0]);
    receipt.git_evidence.changed_paths[0].path = "src/outside.rs".to_owned();
    assert!(matches!(
        run.complete_makers(&[receipt], 121),
        Err(HarnessRunError::GitGuard(GitGuardError::OutOfLeasePath(_)))
    ));
    assert_eq!(run.state(), HarnessState::StoppedPolicy);
}

#[test]
fn repair_budget_is_bounded_to_two_cycles() {
    let (plan, mut run, mut nonce_ledger) = ready_run();
    let mut active_lease = plan.path_leases[0].clone();
    for cycle in 0..=2 {
        run.complete_makers(&[maker_receipt(&active_lease)], 121 + cycle as u64 * 10)
            .unwrap();
        run.record_tests(
            &[test_receipt(false, 122 + cycle as u64 * 10)],
            124 + cycle as u64 * 10,
        )
        .unwrap();
        if cycle < 2 {
            active_lease = replacement_lease(&plan, cycle + 1, 125 + cycle as u64 * 10);
            run.request_repair(
                vec![active_lease.clone()],
                &mut nonce_ledger,
                125 + cycle as u64 * 10,
            )
            .unwrap();
            assert_eq!(run.state(), HarnessState::MakersRunning);
        }
    }
    assert!(matches!(
        run.request_repair(
            vec![replacement_lease(&plan, 3, 150)],
            &mut nonce_ledger,
            150,
        ),
        Err(HarnessRunError::RepairBudgetExhausted)
    ));
    assert_eq!(run.state(), HarnessState::Failed);
}

#[test]
fn verifier_cannot_be_a_writer_or_hold_a_write_lease() {
    let (plan, mut run, _nonce_ledger) = ready_run();
    run.complete_makers(&[maker_receipt(&plan.path_leases[0])], 121)
        .unwrap();
    run.record_tests(&[test_receipt(true, 122)], 124).unwrap();
    run.begin_verification(125).unwrap();
    let patch = run
        .receipt_events()
        .iter()
        .rev()
        .find_map(|event| event.patch_digest.clone())
        .unwrap();
    assert!(matches!(
        run.finish_verification(
            &VerifierReceiptV1 {
                principal_id: plan.path_leases[0].principal_id.clone(),
                reviewed_chain_head: run.receipt_head().to_owned(),
                reviewed_patch_digest: patch,
                decision: VerifierDecision::Pass,
                artifact_digests: vec![],
                has_write_lease: true,
                provider_calls: 0,
                external_calls: 0,
                network_denied: true,
                provider_environment_scrubbed: true,
                secret_output_detected: false,
                secret_private_read_detected: false,
                external_write_attempted: false,
                deploy_attempted: false,
                push_attempted: false,
                message_send_attempted: false,
                started_at_unix_seconds: 126,
                finished_at_unix_seconds: 127,
            },
            127,
        ),
        Err(HarnessRunError::VerifierIdentityMismatch)
    ));
    assert_eq!(run.state(), HarnessState::StoppedPolicy);
}

#[test]
fn receipt_tampering_is_detected_on_read_back() {
    let (_plan, run, _nonce_ledger) = ready_run();
    let mut events = run.receipt_events().to_vec();
    let expected_head = run.receipt_head().to_owned();
    events[0].actor_principal = "tampered".to_owned();
    let identity = ReceiptIdentityV1 {
        task_id: events[0].task_id.clone(),
        run_id: events[0].run_id.clone(),
        goal_spec_digest: events[0].goal_spec_digest.clone(),
        plan_digest: events[0].plan_digest.clone(),
        scope_digest: events[0].scope_digest.clone(),
        context_bundle_digest: events[0].context_bundle_digest.clone(),
        base_sha: events[0].base_sha.clone(),
    };
    assert!(matches!(
        ReceiptChainV1::verify_restored(&events, &identity, &expected_head),
        Err(ReceiptChainError::Integrity)
    ));
}

#[test]
fn protected_harness_paths_cannot_be_leased() {
    let mut plan = plan();
    plan.path_leases[0].exact_paths =
        vec!["crates/sirinx-control/src/harness_engineering/state.rs".to_owned()];
    plan.scope_digest = scope_digest_for(&plan);
    plan.plan_digest = plan_digest_for(&plan);
    plan.path_leases[0].scope_digest = plan.scope_digest.clone();
    plan.path_leases[0].plan_digest = plan.plan_digest.clone();
    plan.path_leases[0].lease_digest = lease_digest_for(&plan.path_leases[0]);
    assert!(matches!(
        plan.validate(),
        Err(HarnessContractError::ProtectedHarnessPath(_))
    ));
}

#[test]
fn restart_of_nonterminal_run_requires_manual_recovery_review() {
    let (_plan, mut run, _nonce_ledger) = ready_run();
    run.mark_restart_detected(120).unwrap();
    assert_eq!(run.state(), HarnessState::RecoveryReviewRequired);
}

#[test]
fn admission_grant_nonce_is_one_use_across_runs_with_a_shared_ledger() {
    let plan = plan();
    let grant = grant(&plan);
    let mut first = HarnessEngineeringRunV1::new(plan.clone(), "run-first", 110).unwrap();
    let mut second = HarnessEngineeringRunV1::new(plan.clone(), "run-second", 110).unwrap();
    first
        .load_context(&context(&plan), "retrieval-port", 111)
        .unwrap();
    second
        .load_context(&context(&plan), "retrieval-port", 111)
        .unwrap();
    let mut nonce_ledger = AdmissionNonceLedgerV1::default();
    first.admit(&grant, &mut nonce_ledger, 112).unwrap();
    assert!(nonce_ledger.contains(&grant.nonce));
    let admission = first
        .receipt_events()
        .iter()
        .find(|event| {
            event.from_state == HarnessState::ContextReady
                && event.to_state == HarnessState::AdmissionValidated
        })
        .unwrap();
    assert!(admission.artifact_digests.contains(&grant.grant_digest));
    assert_eq!(admission.artifact_digests.len(), 2);
    assert!(matches!(
        second.admit(&grant, &mut nonce_ledger, 112),
        Err(HarnessRunError::GrantAlreadyConsumed)
    ));
    assert_eq!(second.state(), HarnessState::StoppedPolicy);
}

#[test]
fn repair_rejects_the_consumed_original_lease() {
    let (plan, mut run, mut nonce_ledger) = ready_run();
    run.complete_makers(&[maker_receipt(&plan.path_leases[0])], 121)
        .unwrap();
    run.record_tests(&[test_receipt(false, 122)], 124).unwrap();
    assert!(matches!(
        run.request_repair(plan.path_leases.clone(), &mut nonce_ledger, 125),
        Err(HarnessRunError::ReplacementLeaseMismatch)
    ));
    assert_eq!(run.state(), HarnessState::StoppedPolicy);
}

#[test]
fn repair_rejects_a_reused_nonce_even_if_other_lease_fields_change() {
    let (plan, mut run, mut nonce_ledger) = ready_run();
    run.complete_makers(&[maker_receipt(&plan.path_leases[0])], 121)
        .unwrap();
    run.record_tests(&[test_receipt(false, 122)], 124).unwrap();
    let first_repair = replacement_lease(&plan, 1, 125);
    run.request_repair(vec![first_repair.clone()], &mut nonce_ledger, 125)
        .unwrap();
    run.complete_makers(&[maker_receipt(&first_repair)], 131)
        .unwrap();
    run.record_tests(&[test_receipt(false, 132)], 134).unwrap();

    let mut reused_nonce = replacement_lease(&plan, 2, 135);
    reused_nonce.nonce = first_repair.nonce;
    reused_nonce.lease_digest = lease_digest_for(&reused_nonce);
    assert!(matches!(
        run.request_repair(vec![reused_nonce], &mut nonce_ledger, 135),
        Err(HarnessRunError::ReplacementLeaseMismatch)
    ));
    assert_eq!(run.state(), HarnessState::StoppedPolicy);
}

#[test]
fn expired_run_is_stopped_before_accepting_maker_evidence() {
    let (plan, mut run, _nonce_ledger) = ready_run();
    assert!(matches!(
        run.complete_makers(&[maker_receipt(&plan.path_leases[0])], 200),
        Err(HarnessRunError::RunTimeBudgetExceeded)
    ));
    assert_eq!(run.state(), HarnessState::StoppedPolicy);
}

#[test]
fn timed_out_test_evidence_is_a_nonrepairable_policy_stop() {
    let (plan, mut run, _nonce_ledger) = ready_run();
    run.complete_makers(&[maker_receipt(&plan.path_leases[0])], 121)
        .unwrap();
    let mut receipt = test_receipt(false, 122);
    receipt.timed_out = true;
    assert!(matches!(
        run.record_tests(&[receipt], 124),
        Err(HarnessRunError::TestEvidencePolicyViolation)
    ));
    assert_eq!(run.state(), HarnessState::StoppedPolicy);
}

#[test]
fn maker_missing_network_denial_is_a_nonrepairable_policy_stop() {
    let (plan, mut run, _nonce_ledger) = ready_run();
    let mut receipt = maker_receipt(&plan.path_leases[0]);
    receipt.network_denied = false;
    assert!(matches!(
        run.complete_makers(&[receipt], 121),
        Err(HarnessRunError::ForbiddenEffect)
    ));
    assert_eq!(run.state(), HarnessState::StoppedPolicy);
}

#[test]
fn verifier_must_supply_nonempty_independent_evidence() {
    let (plan, mut run, _nonce_ledger) = ready_run();
    run.complete_makers(&[maker_receipt(&plan.path_leases[0])], 121)
        .unwrap();
    run.record_tests(&[test_receipt(true, 122)], 124).unwrap();
    run.begin_verification(125).unwrap();
    let reviewed_chain_head = run.receipt_head().to_owned();
    let reviewed_patch_digest = run
        .receipt_events()
        .iter()
        .rev()
        .find_map(|event| event.patch_digest.clone())
        .unwrap();
    assert!(matches!(
        run.finish_verification(
            &VerifierReceiptV1 {
                principal_id: "known:opencode:reviewer-1".to_owned(),
                reviewed_chain_head,
                reviewed_patch_digest,
                decision: VerifierDecision::Pass,
                artifact_digests: vec![],
                has_write_lease: false,
                provider_calls: 0,
                external_calls: 0,
                network_denied: true,
                provider_environment_scrubbed: true,
                secret_output_detected: false,
                secret_private_read_detected: false,
                external_write_attempted: false,
                deploy_attempted: false,
                push_attempted: false,
                message_send_attempted: false,
                started_at_unix_seconds: 126,
                finished_at_unix_seconds: 127,
            },
            127,
        ),
        Err(HarnessRunError::VerifierIdentityMismatch)
    ));
    assert_eq!(run.state(), HarnessState::StoppedPolicy);
}

#[test]
fn restored_chain_requires_the_external_head_anchor() {
    let (_plan, run, _nonce_ledger) = ready_run();
    let events = run.receipt_events();
    let identity = ReceiptIdentityV1 {
        task_id: events[0].task_id.clone(),
        run_id: events[0].run_id.clone(),
        goal_spec_digest: events[0].goal_spec_digest.clone(),
        plan_digest: events[0].plan_digest.clone(),
        scope_digest: events[0].scope_digest.clone(),
        context_bundle_digest: events[0].context_bundle_digest.clone(),
        base_sha: events[0].base_sha.clone(),
    };
    assert!(matches!(
        ReceiptChainV1::verify_restored(events, &identity, &digest('9')),
        Err(ReceiptChainError::ExternalAnchorMismatch)
    ));
}

#[test]
fn rehashed_chain_with_an_illegal_state_transition_is_rejected() {
    let (_plan, run, _nonce_ledger) = ready_run();
    let mut events = run.receipt_events().to_vec();
    let identity = ReceiptIdentityV1 {
        task_id: events[0].task_id.clone(),
        run_id: events[0].run_id.clone(),
        goal_spec_digest: events[0].goal_spec_digest.clone(),
        plan_digest: events[0].plan_digest.clone(),
        scope_digest: events[0].scope_digest.clone(),
        context_bundle_digest: events[0].context_bundle_digest.clone(),
        base_sha: events[0].base_sha.clone(),
    };
    events[0].to_state = HarnessState::Ready;
    for index in 0..events.len() {
        if index > 0 {
            events[index].previous_hash = events[index - 1].chain_hash.clone();
        }
        events[index].chain_hash = receipt_hash_for(&events[index]);
    }
    let fabricated_head = events.last().unwrap().chain_hash.clone();
    assert!(matches!(
        ReceiptChainV1::verify_restored(&events, &identity, &fabricated_head),
        Err(ReceiptChainError::Integrity)
    ));
}

#[test]
fn declared_agent_budget_must_cover_the_actual_plan() {
    let mut plan = plan();
    plan.budgets.max_active_agents = 1;
    plan.plan_digest = plan_digest_for(&plan);
    plan.path_leases[0].plan_digest = plan.plan_digest.clone();
    plan.path_leases[0].lease_digest = lease_digest_for(&plan.path_leases[0]);
    assert!(matches!(
        plan.validate(),
        Err(HarnessContractError::ActualWorkerCountExceedsBudget)
    ));
}

#[test]
fn lease_principal_must_bind_the_exact_planned_worker() {
    let mut plan = plan();
    plan.path_leases[0].principal_id = "known:opencode:reviewer-1".to_owned();
    plan.scope_digest = scope_digest_for(&plan);
    plan.plan_digest = plan_digest_for(&plan);
    plan.path_leases[0].scope_digest = plan.scope_digest.clone();
    plan.path_leases[0].plan_digest = plan.plan_digest.clone();
    plan.path_leases[0].lease_digest = lease_digest_for(&plan.path_leases[0]);
    assert!(matches!(
        plan.validate(),
        Err(HarnessContractError::LeaseWorkerMismatch)
    ));
}

#[test]
fn dependency_and_command_surfaces_are_protected_from_writer_leases() {
    for protected in [
        "Cargo.toml",
        "crates/sirinx-control/Cargo.toml",
        ".cargo/config.toml",
        "package.json",
        "services/dev-control-api/src/local-rag.test.mjs",
    ] {
        let mut plan = plan();
        plan.path_leases[0].exact_paths = vec![protected.to_owned()];
        plan.scope_digest = scope_digest_for(&plan);
        plan.plan_digest = plan_digest_for(&plan);
        plan.path_leases[0].scope_digest = plan.scope_digest.clone();
        plan.path_leases[0].plan_digest = plan.plan_digest.clone();
        plan.path_leases[0].lease_digest = lease_digest_for(&plan.path_leases[0]);
        assert!(matches!(
            plan.validate(),
            Err(HarnessContractError::ProtectedHarnessPath(_))
        ));
    }
}

#[test]
fn command_catalog_contains_fixed_argv_and_no_shell() {
    for id in [
        TestCommandId::RustAgentsRegistryTests,
        TestCommandId::RustGoalUnitTests,
        TestCommandId::RustGoalProfileTests,
        TestCommandId::RustControlHarnessTests,
        TestCommandId::GraphMemoryTests,
        TestCommandId::NodeLocalRagDeprecationTests,
    ] {
        let spec = command_spec(id);
        assert_ne!(spec.executable, "sh");
        assert_ne!(spec.executable, "bash");
        assert!(spec.network_denied_required);
        assert!(spec.provider_environment_scrub_required);
        assert!(spec.timeout_seconds <= MAX_COMMAND_SECONDS);
    }
}

#[test]
fn plan_rejects_missing_mandatory_stop_condition() {
    let mut plan = plan();
    plan.stop_conditions = BTreeSet::new();
    plan.plan_digest = plan_digest_for(&plan);
    plan.path_leases[0].plan_digest = plan.plan_digest.clone();
    plan.path_leases[0].lease_digest = lease_digest_for(&plan.path_leases[0]);
    assert!(matches!(
        plan.validate(),
        Err(HarnessContractError::MandatoryStopConditionMissing)
    ));
}

#[test]
fn plan_digest_binds_run_mode_future_identity_registry_lease_and_initial_lease() {
    let baseline = plan();
    let baseline_digest = plan_digest_for(&baseline);

    let mut run_mode_changed = baseline.clone();
    run_mode_changed.run_plan.mode = EngineeringRunMode::ReadOnly;
    assert_ne!(baseline_digest, plan_digest_for(&run_mode_changed));

    let mut future_identity_changed = baseline.clone();
    future_identity_changed.run_plan.workers[0].future_identity =
        Some(FutureAdapterIdentityBinding {
            canonical_name: "future-codex".to_owned(),
            binary_name: "future-codex".to_owned(),
            version: "1.0.0".to_owned(),
            immutable_source_sha256: digest('8'),
        });
    assert_ne!(baseline_digest, plan_digest_for(&future_identity_changed));

    let mut registry_lease_changed = baseline.clone();
    registry_lease_changed.run_plan.workers[0]
        .write_lease
        .as_mut()
        .unwrap()
        .nonce = "different-registry-nonce".to_owned();
    assert_ne!(baseline_digest, plan_digest_for(&registry_lease_changed));

    let mut initial_lease_changed = baseline.clone();
    initial_lease_changed.path_leases[0].nonce = "different-path-lease-nonce".to_owned();
    assert_ne!(baseline_digest, plan_digest_for(&initial_lease_changed));
}

#[test]
fn shared_ledger_rejects_same_initial_lease_under_a_fresh_grant() {
    let plan = plan();
    let mut first = HarnessEngineeringRunV1::new(plan.clone(), "run-first-lease", 110).unwrap();
    let mut second = HarnessEngineeringRunV1::new(plan.clone(), "run-second-lease", 110).unwrap();
    first
        .load_context(&context(&plan), "retrieval-port", 111)
        .unwrap();
    second
        .load_context(&context(&plan), "retrieval-port", 111)
        .unwrap();
    let mut ledger = AdmissionNonceLedgerV1::default();
    first.admit(&grant(&plan), &mut ledger, 112).unwrap();
    let mut fresh_grant = grant(&plan);
    fresh_grant.nonce = "grant-nonce-fresh".to_owned();
    fresh_grant.grant_digest = grant_digest_for(&fresh_grant);
    assert!(matches!(
        second.admit(&fresh_grant, &mut ledger, 112),
        Err(HarnessRunError::LeaseAlreadyConsumed)
    ));
    second.verify_chain().unwrap();
}

#[test]
fn evidence_before_phase_entry_stops_with_a_valid_denial_chain() {
    let (plan, mut run, _ledger) = ready_run();
    let mut receipt = maker_receipt(&plan.path_leases[0]);
    receipt.started_at_unix_seconds = 112;
    receipt.finished_at_unix_seconds = 112;
    assert!(matches!(
        run.complete_makers(&[receipt], 121),
        Err(HarnessRunError::ForbiddenEffect)
    ));
    assert_eq!(run.state(), HarnessState::StoppedPolicy);
    run.verify_chain().unwrap();
}

#[test]
fn rewound_caller_time_stops_at_the_last_monotonic_phase_time() {
    let (plan, mut run, _ledger) = ready_run();
    assert!(matches!(
        run.complete_makers(&[maker_receipt(&plan.path_leases[0])], 112),
        Err(HarnessRunError::RunTimeBudgetExceeded)
    ));
    assert_eq!(run.state(), HarnessState::StoppedPolicy);
    run.verify_chain().unwrap();
}

#[test]
fn patch_digest_must_equal_the_independently_collected_diff_digest() {
    let (plan, mut run, _ledger) = ready_run();
    let mut receipt = maker_receipt(&plan.path_leases[0]);
    receipt.patch_digest = digest('9');
    assert!(matches!(
        run.complete_makers(&[receipt], 121),
        Err(HarnessRunError::MakerLeaseMismatch)
    ));
    assert_eq!(run.state(), HarnessState::StoppedPolicy);
}

#[test]
fn rename_must_bind_both_paths_inside_the_exact_lease() {
    let (plan, mut run, _ledger) = ready_run();
    let mut receipt = maker_receipt(&plan.path_leases[0]);
    receipt.git_evidence.changed_paths[0].status = GitPathStatus::Renamed;
    receipt.git_evidence.changed_paths[0].previous_path = Some("src/outside.rs".to_owned());
    receipt.artifact_digests = vec![git_evidence_digest_for(&receipt.git_evidence)];
    assert!(matches!(
        run.complete_makers(&[receipt], 121),
        Err(HarnessRunError::GitGuard(GitGuardError::OutOfLeasePath(_)))
    ));
}

#[test]
fn missing_effect_attestation_is_never_converted_to_zero() {
    let (plan, mut run, _ledger) = ready_run();
    run.complete_makers(&[maker_receipt(&plan.path_leases[0])], 121)
        .unwrap();
    let mut receipt = test_receipt(true, 122);
    receipt.provider_calls = 1;
    assert!(matches!(
        run.record_tests(&[receipt], 124),
        Err(HarnessRunError::TestEvidencePolicyViolation)
    ));
    assert_eq!(run.state(), HarnessState::StoppedPolicy);
}

#[test]
fn registry_lease_must_cover_the_final_exact_path_lease() {
    let mut plan = plan();
    plan.run_plan.workers[0]
        .write_lease
        .as_mut()
        .unwrap()
        .owned_path_prefixes = vec!["src/other.rs".to_owned()];
    plan.plan_digest = plan_digest_for(&plan);
    plan.path_leases[0].plan_digest = plan.plan_digest.clone();
    plan.path_leases[0].lease_digest = lease_digest_for(&plan.path_leases[0]);
    assert!(matches!(
        plan.validate(),
        Err(HarnessContractError::LeaseWorkerMismatch)
    ));
}

#[test]
fn nested_instruction_dependency_and_secret_surfaces_are_protected() {
    for protected in [
        "apps/web/package.json",
        "apps/web/node_modules/tool/index.js",
        "nested/AGENTS.md",
        "nested/CLAUDE.md",
        "nested/.claude/settings.json",
        "nested/.codex/config.toml",
        "nested/.env.production",
        "nested/private.key",
        "nested/rust-toolchain.toml",
        "nested/vitest.config.ts",
    ] {
        let mut plan = plan();
        plan.run_plan.workers[0]
            .write_lease
            .as_mut()
            .unwrap()
            .owned_path_prefixes = vec![protected.to_owned()];
        plan.path_leases[0].exact_paths = vec![protected.to_owned()];
        plan.scope_digest = scope_digest_for(&plan);
        plan.plan_digest = plan_digest_for(&plan);
        plan.path_leases[0].scope_digest = plan.scope_digest.clone();
        plan.path_leases[0].plan_digest = plan.plan_digest.clone();
        plan.path_leases[0].lease_digest = lease_digest_for(&plan.path_leases[0]);
        assert!(matches!(
            plan.validate(),
            Err(HarnessContractError::ProtectedHarnessPath(_))
        ));
    }
}

#[test]
fn rehashed_chain_with_wrong_event_kind_is_rejected() {
    let (_plan, run, _ledger) = ready_run();
    let mut events = run.receipt_events().to_vec();
    let identity = ReceiptIdentityV1 {
        task_id: events[0].task_id.clone(),
        run_id: events[0].run_id.clone(),
        goal_spec_digest: events[0].goal_spec_digest.clone(),
        plan_digest: events[0].plan_digest.clone(),
        scope_digest: events[0].scope_digest.clone(),
        context_bundle_digest: events[0].context_bundle_digest.clone(),
        base_sha: events[0].base_sha.clone(),
    };
    events[0].event_kind = ReceiptEventKind::Test;
    for index in 0..events.len() {
        if index > 0 {
            events[index].previous_hash = events[index - 1].chain_hash.clone();
        }
        events[index].chain_hash = receipt_hash_for(&events[index]);
    }
    let fabricated_head = events.last().unwrap().chain_hash.clone();
    assert!(matches!(
        ReceiptChainV1::verify_restored(&events, &identity, &fabricated_head),
        Err(ReceiptChainError::Integrity)
    ));
}

#[test]
fn run_cannot_start_before_the_frozen_plan_evaluation_time() {
    let plan = plan();
    assert!(matches!(
        HarnessEngineeringRunV1::new(plan, "run-before-evaluation", 109),
        Err(HarnessRunError::PlanExpired)
    ));
}

#[test]
fn admission_grant_window_must_be_contained_by_the_frozen_plan() {
    let plan = plan();

    let mut issued_too_early = grant(&plan);
    issued_too_early.issued_at_unix_seconds = plan.evaluated_at_unix_seconds - 1;
    issued_too_early.grant_digest = grant_digest_for(&issued_too_early);
    assert!(matches!(
        issued_too_early.validate_for(&plan, 112),
        Err(HarnessContractError::InvalidGrantWindow)
    ));

    let mut expires_too_late = grant(&plan);
    expires_too_late.expires_at_unix_seconds = plan.expires_at_unix_seconds + 1;
    expires_too_late.grant_digest = grant_digest_for(&expires_too_late);
    assert!(matches!(
        expires_too_late.validate_for(&plan, 112),
        Err(HarnessContractError::InvalidGrantWindow)
    ));
}

#[test]
fn test_receipt_rejects_shell_execution_even_with_fixed_argv_attestation() {
    let (plan, mut run, _ledger) = ready_run();
    run.complete_makers(&[maker_receipt(&plan.path_leases[0])], 121)
        .unwrap();
    let mut receipt = test_receipt(true, 122);
    receipt.shell_used = true;
    assert!(matches!(
        run.record_tests(&[receipt], 124),
        Err(HarnessRunError::TestEvidencePolicyViolation)
    ));
    assert_eq!(run.state(), HarnessState::StoppedPolicy);
    run.verify_chain().unwrap();
}

#[test]
fn verification_state_is_not_entered_until_evidence_finishes() {
    let (plan, mut run, mut ledger) = ready_run();
    run.complete_makers(&[maker_receipt(&plan.path_leases[0])], 121)
        .unwrap();
    run.record_tests(&[test_receipt(true, 122)], 124)
        .unwrap();
    run.begin_verification(125).unwrap();
    let reviewed_chain_head = run.receipt_head().to_owned();
    let reviewed_patch_digest = run
        .receipt_events()
        .iter()
        .rev()
        .find_map(|event| event.patch_digest.clone())
        .unwrap();
    run.finish_verification(
        &VerifierReceiptV1 {
            principal_id: "known:opencode:reviewer-1".to_owned(),
            reviewed_chain_head,
            reviewed_patch_digest,
            decision: VerifierDecision::Fail,
            artifact_digests: vec![digest('5')],
            has_write_lease: false,
            provider_calls: 0,
            external_calls: 0,
            network_denied: true,
            provider_environment_scrubbed: true,
            secret_output_detected: false,
            secret_private_read_detected: false,
            external_write_attempted: false,
            deploy_attempted: false,
            push_attempted: false,
            message_send_attempted: false,
            started_at_unix_seconds: 126,
            finished_at_unix_seconds: 130,
        },
        130,
    )
    .unwrap();

    assert!(matches!(
        run.request_repair(
            vec![replacement_lease(&plan, 1, 130)],
            &mut ledger,
            129,
        ),
        Err(HarnessRunError::RunTimeBudgetExceeded)
    ));
    assert_eq!(run.state(), HarnessState::StoppedPolicy);
    run.verify_chain().unwrap();
}

#[test]
fn rewound_restart_marker_clamps_to_the_last_state_entry() {
    let (_plan, mut run, _ledger) = ready_run();
    run.mark_restart_detected(100).unwrap();
    let marker = run.receipt_events().last().unwrap();
    assert_eq!(marker.to_state, HarnessState::RecoveryReviewRequired);
    assert_eq!(marker.started_at_unix_seconds, 113);
    assert_eq!(marker.finished_at_unix_seconds, 113);
    run.verify_chain().unwrap();
}

#[test]
fn restored_chain_rejects_an_unsupported_schema_even_when_rehashed() {
    let (_plan, run, _ledger) = ready_run();
    let mut events = run.receipt_events().to_vec();
    let identity = ReceiptIdentityV1 {
        task_id: events[0].task_id.clone(),
        run_id: events[0].run_id.clone(),
        goal_spec_digest: events[0].goal_spec_digest.clone(),
        plan_digest: events[0].plan_digest.clone(),
        scope_digest: events[0].scope_digest.clone(),
        context_bundle_digest: events[0].context_bundle_digest.clone(),
        base_sha: events[0].base_sha.clone(),
    };
    events[0].schema_version = "2.0.0".to_owned();
    for index in 0..events.len() {
        if index > 0 {
            events[index].previous_hash = events[index - 1].chain_hash.clone();
        }
        events[index].chain_hash = receipt_hash_for(&events[index]);
    }
    let fabricated_head = events.last().unwrap().chain_hash.clone();
    assert!(matches!(
        ReceiptChainV1::verify_restored(&events, &identity, &fabricated_head),
        Err(ReceiptChainError::UnsupportedSchema)
    ));
}

#[test]
fn restored_chain_rejects_an_empty_genesis_only_sequence() {
    let plan = plan();
    let identity = ReceiptIdentityV1 {
        task_id: plan.task_id,
        run_id: "empty-restored-run".to_owned(),
        goal_spec_digest: plan.goal_spec_digest,
        plan_digest: plan.plan_digest,
        scope_digest: plan.scope_digest,
        context_bundle_digest: plan.context_bundle_digest,
        base_sha: plan.run_plan.base_sha,
    };
    assert!(matches!(
        ReceiptChainV1::verify_restored(&[], &identity, GENESIS_RECEIPT_HASH),
        Err(ReceiptChainError::EmptyRestoredChain)
    ));
}

#[test]
fn protected_paths_are_rejected_case_insensitively() {
    for protected in [
        "CARGO.TOML",
        "Nested/AGENTS.MD",
        "Nested/.EnV.Production",
        "Crates/SIRINX-Control/Src/Harness_Engineering/State.rs",
        "Tools/Graph-Memory/Server.py",
    ] {
        let mut plan = plan();
        plan.path_leases[0].exact_paths = vec![protected.to_owned()];
        plan.scope_digest = scope_digest_for(&plan);
        plan.plan_digest = plan_digest_for(&plan);
        plan.path_leases[0].scope_digest = plan.scope_digest.clone();
        plan.path_leases[0].plan_digest = plan.plan_digest.clone();
        plan.path_leases[0].lease_digest = lease_digest_for(&plan.path_leases[0]);
        assert!(matches!(
            plan.validate(),
            Err(HarnessContractError::ProtectedHarnessPath(_))
        ));
    }
}

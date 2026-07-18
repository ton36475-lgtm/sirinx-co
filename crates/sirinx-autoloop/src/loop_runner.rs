use std::time::Duration;

use serde::{Deserialize, Serialize};
use sirinx_core::{FailureEvent, FailureKind, Lesson, LessonGuidance};
use sirinx_store::{Store, StoreError};
use uuid::Uuid;

use crate::tool::{ApprovalGate, ToolError, ToolInvocation, ToolRegistry, ToolResult};

/// Configuration for one autonomous run.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoopConfig {
    /// Hard budget: the loop stops after this many steps no matter what.
    pub max_steps: usize,
    /// Governance gate applied to every side-effecting tool call.
    pub gate: ApprovalGate,
}

impl Default for LoopConfig {
    fn default() -> Self {
        Self {
            max_steps: 8,
            gate: ApprovalGate::DryRun,
        }
    }
}

/// Bounded retry policy for [`AutoLoop::run_with_recovery`]. Kept separate
/// from [`LoopConfig`] so existing callers using struct literals remain
/// source-compatible.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryConfig {
    /// Retries permitted after the initial attempt for each planned step.
    pub max_retries: usize,
    /// Delay before the first retry. Later delays double until capped.
    pub base_backoff_ms: u64,
    /// Hard delay ceiling for every retry.
    pub max_backoff_ms: u64,
    /// Optional caller-supplied correlation ID; a fresh ID is used otherwise.
    pub run_id: Option<Uuid>,
}

impl Default for RecoveryConfig {
    fn default() -> Self {
        Self {
            max_retries: 2,
            base_backoff_ms: 100,
            max_backoff_ms: 2_000,
            run_id: None,
        }
    }
}

impl RecoveryConfig {
    fn delay_before_retry(&self, completed_retries: usize) -> Duration {
        let shift = u32::try_from(completed_retries).unwrap_or(u32::MAX);
        let multiplier = 1_u64.checked_shl(shift).unwrap_or(u64::MAX);
        Duration::from_millis(
            self.base_backoff_ms
                .saturating_mul(multiplier)
                .min(self.max_backoff_ms),
        )
    }
}

/// One executed step, kept for the audit trail (Verify ก่อนเชื่อ —
/// every run leaves a reviewable record).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StepRecord {
    pub step: usize,
    pub invocation: ToolInvocation,
    pub result: ToolResult,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LoopOutcome {
    /// The planner reported the goal complete.
    Completed,
    /// The step budget ran out before completion.
    BudgetExhausted,
}

#[derive(Debug, thiserror::Error)]
pub enum LoopError {
    #[error(transparent)]
    Tool(#[from] ToolError),
}

/// Failures specific to the durable recovery path. Kept separate from
/// [`LoopError`] so existing exhaustive matches on synchronous runs compile
/// unchanged.
#[derive(Debug, thiserror::Error)]
pub enum RecoveryError {
    #[error(transparent)]
    Tool(#[from] ToolError),
    #[error(transparent)]
    Store(#[from] StoreError),
}

/// A planner decides the next tool call from the transcript so far.
/// Return `None` to declare the goal complete.
pub trait Planner {
    fn next_step(&mut self, history: &[StepRecord]) -> Option<ToolInvocation>;

    /// Apply already-learned, structured guidance to the arguments for one
    /// attempt. The tool name is supplied separately and cannot be changed by
    /// this hook. Existing planners keep their original arguments by default.
    fn apply_lessons(
        &mut self,
        _tool: &str,
        args: &serde_json::Value,
        _lessons: &[Lesson],
    ) -> serde_json::Value {
        args.clone()
    }

    /// Derive a non-executable guidance classification from a safe failure
    /// event. Existing planners receive a conservative default mapping.
    fn derive_lesson(&mut self, failure: &FailureEvent) -> LessonGuidance {
        failure.error_kind.default_guidance()
    }
}

/// Audit result for a recovery-aware run.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecoveryRun {
    pub run_id: Uuid,
    pub outcome: LoopOutcome,
    pub history: Vec<StepRecord>,
}

/// The plan → act → observe loop.
pub struct AutoLoop<'a> {
    registry: &'a ToolRegistry,
    config: LoopConfig,
}

impl<'a> AutoLoop<'a> {
    pub fn new(registry: &'a ToolRegistry, config: LoopConfig) -> Self {
        Self { registry, config }
    }

    /// Run until the planner declares completion or the budget is spent.
    pub fn run(
        &self,
        planner: &mut dyn Planner,
    ) -> Result<(LoopOutcome, Vec<StepRecord>), LoopError> {
        let mut history: Vec<StepRecord> = Vec::new();

        for step in 0..self.config.max_steps {
            let Some(invocation) = planner.next_step(&history) else {
                return Ok((LoopOutcome::Completed, history));
            };
            let result = self.registry.invoke(&invocation, &self.config.gate)?;
            history.push(StepRecord {
                step,
                invocation,
                result,
            });
        }
        Ok((LoopOutcome::BudgetExhausted, history))
    }

    /// Run with durable lessons and bounded retries. Each call to
    /// [`ToolRegistry::invoke`] consumes the same global `max_steps` budget,
    /// including failed attempts. Retrying never calls a tool directly, so the
    /// configured [`ApprovalGate`] is re-applied on every attempt.
    pub async fn run_with_recovery(
        &self,
        planner: &mut dyn Planner,
        store: &dyn Store,
        recovery: RecoveryConfig,
    ) -> Result<RecoveryRun, RecoveryError> {
        let run_id = recovery.run_id.unwrap_or_else(Uuid::new_v4);
        let mut history: Vec<StepRecord> = Vec::new();
        let mut attempts_used = 0_usize;

        while attempts_used < self.config.max_steps {
            let Some(base_invocation) = planner.next_step(&history) else {
                return Ok(RecoveryRun {
                    run_id,
                    outcome: LoopOutcome::Completed,
                    history,
                });
            };
            let mut completed_retries = 0_usize;

            loop {
                let lessons = store.lessons_for_tool(&base_invocation.tool).await?;
                let invocation = ToolInvocation {
                    tool: base_invocation.tool.clone(),
                    args: planner.apply_lessons(
                        &base_invocation.tool,
                        &base_invocation.args,
                        &lessons,
                    ),
                };

                attempts_used += 1;
                match self.registry.invoke(&invocation, &self.config.gate) {
                    Ok(result) => {
                        history.push(StepRecord {
                            step: attempts_used - 1,
                            invocation,
                            result,
                        });
                        break;
                    }
                    Err(error) => {
                        let error_kind = failure_kind(&error);
                        let failure = FailureEvent::new(
                            run_id,
                            &base_invocation.tool,
                            error_kind,
                            attempts_used,
                        );
                        store.record_failure(&failure).await?;
                        let guidance = planner.derive_lesson(&failure);
                        store
                            .upsert_lesson(&Lesson::new(
                                &base_invocation.tool,
                                error_kind,
                                guidance,
                            ))
                            .await?;

                        if error_kind == FailureKind::Unknown {
                            return Err(error.into());
                        }
                        if !self.registry.is_retry_safe(&base_invocation.tool) {
                            return Err(error.into());
                        }
                        if completed_retries >= recovery.max_retries {
                            return Err(error.into());
                        }
                        if attempts_used >= self.config.max_steps {
                            return Ok(RecoveryRun {
                                run_id,
                                outcome: LoopOutcome::BudgetExhausted,
                                history,
                            });
                        }

                        let delay = recovery.delay_before_retry(completed_retries);
                        completed_retries += 1;
                        tokio::time::sleep(delay).await;
                        // Re-enter the loop: lessons are reloaded and invoke
                        // re-applies the ApprovalGate for the retry.
                    }
                }
            }
        }

        Ok(RecoveryRun {
            run_id,
            outcome: LoopOutcome::BudgetExhausted,
            history,
        })
    }
}

fn failure_kind(error: &ToolError) -> FailureKind {
    match error {
        ToolError::BadArgs(_, _) => FailureKind::BadArgs,
        ToolError::Failed(_, _) => FailureKind::Failed,
        ToolError::Unknown(_) => FailureKind::Unknown,
    }
}

#[cfg(test)]
mod tests {
    use std::sync::atomic::{AtomicUsize, Ordering};
    use std::sync::Arc;

    use super::*;
    use crate::tool::Tool;
    use sirinx_store::MemoryStore;

    struct Counter;
    impl Tool for Counter {
        fn name(&self) -> &'static str {
            "count"
        }
        fn description(&self) -> &'static str {
            "returns the number it is given"
        }
        fn is_side_effecting(&self) -> bool {
            false
        }
        fn execute(&self, args: &serde_json::Value) -> Result<serde_json::Value, ToolError> {
            Ok(args.clone())
        }
    }

    struct SendCampaign;
    impl Tool for SendCampaign {
        fn name(&self) -> &'static str {
            "send_campaign"
        }
        fn description(&self) -> &'static str {
            "sends a marketing campaign (side effect)"
        }
        fn is_side_effecting(&self) -> bool {
            true
        }
        fn execute(&self, _args: &serde_json::Value) -> Result<serde_json::Value, ToolError> {
            Ok(serde_json::json!({ "sent": true }))
        }
    }

    struct RequiresSafeMode {
        calls: Arc<AtomicUsize>,
    }

    impl Tool for RequiresSafeMode {
        fn name(&self) -> &'static str {
            "requires_safe_mode"
        }

        fn description(&self) -> &'static str {
            "accepts only a safe structured mode"
        }

        fn is_side_effecting(&self) -> bool {
            false
        }

        fn is_retry_safe(&self) -> bool {
            true
        }

        fn execute(&self, args: &serde_json::Value) -> Result<serde_json::Value, ToolError> {
            self.calls.fetch_add(1, Ordering::SeqCst);
            if args.get("mode").and_then(serde_json::Value::as_str) == Some("safe") {
                Ok(serde_json::json!({ "accepted": true }))
            } else {
                Err(ToolError::BadArgs(
                    self.name().into(),
                    "mode was rejected; raw arguments are not persisted".into(),
                ))
            }
        }
    }

    struct AlwaysFails {
        calls: Arc<AtomicUsize>,
    }

    impl Tool for AlwaysFails {
        fn name(&self) -> &'static str {
            "always_fails"
        }

        fn description(&self) -> &'static str {
            "fails for retry-bound tests"
        }

        fn is_side_effecting(&self) -> bool {
            false
        }

        fn is_retry_safe(&self) -> bool {
            true
        }

        fn execute(&self, _args: &serde_json::Value) -> Result<serde_json::Value, ToolError> {
            self.calls.fetch_add(1, Ordering::SeqCst);
            Err(ToolError::Failed(
                self.name().into(),
                "internal detail that must not enter failure storage".into(),
            ))
        }
    }

    struct GatedFailure {
        calls: Arc<AtomicUsize>,
    }

    impl Tool for GatedFailure {
        fn name(&self) -> &'static str {
            "gated_failure"
        }

        fn description(&self) -> &'static str {
            "a side effect used to prove recovery preserves the gate"
        }

        fn is_side_effecting(&self) -> bool {
            true
        }

        fn execute(&self, _args: &serde_json::Value) -> Result<serde_json::Value, ToolError> {
            self.calls.fetch_add(1, Ordering::SeqCst);
            Err(ToolError::Failed(
                self.name().into(),
                "must stay gated".into(),
            ))
        }
    }

    /// Plans `n` count steps then finishes.
    struct FixedPlanner {
        remaining: usize,
        tool: &'static str,
    }

    impl Planner for FixedPlanner {
        fn next_step(&mut self, history: &[StepRecord]) -> Option<ToolInvocation> {
            if self.remaining == 0 {
                return None;
            }
            self.remaining -= 1;
            Some(ToolInvocation {
                tool: self.tool.into(),
                args: serde_json::json!({ "step": history.len() }),
            })
        }
    }

    struct GuidedPlanner {
        emitted: bool,
        lessons_derived: Arc<AtomicUsize>,
    }

    impl Planner for GuidedPlanner {
        fn next_step(&mut self, _history: &[StepRecord]) -> Option<ToolInvocation> {
            if self.emitted {
                return None;
            }
            self.emitted = true;
            Some(ToolInvocation {
                tool: "requires_safe_mode".into(),
                args: serde_json::json!({ "mode": "unsafe" }),
            })
        }

        fn apply_lessons(
            &mut self,
            _tool: &str,
            args: &serde_json::Value,
            lessons: &[Lesson],
        ) -> serde_json::Value {
            if lessons
                .iter()
                .any(|lesson| lesson.guidance == LessonGuidance::ValidateArguments)
            {
                serde_json::json!({ "mode": "safe" })
            } else {
                args.clone()
            }
        }

        fn derive_lesson(&mut self, failure: &FailureEvent) -> LessonGuidance {
            self.lessons_derived.fetch_add(1, Ordering::SeqCst);
            assert_eq!(failure.error_kind, FailureKind::BadArgs);
            LessonGuidance::ValidateArguments
        }
    }

    fn registry() -> ToolRegistry {
        let mut r = ToolRegistry::new();
        r.register(Box::new(Counter));
        r.register(Box::new(SendCampaign));
        r
    }

    fn recovery_config(run_id: Uuid, max_retries: usize) -> RecoveryConfig {
        RecoveryConfig {
            max_retries,
            base_backoff_ms: 0,
            max_backoff_ms: 0,
            run_id: Some(run_id),
        }
    }

    #[test]
    fn exponential_backoff_is_capped() {
        let config = RecoveryConfig {
            max_retries: 10,
            base_backoff_ms: 10,
            max_backoff_ms: 25,
            run_id: None,
        };
        assert_eq!(config.delay_before_retry(0), Duration::from_millis(10));
        assert_eq!(config.delay_before_retry(1), Duration::from_millis(20));
        assert_eq!(config.delay_before_retry(2), Duration::from_millis(25));
        assert_eq!(
            config.delay_before_retry(usize::MAX),
            Duration::from_millis(25)
        );
    }

    #[test]
    fn loop_completes_when_planner_is_done() {
        let registry = registry();
        let auto = AutoLoop::new(&registry, LoopConfig::default());
        let mut planner = FixedPlanner {
            remaining: 3,
            tool: "count",
        };
        let (outcome, history) = auto.run(&mut planner).unwrap();
        assert_eq!(outcome, LoopOutcome::Completed);
        assert_eq!(history.len(), 3);
    }

    #[test]
    fn budget_bounds_runaway_loops() {
        let registry = registry();
        let auto = AutoLoop::new(
            &registry,
            LoopConfig {
                max_steps: 5,
                gate: ApprovalGate::DryRun,
            },
        );
        // A planner that never finishes.
        let mut planner = FixedPlanner {
            remaining: usize::MAX,
            tool: "count",
        };
        let (outcome, history) = auto.run(&mut planner).unwrap();
        assert_eq!(outcome, LoopOutcome::BudgetExhausted);
        assert_eq!(history.len(), 5);
    }

    #[test]
    fn dry_run_records_plans_instead_of_side_effects() {
        let registry = registry();
        let auto = AutoLoop::new(&registry, LoopConfig::default());
        let mut planner = FixedPlanner {
            remaining: 1,
            tool: "send_campaign",
        };
        let (_, history) = auto.run(&mut planner).unwrap();
        assert!(matches!(history[0].result, ToolResult::Planned { .. }));
    }

    #[test]
    fn approved_gate_executes_side_effects() {
        let registry = registry();
        let auto = AutoLoop::new(
            &registry,
            LoopConfig {
                max_steps: 2,
                gate: ApprovalGate::approved("OPS-TICKET-42"),
            },
        );
        let mut planner = FixedPlanner {
            remaining: 1,
            tool: "send_campaign",
        };
        let (_, history) = auto.run(&mut planner).unwrap();
        assert_eq!(
            history[0].result,
            ToolResult::Executed {
                output: serde_json::json!({ "sent": true })
            }
        );
    }

    #[tokio::test]
    async fn failure_creates_lesson_guides_retry_and_guides_next_run_immediately() {
        let calls = Arc::new(AtomicUsize::new(0));
        let mut registry = ToolRegistry::new();
        registry.register(Box::new(RequiresSafeMode {
            calls: Arc::clone(&calls),
        }));
        let auto = AutoLoop::new(
            &registry,
            LoopConfig {
                max_steps: 4,
                gate: ApprovalGate::DryRun,
            },
        );
        let store = MemoryStore::default();

        let first_run_id = Uuid::new_v4();
        let first_derivations = Arc::new(AtomicUsize::new(0));
        let mut first_planner = GuidedPlanner {
            emitted: false,
            lessons_derived: Arc::clone(&first_derivations),
        };
        let first = auto
            .run_with_recovery(&mut first_planner, &store, recovery_config(first_run_id, 2))
            .await
            .unwrap();

        assert_eq!(first.outcome, LoopOutcome::Completed);
        assert_eq!(first.history.len(), 1);
        assert_eq!(first.history[0].step, 1);
        assert_eq!(calls.load(Ordering::SeqCst), 2);
        assert_eq!(first_derivations.load(Ordering::SeqCst), 1);
        let failures = store.failure_events_for_run(first_run_id).await.unwrap();
        assert_eq!(failures.len(), 1);
        assert_eq!(failures[0].error_kind, FailureKind::BadArgs);
        let lessons = store.lessons_for_tool("requires_safe_mode").await.unwrap();
        assert_eq!(lessons.len(), 1);
        assert_eq!(lessons[0].occurrences, 1);

        let second_run_id = Uuid::new_v4();
        let second_derivations = Arc::new(AtomicUsize::new(0));
        let mut second_planner = GuidedPlanner {
            emitted: false,
            lessons_derived: Arc::clone(&second_derivations),
        };
        let second = auto
            .run_with_recovery(
                &mut second_planner,
                &store,
                recovery_config(second_run_id, 2),
            )
            .await
            .unwrap();

        assert_eq!(second.outcome, LoopOutcome::Completed);
        assert_eq!(second.history.len(), 1);
        assert_eq!(second.history[0].step, 0);
        assert_eq!(calls.load(Ordering::SeqCst), 3);
        assert_eq!(second_derivations.load(Ordering::SeqCst), 0);
        assert!(store
            .failure_events_for_run(second_run_id)
            .await
            .unwrap()
            .is_empty());
        assert_eq!(
            store.lessons_for_tool("requires_safe_mode").await.unwrap()[0].occurrences,
            1
        );
    }

    #[tokio::test]
    async fn recovery_obeys_global_attempt_budget() {
        let calls = Arc::new(AtomicUsize::new(0));
        let mut registry = ToolRegistry::new();
        registry.register(Box::new(AlwaysFails {
            calls: Arc::clone(&calls),
        }));
        let auto = AutoLoop::new(
            &registry,
            LoopConfig {
                max_steps: 2,
                gate: ApprovalGate::DryRun,
            },
        );
        let store = MemoryStore::default();
        let run_id = Uuid::new_v4();
        let mut planner = FixedPlanner {
            remaining: 1,
            tool: "always_fails",
        };

        let report = auto
            .run_with_recovery(&mut planner, &store, recovery_config(run_id, 10))
            .await
            .unwrap();
        assert_eq!(report.outcome, LoopOutcome::BudgetExhausted);
        assert!(report.history.is_empty());
        assert_eq!(calls.load(Ordering::SeqCst), 2);
        assert_eq!(store.failure_events_for_run(run_id).await.unwrap().len(), 2);
    }

    #[tokio::test]
    async fn recovery_obeys_per_step_retry_bound() {
        let calls = Arc::new(AtomicUsize::new(0));
        let mut registry = ToolRegistry::new();
        registry.register(Box::new(AlwaysFails {
            calls: Arc::clone(&calls),
        }));
        let auto = AutoLoop::new(
            &registry,
            LoopConfig {
                max_steps: 10,
                gate: ApprovalGate::DryRun,
            },
        );
        let store = MemoryStore::default();
        let run_id = Uuid::new_v4();
        let mut planner = FixedPlanner {
            remaining: 1,
            tool: "always_fails",
        };

        let error = auto
            .run_with_recovery(&mut planner, &store, recovery_config(run_id, 1))
            .await
            .unwrap_err();
        assert!(matches!(
            error,
            RecoveryError::Tool(ToolError::Failed(_, _))
        ));
        assert_eq!(calls.load(Ordering::SeqCst), 2);
        assert_eq!(store.failure_events_for_run(run_id).await.unwrap().len(), 2);
    }

    #[tokio::test]
    async fn unknown_tool_is_recorded_but_never_retried() {
        let registry = ToolRegistry::new();
        let auto = AutoLoop::new(
            &registry,
            LoopConfig {
                max_steps: 5,
                gate: ApprovalGate::DryRun,
            },
        );
        let store = MemoryStore::default();
        let run_id = Uuid::new_v4();
        let mut planner = FixedPlanner {
            remaining: 1,
            tool: "missing_tool",
        };

        let error = auto
            .run_with_recovery(&mut planner, &store, recovery_config(run_id, 4))
            .await
            .unwrap_err();
        assert!(matches!(
            error,
            RecoveryError::Tool(ToolError::Unknown(ref tool)) if tool == "missing_tool"
        ));
        let failures = store.failure_events_for_run(run_id).await.unwrap();
        assert_eq!(failures.len(), 1);
        assert_eq!(failures[0].error_kind, FailureKind::Unknown);
    }

    #[tokio::test]
    async fn recovery_preserves_approval_gate_on_every_attempt() {
        let calls = Arc::new(AtomicUsize::new(0));
        let mut registry = ToolRegistry::new();
        registry.register(Box::new(GatedFailure {
            calls: Arc::clone(&calls),
        }));
        let auto = AutoLoop::new(
            &registry,
            LoopConfig {
                max_steps: 3,
                gate: ApprovalGate::DryRun,
            },
        );
        let store = MemoryStore::default();
        let run_id = Uuid::new_v4();
        let mut planner = FixedPlanner {
            remaining: 1,
            tool: "gated_failure",
        };

        let report = auto
            .run_with_recovery(&mut planner, &store, recovery_config(run_id, 2))
            .await
            .unwrap();
        assert_eq!(report.outcome, LoopOutcome::Completed);
        assert!(matches!(
            report.history[0].result,
            ToolResult::Planned { .. }
        ));
        assert_eq!(calls.load(Ordering::SeqCst), 0);
        assert!(store
            .failure_events_for_run(run_id)
            .await
            .unwrap()
            .is_empty());
    }

    #[tokio::test]
    async fn approved_side_effect_failure_is_recorded_but_never_retried() {
        let calls = Arc::new(AtomicUsize::new(0));
        let mut registry = ToolRegistry::new();
        registry.register(Box::new(GatedFailure {
            calls: Arc::clone(&calls),
        }));
        let auto = AutoLoop::new(
            &registry,
            LoopConfig {
                max_steps: 8,
                gate: ApprovalGate::approved("SIDE-EFFECT-REVIEW-001"),
            },
        );
        let store = MemoryStore::default();
        let run_id = Uuid::new_v4();
        let mut planner = FixedPlanner {
            remaining: 1,
            tool: "gated_failure",
        };

        let error = auto
            .run_with_recovery(&mut planner, &store, recovery_config(run_id, 5))
            .await
            .unwrap_err();
        assert!(matches!(
            error,
            RecoveryError::Tool(ToolError::Failed(_, _))
        ));
        assert_eq!(calls.load(Ordering::SeqCst), 1);
        assert_eq!(store.failure_events_for_run(run_id).await.unwrap().len(), 1);
    }
}

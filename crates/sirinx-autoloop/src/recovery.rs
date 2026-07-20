//! B2 — the self-learning loop: develop → fail → record → learn →
//! retry guided by lessons. Endless as a *cycle* (every run feeds the
//! next), while every individual run stays bounded per governance.
//!
//! Mechanics:
//! 1. Each tool failure is recorded through [`LearningSink`].
//! 2. Known [`Lesson`]s are consulted: a matching lesson authorizes
//!    bounded retries (guided recovery).
//! 3. An unmatched failure proposes a NEW lesson from its own error
//!    text, so the very next run recognizes it — the loop closes.

use serde::{Deserialize, Serialize};

use sirinx_core::{FailureRecord, Lesson};

use crate::loop_runner::{LoopConfig, LoopError, LoopOutcome, Planner, StepRecord};
use crate::tool::{ToolRegistry, ToolResult};

/// Where failures and lesson proposals go. Services bridge this to
/// `sirinx_store::Store` (`record_failure` / `upsert_lesson`); tests
/// use an in-memory sink.
pub trait LearningSink {
    fn record_failure(&self, failure: FailureRecord);
    fn propose_lesson(&self, lesson: Lesson);
}

/// No-op sink for callers that only want the retry behavior.
pub struct NullSink;

impl LearningSink for NullSink {
    fn record_failure(&self, _failure: FailureRecord) {}
    fn propose_lesson(&self, _lesson: Lesson) {}
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecoveryConfig {
    #[serde(flatten)]
    pub base: LoopConfig,
    /// Bounded retries per failing step when a lesson matches.
    pub max_retries: usize,
}

impl Default for RecoveryConfig {
    fn default() -> Self {
        Self {
            base: LoopConfig::default(),
            max_retries: 2,
        }
    }
}

/// One executed step including its recovery history.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecoveryRecord {
    pub step: usize,
    pub tool: String,
    /// Total attempts made (1 = succeeded first try).
    pub attempts: usize,
    /// The lesson pattern that authorized retries, if any.
    pub lesson_applied: Option<String>,
    pub outcome: RecoveryOutcome,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", tag = "kind")]
pub enum RecoveryOutcome {
    Succeeded {
        result: ToolResult,
    },
    /// All attempts failed; the loop moved on. The failure was recorded
    /// and, when no lesson matched, a new lesson was proposed.
    Failed {
        error: String,
    },
}

/// Plan → act → observe with lesson-guided recovery.
pub struct RecoveryLoop<'a> {
    registry: &'a ToolRegistry,
    config: RecoveryConfig,
}

impl<'a> RecoveryLoop<'a> {
    pub fn new(registry: &'a ToolRegistry, config: RecoveryConfig) -> Self {
        Self { registry, config }
    }

    pub fn run(
        &self,
        planner: &mut dyn Planner,
        lessons: &[Lesson],
        sink: &dyn LearningSink,
    ) -> Result<(LoopOutcome, Vec<RecoveryRecord>), LoopError> {
        let mut records: Vec<RecoveryRecord> = Vec::new();
        // Planner sees successful steps only, in StepRecord form.
        let mut history: Vec<StepRecord> = Vec::new();

        for step in 0..self.config.base.max_steps {
            let Some(invocation) = planner.next_step(&history) else {
                return Ok((LoopOutcome::Completed, records));
            };

            let mut attempts = 0;
            let mut lesson_applied: Option<String> = None;
            let outcome = loop {
                attempts += 1;
                match self.registry.invoke(&invocation, &self.config.base.gate) {
                    Ok(result) => break RecoveryOutcome::Succeeded { result },
                    Err(err) => {
                        let error_text = err.to_string();
                        sink.record_failure(FailureRecord {
                            component: format!("tool:{}", invocation.tool),
                            error: error_text.clone(),
                            context: invocation.args.clone(),
                        });

                        let matching = lessons.iter().find(|l| l.matches(&error_text));
                        match matching {
                            // A known lesson authorizes bounded retries.
                            Some(lesson) if attempts <= self.config.max_retries => {
                                lesson_applied = Some(lesson.pattern.clone());
                                continue;
                            }
                            // Unknown failure: learn it so the NEXT run
                            // recognizes the pattern, then move on.
                            None => {
                                sink.propose_lesson(Lesson {
                                    pattern: error_text.clone(),
                                    resolution: format!(
                                        "retry {} up to {} times with backoff; escalate if it persists",
                                        invocation.tool, self.config.max_retries
                                    ),
                                    hits: 0,
                                });
                                break RecoveryOutcome::Failed { error: error_text };
                            }
                            // Lesson known but retries exhausted.
                            Some(_) => break RecoveryOutcome::Failed { error: error_text },
                        }
                    }
                }
            };

            if let RecoveryOutcome::Succeeded { result } = &outcome {
                history.push(StepRecord {
                    step,
                    invocation: invocation.clone(),
                    result: result.clone(),
                });
            }
            records.push(RecoveryRecord {
                step,
                tool: invocation.tool.clone(),
                attempts,
                lesson_applied,
                outcome,
            });
        }
        Ok((LoopOutcome::BudgetExhausted, records))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tool::{ApprovalGate, Tool, ToolError, ToolInvocation};
    use std::sync::atomic::{AtomicUsize, Ordering};
    use std::sync::Mutex;

    /// Fails `failures` times, then succeeds.
    struct Flaky {
        failures: usize,
        calls: AtomicUsize,
    }

    impl Tool for Flaky {
        fn name(&self) -> &'static str {
            "flaky_fetch"
        }
        fn description(&self) -> &'static str {
            "fails a few times then succeeds"
        }
        fn is_side_effecting(&self) -> bool {
            false
        }
        fn execute(&self, _args: &serde_json::Value) -> Result<serde_json::Value, ToolError> {
            let n = self.calls.fetch_add(1, Ordering::SeqCst);
            if n < self.failures {
                Err(ToolError::Failed(
                    "flaky_fetch".into(),
                    "connection refused".into(),
                ))
            } else {
                Ok(serde_json::json!({ "fetched": true }))
            }
        }
    }

    #[derive(Default)]
    struct MemorySink {
        failures: Mutex<Vec<FailureRecord>>,
        proposals: Mutex<Vec<Lesson>>,
    }

    impl LearningSink for MemorySink {
        fn record_failure(&self, failure: FailureRecord) {
            self.failures.lock().unwrap().push(failure);
        }
        fn propose_lesson(&self, lesson: Lesson) {
            self.proposals.lock().unwrap().push(lesson);
        }
    }

    struct OneShotPlanner {
        emitted: bool,
    }

    impl Planner for OneShotPlanner {
        fn next_step(&mut self, _history: &[StepRecord]) -> Option<ToolInvocation> {
            if self.emitted {
                return None;
            }
            self.emitted = true;
            Some(ToolInvocation {
                tool: "flaky_fetch".into(),
                args: serde_json::json!({}),
            })
        }
    }

    fn registry(failures: usize) -> ToolRegistry {
        let mut r = ToolRegistry::new();
        r.register(Box::new(Flaky {
            failures,
            calls: AtomicUsize::new(0),
        }));
        r
    }

    fn config() -> RecoveryConfig {
        RecoveryConfig {
            base: LoopConfig {
                max_steps: 4,
                gate: ApprovalGate::DryRun,
            },
            max_retries: 2,
        }
    }

    #[test]
    fn known_lesson_guides_retry_to_success() {
        let registry = registry(1); // fails once, then succeeds
        let sink = MemorySink::default();
        let lessons = vec![Lesson {
            pattern: "connection refused".into(),
            resolution: "retry with backoff".into(),
            hits: 0,
        }];

        let (outcome, records) = RecoveryLoop::new(&registry, config())
            .run(&mut OneShotPlanner { emitted: false }, &lessons, &sink)
            .unwrap();

        assert_eq!(outcome, LoopOutcome::Completed);
        assert_eq!(records.len(), 1);
        assert_eq!(records[0].attempts, 2);
        assert_eq!(
            records[0].lesson_applied.as_deref(),
            Some("connection refused")
        );
        assert!(matches!(
            records[0].outcome,
            RecoveryOutcome::Succeeded { .. }
        ));
        // The failure was still recorded for the registry.
        assert_eq!(sink.failures.lock().unwrap().len(), 1);
    }

    #[test]
    fn unknown_failure_is_recorded_and_becomes_a_lesson() {
        let registry = registry(usize::MAX); // always fails
        let sink = MemorySink::default();

        let (_, records) = RecoveryLoop::new(&registry, config())
            .run(&mut OneShotPlanner { emitted: false }, &[], &sink)
            .unwrap();

        // No lesson → single attempt, failure recorded, lesson proposed.
        assert_eq!(records[0].attempts, 1);
        assert!(matches!(records[0].outcome, RecoveryOutcome::Failed { .. }));
        assert_eq!(sink.failures.lock().unwrap().len(), 1);
        let proposals = sink.proposals.lock().unwrap();
        assert_eq!(proposals.len(), 1);
        assert!(proposals[0].pattern.contains("connection refused"));
    }

    #[test]
    fn learning_closes_the_loop_across_runs() {
        // Run 1: unknown failure → proposal. Run 2: proposal used as a
        // lesson → guided retry succeeds. This is the endless-improvement
        // cycle in miniature.
        let sink = MemorySink::default();

        let registry1 = registry(usize::MAX);
        RecoveryLoop::new(&registry1, config())
            .run(&mut OneShotPlanner { emitted: false }, &[], &sink)
            .unwrap();
        let learned: Vec<Lesson> = sink.proposals.lock().unwrap().clone();
        assert_eq!(learned.len(), 1);

        let registry2 = registry(1); // transient failure this time
        let (outcome, records) = RecoveryLoop::new(&registry2, config())
            .run(&mut OneShotPlanner { emitted: false }, &learned, &sink)
            .unwrap();
        assert_eq!(outcome, LoopOutcome::Completed);
        assert!(records[0].lesson_applied.is_some());
        assert!(matches!(
            records[0].outcome,
            RecoveryOutcome::Succeeded { .. }
        ));
    }

    #[test]
    fn retries_are_bounded_even_with_a_lesson() {
        let registry = registry(usize::MAX); // never succeeds
        let sink = MemorySink::default();
        let lessons = vec![Lesson {
            pattern: "connection refused".into(),
            resolution: "retry".into(),
            hits: 0,
        }];

        let (_, records) = RecoveryLoop::new(&registry, config())
            .run(&mut OneShotPlanner { emitted: false }, &lessons, &sink)
            .unwrap();

        // max_retries=2 → attempts capped at 3 (initial + 2 retries).
        assert_eq!(records[0].attempts, 3);
        assert!(matches!(records[0].outcome, RecoveryOutcome::Failed { .. }));
    }
}

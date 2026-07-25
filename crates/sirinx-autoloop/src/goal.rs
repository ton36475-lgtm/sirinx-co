//! Strict, deterministic GoalSpec execution.
//!
//! A [`GoalSpec`] is untrusted intent, not effect authority. It deliberately
//! contains no approval, ticket, tool, agent, argument-template, provider, or
//! transport fields. [`run_goal`] constructs a private, sealed catalog that
//! can only perform in-process inspection of the validated intent.

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::loop_runner::{AutoLoop, LoopConfig, LoopOutcome, Planner, StepRecord};
use crate::tool::{
    ApprovalGate, Tool, ToolEffect, ToolError, ToolInvocation, ToolRegistry, ToolResult,
};

/// Maximum accepted UTF-8 byte length for an untrusted goal.
pub const MAX_GOAL_BYTES: usize = 4_096;
/// Maximum deterministic loop budget accepted from an untrusted caller.
pub const MAX_GOAL_STEPS: usize = 8;
const DEFAULT_GOAL_STEPS: usize = 1;
const INSPECT_TOOL: &str = "inspect";

/// Untrusted human intent accepted by the local GoalSpec runner.
///
/// The caller controls only the text of the goal and a bounded execution
/// budget. All capability and effect decisions remain inside the trusted
/// runtime.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct GoalSpec {
    /// Human-readable intent. Validation rejects empty, oversized, and unsafe
    /// control-character content.
    pub goal: String,
    /// Hard local step budget, restricted to `1..=MAX_GOAL_STEPS`.
    #[serde(default = "default_goal_steps")]
    pub max_steps: usize,
}

impl GoalSpec {
    pub fn new(goal: impl Into<String>) -> Self {
        Self {
            goal: goal.into(),
            max_steps: DEFAULT_GOAL_STEPS,
        }
    }

    pub fn with_max_steps(mut self, max_steps: usize) -> Self {
        self.max_steps = max_steps;
        self
    }

    /// Validate and normalize untrusted intent before planning.
    pub fn validate(&self) -> Result<(), GoalSpecError> {
        validate_goal_text(&self.goal)?;
        validate_step_budget(self.max_steps)
    }
}

fn default_goal_steps() -> usize {
    DEFAULT_GOAL_STEPS
}

/// The only execution profile available through [`run_goal`].
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum GoalExecutionProfile {
    LocalNoProviderNoEffect,
}

/// Lifecycle states used by the control plane and evidence records.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum GoalRunState {
    Planned,
    Running,
    Passed,
    Failed,
    Blocked,
}

impl GoalRunState {
    pub fn is_terminal(self) -> bool {
        matches!(self, Self::Passed | Self::Failed | Self::Blocked)
    }
}

/// Explicit effect evidence for one GoalSpec run.
///
/// These counters are not inferred from user input or tool self-reporting. The
/// sealed profile validates the executed catalog and refuses to produce a
/// report if anything other than its deterministic in-process inspect tool
/// appears in history.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct GoalRunEvidence {
    pub tool_invocations: usize,
    pub retry_attempts: usize,
    pub provider_calls: usize,
    pub network_calls: usize,
    pub subprocesses_started: usize,
    pub filesystem_reads: usize,
    pub filesystem_writes: usize,
    pub external_effects: usize,
    pub external_writes: usize,
}

impl GoalRunEvidence {
    pub fn has_no_effects(&self) -> bool {
        self.retry_attempts == 0
            && self.provider_calls == 0
            && self.network_calls == 0
            && self.subprocesses_started == 0
            && self.filesystem_reads == 0
            && self.filesystem_writes == 0
            && self.external_effects == 0
            && self.external_writes == 0
    }
}

/// Verifiable result from the sealed local GoalSpec path.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct GoalRunReport {
    pub schema_version: String,
    pub goal_bytes: usize,
    pub goal_characters: usize,
    pub status: GoalRunState,
    pub execution_profile: GoalExecutionProfile,
    pub outcome: LoopOutcome,
    pub steps_used: usize,
    pub max_steps: usize,
    pub tool_names: Vec<String>,
    pub evidence: GoalRunEvidence,
}

#[derive(Debug, thiserror::Error)]
pub enum GoalRunError {
    #[error(transparent)]
    InvalidSpec(#[from] GoalSpecError),
    #[error("sealed local tool catalog rejected its definition: {0}")]
    Catalog(#[source] ToolError),
    #[error(transparent)]
    Loop(#[from] crate::LoopError),
    #[error("sealed local execution invariant failed: {0}")]
    Invariant(&'static str),
}

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum GoalSpecError {
    #[error("goal must not be empty")]
    EmptyGoal,
    #[error("goal is too large: {actual} UTF-8 bytes; maximum is {maximum}")]
    GoalTooLarge { actual: usize, maximum: usize },
    #[error("goal contains a disallowed control character")]
    DisallowedControlCharacter,
    #[error("maxSteps must be between 1 and {maximum}; received {actual}")]
    InvalidStepBudget { actual: usize, maximum: usize },
}

/// Execute one validated goal through the sealed local profile.
///
/// The catalog is constructed internally and cannot be extended by the
/// caller. This function never uses recovery, retries, providers, network,
/// subprocesses, filesystem access, or an externally supplied approval gate.
///
/// # Errors
///
/// Returns [`GoalRunError::InvalidSpec`] for empty, oversized, or otherwise
/// invalid intent. Catalog, loop, or sealed-history invariant violations are
/// reported explicitly and never converted into a successful receipt.
///
/// # Examples
///
/// ```
/// use sirinx_autoloop::{run_goal, GoalRunState, GoalSpec};
///
/// let report = run_goal(GoalSpec::new("inspect local state"))?;
/// assert_eq!(report.status, GoalRunState::Passed);
/// assert!(report.evidence.has_no_effects());
/// # Ok::<(), sirinx_autoloop::GoalRunError>(())
/// ```
pub fn run_goal(spec: GoalSpec) -> Result<GoalRunReport, GoalRunError> {
    spec.validate()?;
    let normalized_goal = spec.goal.trim().to_owned();

    let registry = sealed_local_catalog()?;
    let mut planner = GoalPlanner::new(normalized_goal.clone());
    let runner = AutoLoop::new(
        &registry,
        LoopConfig {
            max_steps: spec.max_steps,
            gate: ApprovalGate::DryRun,
        },
    );
    let (outcome, history) = runner.run(&mut planner)?;

    // AutoLoop cannot ask the planner one extra time after consuming exactly
    // the final permitted step. The sealed planner knows its complete plan,
    // so max_steps=1 is a successful one-step run rather than a false budget
    // exhaustion.
    let outcome = match outcome {
        LoopOutcome::BudgetExhausted if planner.is_complete() => LoopOutcome::Completed,
        other => other,
    };

    validate_sealed_history(&history, &outcome)?;
    let evidence = GoalRunEvidence {
        tool_invocations: history.len(),
        ..GoalRunEvidence::default()
    };
    if !evidence.has_no_effects() {
        return Err(GoalRunError::Invariant(
            "local profile produced a non-zero effect counter",
        ));
    }

    Ok(GoalRunReport {
        schema_version: "1.0.0".into(),
        goal_bytes: normalized_goal.len(),
        goal_characters: normalized_goal.chars().count(),
        status: GoalRunState::Passed,
        execution_profile: GoalExecutionProfile::LocalNoProviderNoEffect,
        outcome,
        steps_used: history.len(),
        max_steps: spec.max_steps,
        tool_names: vec![INSPECT_TOOL.into()],
        evidence,
    })
}

fn validate_goal_text(goal: &str) -> Result<(), GoalSpecError> {
    let trimmed = goal.trim();
    if trimmed.is_empty() {
        return Err(GoalSpecError::EmptyGoal);
    }
    let actual = trimmed.len();
    if actual > MAX_GOAL_BYTES {
        return Err(GoalSpecError::GoalTooLarge {
            actual,
            maximum: MAX_GOAL_BYTES,
        });
    }
    if trimmed
        .chars()
        .any(|character| character.is_control() && !matches!(character, '\n' | '\t'))
    {
        return Err(GoalSpecError::DisallowedControlCharacter);
    }
    Ok(())
}

fn validate_step_budget(max_steps: usize) -> Result<(), GoalSpecError> {
    if !(1..=MAX_GOAL_STEPS).contains(&max_steps) {
        return Err(GoalSpecError::InvalidStepBudget {
            actual: max_steps,
            maximum: MAX_GOAL_STEPS,
        });
    }
    Ok(())
}

fn sealed_local_catalog() -> Result<ToolRegistry, GoalRunError> {
    let mut registry = ToolRegistry::new();
    registry
        .try_register(Box::new(InspectGoal))
        .map_err(GoalRunError::Catalog)?;
    if registry.names() != [INSPECT_TOOL] {
        return Err(GoalRunError::Invariant(
            "local catalog contained an unexpected tool",
        ));
    }
    Ok(registry)
}

fn validate_sealed_history(
    history: &[StepRecord],
    outcome: &LoopOutcome,
) -> Result<(), GoalRunError> {
    if outcome != &LoopOutcome::Completed {
        return Err(GoalRunError::Invariant(
            "sealed one-step plan did not complete",
        ));
    }
    if history.len() != 1 {
        return Err(GoalRunError::Invariant(
            "sealed local plan must execute exactly one step",
        ));
    }
    let step = &history[0];
    if step.step != 0 || step.invocation.tool != INSPECT_TOOL {
        return Err(GoalRunError::Invariant(
            "history contained an unexpected step or tool",
        ));
    }
    if !matches!(step.result, ToolResult::Executed { .. }) {
        return Err(GoalRunError::Invariant(
            "local inspect tool did not execute deterministically",
        ));
    }
    Ok(())
}

/// Private deterministic planner. Callers cannot choose its tool or arguments.
struct GoalPlanner {
    goal: String,
    emitted: bool,
}

impl GoalPlanner {
    fn new(goal: String) -> Self {
        Self {
            goal,
            emitted: false,
        }
    }

    fn is_complete(&self) -> bool {
        self.emitted
    }
}

impl Planner for GoalPlanner {
    fn next_step(&mut self, _history: &[StepRecord]) -> Option<ToolInvocation> {
        if self.emitted {
            return None;
        }
        self.emitted = true;
        Some(ToolInvocation {
            tool: INSPECT_TOOL.into(),
            args: serde_json::json!({ "goal": self.goal }),
        })
    }
}

/// The only capability in the sealed GoalSpec catalog.
struct InspectGoal;

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct InspectGoalArgs {
    goal: String,
}

impl Tool for InspectGoal {
    fn name(&self) -> &'static str {
        INSPECT_TOOL
    }

    fn description(&self) -> &'static str {
        "validates and summarizes the in-memory goal without external effects"
    }

    fn is_side_effecting(&self) -> bool {
        false
    }

    fn effect_class(&self) -> ToolEffect {
        ToolEffect::NoEffect
    }

    fn execute(&self, args: &Value) -> Result<Value, ToolError> {
        let args: InspectGoalArgs = serde_json::from_value(args.clone()).map_err(|error| {
            ToolError::BadArgs(
                self.name().into(),
                format!("closed inspect arguments were rejected: {error}"),
            )
        })?;
        validate_goal_text(&args.goal)
            .map_err(|error| ToolError::BadArgs(self.name().into(), error.to_string()))?;

        Ok(serde_json::json!({
            "accepted": true,
            "profile": "local_no_provider_no_effect",
            "goalBytes": args.goal.len(),
            "goalCharacters": args.goal.chars().count(),
        }))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn one_step_budget_completes_successfully() {
        let report = run_goal(GoalSpec::new("inspect system state").with_max_steps(1)).unwrap();
        assert_eq!(report.status, GoalRunState::Passed);
        assert_eq!(report.outcome, LoopOutcome::Completed);
        assert_eq!(report.steps_used, 1);
        assert_eq!(report.evidence.tool_invocations, 1);
        assert!(report.evidence.has_no_effects());
    }

    #[test]
    fn goal_spec_rejects_empty_oversized_and_control_character_input() {
        assert_eq!(
            GoalSpec::new(" \n\t ").validate().unwrap_err(),
            GoalSpecError::EmptyGoal
        );
        assert!(matches!(
            GoalSpec::new("x".repeat(MAX_GOAL_BYTES + 1))
                .validate()
                .unwrap_err(),
            GoalSpecError::GoalTooLarge { .. }
        ));
        assert_eq!(
            GoalSpec::new("inspect\u{0000}state")
                .validate()
                .unwrap_err(),
            GoalSpecError::DisallowedControlCharacter
        );
    }

    #[test]
    fn goal_spec_rejects_out_of_range_step_budgets() {
        for max_steps in [0, MAX_GOAL_STEPS + 1, usize::MAX] {
            assert!(matches!(
                GoalSpec::new("inspect")
                    .with_max_steps(max_steps)
                    .validate(),
                Err(GoalSpecError::InvalidStepBudget { .. })
            ));
        }
    }

    #[test]
    fn goal_spec_defaults_to_one_local_step() {
        let spec: GoalSpec = serde_json::from_value(serde_json::json!({
            "goal": "inspect"
        }))
        .unwrap();
        assert_eq!(spec.max_steps, 1);
    }

    #[test]
    fn inspect_output_does_not_echo_untrusted_goal_text() {
        const SENTINEL: &str = "SENTINEL_PRIVATE_GOAL";
        let output = InspectGoal
            .execute(&serde_json::json!({ "goal": SENTINEL }))
            .unwrap();
        assert!(!output.to_string().contains(SENTINEL));
    }

    #[test]
    fn lifecycle_states_distinguish_terminal_and_non_terminal() {
        assert!(!GoalRunState::Planned.is_terminal());
        assert!(!GoalRunState::Running.is_terminal());
        assert!(GoalRunState::Passed.is_terminal());
        assert!(GoalRunState::Failed.is_terminal());
        assert!(GoalRunState::Blocked.is_terminal());
    }
}

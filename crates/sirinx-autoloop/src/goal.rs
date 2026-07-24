use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use serde_json::Value;
use sirinx_core::FailureEvent;

use crate::loop_runner::{LoopConfig, LoopOutcome, Planner, StepRecord};
use crate::tool::{ApprovalGate, ToolInvocation, ToolRegistry};

/// A structured goal specification that drives the autoloop.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoalSpec {
    /// Human-readable goal description.
    pub goal: String,
    /// Named agents or capabilities to use.
    pub target_agents: Vec<String>,
    /// Bounded iteration budget.
    pub max_steps: usize,
    /// Approval gate for side-effecting tools.
    pub gate: ApprovalGate,
    /// Optional per-tool argument templates.
    pub arg_templates: BTreeMap<String, Value>,
}

impl GoalSpec {
    pub fn new(goal: impl Into<String>) -> Self {
        Self {
            goal: goal.into(),
            target_agents: Vec::new(),
            max_steps: 8,
            gate: ApprovalGate::DryRun,
            arg_templates: BTreeMap::new(),
        }
    }

    pub fn with_agents(mut self, agents: Vec<String>) -> Self {
        self.target_agents = agents;
        self
    }

    pub fn with_gate(mut self, gate: ApprovalGate) -> Self {
        self.gate = gate;
        self
    }

    pub fn with_max_steps(mut self, max_steps: usize) -> Self {
        self.max_steps = max_steps;
        self
    }
}

/// Planner that derives tool invocations from a goal spec.
///
/// The planner cycles through target agents and uses arg templates
/// to build invocations. It declares completion after one full cycle
/// per agent.
pub struct GoalPlanner {
    spec: GoalSpec,
    step: usize,
    max_cycles: usize,
}

impl GoalPlanner {
    pub fn new(spec: GoalSpec) -> Self {
        let max_cycles = if spec.target_agents.is_empty() {
            1
        } else {
            spec.target_agents.len().max(1)
        };
        Self {
            spec,
            step: 0,
            max_cycles,
        }
    }
}

impl Planner for GoalPlanner {
    fn next_step(&mut self, _history: &[StepRecord]) -> Option<ToolInvocation> {
        if self.step >= self.max_cycles {
            return None;
        }
        if self.spec.target_agents.is_empty() {
            self.step += 1;
            return Some(ToolInvocation {
                tool: "inspect".into(),
                args: serde_json::json!({ "goal": self.spec.goal }),
            });
        }
        let agent_index = self.step % self.spec.target_agents.len();
        let agent = &self.spec.target_agents[agent_index];
        let args = self
            .spec
            .arg_templates
            .get(agent)
            .cloned()
            .unwrap_or_else(|| serde_json::json!({ "agent": agent, "goal": self.spec.goal }));
        self.step += 1;
        Some(ToolInvocation {
            tool: agent.clone(),
            args,
        })
    }

    fn apply_lessons(
        &mut self,
        tool: &str,
        args: &serde_json::Value,
        lessons: &[sirinx_core::Lesson],
    ) -> serde_json::Value {
        if lessons
            .iter()
            .any(|l| l.guidance == sirinx_core::LessonGuidance::ValidateArguments)
        {
            let mut safe = args.as_object().cloned().unwrap_or_default();
            safe.insert("validated".into(), Value::Bool(true));
            Value::Object(safe)
        } else if tool == "hermes-agent"
            && lessons
                .iter()
                .any(|l| l.guidance == sirinx_core::LessonGuidance::RetryTransientFailure)
        {
            let mut throttled = args.as_object().cloned().unwrap_or_default();
            throttled.insert("max_concurrent".into(), Value::Number(1.into()));
            Value::Object(throttled)
        } else {
            args.clone()
        }
    }

    fn derive_lesson(&mut self, failure: &FailureEvent) -> sirinx_core::LessonGuidance {
        match failure.error_kind {
            sirinx_core::FailureKind::BadArgs => sirinx_core::LessonGuidance::ValidateArguments,
            sirinx_core::FailureKind::Failed => sirinx_core::LessonGuidance::RetryTransientFailure,
            sirinx_core::FailureKind::Unknown => {
                sirinx_core::LessonGuidance::VerifyToolAvailability
            }
        }
    }
}

/// Result of running a goal through the autoloop.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GoalRunReport {
    pub goal: String,
    pub mode: String,
    pub outcome: String,
    pub steps_used: usize,
    pub max_steps: usize,
    pub gate: String,
    pub external_writes: bool,
    pub provider_call: bool,
    pub command_executed: bool,
    pub history: Vec<StepRecord>,
}

/// Run a goal spec through the autoloop engine with optional recovery.
///
/// This is the end-to-end entry point: goal spec → planner → loop → report.
pub fn run_goal(
    registry: &ToolRegistry,
    spec: GoalSpec,
) -> Result<GoalRunReport, crate::LoopError> {
    let config = LoopConfig {
        max_steps: spec.max_steps,
        gate: spec.gate.clone(),
    };
    let mut planner = GoalPlanner::new(spec.clone());
    let auto = crate::AutoLoop::new(registry, config);
    let (outcome, history) = auto.run(&mut planner)?;

    let gate_allows_execution = matches!(
        &spec.gate,
        ApprovalGate::Approved { .. } | ApprovalGate::Allowlist { .. }
    );
    let external_writes = gate_allows_execution
        && history
            .iter()
            .any(|s| matches!(&s.result, crate::ToolResult::Executed { .. }));
    let gate_str = match &spec.gate {
        ApprovalGate::DryRun => "dry_run",
        ApprovalGate::Approved { .. } => "approved",
        ApprovalGate::Allowlist { .. } => "allowlist",
    };

    Ok(GoalRunReport {
        goal: spec.goal,
        mode: gate_str.to_string(),
        outcome: match outcome {
            LoopOutcome::Completed => "completed",
            LoopOutcome::BudgetExhausted => "budget_exhausted",
        }
        .to_string(),
        steps_used: history.len(),
        max_steps: spec.max_steps,
        gate: gate_str.to_string(),
        external_writes,
        provider_call: false,
        command_executed: external_writes,
        history,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tool::Tool;

    struct Inspect;
    impl Tool for Inspect {
        fn name(&self) -> &'static str {
            "inspect"
        }
        fn description(&self) -> &'static str {
            "read-only inspection tool"
        }
        fn is_side_effecting(&self) -> bool {
            false
        }
        fn execute(&self, args: &serde_json::Value) -> Result<Value, crate::ToolError> {
            Ok(serde_json::json!({ "inspected": args.get("goal").and_then(Value::as_str) }))
        }
    }

    struct TestNotify;
    impl Tool for TestNotify {
        fn name(&self) -> &'static str {
            "hermes-agent"
        }
        fn description(&self) -> &'static str {
            "Hermes agent dispatch (test stub)"
        }
        fn is_side_effecting(&self) -> bool {
            true
        }
        fn execute(&self, _args: &Value) -> Result<Value, crate::ToolError> {
            Ok(serde_json::json!({ "sent": true, "mode": "test_stub" }))
        }
    }

    fn registry() -> ToolRegistry {
        let mut r = ToolRegistry::new();
        r.register(Box::new(Inspect));
        r.register(Box::new(TestNotify));
        r
    }

    #[test]
    fn goal_without_agents_uses_default_inspect() {
        let spec = GoalSpec::new("check system health".to_string()).with_max_steps(1);
        let report = run_goal(&registry(), spec).unwrap();
        assert_eq!(report.outcome, "budget_exhausted");
        assert_eq!(report.steps_used, 1);
        assert!(!report.external_writes);
    }

    #[test]
    fn goal_with_agents_cycles_through_them() {
        let spec = GoalSpec::new("sync agents".to_string())
            .with_agents(vec!["inspect".into(), "inspect".into()])
            .with_max_steps(4);
        let report = run_goal(&registry(), spec).unwrap();
        assert_eq!(report.outcome, "completed");
        assert_eq!(report.steps_used, 2);
    }

    #[test]
    fn dry_run_gate_blocks_side_effects() {
        let spec = GoalSpec::new("test hermes".to_string())
            .with_agents(vec!["hermes-agent".into()])
            .with_max_steps(2);
        let report = run_goal(&registry(), spec).unwrap();
        assert_eq!(report.outcome, "completed");
        assert!(!report.external_writes);
        assert_eq!(report.gate, "dry_run");
    }

    #[test]
    fn approved_gate_executes_side_effects() {
        let spec = GoalSpec::new("test hermes".to_string())
            .with_agents(vec!["hermes-agent".into()])
            .with_gate(ApprovalGate::approved("GOAL-TEST-001"))
            .with_max_steps(3);
        let report = run_goal(&registry(), spec).unwrap();
        assert_eq!(report.outcome, "completed");
        assert!(report.external_writes);
        assert_eq!(report.gate, "approved");
        assert_eq!(report.steps_used, 1);
    }

    #[test]
    fn budget_limits_goal_run() {
        let spec = GoalSpec::new("long run".to_string())
            .with_agents(vec!["inspect".into()])
            .with_max_steps(1);
        let report = run_goal(&registry(), spec).unwrap();
        assert_eq!(report.steps_used, 1);
        assert!(report.steps_used <= report.max_steps);
    }

    #[test]
    fn goal_planner_applies_validation_lessons() {
        let spec = GoalSpec::new("validate args".to_string()).with_agents(vec!["inspect".into()]);
        let mut planner = GoalPlanner::new(spec);
        let lesson = sirinx_core::Lesson::new(
            "inspect",
            sirinx_core::FailureKind::BadArgs,
            sirinx_core::LessonGuidance::ValidateArguments,
        );
        let args = serde_json::json!({ "raw": true });
        let adjusted = planner.apply_lessons("inspect", &args, &[lesson]);
        assert_eq!(adjusted.get("validated"), Some(&Value::Bool(true)));
    }
}

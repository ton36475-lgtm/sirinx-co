use serde::{Deserialize, Serialize};

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

/// A planner decides the next tool call from the transcript so far.
/// Return `None` to declare the goal complete.
pub trait Planner {
    fn next_step(&mut self, history: &[StepRecord]) -> Option<ToolInvocation>;
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
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tool::Tool;

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

    fn registry() -> ToolRegistry {
        let mut r = ToolRegistry::new();
        r.register(Box::new(Counter));
        r.register(Box::new(SendCampaign));
        r
    }

    #[test]
    fn loop_completes_when_planner_is_done() {
        let registry = registry();
        let auto = AutoLoop::new(&registry, LoopConfig::default());
        let mut planner = FixedPlanner { remaining: 3, tool: "count" };
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
        let mut planner = FixedPlanner { remaining: usize::MAX, tool: "count" };
        let (outcome, history) = auto.run(&mut planner).unwrap();
        assert_eq!(outcome, LoopOutcome::BudgetExhausted);
        assert_eq!(history.len(), 5);
    }

    #[test]
    fn dry_run_records_plans_instead_of_side_effects() {
        let registry = registry();
        let auto = AutoLoop::new(&registry, LoopConfig::default());
        let mut planner = FixedPlanner { remaining: 1, tool: "send_campaign" };
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
        let mut planner = FixedPlanner { remaining: 1, tool: "send_campaign" };
        let (_, history) = auto.run(&mut planner).unwrap();
        assert_eq!(
            history[0].result,
            ToolResult::Executed {
                output: serde_json::json!({ "sent": true })
            }
        );
    }
}

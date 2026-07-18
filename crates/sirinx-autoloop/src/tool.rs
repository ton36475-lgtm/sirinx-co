use std::collections::{BTreeMap, BTreeSet};

use serde::{Deserialize, Serialize};

/// Governance gate for side-effecting tools.
///
/// `DryRun` is the default everywhere. `Approved` carries the operator's
/// ticket reference so every real execution is attributable.
/// `Allowlist` is the scoped middle ground: the operator pre-approves a
/// named set of tools (with a ticket), everything else stays dry-run —
/// never a blanket auto-approve.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", tag = "mode")]
pub enum ApprovalGate {
    #[default]
    DryRun,
    Approved {
        ticket: String,
    },
    Allowlist {
        ticket: String,
        tools: BTreeSet<String>,
    },
}

impl ApprovalGate {
    /// Convenience constructor for full approval.
    pub fn approved(ticket: impl Into<String>) -> Self {
        ApprovalGate::Approved {
            ticket: ticket.into(),
        }
    }

    /// Convenience constructor for a scoped allowlist.
    pub fn allowlist<I, S>(ticket: impl Into<String>, tools: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        ApprovalGate::Allowlist {
            ticket: ticket.into(),
            tools: tools.into_iter().map(Into::into).collect(),
        }
    }

    /// Whether this gate lets the named side-effecting tool execute.
    pub fn permits(&self, tool_name: &str) -> bool {
        match self {
            ApprovalGate::DryRun => false,
            ApprovalGate::Approved { .. } => true,
            ApprovalGate::Allowlist { tools, .. } => tools.contains(tool_name),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolInvocation {
    pub tool: String,
    pub args: serde_json::Value,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", tag = "kind")]
pub enum ToolResult {
    /// Tool ran and produced a value.
    Executed { output: serde_json::Value },
    /// Side-effecting tool under DryRun: nothing ran; this is the plan.
    Planned { description: String },
}

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum ToolError {
    #[error("unknown tool: {0}")]
    Unknown(String),
    #[error("tool {0} rejected arguments: {1}")]
    BadArgs(String, String),
    #[error("tool {0} failed: {1}")]
    Failed(String, String),
}

/// An automatable capability. `is_side_effecting` decides whether the
/// approval gate applies.
pub trait Tool: Send + Sync {
    fn name(&self) -> &'static str;
    fn description(&self) -> &'static str;
    fn is_side_effecting(&self) -> bool;
    fn execute(&self, args: &serde_json::Value) -> Result<serde_json::Value, ToolError>;

    /// Human-readable plan line used when the gate blocks execution.
    fn plan(&self, args: &serde_json::Value) -> String {
        format!("{}({})", self.name(), args)
    }
}

/// Registry of tools available to the loop.
#[derive(Default)]
pub struct ToolRegistry {
    tools: BTreeMap<&'static str, Box<dyn Tool>>,
}

impl ToolRegistry {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn register(&mut self, tool: Box<dyn Tool>) {
        self.tools.insert(tool.name(), tool);
    }

    pub fn names(&self) -> Vec<&'static str> {
        self.tools.keys().copied().collect()
    }

    /// Invoke a tool under the given gate. Side-effecting tools only run
    /// when the gate is `Approved`; otherwise they return their plan.
    pub fn invoke(
        &self,
        invocation: &ToolInvocation,
        gate: &ApprovalGate,
    ) -> Result<ToolResult, ToolError> {
        let tool = self
            .tools
            .get(invocation.tool.as_str())
            .ok_or_else(|| ToolError::Unknown(invocation.tool.clone()))?;

        if tool.is_side_effecting() && !gate.permits(tool.name()) {
            return Ok(ToolResult::Planned {
                description: tool.plan(&invocation.args),
            });
        }

        tool.execute(&invocation.args)
            .map(|output| ToolResult::Executed { output })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    struct Echo;
    impl Tool for Echo {
        fn name(&self) -> &'static str {
            "echo"
        }
        fn description(&self) -> &'static str {
            "returns its arguments"
        }
        fn is_side_effecting(&self) -> bool {
            false
        }
        fn execute(&self, args: &serde_json::Value) -> Result<serde_json::Value, ToolError> {
            Ok(args.clone())
        }
    }

    struct Deploy;
    impl Tool for Deploy {
        fn name(&self) -> &'static str {
            "deploy"
        }
        fn description(&self) -> &'static str {
            "deploys the public website"
        }
        fn is_side_effecting(&self) -> bool {
            true
        }
        fn execute(&self, _args: &serde_json::Value) -> Result<serde_json::Value, ToolError> {
            Ok(serde_json::json!({ "deployed": true }))
        }
    }

    fn registry() -> ToolRegistry {
        let mut r = ToolRegistry::new();
        r.register(Box::new(Echo));
        r.register(Box::new(Deploy));
        r
    }

    #[test]
    fn read_only_tools_run_under_dry_run() {
        let result = registry()
            .invoke(
                &ToolInvocation {
                    tool: "echo".into(),
                    args: serde_json::json!({ "hello": "world" }),
                },
                &ApprovalGate::DryRun,
            )
            .unwrap();
        assert_eq!(
            result,
            ToolResult::Executed {
                output: serde_json::json!({ "hello": "world" })
            }
        );
    }

    #[test]
    fn side_effecting_tools_are_gated() {
        let result = registry()
            .invoke(
                &ToolInvocation {
                    tool: "deploy".into(),
                    args: serde_json::json!({ "target": "www.sirinx.co" }),
                },
                &ApprovalGate::DryRun,
            )
            .unwrap();
        assert!(matches!(result, ToolResult::Planned { .. }));
    }

    #[test]
    fn approval_unlocks_side_effects() {
        let result = registry()
            .invoke(
                &ToolInvocation {
                    tool: "deploy".into(),
                    args: serde_json::json!({}),
                },
                &ApprovalGate::approved("PR-MONO-011"),
            )
            .unwrap();
        assert_eq!(
            result,
            ToolResult::Executed {
                output: serde_json::json!({ "deployed": true })
            }
        );
    }

    #[test]
    fn allowlist_permits_only_named_tools() {
        let gate = ApprovalGate::allowlist("NODE-CONNECT-OK", ["deploy"]);
        let reg = registry();

        // Allowlisted side-effecting tool runs.
        let allowed = reg
            .invoke(
                &ToolInvocation {
                    tool: "deploy".into(),
                    args: serde_json::json!({}),
                },
                &gate,
            )
            .unwrap();
        assert!(matches!(allowed, ToolResult::Executed { .. }));

        // A different side-effecting tool would still be dry-run: prove
        // via the gate check directly.
        assert!(!gate.permits("send_campaign"));
        assert!(!gate.permits("rm_rf"));
    }

    #[test]
    fn allowlist_never_widens_by_default() {
        // An empty allowlist behaves exactly like DryRun.
        let gate = ApprovalGate::allowlist("EMPTY", Vec::<String>::new());
        let result = registry()
            .invoke(
                &ToolInvocation {
                    tool: "deploy".into(),
                    args: serde_json::json!({}),
                },
                &gate,
            )
            .unwrap();
        assert!(matches!(result, ToolResult::Planned { .. }));
    }

    #[test]
    fn unknown_tool_is_an_error() {
        let err = registry()
            .invoke(
                &ToolInvocation {
                    tool: "rm-rf".into(),
                    args: serde_json::Value::Null,
                },
                &ApprovalGate::DryRun,
            )
            .unwrap_err();
        assert_eq!(err, ToolError::Unknown("rm-rf".into()));
    }
}

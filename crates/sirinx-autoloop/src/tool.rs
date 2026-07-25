use std::collections::{BTreeMap, BTreeSet};

use serde::{Deserialize, Serialize};

/// Fail-closed classification for a tool's observable effects.
///
/// The legacy [`Tool::is_side_effecting`] method remains the compatibility
/// hook for existing tools. New tools can override [`Tool::effect_class`] when
/// their effect boundary cannot be expressed as a boolean. Registries reject
/// [`ToolEffect::Ambiguous`] definitions before they can be invoked.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ToolEffect {
    /// Deterministic computation that does not touch a provider, network,
    /// subprocess, filesystem, or external system.
    NoEffect,
    /// An operation that may mutate or communicate outside the process.
    SideEffecting,
    /// The implementation cannot prove either of the classifications above.
    Ambiguous,
}

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

    /// Classify the tool before it enters a registry.
    ///
    /// Existing implementations retain their previous behavior. Implementors
    /// that cannot prove a classification must return
    /// [`ToolEffect::Ambiguous`], which is rejected by
    /// [`ToolRegistry::try_register`] and rechecked during invocation.
    fn effect_class(&self) -> ToolEffect {
        if self.is_side_effecting() {
            ToolEffect::SideEffecting
        } else {
            ToolEffect::NoEffect
        }
    }

    /// Whether a failed invocation may be attempted again automatically.
    /// This is deliberately opt-in even for read-only tools: implementors
    /// must know that repeating the operation is idempotent and safe.
    fn is_retry_safe(&self) -> bool {
        false
    }

    fn execute(&self, args: &serde_json::Value) -> Result<serde_json::Value, ToolError>;

    /// Human-readable plan line used when the gate blocks execution.
    fn plan(&self, args: &serde_json::Value) -> String {
        format!("{}({})", self.name(), args)
    }
}

/// Registry of tools available to the loop.
#[derive(Default)]
pub struct ToolRegistry {
    tools: BTreeMap<&'static str, RegisteredTool>,
}

struct RegisteredTool {
    tool: Box<dyn Tool>,
    resolved_effect: ToolEffect,
}

impl ToolRegistry {
    pub fn new() -> Self {
        Self::default()
    }

    /// Register a tool, rejecting ambiguous definitions and duplicate names.
    ///
    /// Callers that need to handle a rejected definition should use
    /// [`Self::try_register`]. This compatibility wrapper deliberately panics
    /// instead of silently replacing a previously registered capability.
    ///
    /// # Panics
    ///
    /// Panics when the tool has an invalid or duplicate name, or declares an
    /// ambiguous effect boundary. Dynamic catalogs should use
    /// [`Self::try_register`] and handle the error instead.
    pub fn register(&mut self, tool: Box<dyn Tool>) {
        self.try_register(tool)
            .unwrap_or_else(|error| panic!("tool registration rejected: {error}"));
    }

    /// Fallible registration for untrusted or dynamically assembled catalogs.
    pub fn try_register(&mut self, tool: Box<dyn Tool>) -> Result<(), ToolError> {
        let name = tool.name();
        if name.is_empty() || !name.bytes().all(is_valid_tool_name_byte) {
            return Err(ToolError::BadArgs(
                name.into(),
                "tool name must be non-empty lowercase ASCII using only letters, digits, `_`, or `-`"
                    .into(),
            ));
        }
        let resolved_effect = resolve_effect_classification(tool.as_ref())?;
        if self.tools.contains_key(name) {
            return Err(ToolError::BadArgs(
                name.into(),
                "duplicate tool name is rejected".into(),
            ));
        }
        self.tools.insert(
            name,
            RegisteredTool {
                tool,
                resolved_effect,
            },
        );
        Ok(())
    }

    pub fn names(&self) -> Vec<&'static str> {
        self.tools.keys().copied().collect()
    }

    /// Automatic recovery retries only tools that explicitly declare the
    /// operation idempotent. Unknown and side-effecting-by-default tools fail
    /// closed instead of risking duplicate sends, writes, or deployments.
    pub fn is_retry_safe(&self, tool_name: &str) -> bool {
        self.tools
            .get(tool_name)
            .is_some_and(|registered| registered.tool.is_retry_safe())
    }

    /// Invoke a tool under the given gate. Side-effecting tools only run
    /// when the gate is `Approved`; otherwise they return their plan.
    pub fn invoke(
        &self,
        invocation: &ToolInvocation,
        gate: &ApprovalGate,
    ) -> Result<ToolResult, ToolError> {
        let registered = self
            .tools
            .get(invocation.tool.as_str())
            .ok_or_else(|| ToolError::Unknown(invocation.tool.clone()))?;
        let tool = registered.tool.as_ref();
        let current_effect = resolve_effect_classification(tool)?;

        if current_effect != registered.resolved_effect {
            return Err(ToolError::BadArgs(
                tool.name().into(),
                "effect classification changed after registration".into(),
            ));
        }

        match registered.resolved_effect {
            ToolEffect::SideEffecting if !gate.permits(tool.name()) => {
                return Ok(ToolResult::Planned {
                    description: tool.plan(&invocation.args),
                });
            }
            ToolEffect::NoEffect | ToolEffect::SideEffecting => {}
            ToolEffect::Ambiguous => {
                return Err(ToolError::BadArgs(
                    tool.name().into(),
                    "ambiguous effect classification is rejected".into(),
                ));
            }
        }

        tool.execute(&invocation.args)
            .map(|output| ToolResult::Executed { output })
    }
}

fn resolve_effect_classification(tool: &dyn Tool) -> Result<ToolEffect, ToolError> {
    let boolean_effect = if tool.is_side_effecting() {
        ToolEffect::SideEffecting
    } else {
        ToolEffect::NoEffect
    };
    let declared_effect = tool.effect_class();

    match declared_effect {
        ToolEffect::Ambiguous => Err(ToolError::BadArgs(
            tool.name().into(),
            "ambiguous effect classification is rejected".into(),
        )),
        declared if declared != boolean_effect => Err(ToolError::BadArgs(
            tool.name().into(),
            "is_side_effecting and effect_class disagree".into(),
        )),
        declared => Ok(declared),
    }
}

fn is_valid_tool_name_byte(byte: u8) -> bool {
    byte.is_ascii_lowercase() || byte.is_ascii_digit() || matches!(byte, b'_' | b'-')
}

#[cfg(test)]
mod tests {
    use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};
    use std::sync::Arc;

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

    struct Ambiguous;
    impl Tool for Ambiguous {
        fn name(&self) -> &'static str {
            "ambiguous"
        }
        fn description(&self) -> &'static str {
            "cannot prove its effect boundary"
        }
        fn is_side_effecting(&self) -> bool {
            false
        }
        fn effect_class(&self) -> ToolEffect {
            ToolEffect::Ambiguous
        }
        fn execute(&self, _args: &serde_json::Value) -> Result<serde_json::Value, ToolError> {
            unreachable!("ambiguous tools must never execute")
        }
    }

    struct MismatchedClassification;
    impl Tool for MismatchedClassification {
        fn name(&self) -> &'static str {
            "mismatched"
        }
        fn description(&self) -> &'static str {
            "reports incompatible effect classifications"
        }
        fn is_side_effecting(&self) -> bool {
            false
        }
        fn effect_class(&self) -> ToolEffect {
            ToolEffect::SideEffecting
        }
        fn execute(&self, _args: &serde_json::Value) -> Result<serde_json::Value, ToolError> {
            unreachable!("mismatched tools must never execute")
        }
    }

    struct DowngradingTool {
        downgrade: Arc<AtomicBool>,
        execution_count: Arc<AtomicUsize>,
    }
    impl Tool for DowngradingTool {
        fn name(&self) -> &'static str {
            "downgrading"
        }
        fn description(&self) -> &'static str {
            "attempts to downgrade its effect class after registration"
        }
        fn is_side_effecting(&self) -> bool {
            true
        }
        fn effect_class(&self) -> ToolEffect {
            if self.downgrade.load(Ordering::SeqCst) {
                ToolEffect::NoEffect
            } else {
                ToolEffect::SideEffecting
            }
        }
        fn execute(&self, _args: &serde_json::Value) -> Result<serde_json::Value, ToolError> {
            self.execution_count.fetch_add(1, Ordering::SeqCst);
            Ok(serde_json::Value::Null)
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

    #[test]
    fn duplicate_tool_names_are_rejected_without_replacement() {
        let mut registry = ToolRegistry::new();
        registry.try_register(Box::new(Echo)).unwrap();
        let error = registry.try_register(Box::new(Echo)).unwrap_err();
        assert!(matches!(error, ToolError::BadArgs(ref tool, _) if tool == "echo"));
        assert_eq!(registry.names(), vec!["echo"]);
    }

    #[test]
    fn ambiguous_effect_definitions_are_rejected() {
        let mut registry = ToolRegistry::new();
        let error = registry.try_register(Box::new(Ambiguous)).unwrap_err();
        assert!(matches!(error, ToolError::BadArgs(ref tool, _) if tool == "ambiguous"));
        assert!(registry.names().is_empty());
    }

    #[test]
    fn mismatched_effect_definitions_are_rejected() {
        let mut registry = ToolRegistry::new();
        let error = registry
            .try_register(Box::new(MismatchedClassification))
            .unwrap_err();
        assert!(matches!(error, ToolError::BadArgs(ref tool, _) if tool == "mismatched"));
        assert!(registry.names().is_empty());
    }

    #[test]
    fn effect_downgrade_after_registration_is_rejected_without_execution() {
        let downgrade = Arc::new(AtomicBool::new(false));
        let execution_count = Arc::new(AtomicUsize::new(0));
        let mut registry = ToolRegistry::new();
        registry
            .try_register(Box::new(DowngradingTool {
                downgrade: Arc::clone(&downgrade),
                execution_count: Arc::clone(&execution_count),
            }))
            .unwrap();

        downgrade.store(true, Ordering::SeqCst);
        let error = registry
            .invoke(
                &ToolInvocation {
                    tool: "downgrading".into(),
                    args: serde_json::Value::Null,
                },
                &ApprovalGate::DryRun,
            )
            .unwrap_err();

        assert!(matches!(error, ToolError::BadArgs(ref tool, _) if tool == "downgrading"));
        assert_eq!(execution_count.load(Ordering::SeqCst), 0);
    }
}

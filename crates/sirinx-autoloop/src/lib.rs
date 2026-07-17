//! Autonomous agentic loop with tool automation.
//!
//! The loop drives a plan → act → observe cycle over a registry of
//! [`Tool`]s, feeding results through the 47 Ronin dispatcher. Two
//! governance rules from the monorepo's operating protocol (`AGENTS.md`)
//! are enforced in code, not by convention:
//!
//! 1. **Approval gate** — side-effecting tools never execute under the
//!    default [`ApprovalGate::DryRun`] policy; they return a plan of what
//!    *would* run. Real execution requires an explicit
//!    [`ApprovalGate::Approved`] constructed by the operator.
//! 2. **Bounded loops** — every run has a hard iteration budget so an
//!    autonomous loop can never spin unattended.

pub mod loop_runner;
pub mod tool;

pub use loop_runner::{AutoLoop, LoopConfig, LoopError, LoopOutcome, StepRecord};
pub use tool::{ApprovalGate, Tool, ToolError, ToolInvocation, ToolRegistry, ToolResult};

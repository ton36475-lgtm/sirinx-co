//! Local-only Harness Engineering contracts and evidence state machine.
//!
//! This module is deliberately **validation-only**. It does not launch the
//! registered CLI agents, invoke providers, execute Git or test commands,
//! connect MCP, write external state, deploy, push, or send messages.

mod command_catalog;
mod contracts;
mod git_guard;
mod receipts;
mod retrieval;
mod state;

pub use command_catalog::{command_spec, command_spec_digest, TestCommandId, TestCommandSpec};
pub use contracts::{
    grant_digest_for, lease_digest_for, plan_digest_for, scope_digest_for, AdmissionDecision,
    AdmissionGrantV1, ContextBundleRefV1, HarnessBudgetsV1, HarnessContractError, HarnessDenialsV1,
    HarnessEngineeringPlanV1, PathLeaseV1, StopCondition, MANDATORY_STOP_CONDITIONS,
    MAX_COMMAND_SECONDS, MAX_CONTEXT_ITEMS, MAX_CONTEXT_TEXT_BYTES, MAX_REPAIR_CYCLES,
    MAX_RUN_SECONDS, MAX_TEST_COMMANDS,
};
pub use git_guard::{
    git_evidence_digest_for, validate_git_diff_evidence, ChangedPathV1, GitDiffEvidenceV1,
    GitGuardError, GitPathStatus,
};
#[cfg(test)]
pub(crate) use receipts::{receipt_hash_for, ReceiptChainV1, ReceiptIdentityV1};
pub use receipts::{
    HarnessState, ReceiptChainError, ReceiptEventKind, ReceiptEventV1, ReceiptVerdict,
    GENESIS_RECEIPT_HASH,
};
pub use retrieval::{
    RetrievalEvidenceError, RetrievalEvidenceV1, MAX_RETRIEVAL_OUTPUT_BYTES, RETRIEVAL_COMMAND_ID,
};
pub use state::{
    test_execution_receipt_digest_for, AdmissionNonceLedgerV1, HarnessEngineeringRunV1,
    HarnessRunError, MakerReceiptV1, TestExecutionReceiptV1, VerifierDecision, VerifierReceiptV1,
};

#[cfg(test)]
mod tests;

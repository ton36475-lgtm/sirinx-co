//! Pure validation of independently collected Git evidence.
//!
//! This module never invokes Git. The future executor must collect the
//! before/after evidence with fixed argv and feed the bounded result here.

use std::collections::HashSet;
use std::path::{Component, Path};

use serde::{Deserialize, Serialize};

use super::contracts::{
    hash_json, validate_digest, HarnessContractError, HarnessEngineeringPlanV1, PathLeaseV1,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum GitPathStatus {
    Added,
    Modified,
    Deleted,
    Renamed,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ChangedPathV1 {
    pub path: String,
    pub previous_path: Option<String>,
    pub status: GitPathStatus,
    pub bytes_changed: u64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct GitDiffEvidenceV1 {
    pub schema_version: String,
    pub repository_root: String,
    pub worktree: String,
    pub observed_head_sha: String,
    pub clean_start_observed: bool,
    pub fixed_argv_verified: bool,
    pub shell_used: bool,
    pub collector_network_denied: bool,
    pub provider_environment_scrubbed: bool,
    pub provider_calls: u32,
    pub external_calls: u32,
    pub secret_output_detected: bool,
    pub secret_private_read_detected: bool,
    pub external_write_attempted: bool,
    pub deploy_attempted: bool,
    pub push_attempted: bool,
    pub message_send_attempted: bool,
    pub diff_sha256: String,
    pub changed_paths: Vec<ChangedPathV1>,
}

pub fn validate_git_diff_evidence(
    plan: &HarnessEngineeringPlanV1,
    lease: &PathLeaseV1,
    evidence: &GitDiffEvidenceV1,
) -> Result<(), GitGuardError> {
    if evidence.schema_version != "1.0.0"
        || evidence.repository_root != plan.run_plan.repository_root.to_string_lossy()
        || evidence.worktree != lease.worktree
        || evidence.observed_head_sha != plan.run_plan.base_sha
        || evidence.clean_start_observed != plan.expected_clean_start
        || !evidence.fixed_argv_verified
        || evidence.shell_used
        || !evidence.collector_network_denied
        || !evidence.provider_environment_scrubbed
        || evidence.provider_calls != 0
        || evidence.external_calls != 0
        || evidence.secret_output_detected
        || evidence.secret_private_read_detected
        || evidence.external_write_attempted
        || evidence.deploy_attempted
        || evidence.push_attempted
        || evidence.message_send_attempted
    {
        return Err(GitGuardError::IdentityOrSandboxMismatch);
    }
    validate_digest(&evidence.diff_sha256)?;
    let allowed: HashSet<_> = lease.exact_paths.iter().map(String::as_str).collect();
    let mut observed = HashSet::new();
    let mut total_bytes = 0u64;
    if evidence.changed_paths.len() > lease.max_files {
        return Err(GitGuardError::FileBudgetExceeded);
    }
    for changed in &evidence.changed_paths {
        validate_relative_path(&changed.path)?;
        match (changed.status, changed.previous_path.as_deref()) {
            (GitPathStatus::Renamed, Some(previous_path)) => {
                validate_relative_path(previous_path)?;
                if !allowed.contains(previous_path) {
                    return Err(GitGuardError::OutOfLeasePath(previous_path.to_owned()));
                }
            }
            (GitPathStatus::Renamed, None) | (_, Some(_)) => {
                return Err(GitGuardError::RenameEvidenceMismatch);
            }
            (_, None) => {}
        }
        if !observed.insert(changed.path.as_str()) {
            return Err(GitGuardError::DuplicateChangedPath(changed.path.clone()));
        }
        if !allowed.contains(changed.path.as_str()) {
            return Err(GitGuardError::OutOfLeasePath(changed.path.clone()));
        }
        total_bytes = total_bytes
            .checked_add(changed.bytes_changed)
            .ok_or(GitGuardError::ByteBudgetExceeded)?;
    }
    if total_bytes > lease.max_bytes {
        return Err(GitGuardError::ByteBudgetExceeded);
    }
    Ok(())
}

pub fn git_evidence_digest_for(evidence: &GitDiffEvidenceV1) -> String {
    let value = serde_json::to_value(evidence).expect("Git evidence serialization is infallible");
    hash_json(&value)
}

fn validate_relative_path(path: &str) -> Result<(), HarnessContractError> {
    let parsed = Path::new(path);
    if path.is_empty()
        || path.trim() != path
        || parsed.is_absolute()
        || !parsed
            .components()
            .all(|component| matches!(component, Component::Normal(_)))
    {
        return Err(HarnessContractError::InvalidExactPath(path.to_owned()));
    }
    Ok(())
}

#[derive(Debug, thiserror::Error)]
pub enum GitGuardError {
    #[error("Git evidence identity, base, or sandbox proof does not match the plan")]
    IdentityOrSandboxMismatch,
    #[error("changed file count exceeds the exact lease")]
    FileBudgetExceeded,
    #[error("changed byte count exceeds the exact lease")]
    ByteBudgetExceeded,
    #[error("changed path is duplicated: {0}")]
    DuplicateChangedPath(String),
    #[error("changed path is outside the exact lease: {0}")]
    OutOfLeasePath(String),
    #[error("rename evidence must bind exactly one in-lease previous path")]
    RenameEvidenceMismatch,
    #[error(transparent)]
    Contract(#[from] HarnessContractError),
}

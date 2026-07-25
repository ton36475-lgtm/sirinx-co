//! Fixed-port evidence contract for provider-free context retrieval.

use serde::{Deserialize, Serialize};

use super::contracts::{validate_digest, ContextBundleRefV1, HarnessContractError};

pub const RETRIEVAL_COMMAND_ID: &str = "graph_memory_retrieve_context_v1";
pub const MAX_RETRIEVAL_OUTPUT_BYTES: u64 = 128 * 1024;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RetrievalEvidenceV1 {
    pub schema_version: String,
    pub command_id: String,
    pub context_bundle: ContextBundleRefV1,
    pub stdout_sha256: String,
    pub stderr_sha256: String,
    pub stdout_bytes: u64,
    pub stderr_bytes: u64,
    pub exit_code: i32,
    pub fixed_argv_verified: bool,
    pub shell_used: bool,
    pub network_denied: bool,
    pub provider_environment_scrubbed: bool,
    pub provider_calls: u32,
    pub external_calls: u32,
    pub secret_output_detected: bool,
    pub secret_private_read_detected: bool,
    pub external_write_attempted: bool,
    pub deploy_attempted: bool,
    pub push_attempted: bool,
    pub message_send_attempted: bool,
    pub raw_query_persisted: bool,
    pub vault_inventory_attempted: bool,
    pub vault_projection_attempted: bool,
}

impl RetrievalEvidenceV1 {
    pub fn validate(&self) -> Result<(), RetrievalEvidenceError> {
        if self.schema_version != "1.0.0"
            || self.command_id != RETRIEVAL_COMMAND_ID
            || self.exit_code != 0
            || !self.fixed_argv_verified
            || self.shell_used
            || !self.network_denied
            || !self.provider_environment_scrubbed
            || self.provider_calls != 0
            || self.external_calls != 0
            || self.secret_output_detected
            || self.secret_private_read_detected
            || self.external_write_attempted
            || self.deploy_attempted
            || self.push_attempted
            || self.message_send_attempted
            || self.raw_query_persisted
            || self.vault_inventory_attempted
            || self.vault_projection_attempted
            || self.stdout_bytes == 0
            || self.stdout_bytes > MAX_RETRIEVAL_OUTPUT_BYTES
        {
            return Err(RetrievalEvidenceError::Policy);
        }
        validate_digest(&self.stdout_sha256)?;
        validate_digest(&self.stderr_sha256)?;
        self.context_bundle.validate()?;
        Ok(())
    }
}

#[derive(Debug, thiserror::Error)]
pub enum RetrievalEvidenceError {
    #[error("retrieval evidence violates the fixed provider-free port")]
    Policy,
    #[error(transparent)]
    Contract(#[from] HarnessContractError),
}

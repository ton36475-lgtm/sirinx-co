use serde::{Deserialize, Serialize};

use crate::layer::Layer;
use crate::roster::AgentId;

/// Work item handed to an agent.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentInput {
    /// Event type, e.g. `lead-scanned`, `roi-scored`.
    pub event: String,
    pub payload: serde_json::Value,
}

/// Result produced by an agent. `publish` carries the event the agent
/// wants forwarded to the next layer, if any.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentOutput {
    pub summary: String,
    pub publish: Option<AgentInput>,
}

#[derive(Debug, thiserror::Error)]
pub enum AgentError {
    #[error("agent {0:?} failed: {1}")]
    Processing(AgentId, String),
    #[error("input payload was not in the expected shape: {0}")]
    BadPayload(String),
}

/// Every Ronin implements this trait — the Rust equivalent of the
/// TypeScript `BaseAgent.process(input)` pattern.
pub trait Agent: Send + Sync {
    fn id(&self) -> AgentId;

    fn layer(&self) -> Layer {
        self.id().layer().expect("agent id must be in roster range")
    }

    fn process(&self, input: AgentInput) -> Result<AgentOutput, AgentError>;
}

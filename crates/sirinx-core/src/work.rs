use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A unit of work registered with the control plane. Every agent and
/// node shares one queue, so intake happens once and is visible
/// everywhere (Hermes dashboard, sirinx-control, workers).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PendingWork {
    pub id: Uuid,
    /// Where the work came from, e.g. `hermes-command-center`,
    /// `telegram`, `agent:kuranosuke-01`.
    pub source: String,
    pub title: String,
    #[serde(default)]
    pub detail: serde_json::Value,
}

impl PendingWork {
    pub fn new(
        source: impl Into<String>,
        title: impl Into<String>,
        detail: serde_json::Value,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            source: source.into(),
            title: title.into(),
            detail,
        }
    }
}

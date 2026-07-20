use serde::{Deserialize, Serialize};
use uuid::Uuid;

fn default_status() -> String {
    "pending".to_owned()
}

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
    /// `pending` | `completed`.
    #[serde(default = "default_status")]
    pub status: String,
    /// Set by the store when the work is marked complete. On Postgres
    /// this is the server's own clock (`now()`), not a client-supplied
    /// value — the timestamp a completion is trusted only once the
    /// backing store has recorded it.
    #[serde(default)]
    pub completed_at: Option<String>,
    /// Who/what completed it, e.g. `agent:gengo-35`, `telegram:owner`.
    #[serde(default)]
    pub completed_by: Option<String>,
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
            status: default_status(),
            completed_at: None,
            completed_by: None,
        }
    }
}

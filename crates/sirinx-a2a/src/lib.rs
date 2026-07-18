//! Agent-to-agent (A2A) coordination for the SIRINX node mesh.
//!
//! Two pieces:
//!
//! - [`AgentCard`] + [`OmniRoute`] — every node/agent publishes a card
//!   describing its capabilities; OmniRoute picks the best card for a
//!   task by capability match (the Rust successor to the Node
//!   `openrouter-fusion-router` "hybrid routing" and the hermes-os A2A
//!   team coordinator on 127.0.0.1:9000).
//! - [`SyncRequest`] / [`SyncResponse`] — delta sync between nodes:
//!   a peer sends its card plus the work-item ids it already knows;
//!   the responder registers the card, answers with the missing
//!   [`PendingWork`] items and every card it knows. Combined with the
//!   Postgres `web_pending_work` NOTIFY backbone this gives eventual
//!   consistency across Mac, PC, and cloud nodes.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use sirinx_core::PendingWork;

/// A2A-style agent card: who this node/agent is and what it can do.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentCard {
    /// Stable id, e.g. `mac-mini-m2`, `agent:gengo-36`, `cloud-worker-1`.
    pub id: String,
    pub name: String,
    /// Capability tags, e.g. `rust-build`, `lead-scan`, `telegram-draft`.
    pub capabilities: Vec<String>,
    /// Where to reach this node's control plane, e.g. `http://127.0.0.1:8711`.
    pub endpoint: String,
    /// Higher wins ties during routing (default 0).
    #[serde(default)]
    pub priority: i32,
}

/// Capability-based router over registered agent cards.
#[derive(Debug, Default)]
pub struct OmniRoute {
    cards: BTreeMap<String, AgentCard>,
}

impl OmniRoute {
    pub fn new() -> Self {
        Self::default()
    }

    /// Register or refresh a card (idempotent by id).
    pub fn register(&mut self, card: AgentCard) {
        self.cards.insert(card.id.clone(), card);
    }

    pub fn cards(&self) -> Vec<AgentCard> {
        self.cards.values().cloned().collect()
    }

    pub fn len(&self) -> usize {
        self.cards.len()
    }

    pub fn is_empty(&self) -> bool {
        self.cards.is_empty()
    }

    /// Pick the best card that offers every required capability.
    /// Score: fewest surplus capabilities first (most specialized wins),
    /// then highest priority, then lexicographic id for determinism.
    pub fn route(&self, required: &[String]) -> Option<&AgentCard> {
        self.cards
            .values()
            .filter(|card| {
                required
                    .iter()
                    .all(|cap| card.capabilities.iter().any(|c| c == cap))
            })
            .min_by(|a, b| {
                let surplus_a = a.capabilities.len() - required.len();
                let surplus_b = b.capabilities.len() - required.len();
                surplus_a
                    .cmp(&surplus_b)
                    .then(b.priority.cmp(&a.priority))
                    .then(a.id.cmp(&b.id))
            })
    }
}

/// What a peer sends to sync with this node.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncRequest {
    pub node: AgentCard,
    /// Work-item ids the peer already has.
    #[serde(default)]
    pub known_work_ids: Vec<Uuid>,
}

/// What this node answers with.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncResponse {
    pub node: AgentCard,
    /// Pending work the peer was missing.
    pub missing_work: Vec<PendingWork>,
    /// Every agent card this node knows (including the peer's, echoed).
    pub peer_agents: Vec<AgentCard>,
}

/// Work items the peer does not know yet.
pub fn diff_work(peer_known: &[Uuid], local: &[PendingWork]) -> Vec<PendingWork> {
    local
        .iter()
        .filter(|item| !peer_known.contains(&item.id))
        .cloned()
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn card(id: &str, caps: &[&str], priority: i32) -> AgentCard {
        AgentCard {
            id: id.into(),
            name: id.into(),
            capabilities: caps.iter().map(|c| (*c).to_string()).collect(),
            endpoint: format!("http://{id}.local:8711"),
            priority,
        }
    }

    #[test]
    fn routes_to_most_specialized_capable_card() {
        let mut router = OmniRoute::new();
        router.register(card(
            "generalist",
            &["rust-build", "lead-scan", "deploy"],
            0,
        ));
        router.register(card("builder", &["rust-build"], 0));

        let picked = router.route(&["rust-build".into()]).unwrap();
        assert_eq!(picked.id, "builder");
    }

    #[test]
    fn priority_breaks_ties() {
        let mut router = OmniRoute::new();
        router.register(card("node-a", &["lead-scan"], 0));
        router.register(card("node-b", &["lead-scan"], 5));

        assert_eq!(router.route(&["lead-scan".into()]).unwrap().id, "node-b");
    }

    #[test]
    fn no_route_when_capability_missing() {
        let mut router = OmniRoute::new();
        router.register(card("builder", &["rust-build"], 0));
        assert!(router.route(&["quantum-sync".into()]).is_none());
    }

    #[test]
    fn registration_is_idempotent_by_id() {
        let mut router = OmniRoute::new();
        router.register(card("node-a", &["x"], 0));
        router.register(card("node-a", &["x", "y"], 1));
        assert_eq!(router.len(), 1);
        assert_eq!(router.cards()[0].priority, 1);
    }

    #[test]
    fn diff_returns_only_unknown_items() {
        let a = PendingWork::new("test", "known", serde_json::Value::Null);
        let b = PendingWork::new("test", "unknown", serde_json::Value::Null);
        let local = vec![a.clone(), b.clone()];

        let missing = diff_work(&[a.id], &local);
        assert_eq!(missing.len(), 1);
        assert_eq!(missing[0].id, b.id);
    }

    #[test]
    fn sync_types_roundtrip_camel_case() {
        let req = SyncRequest {
            node: card("mac-mini-m2", &["rust-build"], 0),
            known_work_ids: vec![],
        };
        let json = serde_json::to_value(&req).unwrap();
        assert!(json["knownWorkIds"].is_array());
        let back: SyncRequest = serde_json::from_value(json).unwrap();
        assert_eq!(back.node.id, "mac-mini-m2");
    }
}

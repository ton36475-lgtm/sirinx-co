use serde::{Deserialize, Serialize};

/// Runtime state for an operator-controlled release gate.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum GateState {
    Hold,
    Open,
}

/// Persisted release-gate decision shared by every control-plane node.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Gate {
    pub name: String,
    pub state: GateState,
    /// Operator ticket recorded for an open gate. Held gates have no ticket.
    pub ticket: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn gate_wire_format_remains_compatible() {
        let gate = Gate {
            name: "deploy".into(),
            state: GateState::Open,
            ticket: Some("GO-LIVE-001".into()),
        };

        let value = serde_json::to_value(gate).unwrap();
        assert_eq!(value["name"], "deploy");
        assert_eq!(value["state"], "open");
        assert_eq!(value["ticket"], "GO-LIVE-001");
    }
}

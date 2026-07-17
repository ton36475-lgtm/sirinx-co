use serde::{Deserialize, Serialize};

/// The six layers of the 47 Ronin architecture.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Layer {
    /// L1 Perception — data collection, scanning.
    Perception,
    /// L2 Analysis — processing, scoring, insights.
    Analysis,
    /// L3 Decision — strategy, proposals, decisions.
    Decision,
    /// L4 Coordination — orchestration, execution.
    Coordination,
    /// L5 Research — AI trends, benchmarks, R&D.
    Research,
    /// Kai — the single customer-facing chatbot.
    Chatbot,
}

impl Layer {
    /// Token budget per agent invocation.
    pub fn token_budget(self) -> u32 {
        match self {
            Layer::Perception => 4_000,
            Layer::Analysis => 8_000,
            Layer::Decision => 16_000,
            Layer::Coordination => 32_000,
            Layer::Research => 128_000,
            Layer::Chatbot => 16_000,
        }
    }

    /// The layer an operational agent is allowed to publish work to.
    /// `None` for L4 (end of the operational chain), L5 (research
    /// advisories use a separate channel), and the chatbot.
    pub fn next_operational(self) -> Option<Layer> {
        match self {
            Layer::Perception => Some(Layer::Analysis),
            Layer::Analysis => Some(Layer::Decision),
            Layer::Decision => Some(Layer::Coordination),
            Layer::Coordination | Layer::Research | Layer::Chatbot => None,
        }
    }

    pub fn is_operational(self) -> bool {
        matches!(
            self,
            Layer::Perception | Layer::Analysis | Layer::Decision | Layer::Coordination
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn budgets_match_platform_spec() {
        assert_eq!(Layer::Perception.token_budget(), 4_000);
        assert_eq!(Layer::Analysis.token_budget(), 8_000);
        assert_eq!(Layer::Decision.token_budget(), 16_000);
        assert_eq!(Layer::Coordination.token_budget(), 32_000);
        assert_eq!(Layer::Research.token_budget(), 128_000);
        assert_eq!(Layer::Chatbot.token_budget(), 16_000);
    }

    #[test]
    fn operational_chain_is_l1_to_l4() {
        assert_eq!(Layer::Perception.next_operational(), Some(Layer::Analysis));
        assert_eq!(Layer::Analysis.next_operational(), Some(Layer::Decision));
        assert_eq!(Layer::Decision.next_operational(), Some(Layer::Coordination));
        assert_eq!(Layer::Coordination.next_operational(), None);
        assert_eq!(Layer::Research.next_operational(), None);
    }
}

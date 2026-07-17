use serde::{Deserialize, Serialize};

use crate::layer::Layer;

/// Numeric id of a Ronin (1–47) or 0 for Kai the chatbot.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize, Deserialize)]
pub struct AgentId(pub u8);

impl AgentId {
    pub const KAI: AgentId = AgentId(0);

    /// Layer assignment by roster number:
    /// L1: 01–16, L2: 17–25, L3: 26–35, L4: 36–43, L5: 44–47, Kai: 0.
    pub fn layer(self) -> Option<Layer> {
        match self.0 {
            0 => Some(Layer::Chatbot),
            1..=16 => Some(Layer::Perception),
            17..=25 => Some(Layer::Analysis),
            26..=35 => Some(Layer::Decision),
            36..=43 => Some(Layer::Coordination),
            44..=47 => Some(Layer::Research),
            _ => None,
        }
    }
}

/// The full roster. Codenames follow the Akō rōshi; the anchors from the
/// platform docs are kept verbatim (Kuranosuke 01, Kin'emon 16, Jūnai 17,
/// Mimura 44, Yokogawa 45, Kayano 46, Terasaka 47, Kai chatbot).
#[derive(Debug, Default)]
pub struct Roster;

impl Roster {
    pub const SIZE: u8 = 47;

    /// Codename for a roster number, if known.
    pub fn codename(id: AgentId) -> Option<&'static str> {
        Some(match id.0 {
            0 => "Kai",
            1 => "Kuranosuke",
            16 => "Kin'emon",
            17 => "Jūnai",
            25 => "Jūrōzaemon",
            26 => "Kihei",
            36 => "Gengo",
            43 => "Yasoemon",
            44 => "Mimura",
            45 => "Yokogawa",
            46 => "Kayano",
            47 => "Terasaka",
            n if n <= Self::SIZE => return None,
            _ => return None,
        })
    }

    /// All 47 operational/research ids plus Kai.
    pub fn all_ids() -> impl Iterator<Item = AgentId> {
        (0..=Self::SIZE).map(AgentId)
    }

    /// Number of agents in a layer.
    pub fn layer_count(layer: Layer) -> usize {
        Self::all_ids()
            .filter(|id| id.layer() == Some(layer))
            .count()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn layer_counts_match_platform_table() {
        assert_eq!(Roster::layer_count(Layer::Perception), 16);
        assert_eq!(Roster::layer_count(Layer::Analysis), 9);
        assert_eq!(Roster::layer_count(Layer::Decision), 10);
        assert_eq!(Roster::layer_count(Layer::Coordination), 8);
        assert_eq!(Roster::layer_count(Layer::Research), 4);
        assert_eq!(Roster::layer_count(Layer::Chatbot), 1);
    }

    #[test]
    fn total_is_47_ronin_plus_kai() {
        let operational: usize = [
            Layer::Perception,
            Layer::Analysis,
            Layer::Decision,
            Layer::Coordination,
            Layer::Research,
        ]
        .into_iter()
        .map(Roster::layer_count)
        .sum();
        assert_eq!(operational, 47);
    }

    #[test]
    fn anchor_codenames_hold() {
        assert_eq!(Roster::codename(AgentId(1)), Some("Kuranosuke"));
        assert_eq!(Roster::codename(AgentId(16)), Some("Kin'emon"));
        assert_eq!(Roster::codename(AgentId(47)), Some("Terasaka"));
        assert_eq!(Roster::codename(AgentId::KAI), Some("Kai"));
    }

    #[test]
    fn out_of_range_ids_have_no_layer() {
        assert_eq!(AgentId(48).layer(), None);
    }
}

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

    /// Codename for a roster number.
    ///
    /// The 12 anchor names (Kuranosuke 01, Kin'emon 16, Jūnai 17,
    /// Jūrōzaemon 25, Kihei 26, Gengo 36, Yasoemon 43, Mimura 44,
    /// Yokogawa 45, Kayano 46, Terasaka 47, Kai 00) are fixed from the
    /// platform docs. The remaining slots are a **charter assignment**
    /// (see `docs/RONIN_ROSTER.md`) that adapts the Chūshingura cast for
    /// role clarity — a naming design commissioned 2026-07-20, not a
    /// claim of historical exactness nor of code implementation. Only 4
    /// slots have an `impl Agent` (see `ronin.rs`); the rest are charter
    /// identities awaiting implementation.
    pub fn codename(id: AgentId) -> Option<&'static str> {
        Some(match id.0 {
            0 => "Kai",
            // L1 Perception (01–16)
            1 => "Kuranosuke",
            2 => "Sōemon",
            3 => "Chūzaemon",
            4 => "Yazaemon",
            5 => "Yahei",
            6 => "Sukeemon",
            7 => "Genzō",
            8 => "Kansuke",
            9 => "Kanroku",
            10 => "Kyūdayū",
            11 => "Magodayū",
            12 => "Chikara",
            13 => "Tadashichi",
            14 => "Densuke",
            15 => "Isuke",
            16 => "Kin'emon",
            // L2 Analysis (17–25)
            17 => "Jūnai",
            18 => "Kōemon",
            19 => "Hannojō",
            20 => "Kazuemon",
            21 => "Sadaemon",
            22 => "Tōzaemon",
            23 => "Yogorō",
            24 => "Handayū",
            25 => "Jūrōzaemon",
            // L3 Decision (26–35)
            26 => "Kihei",
            27 => "Jūjirō",
            28 => "Shinroku",
            29 => "Gorōemon",
            30 => "Emoshichi",
            31 => "Sawaemon",
            32 => "Heiemon",
            33 => "Sandayū",
            34 => "Uichi",
            35 => "Denzō",
            // L4 Coordination (36–43)
            36 => "Gengo",
            37 => "Jūheiji",
            38 => "Sōzaemon",
            39 => "Kanbei",
            40 => "Sanpei",
            41 => "Rihei",
            42 => "Buemon",
            43 => "Yasoemon",
            // L5 Research (44–47)
            44 => "Mimura",
            45 => "Yokogawa",
            46 => "Kayano",
            47 => "Terasaka",
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
        assert_eq!(Roster::codename(AgentId(17)), Some("Jūnai"));
        assert_eq!(Roster::codename(AgentId(26)), Some("Kihei"));
        assert_eq!(Roster::codename(AgentId(36)), Some("Gengo"));
        assert_eq!(Roster::codename(AgentId(47)), Some("Terasaka"));
        assert_eq!(Roster::codename(AgentId::KAI), Some("Kai"));
    }

    #[test]
    fn every_roster_slot_now_has_a_charter_codename() {
        // Charter (2026-07-20): all 48 slots (Kai + 47 Ronin) are named.
        for id in Roster::all_ids() {
            assert!(
                Roster::codename(id).is_some(),
                "slot {} has no codename",
                id.0
            );
        }
        // Charter names are unique across the whole roster.
        let names: Vec<&str> = Roster::all_ids().filter_map(Roster::codename).collect();
        let mut deduped = names.clone();
        deduped.sort_unstable();
        deduped.dedup();
        assert_eq!(names.len(), deduped.len(), "duplicate codename in roster");
    }

    #[test]
    fn out_of_range_ids_have_no_codename_or_layer() {
        assert_eq!(AgentId(48).layer(), None);
        assert_eq!(Roster::codename(AgentId(48)), None);
    }
}

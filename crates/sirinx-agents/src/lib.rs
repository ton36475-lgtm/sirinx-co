//! SIRINX 47 Ronin agent framework.
//!
//! Rust port of the layer architecture from the AI-WarRoom platform:
//!
//! | Layer | Count | Role                          | Token budget |
//! |-------|-------|-------------------------------|--------------|
//! | L1    | 16    | Perception / data collection  | 4K           |
//! | L2    | 9     | Analysis / scoring            | 8K           |
//! | L3    | 10    | Decision / strategy           | 16K          |
//! | L4    | 8     | Coordination / execution      | 32K          |
//! | L5    | 4     | Research / R&D                | 128K         |
//! | Kai   | 1     | Customer-facing chatbot       | 16K          |
//!
//! The cardinal rule — ห้ามข้ามชั้น (no layer skipping) — is enforced by
//! [`Dispatcher`]: an operational agent may only publish work to the layer
//! directly above its own (L1 → L2 → L3 → L4). L5 research agents publish
//! advisories that any layer may consume, and Kai talks to customers only.

pub mod agent;
pub mod bus;
pub mod fb_group;
pub mod layer;
pub mod line_events;
pub mod partner_referral;
pub mod role_registry;
pub mod ronin;
pub mod roster;
pub mod scorer_round_the_clock;
pub mod scorer_sme;

pub use agent::{Agent, AgentError, AgentInput, AgentOutput};
pub use bus::{DispatchError, Dispatcher, Envelope};
pub use layer::Layer;
pub use role_registry::{
    embedded_role_registry, ActionClass, DepartmentDefinition, DepartmentId, ImplementationStatus,
    RegistryAuthority, RegistryStatus, RoleRegistryError, RoninRoleCard, RoninRoleRegistry,
    RuntimePrincipal, RuntimePrincipalBoundary,
};
pub use ronin::{run_lead_pipeline, FollowUp, LeadTemperature};
pub use roster::{AgentId, Roster};

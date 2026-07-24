//! SIRINX core domain types shared by every crate in the workspace.
//!
//! The lead payload mirrors the public contract published on the
//! Thaimart x SIRINX landing spec (`POST /api/leads`):
//!
//! ```json
//! {
//!   "businessType": "retail_store",
//!   "monthlyElectricBill": 45000,
//!   "availableAreaSqm": 300,
//!   "interest": ["solar_carport", "bess", "ev_charging"],
//!   "source": "thaimart_sirinx_landing",
//!   "consent": { "analytics": true, "marketingContact": false }
//! }
//! ```

pub mod agent_runtime;
pub mod analytics;
pub mod effect_authority;
pub mod gate;
pub mod lead;
pub mod package;
pub mod recovery;
pub mod work;

pub use agent_runtime::{
    canonical_receipt_bytes, ActionClass, AgentRun, AgentRuntimeError, AgentTask, LeaseState,
    ReceiptResult, RunReceipt, RunReceiptDraft, RuntimeState, StageLease, StateTransition,
    UnixMillis,
};
pub use analytics::{AnalyticsEvent, Consent, ALLOWED_EVENTS};
pub use effect_authority::{
    approval_contract_bytes_v2, approval_contract_digest_v2, preview_effect_authority_contract,
    review_pinned_effect_authority_manifest_digest, ApprovalReceiptV2Plan,
    EffectAuthorityContractError, EffectAuthorityPreviewV1,
};
pub use gate::{Gate, GateState};
pub use lead::{BusinessType, Interest, Lead, LeadDraft, LeadStatus, ValidationError};
pub use package::{default_packages, EnergyPackage};
pub use recovery::{
    bounded_recovery_tool_name, FailureEvent, FailureKind, Lesson, LessonGuidance,
    MAX_RECOVERY_TOOL_NAME_CHARS,
};
pub use work::PendingWork;

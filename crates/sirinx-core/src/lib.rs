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

pub mod analytics;
pub mod gate;
pub mod lead;
pub mod package;
pub mod recovery;
pub mod work;

pub use analytics::{AnalyticsEvent, Consent, ALLOWED_EVENTS};
pub use gate::{Gate, GateState};
pub use lead::{BusinessType, Interest, Lead, LeadDraft, LeadStatus, ValidationError};
pub use package::{default_packages, EnergyPackage};
pub use recovery::{
    bounded_recovery_tool_name, FailureEvent, FailureKind, Lesson, LessonGuidance,
    MAX_RECOVERY_TOOL_NAME_CHARS,
};
pub use work::PendingWork;

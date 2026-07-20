//! Persistence layer for the SIRINX web funnel.
//!
//! [`Store`] is the seam promised in Phase R1: `sirinx-web` handlers talk
//! only to this trait, so swapping the in-memory backend for Supabase
//! Postgres is a wiring change in `main.rs`, not a handler change.
//!
//! Backends:
//! - [`MemoryStore`] — default for tests and local dev without a database.
//! - [`PostgresStore`] — sqlx/Postgres, pointed at Supabase via `DATABASE_URL`.

pub mod memory;
pub mod postgres;

use async_trait::async_trait;
use uuid::Uuid;

use sirinx_a2a::AgentCard;
use sirinx_core::{
    AnalyticsEvent, EventSummary, FailureRecord, GateRecord, Lead, LeadStatus, Lesson, PendingWork,
    ValidationError,
};

#[derive(Debug, thiserror::Error)]
pub enum StoreError {
    #[error("lead not found")]
    NotFound,
    #[error(transparent)]
    Validation(#[from] ValidationError),
    #[error("storage backend error: {0}")]
    Backend(String),
    /// The requested state transition conflicts with the current state
    /// (e.g. completing a work item that's already completed) — found
    /// during a 2026-07-20 QA pass: completion used to silently
    /// overwrite `completedBy`/`completedAt` on a second call, losing
    /// the audit trail of who actually finished it first.
    #[error("conflict: {0}")]
    Conflict(String),
}

impl From<sqlx::Error> for StoreError {
    fn from(err: sqlx::Error) -> Self {
        match err {
            sqlx::Error::RowNotFound => StoreError::NotFound,
            other => StoreError::Backend(other.to_string()),
        }
    }
}

/// Unified store for leads and consent-gated analytics events.
#[async_trait]
pub trait Store: Send + Sync {
    async fn insert_lead(&self, lead: &Lead) -> Result<(), StoreError>;

    async fn get_lead(&self, id: Uuid) -> Result<Option<Lead>, StoreError>;

    /// Atomically validate and apply a status transition.
    async fn update_lead_status(&self, id: Uuid, next: LeadStatus) -> Result<Lead, StoreError>;

    /// Returns true when a lead was actually removed.
    async fn delete_lead(&self, id: Uuid) -> Result<bool, StoreError>;

    async fn count_leads(&self) -> Result<u64, StoreError>;

    async fn insert_event(&self, event: &AnalyticsEvent) -> Result<(), StoreError>;

    async fn count_events(&self) -> Result<u64, StoreError>;

    /// B3 (partial) — read-side port of `automation-system-backend`'s
    /// `GET /events`: most recent accepted events, newest first.
    async fn list_recent_events(&self, limit: u32) -> Result<Vec<EventSummary>, StoreError>;

    /// Register a work item on the shared queue. On Postgres this also
    /// fires `pg_notify('web_pending_work', id)` via trigger.
    async fn insert_pending_work(&self, item: &PendingWork) -> Result<(), StoreError>;

    async fn list_pending_work(&self) -> Result<Vec<PendingWork>, StoreError>;

    async fn count_pending_work(&self) -> Result<u64, StoreError>;

    /// B12 — mark a work item done. The store stamps the completion
    /// time itself (server clock, not caller-supplied) and the item
    /// drops out of `list_pending_work`/`count_pending_work`.
    async fn complete_pending_work(
        &self,
        id: Uuid,
        completed_by: &str,
    ) -> Result<PendingWork, StoreError>;

    /// B1 — durable release gates.
    async fn load_gates(&self) -> Result<Vec<GateRecord>, StoreError>;

    async fn upsert_gate(&self, gate: &GateRecord) -> Result<(), StoreError>;

    /// B2 — self-learning loop.
    async fn record_failure(&self, failure: &FailureRecord) -> Result<(), StoreError>;

    async fn count_failures(&self) -> Result<u64, StoreError>;

    /// Insert a lesson or, when the pattern exists, bump its hit count
    /// and refresh the resolution.
    async fn upsert_lesson(&self, lesson: &Lesson) -> Result<(), StoreError>;

    async fn list_lessons(&self) -> Result<Vec<Lesson>, StoreError>;

    /// B15 — durable A2A peer registry: gates (B1) already survive
    /// restarts; this closes the same gap for OmniRoute's card map.
    async fn load_agent_cards(&self) -> Result<Vec<AgentCard>, StoreError>;

    /// Register or refresh a card (idempotent by id).
    async fn upsert_agent_card(&self, card: &AgentCard) -> Result<(), StoreError>;
}

pub use memory::MemoryStore;
pub use postgres::PostgresStore;

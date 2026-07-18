//! Persistence layer for the SIRINX web funnel and control plane.
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

use sirinx_core::{
    AnalyticsEvent, FailureEvent, Gate, Lead, LeadStatus, Lesson, PendingWork, ValidationError,
};

#[derive(Debug, thiserror::Error)]
pub enum StoreError {
    #[error("lead not found")]
    NotFound,
    #[error(transparent)]
    Validation(#[from] ValidationError),
    #[error("storage backend error: {0}")]
    Backend(String),
}

impl From<sqlx::Error> for StoreError {
    fn from(err: sqlx::Error) -> Self {
        match err {
            sqlx::Error::RowNotFound => StoreError::NotFound,
            other => StoreError::Backend(other.to_string()),
        }
    }
}

/// Unified store for web data, shared work, and release-gate decisions.
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

    /// Register a work item on the shared queue. On Postgres this also
    /// fires `pg_notify('web_pending_work', id)` via trigger.
    async fn insert_pending_work(&self, item: &PendingWork) -> Result<(), StoreError>;

    async fn list_pending_work(&self) -> Result<Vec<PendingWork>, StoreError>;

    async fn count_pending_work(&self) -> Result<u64, StoreError>;

    /// Insert or replace the durable decision for one release gate.
    async fn upsert_gate(&self, _gate: &Gate) -> Result<(), StoreError> {
        Err(StoreError::Backend(
            "gate persistence is not supported by this store".into(),
        ))
    }

    /// Load every persisted release-gate decision.
    async fn list_gates(&self) -> Result<Vec<Gate>, StoreError> {
        // Compatibility-safe default for existing Store implementations:
        // startup remains on the fixed safe holds, while writes fail closed.
        Ok(Vec::new())
    }

    /// Load one gate from the authoritative backend. The compatibility
    /// default filters [`Store::list_gates`], while concrete stores may use a
    /// direct lookup. Callers must treat `None` and backend errors as held.
    async fn get_gate(&self, name: &str) -> Result<Option<Gate>, StoreError> {
        Ok(self
            .list_gates()
            .await?
            .into_iter()
            .find(|gate| gate.name == name))
    }

    /// Persist a bounded failure classification. Implementations must never
    /// store raw invocation arguments or error-message text.
    async fn record_failure(&self, _event: &FailureEvent) -> Result<(), StoreError> {
        Err(StoreError::Backend(
            "failure persistence is not supported by this store".into(),
        ))
    }

    /// Load the failure audit for one recovery run.
    async fn failure_events_for_run(&self, _run_id: Uuid) -> Result<Vec<FailureEvent>, StoreError> {
        Ok(Vec::new())
    }

    /// Insert a new lesson or increment the matching lesson's occurrence
    /// count. The dedupe key is tool + error kind + structured guidance.
    async fn upsert_lesson(&self, _lesson: &Lesson) -> Result<Lesson, StoreError> {
        Err(StoreError::Backend(
            "lesson persistence is not supported by this store".into(),
        ))
    }

    /// Load the accumulated structured lessons for one tool.
    async fn lessons_for_tool(&self, _tool: &str) -> Result<Vec<Lesson>, StoreError> {
        Ok(Vec::new())
    }
}

pub use memory::MemoryStore;
pub use postgres::PostgresStore;

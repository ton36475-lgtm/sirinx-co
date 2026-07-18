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

use sirinx_core::{AnalyticsEvent, Lead, LeadStatus, ValidationError};

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
}

pub use memory::MemoryStore;
pub use postgres::PostgresStore;

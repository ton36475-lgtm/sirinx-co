use async_trait::async_trait;
use sqlx::postgres::{PgPool, PgPoolOptions};
use sqlx::Row;
use uuid::Uuid;

use sirinx_core::{AnalyticsEvent, Lead, LeadStatus};

use crate::{Store, StoreError};

/// Supabase / Postgres backend.
///
/// Connect with the Supabase connection string (use the pooler URL in
/// production), e.g.
/// `postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres`.
pub struct PostgresStore {
    pool: PgPool,
}

impl PostgresStore {
    /// Connect and run embedded migrations (idempotent).
    pub async fn connect(database_url: &str) -> Result<Self, StoreError> {
        let pool = PgPoolOptions::new()
            .max_connections(8)
            .connect(database_url)
            .await?;
        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .map_err(|err| StoreError::Backend(err.to_string()))?;
        Ok(Self { pool })
    }

    pub fn pool(&self) -> &PgPool {
        &self.pool
    }
}

/// Wire-format string for a serde snake_case enum (e.g. `LeadStatus::New`
/// → `"new"`), so the database always stores the public API vocabulary.
fn enum_str<T: serde::Serialize>(value: &T) -> Result<String, StoreError> {
    match serde_json::to_value(value).map_err(|e| StoreError::Backend(e.to_string()))? {
        serde_json::Value::String(s) => Ok(s),
        other => Err(StoreError::Backend(format!(
            "expected string-serialized enum, got {other}"
        ))),
    }
}

fn row_to_lead(row: &sqlx::postgres::PgRow) -> Result<Lead, StoreError> {
    let value = serde_json::json!({
        "id": row.try_get::<Uuid, _>("id").map_err(StoreError::from)?,
        "status": row.try_get::<String, _>("status").map_err(StoreError::from)?,
        "businessType": row.try_get::<String, _>("business_type").map_err(StoreError::from)?,
        "monthlyElectricBill": row.try_get::<f64, _>("monthly_electric_bill").map_err(StoreError::from)?,
        "availableAreaSqm": row.try_get::<f64, _>("available_area_sqm").map_err(StoreError::from)?,
        "interest": row.try_get::<serde_json::Value, _>("interest").map_err(StoreError::from)?,
        "source": row.try_get::<String, _>("source").map_err(StoreError::from)?,
        "consent": row.try_get::<serde_json::Value, _>("consent").map_err(StoreError::from)?,
    });
    serde_json::from_value(value).map_err(|e| StoreError::Backend(e.to_string()))
}

#[async_trait]
impl Store for PostgresStore {
    async fn insert_lead(&self, lead: &Lead) -> Result<(), StoreError> {
        sqlx::query(
            r#"insert into web_leads
               (id, status, business_type, monthly_electric_bill, available_area_sqm, interest, source, consent)
               values ($1, $2, $3, $4, $5, $6, $7, $8)"#,
        )
        .bind(lead.id)
        .bind(enum_str(&lead.status)?)
        .bind(enum_str(&lead.draft.business_type)?)
        .bind(lead.draft.monthly_electric_bill)
        .bind(lead.draft.available_area_sqm)
        .bind(serde_json::to_value(&lead.draft.interest).map_err(|e| StoreError::Backend(e.to_string()))?)
        .bind(&lead.draft.source)
        .bind(serde_json::to_value(lead.draft.consent).map_err(|e| StoreError::Backend(e.to_string()))?)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn get_lead(&self, id: Uuid) -> Result<Option<Lead>, StoreError> {
        let row = sqlx::query("select * from web_leads where id = $1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        row.as_ref().map(row_to_lead).transpose()
    }

    async fn update_lead_status(&self, id: Uuid, next: LeadStatus) -> Result<Lead, StoreError> {
        let mut tx = self.pool.begin().await?;
        let row = sqlx::query("select * from web_leads where id = $1 for update")
            .bind(id)
            .fetch_optional(&mut *tx)
            .await?
            .ok_or(StoreError::NotFound)?;
        let mut lead = row_to_lead(&row)?;
        lead.transition(next)?;
        sqlx::query("update web_leads set status = $2, updated_at = now() where id = $1")
            .bind(id)
            .bind(enum_str(&lead.status)?)
            .execute(&mut *tx)
            .await?;
        tx.commit().await?;
        Ok(lead)
    }

    async fn delete_lead(&self, id: Uuid) -> Result<bool, StoreError> {
        let result = sqlx::query("delete from web_leads where id = $1")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }

    async fn count_leads(&self) -> Result<u64, StoreError> {
        let row = sqlx::query("select count(*) as n from web_leads")
            .fetch_one(&self.pool)
            .await?;
        Ok(row.try_get::<i64, _>("n").map_err(StoreError::from)? as u64)
    }

    async fn insert_event(&self, event: &AnalyticsEvent) -> Result<(), StoreError> {
        sqlx::query(
            r#"insert into web_analytics_events (event, payload, page, consent)
               values ($1, $2, $3, $4)"#,
        )
        .bind(&event.event)
        .bind(&event.payload)
        .bind(&event.page)
        .bind(serde_json::to_value(event.consent).map_err(|e| StoreError::Backend(e.to_string()))?)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn count_events(&self) -> Result<u64, StoreError> {
        let row = sqlx::query("select count(*) as n from web_analytics_events")
            .fetch_one(&self.pool)
            .await?;
        Ok(row.try_get::<i64, _>("n").map_err(StoreError::from)? as u64)
    }
}

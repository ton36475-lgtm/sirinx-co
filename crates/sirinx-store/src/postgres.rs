use async_trait::async_trait;
use sqlx::postgres::{PgPool, PgPoolOptions};
use sqlx::Row;
use uuid::Uuid;

use sirinx_a2a::AgentCard;
use sirinx_core::{
    AnalyticsEvent, EventSummary, FailureRecord, GateRecord, Lead, LeadStatus, Lesson, PendingWork,
};

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

fn row_to_pending_work(row: &sqlx::postgres::PgRow) -> Result<PendingWork, StoreError> {
    Ok(PendingWork {
        id: row.try_get("id").map_err(StoreError::from)?,
        source: row.try_get("source").map_err(StoreError::from)?,
        title: row.try_get("title").map_err(StoreError::from)?,
        detail: row.try_get("detail").map_err(StoreError::from)?,
        status: row.try_get("status").map_err(StoreError::from)?,
        completed_at: row.try_get("completed_at").map_err(StoreError::from)?,
        completed_by: row.try_get("completed_by").map_err(StoreError::from)?,
    })
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

    async fn list_recent_events(&self, limit: u32) -> Result<Vec<EventSummary>, StoreError> {
        let rows = sqlx::query(
            "select id, event, page, created_at::text as created_at \
             from web_analytics_events order by created_at desc limit $1",
        )
        .bind(i64::from(limit))
        .fetch_all(&self.pool)
        .await?;
        rows.iter()
            .map(|row| {
                Ok(EventSummary {
                    id: row.try_get("id").map_err(StoreError::from)?,
                    event: row.try_get("event").map_err(StoreError::from)?,
                    page: row.try_get("page").map_err(StoreError::from)?,
                    created_at: row.try_get("created_at").map_err(StoreError::from)?,
                })
            })
            .collect()
    }

    async fn insert_pending_work(&self, item: &PendingWork) -> Result<(), StoreError> {
        sqlx::query(
            r#"insert into web_pending_work (id, source, title, detail)
               values ($1, $2, $3, $4)"#,
        )
        .bind(item.id)
        .bind(&item.source)
        .bind(&item.title)
        .bind(&item.detail)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn list_pending_work(&self) -> Result<Vec<PendingWork>, StoreError> {
        let rows = sqlx::query(
            "select id, source, title, detail, status, completed_at::text as completed_at, completed_by \
             from web_pending_work where status = 'pending' order by created_at",
        )
        .fetch_all(&self.pool)
        .await?;
        rows.iter().map(row_to_pending_work).collect()
    }

    async fn count_pending_work(&self) -> Result<u64, StoreError> {
        let row =
            sqlx::query("select count(*) as n from web_pending_work where status = 'pending'")
                .fetch_one(&self.pool)
                .await?;
        Ok(row.try_get::<i64, _>("n").map_err(StoreError::from)? as u64)
    }

    async fn complete_pending_work(
        &self,
        id: Uuid,
        completed_by: &str,
    ) -> Result<PendingWork, StoreError> {
        // Row-lock first (same pattern as update_lead_status) so two
        // concurrent completions of the same item can't both "win" —
        // the loser sees the already-completed status and conflicts
        // instead of silently overwriting who completed it first.
        let mut tx = self.pool.begin().await?;
        let existing = sqlx::query(
            "select status, completed_by from web_pending_work where id = $1 for update",
        )
        .bind(id)
        .fetch_optional(&mut *tx)
        .await?
        .ok_or(StoreError::NotFound)?;
        let status: String = existing.try_get("status").map_err(StoreError::from)?;
        if status == "completed" {
            let by: Option<String> = existing.try_get("completed_by").map_err(StoreError::from)?;
            return Err(StoreError::Conflict(format!(
                "work item {id} was already completed by {}",
                by.as_deref().unwrap_or("unknown")
            )));
        }
        let row = sqlx::query(
            r#"update web_pending_work
               set status = 'completed', completed_at = now(), completed_by = $2
               where id = $1
               returning id, source, title, detail, status, completed_at::text as completed_at, completed_by"#,
        )
        .bind(id)
        .bind(completed_by)
        .fetch_one(&mut *tx)
        .await?;
        tx.commit().await?;
        row_to_pending_work(&row)
    }

    async fn load_gates(&self) -> Result<Vec<GateRecord>, StoreError> {
        let rows = sqlx::query("select name, state, ticket from web_control_gates order by name")
            .fetch_all(&self.pool)
            .await?;
        rows.iter()
            .map(|row| {
                Ok(GateRecord {
                    name: row.try_get("name").map_err(StoreError::from)?,
                    state: row.try_get("state").map_err(StoreError::from)?,
                    ticket: row.try_get("ticket").map_err(StoreError::from)?,
                })
            })
            .collect()
    }

    async fn upsert_gate(&self, gate: &GateRecord) -> Result<(), StoreError> {
        sqlx::query(
            r#"insert into web_control_gates (name, state, ticket, updated_at)
               values ($1, $2, $3, now())
               on conflict (name) do update set
                 state = excluded.state, ticket = excluded.ticket, updated_at = now()"#,
        )
        .bind(&gate.name)
        .bind(&gate.state)
        .bind(&gate.ticket)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn record_failure(&self, failure: &FailureRecord) -> Result<(), StoreError> {
        sqlx::query(
            "insert into web_failure_events (component, error, context) values ($1, $2, $3)",
        )
        .bind(&failure.component)
        .bind(&failure.error)
        .bind(&failure.context)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn count_failures(&self) -> Result<u64, StoreError> {
        let row = sqlx::query("select count(*) as n from web_failure_events")
            .fetch_one(&self.pool)
            .await?;
        Ok(row.try_get::<i64, _>("n").map_err(StoreError::from)? as u64)
    }

    async fn upsert_lesson(&self, lesson: &Lesson) -> Result<(), StoreError> {
        sqlx::query(
            r#"insert into web_lessons (pattern, resolution, hits, updated_at)
               values ($1, $2, 0, now())
               on conflict (pattern) do update set
                 resolution = excluded.resolution,
                 hits = web_lessons.hits + 1,
                 updated_at = now()"#,
        )
        .bind(&lesson.pattern)
        .bind(&lesson.resolution)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn list_lessons(&self) -> Result<Vec<Lesson>, StoreError> {
        let rows =
            sqlx::query("select pattern, resolution, hits from web_lessons order by pattern")
                .fetch_all(&self.pool)
                .await?;
        rows.iter()
            .map(|row| {
                Ok(Lesson {
                    pattern: row.try_get("pattern").map_err(StoreError::from)?,
                    resolution: row.try_get("resolution").map_err(StoreError::from)?,
                    hits: row.try_get::<i64, _>("hits").map_err(StoreError::from)? as u64,
                })
            })
            .collect()
    }

    async fn load_agent_cards(&self) -> Result<Vec<AgentCard>, StoreError> {
        let rows = sqlx::query(
            "select id, name, capabilities, endpoint, priority from web_agent_cards order by id",
        )
        .fetch_all(&self.pool)
        .await?;
        rows.iter()
            .map(|row| {
                let capabilities: serde_json::Value =
                    row.try_get("capabilities").map_err(StoreError::from)?;
                Ok(AgentCard {
                    id: row.try_get("id").map_err(StoreError::from)?,
                    name: row.try_get("name").map_err(StoreError::from)?,
                    capabilities: serde_json::from_value(capabilities)
                        .map_err(|e| StoreError::Backend(e.to_string()))?,
                    endpoint: row.try_get("endpoint").map_err(StoreError::from)?,
                    priority: row.try_get("priority").map_err(StoreError::from)?,
                })
            })
            .collect()
    }

    async fn upsert_agent_card(&self, card: &AgentCard) -> Result<(), StoreError> {
        let capabilities = serde_json::to_value(&card.capabilities)
            .map_err(|e| StoreError::Backend(e.to_string()))?;
        sqlx::query(
            r#"insert into web_agent_cards (id, name, capabilities, endpoint, priority, updated_at)
               values ($1, $2, $3, $4, $5, now())
               on conflict (id) do update set
                 name = excluded.name,
                 capabilities = excluded.capabilities,
                 endpoint = excluded.endpoint,
                 priority = excluded.priority,
                 updated_at = now()"#,
        )
        .bind(&card.id)
        .bind(&card.name)
        .bind(capabilities)
        .bind(&card.endpoint)
        .bind(card.priority)
        .execute(&self.pool)
        .await?;
        Ok(())
    }
}

use async_trait::async_trait;
use serde::de::DeserializeOwned;
use sqlx::postgres::{PgPool, PgPoolOptions};
use sqlx::Row;
use uuid::Uuid;

use sirinx_core::{
    bounded_recovery_tool_name, AnalyticsEvent, FailureEvent, Gate, Lead, LeadStatus, Lesson,
    PendingWork,
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

fn row_to_gate(row: &sqlx::postgres::PgRow) -> Result<Gate, StoreError> {
    let value = serde_json::json!({
        "name": row.try_get::<String, _>("name").map_err(StoreError::from)?,
        "state": row.try_get::<String, _>("state").map_err(StoreError::from)?,
        "ticket": row.try_get::<Option<String>, _>("ticket").map_err(StoreError::from)?,
    });
    serde_json::from_value(value).map_err(|err| StoreError::Backend(err.to_string()))
}

fn enum_from_string<T: DeserializeOwned>(value: String) -> Result<T, StoreError> {
    serde_json::from_value(serde_json::Value::String(value))
        .map_err(|err| StoreError::Backend(err.to_string()))
}

fn row_to_failure(row: &sqlx::postgres::PgRow) -> Result<FailureEvent, StoreError> {
    let attempt = row.try_get::<i32, _>("attempt").map_err(StoreError::from)?;
    Ok(FailureEvent {
        id: row.try_get("id").map_err(StoreError::from)?,
        run_id: row.try_get("run_id").map_err(StoreError::from)?,
        tool: row.try_get("tool_name").map_err(StoreError::from)?,
        error_kind: enum_from_string(row.try_get("error_kind").map_err(StoreError::from)?)?,
        attempt: u32::try_from(attempt)
            .map_err(|_| StoreError::Backend("invalid failure attempt".into()))?,
    })
}

fn row_to_lesson(row: &sqlx::postgres::PgRow) -> Result<Lesson, StoreError> {
    let occurrences = row
        .try_get::<i64, _>("occurrences")
        .map_err(StoreError::from)?;
    Ok(Lesson {
        id: row.try_get("id").map_err(StoreError::from)?,
        tool: row.try_get("tool_name").map_err(StoreError::from)?,
        error_kind: enum_from_string(row.try_get("error_kind").map_err(StoreError::from)?)?,
        guidance: enum_from_string(row.try_get("guidance_kind").map_err(StoreError::from)?)?,
        occurrences: u64::try_from(occurrences)
            .map_err(|_| StoreError::Backend("invalid lesson occurrence count".into()))?,
    })
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
            "select id, source, title, detail from web_pending_work where status = 'pending' order by created_at",
        )
        .fetch_all(&self.pool)
        .await?;
        rows.iter()
            .map(|row| {
                Ok(PendingWork {
                    id: row.try_get("id").map_err(StoreError::from)?,
                    source: row.try_get("source").map_err(StoreError::from)?,
                    title: row.try_get("title").map_err(StoreError::from)?,
                    detail: row.try_get("detail").map_err(StoreError::from)?,
                })
            })
            .collect()
    }

    async fn count_pending_work(&self) -> Result<u64, StoreError> {
        let row =
            sqlx::query("select count(*) as n from web_pending_work where status = 'pending'")
                .fetch_one(&self.pool)
                .await?;
        Ok(row.try_get::<i64, _>("n").map_err(StoreError::from)? as u64)
    }

    async fn upsert_gate(&self, gate: &Gate) -> Result<(), StoreError> {
        sqlx::query(
            r#"insert into web_control_gates (name, state, ticket)
               values ($1, $2, $3)
               on conflict (name) do update
               set state = excluded.state,
                   ticket = excluded.ticket,
                   updated_at = now()"#,
        )
        .bind(&gate.name)
        .bind(enum_str(&gate.state)?)
        .bind(&gate.ticket)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn list_gates(&self) -> Result<Vec<Gate>, StoreError> {
        let rows = sqlx::query("select name, state, ticket from web_control_gates order by name")
            .fetch_all(&self.pool)
            .await?;
        rows.iter().map(row_to_gate).collect()
    }

    async fn get_gate(&self, name: &str) -> Result<Option<Gate>, StoreError> {
        let row = sqlx::query("select name, state, ticket from web_control_gates where name = $1")
            .bind(name)
            .fetch_optional(&self.pool)
            .await?;
        row.as_ref().map(row_to_gate).transpose()
    }

    async fn record_failure(&self, event: &FailureEvent) -> Result<(), StoreError> {
        sqlx::query(
            r#"insert into web_failure_events
               (id, run_id, tool_name, error_kind, attempt)
               values ($1, $2, $3, $4, $5)"#,
        )
        .bind(event.id)
        .bind(event.run_id)
        .bind(bounded_recovery_tool_name(&event.tool))
        .bind(enum_str(&event.error_kind)?)
        .bind(
            i32::try_from(event.attempt.max(1))
                .map_err(|_| StoreError::Backend("failure attempt exceeds storage range".into()))?,
        )
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn failure_events_for_run(&self, run_id: Uuid) -> Result<Vec<FailureEvent>, StoreError> {
        let rows = sqlx::query(
            r#"select id, run_id, tool_name, error_kind, attempt
               from web_failure_events
               where run_id = $1
               order by attempt, id"#,
        )
        .bind(run_id)
        .fetch_all(&self.pool)
        .await?;
        rows.iter().map(row_to_failure).collect()
    }

    async fn upsert_lesson(&self, lesson: &Lesson) -> Result<Lesson, StoreError> {
        let row = sqlx::query(
            r#"insert into web_lessons
               (id, tool_name, error_kind, guidance_kind, occurrences)
               values ($1, $2, $3, $4, 1)
               on conflict (tool_name, error_kind, guidance_kind) do update
               set occurrences = case
                       when web_lessons.occurrences = 9223372036854775807
                           then web_lessons.occurrences
                       else web_lessons.occurrences + 1
                   end,
                   updated_at = now()
               returning id, tool_name, error_kind, guidance_kind, occurrences"#,
        )
        .bind(lesson.id)
        .bind(bounded_recovery_tool_name(&lesson.tool))
        .bind(enum_str(&lesson.error_kind)?)
        .bind(enum_str(&lesson.guidance)?)
        .fetch_one(&self.pool)
        .await?;
        row_to_lesson(&row)
    }

    async fn lessons_for_tool(&self, tool: &str) -> Result<Vec<Lesson>, StoreError> {
        let rows = sqlx::query(
            r#"select id, tool_name, error_kind, guidance_kind, occurrences
               from web_lessons
               where tool_name = $1
               order by occurrences desc, updated_at desc, id"#,
        )
        .bind(bounded_recovery_tool_name(tool))
        .fetch_all(&self.pool)
        .await?;
        rows.iter().map(row_to_lesson).collect()
    }
}

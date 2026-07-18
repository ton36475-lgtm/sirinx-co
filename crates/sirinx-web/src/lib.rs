//! www.sirinx.co web service.
//!
//! Routes:
//! - `GET  /`                       — home page
//! - `GET  /thaimart-sirinx`        — Thaimart x SIRINX landing (taste-governed v2)
//! - `GET  /health`                 — liveness probe
//! - `GET  /api/packages`           — energy packages
//! - `POST /api/roi`                — server-side ROI pre-screen
//! - `POST /api/leads`              — create lead
//! - `PATCH /api/leads/:id/status`  — advance lead status
//! - `DELETE /api/leads/:id`        — remove internal draft lead
//! - `POST /api/events`             — consent-gated analytics intake
//!
//! Persistence goes through `sirinx_store::Store`: `MemoryStore` by
//! default, `PostgresStore` (Supabase) when `DATABASE_URL` is set.

use std::sync::Arc;

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::Html;
use axum::routing::{delete, get, patch, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use sirinx_core::{default_packages, AnalyticsEvent, Lead, LeadDraft, LeadStatus};
use sirinx_roi::{estimate, RoiInput};
use sirinx_store::{MemoryStore, Store, StoreError};

const HOME_HTML: &str = include_str!("../static/index.html");
const THAIMART_HTML: &str = include_str!("../static/thaimart-sirinx.html");

#[derive(Clone)]
pub struct AppState {
    store: Arc<dyn Store>,
}

impl Default for AppState {
    fn default() -> Self {
        Self::new(Arc::new(MemoryStore::default()))
    }
}

impl AppState {
    pub fn new(store: Arc<dyn Store>) -> Self {
        Self { store }
    }

    pub async fn lead_count(&self) -> u64 {
        self.store.count_leads().await.unwrap_or(0)
    }

    pub async fn accepted_event_count(&self) -> u64 {
        self.store.count_events().await.unwrap_or(0)
    }
}

#[derive(Debug, Serialize)]
struct ApiError {
    error: String,
}

impl ApiError {
    fn new(msg: impl Into<String>) -> Json<Self> {
        Json(Self { error: msg.into() })
    }
}

/// Map storage errors onto API status codes: missing rows are 404,
/// illegal transitions are 409, backend failures are 500.
fn store_error_response(err: StoreError) -> (StatusCode, Json<ApiError>) {
    let status = match &err {
        StoreError::NotFound => StatusCode::NOT_FOUND,
        StoreError::Validation(_) => StatusCode::CONFLICT,
        StoreError::Backend(_) => StatusCode::INTERNAL_SERVER_ERROR,
    };
    if status == StatusCode::INTERNAL_SERVER_ERROR {
        tracing::error!(error = %err, "storage backend failure");
        return (status, ApiError::new("storage backend failure"));
    }
    (status, ApiError::new(err.to_string()))
}

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/", get(|| async { Html(HOME_HTML) }))
        .route("/thaimart-sirinx", get(|| async { Html(THAIMART_HTML) }))
        .route("/health", get(health))
        .route("/api/packages", get(packages))
        .route("/api/roi", post(roi))
        .route("/api/leads", post(create_lead))
        .route("/api/leads/:id/status", patch(update_lead_status))
        .route("/api/leads/:id", delete(delete_lead))
        .route("/api/events", post(ingest_event))
        .with_state(state)
}

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "status": "ok", "service": "sirinx-web" }))
}

async fn packages() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "packages": default_packages() }))
}

async fn roi(
    Json(input): Json<RoiInput>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<ApiError>)> {
    match estimate(input) {
        Ok(out) => Ok(Json(serde_json::json!({
            "estimate": out,
            "notice": "ผลลัพธ์นี้เป็น scenario สำหรับคัดกรองเบื้องต้น ไม่ใช่ใบเสนอราคา และควรสำรวจหน้างานก่อนสรุประบบจริง"
        }))),
        Err(err) => Err((StatusCode::UNPROCESSABLE_ENTITY, ApiError::new(err.to_string()))),
    }
}

async fn create_lead(
    State(state): State<AppState>,
    Json(draft): Json<LeadDraft>,
) -> Result<(StatusCode, Json<Lead>), (StatusCode, Json<ApiError>)> {
    let lead = Lead::from_draft(draft)
        .map_err(|err| (StatusCode::UNPROCESSABLE_ENTITY, ApiError::new(err.to_string())))?;
    state
        .store
        .insert_lead(&lead)
        .await
        .map_err(store_error_response)?;
    tracing::info!(lead_id = %lead.id, "lead created");
    Ok((StatusCode::CREATED, Json(lead)))
}

#[derive(Debug, Deserialize)]
struct StatusPatch {
    status: LeadStatus,
}

async fn update_lead_status(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(patch): Json<StatusPatch>,
) -> Result<Json<Lead>, (StatusCode, Json<ApiError>)> {
    let lead = state
        .store
        .update_lead_status(id, patch.status)
        .await
        .map_err(store_error_response)?;
    Ok(Json(lead))
}

async fn delete_lead(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, Json<ApiError>)> {
    let removed = state
        .store
        .delete_lead(id)
        .await
        .map_err(store_error_response)?;
    if removed {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err((StatusCode::NOT_FOUND, ApiError::new("lead not found")))
    }
}

/// Consent-safe analytics: events without analytics consent or with an
/// unlisted event name are acknowledged but never stored.
async fn ingest_event(
    State(state): State<AppState>,
    Json(event): Json<AnalyticsEvent>,
) -> Result<(StatusCode, Json<serde_json::Value>), (StatusCode, Json<ApiError>)> {
    if event.is_accepted() {
        state
            .store
            .insert_event(&event)
            .await
            .map_err(store_error_response)?;
        Ok((StatusCode::ACCEPTED, Json(serde_json::json!({ "stored": true }))))
    } else {
        Ok((StatusCode::OK, Json(serde_json::json!({ "stored": false }))))
    }
}

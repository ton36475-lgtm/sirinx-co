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

use std::collections::HashMap;
use std::sync::{Arc, RwLock};

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::Html;
use axum::routing::{delete, get, patch, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use sirinx_core::{
    default_packages, AnalyticsEvent, Lead, LeadDraft, LeadStatus, ValidationError,
};
use sirinx_roi::{estimate, RoiInput};

const HOME_HTML: &str = include_str!("../static/index.html");
const THAIMART_HTML: &str = include_str!("../static/thaimart-sirinx.html");

/// In-memory store. Swappable for Supabase/Postgres in a later phase
/// without touching handler code.
#[derive(Clone, Default)]
pub struct AppState {
    leads: Arc<RwLock<HashMap<Uuid, Lead>>>,
    events: Arc<RwLock<Vec<AnalyticsEvent>>>,
}

impl AppState {
    pub fn lead_count(&self) -> usize {
        self.leads.read().expect("lead store poisoned").len()
    }

    pub fn accepted_event_count(&self) -> usize {
        self.events.read().expect("event store poisoned").len()
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
        .leads
        .write()
        .expect("lead store poisoned")
        .insert(lead.id, lead.clone());
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
    let mut leads = state.leads.write().expect("lead store poisoned");
    let lead = leads
        .get_mut(&id)
        .ok_or_else(|| (StatusCode::NOT_FOUND, ApiError::new("lead not found")))?;
    lead.transition(patch.status).map_err(|err| match err {
        ValidationError::InvalidTransition { .. } => {
            (StatusCode::CONFLICT, ApiError::new(err.to_string()))
        }
        _ => (StatusCode::UNPROCESSABLE_ENTITY, ApiError::new(err.to_string())),
    })?;
    Ok(Json(lead.clone()))
}

async fn delete_lead(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, Json<ApiError>)> {
    let removed = state
        .leads
        .write()
        .expect("lead store poisoned")
        .remove(&id);
    match removed {
        Some(_) => Ok(StatusCode::NO_CONTENT),
        None => Err((StatusCode::NOT_FOUND, ApiError::new("lead not found"))),
    }
}

/// Consent-safe analytics: events without analytics consent or with an
/// unlisted event name are acknowledged but never stored.
async fn ingest_event(
    State(state): State<AppState>,
    Json(event): Json<AnalyticsEvent>,
) -> (StatusCode, Json<serde_json::Value>) {
    if event.is_accepted() {
        state
            .events
            .write()
            .expect("event store poisoned")
            .push(event);
        (StatusCode::ACCEPTED, Json(serde_json::json!({ "stored": true })))
    } else {
        (StatusCode::OK, Json(serde_json::json!({ "stored": false })))
    }
}

//! SIRINX control plane — the Rust successor to the Hermes
//! `services/dev-control-api` core surface.
//!
//! Governance semantics are identical to the Node service it replaces:
//! every release gate starts **hold**, actions behind a held gate only
//! ever dry-run, and opening a gate is an explicit operator decision
//! recorded with a ticket. The long tail of Hermes routes stays on the
//! imported Node service; this crate owns the safety-critical core:
//!
//! - `GET  /health`
//! - `GET  /api/gates`                     — all gates with state
//! - `POST /api/gates/:name/decision`      — open/hold with ticket
//! - `GET  /api/pending-work`              — work intake queue
//! - `POST /api/pending-work`              — register work item
//! - `POST /api/actions`                   — execute-or-dry-run by gate

use std::collections::BTreeMap;
use std::sync::{Arc, RwLock};

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// The release gates carried over from RELEASE_GATE.md / NEXT_ACTIONS.md.
/// Everything ships in `hold`.
pub const DEFAULT_GATES: &[&str] = &[
    "deploy",
    "cloudflare_dns",
    "telegram_send",
    "customer_messaging",
    "adaptive_sync",
];

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum GateState {
    Hold,
    Open,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Gate {
    pub name: String,
    pub state: GateState,
    /// Ticket recorded when an operator opened the gate.
    pub ticket: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkItem {
    pub id: Uuid,
    pub source: String,
    pub title: String,
    #[serde(default)]
    pub detail: serde_json::Value,
}

#[derive(Clone, Default)]
pub struct ControlState {
    gates: Arc<RwLock<BTreeMap<String, Gate>>>,
    pending: Arc<RwLock<Vec<WorkItem>>>,
}

impl ControlState {
    pub fn with_default_gates() -> Self {
        let state = Self::default();
        {
            let mut gates = state.gates.write().expect("gate lock poisoned");
            for name in DEFAULT_GATES {
                gates.insert(
                    (*name).to_owned(),
                    Gate {
                        name: (*name).to_owned(),
                        state: GateState::Hold,
                        ticket: None,
                    },
                );
            }
        }
        state
    }

    pub fn gate_state(&self, name: &str) -> Option<GateState> {
        self.gates
            .read()
            .expect("gate lock poisoned")
            .get(name)
            .map(|g| g.state)
    }
}

pub fn router(state: ControlState) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/api/gates", get(list_gates))
        .route("/api/gates/:name/decision", post(decide_gate))
        .route("/api/pending-work", get(list_pending).post(add_pending))
        .route("/api/actions", post(run_action))
        .with_state(state)
}

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "status": "ok", "service": "sirinx-control" }))
}

async fn list_gates(State(state): State<ControlState>) -> Json<serde_json::Value> {
    let gates: Vec<Gate> = state
        .gates
        .read()
        .expect("gate lock poisoned")
        .values()
        .cloned()
        .collect();
    Json(serde_json::json!({ "gates": gates }))
}

#[derive(Debug, Deserialize)]
struct GateDecision {
    state: GateState,
    /// Required when opening: the operator's ticket reference.
    ticket: Option<String>,
}

async fn decide_gate(
    State(state): State<ControlState>,
    Path(name): Path<String>,
    Json(decision): Json<GateDecision>,
) -> Result<Json<Gate>, (StatusCode, Json<serde_json::Value>)> {
    if decision.state == GateState::Open && decision.ticket.as_deref().unwrap_or("").trim().is_empty()
    {
        return Err((
            StatusCode::UNPROCESSABLE_ENTITY,
            Json(serde_json::json!({ "error": "opening a gate requires a ticket" })),
        ));
    }
    let mut gates = state.gates.write().expect("gate lock poisoned");
    let gate = gates.get_mut(&name).ok_or((
        StatusCode::NOT_FOUND,
        Json(serde_json::json!({ "error": "unknown gate" })),
    ))?;
    gate.state = decision.state;
    gate.ticket = match decision.state {
        GateState::Open => decision.ticket,
        GateState::Hold => None,
    };
    tracing::info!(gate = %name, state = ?gate.state, "gate decision recorded");
    Ok(Json(gate.clone()))
}

async fn list_pending(State(state): State<ControlState>) -> Json<serde_json::Value> {
    let items = state.pending.read().expect("pending lock poisoned").clone();
    Json(serde_json::json!({ "pendingWork": items }))
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WorkIntake {
    source: String,
    title: String,
    #[serde(default)]
    detail: serde_json::Value,
}

async fn add_pending(
    State(state): State<ControlState>,
    Json(intake): Json<WorkIntake>,
) -> (StatusCode, Json<WorkItem>) {
    let item = WorkItem {
        id: Uuid::new_v4(),
        source: intake.source,
        title: intake.title,
        detail: intake.detail,
    };
    state
        .pending
        .write()
        .expect("pending lock poisoned")
        .push(item.clone());
    (StatusCode::CREATED, Json(item))
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ActionRequest {
    gate: String,
    action: String,
    #[serde(default)]
    args: serde_json::Value,
}

/// Actions never execute behind a held gate — they return the dry-run
/// plan instead, exactly like the Node control API and the
/// `sirinx-autoloop` ApprovalGate.
async fn run_action(
    State(state): State<ControlState>,
    Json(req): Json<ActionRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let gate_state = state.gate_state(&req.gate).ok_or((
        StatusCode::NOT_FOUND,
        Json(serde_json::json!({ "error": "unknown gate" })),
    ))?;
    match gate_state {
        GateState::Hold => Ok(Json(serde_json::json!({
            "executed": false,
            "dryRun": true,
            "plan": format!("{}({})", req.action, req.args),
            "reason": format!("gate '{}' is on hold", req.gate),
        }))),
        GateState::Open => Ok(Json(serde_json::json!({
            "executed": true,
            "dryRun": false,
            "action": req.action,
        }))),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{header, Request};
    use tower::ServiceExt;

    fn json_request(method: &str, uri: &str, body: serde_json::Value) -> Request<Body> {
        Request::builder()
            .method(method)
            .uri(uri)
            .header(header::CONTENT_TYPE, "application/json")
            .body(Body::from(body.to_string()))
            .unwrap()
    }

    async fn body_json(response: axum::response::Response) -> serde_json::Value {
        let bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        serde_json::from_slice(&bytes).unwrap()
    }

    #[tokio::test]
    async fn all_gates_start_on_hold() {
        let app = router(ControlState::with_default_gates());
        let res = app
            .oneshot(Request::get("/api/gates").body(Body::empty()).unwrap())
            .await
            .unwrap();
        let body = body_json(res).await;
        let gates = body["gates"].as_array().unwrap();
        assert_eq!(gates.len(), DEFAULT_GATES.len());
        assert!(gates.iter().all(|g| g["state"] == "hold"));
    }

    #[tokio::test]
    async fn held_gate_forces_dry_run() {
        let app = router(ControlState::with_default_gates());
        let res = app
            .oneshot(json_request(
                "POST",
                "/api/actions",
                serde_json::json!({ "gate": "deploy", "action": "deploy_public_web" }),
            ))
            .await
            .unwrap();
        let body = body_json(res).await;
        assert_eq!(body["executed"], false);
        assert_eq!(body["dryRun"], true);
    }

    #[tokio::test]
    async fn opening_a_gate_requires_a_ticket() {
        let app = router(ControlState::with_default_gates());
        let denied = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/gates/deploy/decision",
                serde_json::json!({ "state": "open" }),
            ))
            .await
            .unwrap();
        assert_eq!(denied.status(), StatusCode::UNPROCESSABLE_ENTITY);

        let opened = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/gates/deploy/decision",
                serde_json::json!({ "state": "open", "ticket": "GO-LIVE-001" }),
            ))
            .await
            .unwrap();
        assert_eq!(body_json(opened).await["state"], "open");

        // With the gate open, the action executes.
        let res = app
            .oneshot(json_request(
                "POST",
                "/api/actions",
                serde_json::json!({ "gate": "deploy", "action": "deploy_public_web" }),
            ))
            .await
            .unwrap();
        assert_eq!(body_json(res).await["executed"], true);
    }

    #[tokio::test]
    async fn pending_work_intake_roundtrip() {
        let app = router(ControlState::with_default_gates());
        let created = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/pending-work",
                serde_json::json!({
                    "source": "hermes-command-center",
                    "title": "review PR-MONO-003",
                    "detail": { "repo": "sirinx-co" }
                }),
            ))
            .await
            .unwrap();
        assert_eq!(created.status(), StatusCode::CREATED);

        let listed = app
            .oneshot(Request::get("/api/pending-work").body(Body::empty()).unwrap())
            .await
            .unwrap();
        let body = body_json(listed).await;
        assert_eq!(body["pendingWork"].as_array().unwrap().len(), 1);
    }

    #[tokio::test]
    async fn unknown_gate_is_not_found() {
        let app = router(ControlState::with_default_gates());
        let res = app
            .oneshot(json_request(
                "POST",
                "/api/actions",
                serde_json::json!({ "gate": "nonexistent", "action": "x" }),
            ))
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::NOT_FOUND);
    }
}

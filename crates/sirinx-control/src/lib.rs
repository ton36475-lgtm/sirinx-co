//! SIRINX control plane — the Rust successor to the Hermes
//! `services/dev-control-api` core surface.
//!
//! Governance semantics are identical to the Node service it replaces:
//! every release gate starts **hold**, actions behind a held gate only
//! ever dry-run, and opening a gate is an explicit operator decision
//! recorded with a ticket. The long tail of Hermes routes stays on the
//! imported Node service; this crate owns the safety-critical core:
//!
//! - `GET  /health`                        — open (no auth)
//! - `GET  /metrics`                       — open, Prometheus text format
//! - `GET  /api/gates`                     — all gates with state
//! - `POST /api/gates/:name/decision`      — open/hold with ticket
//! - `GET  /api/pending-work`              — shared work queue (Store)
//! - `POST /api/pending-work`              — register work item
//! - `POST /api/actions`                   — execute-or-dry-run by gate
//!
//! When a bearer token is configured, every `/api/*` route requires
//! `Authorization: Bearer <token>`. Pending work persists through
//! `sirinx_store::Store`, so with `DATABASE_URL` set all nodes share
//! one queue and Postgres notifies listeners on every insert.

use std::collections::BTreeMap;
use std::fmt::Write as _;
use std::sync::{Arc, RwLock};

use axum::extract::{Path, Request, State};
use axum::http::StatusCode;
use axum::middleware::{self, Next};
use axum::response::Response;
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};

use sirinx_core::PendingWork;
use sirinx_store::{MemoryStore, Store};

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

#[derive(Clone)]
pub struct ControlState {
    gates: Arc<RwLock<BTreeMap<String, Gate>>>,
    store: Arc<dyn Store>,
    /// Bearer token required on /api/* when set.
    api_token: Option<Arc<str>>,
}

impl ControlState {
    pub fn with_default_gates() -> Self {
        Self::new(Arc::new(MemoryStore::default()), None)
    }

    pub fn new(store: Arc<dyn Store>, api_token: Option<String>) -> Self {
        let gates = DEFAULT_GATES
            .iter()
            .map(|name| {
                (
                    (*name).to_owned(),
                    Gate {
                        name: (*name).to_owned(),
                        state: GateState::Hold,
                        ticket: None,
                    },
                )
            })
            .collect();
        Self {
            gates: Arc::new(RwLock::new(gates)),
            store,
            api_token: api_token.map(Into::into),
        }
    }

    pub fn gate_state(&self, name: &str) -> Option<GateState> {
        self.gates
            .read()
            .expect("gate lock poisoned")
            .get(name)
            .map(|g| g.state)
    }
}

async fn require_bearer(
    State(state): State<ControlState>,
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let needs_auth = request.uri().path().starts_with("/api/");
    if let (true, Some(expected)) = (needs_auth, state.api_token.as_deref()) {
        let provided = request
            .headers()
            .get(axum::http::header::AUTHORIZATION)
            .and_then(|v| v.to_str().ok())
            .and_then(|v| v.strip_prefix("Bearer "));
        if provided != Some(expected) {
            return Err(StatusCode::UNAUTHORIZED);
        }
    }
    Ok(next.run(request).await)
}

pub fn router(state: ControlState) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/metrics", get(metrics))
        .route("/api/gates", get(list_gates))
        .route("/api/gates/:name/decision", post(decide_gate))
        .route("/api/pending-work", get(list_pending).post(add_pending))
        .route("/api/actions", post(run_action))
        .layer(middleware::from_fn_with_state(
            state.clone(),
            require_bearer,
        ))
        .with_state(state)
}

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "status": "ok", "service": "sirinx-control" }))
}

/// Prometheus text exposition, dependency-free.
async fn metrics(State(state): State<ControlState>) -> ([(&'static str, &'static str); 1], String) {
    let mut out = String::new();
    let _ = writeln!(
        out,
        "# HELP sirinx_control_gate_open 1 when the gate is open, 0 on hold.\n# TYPE sirinx_control_gate_open gauge"
    );
    for gate in state.gates.read().expect("gate lock poisoned").values() {
        let _ = writeln!(
            out,
            "sirinx_control_gate_open{{gate=\"{}\"}} {}",
            gate.name,
            if gate.state == GateState::Open { 1 } else { 0 }
        );
    }
    let pending = state.store.count_pending_work().await.unwrap_or(0);
    let _ = writeln!(
        out,
        "# HELP sirinx_control_pending_work Pending work items on the shared queue.\n# TYPE sirinx_control_pending_work gauge\nsirinx_control_pending_work {pending}"
    );
    ([("content-type", "text/plain; version=0.0.4")], out)
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
    if decision.state == GateState::Open
        && decision.ticket.as_deref().unwrap_or("").trim().is_empty()
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

async fn list_pending(
    State(state): State<ControlState>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let items = state.store.list_pending_work().await.map_err(|err| {
        tracing::error!(error = %err, "pending-work backend failure");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": "storage backend failure" })),
        )
    })?;
    Ok(Json(serde_json::json!({ "pendingWork": items })))
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
) -> Result<(StatusCode, Json<PendingWork>), (StatusCode, Json<serde_json::Value>)> {
    let item = PendingWork::new(intake.source, intake.title, intake.detail);
    state
        .store
        .insert_pending_work(&item)
        .await
        .map_err(|err| {
            tracing::error!(error = %err, "pending-work backend failure");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": "storage backend failure" })),
            )
        })?;
    Ok((StatusCode::CREATED, Json(item)))
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

    async fn body_text(response: axum::response::Response) -> String {
        let bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        String::from_utf8(bytes.to_vec()).unwrap()
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
            .oneshot(
                Request::get("/api/pending-work")
                    .body(Body::empty())
                    .unwrap(),
            )
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

    #[tokio::test]
    async fn bearer_token_protects_api_routes() {
        let state = ControlState::new(
            Arc::new(MemoryStore::default()),
            Some("secret-token".into()),
        );
        let app = router(state);

        // /health and /metrics stay open.
        for uri in ["/health", "/metrics"] {
            let res = app
                .clone()
                .oneshot(Request::get(uri).body(Body::empty()).unwrap())
                .await
                .unwrap();
            assert_eq!(res.status(), StatusCode::OK, "{uri} must stay open");
        }

        // /api without token → 401.
        let denied = app
            .clone()
            .oneshot(Request::get("/api/gates").body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(denied.status(), StatusCode::UNAUTHORIZED);

        // Wrong token → 401.
        let wrong = app
            .clone()
            .oneshot(
                Request::get("/api/gates")
                    .header(header::AUTHORIZATION, "Bearer nope")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(wrong.status(), StatusCode::UNAUTHORIZED);

        // Correct token → 200.
        let ok = app
            .oneshot(
                Request::get("/api/gates")
                    .header(header::AUTHORIZATION, "Bearer secret-token")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(ok.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn metrics_exposes_gates_and_queue_depth() {
        let app = router(ControlState::with_default_gates());
        app.clone()
            .oneshot(json_request(
                "POST",
                "/api/pending-work",
                serde_json::json!({ "source": "test", "title": "item" }),
            ))
            .await
            .unwrap();

        let res = app
            .oneshot(Request::get("/metrics").body(Body::empty()).unwrap())
            .await
            .unwrap();
        let text = body_text(res).await;
        assert!(text.contains("sirinx_control_gate_open{gate=\"deploy\"} 0"));
        assert!(text.contains("sirinx_control_pending_work 1"));
    }
}

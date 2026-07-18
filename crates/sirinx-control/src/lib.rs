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

use sirinx_a2a::{diff_work, AgentCard, OmniRoute, SyncRequest, SyncResponse};
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
    /// This node's A2A card; capabilities come from installed skills.
    self_card: AgentCard,
    /// Every agent card this node knows (peers register via /api/a2a/sync).
    omniroute: Arc<RwLock<OmniRoute>>,
}

impl ControlState {
    pub fn with_default_gates() -> Self {
        Self::new(Arc::new(MemoryStore::default()), None, default_self_card())
    }

    pub fn new(store: Arc<dyn Store>, api_token: Option<String>, self_card: AgentCard) -> Self {
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
        let mut omniroute = OmniRoute::new();
        omniroute.register(self_card.clone());
        Self {
            gates: Arc::new(RwLock::new(gates)),
            store,
            api_token: api_token.map(Into::into),
            self_card,
            omniroute: Arc::new(RwLock::new(omniroute)),
        }
    }

    /// B1 — durable gates: start from defaults, overlay whatever the
    /// store remembers, so an opened gate survives restarts.
    pub async fn load(
        store: Arc<dyn Store>,
        api_token: Option<String>,
        self_card: AgentCard,
    ) -> Result<Self, sirinx_store::StoreError> {
        let state = Self::new(store.clone(), api_token, self_card);
        let records = store.load_gates().await?;
        {
            let mut gates = state.gates.write().expect("gate lock poisoned");
            for record in records {
                if let Some(gate) = gates.get_mut(&record.name) {
                    gate.state = if record.state == "open" {
                        GateState::Open
                    } else {
                        GateState::Hold
                    };
                    gate.ticket = record.ticket;
                }
            }
        }
        Ok(state)
    }

    pub fn gate_state(&self, name: &str) -> Option<GateState> {
        self.gates
            .read()
            .expect("gate lock poisoned")
            .get(name)
            .map(|g| g.state)
    }
}

fn gate_state_str(state: GateState) -> &'static str {
    match state {
        GateState::Hold => "hold",
        GateState::Open => "open",
    }
}

/// Fallback card for local dev/tests.
pub fn default_self_card() -> AgentCard {
    AgentCard {
        id: "sirinx-control-local".into(),
        name: "SIRINX Control (local)".into(),
        capabilities: vec!["gates".into(), "pending-work".into()],
        endpoint: "http://127.0.0.1:8711".into(),
        priority: 0,
    }
}

/// Build this node's card from env + the installed skill set: every
/// directory in `skills_dir` becomes a routable capability, so OmniRoute
/// can send work to the node that actually has the skill.
pub fn self_card_from_env(skills_dir: &std::path::Path) -> AgentCard {
    let mut capabilities = vec!["gates".into(), "pending-work".into()];
    if let Ok(entries) = std::fs::read_dir(skills_dir) {
        let mut skills: Vec<String> = entries
            .filter_map(|e| e.ok())
            .filter(|e| e.path().is_dir())
            .filter_map(|e| e.file_name().into_string().ok())
            .map(|name| format!("skill:{name}"))
            .collect();
        skills.sort();
        capabilities.extend(skills);
    }
    let id = std::env::var("A2A_NODE_ID").unwrap_or_else(|_| "sirinx-control-local".into());
    let endpoint = std::env::var("A2A_ENDPOINT").unwrap_or_else(|_| "http://127.0.0.1:8711".into());
    AgentCard {
        name: format!("SIRINX Control ({id})"),
        id,
        capabilities,
        endpoint,
        priority: std::env::var("A2A_PRIORITY")
            .ok()
            .and_then(|p| p.parse().ok())
            .unwrap_or(0),
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
        .route("/api/a2a/card", get(a2a_card))
        .route("/api/a2a/sync", post(a2a_sync))
        .route("/api/a2a/route", post(a2a_route))
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
    if !state
        .gates
        .read()
        .expect("gate lock poisoned")
        .contains_key(&name)
    {
        return Err((
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "unknown gate" })),
        ));
    }

    let ticket = match decision.state {
        GateState::Open => decision.ticket,
        GateState::Hold => None,
    };

    // Persist first — a decision that cannot be made durable is not a
    // decision (B1: gates must survive restarts).
    state
        .store
        .upsert_gate(&sirinx_core::GateRecord {
            name: name.clone(),
            state: gate_state_str(decision.state).to_owned(),
            ticket: ticket.clone(),
        })
        .await
        .map_err(|err| {
            tracing::error!(gate = %name, error = %err, "failed to persist gate decision");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": "storage backend failure" })),
            )
        })?;

    let mut gates = state.gates.write().expect("gate lock poisoned");
    let gate = gates.get_mut(&name).expect("existence checked above");
    gate.state = decision.state;
    gate.ticket = ticket;
    tracing::info!(gate = %name, state = ?gate.state, "gate decision recorded (durable)");
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

async fn a2a_card(State(state): State<ControlState>) -> Json<AgentCard> {
    Json(state.self_card.clone())
}

/// Delta sync: register the peer's card, return the pending work the
/// peer is missing plus every card this node knows.
async fn a2a_sync(
    State(state): State<ControlState>,
    Json(req): Json<SyncRequest>,
) -> Result<Json<SyncResponse>, (StatusCode, Json<serde_json::Value>)> {
    state
        .omniroute
        .write()
        .expect("omniroute lock poisoned")
        .register(req.node.clone());
    tracing::info!(peer = %req.node.id, "a2a peer registered/refreshed");

    let local = state.store.list_pending_work().await.map_err(|err| {
        tracing::error!(error = %err, "a2a sync backend failure");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": "storage backend failure" })),
        )
    })?;
    let missing_work = diff_work(&req.known_work_ids, &local);
    let peer_agents = state
        .omniroute
        .read()
        .expect("omniroute lock poisoned")
        .cards();

    Ok(Json(SyncResponse {
        node: state.self_card.clone(),
        missing_work,
        peer_agents,
    }))
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RouteRequest {
    capabilities: Vec<String>,
}

/// OmniRoute: pick the best known agent card for the required
/// capabilities (e.g. `["skill:sirinx-seo-77-provinces"]`).
async fn a2a_route(
    State(state): State<ControlState>,
    Json(req): Json<RouteRequest>,
) -> Result<Json<AgentCard>, (StatusCode, Json<serde_json::Value>)> {
    let omniroute = state.omniroute.read().expect("omniroute lock poisoned");
    omniroute
        .route(&req.capabilities)
        .cloned()
        .map(Json)
        .ok_or((
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({
                "error": "no agent offers the required capabilities",
                "required": req.capabilities,
            })),
        ))
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
            default_self_card(),
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
    async fn gate_decisions_survive_restart() {
        // One shared store = the database; two ControlStates = two
        // process lifetimes.
        let store: Arc<MemoryStore> = Arc::new(MemoryStore::default());

        let first = ControlState::new(store.clone(), None, default_self_card());
        let app = router(first);
        let opened = app
            .oneshot(json_request(
                "POST",
                "/api/gates/deploy/decision",
                serde_json::json!({ "state": "open", "ticket": "GO-LIVE-DEPLOY-001" }),
            ))
            .await
            .unwrap();
        assert_eq!(opened.status(), StatusCode::OK);

        // "Restart": load a fresh state from the same store.
        let second = ControlState::load(store, None, default_self_card())
            .await
            .unwrap();
        assert_eq!(second.gate_state("deploy"), Some(GateState::Open));
        // Untouched gates stay on their default hold.
        assert_eq!(second.gate_state("telegram_send"), Some(GateState::Hold));
    }

    #[tokio::test]
    async fn a2a_card_endpoint_serves_self_identity() {
        let app = router(ControlState::with_default_gates());
        let res = app
            .oneshot(Request::get("/api/a2a/card").body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::OK);
        let card = body_json(res).await;
        assert_eq!(card["id"], "sirinx-control-local");
        assert!(card["capabilities"].as_array().unwrap().len() >= 2);
    }

    #[tokio::test]
    async fn a2a_sync_registers_peer_and_returns_missing_work() {
        let app = router(ControlState::with_default_gates());

        // Local node has one work item the peer doesn't know about.
        let created = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/pending-work",
                serde_json::json!({ "source": "local", "title": "port sirinx-godmode presets" }),
            ))
            .await
            .unwrap();
        assert_eq!(created.status(), StatusCode::CREATED);

        // Peer (mac-mini-m2) syncs with an empty known set.
        let res = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/a2a/sync",
                serde_json::json!({
                    "node": {
                        "id": "mac-mini-m2",
                        "name": "Mac mini M2",
                        "capabilities": ["skill:start-run-debug", "rust-build"],
                        "endpoint": "http://192.168.50.20:8711",
                        "priority": 1
                    },
                    "knownWorkIds": []
                }),
            ))
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::OK);
        let body = body_json(res).await;
        assert_eq!(body["missingWork"].as_array().unwrap().len(), 1);
        // Both the local node and the freshly registered peer are known.
        assert_eq!(body["peerAgents"].as_array().unwrap().len(), 2);

        // After sync, OmniRoute can route to the peer by its skill.
        let routed = app
            .oneshot(json_request(
                "POST",
                "/api/a2a/route",
                serde_json::json!({ "capabilities": ["skill:start-run-debug"] }),
            ))
            .await
            .unwrap();
        assert_eq!(routed.status(), StatusCode::OK);
        assert_eq!(body_json(routed).await["id"], "mac-mini-m2");
    }

    #[tokio::test]
    async fn a2a_route_404_when_no_agent_capable() {
        let app = router(ControlState::with_default_gates());
        let res = app
            .oneshot(json_request(
                "POST",
                "/api/a2a/route",
                serde_json::json!({ "capabilities": ["skill:nonexistent"] }),
            ))
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::NOT_FOUND);
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

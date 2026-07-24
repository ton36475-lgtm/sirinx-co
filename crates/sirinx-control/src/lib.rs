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
//! - `GET  /ready`                         — redacted operational readiness
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
//! one queue and durable gate decisions. Postgres notifies listeners on
//! every pending-work insert.

use std::collections::{BTreeMap, BTreeSet};
use std::fmt::Write as _;
use std::sync::{Arc, RwLock};
use std::time::{SystemTime, UNIX_EPOCH};

use axum::extract::{Path, Request, State};
use axum::http::StatusCode;
use axum::middleware::{self, Next};
use axum::response::Response;
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};

use sirinx_a2a::{diff_work, AgentCard, OmniRoute, SyncRequest, SyncResponse};
use sirinx_core::PendingWork;
use sirinx_store::{MemoryStore, Store, StoreError};

// Preserve the original sirinx-control public API while keeping domain
// types canonical in sirinx-core for persistence and other consumers.
pub use sirinx_core::{Gate, GateState};

/// The release gates carried over from RELEASE_GATE.md / NEXT_ACTIONS.md.
/// Everything ships in `hold`.
pub const DEFAULT_GATES: &[&str] = &[
    "deploy",
    "cloudflare_dns",
    "telegram_send",
    "customer_messaging",
    "adaptive_sync",
];

const TELEGRAM_SEND_GATE: &str = "telegram_send";
const TELEGRAM_TICKET_PREFIX: &str = "OPS-TG-";

fn open_ticket_is_valid(gate_name: &str, ticket: Option<&str>) -> bool {
    let Some(ticket) = ticket else {
        return false;
    };
    if ticket.trim().is_empty() {
        return false;
    }
    if gate_name != TELEGRAM_SEND_GATE {
        return true;
    }

    ticket
        .strip_prefix(TELEGRAM_TICKET_PREFIX)
        .is_some_and(|suffix| !suffix.trim().is_empty())
}

fn invalid_open_ticket_message(gate_name: &str, ticket: Option<&str>) -> Option<&'static str> {
    if ticket.is_none_or(|ticket| ticket.trim().is_empty()) {
        return Some("opening a gate requires a ticket");
    }
    if gate_name == TELEGRAM_SEND_GATE && !open_ticket_is_valid(gate_name, ticket) {
        return Some("opening telegram_send requires an OPS-TG- ticket");
    }
    None
}

/// The persistence authority selected for control-gate decisions.
///
/// `durable` is derived from this enum rather than accepted as an independent
/// boolean, so the API cannot accidentally advertise process-local memory as
/// durable. Production selects this value alongside the concrete Store.
#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum GatePersistence {
    Memory,
    Postgres,
}

impl GatePersistence {
    pub const fn durable(self) -> bool {
        matches!(self, Self::Postgres)
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct GatePersistenceEvidence {
    backend: GatePersistence,
    durable: bool,
    /// Unix epoch milliseconds observed after the authoritative Store read.
    observed_at: u64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ReadinessAuthEvidence {
    configured: bool,
    api_routes_protected: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ReadinessPersistenceEvidence {
    backend: GatePersistence,
    durable: bool,
    available: bool,
    observed_at: Option<u64>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct TelegramAdmissionReadiness {
    live_admission_ready: bool,
    gate_state: GateState,
    ticket_policy_satisfied: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ControlReadiness {
    status: &'static str,
    service: &'static str,
    operational_ready: bool,
    auth: ReadinessAuthEvidence,
    persistence: ReadinessPersistenceEvidence,
    telegram: TelegramAdmissionReadiness,
    reasons: Vec<&'static str>,
}

#[derive(Clone)]
pub struct ControlState {
    gates: Arc<RwLock<BTreeMap<String, Gate>>>,
    store: Arc<dyn Store>,
    gate_persistence: GatePersistence,
    /// Gate decisions are persisted and cached as one ordered operation.
    gate_decisions: Arc<tokio::sync::Mutex<()>>,
    /// A restrictive decision that could not be persisted must still win on
    /// this node. It is cleared only after a later successful decision.
    local_hold_overrides: Arc<RwLock<BTreeSet<String>>>,
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
        Self::new_with_persistence(store, api_token, self_card, GatePersistence::Memory)
    }

    /// Construct a state with explicit persistence evidence.
    ///
    /// Callers that do not select an authority explicitly remain compatible
    /// with `new` and safely report process-local memory.
    pub fn new_with_persistence(
        store: Arc<dyn Store>,
        api_token: Option<String>,
        self_card: AgentCard,
        gate_persistence: GatePersistence,
    ) -> Self {
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
            gate_persistence,
            gate_decisions: Arc::new(tokio::sync::Mutex::new(())),
            local_hold_overrides: Arc::new(RwLock::new(BTreeSet::new())),
            api_token: api_token.map(Into::into),
            self_card,
            omniroute: Arc::new(RwLock::new(omniroute)),
        }
    }

    /// Build a safe hold-by-default state and overlay durable decisions.
    /// Unknown or invalid stored rows cannot create or open runtime gates.
    pub async fn load(
        store: Arc<dyn Store>,
        api_token: Option<String>,
        self_card: AgentCard,
    ) -> Result<Self, StoreError> {
        Self::load_with_persistence(store, api_token, self_card, GatePersistence::Memory).await
    }

    /// Build a safe state, overlay stored decisions, and retain explicit
    /// persistence evidence for operator and downstream admission checks.
    pub async fn load_with_persistence(
        store: Arc<dyn Store>,
        api_token: Option<String>,
        self_card: AgentCard,
        gate_persistence: GatePersistence,
    ) -> Result<Self, StoreError> {
        let state = Self::new_with_persistence(store, api_token, self_card, gate_persistence);
        let persisted = state.store.list_gates().await?;
        let stored = persisted.len();
        let mut applied = 0usize;
        let mut ignored = 0usize;

        {
            let mut gates = state.gates.write().expect("gate lock poisoned");
            for mut gate in persisted {
                let Some(slot) = gates.get_mut(&gate.name) else {
                    ignored += 1;
                    tracing::warn!(gate = %gate.name, "ignoring unknown persisted gate");
                    continue;
                };

                match gate.state {
                    GateState::Hold => {
                        gate.ticket = None;
                    }
                    GateState::Open
                        if !open_ticket_is_valid(&gate.name, gate.ticket.as_deref()) =>
                    {
                        ignored += 1;
                        tracing::error!(
                            gate = %gate.name,
                            "ignoring persisted open gate with invalid ticket policy"
                        );
                        continue;
                    }
                    GateState::Open => {}
                }

                *slot = gate;
                applied += 1;
            }
        }

        tracing::info!(stored, applied, ignored, "control gate state loaded");
        Ok(state)
    }

    pub fn gate_state(&self, name: &str) -> Option<GateState> {
        self.gates
            .read()
            .expect("gate lock poisoned")
            .get(name)
            .map(|g| g.state)
    }

    /// Resolve one gate from the shared Store before authorizing an action.
    /// The runtime cache is only a view: a missing, malformed, or failed
    /// authoritative read can never preserve a stale open decision.
    async fn authoritative_gate(&self, name: &str) -> Result<Option<Gate>, StoreError> {
        if !self
            .gates
            .read()
            .expect("gate lock poisoned")
            .contains_key(name)
        {
            return Ok(None);
        }

        if self
            .local_hold_overrides
            .read()
            .expect("local hold override lock poisoned")
            .contains(name)
        {
            let gate = Gate {
                name: name.to_owned(),
                state: GateState::Hold,
                ticket: None,
            };
            self.gates
                .write()
                .expect("gate lock poisoned")
                .insert(name.to_owned(), gate.clone());
            return Ok(Some(gate));
        }

        let persisted = self.store.get_gate(name).await?;
        let gate = match persisted {
            Some(mut gate) if gate.name == name => match gate.state {
                GateState::Hold => {
                    gate.ticket = None;
                    gate
                }
                GateState::Open if !open_ticket_is_valid(name, gate.ticket.as_deref()) => {
                    tracing::error!(
                        gate = %name,
                        "authoritative open gate has invalid ticket policy; forcing hold"
                    );
                    Gate {
                        name: name.to_owned(),
                        state: GateState::Hold,
                        ticket: None,
                    }
                }
                GateState::Open => gate,
            },
            Some(gate) => {
                tracing::error!(
                    requested_gate = %name,
                    stored_gate = %gate.name,
                    "authoritative gate lookup returned the wrong gate; forcing hold"
                );
                Gate {
                    name: name.to_owned(),
                    state: GateState::Hold,
                    ticket: None,
                }
            }
            None => Gate {
                name: name.to_owned(),
                state: GateState::Hold,
                ticket: None,
            },
        };

        self.gates
            .write()
            .expect("gate lock poisoned")
            .insert(name.to_owned(), gate.clone());
        Ok(Some(gate))
    }

    /// Refresh the complete operator-visible snapshot from Store. Missing or
    /// invalid rows become safe holds, and local emergency holds always win.
    async fn refresh_gate_snapshot(&self) -> Result<Vec<Gate>, StoreError> {
        let persisted = self.store.list_gates().await?;
        let mut refreshed: BTreeMap<String, Gate> = DEFAULT_GATES
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

        for mut gate in persisted {
            let Some(slot) = refreshed.get_mut(&gate.name) else {
                tracing::warn!(gate = %gate.name, "ignoring unknown persisted gate");
                continue;
            };
            match gate.state {
                GateState::Hold => gate.ticket = None,
                GateState::Open if !open_ticket_is_valid(&gate.name, gate.ticket.as_deref()) => {
                    tracing::error!(
                        gate = %gate.name,
                        "persisted open gate has invalid ticket policy; forcing hold"
                    );
                    continue;
                }
                GateState::Open => {}
            }
            *slot = gate;
        }

        for name in self
            .local_hold_overrides
            .read()
            .expect("local hold override lock poisoned")
            .iter()
        {
            if let Some(gate) = refreshed.get_mut(name) {
                gate.state = GateState::Hold;
                gate.ticket = None;
            }
        }

        let snapshot = refreshed.values().cloned().collect();
        *self.gates.write().expect("gate lock poisoned") = refreshed;
        Ok(snapshot)
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
        .route("/ready", get(readiness))
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

fn observed_at_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
        .try_into()
        .unwrap_or(u64::MAX)
}

async fn readiness(State(state): State<ControlState>) -> (StatusCode, Json<ControlReadiness>) {
    let auth_configured = state
        .api_token
        .as_deref()
        .is_some_and(|token| !token.trim().is_empty());
    let persistence_durable = state.gate_persistence.durable();
    let refreshed = {
        let _decision_guard = state.gate_decisions.lock().await;
        state.refresh_gate_snapshot().await
    };
    let (persistence_available, observed_at, telegram_gate) = match refreshed {
        Ok(gates) => (
            true,
            Some(observed_at_ms()),
            gates
                .into_iter()
                .find(|gate| gate.name == TELEGRAM_SEND_GATE),
        ),
        Err(err) => {
            tracing::error!(error = %err, "control readiness gate refresh failed");
            (false, None, None)
        }
    };

    let telegram_gate_state = telegram_gate
        .as_ref()
        .map_or(GateState::Hold, |gate| gate.state);
    let ticket_policy_satisfied = telegram_gate.as_ref().is_some_and(|gate| {
        gate.state == GateState::Open
            && open_ticket_is_valid(TELEGRAM_SEND_GATE, gate.ticket.as_deref())
    });
    let operational_ready = auth_configured && persistence_durable && persistence_available;
    let live_admission_ready =
        operational_ready && telegram_gate_state == GateState::Open && ticket_policy_satisfied;

    let mut reasons = Vec::new();
    if !auth_configured {
        reasons.push("auth_not_configured");
    }
    if !persistence_durable {
        reasons.push("persistence_not_durable");
    }
    if !persistence_available {
        reasons.push("persistence_unavailable");
    }
    if telegram_gate_state != GateState::Open {
        reasons.push("telegram_gate_held");
    }
    if telegram_gate_state == GateState::Open && !ticket_policy_satisfied {
        reasons.push("telegram_ticket_policy_unsatisfied");
    }

    let status = if operational_ready {
        StatusCode::OK
    } else {
        StatusCode::SERVICE_UNAVAILABLE
    };
    let body = ControlReadiness {
        status: if operational_ready {
            "ready"
        } else {
            "not_ready"
        },
        service: "sirinx-control",
        operational_ready,
        auth: ReadinessAuthEvidence {
            configured: auth_configured,
            api_routes_protected: auth_configured,
        },
        persistence: ReadinessPersistenceEvidence {
            backend: state.gate_persistence,
            durable: persistence_durable,
            available: persistence_available,
            observed_at,
        },
        telegram: TelegramAdmissionReadiness {
            live_admission_ready,
            gate_state: telegram_gate_state,
            ticket_policy_satisfied,
        },
        reasons,
    };
    (status, Json(body))
}

/// Prometheus text exposition, dependency-free.
async fn metrics(
    State(state): State<ControlState>,
) -> Result<([(&'static str, &'static str); 1], String), StatusCode> {
    let gates = {
        let _decision_guard = state.gate_decisions.lock().await;
        state.refresh_gate_snapshot().await.map_err(|err| {
            tracing::error!(error = %err, "gate metrics refresh failed");
            StatusCode::SERVICE_UNAVAILABLE
        })?
    };
    let mut out = String::new();
    let _ = writeln!(
        out,
        "# HELP sirinx_control_gate_open 1 when the gate is open, 0 on hold.\n# TYPE sirinx_control_gate_open gauge"
    );
    for gate in &gates {
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
    Ok(([("content-type", "text/plain; version=0.0.4")], out))
}

async fn list_gates(
    State(state): State<ControlState>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let _decision_guard = state.gate_decisions.lock().await;
    let gates = state.refresh_gate_snapshot().await.map_err(|err| {
        tracing::error!(error = %err, "gate snapshot refresh failed");
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": "storage backend failure" })),
        )
    })?;
    let persistence = GatePersistenceEvidence {
        backend: state.gate_persistence,
        durable: state.gate_persistence.durable(),
        observed_at: observed_at_ms(),
    };
    Ok(Json(
        serde_json::json!({ "gates": gates, "persistence": persistence }),
    ))
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
    if decision.state == GateState::Open {
        if let Some(message) = invalid_open_ticket_message(&name, decision.ticket.as_deref()) {
            return Err((
                StatusCode::UNPROCESSABLE_ENTITY,
                Json(serde_json::json!({ "error": message })),
            ));
        }
    }
    let _decision_guard = state.gate_decisions.lock().await;
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

    let gate = Gate {
        name: name.clone(),
        state: decision.state,
        ticket: match decision.state {
            GateState::Open => decision.ticket,
            GateState::Hold => None,
        },
    };

    if gate.state == GateState::Hold {
        // Restrictive decisions apply locally first. If persistence fails,
        // the override remains and action authorization cannot read a stale
        // open decision back from Store on this node.
        state
            .local_hold_overrides
            .write()
            .expect("local hold override lock poisoned")
            .insert(name.clone());
        state
            .gates
            .write()
            .expect("gate lock poisoned")
            .insert(name.clone(), gate.clone());
    }

    state.store.upsert_gate(&gate).await.map_err(|err| {
        tracing::error!(
            gate = %name,
            state = ?gate.state,
            error = %err,
            restrictive_override = gate.state == GateState::Hold,
            "gate decision persistence failed"
        );
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": "storage backend failure" })),
        )
    })?;

    state
        .local_hold_overrides
        .write()
        .expect("local hold override lock poisoned")
        .remove(&name);

    state
        .gates
        .write()
        .expect("gate lock poisoned")
        .insert(name.clone(), gate.clone());
    tracing::info!(gate = %name, state = ?gate.state, "gate decision persisted and applied");
    Ok(Json(gate))
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
    // Serialize local decisions with authorization and always re-read the
    // shared Store. This prevents a previously-open cache on another node
    // from authorizing after a hold decision has been persisted elsewhere.
    let _decision_guard = state.gate_decisions.lock().await;
    let gate_state = state
        .authoritative_gate(&req.gate)
        .await
        .map_err(|err| {
            tracing::error!(
                gate = %req.gate,
                error = %err,
                "authoritative gate read failed; action denied"
            );
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": "storage backend failure" })),
            )
        })?
        .ok_or((
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "unknown gate" })),
        ))?
        .state;
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
    use std::sync::atomic::{AtomicBool, Ordering};
    use std::time::Duration;

    use super::*;
    use async_trait::async_trait;
    use axum::body::Body;
    use axum::http::{header, Request};
    use sirinx_core::{AnalyticsEvent, Lead, LeadStatus};
    use tokio::sync::Notify;
    use tower::ServiceExt;
    use uuid::Uuid;

    #[derive(Default)]
    struct FailingGateStore {
        inner: MemoryStore,
        fail_gate_reads: AtomicBool,
        fail_gate_writes: AtomicBool,
    }

    #[derive(Default)]
    struct BlockingPendingCountStore {
        inner: MemoryStore,
        count_started: Notify,
        release_count: Notify,
    }

    #[async_trait]
    impl Store for BlockingPendingCountStore {
        async fn insert_lead(&self, lead: &Lead) -> Result<(), StoreError> {
            self.inner.insert_lead(lead).await
        }

        async fn get_lead(&self, id: Uuid) -> Result<Option<Lead>, StoreError> {
            self.inner.get_lead(id).await
        }

        async fn update_lead_status(&self, id: Uuid, next: LeadStatus) -> Result<Lead, StoreError> {
            self.inner.update_lead_status(id, next).await
        }

        async fn delete_lead(&self, id: Uuid) -> Result<bool, StoreError> {
            self.inner.delete_lead(id).await
        }

        async fn count_leads(&self) -> Result<u64, StoreError> {
            self.inner.count_leads().await
        }

        async fn insert_event(&self, event: &AnalyticsEvent) -> Result<(), StoreError> {
            self.inner.insert_event(event).await
        }

        async fn count_events(&self) -> Result<u64, StoreError> {
            self.inner.count_events().await
        }

        async fn insert_pending_work(&self, item: &PendingWork) -> Result<(), StoreError> {
            self.inner.insert_pending_work(item).await
        }

        async fn list_pending_work(&self) -> Result<Vec<PendingWork>, StoreError> {
            self.inner.list_pending_work().await
        }

        async fn count_pending_work(&self) -> Result<u64, StoreError> {
            self.count_started.notify_one();
            self.release_count.notified().await;
            self.inner.count_pending_work().await
        }

        async fn upsert_gate(&self, gate: &Gate) -> Result<(), StoreError> {
            self.inner.upsert_gate(gate).await
        }

        async fn list_gates(&self) -> Result<Vec<Gate>, StoreError> {
            self.inner.list_gates().await
        }

        async fn get_gate(&self, name: &str) -> Result<Option<Gate>, StoreError> {
            self.inner.get_gate(name).await
        }
    }

    #[async_trait]
    impl Store for FailingGateStore {
        async fn insert_lead(&self, _lead: &Lead) -> Result<(), StoreError> {
            unreachable!("lead storage is unused in gate failure tests")
        }

        async fn get_lead(&self, _id: Uuid) -> Result<Option<Lead>, StoreError> {
            unreachable!("lead storage is unused in gate failure tests")
        }

        async fn update_lead_status(
            &self,
            _id: Uuid,
            _next: LeadStatus,
        ) -> Result<Lead, StoreError> {
            unreachable!("lead storage is unused in gate failure tests")
        }

        async fn delete_lead(&self, _id: Uuid) -> Result<bool, StoreError> {
            unreachable!("lead storage is unused in gate failure tests")
        }

        async fn count_leads(&self) -> Result<u64, StoreError> {
            unreachable!("lead storage is unused in gate failure tests")
        }

        async fn insert_event(&self, _event: &AnalyticsEvent) -> Result<(), StoreError> {
            unreachable!("analytics storage is unused in gate failure tests")
        }

        async fn count_events(&self) -> Result<u64, StoreError> {
            unreachable!("analytics storage is unused in gate failure tests")
        }

        async fn insert_pending_work(&self, _item: &PendingWork) -> Result<(), StoreError> {
            unreachable!("pending work is unused in gate failure tests")
        }

        async fn list_pending_work(&self) -> Result<Vec<PendingWork>, StoreError> {
            unreachable!("pending work is unused in gate failure tests")
        }

        async fn count_pending_work(&self) -> Result<u64, StoreError> {
            unreachable!("pending work is unused in gate failure tests")
        }

        async fn upsert_gate(&self, gate: &Gate) -> Result<(), StoreError> {
            if self.fail_gate_writes.load(Ordering::SeqCst) {
                return Err(StoreError::Backend("injected gate write failure".into()));
            }
            self.inner.upsert_gate(gate).await
        }

        async fn list_gates(&self) -> Result<Vec<Gate>, StoreError> {
            if self.fail_gate_reads.load(Ordering::SeqCst) {
                return Err(StoreError::Backend("injected gate read failure".into()));
            }
            self.inner.list_gates().await
        }

        async fn get_gate(&self, name: &str) -> Result<Option<Gate>, StoreError> {
            if self.fail_gate_reads.load(Ordering::SeqCst) {
                return Err(StoreError::Backend("injected gate read failure".into()));
            }
            self.inner.get_gate(name).await
        }
    }

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
        assert_eq!(body["persistence"]["backend"], "memory");
        assert_eq!(body["persistence"]["durable"], false);
        assert!(body["persistence"]["observedAt"].as_u64().unwrap() > 0);
    }

    #[tokio::test]
    async fn postgres_persistence_evidence_is_explicit_and_durable() {
        let store = Arc::new(MemoryStore::default());
        store
            .upsert_gate(&Gate {
                name: "telegram_send".into(),
                state: GateState::Open,
                ticket: Some("OPS-TG-TEST-POSTGRES".into()),
            })
            .await
            .unwrap();
        let state = ControlState::load_with_persistence(
            store,
            None,
            default_self_card(),
            GatePersistence::Postgres,
        )
        .await
        .unwrap();

        let response = router(state)
            .oneshot(Request::get("/api/gates").body(Body::empty()).unwrap())
            .await
            .unwrap();
        let body = body_json(response).await;
        let telegram = body["gates"]
            .as_array()
            .unwrap()
            .iter()
            .find(|gate| gate["name"] == "telegram_send")
            .unwrap();

        assert_eq!(telegram["state"], "open");
        assert_eq!(body["persistence"]["backend"], "postgres");
        assert_eq!(body["persistence"]["durable"], true);
        assert!(body["persistence"]["observedAt"].as_u64().unwrap() > 0);
    }

    #[tokio::test]
    async fn health_stays_live_when_operational_readiness_is_unavailable() {
        let app = router(ControlState::with_default_gates());
        let health = app
            .clone()
            .oneshot(Request::get("/health").body(Body::empty()).unwrap())
            .await
            .unwrap();
        let ready = app
            .oneshot(Request::get("/ready").body(Body::empty()).unwrap())
            .await
            .unwrap();

        assert_eq!(health.status(), StatusCode::OK);
        assert_eq!(ready.status(), StatusCode::SERVICE_UNAVAILABLE);
        assert_eq!(body_json(ready).await["operationalReady"], false);
    }

    #[tokio::test]
    async fn readiness_requires_auth_and_durable_persistence_but_not_an_open_telegram_gate() {
        let state = ControlState::new_with_persistence(
            Arc::new(MemoryStore::default()),
            Some("test-control-token".into()),
            default_self_card(),
            GatePersistence::Postgres,
        );
        let response = router(state)
            .oneshot(Request::get("/ready").body(Body::empty()).unwrap())
            .await
            .unwrap();
        let status = response.status();
        let body = body_json(response).await;

        assert_eq!(status, StatusCode::OK);
        assert_eq!(body["operationalReady"], true);
        assert_eq!(body["telegram"]["liveAdmissionReady"], false);
        assert_eq!(body["telegram"]["gateState"], "hold");
    }

    #[tokio::test]
    async fn readiness_admits_live_telegram_only_with_every_requirement_and_redacts_evidence() {
        let store = Arc::new(MemoryStore::default());
        store
            .upsert_gate(&Gate {
                name: TELEGRAM_SEND_GATE.into(),
                state: GateState::Open,
                ticket: Some("OPS-TG-SENSITIVE-123".into()),
            })
            .await
            .unwrap();
        let state = ControlState::load_with_persistence(
            store,
            Some("sensitive-control-token".into()),
            default_self_card(),
            GatePersistence::Postgres,
        )
        .await
        .unwrap();

        let response = router(state)
            .oneshot(Request::get("/ready").body(Body::empty()).unwrap())
            .await
            .unwrap();
        let status = response.status();
        let body = body_json(response).await;
        let rendered = body.to_string();

        assert_eq!(status, StatusCode::OK);
        assert_eq!(body["telegram"]["liveAdmissionReady"], true);
        assert_eq!(body["telegram"]["ticketPolicySatisfied"], true);
        assert!(!rendered.contains("SENSITIVE") && !rendered.contains("sensitive-control-token"));
    }

    #[tokio::test]
    async fn readiness_fails_closed_when_gate_store_is_unavailable() {
        let store = Arc::new(FailingGateStore::default());
        store.fail_gate_reads.store(true, Ordering::SeqCst);
        let state = ControlState::new_with_persistence(
            store,
            Some("test-control-token".into()),
            default_self_card(),
            GatePersistence::Postgres,
        );

        let response = router(state)
            .oneshot(Request::get("/ready").body(Body::empty()).unwrap())
            .await
            .unwrap();
        let status = response.status();
        let body = body_json(response).await;

        assert_eq!(status, StatusCode::SERVICE_UNAVAILABLE);
        assert_eq!(body["persistence"]["available"], false);
        assert_eq!(body["telegram"]["liveAdmissionReady"], false);
    }

    #[tokio::test]
    async fn telegram_send_rejects_a_non_ops_ticket_without_changing_state() {
        let app = router(ControlState::with_default_gates());
        let response = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/gates/telegram_send/decision",
                serde_json::json!({ "state": "open", "ticket": "GO-LIVE-001" }),
            ))
            .await
            .unwrap();
        let status = response.status();
        let body = body_json(response).await;
        let listed = app
            .oneshot(Request::get("/api/gates").body(Body::empty()).unwrap())
            .await
            .unwrap();
        let listed = body_json(listed).await;
        let telegram = listed["gates"]
            .as_array()
            .unwrap()
            .iter()
            .find(|gate| gate["name"] == TELEGRAM_SEND_GATE)
            .unwrap();

        assert_eq!(status, StatusCode::UNPROCESSABLE_ENTITY);
        assert_eq!(
            body["error"],
            "opening telegram_send requires an OPS-TG- ticket"
        );
        assert_eq!(telegram["state"], "hold");
    }

    #[tokio::test]
    async fn telegram_send_accepts_an_ops_ticket() {
        let app = router(ControlState::with_default_gates());
        let response = app
            .oneshot(json_request(
                "POST",
                "/api/gates/telegram_send/decision",
                serde_json::json!({ "state": "open", "ticket": "OPS-TG-001" }),
            ))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(body_json(response).await["state"], "open");
    }

    #[tokio::test]
    async fn persisted_telegram_open_with_a_non_ops_ticket_loads_as_hold() {
        let store = Arc::new(MemoryStore::default());
        store
            .upsert_gate(&Gate {
                name: TELEGRAM_SEND_GATE.into(),
                state: GateState::Open,
                ticket: Some("GO-LIVE-001".into()),
            })
            .await
            .unwrap();

        let state = ControlState::load(store, None, default_self_card())
            .await
            .unwrap();

        assert_eq!(state.gate_state(TELEGRAM_SEND_GATE), Some(GateState::Hold));
    }

    #[tokio::test]
    async fn authoritative_action_denies_a_telegram_row_with_a_non_ops_ticket() {
        let store = Arc::new(MemoryStore::default());
        let state = ControlState::load(store.clone(), None, default_self_card())
            .await
            .unwrap();
        store
            .upsert_gate(&Gate {
                name: TELEGRAM_SEND_GATE.into(),
                state: GateState::Open,
                ticket: Some("GO-LIVE-001".into()),
            })
            .await
            .unwrap();

        let response = router(state)
            .oneshot(json_request(
                "POST",
                "/api/actions",
                serde_json::json!({ "gate": TELEGRAM_SEND_GATE, "action": "send_alert" }),
            ))
            .await
            .unwrap();

        assert_eq!(body_json(response).await["executed"], false);
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
    async fn persisted_gate_survives_control_state_reload() {
        let store = Arc::new(MemoryStore::default());
        let first = ControlState::load(store.clone(), None, default_self_card())
            .await
            .unwrap();
        let app = router(first);

        let opened = app
            .oneshot(json_request(
                "POST",
                "/api/gates/deploy/decision",
                serde_json::json!({ "state": "open", "ticket": "GO-LIVE-RELOAD-001" }),
            ))
            .await
            .unwrap();
        assert_eq!(opened.status(), StatusCode::OK);

        let reloaded = ControlState::load(store, None, default_self_card())
            .await
            .unwrap();
        assert_eq!(reloaded.gate_state("deploy"), Some(GateState::Open));

        let listed = router(reloaded)
            .oneshot(Request::get("/api/gates").body(Body::empty()).unwrap())
            .await
            .unwrap();
        let body = body_json(listed).await;
        let deploy = body["gates"]
            .as_array()
            .unwrap()
            .iter()
            .find(|gate| gate["name"] == "deploy")
            .unwrap();
        assert_eq!(deploy["state"], "open");
        assert_eq!(deploy["ticket"], "GO-LIVE-RELOAD-001");
    }

    #[tokio::test]
    async fn load_ignores_unknown_and_invalid_open_gates() {
        let store = Arc::new(MemoryStore::default());
        store
            .upsert_gate(&Gate {
                name: "future_gate".into(),
                state: GateState::Open,
                ticket: Some("FUTURE-001".into()),
            })
            .await
            .unwrap();
        store
            .upsert_gate(&Gate {
                name: "deploy".into(),
                state: GateState::Open,
                ticket: None,
            })
            .await
            .unwrap();

        let state = ControlState::load(store, None, default_self_card())
            .await
            .unwrap();
        assert_eq!(state.gate_state("future_gate"), None);
        assert_eq!(state.gate_state("deploy"), Some(GateState::Hold));
    }

    #[tokio::test]
    async fn actions_refresh_gate_decisions_shared_across_control_nodes() {
        let store = Arc::new(MemoryStore::default());
        let node_a = ControlState::load(store.clone(), None, default_self_card())
            .await
            .unwrap();
        let node_b = ControlState::load(store, None, default_self_card())
            .await
            .unwrap();
        let app_a = router(node_a);
        let app_b = router(node_b.clone());

        let opened = app_a
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/gates/deploy/decision",
                serde_json::json!({ "state": "open", "ticket": "GO-LIVE-SHARED-001" }),
            ))
            .await
            .unwrap();
        assert_eq!(opened.status(), StatusCode::OK);

        let allowed = app_b
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/actions",
                serde_json::json!({ "gate": "deploy", "action": "prepare_release" }),
            ))
            .await
            .unwrap();
        assert_eq!(body_json(allowed).await["executed"], true);
        assert_eq!(node_b.gate_state("deploy"), Some(GateState::Open));

        let held = app_a
            .oneshot(json_request(
                "POST",
                "/api/gates/deploy/decision",
                serde_json::json!({ "state": "hold" }),
            ))
            .await
            .unwrap();
        assert_eq!(held.status(), StatusCode::OK);

        // Node B still has Open in its cache here. The action path must read
        // through Store, observe Hold, deny execution, and repair its cache.
        assert_eq!(node_b.gate_state("deploy"), Some(GateState::Open));
        let denied = app_b
            .oneshot(json_request(
                "POST",
                "/api/actions",
                serde_json::json!({ "gate": "deploy", "action": "prepare_release" }),
            ))
            .await
            .unwrap();
        let denied_body = body_json(denied).await;
        assert_eq!(denied_body["executed"], false);
        assert_eq!(denied_body["dryRun"], true);
        assert_eq!(node_b.gate_state("deploy"), Some(GateState::Hold));
    }

    #[tokio::test]
    async fn gate_observability_refreshes_across_control_nodes() {
        let store = Arc::new(MemoryStore::default());
        let node_a = ControlState::load(store.clone(), None, default_self_card())
            .await
            .unwrap();
        let node_b = ControlState::load(store, None, default_self_card())
            .await
            .unwrap();
        let app_a = router(node_a);
        let app_b = router(node_b.clone());

        app_a
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/gates/deploy/decision",
                serde_json::json!({ "state": "open", "ticket": "GO-LIVE-OBSERVE-001" }),
            ))
            .await
            .unwrap();
        let open_snapshot = app_b
            .clone()
            .oneshot(Request::get("/api/gates").body(Body::empty()).unwrap())
            .await
            .unwrap();
        let open_body = body_json(open_snapshot).await;
        assert_eq!(
            open_body["gates"]
                .as_array()
                .unwrap()
                .iter()
                .find(|gate| gate["name"] == "deploy")
                .unwrap()["state"],
            "open"
        );

        app_a
            .oneshot(json_request(
                "POST",
                "/api/gates/deploy/decision",
                serde_json::json!({ "state": "hold" }),
            ))
            .await
            .unwrap();
        assert_eq!(node_b.gate_state("deploy"), Some(GateState::Open));

        let held_snapshot = app_b
            .clone()
            .oneshot(Request::get("/api/gates").body(Body::empty()).unwrap())
            .await
            .unwrap();
        let held_body = body_json(held_snapshot).await;
        assert_eq!(
            held_body["gates"]
                .as_array()
                .unwrap()
                .iter()
                .find(|gate| gate["name"] == "deploy")
                .unwrap()["state"],
            "hold"
        );
        assert_eq!(node_b.gate_state("deploy"), Some(GateState::Hold));

        let metrics_response = app_b
            .oneshot(Request::get("/metrics").body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(metrics_response.status(), StatusCode::OK);
        assert!(body_text(metrics_response)
            .await
            .contains("sirinx_control_gate_open{gate=\"deploy\"} 0"));
    }

    #[tokio::test]
    async fn slow_metrics_queue_count_does_not_block_emergency_hold() {
        let store = Arc::new(BlockingPendingCountStore::default());
        let state = ControlState::load(store.clone(), None, default_self_card())
            .await
            .unwrap();
        let app = router(state);

        let opened = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/gates/deploy/decision",
                serde_json::json!({ "state": "open", "ticket": "GO-LIVE-METRICS-001" }),
            ))
            .await
            .unwrap();
        assert_eq!(opened.status(), StatusCode::OK);

        let metrics_app = app.clone();
        let metrics_task = tokio::spawn(async move {
            metrics_app
                .oneshot(Request::get("/metrics").body(Body::empty()).unwrap())
                .await
                .unwrap()
        });
        store.count_started.notified().await;

        let held = tokio::time::timeout(
            Duration::from_secs(1),
            app.oneshot(json_request(
                "POST",
                "/api/gates/deploy/decision",
                serde_json::json!({ "state": "hold" }),
            )),
        )
        .await
        .expect("emergency hold must not wait for queue-depth metrics")
        .unwrap();
        assert_eq!(held.status(), StatusCode::OK);

        store.release_count.notify_one();
        assert_eq!(metrics_task.await.unwrap().status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn failed_emergency_hold_stays_local_and_fail_closed() {
        let store = Arc::new(FailingGateStore::default());
        let state = ControlState::load(store.clone(), None, default_self_card())
            .await
            .unwrap();
        let app = router(state.clone());

        let opened = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/gates/deploy/decision",
                serde_json::json!({ "state": "open", "ticket": "GO-LIVE-FAILURE-001" }),
            ))
            .await
            .unwrap();
        assert_eq!(opened.status(), StatusCode::OK);

        store.fail_gate_writes.store(true, Ordering::SeqCst);
        let failed_hold = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/gates/deploy/decision",
                serde_json::json!({ "state": "hold" }),
            ))
            .await
            .unwrap();
        assert_eq!(failed_hold.status(), StatusCode::INTERNAL_SERVER_ERROR);
        assert_eq!(state.gate_state("deploy"), Some(GateState::Hold));

        // The backing store still contains Open, but the emergency override
        // must prevent read-through from reopening this node.
        assert_eq!(
            store.inner.get_gate("deploy").await.unwrap().unwrap().state,
            GateState::Open
        );
        let denied = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/actions",
                serde_json::json!({ "gate": "deploy", "action": "prepare_release" }),
            ))
            .await
            .unwrap();
        let denied_body = body_json(denied).await;
        assert_eq!(denied_body["executed"], false);
        assert_eq!(denied_body["dryRun"], true);

        // A later successful explicit Open is the only operation that clears
        // the local emergency hold override.
        store.fail_gate_writes.store(false, Ordering::SeqCst);
        let reopened = app
            .clone()
            .oneshot(json_request(
                "POST",
                "/api/gates/deploy/decision",
                serde_json::json!({ "state": "open", "ticket": "GO-LIVE-FAILURE-002" }),
            ))
            .await
            .unwrap();
        assert_eq!(reopened.status(), StatusCode::OK);
        let allowed = app
            .oneshot(json_request(
                "POST",
                "/api/actions",
                serde_json::json!({ "gate": "deploy", "action": "prepare_release" }),
            ))
            .await
            .unwrap();
        assert_eq!(body_json(allowed).await["executed"], true);
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

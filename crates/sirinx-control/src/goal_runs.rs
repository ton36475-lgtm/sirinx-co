//! Process-local HTTP boundary for the sealed GoalSpec runtime.
//!
//! This module stores only bounded run metadata. Raw goals, tool arguments,
//! and tool outputs never enter the store or an HTTP response.

use std::collections::BTreeMap;
use std::sync::{Arc, RwLock};

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sirinx_autoloop::{
    run_goal, GoalRunError, GoalRunEvidence, GoalRunReport, GoalRunState, GoalSpec, MAX_GOAL_STEPS,
};
use uuid::Uuid;

use crate::ControlState;

pub(crate) const MAX_GOAL_RUN_REQUEST_BYTES: usize = 8 * 1024;
const MAX_API_GOAL_BYTES: usize = 2_048;
const MAX_STORED_GOAL_RUNS: usize = 256;

type ApiError = (StatusCode, Json<Value>);

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct CreateGoalRunRequest {
    goal: String,
    #[serde(default = "default_max_steps")]
    max_steps: usize,
}

fn default_max_steps() -> usize {
    1
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct GoalRunRecord {
    schema_version: &'static str,
    run_id: Uuid,
    status: GoalRunState,
    lifecycle: Vec<GoalRunState>,
    truth: GoalRunTruth,
    summary: GoalRunSummary,
    evidence: GoalRunEvidence,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct GoalRunTruth {
    scope: &'static str,
    durable: bool,
    survives_restart: bool,
    execution_profile: &'static str,
}

impl Default for GoalRunTruth {
    fn default() -> Self {
        Self {
            scope: "process_local",
            durable: false,
            survives_restart: false,
            execution_profile: "local_no_provider_no_effects",
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct GoalRunSummary {
    goal_bytes: usize,
    goal_characters: usize,
    max_steps: usize,
    steps_used: usize,
    tool_names: Vec<String>,
}

impl GoalRunRecord {
    fn planned(run_id: Uuid, spec: &GoalSpec) -> Self {
        let normalized = spec.goal.trim();
        Self {
            schema_version: "1.0.0",
            run_id,
            status: GoalRunState::Planned,
            lifecycle: vec![GoalRunState::Planned],
            truth: GoalRunTruth::default(),
            summary: GoalRunSummary {
                goal_bytes: normalized.len(),
                goal_characters: normalized.chars().count(),
                max_steps: spec.max_steps,
                steps_used: 0,
                tool_names: Vec::new(),
            },
            evidence: GoalRunEvidence::default(),
        }
    }

    fn apply_report(&mut self, report: GoalRunReport) {
        self.status = report.status;
        self.lifecycle.push(report.status);
        self.summary = GoalRunSummary {
            goal_bytes: report.goal_bytes,
            goal_characters: report.goal_characters,
            max_steps: report.max_steps,
            steps_used: report.steps_used,
            tool_names: report.tool_names,
        };
        self.evidence = report.evidence;
    }

    fn apply_failure(&mut self, status: GoalRunState) {
        self.status = status;
        self.lifecycle.push(status);
    }
}

#[derive(Debug)]
enum GoalRunStoreError {
    AtCapacity,
    NotFound,
    InvalidTransition,
    Unavailable,
}

#[derive(Clone, Default)]
pub(crate) struct GoalRunStore {
    records: Arc<RwLock<BTreeMap<Uuid, GoalRunRecord>>>,
}

impl GoalRunStore {
    fn reserve(&self, spec: &GoalSpec) -> Result<Uuid, GoalRunStoreError> {
        let mut records = self
            .records
            .write()
            .map_err(|_| GoalRunStoreError::Unavailable)?;
        if records.len() >= MAX_STORED_GOAL_RUNS {
            return Err(GoalRunStoreError::AtCapacity);
        }

        loop {
            let run_id = Uuid::new_v4();
            if let std::collections::btree_map::Entry::Vacant(slot) = records.entry(run_id) {
                slot.insert(GoalRunRecord::planned(run_id, spec));
                return Ok(run_id);
            }
        }
    }

    fn mark_running(&self, run_id: Uuid) -> Result<(), GoalRunStoreError> {
        let mut records = self
            .records
            .write()
            .map_err(|_| GoalRunStoreError::Unavailable)?;
        let record = records
            .get_mut(&run_id)
            .ok_or(GoalRunStoreError::NotFound)?;
        if record.status != GoalRunState::Planned {
            return Err(GoalRunStoreError::InvalidTransition);
        }
        record.status = GoalRunState::Running;
        record.lifecycle.push(GoalRunState::Running);
        Ok(())
    }

    fn finish(
        &self,
        run_id: Uuid,
        report: GoalRunReport,
    ) -> Result<GoalRunRecord, GoalRunStoreError> {
        let mut records = self
            .records
            .write()
            .map_err(|_| GoalRunStoreError::Unavailable)?;
        let record = records
            .get_mut(&run_id)
            .ok_or(GoalRunStoreError::NotFound)?;
        if record.status != GoalRunState::Running || !report.status.is_terminal() {
            return Err(GoalRunStoreError::InvalidTransition);
        }
        record.apply_report(report);
        Ok(record.clone())
    }

    fn fail(&self, run_id: Uuid, status: GoalRunState) -> Result<GoalRunRecord, GoalRunStoreError> {
        let mut records = self
            .records
            .write()
            .map_err(|_| GoalRunStoreError::Unavailable)?;
        let record = records
            .get_mut(&run_id)
            .ok_or(GoalRunStoreError::NotFound)?;
        if record.status != GoalRunState::Running || !status.is_terminal() {
            return Err(GoalRunStoreError::InvalidTransition);
        }
        record.apply_failure(status);
        Ok(record.clone())
    }

    fn get(&self, run_id: Uuid) -> Result<Option<GoalRunRecord>, GoalRunStoreError> {
        Ok(self
            .records
            .read()
            .map_err(|_| GoalRunStoreError::Unavailable)?
            .get(&run_id)
            .cloned())
    }
}

pub(crate) async fn create_goal_run(
    State(state): State<ControlState>,
    Json(request): Json<CreateGoalRunRequest>,
) -> Result<(StatusCode, Json<GoalRunRecord>), ApiError> {
    let spec = validate_request(request)?;
    let run_id = state.goal_runs.reserve(&spec).map_err(store_error)?;
    state.goal_runs.mark_running(run_id).map_err(store_error)?;

    match run_goal(spec) {
        Ok(report) => {
            let record = state
                .goal_runs
                .finish(run_id, report)
                .map_err(store_error)?;
            Ok((StatusCode::CREATED, Json(record)))
        }
        Err(error) => {
            let (terminal, status, code) = match error {
                GoalRunError::InvalidSpec(_) => (
                    GoalRunState::Blocked,
                    StatusCode::UNPROCESSABLE_ENTITY,
                    "goal_run_blocked",
                ),
                GoalRunError::Catalog(_) | GoalRunError::Loop(_) | GoalRunError::Invariant(_) => (
                    GoalRunState::Failed,
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "goal_run_failed",
                ),
            };
            state
                .goal_runs
                .fail(run_id, terminal)
                .map_err(store_error)?;
            Err(run_error(status, code, run_id, terminal))
        }
    }
}

pub(crate) async fn get_goal_run(
    State(state): State<ControlState>,
    Path(run_id): Path<Uuid>,
) -> Result<Json<GoalRunRecord>, ApiError> {
    state
        .goal_runs
        .get(run_id)
        .map_err(store_error)?
        .map(Json)
        .ok_or_else(|| api_error(StatusCode::NOT_FOUND, "goal_run_not_found"))
}

fn validate_request(request: CreateGoalRunRequest) -> Result<GoalSpec, ApiError> {
    let normalized = request.goal.trim();
    if normalized.len() > MAX_API_GOAL_BYTES {
        return Err(api_error(
            StatusCode::UNPROCESSABLE_ENTITY,
            "goal_too_large",
        ));
    }
    if !(1..=MAX_GOAL_STEPS).contains(&request.max_steps) {
        return Err(api_error(
            StatusCode::UNPROCESSABLE_ENTITY,
            "invalid_step_budget",
        ));
    }

    let spec = GoalSpec::new(normalized).with_max_steps(request.max_steps);
    spec.validate()
        .map_err(|_| api_error(StatusCode::UNPROCESSABLE_ENTITY, "invalid_goal"))?;
    Ok(spec)
}

fn store_error(error: GoalRunStoreError) -> ApiError {
    match error {
        GoalRunStoreError::AtCapacity => {
            api_error(StatusCode::TOO_MANY_REQUESTS, "goal_run_capacity_reached")
        }
        GoalRunStoreError::NotFound | GoalRunStoreError::InvalidTransition => api_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "goal_run_store_invariant",
        ),
        GoalRunStoreError::Unavailable => api_error(
            StatusCode::INTERNAL_SERVER_ERROR,
            "goal_run_store_unavailable",
        ),
    }
}

fn api_error(status: StatusCode, code: &'static str) -> ApiError {
    (status, Json(serde_json::json!({ "error": code })))
}

fn run_error(
    status: StatusCode,
    code: &'static str,
    run_id: Uuid,
    terminal: GoalRunState,
) -> ApiError {
    (
        status,
        Json(serde_json::json!({
            "error": code,
            "runId": run_id,
            "status": terminal,
        })),
    )
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use axum::body::Body;
    use axum::http::{header, Request};
    use serde_json::json;
    use sirinx_store::MemoryStore;
    use tower::ServiceExt;

    use super::*;
    use crate::{default_self_card, router};

    const TOKEN: &str = "goal-run-test-token";
    const SENTINEL: &str = "SENTINEL_PRIVATE_GOAL_AND_TOOL_OUTPUT";

    fn app_with_token(token: Option<&str>) -> axum::Router {
        router(ControlState::new(
            Arc::new(MemoryStore::default()),
            token.map(str::to_owned),
            default_self_card(),
        ))
    }

    fn goal_request(body: Value, token: Option<&str>) -> Request<Body> {
        let mut builder = Request::builder()
            .method("POST")
            .uri("/api/goal-runs")
            .header(header::CONTENT_TYPE, "application/json");
        if let Some(token) = token {
            builder = builder.header(header::AUTHORIZATION, format!("Bearer {token}"));
        }
        builder.body(Body::from(body.to_string())).unwrap()
    }

    fn authorized_get(uri: &str) -> Request<Body> {
        Request::get(uri)
            .header(header::AUTHORIZATION, format!("Bearer {TOKEN}"))
            .body(Body::empty())
            .unwrap()
    }

    async fn response_json(response: axum::response::Response) -> Value {
        let bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        serde_json::from_slice(&bytes).unwrap()
    }

    async fn response_text(response: axum::response::Response) -> String {
        let bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        String::from_utf8(bytes.to_vec()).unwrap()
    }

    #[tokio::test]
    async fn goal_routes_fail_closed_when_control_token_is_not_configured() {
        let app = app_with_token(None);
        let post = app
            .clone()
            .oneshot(goal_request(json!({ "goal": "inspect" }), None))
            .await
            .unwrap();
        assert_eq!(post.status(), StatusCode::SERVICE_UNAVAILABLE);

        let get = app
            .oneshot(
                Request::get(format!("/api/goal-runs/{}", Uuid::new_v4()))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(get.status(), StatusCode::SERVICE_UNAVAILABLE);
    }

    #[tokio::test]
    async fn goal_routes_reject_missing_and_wrong_bearer_tokens() {
        let app = app_with_token(Some(TOKEN));
        let missing = app
            .clone()
            .oneshot(goal_request(json!({ "goal": "inspect" }), None))
            .await
            .unwrap();
        assert_eq!(missing.status(), StatusCode::UNAUTHORIZED);

        let wrong = app
            .oneshot(goal_request(
                json!({ "goal": "inspect" }),
                Some("wrong-token"),
            ))
            .await
            .unwrap();
        assert_eq!(wrong.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn goal_run_records_truth_lifecycle_and_explicit_zero_effects() {
        let app = app_with_token(Some(TOKEN));
        let created = app
            .clone()
            .oneshot(goal_request(
                json!({ "goal": SENTINEL, "maxSteps": 8 }),
                Some(TOKEN),
            ))
            .await
            .unwrap();
        assert_eq!(created.status(), StatusCode::CREATED);
        let created_text = response_text(created).await;
        assert!(!created_text.contains(SENTINEL));
        let body: Value = serde_json::from_str(&created_text).unwrap();

        assert_eq!(body["status"], "passed");
        assert_eq!(body["lifecycle"], json!(["planned", "running", "passed"]));
        assert_eq!(body["truth"]["scope"], "process_local");
        assert_eq!(body["truth"]["durable"], false);
        assert_eq!(body["truth"]["survivesRestart"], false);
        assert_eq!(
            body["truth"]["executionProfile"],
            "local_no_provider_no_effects"
        );
        assert_eq!(body["evidence"]["toolInvocations"], 1);
        for field in [
            "retryAttempts",
            "providerCalls",
            "networkCalls",
            "subprocessesStarted",
            "filesystemReads",
            "filesystemWrites",
            "externalEffects",
            "externalWrites",
        ] {
            assert_eq!(body["evidence"][field], 0, "{field} must be zero");
        }

        let run_id = body["runId"].as_str().unwrap();
        let fetched = app
            .oneshot(authorized_get(&format!("/api/goal-runs/{run_id}")))
            .await
            .unwrap();
        assert_eq!(fetched.status(), StatusCode::OK);
        let fetched_text = response_text(fetched).await;
        assert!(!fetched_text.contains(SENTINEL));
        assert_eq!(
            serde_json::from_str::<Value>(&fetched_text).unwrap()["runId"],
            run_id
        );
    }

    #[tokio::test]
    async fn goal_run_rejects_invalid_bounds_without_echoing_input() {
        let app = app_with_token(Some(TOKEN));
        let oversized_goal = format!("{SENTINEL}{}", "x".repeat(MAX_API_GOAL_BYTES));
        let oversized = app
            .clone()
            .oneshot(goal_request(json!({ "goal": oversized_goal }), Some(TOKEN)))
            .await
            .unwrap();
        assert_eq!(oversized.status(), StatusCode::UNPROCESSABLE_ENTITY);
        assert!(!response_text(oversized).await.contains(SENTINEL));

        for max_steps in [0, MAX_GOAL_STEPS + 1] {
            let invalid = app
                .clone()
                .oneshot(goal_request(
                    json!({ "goal": "inspect", "maxSteps": max_steps }),
                    Some(TOKEN),
                ))
                .await
                .unwrap();
            assert_eq!(invalid.status(), StatusCode::UNPROCESSABLE_ENTITY);
        }
    }

    #[tokio::test]
    async fn goal_run_rejects_unknown_fields() {
        let response = app_with_token(Some(TOKEN))
            .oneshot(goal_request(
                json!({ "goal": "inspect", "provider": "forbidden" }),
                Some(TOKEN),
            ))
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::UNPROCESSABLE_ENTITY);
    }

    #[tokio::test]
    async fn goal_run_request_body_is_limited_to_eight_kibibytes() {
        let response = app_with_token(Some(TOKEN))
            .oneshot(goal_request(
                json!({ "goal": "x".repeat(MAX_GOAL_RUN_REQUEST_BYTES) }),
                Some(TOKEN),
            ))
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::PAYLOAD_TOO_LARGE);
    }

    #[tokio::test]
    async fn unknown_goal_run_is_not_found() {
        let response = app_with_token(Some(TOKEN))
            .oneshot(authorized_get(&format!(
                "/api/goal-runs/{}",
                Uuid::new_v4()
            )))
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::NOT_FOUND);
        assert_eq!(response_json(response).await["error"], "goal_run_not_found");
    }

    #[tokio::test]
    async fn malformed_or_missing_goal_run_identifier_is_rejected() {
        let app = app_with_token(Some(TOKEN));
        let malformed = app
            .clone()
            .oneshot(authorized_get("/api/goal-runs/not-a-uuid"))
            .await
            .unwrap();
        assert_eq!(malformed.status(), StatusCode::BAD_REQUEST);

        let missing = app
            .oneshot(authorized_get("/api/goal-runs/"))
            .await
            .unwrap();
        assert_eq!(missing.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn poisoned_goal_run_store_fails_closed_without_panicking() {
        let state = ControlState::new(
            Arc::new(MemoryStore::default()),
            Some(TOKEN.to_owned()),
            default_self_card(),
        );
        let records = state.goal_runs.records.clone();
        assert!(std::thread::spawn(move || {
            let _guard = records.write().unwrap();
            panic!("inject goal-run lock poison");
        })
        .join()
        .is_err());

        let response = router(state)
            .oneshot(authorized_get(&format!(
                "/api/goal-runs/{}",
                Uuid::new_v4()
            )))
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::INTERNAL_SERVER_ERROR);
        assert_eq!(
            response_json(response).await["error"],
            "goal_run_store_unavailable"
        );
    }

    #[tokio::test]
    async fn goal_run_store_rejects_capacity_without_evicting_existing_records() {
        let app = app_with_token(Some(TOKEN));
        let mut first_run_id = None;

        for index in 0..MAX_STORED_GOAL_RUNS {
            let response = app
                .clone()
                .oneshot(goal_request(
                    json!({ "goal": format!("inspect run {index}") }),
                    Some(TOKEN),
                ))
                .await
                .unwrap();
            assert_eq!(response.status(), StatusCode::CREATED);
            if first_run_id.is_none() {
                first_run_id = Some(response_json(response).await["runId"].clone());
            }
        }

        let rejected = app
            .clone()
            .oneshot(goal_request(
                json!({ "goal": "one run beyond capacity" }),
                Some(TOKEN),
            ))
            .await
            .unwrap();
        assert_eq!(rejected.status(), StatusCode::TOO_MANY_REQUESTS);

        let first_run_id = first_run_id.unwrap();
        let retained = app
            .oneshot(authorized_get(&format!(
                "/api/goal-runs/{}",
                first_run_id.as_str().unwrap()
            )))
            .await
            .unwrap();
        assert_eq!(retained.status(), StatusCode::OK);
    }
}

//! End-to-end tests for the sirinx-web router, driven through the
//! service directly (no network) via `tower::ServiceExt::oneshot`.

use axum::body::Body;
use axum::http::{header, Request, StatusCode};
use tower::ServiceExt;

use sirinx_web::{router, AppState};

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

fn lead_payload() -> serde_json::Value {
    serde_json::json!({
        "businessType": "retail_store",
        "monthlyElectricBill": 45000,
        "availableAreaSqm": 300,
        "interest": ["solar_carport", "bess", "ev_charging"],
        "source": "thaimart_sirinx_landing",
        "consent": { "analytics": true, "marketingContact": false }
    })
}

#[tokio::test]
async fn health_and_pages_are_served() {
    let app = router(AppState::default());

    let health = app
        .clone()
        .oneshot(Request::get("/health").body(Body::empty()).unwrap())
        .await
        .unwrap();
    assert_eq!(health.status(), StatusCode::OK);

    for uri in ["/", "/thaimart-sirinx"] {
        let page = app
            .clone()
            .oneshot(Request::get(uri).body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(page.status(), StatusCode::OK, "page {uri} must render");
    }
}

#[tokio::test]
async fn thaimart_page_keeps_brand_safe_guards() {
    let app = router(AppState::default());
    let page = app
        .oneshot(Request::get("/thaimart-sirinx").body(Body::empty()).unwrap())
        .await
        .unwrap();
    let bytes = axum::body::to_bytes(page.into_body(), usize::MAX).await.unwrap();
    let html = String::from_utf8(bytes.to_vec()).unwrap();

    // Exactly one H1 (validation gate from the taste spec).
    assert_eq!(html.matches("<h1").count(), 1, "landing page must have exactly one H1");
    // Brand-safe copy retained; no formal partner claim.
    assert!(html.contains("SIRINX on Thaimart Marketplace"));
    assert!(!html.to_lowercase().contains("official partner"));
}

#[tokio::test]
async fn roi_endpoint_matches_calculator() {
    let app = router(AppState::default());
    let response = app
        .oneshot(json_request(
            "POST",
            "/api/roi",
            serde_json::json!({
                "monthlyBillThb": 45000.0,
                "availableAreaSqm": 300.0,
                "usage": "medium_daytime"
            }),
        ))
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    let body = body_json(response).await;
    assert_eq!(body["estimate"]["estimatedKw"], 50.0);
    assert_eq!(body["estimate"]["savingLowThb"], 7812.0);
    assert_eq!(body["estimate"]["savingHighThb"], 13392.0);
}

#[tokio::test]
async fn lead_lifecycle_create_patch_delete() {
    let state = AppState::default();
    let app = router(state.clone());

    // Create.
    let created = app
        .clone()
        .oneshot(json_request("POST", "/api/leads", lead_payload()))
        .await
        .unwrap();
    assert_eq!(created.status(), StatusCode::CREATED);
    let lead = body_json(created).await;
    let id = lead["id"].as_str().unwrap().to_owned();
    assert_eq!(lead["status"], "new");
    assert_eq!(state.lead_count().await, 1);

    // Legal transition new -> contacted.
    let patched = app
        .clone()
        .oneshot(json_request(
            "PATCH",
            &format!("/api/leads/{id}/status"),
            serde_json::json!({ "status": "contacted" }),
        ))
        .await
        .unwrap();
    assert_eq!(patched.status(), StatusCode::OK);

    // Illegal skip contacted -> proposal_sent is a conflict.
    let conflict = app
        .clone()
        .oneshot(json_request(
            "PATCH",
            &format!("/api/leads/{id}/status"),
            serde_json::json!({ "status": "proposal_sent" }),
        ))
        .await
        .unwrap();
    assert_eq!(conflict.status(), StatusCode::CONFLICT);

    // Delete.
    let deleted = app
        .clone()
        .oneshot(
            Request::delete(format!("/api/leads/{id}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(deleted.status(), StatusCode::NO_CONTENT);
    assert_eq!(state.lead_count().await, 0);
}

#[tokio::test]
async fn invalid_lead_is_rejected() {
    let app = router(AppState::default());
    let mut payload = lead_payload();
    payload["monthlyElectricBill"] = serde_json::json!(0);
    let response = app
        .oneshot(json_request("POST", "/api/leads", payload))
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::UNPROCESSABLE_ENTITY);
}

#[tokio::test]
async fn analytics_respects_consent_and_allowlist() {
    let state = AppState::default();
    let app = router(state.clone());

    // Consent granted + allowlisted event → stored.
    let ok = app
        .clone()
        .oneshot(json_request(
            "POST",
            "/api/events",
            serde_json::json!({
                "event": "roi_calculator_submit",
                "payload": { "estimatedKw": 50.0 },
                "page": "thaimart_sirinx_landing",
                "consent": { "analytics": true, "marketingContact": false }
            }),
        ))
        .await
        .unwrap();
    assert_eq!(ok.status(), StatusCode::ACCEPTED);
    assert_eq!(state.accepted_event_count().await, 1);

    // No consent → acknowledged, not stored.
    let no_consent = app
        .clone()
        .oneshot(json_request(
            "POST",
            "/api/events",
            serde_json::json!({
                "event": "roi_calculator_submit",
                "payload": {},
                "page": "thaimart_sirinx_landing",
                "consent": { "analytics": false, "marketingContact": false }
            }),
        ))
        .await
        .unwrap();
    assert_eq!(no_consent.status(), StatusCode::OK);
    assert_eq!(state.accepted_event_count().await, 1);
}

use std::sync::Arc;

use sirinx_control::{router, ControlState};
use sirinx_store::{MemoryStore, PostgresStore, Store};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "sirinx_control=info,axum=info,sqlx=warn".into()),
        )
        .init();

    // Shared queue backend: Postgres when DATABASE_URL is set, so every
    // node sees the same pending-work; otherwise process-local memory.
    let store: Arc<dyn Store> = match std::env::var("DATABASE_URL") {
        Ok(url) if !url.trim().is_empty() => {
            let store = PostgresStore::connect(&url)
                .await
                .expect("failed to connect to Postgres / run migrations");
            tracing::info!("control queue backend: postgres (shared across nodes)");
            Arc::new(store)
        }
        _ => {
            tracing::warn!("DATABASE_URL not set — control queue is process-local");
            Arc::new(MemoryStore::default())
        }
    };

    // Bearer token for /api/*; /health and /metrics stay open.
    let token = std::env::var("CONTROL_API_TOKEN")
        .ok()
        .filter(|t| !t.trim().is_empty());
    if token.is_none() {
        tracing::warn!("CONTROL_API_TOKEN not set — /api/* is unauthenticated (local dev only)");
    }

    // 8711 matches the Hermes dev-control-api port so dashboards keep working.
    let port: u16 = std::env::var("CONTROL_PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8711);
    let addr = std::net::SocketAddr::from(([127, 0, 0, 1], port));

    let app = router(ControlState::new(store, token));
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("failed to bind control port");
    tracing::info!(%addr, "sirinx-control listening (all gates on hold)");
    axum::serve(listener, app)
        .with_graceful_shutdown(async {
            let _ = tokio::signal::ctrl_c().await;
        })
        .await
        .expect("server error");
}

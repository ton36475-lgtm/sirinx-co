use std::sync::Arc;

use sirinx_store::{MemoryStore, PostgresStore};
use sirinx_web::{router, AppState};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "sirinx_web=info,axum=info,sqlx=warn".into()),
        )
        .init();

    // DATABASE_URL (Supabase/Postgres connection string) selects the
    // persistent backend; without it the service runs in-memory.
    let state = match std::env::var("DATABASE_URL") {
        Ok(url) if !url.trim().is_empty() => {
            let store = PostgresStore::connect(&url)
                .await
                .expect("failed to connect to pre-migrated Postgres");
            tracing::info!("storage backend: postgres (connect only; no startup migration)");
            AppState::new(Arc::new(store))
        }
        _ => {
            tracing::warn!("DATABASE_URL not set — using in-memory store (data is not persisted)");
            AppState::new(Arc::new(MemoryStore::default()))
        }
    };

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8080);
    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], port));

    let app = router(state);
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("failed to bind port");
    tracing::info!(%addr, "sirinx-web listening");
    axum::serve(listener, app)
        .with_graceful_shutdown(async {
            let _ = tokio::signal::ctrl_c().await;
        })
        .await
        .expect("server error");
}

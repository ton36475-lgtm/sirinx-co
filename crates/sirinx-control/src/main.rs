use std::sync::Arc;

use sirinx_control::{router, self_card_from_env, ControlState, GatePersistence};
use sirinx_store::{MemoryStore, PostgresStore, Store};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "sirinx_control=info,axum=info,sqlx=warn".into()),
        )
        .init();

    // Shared control backend: Postgres when DATABASE_URL is set, so every
    // node sees the same pending work and gates; otherwise process-local memory.
    let (store, gate_persistence): (Arc<dyn Store>, GatePersistence) =
        match std::env::var("DATABASE_URL") {
            Ok(url) if !url.trim().is_empty() => {
                let store = PostgresStore::connect(&url)
                    .await
                    .expect("failed to connect to pre-migrated Postgres");
                tracing::info!("control backend: postgres (shared queue and durable gates)");
                (Arc::new(store), GatePersistence::Postgres)
            }
            _ => {
                tracing::warn!(
                    "DATABASE_URL not set — control queue and gate decisions are process-local"
                );
                (Arc::new(MemoryStore::default()), GatePersistence::Memory)
            }
        };

    // Bearer token for /api/*; /health and /metrics stay open.
    let token = std::env::var("CONTROL_API_TOKEN")
        .ok()
        .filter(|t| !t.trim().is_empty());
    if token.is_none() {
        tracing::warn!("CONTROL_API_TOKEN not set — /api/* is unauthenticated (local dev only)");
    }

    // Rust remains the durable gate authority on 8711. The imported Node
    // long-tail API uses 8790, avoiding authority/runtime port ambiguity.
    let port: u16 = std::env::var("CONTROL_PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8711);
    let addr = std::net::SocketAddr::from(([127, 0, 0, 1], port));

    // A2A identity: node id/endpoint from env, capabilities from the
    // installed skill set (SKILLS_DIR, default .claude/skills).
    let skills_dir = std::env::var("SKILLS_DIR").unwrap_or_else(|_| ".claude/skills".into());
    let card = self_card_from_env(std::path::Path::new(&skills_dir));
    tracing::info!(
        node = %card.id,
        capabilities = card.capabilities.len(),
        "a2a card ready"
    );

    let state = ControlState::load_with_persistence(store, token, card, gate_persistence)
        .await
        .expect("failed to load persisted control gates");
    let app = router(state);
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("failed to bind control port");
    tracing::info!(%addr, "sirinx-control listening (gate state loaded)");
    axum::serve(listener, app)
        .with_graceful_shutdown(async {
            let _ = tokio::signal::ctrl_c().await;
        })
        .await
        .expect("server error");
}

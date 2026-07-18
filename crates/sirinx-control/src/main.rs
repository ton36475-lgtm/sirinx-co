use sirinx_control::{router, ControlState};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "sirinx_control=info,axum=info".into()),
        )
        .init();

    // 8711 matches the Hermes dev-control-api port so dashboards keep working.
    let port: u16 = std::env::var("CONTROL_PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8711);
    let addr = std::net::SocketAddr::from(([127, 0, 0, 1], port));

    let app = router(ControlState::with_default_gates());
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

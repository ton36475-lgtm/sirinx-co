use std::sync::Arc;

use sirinx_control::{router, self_card_from_env, ControlState};
use sirinx_store::{MemoryStore, PostgresStore, Store};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "sirinx_control=info,axum=info,sqlx=warn".into()),
        )
        .init();

    // Resolve and validate the exposure contract before connecting to shared
    // storage (which applies embedded migrations). Local development keeps the
    // permissive, loopback-only defaults; a container deployment must supply
    // every production dependency explicitly.
    let database_url = std::env::var("DATABASE_URL")
        .ok()
        .filter(|url| !url.trim().is_empty());
    let database_configured = database_url.is_some();
    let token = std::env::var("CONTROL_API_TOKEN")
        .ok()
        .filter(|t| !t.trim().is_empty());
    let port: u16 = std::env::var("CONTROL_PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8711);
    // Local development remains loopback-only. Container operators must opt
    // in to an all-interfaces bind on an isolated network and keep bearer
    // authentication enabled; see DEPLOY_RUST.md.
    let bind_addr = std::env::var("CONTROL_BIND_ADDR").unwrap_or_else(|_| "127.0.0.1".into());
    let addr = control_socket_addr(&bind_addr, port)
        .expect("CONTROL_BIND_ADDR must be a valid IP address");
    let a2a_endpoint = std::env::var("A2A_ENDPOINT")
        .ok()
        .filter(|endpoint| !endpoint.trim().is_empty());
    validate_control_exposure(
        addr,
        database_configured,
        token.is_some(),
        a2a_endpoint.as_deref(),
    )
    .expect(
        "non-loopback control requires DATABASE_URL, CONTROL_API_TOKEN, and a peer-reachable A2A_ENDPOINT",
    );

    // Shared control backend: Postgres when DATABASE_URL is set, so every
    // node sees the same pending work and gates; otherwise process-local memory.
    let store: Arc<dyn Store> = match database_url {
        Some(url) => {
            let store = PostgresStore::connect(&url)
                .await
                .expect("failed to connect to Postgres / run migrations");
            tracing::info!("control backend: postgres (shared queue and durable gates)");
            Arc::new(store)
        }
        _ => {
            tracing::warn!(
                "DATABASE_URL not set — control queue and gate decisions are process-local"
            );
            Arc::new(MemoryStore::default())
        }
    };

    // Bearer token for /api/*; /health and /metrics stay open.
    if token.is_none() {
        tracing::warn!("CONTROL_API_TOKEN not set — /api/* is unauthenticated (local dev only)");
    }

    // A2A identity: node id/endpoint from env, capabilities from the
    // installed skill set (SKILLS_DIR, default .claude/skills).
    let skills_dir = std::env::var("SKILLS_DIR").unwrap_or_else(|_| ".claude/skills".into());
    let card = self_card_from_env(std::path::Path::new(&skills_dir));
    tracing::info!(
        node = %card.id,
        capabilities = card.capabilities.len(),
        "a2a card ready"
    );

    let state = ControlState::load(store, token, card)
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

fn control_socket_addr(
    bind_addr: &str,
    port: u16,
) -> Result<std::net::SocketAddr, std::net::AddrParseError> {
    Ok(std::net::SocketAddr::new(bind_addr.parse()?, port))
}

fn validate_control_exposure(
    addr: std::net::SocketAddr,
    database_configured: bool,
    token_configured: bool,
    a2a_endpoint: Option<&str>,
) -> Result<(), &'static str> {
    if addr.ip().is_loopback() {
        return Ok(());
    }
    if !database_configured || !token_configured {
        return Err("non-loopback control requires durable storage and bearer authentication");
    }
    if !a2a_endpoint.is_some_and(peer_reachable_a2a_endpoint) {
        return Err("non-loopback control requires a peer-reachable A2A endpoint");
    }
    Ok(())
}

fn peer_reachable_a2a_endpoint(endpoint: &str) -> bool {
    let Some(rest) = endpoint
        .strip_prefix("https://")
        .or_else(|| endpoint.strip_prefix("http://"))
    else {
        return false;
    };
    let authority = rest
        .split(['/', '?', '#'])
        .next()
        .unwrap_or_default()
        .trim();
    if authority.is_empty() || authority.contains('@') {
        return false;
    }

    let (host, bracketed) = if let Some(bracketed) = authority.strip_prefix('[') {
        let Some((host, suffix)) = bracketed.split_once(']') else {
            return false;
        };
        if host.parse::<std::net::Ipv6Addr>().is_err()
            || (!suffix.is_empty()
                && (!suffix.starts_with(':')
                    || suffix[1..].parse::<u16>().map_or(true, |port| port == 0)))
        {
            return false;
        }
        (host, true)
    } else if let Some((host, port)) = authority.rsplit_once(':') {
        if host.contains(':') || port.parse::<u16>().map_or(true, |port| port == 0) {
            return false;
        }
        (host, false)
    } else {
        (authority, false)
    };

    let host = host.trim_end_matches('.');
    if host.is_empty()
        || host.eq_ignore_ascii_case("localhost")
        || host.to_ascii_lowercase().ends_with(".localhost")
    {
        return false;
    }
    match host.parse::<std::net::IpAddr>() {
        Ok(ip) => peer_reachable_ip(ip),
        Err(_) => !bracketed && valid_dns_name(host),
    }
}

fn peer_reachable_ip(ip: std::net::IpAddr) -> bool {
    if ip.is_loopback() || ip.is_unspecified() {
        return false;
    }
    match ip {
        std::net::IpAddr::V4(_) => true,
        std::net::IpAddr::V6(ipv6) => ipv6
            .to_ipv4_mapped()
            .is_none_or(|ipv4| !ipv4.is_loopback() && !ipv4.is_unspecified()),
    }
}

fn valid_dns_name(host: &str) -> bool {
    host.len() <= 253
        && host.split('.').all(|label| {
            !label.is_empty()
                && label.len() <= 63
                && label
                    .bytes()
                    .all(|c| c.is_ascii_alphanumeric() || c == b'-')
                && label
                    .as_bytes()
                    .first()
                    .is_some_and(u8::is_ascii_alphanumeric)
                && label
                    .as_bytes()
                    .last()
                    .is_some_and(u8::is_ascii_alphanumeric)
        })
}

#[cfg(test)]
mod tests {
    use super::{control_socket_addr, peer_reachable_a2a_endpoint, validate_control_exposure};

    #[test]
    fn control_bind_stays_loopback_by_default() {
        let addr = control_socket_addr("127.0.0.1", 8711).unwrap();
        assert!(addr.ip().is_loopback());
        assert_eq!(addr.port(), 8711);
    }

    #[test]
    fn container_bind_can_be_selected_explicitly() {
        let addr = control_socket_addr("0.0.0.0", 8711).unwrap();
        assert!(addr.ip().is_unspecified());
        assert_eq!(addr.port(), 8711);
    }

    #[test]
    fn loopback_allows_local_safe_defaults() {
        let addr = control_socket_addr("127.0.0.1", 8711).unwrap();
        assert!(validate_control_exposure(addr, false, false, None).is_ok());
    }

    #[test]
    fn non_loopback_requires_database_and_token() {
        let addr = control_socket_addr("0.0.0.0", 8711).unwrap();
        let endpoint = Some("https://dev.sirinx.co");
        assert!(validate_control_exposure(addr, false, true, endpoint).is_err());
        assert!(validate_control_exposure(addr, true, false, endpoint).is_err());
        assert!(validate_control_exposure(addr, true, true, endpoint).is_ok());
    }

    #[test]
    fn non_loopback_requires_peer_reachable_a2a_endpoint() {
        let addr = control_socket_addr("0.0.0.0", 8711).unwrap();
        for endpoint in [
            None,
            Some(""),
            Some("127.0.0.1:8711"),
            Some("http://127.0.0.1:8711"),
            Some("http://localhost:8711"),
            Some("http://[::1]:8711"),
            Some("http://0.0.0.0:8711"),
        ] {
            assert!(validate_control_exposure(addr, true, true, endpoint).is_err());
        }
        assert!(
            validate_control_exposure(addr, true, true, Some("http://sirinx-control:8711")).is_ok()
        );
    }

    #[test]
    fn a2a_endpoint_validation_accepts_routable_http_urls_only() {
        assert!(peer_reachable_a2a_endpoint("https://dev.sirinx.co/api"));
        assert!(peer_reachable_a2a_endpoint("http://10.0.0.8:8711"));
        assert!(!peer_reachable_a2a_endpoint("file:///tmp/control"));
        assert!(!peer_reachable_a2a_endpoint("https://user@example.com"));
        assert!(!peer_reachable_a2a_endpoint(
            "https://example.com:not-a-port"
        ));
        assert!(!peer_reachable_a2a_endpoint("https://[example.com]"));
        assert!(!peer_reachable_a2a_endpoint("http://10.0.0.8:0"));
        assert!(!peer_reachable_a2a_endpoint(
            "http://[::ffff:127.0.0.1]:8711"
        ));
    }
}

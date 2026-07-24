use std::path::PathBuf;
use std::process::Command;

use serde::{Deserialize, Serialize};

use crate::tool::{Tool, ToolError};

/// Read-only bridge from the Rust autoloop to the Node.js Codex status CLI.
///
/// Spawns `node <script> status` as a subprocess and returns structured JSON.
/// The exposed contract has no handshake, planning, activation, sync, provider,
/// messaging, MCP, or agent-start operation.
pub struct CodexBridge {
    script_path: PathBuf,
    node_binary: String,
}

impl CodexBridge {
    /// Path defaults to `services/dev-control-api/src/codex-autoloop.mjs`
    /// relative to the directory that contains `Cargo.toml` (the workspace
    /// root for workspace crates, or the crate root for standalone builds).
    ///
    /// Falls back to an absolute path resolved from
    /// `CARGO_MANIFEST_DIR`/../../services/dev-control-api/src/codex-autoloop.mjs
    /// when compiled inside the workspace.
    pub fn new() -> Self {
        let script = manifest_dir()
            .parent()
            .and_then(|p| p.parent())
            .map(|ws| ws.join("services/dev-control-api/src/codex-autoloop.mjs"))
            .unwrap_or_else(|| PathBuf::from("services/dev-control-api/src/codex-autoloop.mjs"));

        Self {
            script_path: script,
            node_binary: "node".into(),
        }
    }

    /// Run the read-only status bridge.
    pub fn run(&self, mode: &str) -> Result<BridgeStatus, ToolError> {
        if !VALID_MODES.contains(&mode) {
            return Err(ToolError::BadArgs(
                "codex_bridge".into(),
                format!("unknown mode \"{mode}\"; expected one of {VALID_MODES:?}"),
            ));
        }

        let output = Command::new(&self.node_binary)
            .arg(&self.script_path)
            .arg(mode)
            .output()
            .map_err(|e| {
                ToolError::Failed(
                    "codex_bridge".into(),
                    format!("failed to spawn node subprocess: {e}"),
                )
            })?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(ToolError::Failed(
                "codex_bridge".into(),
                format!("node script exited {}: {stderr}", output.status),
            ));
        }

        let status: BridgeStatus = serde_json::from_slice(&output.stdout).map_err(|e| {
            ToolError::BadArgs(
                "codex_bridge".into(),
                format!("invalid JSON from codex-autoloop: {e}"),
            )
        })?;
        status.validate_read_only()?;
        Ok(status)
    }
}

impl Default for CodexBridge {
    fn default() -> Self {
        Self::new()
    }
}

// --- Tool trait impl -----------------------------------------------------

const VALID_MODES: &[&str] = &["status"];

impl Tool for CodexBridge {
    fn name(&self) -> &'static str {
        "codex_bridge"
    }

    fn description(&self) -> &'static str {
        "Queries read-only A2A + OmniRoute status via the Node.js Codex bridge"
    }

    /// The bridge is read-only and supports status only. Planning, handshake,
    /// activation, sync, Telegram, MCP, and agent-start operations are not
    /// exposed through this tool.
    fn is_side_effecting(&self) -> bool {
        false
    }

    fn execute(&self, args: &serde_json::Value) -> Result<serde_json::Value, ToolError> {
        let object = args.as_object().ok_or_else(|| {
            ToolError::BadArgs(
                self.name().into(),
                "arguments must be a closed JSON object".into(),
            )
        })?;
        if object.keys().any(|key| key != "mode") {
            return Err(ToolError::BadArgs(
                self.name().into(),
                "unknown argument; only optional string field `mode` is accepted".into(),
            ));
        }
        let mode = match object.get("mode") {
            None => "status",
            Some(value) => value.as_str().ok_or_else(|| {
                ToolError::BadArgs(self.name().into(), "`mode` must be a string".into())
            })?,
        };

        if !VALID_MODES.contains(&mode) {
            return Err(ToolError::BadArgs(
                self.name().into(),
                format!("unknown mode \"{mode}\"; expected one of {VALID_MODES:?}"),
            ));
        }

        serde_json::to_value(self.run(mode)?).map_err(|e| {
            ToolError::Failed(
                self.name().into(),
                format!("failed to serialize validated bridge status: {e}"),
            )
        })
    }
}

// --- Helpers -------------------------------------------------------------

fn manifest_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
}

// --- JSON output types (for documentation / potential pattern matching) ---

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BridgeStatus {
    pub status: String,
    pub mode: String,
    pub runtime_status: RuntimeStatus,
    pub a2a: A2aSummary,
    pub omniroute: OmniRouteSummary,
    pub external_writes: bool,
    pub provider_called: bool,
    pub telegram_sent: bool,
    pub command_executed: bool,
    pub stop_point: String,
}

impl BridgeStatus {
    fn validate_read_only(&self) -> Result<(), ToolError> {
        let safe = self.status == "ok"
            && self.mode == "read-only-status"
            && !self.external_writes
            && !self.provider_called
            && !self.telegram_sent
            && !self.command_executed
            && !self.a2a.live_telegram
            && !self.a2a.can_send_telegram
            && !self.a2a.can_run_mcp
            && !self.a2a.can_start_agents
            && self.stop_point
                == "CODEX BRIDGE STATUS ONLY - NO HANDSHAKE, ACTIVATION, SYNC, OR PROVIDER ACTION";

        if !safe {
            return Err(ToolError::BadArgs(
                "codex_bridge".into(),
                "bridge output violated the read-only status invariant".into(),
            ));
        }

        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RuntimeStatus {
    pub a2a: String,
    pub omniroute: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct A2aSummary {
    pub mode: String,
    pub agents: u32,
    pub live_telegram: bool,
    pub can_send_telegram: bool,
    pub can_run_mcp: bool,
    pub can_start_agents: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct OmniRouteSummary {
    pub lanes: u32,
    pub routes: u32,
    #[serde(rename = "tmuxSessions")]
    pub tmux_sessions: u32,
    #[serde(rename = "observedSurfaces")]
    pub observed_surfaces: u32,
    #[serde(rename = "observedLanes")]
    pub observed_lanes: u32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn codex_bridge_name_and_description() {
        let bridge = CodexBridge::new();
        assert_eq!(bridge.name(), "codex_bridge");
        assert!(!bridge.description().is_empty());
    }

    #[test]
    fn codex_bridge_is_not_side_effecting() {
        let bridge = CodexBridge::new();
        assert!(!bridge.is_side_effecting());
    }

    #[test]
    fn codex_bridge_rejects_unknown_mode() {
        let bridge = CodexBridge::new();
        let direct_err = bridge.run("destroy-all-humans").unwrap_err();
        assert!(matches!(direct_err, ToolError::BadArgs(_, _)));
        let err = bridge
            .execute(&serde_json::json!({ "mode": "destroy-all-humans" }))
            .unwrap_err();
        assert!(matches!(err, ToolError::BadArgs(_, _)));
        assert!(err.to_string().contains("destroy-all-humans"));
    }

    #[test]
    fn codex_bridge_status_mode_returns_json() {
        let bridge = CodexBridge::new();
        let result = bridge
            .execute(&serde_json::json!({ "mode": "status" }))
            .unwrap();
        assert!(result.get("status").is_some());
        assert!(result.get("a2a").is_some());
        assert!(result.get("omniroute").is_some());
    }

    #[test]
    fn codex_bridge_default_mode_is_status() {
        let bridge = CodexBridge::new();
        let result = bridge.execute(&serde_json::json!({})).unwrap();
        assert!(result.get("status").is_some());
    }

    #[test]
    fn codex_bridge_rejects_non_status_modes() {
        let bridge = CodexBridge::new();
        for mode in ["handshake", "activate", "sync", "full"] {
            let err = bridge
                .execute(&serde_json::json!({ "mode": mode }))
                .unwrap_err();
            assert!(matches!(err, ToolError::BadArgs(_, _)));
        }
    }

    #[test]
    fn codex_bridge_rejects_non_string_and_unknown_arguments() {
        let bridge = CodexBridge::new();
        for args in [
            serde_json::json!({ "mode": 7 }),
            serde_json::json!({ "mode": "status", "activate": true }),
            serde_json::json!([]),
        ] {
            let err = bridge.execute(&args).unwrap_err();
            assert!(matches!(err, ToolError::BadArgs(_, _)));
        }
    }

    #[test]
    fn codex_bridge_serializes_to_typed_structs() {
        let bridge = CodexBridge::new();
        let parsed = bridge.run("status").unwrap();
        assert_eq!(parsed.status, "ok");
        assert_eq!(parsed.mode, "read-only-status");
        assert!(!parsed.external_writes);
        assert!(!parsed.a2a.can_run_mcp);
        assert!(parsed.a2a.agents >= 10);
        assert!(parsed.omniroute.lanes >= 8);
    }
}

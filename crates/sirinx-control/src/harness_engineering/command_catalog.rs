//! Fixed test command catalog.
//!
//! Callers select an enum value. They cannot supply shell, argv, cwd, or
//! environment values.

use serde::{Deserialize, Serialize};
use serde_json::json;
use sha2::{Digest, Sha256};

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TestCommandId {
    RustAgentsRegistryTests,
    RustGoalUnitTests,
    RustGoalProfileTests,
    RustControlHarnessTests,
    GraphMemoryTests,
    NodeLocalRagDeprecationTests,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TestCommandSpec {
    pub executable: &'static str,
    pub argv: &'static [&'static str],
    pub cwd: &'static str,
    pub timeout_seconds: u64,
    pub network_denied_required: bool,
    pub provider_environment_scrub_required: bool,
}

pub const fn command_spec(id: TestCommandId) -> TestCommandSpec {
    match id {
        TestCommandId::RustAgentsRegistryTests => TestCommandSpec {
            executable: "cargo",
            argv: &[
                "test",
                "-p",
                "sirinx-agents",
                "engineering_registry",
                "--lib",
                "--locked",
                "--offline",
            ],
            cwd: ".",
            timeout_seconds: 300,
            network_denied_required: true,
            provider_environment_scrub_required: true,
        },
        TestCommandId::RustGoalUnitTests => TestCommandSpec {
            executable: "cargo",
            argv: &[
                "test",
                "-p",
                "sirinx-autoloop",
                "--lib",
                "--locked",
                "--offline",
            ],
            cwd: ".",
            timeout_seconds: 300,
            network_denied_required: true,
            provider_environment_scrub_required: true,
        },
        TestCommandId::RustGoalProfileTests => TestCommandSpec {
            executable: "cargo",
            argv: &[
                "test",
                "-p",
                "sirinx-autoloop",
                "--test",
                "goal_local_profile",
                "--locked",
                "--offline",
            ],
            cwd: ".",
            timeout_seconds: 300,
            network_denied_required: true,
            provider_environment_scrub_required: true,
        },
        TestCommandId::RustControlHarnessTests => TestCommandSpec {
            executable: "cargo",
            argv: &[
                "test",
                "-p",
                "sirinx-control",
                "harness_engineering",
                "--lib",
                "--locked",
                "--offline",
            ],
            cwd: ".",
            timeout_seconds: 300,
            network_denied_required: true,
            provider_environment_scrub_required: true,
        },
        TestCommandId::GraphMemoryTests => TestCommandSpec {
            executable: "uv",
            argv: &["run", "--offline", "pytest"],
            cwd: "tools/graph-memory",
            timeout_seconds: 300,
            network_denied_required: true,
            provider_environment_scrub_required: true,
        },
        TestCommandId::NodeLocalRagDeprecationTests => TestCommandSpec {
            executable: "./node_modules/.bin/vitest",
            argv: &["run", "services/dev-control-api/src/local-rag.test.mjs"],
            cwd: ".",
            timeout_seconds: 300,
            network_denied_required: true,
            provider_environment_scrub_required: true,
        },
    }
}

pub fn command_spec_digest(id: TestCommandId) -> String {
    let spec = command_spec(id);
    let encoded = serde_json::to_vec(&json!({
        "schema_version": "1.0.0",
        "command_id": id,
        "executable": spec.executable,
        "argv": spec.argv,
        "cwd": spec.cwd,
        "timeout_seconds": spec.timeout_seconds,
        "network_denied_required": spec.network_denied_required,
        "provider_environment_scrub_required": spec.provider_environment_scrub_required,
    }))
    .expect("fixed command specification serialization is infallible");
    format!("sha256:{:x}", Sha256::digest(encoded))
}

export const defaultCommandBrokerPolicy = {
    version: "ghostclaw-command-broker-contract-v1",
    allowedTools: [
        {
            tool: "codex-local",
            role: "local repo supervisor and default executor",
            allowedActions: [
                "inspect",
                "read_repository_files",
                "run_lint",
                "run_unit_tests",
                "generate_docs",
                "update_markdown",
                "create_test_files",
                "simulate_deploy_plan",
                "web_sirinx_build_validation",
                "web_sirinx_pages_deploy",
                "scoped_repo_edit",
                "clone_whitelisted_external_repo",
            ],
            leaseRequiredActions: ["web_sirinx_build_validation", "scoped_repo_edit"],
        },
        {
            tool: "kob",
            role: "planner, router, context compressor",
            allowedActions: ["plan", "route", "summarize", "compress_context"],
            blockedActions: ["repo_mutation", "provider_secret_dump"],
        },
        {
            tool: "opencode",
            role: "scoped coding executor",
            allowedActions: ["dry_run_command_plan", "scoped_repo_edit"],
            leaseRequiredActions: ["scoped_repo_edit"],
        },
        {
            tool: "agy-antigravity2",
            role: "scoped scaffold and refactor executor",
            allowedActions: [
                "dry_run_command_plan",
                "agy_scaffold",
                "scoped_repo_edit",
            ],
            leaseRequiredActions: ["agy_scaffold", "scoped_repo_edit"],
        },
        {
            tool: "manus",
            role: "artifact producer, metadata and hashes only",
            allowedActions: [
                "inspect",
                "artifact_hash_sync",
                "manus_artifact_review",
            ],
            blockedActions: ["direct_repo_mutation"],
        },
    ],
    hardDeniedActions: [
        "approve_all_actions",
        "autonomous_approve_all",
        "bypass_access_control",
        "bypass_command_policy",
        "bypass_rate_limits",
        "disable_logging",
        "disable_monitoring",
        "disable_policy",
        "disable_security_controls",
        "exfiltrate_credentials",
        "hide_execution_history",
        "modify_audit_trail",
        "print_secret",
        "read_private_key",
        "unlock_all_commands",
        "unlock_all_security",
    ],
    scopedWritePaths: [
        "docs/",
        "apps/mission-control/src/fixtures/",
        "packages/command-broker/src/",
    ],
};
const validationActions = new Set(["run_lint", "run_unit_tests"]);
const scopedWriteActions = new Set([
    "generate_docs",
    "update_markdown",
    "create_test_files",
]);
const localMutationActions = new Set([
    "web_sirinx_build_validation",
    "scoped_repo_edit",
    "agy_scaffold",
]);
const externalActions = new Set([
    "clone_whitelisted_external_repo",
    "connector_activation",
    "deploy",
    "external_api_write_actions",
    "git_push",
    "production_deploy",
    "push",
    "web_sirinx_pages_deploy",
]);
const commandDenyPatterns = [
    { pattern: /\bgit\s+add\s+\.(?:\s|$)/i, reason: "git_add_all_not_allowed" },
    {
        pattern: /\brm\s+-rf\s+(?:\/|\$HOME|~|\.)/i,
        reason: "destructive_recursive_delete",
    },
    {
        pattern: /\b(?:KEY|TOKEN|SECRET|PASSWORD)=\S+/i,
        reason: "secret_like_value_in_command",
    },
    {
        pattern: /\b(?:id_rsa|private[_-]?key|cookies?|token_store)\b/i,
        reason: "secret_or_profile_path",
    },
    { pattern: /\|\s*(?:sh|bash)\b/i, reason: "pipe_to_shell" },
];
export function decideCommandRequest(request, policy = defaultCommandBrokerPolicy, repoRegistry = []) {
    const action = normalize(request.action);
    const sourceTool = normalize(request.sourceTool);
    const toolRoute = policy.allowedTools.find((tool) => normalize(tool.tool) === sourceTool);
    const hardDenied = policy.hardDeniedActions.map(normalize);
    const commandRisk = detectCommandTextRisk(request.commandPreview ?? "");
    if (hardDenied.includes(action)) {
        return decision(request, "T5", "DENY", "hard_denied_action", "security_policy_change_required");
    }
    if (commandRisk) {
        return decision(request, "T5", "DENY", commandRisk, "command_rewrite_required");
    }
    if (!toolRoute) {
        return decision(request, "T5", "DENY", "unknown_tool", "register_tool_route_before_use");
    }
    if (toolRoute.blockedActions?.map(normalize).includes(action)) {
        return decision(request, "T5", "DENY", "tool_policy_block", "route_to_different_tool_or_policy_review");
    }
    if (!toolRoute.allowedActions.map(normalize).includes(action)) {
        return decision(request, "T5", "DENY", "action_not_allowed_for_tool", "add_action_to_tool_policy");
    }
    if (externalActions.has(action)) {
        if (action === "clone_whitelisted_external_repo") {
            return decideCloneRequest(request, repoRegistry);
        }
        return decision(request, "T4", "REQUIRE_HUMAN_REVIEW", "external_or_production_action", "dedicated_adapter_contract_and_runtime_preflight", true);
    }
    if (localMutationActions.has(action) ||
        toolRoute.leaseRequiredActions?.map(normalize).includes(action)) {
        return decision(request, "T3", "REQUIRE_HUMAN_REVIEW", "local_mutation_requires_executor_lease", "executor_lease_and_lane_lock", true);
    }
    if (scopedWriteActions.has(action)) {
        const invalidPath = firstPathOutsideScope(request.touchedPaths ?? [], policy.scopedWritePaths);
        if (invalidPath) {
            return decision(request, "T3", "REQUIRE_HUMAN_REVIEW", "path_outside_scoped_write_allowlist", "scope_review");
        }
        return decision(request, "T2", "ALLOW_SCOPED_WRITE", "scoped_write_allowed", "audit_log");
    }
    if (validationActions.has(action)) {
        return decision(request, "T1", "ALLOW_LOCAL_VALIDATION", "local_validation_allowed", "audit_log");
    }
    return decision(request, "T0", "ALLOW_READONLY", "read_only_or_planning_allowed", "audit_log");
}
export function validateAdapterContract(input) {
    switch (input.adapter) {
        case "docker_localhost_start":
            return validateDockerLocalhostStart(input);
        case "external_repo_clone":
            return validateExternalRepoClone(input);
        case "provider_api_smoke":
            return validateProviderApiSmoke(input);
        case "mcp_connector_activation":
            return validateMcpConnectorActivation(input);
    }
}
function validateDockerLocalhostStart(input) {
    const docker = input.docker;
    const reasons = [];
    if (!docker) {
        reasons.push("missing_docker_contract");
    }
    else {
        if (!["127.0.0.1", "localhost"].includes(normalize(docker.bindHost))) {
            reasons.push("bind_host_not_loopback");
        }
        if (!docker.authRequired) {
            reasons.push("auth_required_false");
        }
        if (!docker.rollbackCommandPresent) {
            reasons.push("rollback_command_missing");
        }
        if (docker.publicPort) {
            reasons.push("public_port_requested");
        }
    }
    return adapterResult(input, "T4", reasons, "docker_localhost_preflight");
}
function validateExternalRepoClone(input) {
    const repo = input.externalRepo;
    const reasons = [];
    if (!repo) {
        reasons.push("missing_external_repo_contract");
    }
    else {
        if (repo.clonePolicy !== "allow") {
            reasons.push("clone_policy_not_allow");
        }
        if (!isPathUnderRoot(repo.clonePath, repo.externalRoot)) {
            reasons.push("clone_path_outside_external_root");
        }
        if (normalize(repo.repo) === "unverified" ||
            normalize(repo.repo).length === 0) {
            reasons.push("repo_unverified");
        }
    }
    return adapterResult(input, "T4", reasons, "external_repo_clone_preflight");
}
function validateProviderApiSmoke(input) {
    const provider = input.providerApi;
    const reasons = [];
    if (!provider) {
        reasons.push("missing_provider_api_contract");
    }
    else {
        if (!provider.providerAllowed) {
            reasons.push("provider_not_allowlisted");
        }
        if (!provider.apiKeyPresent) {
            reasons.push("api_key_not_present");
        }
        if (!provider.rateLimitKeyPresent) {
            reasons.push("rate_limit_key_missing");
        }
        if (provider.estimatedCostUsd > provider.dailyBudgetCapUsd) {
            reasons.push("estimated_cost_exceeds_budget_cap");
        }
    }
    return adapterResult(input, "T4", reasons, "provider_api_smoke_preflight");
}
function validateMcpConnectorActivation(input) {
    const connector = input.mcpConnector;
    const reasons = [];
    if (!connector) {
        reasons.push("missing_mcp_connector_contract");
    }
    else {
        if (!connector.connectorAllowed) {
            reasons.push("connector_not_allowlisted");
        }
        if (!connector.authRequired) {
            reasons.push("auth_required_false");
        }
        if (!connector.scopeBound) {
            reasons.push("connector_scope_not_bound");
        }
        if (connector.externalWrite) {
            reasons.push("external_write_requested");
        }
    }
    return adapterResult(input, "T4", reasons, "mcp_connector_activation_preflight");
}
function adapterResult(input, riskTier, reasons, evidence) {
    const denied = reasons.length > 0;
    return {
        adapter: input.adapter,
        requestId: input.requestId,
        decision: denied ? "DENY" : "REQUIRE_HUMAN_REVIEW",
        riskTier,
        status: denied ? "denied" : "preflight_passed",
        reasons: denied
            ? reasons
            : ["preflight_passed_execution_still_requires_lane"],
        requiredEvidence: denied
            ? ["adapter_contract", "denial_reason", "audit_log"]
            : ["adapter_contract", evidence, "executor_lease", "audit_log"],
        allowedToExecute: false,
    };
}
function decideCloneRequest(request, repoRegistry) {
    const target = normalize(request.targetRepo ?? "");
    const repo = repoRegistry.find((entry) => normalize(entry.name) === target || normalize(entry.repo) === target);
    if (!repo) {
        return decision(request, "T4", "REQUIRE_HUMAN_REVIEW", "target_repo_not_registered", "repo_registry_review");
    }
    if (repo.clonePolicy !== "allow") {
        return decision(request, "T4", "REQUIRE_HUMAN_REVIEW", "repo_clone_policy_not_allow", "repo_policy_review");
    }
    return decision(request, "T4", "REQUIRE_HUMAN_REVIEW", "registered_external_repo_clone_requires_preflight", "external_repo_clone_adapter_preflight", true);
}
function decision(request, riskTier, decisionValue, reason, requiredGate, executorLeaseRequired = false) {
    return {
        requestId: request.requestId,
        sourceTool: normalize(request.sourceTool),
        action: normalize(request.action),
        riskTier,
        decision: decisionValue,
        reason,
        requiredGate,
        auditRequired: true,
        executorLeaseRequired,
        allowedToExecute: false,
        evidenceRequired: evidenceFor(riskTier, decisionValue),
    };
}
function evidenceFor(riskTier, decisionValue) {
    const base = ["command_packet", "audit_log"];
    if (decisionValue === "DENY") {
        return [...base, "denial_reason"];
    }
    if (riskTier === "T3") {
        return [...base, "executor_lease", "lane_lock", "diff_or_runtime_manifest"];
    }
    if (riskTier === "T4") {
        return [
            ...base,
            "target_binding",
            "rollback_plan",
            "health_check_plan",
            "operator_review",
        ];
    }
    return base;
}
function firstPathOutsideScope(paths, allowedPrefixes) {
    for (const path of paths) {
        const normalizedPath = path.replace(/^\/+/, "");
        if (!allowedPrefixes.some((prefix) => normalizedPath.startsWith(prefix))) {
            return path;
        }
    }
    return null;
}
function detectCommandTextRisk(command) {
    for (const item of commandDenyPatterns) {
        if (item.pattern.test(command)) {
            return item.reason;
        }
    }
    return null;
}
function isPathUnderRoot(path, root) {
    const cleanPath = path.replace(/\/+/g, "/").replace(/\/$/, "");
    const cleanRoot = root.replace(/\/+/g, "/").replace(/\/$/, "");
    return cleanPath === cleanRoot || cleanPath.startsWith(`${cleanRoot}/`);
}
function normalize(value) {
    return value.trim().toLowerCase();
}
//# sourceMappingURL=index.js.map
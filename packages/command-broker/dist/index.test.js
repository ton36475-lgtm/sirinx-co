import { describe, expect, it } from "vitest";
import { decideCommandRequest, defaultCommandBrokerPolicy, validateAdapterContract, } from "./index.js";
function request(input) {
    return {
        requestId: "req-test-001",
        sourceTool: "codex-local",
        action: "inspect",
        goal: "unit test",
        ...input,
    };
}
const repoRegistry = [
    {
        name: "deer-flow",
        repo: "bytedance/deer-flow",
        clonePolicy: "allow",
        role: "long horizon runtime",
    },
    {
        name: "pixelrag",
        repo: "unverified",
        clonePolicy: "skip",
        role: "candidate only",
    },
];
describe("command broker contract", () => {
    it("allows read-only inspection without enabling execution", () => {
        const result = decideCommandRequest(request({ action: "inspect" }));
        expect(result.riskTier).toBe("T0");
        expect(result.decision).toBe("ALLOW_READONLY");
        expect(result.auditRequired).toBe(true);
        expect(result.allowedToExecute).toBe(false);
    });
    it("allows local validation as validation only", () => {
        const result = decideCommandRequest(request({
            action: "run_unit_tests",
            commandPreview: "pnpm --filter @sirinx/web-sirinx test",
        }));
        expect(result.riskTier).toBe("T1");
        expect(result.decision).toBe("ALLOW_LOCAL_VALIDATION");
        expect(result.evidenceRequired).toContain("command_packet");
        expect(result.allowedToExecute).toBe(false);
    });
    it("allows scoped docs and fixture writes inside the allowlist", () => {
        const result = decideCommandRequest(request({
            action: "generate_docs",
            touchedPaths: ["docs/COMMAND_BROKER_PRODUCTION.md"],
        }));
        expect(result.riskTier).toBe("T2");
        expect(result.decision).toBe("ALLOW_SCOPED_WRITE");
    });
    it("requires review when scoped writes target paths outside the allowlist", () => {
        const result = decideCommandRequest(request({
            action: "generate_docs",
            touchedPaths: [".env.local"],
        }));
        expect(result.riskTier).toBe("T3");
        expect(result.decision).toBe("REQUIRE_HUMAN_REVIEW");
        expect(result.reason).toBe("path_outside_scoped_write_allowlist");
    });
    it("requires an executor lease for build validation and other local mutation lanes", () => {
        const result = decideCommandRequest(request({
            action: "web_sirinx_build_validation",
            commandPreview: "pnpm --filter @sirinx/web-sirinx build",
        }));
        expect(result.riskTier).toBe("T3");
        expect(result.decision).toBe("REQUIRE_HUMAN_REVIEW");
        expect(result.executorLeaseRequired).toBe(true);
        expect(result.requiredGate).toBe("executor_lease_and_lane_lock");
    });
    it("keeps production deploy visible but review-gated", () => {
        const result = decideCommandRequest(request({
            action: "web_sirinx_pages_deploy",
            commandPreview: "wrangler pages deploy apps/web-sirinx/dist/public --project-name sirinx-co",
        }));
        expect(result.riskTier).toBe("T4");
        expect(result.decision).toBe("REQUIRE_HUMAN_REVIEW");
        expect(result.allowedToExecute).toBe(false);
    });
    it("denies approve-all requests", () => {
        const result = decideCommandRequest(request({
            action: "approve_all_actions",
        }));
        expect(result.riskTier).toBe("T5");
        expect(result.decision).toBe("DENY");
        expect(result.reason).toBe("hard_denied_action");
    });
    it("denies risky command text even if the action name is otherwise safe", () => {
        const result = decideCommandRequest(request({
            action: "inspect",
            commandPreview: "git add .",
        }));
        expect(result.riskTier).toBe("T5");
        expect(result.decision).toBe("DENY");
        expect(result.reason).toBe("git_add_all_not_allowed");
    });
    it("requires preflight for whitelisted external repo clone", () => {
        const result = decideCommandRequest(request({
            action: "clone_whitelisted_external_repo",
            targetRepo: "bytedance/deer-flow",
        }), defaultCommandBrokerPolicy, repoRegistry);
        expect(result.riskTier).toBe("T4");
        expect(result.decision).toBe("REQUIRE_HUMAN_REVIEW");
        expect(result.requiredGate).toBe("external_repo_clone_adapter_preflight");
    });
    it("requires review when a repo is unverified or not allowlisted", () => {
        const result = decideCommandRequest(request({
            action: "clone_whitelisted_external_repo",
            targetRepo: "pixelrag",
        }), defaultCommandBrokerPolicy, repoRegistry);
        expect(result.riskTier).toBe("T4");
        expect(result.decision).toBe("REQUIRE_HUMAN_REVIEW");
        expect(result.reason).toBe("repo_clone_policy_not_allow");
    });
    it("denies unknown tools", () => {
        const result = decideCommandRequest(request({
            sourceTool: "unknown-runner",
            action: "inspect",
        }));
        expect(result.riskTier).toBe("T5");
        expect(result.decision).toBe("DENY");
        expect(result.reason).toBe("unknown_tool");
    });
    it("passes docker localhost preflight without enabling execution", () => {
        const result = validateAdapterContract({
            adapter: "docker_localhost_start",
            requestId: "adapter-docker-001",
            actorTool: "codex-local",
            docker: {
                bindHost: "127.0.0.1",
                authRequired: true,
                rollbackCommandPresent: true,
                publicPort: false,
            },
        });
        expect(result.status).toBe("preflight_passed");
        expect(result.decision).toBe("REQUIRE_HUMAN_REVIEW");
        expect(result.allowedToExecute).toBe(false);
        expect(result.requiredEvidence).toContain("executor_lease");
    });
    it("denies docker preflight when public bind or missing rollback is requested", () => {
        const result = validateAdapterContract({
            adapter: "docker_localhost_start",
            requestId: "adapter-docker-002",
            actorTool: "codex-local",
            docker: {
                bindHost: "0.0.0.0",
                authRequired: false,
                rollbackCommandPresent: false,
                publicPort: true,
            },
        });
        expect(result.status).toBe("denied");
        expect(result.decision).toBe("DENY");
        expect(result.reasons).toEqual(expect.arrayContaining([
            "bind_host_not_loopback",
            "auth_required_false",
            "rollback_command_missing",
            "public_port_requested",
        ]));
    });
    it("passes whitelisted external repo clone preflight without cloning", () => {
        const result = validateAdapterContract({
            adapter: "external_repo_clone",
            requestId: "adapter-clone-001",
            actorTool: "codex-local",
            externalRepo: {
                repo: "bytedance/deer-flow",
                clonePath: "/Users/sirinx/SIRINXDev/_external_repos/deer-flow",
                externalRoot: "/Users/sirinx/SIRINXDev/_external_repos",
                clonePolicy: "allow",
            },
        });
        expect(result.status).toBe("preflight_passed");
        expect(result.decision).toBe("REQUIRE_HUMAN_REVIEW");
        expect(result.allowedToExecute).toBe(false);
    });
    it("denies external repo clone preflight outside the external root", () => {
        const result = validateAdapterContract({
            adapter: "external_repo_clone",
            requestId: "adapter-clone-002",
            actorTool: "codex-local",
            externalRepo: {
                repo: "unverified",
                clonePath: "/Users/sirinx/SIRINXDev/sirinx-agent-native-os/vendor/pixelrag",
                externalRoot: "/Users/sirinx/SIRINXDev/_external_repos",
                clonePolicy: "skip",
            },
        });
        expect(result.status).toBe("denied");
        expect(result.decision).toBe("DENY");
        expect(result.reasons).toEqual(expect.arrayContaining([
            "clone_policy_not_allow",
            "clone_path_outside_external_root",
            "repo_unverified",
        ]));
    });
    it("passes provider API smoke preflight without exposing or using key values", () => {
        const result = validateAdapterContract({
            adapter: "provider_api_smoke",
            requestId: "adapter-provider-001",
            actorTool: "codex-local",
            providerApi: {
                provider: "cloudflare-workers-ai",
                providerAllowed: true,
                apiKeyPresent: true,
                estimatedCostUsd: 0.05,
                dailyBudgetCapUsd: 10,
                rateLimitKeyPresent: true,
            },
        });
        expect(result.status).toBe("preflight_passed");
        expect(result.decision).toBe("REQUIRE_HUMAN_REVIEW");
        expect(result.allowedToExecute).toBe(false);
    });
    it("denies provider API smoke preflight when key, budget, or rate limit gates fail", () => {
        const result = validateAdapterContract({
            adapter: "provider_api_smoke",
            requestId: "adapter-provider-002",
            actorTool: "codex-local",
            providerApi: {
                provider: "unknown-provider",
                providerAllowed: false,
                apiKeyPresent: false,
                estimatedCostUsd: 11,
                dailyBudgetCapUsd: 10,
                rateLimitKeyPresent: false,
            },
        });
        expect(result.status).toBe("denied");
        expect(result.decision).toBe("DENY");
        expect(result.reasons).toEqual(expect.arrayContaining([
            "provider_not_allowlisted",
            "api_key_not_present",
            "rate_limit_key_missing",
            "estimated_cost_exceeds_budget_cap",
        ]));
    });
    it("passes MCP connector activation preflight without activation", () => {
        const result = validateAdapterContract({
            adapter: "mcp_connector_activation",
            requestId: "adapter-mcp-001",
            actorTool: "codex-local",
            mcpConnector: {
                connector: "notion",
                connectorAllowed: true,
                authRequired: true,
                scopeBound: true,
                externalWrite: false,
            },
        });
        expect(result.status).toBe("preflight_passed");
        expect(result.decision).toBe("REQUIRE_HUMAN_REVIEW");
        expect(result.allowedToExecute).toBe(false);
    });
    it("denies MCP connector activation preflight when scope or write gates fail", () => {
        const result = validateAdapterContract({
            adapter: "mcp_connector_activation",
            requestId: "adapter-mcp-002",
            actorTool: "codex-local",
            mcpConnector: {
                connector: "unknown",
                connectorAllowed: false,
                authRequired: false,
                scopeBound: false,
                externalWrite: true,
            },
        });
        expect(result.status).toBe("denied");
        expect(result.decision).toBe("DENY");
        expect(result.reasons).toEqual(expect.arrayContaining([
            "connector_not_allowlisted",
            "auth_required_false",
            "connector_scope_not_bound",
            "external_write_requested",
        ]));
    });
});
//# sourceMappingURL=index.test.js.map
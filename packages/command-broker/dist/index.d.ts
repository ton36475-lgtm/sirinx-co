export type RiskTier = "T0" | "T1" | "T2" | "T3" | "T4" | "T5";
export type ProductionDecision = "ALLOW_READONLY" | "ALLOW_LOCAL_VALIDATION" | "ALLOW_SCOPED_WRITE" | "REQUIRE_HUMAN_REVIEW" | "DENY" | "ESCALATE_INCIDENT";
export type CommandBrokerRequest = {
    requestId: string;
    sourceTool: string;
    action: string;
    goal: string;
    commandPreview?: string;
    targetRepo?: string;
    touchedPaths?: string[];
    dryRun?: boolean;
    externalWrite?: boolean;
};
export type ToolRoute = {
    tool: string;
    role: string;
    allowedActions: string[];
    leaseRequiredActions?: string[];
    blockedActions?: string[];
};
export type RepoRegistryEntry = {
    name: string;
    repo: string;
    clonePolicy: "allow" | "skip" | "detect" | "unknown";
    role: string;
};
export type CommandBrokerPolicy = {
    version: string;
    allowedTools: ToolRoute[];
    hardDeniedActions: string[];
    scopedWritePaths: string[];
};
export type CommandBrokerDecision = {
    requestId: string;
    sourceTool: string;
    action: string;
    riskTier: RiskTier;
    decision: ProductionDecision;
    reason: string;
    requiredGate: string;
    auditRequired: boolean;
    executorLeaseRequired: boolean;
    allowedToExecute: boolean;
    evidenceRequired: string[];
};
export type AdapterKind = "docker_localhost_start" | "external_repo_clone" | "provider_api_smoke" | "mcp_connector_activation";
export type AdapterValidationInput = {
    adapter: AdapterKind;
    requestId: string;
    actorTool: string;
    docker?: {
        bindHost: string;
        authRequired: boolean;
        rollbackCommandPresent: boolean;
        publicPort: boolean;
    };
    externalRepo?: {
        repo: string;
        clonePath: string;
        externalRoot: string;
        clonePolicy: "allow" | "skip" | "detect" | "unknown";
    };
    providerApi?: {
        provider: string;
        providerAllowed: boolean;
        apiKeyPresent: boolean;
        estimatedCostUsd: number;
        dailyBudgetCapUsd: number;
        rateLimitKeyPresent: boolean;
    };
    mcpConnector?: {
        connector: string;
        connectorAllowed: boolean;
        authRequired: boolean;
        scopeBound: boolean;
        externalWrite: boolean;
    };
};
export type AdapterValidationResult = {
    adapter: AdapterKind;
    requestId: string;
    decision: ProductionDecision;
    riskTier: RiskTier;
    status: "preflight_passed" | "requires_review" | "denied";
    reasons: string[];
    requiredEvidence: string[];
    allowedToExecute: false;
};
export declare const defaultCommandBrokerPolicy: CommandBrokerPolicy;
export declare function decideCommandRequest(request: CommandBrokerRequest, policy?: CommandBrokerPolicy, repoRegistry?: RepoRegistryEntry[]): CommandBrokerDecision;
export declare function validateAdapterContract(input: AdapterValidationInput): AdapterValidationResult;
//# sourceMappingURL=index.d.ts.map
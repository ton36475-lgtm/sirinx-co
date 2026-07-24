import { RONIN_ROLE_REGISTRY } from "./ronin-role-registry.mjs";
import { activeRoninProfiles, roninRoleRoster } from "./agent-team.mjs";

export const RUNTIME_AGENT_CARD_VERSION = "1.2";

const DEPARTMENT_RUNTIME_POLICY = Object.freeze({
  L1: Object.freeze({ tokenBudget: 4_000, writes: "none" }),
  L2: Object.freeze({ tokenBudget: 8_000, writes: "none" }),
  L3: Object.freeze({ tokenBudget: 16_000, writes: "plans-only" }),
  L4: Object.freeze({ tokenBudget: 32_000, writes: "exact-lease-only" }),
  L5: Object.freeze({ tokenBudget: 128_000, writes: "none" })
});

const PRINCIPAL_RESPONSIBILITIES = Object.freeze({
  "sirinx-rust-runtime": "native acquisition, scoring, decision, and coordination roles",
  webmcp: "browser and web observation plus research advisory",
  "claude-code": "inspection, analysis, correctness review, and architecture packets",
  "claude-cowork": "artifact context, workspace planning, and advisory synthesis",
  hermes: "intake, orchestration, routing, planning, and reporting",
  manus: "external research collection and research advisory",
  droid: "mobile and device evidence",
  pi: "context intake and summarization",
  "kimi-code": "independent QA, security analysis, and deep review",
  codex: "code analysis, architecture planning, and primary bounded implementation",
  "copilot-cli": "suggestions and secondary review",
  opencode: "single-work-item bounded artifact implementation",
  antigravity2: "bounded scaffolding and prototype candidate output",
  openclaw: "GhostClaw and system-owned execution scope"
});

export const RONIN_DEPARTMENTS = Object.freeze(RONIN_ROLE_REGISTRY.departments.map((department) => Object.freeze({
  id: department.departmentId,
  title: department.title,
  range: department.range,
  count: department.count,
  headRoleId: department.headRoleId,
  headCodename: department.headCodename,
  defaultActionClasses: [...department.defaultActionClasses],
  tokenBudget: DEPARTMENT_RUNTIME_POLICY[department.departmentId].tokenBudget,
  writes: DEPARTMENT_RUNTIME_POLICY[department.departmentId].writes
})));

export const RONIN_OPERATIONAL_FLOW = Object.freeze(
  RONIN_ROLE_REGISTRY.departments
    .map((department) => department.departmentId)
    .filter((departmentId) => departmentId !== "L5")
);

export const RONIN_EXECUTION_PRINCIPALS = Object.freeze(
  RONIN_ROLE_REGISTRY.runtimePrincipals.map((principal) => Object.freeze({
    id: principal.runtimePrincipalId,
    roleIds: Object.freeze([...principal.roleIds]),
    responsibility: PRINCIPAL_RESPONSIBILITIES[principal.runtimePrincipalId],
    sourceAccess: principal.sourceAccess
  }))
);

export const RONIN_NUMBERED_ROLES = RONIN_ROLE_REGISTRY.roles;
export const RONIN_KAI = RONIN_ROLE_REGISTRY.kai;

// Legacy business/profile aliases only. The 47 stable IDs come from
// agent-team.mjs and are grouped by their declared lane, never by array index
// or by the legacy position-derived `number` field.
const LEGACY_OWNER_BY_LANE = Object.freeze({
  approval: "shogun",
  risk: "shogun",
  planning: "planner",
  website: "frontend",
  backend: "backend",
  release: "devops",
  ops: "devops",
  quality: "qa",
  marketing: "growth",
  leads: "sales",
  messaging: "sales",
  business: "sales",
  data: "data",
  energy: "solis",
  creative: "design",
  memory: "scribe"
});
const LEGACY_OWNER_IDS = Object.freeze(activeRoninProfiles.map((profile) => profile.name).sort());
const LEGACY_OWNER_ID_SET = new Set(LEGACY_OWNER_IDS);

function legacyOwnerFor(role) {
  return LEGACY_OWNER_ID_SET.has(role.id) ? role.id : LEGACY_OWNER_BY_LANE[role.lane];
}

export const RONIN_OWNER_GROUPS = Object.freeze(LEGACY_OWNER_IDS.map((owner) => Object.freeze({
  owner,
  roles: Object.freeze(roninRoleRoster
    .filter((role) => legacyOwnerFor(role) === owner)
    .map((role) => role.id)
    .sort())
})));

const CARD_DEFINITIONS = [
  {
    id: "hermes-agent",
    principalId: "hermes",
    title: "Hermes Agent",
    runtimeClass: "mission-commander",
    transport: "http",
    endpoint: "http://127.0.0.1:9000",
    capabilities: ["goal-intake", "brainstorm-aggregation", "decision-routing", "stop-rules", "receipt-review"],
    priority: 100,
    primaryDepartment: "L3",
    eligibleDepartments: ["L3", "L4"],
    ownerProfiles: ["shogun", "planner"],
    sourceAccess: "read-only",
    referenceVote: "aggregator"
  },
  {
    id: "codex",
    principalId: "codex",
    title: "Codex",
    runtimeClass: "build-captain",
    transport: "stdio",
    endpoint: "stdio://codex/app-server",
    capabilities: ["source-edit", "focused-test", "local-build", "evidence-receipt", "scoped-git"],
    priority: 95,
    primaryDepartment: "L4",
    eligibleDepartments: ["L4"],
    ownerProfiles: ["backend", "frontend", "devops", "qa"],
    sourceAccess: "write-with-exact-path-lease-for-l4-only",
    sourceWriterCandidate: true
  },
  {
    id: "codex-app",
    principalId: "codex",
    title: "Codex App",
    runtimeClass: "operator-surface",
    transport: "desktop-app",
    endpoint: null,
    capabilities: ["operator-review", "mobile-pairing", "codex-session-surface"],
    priority: 70,
    primaryDepartment: "L4",
    eligibleDepartments: ["L4"],
    ownerProfiles: ["devops"],
    sourceAccess: "writer-alias-only",
    writerAliasOf: "codex"
  },
  {
    id: "claude-code",
    principalId: "claude-code",
    title: "Claude Code",
    runtimeClass: "architecture-reviewer",
    transport: "stdio",
    endpoint: "stdio://claude/stream-json",
    capabilities: ["architecture", "invariants", "correctness-review", "proof-review"],
    priority: 85,
    primaryDepartment: "L3",
    eligibleDepartments: ["L3", "L5"],
    ownerProfiles: ["planner", "qa"],
    sourceAccess: "read-only",
    referenceVote: "correctness-proof"
  },
  {
    id: "opencode",
    principalId: "opencode",
    title: "OpenCode",
    runtimeClass: "independent-reviewer",
    transport: "acp-stdio",
    endpoint: "stdio://opencode/acp",
    capabilities: ["safety-review", "risk-review", "patch-candidate", "bounded-job-receipt"],
    priority: 84,
    primaryDepartment: "L2",
    eligibleDepartments: ["L2", "L5"],
    ownerProfiles: ["qa", "shogun"],
    sourceAccess: "read-only-except-exact-artifact-job",
    referenceVote: "safety-risk"
  },
  {
    id: "openclaw",
    principalId: "openclaw",
    title: "OpenClaw",
    runtimeClass: "system-operator",
    transport: "gateway-backed-acp",
    endpoint: null,
    capabilities: ["system-observation", "local-ops-plan", "gateway-bridge"],
    priority: 76,
    primaryDepartment: "L4",
    eligibleDepartments: ["L4"],
    ownerProfiles: ["devops"],
    sourceAccess: "no-repo-source-write"
  },
  {
    id: "a2a-sync",
    principalId: null,
    title: "A2A Sync",
    runtimeClass: "transport",
    transport: "http",
    endpoint: "http://127.0.0.1:8790/api/a2a-sync",
    capabilities: ["sync-plan", "evidence-envelope", "approval-route", "transport-only"],
    priority: 90,
    primaryDepartment: null,
    eligibleDepartments: [],
    ownerProfiles: [],
    sourceAccess: "none"
  },
  {
    id: "telegram-bot",
    principalId: "telegram-kai",
    title: "Telegram Bot",
    runtimeClass: "approval-and-alert-transport",
    transport: "http",
    endpoint: "http://127.0.0.1:8791",
    capabilities: ["alert-transport", "approval-request-transport", "fixed-destination", "kai-draft-surface"],
    priority: 92,
    primaryDepartment: null,
    eligibleDepartments: [],
    ownerProfiles: ["sales"],
    sourceAccess: "none",
    kaiAligned: true
  },
  {
    id: "copilot-cli",
    principalId: "copilot-cli",
    title: "Copilot CLI",
    runtimeClass: "assistant-reviewer",
    transport: "acp-stdio",
    endpoint: "stdio://copilot/acp",
    capabilities: ["code-suggestion", "read-only-review", "cli-assistance"],
    priority: 65,
    primaryDepartment: "L2",
    eligibleDepartments: ["L2"],
    ownerProfiles: ["qa"],
    sourceAccess: "read-only"
  },
  {
    id: "pi",
    principalId: "pi",
    title: "Pi",
    runtimeClass: "research-advisor",
    transport: "unavailable",
    endpoint: null,
    capabilities: ["research-advisory", "context-synthesis"],
    priority: 40,
    primaryDepartment: "L5",
    eligibleDepartments: ["L5"],
    ownerProfiles: ["planner"],
    sourceAccess: "read-only"
  },
  {
    id: "droid",
    principalId: "droid",
    title: "Droid",
    runtimeClass: "mobile-perception",
    transport: "unavailable",
    endpoint: null,
    capabilities: ["mobile-observation", "device-evidence", "remote-mobile-status"],
    priority: 45,
    primaryDepartment: "L1",
    eligibleDepartments: ["L1"],
    ownerProfiles: ["devops"],
    sourceAccess: "read-only"
  },
  {
    id: "manus",
    principalId: "manus",
    title: "Manus",
    runtimeClass: "generalist-advisor",
    transport: "desktop-app",
    endpoint: null,
    capabilities: ["generalist-plan", "research-advisory", "artifact-review"],
    priority: 55,
    primaryDepartment: "L3",
    eligibleDepartments: ["L3", "L5"],
    ownerProfiles: ["planner", "design"],
    sourceAccess: "read-only"
  },
  {
    id: "hermes-one",
    principalId: "hermes",
    title: "Hermes One",
    runtimeClass: "desktop-review-surface",
    transport: "desktop-app",
    endpoint: null,
    capabilities: ["commander-visualization", "decision-review", "report-surface"],
    priority: 60,
    primaryDepartment: "L3",
    eligibleDepartments: ["L3"],
    ownerProfiles: ["shogun", "planner"],
    sourceAccess: "read-only"
  },
  {
    id: "kimi-code",
    principalId: "kimi-code",
    title: "Kimi Code",
    runtimeClass: "fast-analysis-reviewer",
    transport: "acp-stdio",
    endpoint: "stdio://kimi/acp",
    capabilities: ["fast-scan", "analysis", "long-context-review", "acp-initialize"],
    priority: 80,
    primaryDepartment: "L2",
    eligibleDepartments: ["L1", "L2"],
    ownerProfiles: ["qa", "data"],
    sourceAccess: "read-only"
  },
  {
    id: "claude-cowork",
    principalId: "claude-cowork",
    title: "Claude Cowork",
    runtimeClass: "collaboration-review-surface",
    transport: "desktop-app",
    endpoint: null,
    capabilities: ["collaboration", "context-review", "spec-review", "report-draft"],
    priority: 68,
    primaryDepartment: "L3",
    eligibleDepartments: ["L3", "L5"],
    ownerProfiles: ["planner", "scribe"],
    sourceAccess: "read-only"
  }
];

function currentDate(options = {}) {
  const value = typeof options.now === "function" ? options.now() : options.now || new Date();
  return value instanceof Date ? value : new Date(value);
}

function lock() {
  return {
    configured: true,
    observed: false,
    routable: false,
    active: false,
    sourceLeaseHeld: false,
    canWriteSource: false,
    canExecuteExternally: false,
    canSendTelegram: false,
    canRunMcp: false,
    commandExecuted: false,
    requiresHumanApproval: true
  };
}

export function getRuntimeAgentCard(agentId) {
  const definition = CARD_DEFINITIONS.find((card) => card.id === agentId);
  return definition ? structuredClone(definition) : null;
}

export function getRuntimeAgentRolePlan(options = {}) {
  // `observedAgentIds` is retained as an input compatibility surface only. A
  // caller-provided identifier is a report, not authenticated connection
  // evidence, and must never verify an endpoint or make a card registrable.
  const knownCardIds = new Set(CARD_DEFINITIONS.map((card) => card.id));
  const reportedIds = new Set(
    (Array.isArray(options.observedAgentIds) ? options.observedAgentIds : [])
      .filter((id) => knownCardIds.has(id))
  );
  const unverifiedLeaseClaim = typeof options.sourceWriterLeaseHolder === "string"
    ? options.sourceWriterLeaseHolder
    : null;
  const cards = CARD_DEFINITIONS.map((definition) => {
    const reportedObserved = reportedIds.has(definition.id);
    return {
      ...lock(),
      ...structuredClone(definition),
      reportedObserved,
      observed: false,
      endpointVerified: false,
      registrationEligible: false,
      sourceLeaseHeld: false,
      canWriteSource: false,
      status: reportedObserved
        ? "runtime-identity-reported-not-admitted"
        : "agent-card-configured-unverified-runtime"
    };
  });
  const legacyOwnerAliases = RONIN_OWNER_GROUPS.flatMap((group) => group.roles);
  const numericRoleIds = RONIN_EXECUTION_PRINCIPALS.flatMap((principal) => principal.roleIds);
  const registryRoleIds = RONIN_NUMBERED_ROLES.map((role) => role.roleId);
  const numericRolesComplete = numericRoleIds.length === 47
    && new Set(numericRoleIds).size === 47
    && numericRoleIds.every((id) => id >= 1 && id <= 47)
    && registryRoleIds.every((id) => numericRoleIds.includes(id));
  const ownerGroupsComplete = legacyOwnerAliases.length === 47
    && new Set(legacyOwnerAliases).size === 47;

  return {
    title: "Runtime Agent Cards and 47 Ronin Role Plan",
    version: RUNTIME_AGENT_CARD_VERSION,
    status: reportedIds.size > 0
      ? "agent-role-plan-evidence-reported-not-admitted"
      : "agent-role-plan-configured-unverified",
    mode: "local-evidence-only",
    configured: true,
    externalWrites: false,
    productionWrites: false,
    customerVisible: false,
    canExecuteExternally: false,
    canSendTelegram: false,
    canRunMcp: false,
    commandExecuted: false,
    requiresHumanApproval: true,
    authority: {
      missionCommander: "hermes-agent",
      singleRepoWriter: "codex",
      maxConcurrentRepoWriters: 1,
      sourceWriterLeaseHolder: null,
      unverifiedSourceWriterLeaseClaim: unverifiedLeaseClaim,
      durableSourceLeaseReceiptValidatorAvailable: false,
      taskEnvelopeLeaseAndReceiptRequired: true,
      uiOrProcessPresenceIsAuthority: false
    },
    ronin: {
      logicalRoles: RONIN_NUMBERED_ROLES.length,
      runtimeProcessesAreRonin: false,
      numberingAuthority: RONIN_ROLE_REGISTRY.registryId,
      jsBusinessRosterNumbersAuthoritative: false,
      departments: structuredClone(RONIN_DEPARTMENTS),
      operationalFlow: [...RONIN_OPERATIONAL_FLOW],
      layerSkippingAllowed: false,
      researchAdvisesAnyOperationalLayer: true,
      kai: {
        ...structuredClone(RONIN_KAI),
        writes: "drafts-only",
        operationsAllowed: false
      },
      roles: structuredClone(RONIN_NUMBERED_ROLES),
      ownerGroups: structuredClone(RONIN_OWNER_GROUPS),
      ownerGroupsComplete,
      ownerGroupsAuthority: "legacy-business-aliases-only",
      executionPrincipals: structuredClone(RONIN_EXECUTION_PRINCIPALS),
      numericRolesComplete
    },
    summary: {
      runtimeAgentCards: cards.length,
      reportedAgentCards: cards.filter((card) => card.reportedObserved).length,
      observedAgentCards: cards.filter((card) => card.observed).length,
      registrationEligibleCards: cards.filter((card) => card.registrationEligible).length,
      logicalRoninRoles: registryRoleIds.length,
      uniqueLogicalRoninRoles: new Set(registryRoleIds).size,
      logicalOwnerProfiles: RONIN_OWNER_GROUPS.length,
      executionPrincipals: RONIN_EXECUTION_PRINCIPALS.length,
      kaiPrincipals: 1,
      numericPrincipalRoleClaims: numericRoleIds.length,
      sourceWriterCandidates: cards.filter((card) => card.sourceWriterCandidate === true).length,
      sourceLeasesHeld: cards.filter((card) => card.sourceLeaseHeld).length,
      activeCards: 0
    },
    cards,
    invariants: [
      "The 47 Ronin roster is a logical role view, not 47 concurrent processes or writers.",
      "The validated crate-packaged registry is numeric and identity authority; business owner groups are legacy aliases only.",
      "Operational work flows L1 to L2 to L3 to L4 without layer skipping; L5 is advisory.",
      "Hermes aggregates and routes decisions but does not hold the repository source-write lease.",
      "Only Codex may become the source writer, and only with an exact task-bound path lease.",
      "Codex App is an operator surface alias and never creates a second writer.",
      "Caller-provided agent identifiers are reports only and never verify endpoints or admit registration.",
      "Claude, OpenCode, Kimi, Copilot, Pi, Manus, Hermes One, and Claude Cowork are read/review by default.",
      "A2A Sync, OmniRoute, MCP, and Telegram are transport/capability layers and never grant authority.",
      "Runtime presence or an initialize response is evidence only; it is not activation or completion."
    ],
    updatedAt: currentDate(options).toISOString()
  };
}

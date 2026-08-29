import {
  RONIN_DEPARTMENTS,
  RONIN_KAI,
  RONIN_NUMBERED_ROLES,
  RONIN_OPERATIONAL_FLOW,
  getRuntimeAgentRolePlan
} from "./runtime-agent-cards.mjs";
import { RONIN_ROLE_REGISTRY } from "./ronin-role-registry.mjs";

export const AGENTIC_ENTERPRISE_COORDINATOR_SLOTS = 1;
export const AGENTIC_ENTERPRISE_VERSION = "1.1";
export const AGENTIC_ENTERPRISE_MAX_WORKERS = RONIN_ROLE_REGISTRY.authority.maxConcurrentWorkers;
export const AGENTIC_ENTERPRISE_RUNTIME_SLOTS =
  AGENTIC_ENTERPRISE_MAX_WORKERS + AGENTIC_ENTERPRISE_COORDINATOR_SLOTS;

const DEPARTMENT_POLICY = {
  L1: {
    title: "Perception",
    purpose: "Collect and normalize bounded evidence.",
    allowedTools: ["T0-read-only-local-inspection"],
    outputs: ["observation-envelope"],
    escalation: "L2"
  },
  L2: {
    title: "Analysis",
    purpose: "Score, compare, and analyze L1 evidence.",
    allowedTools: ["T0-read-only-local-inspection", "T2-local-test-readout"],
    outputs: ["analysis-envelope"],
    escalation: "L3"
  },
  L3: {
    title: "Decision",
    purpose: "Produce plans, specs, and decision artifacts.",
    allowedTools: ["T0-read-only-local-inspection", "plan-artifact"],
    outputs: ["decision-artifact", "validation-gate"],
    escalation: "L4"
  },
  L4: {
    title: "Coordination",
    purpose: "Execute only an approved, leased, bounded work item and verify it.",
    allowedTools: ["T1-exact-scope-local-edit", "T2-local-test-build"],
    outputs: ["implementation-receipt", "verification-receipt"],
    escalation: "human-operator"
  },
  L5: {
    title: "Research",
    purpose: "Provide advisory research without operational authority.",
    allowedTools: ["T0-read-only-local-inspection"],
    outputs: ["research-advisory"],
    escalation: "requesting-operational-layer"
  }
};

function currentDate(options = {}) {
  const value = typeof options.now === "function" ? options.now() : options.now || new Date();
  return value instanceof Date ? value : new Date(value);
}

function makeRoleCard(registryRole) {
  const department = DEPARTMENT_POLICY[registryRole.departmentId];
  const sourceWriteEligible = registryRole.departmentId === "L4"
    && registryRole.runtimePrincipalId === "codex"
    && registryRole.runtimePrincipalBoundary === "write-with-exact-path-lease-for-l4-only"
    && registryRole.actionClasses.includes("B_EXACT_LEASE");

  return {
    cardId: registryRole.cardId,
    legacyCardId: `ronin-${String(registryRole.roleId).padStart(2, "0")}`,
    roleId: registryRole.roleId,
    functionalRoleId: registryRole.functionalRoleId,
    codename: registryRole.codename,
    title: registryRole.title,
    mission: registryRole.mission,
    departmentId: registryRole.departmentId,
    departmentTitle: registryRole.departmentTitle,
    department: registryRole.departmentTitle,
    headRoleId: registryRole.headRoleId,
    reportsTo: registryRole.reportsTo,
    principalId: registryRole.runtimePrincipalId,
    runtimePrincipalId: registryRole.runtimePrincipalId,
    runtimePrincipalBoundary: registryRole.runtimePrincipalBoundary,
    actionClasses: [...registryRole.actionClasses],
    role: `${registryRole.departmentId} ${registryRole.departmentTitle}`,
    purpose: registryRole.mission,
    responsibilities: [...registryRole.responsibilities],
    allowedInputs: [...registryRole.allowedInputs],
    allowedTools: [...department.allowedTools],
    forbiddenTools: [...registryRole.prohibitedActions],
    prohibitedActions: [...registryRole.prohibitedActions],
    outputs: [...registryRole.outputs],
    requiredEvidence: [...registryRole.requiredEvidence],
    escalation: [...registryRole.escalation],
    approvalRequiredFor: [
      "external-api-call",
      "source-or-runtime-mutation",
      "customer-visible-action"
    ],
    memoryPermissions: {
      read: "task-scoped-summaries-only",
      write: "concise-approved-pulse-only",
      secrets: false
    },
    costBudgetTokens: RONIN_DEPARTMENTS.find((item) => item.id === registryRole.departmentId).tokenBudget,
    stopConditions: [
      "missing-parent-receipt",
      "missing-or-stale-lease",
      "scope-drift",
      "conflicting-writer",
      "unknown-external-outcome"
    ],
    escalationPath: [...registryRole.escalation],
    backgroundCadence: registryRole.backgroundCadence,
    implementationStatus: registryRole.implementationStatus,
    sourceRefs: [...registryRole.sourceRefs],
    sourceWriteEligible,
    sourceLeaseHeld: false,
    spawned: false,
    active: false,
    status: "registered-not-spawned"
  };
}

function makeKaiCard() {
  return {
    cardId: RONIN_KAI.cardId,
    roleId: RONIN_KAI.roleId,
    functionalRoleId: RONIN_KAI.functionalRoleId,
    codename: RONIN_KAI.codename,
    title: RONIN_KAI.title,
    mission: RONIN_KAI.mission,
    departmentId: RONIN_KAI.departmentId,
    departmentTitle: RONIN_KAI.departmentTitle,
    department: RONIN_KAI.departmentTitle,
    headRoleId: RONIN_KAI.headRoleId,
    reportsTo: RONIN_KAI.reportsTo,
    principalId: RONIN_KAI.runtimePrincipalId,
    runtimePrincipalId: RONIN_KAI.runtimePrincipalId,
    runtimePrincipalBoundary: RONIN_KAI.runtimePrincipalBoundary,
    actionClasses: [...RONIN_KAI.actionClasses],
    role: RONIN_KAI.title,
    purpose: RONIN_KAI.mission,
    responsibilities: [...RONIN_KAI.responsibilities],
    allowedInputs: [...RONIN_KAI.allowedInputs],
    allowedTools: ["draft-only"],
    forbiddenTools: [...RONIN_KAI.prohibitedActions],
    prohibitedActions: [...RONIN_KAI.prohibitedActions],
    outputs: [...RONIN_KAI.outputs],
    requiredEvidence: [...RONIN_KAI.requiredEvidence],
    escalation: [...RONIN_KAI.escalation],
    approvalRequiredFor: ["every-customer-visible-send"],
    memoryPermissions: { read: "approved-summary-only", write: "none", secrets: false },
    costBudgetTokens: 16_000,
    stopConditions: ["missing-recipient-evidence", "missing-send-ticket"],
    escalationPath: [...RONIN_KAI.escalation],
    backgroundCadence: RONIN_KAI.backgroundCadence,
    implementationStatus: RONIN_KAI.implementationStatus,
    sourceRefs: [...RONIN_KAI.sourceRefs],
    sourceWriteEligible: false,
    sourceLeaseHeld: false,
    spawned: false,
    active: false,
    status: "registered-not-spawned"
  };
}

export function getAgenticEnterpriseStatus(options = {}) {
  const rolePlan = getRuntimeAgentRolePlan(options);
  const roleCards = RONIN_NUMBERED_ROLES.map((role) => makeRoleCard(role));
  const kai = makeKaiCard();
  const departments = RONIN_DEPARTMENTS.map((department) => ({
    ...structuredClone(department),
    head: department.headCodename,
    roleIds: roleCards
      .filter((card) => card.departmentId === department.id)
      .map((card) => card.roleId),
    activeRoles: 0,
    spawnedRoles: 0
  }));

  return {
    title: "SIRINX Agentic Enterprise",
    version: AGENTIC_ENTERPRISE_VERSION,
    status: "enterprise-role-registry-ready-workers-not-spawned",
    mode: "logical-registry-and-bounded-dispatch",
    externalWrites: false,
    productionWrites: false,
    customerVisible: false,
    canSpawnWorkersNow: false,
    canExecuteExternally: false,
    canSendTelegram: false,
    commandExecuted: false,
    authority: rolePlan.authority,
    concurrency: {
      runtimeSlots: AGENTIC_ENTERPRISE_RUNTIME_SLOTS,
      coordinatorReservedSlots: AGENTIC_ENTERPRISE_COORDINATOR_SLOTS,
      maxConcurrentWorkers: AGENTIC_ENTERPRISE_MAX_WORKERS,
      requestedConcurrentWorkers: 0,
      activeWorkers: 0,
      overcommitAllowed: false
    },
    summary: {
      roninRoleCards: roleCards.length,
      kaiCards: 1,
      departments: departments.length,
      executionPrincipals: rolePlan.summary.executionPrincipals,
      kaiPrincipals: rolePlan.summary.kaiPrincipals,
      surfaceCards: rolePlan.summary.runtimeAgentCards,
      sourceWriterPrincipals: rolePlan.summary.sourceWriterCandidates,
      sourceWriteEligibleRoles: roleCards.filter((card) => card.sourceWriteEligible).length,
      registeredRoles: roleCards.length,
      spawnedRoles: 0,
      activeRoles: 0,
      completedRoles: 0
    },
    departments,
    roleCards,
    kai,
    dispatchPolicy: {
      operationalFlow: [...RONIN_OPERATIONAL_FLOW],
      layerSkippingAllowed: false,
      l5AdvisoryOnly: true,
      sourceLeaseRequired: true,
      taskEnvelopeRequired: true,
      approvalReceiptRequired: true,
      resultReceiptRequired: true,
      reviewerMustDifferFromExecutor: true,
      noEligibleRouteResult: "NO_ELIGIBLE_ROUTE"
    },
    nextRecommendedAction: "Create a dry-run dispatch plan, then issue exact task envelopes and leases for at most three workers at a time.",
    updatedAt: currentDate(options).toISOString()
  };
}

function chunks(values, size) {
  const output = [];
  for (let index = 0; index < values.length; index += size) {
    output.push(values.slice(index, index + size));
  }
  return output;
}

export function createAgenticEnterpriseDispatchPlan(input = {}, options = {}) {
  const status = getAgenticEnterpriseStatus(options);
  const dryRun = input.dryRun !== false;
  if (!dryRun) {
    return {
      title: "SIRINX Agentic Enterprise Dispatch",
      status: "blocked-enterprise-dispatch",
      mode: "local-only-dry-run",
      requestId: String(input.requestId || "enterprise-dispatch"),
      goal: String(input.goal || "dispatch 47 Ronin"),
      ...status.concurrency,
      externalWrites: false,
      canSpawnWorkersNow: false,
      commandExecuted: false,
      spawnedRoleCount: 0,
      blockedReasons: ["live_spawn_requires_task_envelopes_leases_and_available_slots"],
      waves: [],
      stopPoint: "ENTERPRISE DISPATCH BLOCKED - NO WORKER SPAWNED",
      updatedAt: currentDate(options).toISOString()
    };
  }

  const operationalWaves = RONIN_OPERATIONAL_FLOW.flatMap((departmentId) => {
    const cards = status.roleCards.filter((card) => card.departmentId === departmentId);
    return chunks(cards, AGENTIC_ENTERPRISE_MAX_WORKERS).map((waveCards, index) => ({
      waveId: `${departmentId.toLowerCase()}-${String(index + 1).padStart(2, "0")}`,
      departmentId,
      roleIds: waveCards.map((card) => card.roleId),
      principalIds: [...new Set(waveCards.map((card) => card.principalId))],
      maxConcurrentWorkers: AGENTIC_ENTERPRISE_MAX_WORKERS,
      requiresPriorDepartmentReceipt: departmentId === "L1"
        ? null
        : RONIN_OPERATIONAL_FLOW[RONIN_OPERATIONAL_FLOW.indexOf(departmentId) - 1],
      taskEnvelopesIssued: 0,
      leasesIssued: 0,
      workersSpawned: 0,
      status: "planned-not-dispatched"
    }));
  });
  const researchWaves = chunks(
    status.roleCards.filter((card) => card.departmentId === "L5"),
    AGENTIC_ENTERPRISE_MAX_WORKERS
  ).map((waveCards, index) => ({
    waveId: `l5-advisory-${String(index + 1).padStart(2, "0")}`,
    departmentId: "L5",
    roleIds: waveCards.map((card) => card.roleId),
    principalIds: [...new Set(waveCards.map((card) => card.principalId))],
    maxConcurrentWorkers: AGENTIC_ENTERPRISE_MAX_WORKERS,
    requiresPriorDepartmentReceipt: null,
    advisoryOnly: true,
    taskEnvelopesIssued: 0,
    leasesIssued: 0,
    workersSpawned: 0,
    status: "planned-not-dispatched"
  }));

  return {
    title: "SIRINX Agentic Enterprise Dispatch",
    status: "enterprise-dispatch-plan-ready",
    mode: "local-only-dry-run",
    requestId: String(input.requestId || "enterprise-dispatch"),
    goal: String(input.goal || "plan all 47 Ronin by department"),
    dryRun: true,
    externalWrites: false,
    canSpawnWorkersNow: false,
    commandExecuted: false,
    requestedRoleCount: RONIN_NUMBERED_ROLES.length,
    plannedRoleCount: RONIN_NUMBERED_ROLES.length,
    spawnedRoleCount: 0,
    activeRoleCount: 0,
    maxConcurrentWorkers: AGENTIC_ENTERPRISE_MAX_WORKERS,
    waves: [...operationalWaves, ...researchWaves],
    kai: {
      planned: true,
      spawned: false,
      operationsAllowed: false,
      sendAllowed: false
    },
    stopRules: [
      "Do not spawn more than three worker roles while the coordinator holds one runtime slot.",
      "Do not dispatch L2, L3, or L4 without the prior department receipt.",
      "Do not grant source-write authority to any principal except a leased Codex role.",
      "Do not treat a planned wave, pane, or agent process as a completed role."
    ],
    stopPoint: "47 ROLE CARDS PLANNED - ZERO WORKERS SPAWNED - WAITING FOR TASK ENVELOPES AND LEASES",
    updatedAt: currentDate(options).toISOString()
  };
}

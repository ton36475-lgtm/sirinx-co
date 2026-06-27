import { useState, useEffect } from "react";
import {
  calculateKellyCriterion,
  OPAL_SOLAR_PRICE_PER_UNIT,
} from "@sirinx/thclaws-runtime";
import { OpenClawOrchestrator } from "@sirinx/openclaw-adapter";
import { Gemma4Client } from "@sirinx/ai-access-gateway";
import { OrchestrationEnvelopeValidator } from "@sirinx/orchestration-envelope";
import igamingPracticeStatusFixture from "./fixtures/igamingPracticeStatus.json";
import toolIntegrationPayloadStatusFixture from "./fixtures/toolIntegrationPayloadStatus.json";
import codexCommandBrokerStatusFixture from "./fixtures/codexCommandBrokerStatus.json";
import codexGoalPlanStatusFixture from "./fixtures/codexGoalPlanStatus.json";
import codexCommandPacketStatusFixture from "./fixtures/codexCommandPacketStatus.json";
import autonomousExecutionPolicyStatusFixture from "./fixtures/autonomousExecutionPolicyStatus.json";
import automatedCodeReviewStatusFixture from "./fixtures/automatedCodeReviewStatus.json";
import codexToolRepoMatrixStatusFixture from "./fixtures/codexToolRepoMatrixStatus.json";
import webSirinxDeployStatusFixture from "./fixtures/webSirinxDeployStatus.json";
import webSirinxDeployPacketStatusFixture from "./fixtures/webSirinxDeployPacketStatus.json";
import commandBrokerProductionStatusFixture from "./fixtures/commandBrokerProductionStatus.json";
import codexSessionSidebarToolkitStatusFixture from "./fixtures/codexSessionSidebarToolkitStatus.json";
import deepResearchStatusFixture from "./fixtures/deepResearchStatus.json";
import a2a2aRunnerStatusFixture from "./fixtures/a2a2aRunnerStatus.json";
import a2a2aDependencyReadinessFixture from "./fixtures/a2a2aDependencyReadiness.json";
import a2a2aCodexBuildPlanFixture from "./fixtures/a2a2aCodexBuildPlan.json";
import a2a2aWorkerReportDigestFixture from "./fixtures/a2a2aWorkerReportDigest.json";
import a2a2aImplementationLanePacketFixture from "./fixtures/a2a2aImplementationLanePacket.json";
import a2a2aCompletionAuditFixture from "./fixtures/a2a2aCompletionAudit.json";
import a2a2aFirstCodexImplementationLaneFixture from "./fixtures/a2a2aFirstCodexImplementationLane.json";
import a2a2aBacklogPriorityFixture from "./fixtures/a2a2aBacklogPriority.json";
import a2a2aTeamAssignmentBoardFixture from "./fixtures/a2a2aTeamAssignmentBoard.json";

interface Worker {
  name: string;
  type: string;
  status: "idle" | "thinking" | "active";
  task: string;
}

interface ApprovalRequest {
  id: string;
  scope: string;
  desc: string;
  status: "pending" | "approved" | "blocked";
  risk: "low" | "medium" | "high";
}

interface LogEntry {
  timestamp: string;
  type: "info" | "success" | "warn" | "security";
  message: string;
}

type PanelKey =
  | "telemetry"
  | "testbenches"
  | "igamingPractice"
  | "gitEvidence"
  | "goalPlan"
  | "codeReview"
  | "toolMatrix"
  | "webDeploy"
  | "commandPacket"
  | "commandBrokerProduction"
  | "sessionToolkit"
  | "a2a2aRunner"
  | "deepResearch"
  | "toolPayloads";
type GitFileStatus = "modified" | "added" | "untracked" | "deleted";
type ProofStatus = "LOCAL" | "EVIDENCED" | "COMMITTED";
type RiskLevel = "low" | "medium" | "high";

type PracticeStatus = "passing" | "ready" | "blocked";
type PayloadReviewStatus = "ready" | "blocked";
type BrokerDecisionStatus =
  | "auto_allow_dry_run"
  | "requires_executor_lease"
  | "policy_controlled_registry_allow"
  | "blocked_first_phase"
  | "blocked";
type GoalLaneStatus = "safe" | "ready" | "gated" | "blocked";

const GIT_EVIDENCE_FIXTURE_NOTICE =
  "Static local review fixture. This panel does not read live git status yet; wire a generated manifest before using it for operator decisions.";

interface GitDiffLine {
  type: "context" | "add" | "remove";
  line: string;
}

interface GitEvidenceFile {
  path: string;
  status: GitFileStatus;
  risk: RiskLevel;
  proofStatus: ProofStatus;
  summary: string;
  evidenceId: string;
  timelineId: string;
  diff: GitDiffLine[];
}

interface EvidencePacketItem {
  label: string;
  status: "ready" | "needed" | "blocked";
  detail: string;
}

interface VersionHistoryItem {
  ref: string;
  label: string;
  proofStatus: "LOCAL" | "NEEDED" | "BLOCKED";
  detail: string;
}

interface PracticeArtifact {
  label: string;
  path: string;
  status: PracticeStatus;
  detail: string;
}

interface LedgerCheck {
  label: string;
  status: PracticeStatus;
  detail: string;
}

interface MockInterviewRow {
  topic: string;
  question: string;
  expectedSignal: string;
}

interface ToolConnectorStatus {
  name: string;
  key: string;
  mode: string;
  targetBound: boolean;
  draftCount: number;
  requiredTargets: string[];
  intendedUse: string;
  sampleDraft: string;
}

interface ToolPayloadFinding {
  status: PayloadReviewStatus;
  label: string;
  detail: string;
}

type ToolIntegrationPayloadStatusFixture = {
  updatedAt: string;
  mode: string;
  runtimeBundlePath: string;
  recordCount: number;
  policy: {
    externalWritesEnabled: boolean;
    includeFileContents: boolean;
    includeHashes: boolean;
    noSecretValues: boolean;
  };
  connectors: ToolConnectorStatus[];
  reviewFindings: ToolPayloadFinding[];
  blockedActions: string[];
};

interface BrokerDecisionArtifact {
  artifactPath: string;
  createdAt: string;
  tool: string;
  action: string;
  decision: BrokerDecisionStatus;
  reason: string;
  requiredGate: string;
  nextStep: string;
  targetRepo: string;
  repoName: string;
  repoRole: string;
  goalHash: string;
  goalPreview: string;
}

type CodexCommandBrokerStatusFixture = {
  updatedAt: string;
  mode: string;
  sourceGlob: string;
  generatedBy: string;
  summary: {
    total: number;
    autoAllowDryRun: number;
    requiresExecutorLease: number;
    policyControlledRegistryAllow: number;
    blockedFirstPhase: number;
    blocked: number;
  };
  policyBoundary: string[];
  decisions: BrokerDecisionArtifact[];
};

type CodexCommandPacketStatusFixture = {
  created_at: string;
  mode: string;
  generated_by: string;
  tool: string;
  action: string;
  target_repo: string;
  lane: string;
  goal: string;
  command_preview: string;
  command_sha256: string;
  broker: {
    decision: BrokerDecisionStatus;
    reason: string;
    required_gate: string;
  };
  risk_flags: {
    level: string;
    label: string;
  }[];
  lease: {
    path: string;
    lease_id: string;
    executor: string;
    valid: boolean;
    reason: string;
    allow_execution: boolean;
  };
  packet_decision: string;
  packet_reason: string;
  execution_allowed_by_packet: boolean;
  policy_boundary: string[];
};

interface GoalPlanLane {
  id: string;
  label: string;
  status: GoalLaneStatus;
  source: string;
  nextAction: string;
}

type CodexGoalPlanStatusFixture = {
  updatedAt: string;
  mode: string;
  generatedBy: string;
  controlNode: {
    label: string;
    repoRoot: string;
    runtimeRoot: string;
    obsidianDigest: string;
    executionRoute: string;
  };
  summary: {
    overallStatus: string;
    workLaneCount: number;
    safeNextActionCount: number;
    blockedActionCount: number;
    connectorTargetsUnbound: number;
    registeredRepos: number;
    brokerDecisions: number;
    sanitizedRequestedActions: number;
    sanitizedBlockedActions: number;
    commandPacketRiskFlags?: number;
    commandPacketExecutionAllowed?: boolean;
  };
  workLanes: GoalPlanLane[];
  safeNextActions: string[];
  blockedActions: string[];
  policyBoundary: string[];
};

type AutonomousExecutionPolicyStatusFixture = {
  updatedAt: string;
  mode: string;
  generatedBy: string;
  summary: {
    requestedActions: number;
    autoAllowDryRun: number;
    requiresExecutorLease: number;
    policyControlledRegistryAllow: number;
    blockedFirstPhase: number;
    blocked: number;
    status: string;
  };
  actions: {
    action: string;
    tool: string;
    decision: BrokerDecisionStatus;
    reason: string;
    requiredGate: string;
    nextStep: string;
  }[];
  policyBoundary: string[];
};

type AutomatedCodeReviewStatusFixture = {
  updatedAt: string;
  mode: string;
  generatedBy: string;
  sourceDocument: {
    path: string;
    exists: boolean;
    bytes: number;
    lines: number;
    sha256: string;
    title: string;
  };
  summary: {
    plannedStages: number;
    changedFilesVisible: number;
    autoAllowDryRun: number;
    requiresExecutorLease: number;
    blockedFirstPhase: number;
    blocked: number;
    status: string;
  };
  stages: {
    id: string;
    label: string;
    mode: string;
    checks: string[];
  }[];
  brokerDecisions: {
    action: string;
    tool: string;
    decision: BrokerDecisionStatus;
    reason: string;
    requiredGate: string;
  }[];
  changedFileSamples: {
    status: string;
    path: string;
  }[];
  blockedWorkflowActions: string[];
  policyBoundary: string[];
};

type CodexToolRepoMatrixStatusFixture = {
  updatedAt: string;
  mode: string;
  generatedBy: string;
  summary: {
    agentCount: number;
    brokerRoutedAgents: number;
    leaseRequiredAgents: number;
    localOnlyGaps: number;
    repoCount: number;
    cloneAllowCount: number;
    cloneSkipCount: number;
    repoActionCount: number;
    blockedOrGatedActions: number;
    overallStatus: string;
  };
  actionSummary: Record<string, number>;
  agents: {
    agentId: string;
    name: string;
    role: string;
    runtime: string;
    localOnly: boolean;
    brokerRouted: boolean;
    allowedActionCount: number;
    leaseRequiredActions: string[];
    blockedActions: string[];
    capabilitySample: string[];
    cardPath: string;
  }[];
  repos: {
    name: string;
    repo: string;
    role: string;
    clonePolicy: string;
    clonePath: string;
    localPathExists: boolean;
    actions: {
      action: string;
      decision: BrokerDecisionStatus;
      reason: string;
      requiredGate: string;
    }[];
    summary: Record<string, number>;
  }[];
  blockedActions: string[];
  policyBoundary: string[];
};

type WebSirinxDeployStatusFixture = {
  updatedAt: string;
  mode: string;
  generatedBy: string;
  summary: {
    distChangedFiles: number;
    sourceChangedFiles: number;
    htmlFiles: number;
    assetFiles: number;
    missingAssetReferences: number;
    brokerDecisionCounts: Record<string, number>;
    deployBlocked: boolean;
    overallStatus: string;
  };
  distFileCounts: {
    distExists: number;
    htmlFiles: number;
    assetFiles: number;
    totalFiles: number;
  };
  distGitStatusCounts: Record<string, number>;
  sourceGitStatusCounts: Record<string, number>;
  staticFiles: {
    name: string;
    path: string;
    exists: boolean;
    bytes: number;
  }[];
  assetReferenceIssues: {
    html: string;
    asset: string;
    issue: string;
  }[];
  brokerDecisions: {
    tool: string;
    action: string;
    decision: BrokerDecisionStatus;
    reason: string;
    requiredGate: string;
  }[];
  distChangedSamples: {
    status: string;
    path: string;
  }[];
  sourceChangedSamples: {
    status: string;
    path: string;
  }[];
  policyBoundary: string[];
  nextSafeActions: string[];
};

type WebSirinxDeployPacketStatusFixture = {
  updatedAt: string;
  mode: string;
  generatedBy: string;
  laneId: string;
  project: string;
  pagesProject: string;
  distPath: string;
  sourceManifest: string;
  summary: {
    overallStatus: string;
    distChangedFiles: number;
    sourceChangedFiles: number;
    missingAssetReferences: number;
    requiredValidationCommands: number;
    dryRunReadyCommands: number;
    leaseRequiredCommands: number;
    blockedCommands: number;
    deployCommandBlocked: boolean;
    decisionCounts: Record<string, number>;
  };
  requiredEvidence: string[];
  commands: {
    id: string;
    label: string;
    required: boolean;
    action: string;
    commandPreview: string;
    commandSha256: string;
    brokerDecision: BrokerDecisionStatus;
    brokerReason: string;
    requiredGate: string;
    riskNotes: string[];
  }[];
  policyBoundary: string[];
  nextSafeActions: string[];
};

type CommandBrokerProductionStatusFixture = {
  updatedAt: string;
  mode: string;
  generatedBy: string;
  runtimeRoot: string;
  summary: {
    registeredCommands: number;
    registeredTools: number;
    adapterContracts: number;
    runtimeFiles: number;
    riskTierCounts: Record<string, number>;
    decisionCounts: Record<string, number>;
    denyAlwaysCount: number;
    contractPackagePresent: boolean;
    directExecutionEnabled: boolean;
    deployCommandAllowed: boolean;
    auditLogEditable: boolean;
    status: string;
  };
  riskTiers: {
    id: string;
    label: string;
    defaultDecision: string;
    examples: string[];
  }[];
  decisions: string[];
  contractPackage: {
    name: string;
    path: string;
    entrypoint: string;
    testFile: string;
    executionEnabled: boolean;
  };
  blockedCommands: {
    id: string;
    lane: string;
    tool: string;
    action: string;
    label: string;
    riskTier: string;
    brokerDecision: string;
    productionDecision: string;
    requiredGate: string;
    commandSha256: string;
    commandPreview: string;
    executeByBroker: boolean;
  }[];
  runtimeFiles: string[];
  policyBoundary: string[];
  nextSafeActions: string[];
};

type A2A2ARunnerStatusFixture = {
  updatedAt: string;
  mode: string;
  generatedBy: string;
  runtimeRoot: string;
  sourceGlob: string;
  summary: {
    roles: number;
    inbox: number;
    running: number;
    outbox: number;
    completed: number;
    failed: number;
    latestResults: number;
    providerCalls: number;
    dryRunCompleted: number;
    overallStatus: string;
  };
  lastRunnerSummary: {
    createdAt: string;
    mode: string;
    watch: boolean;
    cycles: number;
    processed: number;
    providerCallAllowed: boolean;
    rolesChecked: string[];
  };
  roleCounts: {
    role: string;
    inbox: number;
    running: number;
    outbox: number;
    completed: number;
    failed: number;
  }[];
  latestResults: {
    path: string;
    createdAt: string;
    role: string;
    taskId: string;
    status: string;
    providerCall: boolean;
    model: string;
    promptSource: string;
    nextOwner: string;
    safeToDispatchLocally: boolean;
    summary: string;
  }[];
  policyBoundary: string[];
  nextSafeActions: string[];
};

type A2A2ADependencyReadinessFixture = {
  updatedAt: string;
  mode: string;
  generatedBy: string;
  runtimeRoot: string;
  summary: {
    overallStatus: string;
    dependencyChecks: number;
    codexQueueItems: number;
    workerReports: number;
    kobReports: number;
    providerCalls: number;
    worstDependencyStatus: string;
  };
  dependencyChecks: {
    id: string;
    label: string;
    status: "ready" | "partial" | "missing" | "review";
    evidence: string;
    nextAction: string;
  }[];
  codexBuildQueue: {
    queueId: string;
    taskId: string;
    sourceRole: string;
    targetOwner: string;
    readiness: string;
    sourceResultPath: string;
    summary: string;
    executionAllowed: boolean;
    nextAction: string;
  }[];
  policyBoundary: string[];
  nextSafeActions: string[];
};

type A2A2ACodexBuildPlanFixture = {
  updatedAt: string;
  mode: string;
  generatedBy: string;
  runtimeRoot: string;
  status: string;
  planPath?: string;
  plan: {
    planId: string;
    lane: string;
    sourceQueueId: string;
    sourceTaskId: string;
    sourceResultPath: string;
    status: string;
    objective: string;
    sourceSummary: string;
    executionAllowed: boolean;
    orderedSteps: {
      owner: string;
      action: string;
      detail: string;
    }[];
    validationCommands: string[];
    workerDispatchRecommendations: {
      role: string;
      goal: string;
      when: string;
    }[];
  } | null;
  policyBoundary: string[];
  nextSafeActions: string[];
};

type A2A2AWorkerReportDigestFixture = {
  updatedAt: string;
  mode: string;
  generatedBy: string;
  runtimeRoot: string;
  sourceGlob: string;
  summary: {
    reports: number;
    workerReports: number;
    kobReports: number;
    providerCalls: number;
    safeReports: number;
    overallStatus: string;
  };
  reports: {
    path: string;
    createdAt: string;
    role: string;
    taskId: string;
    status: string;
    model: string;
    providerCall: boolean;
    promptSha256: string;
    nextOwner: string;
    safeToDispatchLocally: boolean;
    requiresHumanReview: boolean;
    summary: string;
    goalPreview: string;
    plannedActions: string[];
    contextRefs: string[];
  }[];
  policyBoundary: string[];
  nextSafeActions: string[];
};

type A2A2AImplementationLanePacketFixture = {
  updatedAt: string;
  mode: string;
  generatedBy: string;
  runtimeRoot: string;
  packetPath: string;
  summary: {
    status: string;
    dependencies: number;
    blockedDependencies: number;
    missingDependencies: number;
    workerEvidence: number;
    providerCalls: number;
    priorityItems: number;
    executionAllowed: boolean;
  };
  packet: {
    packetId: string;
    laneId: string;
    sourcePlanId: string;
    sourceTaskId: string;
    status: string;
    executionAllowed: boolean;
    objective: string;
    dependencyGate: {
      id: string;
      owner: string;
      status: string;
      evidence: string;
    }[];
    priorityWorkItems: {
      priority: number;
      owner: string;
      task: string;
      status: string;
      why: string;
      acceptance: string;
    }[];
    workerEvidence: {
      role: string;
      taskId: string;
      status: string;
      model: string;
      providerCall: boolean;
      safeToDispatchLocally: boolean;
      requiresHumanReview: boolean;
      nextOwner: string;
      summary: string;
      plannedActions: string[];
    }[];
    scope: {
      allowedPaths: string[];
      blockedPaths: string[];
      plannedFilesForThisPacket: string[];
    };
    validationCommands: string[];
    scopedStageCommand: string[];
    blockedActions: string[];
    acceptanceCriteria: string[];
    nextSafeActions: string[];
  };
  policyBoundary: string[];
};

type A2A2ACompletionAuditFixture = {
  updatedAt: string;
  mode: string;
  generatedBy: string;
  runtimeRoot: string;
  runtimeReportPath: string;
  summary: {
    overallStatus: string;
    requirements: number;
    passed: number;
    failed: number;
    providerCalls: number;
    roles: number;
    workerReports: number;
    implementationPacketStatus: string;
  };
  checks: {
    id: string;
    label: string;
    status: "pass" | "fail";
    evidence: string;
    nextAction: string;
  }[];
  prioritySequence: string[];
  policyBoundary: string[];
};

type A2A2AFirstCodexImplementationLaneFixture = {
  updatedAt: string;
  mode: string;
  generatedBy: string;
  runtimeRoot: string;
  runtimeLanePath: string;
  summary: {
    status: string;
    tasks: number;
    codexReadyTasks: number;
    reportInputTasks: number;
    providerCallsAllowed: boolean;
    workerDirectEditsAllowed: boolean;
    codexFileEditsAllowed: boolean;
    validationCommands: number;
  };
  lane: {
    laneId: string;
    sourcePacketId: string;
    sourceLaneId: string;
    status: string;
    objective: string;
    codexFileEditsAllowed: boolean;
    workerDirectEditsAllowed: boolean;
    providerCallsAllowed: boolean;
    gitOwner: string;
    allowedPaths: string[];
    blockedPaths: string[];
    tasks: {
      taskId: string;
      priority: number;
      owner: string;
      name: string;
      status: string;
      why: string;
      acceptance: string;
    }[];
    validationCommands: string[];
    scopedStageCommand: string[];
    blockedActions: string[];
    acceptanceCriteria: string[];
  };
  policyBoundary: string[];
  nextSafeActions: string[];
};

type A2A2ABacklogPriorityFixture = {
  updatedAt: string;
  mode: string;
  generatedBy: string;
  sourcePath: string;
  runtimeRoot: string;
  runtimeReportPath: string;
  summary: {
    totalPending: number;
    readyForReview: number;
    blocked: number;
    p0: number;
    p1: number;
    p2: number;
    p3: number;
    owners: number;
  };
  ownerCounts: {
    owner: string;
    count: number;
  }[];
  topItems: {
    id: string;
    priority: number;
    status: string;
    owner: string;
    line: number;
    section: string;
    subsection: string;
    task: string;
    blockedReason: string;
    nextAction: string;
  }[];
  blockedGates: {
    id: string;
    priority: number;
    status: string;
    owner: string;
    line: number;
    section: string;
    subsection: string;
    task: string;
    blockedReason: string;
    nextAction: string;
  }[];
  policyBoundary: string[];
  nextSafeActions: string[];
};

type A2A2ATeamAssignmentBoardFixture = {
  updatedAt: string;
  mode: string;
  generatedBy: string;
  runtimeRoot: string;
  runtimeReportPath: string;
  summary: {
    status: string;
    roles: number;
    immediateQueueItems: number;
    codexReadyTasks: number;
    reportOnlyWorkerTasks: number;
    backlogP0: number;
    backlogP1: number;
    blockedGates: number;
    providerCallsAllowed: boolean;
    workerDirectEditsAllowed: boolean;
    codexFileEditsAllowed: boolean;
  };
  nextCodexAction: {
    queueId: string;
    source: string;
    priority: number;
    owner: string;
    status: string;
    task: string;
    why: string;
    acceptance: string;
  };
  roles: {
    role: string;
    title: string;
    responsibility: string;
    currentAction: string;
    editRights: string;
  }[];
  immediateQueue: {
    queueId: string;
    source: string;
    priority: number;
    owner: string;
    status: string;
    task: string;
    why: string;
    acceptance: string;
  }[];
  dependencyGate: {
    id: string;
    status: string;
    evidence: string;
  }[];
  blockedGates: {
    id: string;
    priority: number;
    status: string;
    owner: string;
    line: number;
    section: string;
    subsection: string;
    task: string;
    blockedReason: string;
    nextAction: string;
  }[];
  sourceFixtures: Record<string, string>;
  policyBoundary: string[];
  nextSafeActions: string[];
};

type IgamingPracticeStatusFixture = {
  updatedAt: string;
  mode: string;
  ledgerTests: {
    status: PracticeStatus;
    total: number;
    command: string;
  };
  artifacts: PracticeArtifact[];
  checks: LedgerCheck[];
  mockInterviewRows: MockInterviewRow[];
  boundaryBlocks: string[];
};

const igamingPracticeStatus =
  igamingPracticeStatusFixture as IgamingPracticeStatusFixture;
const igamingPracticeArtifacts = igamingPracticeStatus.artifacts;
const ledgerTestChecks = igamingPracticeStatus.checks;
const mockInterviewRows = igamingPracticeStatus.mockInterviewRows;
const igamingBoundaryBlocks = igamingPracticeStatus.boundaryBlocks;
const toolIntegrationPayloadStatus =
  toolIntegrationPayloadStatusFixture as ToolIntegrationPayloadStatusFixture;
const toolConnectorStatuses = toolIntegrationPayloadStatus.connectors;
const toolPayloadReviewFindings = toolIntegrationPayloadStatus.reviewFindings;
const toolPayloadBlockedActions = toolIntegrationPayloadStatus.blockedActions;
const codexCommandBrokerStatus =
  codexCommandBrokerStatusFixture as CodexCommandBrokerStatusFixture;
const brokerDecisionArtifacts = codexCommandBrokerStatus.decisions;
const brokerPolicyBoundary = codexCommandBrokerStatus.policyBoundary;
const codexCommandPacketStatus =
  codexCommandPacketStatusFixture as CodexCommandPacketStatusFixture;
const codexGoalPlanStatus =
  codexGoalPlanStatusFixture as CodexGoalPlanStatusFixture;
const goalPlanWorkLanes = codexGoalPlanStatus.workLanes;
const goalPlanSafeNextActions = codexGoalPlanStatus.safeNextActions;
const goalPlanBlockedActions = codexGoalPlanStatus.blockedActions;
const goalPlanPolicyBoundary = codexGoalPlanStatus.policyBoundary;
const autonomousExecutionPolicyStatus =
  autonomousExecutionPolicyStatusFixture as AutonomousExecutionPolicyStatusFixture;
const autonomousPolicyBlockedSamples =
  autonomousExecutionPolicyStatus.actions.filter(
    (action) => action.decision === "blocked",
  );
const automatedCodeReviewStatus =
  automatedCodeReviewStatusFixture as AutomatedCodeReviewStatusFixture;
const codeReviewStages = automatedCodeReviewStatus.stages;
const codeReviewBrokerDecisions = automatedCodeReviewStatus.brokerDecisions;
const codeReviewChangedFileSamples =
  automatedCodeReviewStatus.changedFileSamples;
const codexToolRepoMatrixStatus =
  codexToolRepoMatrixStatusFixture as CodexToolRepoMatrixStatusFixture;
const toolRepoMatrixAgents = codexToolRepoMatrixStatus.agents;
const toolRepoMatrixRepos = codexToolRepoMatrixStatus.repos;
const toolRepoMatrixBoundary = codexToolRepoMatrixStatus.policyBoundary;
const webSirinxDeployStatus =
  webSirinxDeployStatusFixture as WebSirinxDeployStatusFixture;
const webSirinxDeployPacketStatus =
  webSirinxDeployPacketStatusFixture as WebSirinxDeployPacketStatusFixture;
const commandBrokerProductionStatus =
  commandBrokerProductionStatusFixture as CommandBrokerProductionStatusFixture;
const a2a2aRunnerStatus = a2a2aRunnerStatusFixture as A2A2ARunnerStatusFixture;
const a2a2aDependencyReadiness =
  a2a2aDependencyReadinessFixture as A2A2ADependencyReadinessFixture;
const a2a2aCodexBuildPlan =
  a2a2aCodexBuildPlanFixture as A2A2ACodexBuildPlanFixture;
const a2a2aWorkerReportDigest =
  a2a2aWorkerReportDigestFixture as A2A2AWorkerReportDigestFixture;
const a2a2aImplementationLanePacket =
  a2a2aImplementationLanePacketFixture as A2A2AImplementationLanePacketFixture;
const a2a2aCompletionAudit =
  a2a2aCompletionAuditFixture as A2A2ACompletionAuditFixture;
const a2a2aFirstCodexImplementationLane =
  a2a2aFirstCodexImplementationLaneFixture as A2A2AFirstCodexImplementationLaneFixture;
const a2a2aBacklogPriority =
  a2a2aBacklogPriorityFixture as A2A2ABacklogPriorityFixture;
const a2a2aTeamAssignmentBoard =
  a2a2aTeamAssignmentBoardFixture as A2A2ATeamAssignmentBoardFixture;
const codexSessionSidebarToolkitStatus =
  codexSessionSidebarToolkitStatusFixture;
const sessionToolkitAgents = codexSessionSidebarToolkitStatus.agents;
const sessionToolkitWorkflows = codexSessionSidebarToolkitStatus.workflows;
const sessionToolkitReportEntries = Object.entries(
  codexSessionSidebarToolkitStatus.reports.items,
);
const sessionToolkitDocs = codexSessionSidebarToolkitStatus.docs;
const sessionToolkitSyncQueue =
  codexSessionSidebarToolkitStatus.syncQueue.items;
const sessionToolkitIntegrationRows =
  codexSessionSidebarToolkitStatus.integrationReadiness.rows;
const sessionToolkitLeaseRequests =
  codexSessionSidebarToolkitStatus.leaseRequests.requests;
const sessionToolkitExecutorPreflight =
  codexSessionSidebarToolkitStatus.executorPreflight;
const sessionToolkitObjectiveAudit =
  codexSessionSidebarToolkitStatus.objectiveAudit;
const sessionToolkitObjectiveAuditCounts =
  sessionToolkitObjectiveAudit.counts as Record<string, number | undefined>;
const deepResearchStatus = deepResearchStatusFixture;
const deepResearchValidationEntries = Object.entries(
  deepResearchStatus.validation,
);

const gitEvidenceFiles: GitEvidenceFile[] = [
  {
    path: "apps/mission-control/src/App.tsx",
    status: "modified",
    risk: "medium",
    proofStatus: "LOCAL",
    evidenceId: "ev-20260605-mission-control-ui-diff",
    timelineId: "te-20260605-git-evidence-review-panel-ui",
    summary:
      "Adds the local Git Evidence Review Panel into the Mission Control center lane.",
    diff: [
      { type: "context", line: "@@ Mission Control center panel registry @@" },
      { type: "add", line: "+ panel_id: 'git-evidence-review'" },
      { type: "add", line: "+ changed_files: gitEvidenceFiles" },
      { type: "add", line: "+ evidence_packet: localEvidencePacketItems" },
      {
        type: "context",
        line: " approval.status remains local-only and push/deploy blocked",
      },
    ],
  },
  {
    path: "docs/product-design/GIT_EVIDENCE_REVIEW_PANEL_SPEC.md",
    status: "added",
    risk: "low",
    proofStatus: "LOCAL",
    evidenceId: "ev-20260605-git-evidence-spec",
    timelineId: "te-20260605-git-evidence-review-panel-intake",
    summary:
      "Defines the product design surface, flows, acceptance criteria, and evidence requirements.",
    diff: [
      { type: "context", line: "@@ Product design spec @@" },
      { type: "add", line: "+ Feature: Git Evidence Review Panel" },
      {
        type: "add",
        line: "+ Scope: local git diff viewer, changed files, timeline mapping",
      },
      {
        type: "add",
        line: "+ Blocked: no push, no deploy, no external GitHub verification",
      },
      {
        type: "context",
        line: " implementation is allowed only after APPROVE_IMPLEMENTATION",
      },
    ],
  },
  {
    path: "docs/oracle/GIT_EVIDENCE_REVIEW_PANEL_PROOF_MODEL.md",
    status: "added",
    risk: "low",
    proofStatus: "LOCAL",
    evidenceId: "ev-20260605-git-evidence-proof-model",
    timelineId: "te-20260605-git-evidence-review-panel-proof",
    summary:
      "Maps local Git outputs to Oracle proof states without overclaiming EXTERNAL or PROVEN.",
    diff: [
      { type: "context", line: "@@ Oracle proof boundary @@" },
      { type: "add", line: "+ LOCAL: git command output exists" },
      { type: "add", line: "+ EVIDENCED: packet has hash and metadata" },
      { type: "remove", line: "- PROVEN from git diff alone" },
      {
        type: "context",
        line: " external verification is blocked until separate approval",
      },
    ],
  },
];

const evidencePacketItems: EvidencePacketItem[] = [
  {
    label: "Implementation approval",
    status: "ready",
    detail: "Operator sent APPROVE_IMPLEMENTATION for this local-only feature.",
  },
  {
    label: "Git status snapshot",
    status: "ready",
    detail:
      "Local dirty working tree is visible before review; no remote mutation.",
  },
  {
    label: "git diff --check",
    status: "ready",
    detail: "Passed after implementation and formatting.",
  },
  {
    label: "Mission Control build",
    status: "ready",
    detail: "Production build passed for @sirinx/mission-control.",
  },
  {
    label: "Targeted secret scan",
    status: "ready",
    detail: "No API keys or provider tokens found in touched source and docs.",
  },
  {
    label: "External GitHub verification",
    status: "blocked",
    detail: "Blocked by scope: no push, no deploy, no external verification.",
  },
];

const versionHistoryItems: VersionHistoryItem[] = [
  {
    ref: "working-tree",
    label: "Current local working tree",
    proofStatus: "LOCAL",
    detail: "Reviewing uncommitted local source and spec changes.",
  },
  {
    ref: "te-20260605-git-evidence-review-panel-intake",
    label: "Spec intake timeline",
    proofStatus: "LOCAL",
    detail:
      "Product spec and Oracle proof model were captured before implementation.",
  },
  {
    ref: "commit-anchor",
    label: "Commit anchor",
    proofStatus: "NEEDED",
    detail: "No commit SHA exists until a separate local commit approval.",
  },
  {
    ref: "external-verification",
    label: "External verification",
    proofStatus: "BLOCKED",
    detail: "GitHub verification stays blocked under this approved scope.",
  },
];

export default function App() {
  // Mock states based on M2 Control Node reality
  const [workers, setWorkers] = useState<Worker[]>([
    {
      name: "Codex Worker",
      type: "OpenAI/Codex",
      status: "thinking",
      task: "Auditing legacy/sirinx package.json",
    },
    {
      name: "OpenJarvis Kernel",
      type: "Local AI Kernel",
      status: "active",
      task: "Summarizing daily security reports",
    },
    {
      name: "Claude Code Agent",
      type: "Anthropic/Claude",
      status: "idle",
      task: "Waiting for task handoff",
    },
    {
      name: "thClaws Queue",
      type: "Async Runtime",
      status: "idle",
      task: "Queue empty",
    },
  ]);

  const [approvals, setApprovals] = useState<ApprovalRequest[]>([
    {
      id: "P8-A",
      scope: "Local Preview",
      desc: "Initialize local live dashboard preview on port 3333.",
      status: "approved",
      risk: "low",
    },
    {
      id: "P8-D",
      scope: "Local Commit",
      desc: "Commit normalized monorepo scaffold and quarantined legacy repositories.",
      status: "approved",
      risk: "low",
    },
    {
      id: "P8-B",
      scope: "ClawForge Render",
      desc: "Execute real-time MP4 video demo rendering for Mission Control.",
      status: "pending",
      risk: "medium",
    },
    {
      id: "P8-C",
      scope: "Devpost Export",
      desc: "Package evidence manifest and artifacts for project validation.",
      status: "pending",
      risk: "low",
    },
    {
      id: "P8-E",
      scope: "Git Push",
      desc: "Push integration branch to remote origin. (Cloud access required)",
      status: "blocked",
      risk: "high",
    },
    {
      id: "P8-F",
      scope: "Cloudflare Deploy",
      desc: "Deploy preview workspace to Cloudflare Pages environment.",
      status: "blocked",
      risk: "high",
    },
  ]);

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      timestamp: "23:30:12",
      type: "info",
      message: "Mission Control initialized on Mac mini M2 Control Node.",
    },
    {
      timestamp: "23:31:54",
      type: "success",
      message: "Local Git Repository initialized cleanly.",
    },
    {
      timestamp: "23:35:46",
      type: "info",
      message: "Local diagnostics audit: Node v26.0.0, Ollama reachable.",
    },
    {
      timestamp: "23:36:16",
      type: "security",
      message:
        "Secrets Scan completed: 0 keys, certificates, or tokens leaked.",
    },
    {
      timestamp: "23:37:55",
      type: "success",
      message:
        "P8-D Approval: Scaffold and Governance files committed (74b9790).",
    },
    {
      timestamp: "23:40:36",
      type: "success",
      message:
        "Auto Approval: 9 quarantined legacy repositories imported (7f7f2cc).",
    },
    {
      timestamp: "23:42:36",
      type: "success",
      message:
        "P8-D Approval: PNPM Workspace activated and committed (2a37a06).",
    },
  ]);

  const [cpuUsage, setCpuUsage] = useState(14);
  const [ramUsage, setRamUsage] = useState(62);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [progressWidth, setProgressWidth] = useState(0);

  // thClaws state
  const [kellyOdds, setKellyOdds] = useState(2.0);
  const [kellyProb, setKellyProb] = useState(0.65);
  const [kellyFraction, setKellyFraction] = useState(0.475);

  // Panel Selection state
  const [activePanel, setActivePanel] = useState<PanelKey>("telemetry");
  const [selectedGitFilePath, setSelectedGitFilePath] = useState(
    gitEvidenceFiles[0].path,
  );

  // OpenClaw state
  const [routingInput, setRoutingInput] = useState(
    "Analyze local solar grid pricing trends",
  );
  const [isRouting, setIsRouting] = useState(false);
  const [routingResult, setRoutingResult] = useState<any>(null);

  // OpenHands state
  const [terminalInput, setTerminalInput] = useState("ls -la");
  const [isExecuting, setIsExecuting] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<
    Array<{ cmd: string; out: string; type: "success" | "error" }>
  >([
    {
      cmd: "mkdir -p outputs/reports",
      out: "Workspace directories validated successfully.",
      type: "success",
    },
  ]);

  // Gemma state
  const [complianceInput, setComplianceInput] = useState(
    "This high-power solar unit produces clean local energy with zero environment emissions.",
  );
  const [isAuditing, setIsAuditing] = useState(false);
  const [complianceResult, setComplianceResult] = useState<any>(null);

  // Envelope Auditor state
  const [envelopeInput, setEnvelopeInput] = useState(
    JSON.stringify(
      {
        task_id: "task-982-solar-audit",
        workflow_stage: "validate",
        source_request: "Perform degradation check on solar fields.",
        assigned_agent: "Validator",
        required_context: {
          brand_facts: true,
          field_context: true,
          repo_paths: ["legacy/sirinx-solar-energy/state"],
          bundle_paths: ["04_deployment_bundle"],
          telemetry_inputs: ["cpu_usage", "ram_usage"],
          financial_inputs: ["opal_solar_pricing"],
        },
        constraints: {
          locked_facts_required: true,
          no_marketing_claims_without_analysis: true,
          no_global_fact_mutation: true,
          server_ready_hold_mode: true,
        },
        input_payload: { fieldId: "zone-alpha-9" },
        output_payload: { status: "pending" },
        validation: {
          schema_ok: true,
          paths_exist: true,
          fact_lock_passed: true,
          handoff_ready: true,
        },
        next_agent: "Delivery",
        fallback_queue_reason: null,
      },
      null,
      2,
    ),
  );
  const [isAuditingEnvelope, setIsAuditingEnvelope] = useState(false);
  const [envelopeAuditResult, setEnvelopeAuditResult] = useState<any>(null);
  const selectedGitEvidenceFile =
    gitEvidenceFiles.find((file) => file.path === selectedGitFilePath) ??
    gitEvidenceFiles[0];
  const routedModelLabel =
    typeof routingResult?.routedTo === "string" && routingResult.routedTo.trim()
      ? routingResult.routedTo
      : "local-fallback";
  const routedTaskTypeLabel =
    typeof routingResult?.taskType === "string" && routingResult.taskType.trim()
      ? routingResult.taskType
      : "unknown";

  // Recalculate Kelly Fraction using thclaws math engine
  useEffect(() => {
    try {
      const fraction = calculateKellyCriterion(kellyOdds, kellyProb);
      setKellyFraction(fraction);
    } catch (e) {
      console.error(e);
    }
  }, [kellyOdds, kellyProb]);

  // Simulate hardware fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage((prev) => {
        const change = Math.floor(Math.random() * 7) - 3;
        return Math.max(8, Math.min(35, prev + change));
      });
      setRamUsage((prev) => {
        const change = Math.floor(Math.random() * 3) - 1;
        return Math.max(59, Math.min(65, prev + change));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = (id: string) => {
    if (processingId) return;

    setProcessingId(id);
    setProgressWidth(0);

    // Simulate loading progress bar
    const progressInterval = setInterval(() => {
      setProgressWidth((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 150);

    setTimeout(() => {
      setApprovals((prev) =>
        prev.map((app) => {
          if (app.id === id) {
            return { ...app, status: "approved" };
          }
          return app;
        }),
      );

      const appRequest = approvals.find((a) => a.id === id);
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];

      setLogs((prev) => [
        ...prev,
        {
          timestamp: timeStr,
          type: "success",
          message: `Part 8 Approval [${id}] - ${appRequest?.scope} granted and executed successfully.`,
        },
      ]);

      // Update corresponding worker task
      if (id === "P8-B") {
        setWorkers((prev) =>
          prev.map((w) =>
            w.name === "OpenJarvis Kernel"
              ? {
                  ...w,
                  status: "thinking",
                  task: "ClawForge render pipeline triggered",
                }
              : w,
          ),
        );
      }

      setProcessingId(null);
      setProgressWidth(0);
    }, 1800);
  };

  const handleRouteTask = async () => {
    setIsRouting(true);
    setRoutingResult(null);
    const orchestrator = new OpenClawOrchestrator();

    setTimeout(async () => {
      const res = await orchestrator.route(routingInput);
      setRoutingResult(res);
      setIsRouting(false);

      setLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toTimeString().split(" ")[0],
          type: "info",
          message: `[OpenClaw Router] Routed task to: ${res.routedTo || "ollama"} (type: ${res.taskType})`,
        },
      ]);
    }, 1200);
  };

  const handleExecuteCommand = async () => {
    if (!terminalInput.trim()) return;
    setIsExecuting(true);
    const command = terminalInput;

    setTimeout(() => {
      setTerminalHistory((prev) => [
        ...prev,
        {
          cmd: command,
          out: "Blocked in browser guard. Mission Control will not execute local shell commands from the browser bundle. Route this through an approved localhost command bridge with audit logging before enabling execution.",
          type: "error",
        },
      ]);

      setLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toTimeString().split(" ")[0],
          type: "security",
          message: `[OpenHands Terminal Guard] Browser execution blocked for: "${command}"`,
        },
      ]);

      setIsExecuting(false);
      setTerminalInput("");
    }, 800);
  };

  const handleAuditCompliance = async () => {
    setIsAuditing(true);
    setComplianceResult(null);
    const gateway = new Gemma4Client({ timeout: 1500, retries: 1 });

    setTimeout(async () => {
      let gatewayStatus = "localhost-gateway-checked";
      const warnings: string[] = [];

      try {
        await gateway.checkCompliance({
          content: complianceInput,
          guidelines: { localBoundaries: true },
        });
      } catch {
        gatewayStatus = "browser-fallback";
        warnings.push(
          "Local compliance gateway unavailable; deterministic browser fallback was used.",
        );
      } finally {
        const input = complianceInput.toLowerCase();
        const compliant =
          !input.includes("external") &&
          !input.includes("cloud") &&
          !input.includes("deploy") &&
          !input.includes("push");
        const score = compliant ? 94 : 45;
        const issues = compliant
          ? []
          : [
              "Content refers to external or production mutation scopes.",
              "Cloud/deploy/push terms require approval-gated wording.",
            ];

        setComplianceResult({
          compliant,
          score,
          issues,
          warnings,
          gatewayStatus,
          recommendations: compliant
            ? ["Content adheres to local-first guidelines."]
            : [
                "Remove external endpoint mentions.",
                "Re-scope references to local mini M2 control parameters.",
                "Add a human approval gate before production mutation wording.",
              ],
        });

        setLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toTimeString().split(" ")[0],
            type: compliant ? "success" : "warn",
            message: `[Gemma Audit] Compliance score: ${score}% (Compliant: ${compliant}; source: ${gatewayStatus})`,
          },
        ]);
        setIsAuditing(false);
      }
    }, 1000);
  };

  const handleAuditEnvelope = () => {
    setIsAuditingEnvelope(true);
    setEnvelopeAuditResult(null);

    setTimeout(() => {
      try {
        const payload = JSON.parse(envelopeInput);
        const res = OrchestrationEnvelopeValidator.audit(payload);
        setEnvelopeAuditResult(res);

        setLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toTimeString().split(" ")[0],
            type: res.valid ? "success" : "security",
            message: `[Envelope Auditor] Envelope Audit completed. Valid: ${res.valid}`,
          },
        ]);
      } catch (err: any) {
        setEnvelopeAuditResult({
          valid: false,
          errors: [`JSON Syntax Error: ${err.message}`],
          remediation: ["Fix the malformed JSON formatting before auditing."],
        });
        setLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toTimeString().split(" ")[0],
            type: "security",
            message: `[Envelope Auditor] Audit failed due to invalid JSON syntax.`,
          },
        ]);
      }
      setIsAuditingEnvelope(false);
    }, 900);
  };

  const getIndicatorClass = (status: string) => {
    switch (status) {
      case "idle":
        return "indicator-dot";
      case "thinking":
        return "indicator-dot thinking";
      case "active":
        return "indicator-dot active";
      case "pending":
        return "indicator-dot pending";
      case "approved":
        return "indicator-dot active";
      case "blocked":
        return "indicator-dot blocked";
      default:
        return "indicator-dot";
    }
  };

  const getRiskClass = (risk: RiskLevel) => {
    switch (risk) {
      case "low":
        return "risk-low";
      case "medium":
        return "risk-medium";
      case "high":
        return "risk-high";
      default:
        return "risk-low";
    }
  };

  const getPacketStatusClass = (status: EvidencePacketItem["status"]) => {
    switch (status) {
      case "ready":
        return "packet-ready";
      case "needed":
        return "packet-needed";
      case "blocked":
        return "packet-blocked";
      default:
        return "packet-needed";
    }
  };

  const getPracticeStatusClass = (status: PracticeStatus) => {
    switch (status) {
      case "passing":
        return "practice-passing";
      case "ready":
        return "practice-ready";
      case "blocked":
        return "practice-blocked";
      default:
        return "practice-ready";
    }
  };

  const getPayloadReviewStatusClass = (status: PayloadReviewStatus) => {
    switch (status) {
      case "ready":
        return "payload-ready";
      case "blocked":
        return "payload-blocked";
      default:
        return "payload-blocked";
    }
  };

  const getBrokerDecisionClass = (decision: BrokerDecisionStatus) => {
    switch (decision) {
      case "auto_allow_dry_run":
        return "payload-ready";
      case "requires_executor_lease":
      case "policy_controlled_registry_allow":
        return "payload-warn";
      case "blocked_first_phase":
      case "blocked":
        return "payload-blocked";
      default:
        return "payload-blocked";
    }
  };

  const getGoalLaneStatusClass = (status: GoalLaneStatus) => {
    switch (status) {
      case "safe":
      case "ready":
        return "payload-ready";
      case "gated":
        return "payload-warn";
      case "blocked":
        return "payload-blocked";
      default:
        return "payload-blocked";
    }
  };

  const getCommandPacketStatusClass = (decision: string) => {
    switch (decision) {
      case "ready_dry_run_packet":
      case "ready_with_executor_lease":
        return "payload-ready";
      case "ready_plan_only_lease":
      case "preflight_required":
        return "payload-warn";
      default:
        return "payload-blocked";
    }
  };

  const getProductionDecisionClass = (decision: string) => {
    switch (decision) {
      case "ALLOW_READONLY":
      case "ALLOW_LOCAL_VALIDATION":
      case "ALLOW_SCOPED_WRITE":
        return "payload-ready";
      case "REQUIRE_HUMAN_REVIEW":
        return "payload-warn";
      default:
        return "payload-blocked";
    }
  };

  const getDependencyStatusClass = (
    status: A2A2ADependencyReadinessFixture["dependencyChecks"][number]["status"],
  ) => {
    switch (status) {
      case "ready":
        return "payload-ready";
      case "partial":
        return "payload-warn";
      case "missing":
      case "review":
        return "payload-blocked";
      default:
        return "payload-blocked";
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="header">
        <div className="header-title-section">
          <h1>🧭 SIRINXDev Monorepo</h1>
          <p>Local-First Control Node &bull; Mac mini M2</p>
        </div>
        <div className="system-badges">
          <div className="badge pulse-cyan">
            <span className={getIndicatorClass("thinking")}></span> Ollama
            Engine
          </div>
          <div className="badge pulse-emerald">
            <span className={getIndicatorClass("active")}></span> Guardrails
            Locked
          </div>
          <div className="badge pulse-rose">
            <span className={getIndicatorClass("blocked")}></span> External
            Blocked
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="main-grid">
        {/* Left Column - System Telemetry */}
        <section className="column">
          <div className="card">
            <div className="card-title">
              <span>M2 Node Status</span>
              <span className="accent-cyan">Active</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">CPU Usage</span>
              <span className="stat-value highlight">{cpuUsage}%</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">RAM Active</span>
              <span className="stat-value">{ramUsage}% (16GB Unified)</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Node Environment</span>
              <span className="stat-value">v26.0.0</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Active Port</span>
              <span className="stat-value highlight">3333</span>
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <span>Local AI Engine</span>
              <span className="accent-purple">Ollama</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Active Model</span>
              <span className="stat-value highlight">qwen3.5:2b</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Secondary Model</span>
              <span className="stat-value">deepseek-r1:1.5b</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">continuity status</span>
              <span className="stat-value">Ready</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">memory stats</span>
              <span className="stat-value">62 indexed notes</span>
            </div>
          </div>

          {/* thClaws Math Integration Card */}
          <div className="card">
            <div className="card-title">
              <span>thClaws Solar Math</span>
              <span className="accent-cyan">Active Engine</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Opal Energy Unit Price</span>
              <span className="stat-value highlight">
                {OPAL_SOLAR_PRICE_PER_UNIT} THB/Unit
              </span>
            </div>
            <div
              style={{
                marginTop: "0.4rem",
                borderTop: "1px solid var(--border-color)",
                paddingTop: "0.8rem",
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: "0.5rem",
                }}
              >
                Kelly Capital Criterion Optimizer
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.6rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <label
                    style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                  >
                    Net Odds (b):
                  </label>
                  <input
                    type="number"
                    value={kellyOdds}
                    onChange={(e) =>
                      setKellyOdds(
                        Math.max(0.1, parseFloat(e.target.value) || 0.1),
                      )
                    }
                    step="0.1"
                    style={{
                      width: "60px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid var(--border-color)",
                      color: "#fff",
                      borderRadius: "4px",
                      padding: "0.2rem",
                      fontFamily: "monospace",
                      textAlign: "right",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <label
                    style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                  >
                    Probability (p):
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={kellyProb}
                    onChange={(e) => setKellyProb(parseFloat(e.target.value))}
                    style={{ width: "100px", accentColor: "var(--cyber-cyan)" }}
                  />
                  <span
                    style={{ fontSize: "0.75rem", fontFamily: "monospace" }}
                  >
                    {(kellyProb * 100).toFixed(0)}%
                  </span>
                </div>
                <div
                  style={{
                    background: "rgba(0,240,255,0.05)",
                    border: "1px solid rgba(0,240,255,0.15)",
                    borderRadius: "6px",
                    padding: "0.5rem",
                    marginTop: "0.4rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--cyber-cyan)",
                    }}
                  >
                    Optimal Kelly Bet:
                  </span>
                  <span
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 800,
                      color: "var(--cyber-emerald)",
                      fontFamily: "monospace",
                    }}
                  >
                    {(kellyFraction * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Locked Hologram External Gate */}
          <div className="hologram-gate">
            <div className="lock-title">🔴 Production Mutation</div>
            <div className="lock-status">SECURITY LOCK: ENGAGED</div>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                lineHeight: "1.4",
              }}
            >
              Cloud mutations, wrangler deploy, and git pushes are hard-blocked
              at the command level until explicit Part 8 written authorization.
            </p>
          </div>
        </section>

        {/* Center Column - Worker Grid & Activity */}
        <section className="column">
          {/* Segmented Controller Tab Panel */}
          <div
            className="panel-tabs"
            role="tablist"
            aria-label="Mission Control panels"
          >
            <button
              className={`panel-tab ${activePanel === "telemetry" ? "active" : ""}`}
              onClick={() => setActivePanel("telemetry")}
              role="tab"
              aria-selected={activePanel === "telemetry"}
            >
              Telemetry
            </button>
            <button
              className={`panel-tab ${activePanel === "testbenches" ? "active" : ""}`}
              onClick={() => setActivePanel("testbenches")}
              role="tab"
              aria-selected={activePanel === "testbenches"}
            >
              Test Benches
            </button>
            <button
              className={`panel-tab ${activePanel === "igamingPractice" ? "active" : ""}`}
              onClick={() => setActivePanel("igamingPractice")}
              role="tab"
              aria-selected={activePanel === "igamingPractice"}
            >
              iGaming Lab
            </button>
            <button
              className={`panel-tab ${activePanel === "gitEvidence" ? "active" : ""}`}
              onClick={() => setActivePanel("gitEvidence")}
              role="tab"
              aria-selected={activePanel === "gitEvidence"}
            >
              Git Evidence
            </button>
            <button
              className={`panel-tab ${activePanel === "goalPlan" ? "active" : ""}`}
              onClick={() => setActivePanel("goalPlan")}
              role="tab"
              aria-selected={activePanel === "goalPlan"}
            >
              Goal Plan
            </button>
            <button
              className={`panel-tab ${activePanel === "codeReview" ? "active" : ""}`}
              onClick={() => setActivePanel("codeReview")}
              role="tab"
              aria-selected={activePanel === "codeReview"}
            >
              Code Review
            </button>
            <button
              className={`panel-tab ${activePanel === "toolMatrix" ? "active" : ""}`}
              onClick={() => setActivePanel("toolMatrix")}
              role="tab"
              aria-selected={activePanel === "toolMatrix"}
            >
              Tool Matrix
            </button>
            <button
              className={`panel-tab ${activePanel === "webDeploy" ? "active" : ""}`}
              onClick={() => setActivePanel("webDeploy")}
              role="tab"
              aria-selected={activePanel === "webDeploy"}
            >
              Web Deploy
            </button>
            <button
              className={`panel-tab ${activePanel === "commandPacket" ? "active" : ""}`}
              onClick={() => setActivePanel("commandPacket")}
              role="tab"
              aria-selected={activePanel === "commandPacket"}
            >
              Command Packet
            </button>
            <button
              className={`panel-tab ${
                activePanel === "commandBrokerProduction" ? "active" : ""
              }`}
              onClick={() => setActivePanel("commandBrokerProduction")}
              role="tab"
              aria-selected={activePanel === "commandBrokerProduction"}
            >
              Command Broker
            </button>
            <button
              className={`panel-tab ${activePanel === "sessionToolkit" ? "active" : ""}`}
              onClick={() => setActivePanel("sessionToolkit")}
              role="tab"
              aria-selected={activePanel === "sessionToolkit"}
            >
              Session Toolkit
            </button>
            <button
              className={`panel-tab ${activePanel === "a2a2aRunner" ? "active" : ""}`}
              onClick={() => setActivePanel("a2a2aRunner")}
              role="tab"
              aria-selected={activePanel === "a2a2aRunner"}
            >
              A2A2A Runner
            </button>
            <button
              className={`panel-tab ${activePanel === "deepResearch" ? "active" : ""}`}
              onClick={() => setActivePanel("deepResearch")}
              role="tab"
              aria-selected={activePanel === "deepResearch"}
            >
              Deep Research
            </button>
            <button
              className={`panel-tab ${activePanel === "toolPayloads" ? "active" : ""}`}
              onClick={() => setActivePanel("toolPayloads")}
              role="tab"
              aria-selected={activePanel === "toolPayloads"}
            >
              Tool Payloads
            </button>
          </div>

          {activePanel === "telemetry" ? (
            <>
              <div className="card">
                <div className="card-title">
                  <span>Active Agent Workers</span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "lowercase",
                      color: "var(--text-muted)",
                    }}
                  >
                    local threads only
                  </span>
                </div>
                <div className="agents-grid">
                  {workers.map((w, idx) => (
                    <div className="agent-node" key={idx}>
                      <div className="agent-header">
                        <span className="agent-name">{w.name}</span>
                        <span className={getIndicatorClass(w.status)}></span>
                      </div>
                      <div className="agent-status">{w.type}</div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          marginTop: "0.2rem",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {w.task}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Approvals Panel */}
              <div className="card">
                <div className="card-title">
                  <span>P8 Gate Approval Queue</span>
                  <span className="accent-cyan">Action Required</span>
                </div>
                <div className="approval-list">
                  {approvals.map((app) => (
                    <div className="approval-item" key={app.id}>
                      <div className="approval-header">
                        <span className="approval-scope">{app.scope}</span>
                        <span className="approval-badge">{app.id}</span>
                      </div>
                      <div className="approval-desc">{app.desc}</div>

                      {processingId === app.id && (
                        <div style={{ marginTop: "0.4rem" }}>
                          <div
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--cyber-cyan)",
                              marginBottom: "0.2rem",
                              fontFamily: "monospace",
                            }}
                          >
                            EXECUTING OPERATION [P8-GATE]...
                          </div>
                          <div className="progress-bar-container">
                            <div
                              className="progress-bar"
                              style={{ width: `${progressWidth}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="approval-actions">
                        {app.status === "pending" ? (
                          <>
                            <button
                              className="btn btn-cyan"
                              onClick={() => handleApprove(app.id)}
                              disabled={processingId !== null}
                            >
                              Approve Action
                            </button>
                            <button
                              className="btn btn-outline"
                              disabled={processingId !== null}
                            >
                              View Details
                            </button>
                          </>
                        ) : app.status === "approved" ? (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--cyber-emerald)",
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              gap: "0.4rem",
                            }}
                          >
                            ✓ STATUS: APPROVED & COMMITTED LOCALLY
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--cyber-rose)",
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              gap: "0.4rem",
                            }}
                          >
                            ❌ STATUS: LOCKED BY WORKSPACE SECURITY RULES
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : activePanel === "igamingPractice" ? (
            <>
              <div className="card practice-card">
                <div className="card-title">
                  <span>iGaming Toy Ledger Kata</span>
                  <span className="accent-cyan">Sandbox Only</span>
                </div>

                <div className="practice-summary-grid">
                  <div className="practice-kpi">
                    <span>Practice Pack</span>
                    <strong>READY</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Ledger Tests</span>
                    <strong>
                      {igamingPracticeStatus.ledgerTests.total}{" "}
                      {igamingPracticeStatus.ledgerTests.status.toUpperCase()}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>SQL Schema</span>
                    <strong>SANDBOX</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Live Money</span>
                    <strong>BLOCKED</strong>
                  </div>
                </div>

                <div className="practice-manifest-line">
                  <span>Fixture</span>
                  <code>{igamingPracticeStatus.mode}</code>
                  <span>Updated</span>
                  <code>{igamingPracticeStatus.updatedAt}</code>
                  <span>Command</span>
                  <code>{igamingPracticeStatus.ledgerTests.command}</code>
                </div>

                <div className="git-fixture-notice">
                  This panel is a local interview/practice surface. It does not
                  connect to live payments, gambling providers, service-role
                  keys, or public endpoints.
                </div>

                <div className="practice-grid">
                  <section className="practice-artifacts">
                    <div className="git-section-title">
                      <span>Practice Artifacts</span>
                      <span className="approval-badge">local-files</span>
                    </div>
                    {igamingPracticeArtifacts.map((artifact) => (
                      <div
                        className="practice-artifact-row"
                        key={artifact.path}
                      >
                        <span
                          className={`practice-status ${getPracticeStatusClass(artifact.status)}`}
                        >
                          {artifact.status}
                        </span>
                        <div>
                          <strong>{artifact.label}</strong>
                          <p>{artifact.detail}</p>
                          <code>{artifact.path}</code>
                        </div>
                      </div>
                    ))}
                  </section>

                  <section className="practice-artifacts">
                    <div className="git-section-title">
                      <span>Ledger Test Status</span>
                      <span className="approval-badge">vitest</span>
                    </div>
                    {ledgerTestChecks.map((check) => (
                      <div className="practice-artifact-row" key={check.label}>
                        <span
                          className={`practice-status ${getPracticeStatusClass(check.status)}`}
                        >
                          {check.status}
                        </span>
                        <div>
                          <strong>{check.label}</strong>
                          <p>{check.detail}</p>
                        </div>
                      </div>
                    ))}
                  </section>
                </div>
              </div>

              <div className="card practice-card">
                <div className="card-title">
                  <span>Worker Report Digest</span>
                  <span className="accent-emerald">
                    {a2a2aWorkerReportDigest.summary.overallStatus}
                  </span>
                </div>

                <div className="practice-summary-grid">
                  <div className="practice-kpi">
                    <span>Reports</span>
                    <strong>{a2a2aWorkerReportDigest.summary.reports}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Workers</span>
                    <strong>
                      {a2a2aWorkerReportDigest.summary.workerReports}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>KOB</span>
                    <strong>
                      {a2a2aWorkerReportDigest.summary.kobReports}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Safe Reports</span>
                    <strong>
                      {a2a2aWorkerReportDigest.summary.safeReports}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Provider Calls</span>
                    <strong>
                      {a2a2aWorkerReportDigest.summary.providerCalls}
                    </strong>
                  </div>
                </div>

                <div className="practice-manifest-line">
                  <span>Mode</span>
                  <code>{a2a2aWorkerReportDigest.mode}</code>
                  <span>Source</span>
                  <code>{a2a2aWorkerReportDigest.sourceGlob}</code>
                  <span>Updated</span>
                  <code>{a2a2aWorkerReportDigest.updatedAt}</code>
                </div>

                <div className="git-fixture-notice">
                  This digest is generated from local worker outbox files. It is
                  read-only and does not execute worker commands, call
                  providers, mutate git, or expose prompt bodies.
                </div>

                <div className="practice-grid">
                  <section
                    className="practice-artifacts"
                    aria-label="A2A2A worker report cards"
                  >
                    <div className="git-section-title">
                      <span>Worker Reports</span>
                      <span className="approval-badge">
                        {a2a2aWorkerReportDigest.reports.length}
                      </span>
                    </div>
                    {a2a2aWorkerReportDigest.reports.map((report) => (
                      <div className="practice-artifact-row" key={report.path}>
                        <span
                          className={`practice-status ${
                            report.providerCall || report.requiresHumanReview
                              ? "payload-warn"
                              : "payload-ready"
                          }`}
                        >
                          {report.role}
                        </span>
                        <div>
                          <strong>
                            {report.taskId} → {report.nextOwner || "queue"}
                          </strong>
                          <p>{report.summary}</p>
                          <code>
                            {report.model} · providerCall=
                            {String(report.providerCall)}
                          </code>
                          <div className="blocked-action-list compact-list">
                            {report.plannedActions.map((action) => (
                              <span
                                className="blocked-action payload-ready"
                                key={`${report.taskId}-${action}`}
                              >
                                {action}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </section>

                  <section
                    className="practice-artifacts"
                    aria-label="A2A2A worker report policy"
                  >
                    <div className="git-section-title">
                      <span>Report Policy</span>
                      <span className="approval-badge">
                        {a2a2aWorkerReportDigest.policyBoundary.length}
                      </span>
                    </div>
                    <div className="blocked-action-list">
                      {a2a2aWorkerReportDigest.policyBoundary.map((item) => (
                        <span
                          className="blocked-action payload-ready"
                          key={item}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                    <div className="practice-artifacts compact-list">
                      {a2a2aWorkerReportDigest.nextSafeActions.map((action) => (
                        <div className="practice-artifact-row" key={action}>
                          <span className="practice-status payload-ready">
                            next
                          </span>
                          <div>
                            <strong>{action}</strong>
                            <p>Keep worker reports local and reviewable.</p>
                            <code>{a2a2aWorkerReportDigest.generatedBy}</code>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>

              <div className="card practice-card">
                <div className="card-title">
                  <span>Implementation Lane Packet</span>
                  <span className="accent-cyan">
                    {a2a2aImplementationLanePacket.summary.status}
                  </span>
                </div>

                <div className="practice-summary-grid">
                  <div className="practice-kpi">
                    <span>Dependencies</span>
                    <strong>
                      {a2a2aImplementationLanePacket.summary.dependencies}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Blocked</span>
                    <strong>
                      {
                        a2a2aImplementationLanePacket.summary
                          .blockedDependencies
                      }
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Missing</span>
                    <strong>
                      {
                        a2a2aImplementationLanePacket.summary
                          .missingDependencies
                      }
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Worker Evidence</span>
                    <strong>
                      {a2a2aImplementationLanePacket.summary.workerEvidence}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Provider Calls</span>
                    <strong>
                      {a2a2aImplementationLanePacket.summary.providerCalls}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Execution</span>
                    <strong>
                      {a2a2aImplementationLanePacket.summary.executionAllowed
                        ? "ALLOW"
                        : "REVIEW ONLY"}
                    </strong>
                  </div>
                </div>

                <div className="practice-manifest-line">
                  <span>Lane</span>
                  <code>{a2a2aImplementationLanePacket.packet.laneId}</code>
                  <span>Packet</span>
                  <code>{a2a2aImplementationLanePacket.packet.packetId}</code>
                  <span>Updated</span>
                  <code>{a2a2aImplementationLanePacket.updatedAt}</code>
                </div>

                <div className="git-fixture-notice">
                  {a2a2aImplementationLanePacket.packet.objective} This packet
                  turns the plan and worker reports into an ordered Codex lane.
                  It remains review-only and does not grant execution.
                </div>

                <div className="practice-grid">
                  <section
                    className="practice-artifacts"
                    aria-label="A2A2A implementation dependencies"
                  >
                    <div className="git-section-title">
                      <span>Dependency Gate</span>
                      <span className="approval-badge">
                        {
                          a2a2aImplementationLanePacket.packet.dependencyGate
                            .length
                        }
                      </span>
                    </div>
                    {a2a2aImplementationLanePacket.packet.dependencyGate.map(
                      (dependency) => (
                        <div
                          className="practice-artifact-row"
                          key={dependency.id}
                        >
                          <span
                            className={`practice-status ${
                              dependency.status === "ready"
                                ? "payload-ready"
                                : "payload-warn"
                            }`}
                          >
                            {dependency.owner}
                          </span>
                          <div>
                            <strong>{dependency.id}</strong>
                            <p>{dependency.evidence}</p>
                            <code>{dependency.status}</code>
                          </div>
                        </div>
                      ),
                    )}
                  </section>

                  <section
                    className="practice-artifacts"
                    aria-label="A2A2A implementation priority work"
                  >
                    <div className="git-section-title">
                      <span>Priority Work Items</span>
                      <span className="approval-badge">
                        {
                          a2a2aImplementationLanePacket.packet.priorityWorkItems
                            .length
                        }
                      </span>
                    </div>
                    {a2a2aImplementationLanePacket.packet.priorityWorkItems.map(
                      (item) => (
                        <div
                          className="practice-artifact-row"
                          key={`${item.priority}-${item.task}`}
                        >
                          <span className="practice-status payload-ready">
                            P{item.priority}
                          </span>
                          <div>
                            <strong>
                              {item.owner}: {item.task}
                            </strong>
                            <p>{item.why}</p>
                            <code>{item.acceptance}</code>
                          </div>
                        </div>
                      ),
                    )}
                  </section>
                </div>

                <div className="practice-grid">
                  <section
                    className="practice-artifacts"
                    aria-label="A2A2A implementation validation"
                  >
                    <div className="git-section-title">
                      <span>Validation Commands</span>
                      <span className="approval-badge">
                        {
                          a2a2aImplementationLanePacket.packet
                            .validationCommands.length
                        }
                      </span>
                    </div>
                    {a2a2aImplementationLanePacket.packet.validationCommands.map(
                      (command) => (
                        <div className="practice-artifact-row" key={command}>
                          <span className="practice-status payload-ready">
                            check
                          </span>
                          <div>
                            <strong>local validation</strong>
                            <p>Run before any scoped stage or commit.</p>
                            <code>{command}</code>
                          </div>
                        </div>
                      ),
                    )}
                  </section>

                  <section
                    className="practice-artifacts"
                    aria-label="A2A2A implementation boundaries"
                  >
                    <div className="git-section-title">
                      <span>Stage + Blocks</span>
                      <span className="approval-badge">
                        {
                          a2a2aImplementationLanePacket.packet.blockedActions
                            .length
                        }
                      </span>
                    </div>
                    <div className="practice-artifact-row">
                      <span className="practice-status payload-ready">
                        stage
                      </span>
                      <div>
                        <strong>Scoped stage command</strong>
                        <p>Do not use git add dot.</p>
                        <code>
                          {a2a2aImplementationLanePacket.packet.scopedStageCommand.join(
                            " ",
                          )}
                        </code>
                      </div>
                    </div>
                    <div className="blocked-action-list">
                      {a2a2aImplementationLanePacket.packet.blockedActions.map(
                        (action) => (
                          <span
                            className="blocked-action payload-blocked"
                            key={action}
                          >
                            {action}
                          </span>
                        ),
                      )}
                    </div>
                  </section>
                </div>
              </div>

              <div className="card practice-card">
                <div className="card-title">
                  <span>A2A2A Completion Audit</span>
                  <span className="accent-emerald">
                    {a2a2aCompletionAudit.summary.overallStatus}
                  </span>
                </div>

                <div className="practice-summary-grid">
                  <div className="practice-kpi">
                    <span>Requirements</span>
                    <strong>{a2a2aCompletionAudit.summary.requirements}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Passed</span>
                    <strong>{a2a2aCompletionAudit.summary.passed}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Failed</span>
                    <strong>{a2a2aCompletionAudit.summary.failed}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Roles</span>
                    <strong>{a2a2aCompletionAudit.summary.roles}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Workers</span>
                    <strong>
                      {a2a2aCompletionAudit.summary.workerReports}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Provider Calls</span>
                    <strong>
                      {a2a2aCompletionAudit.summary.providerCalls}
                    </strong>
                  </div>
                </div>

                <div className="practice-manifest-line">
                  <span>Mode</span>
                  <code>{a2a2aCompletionAudit.mode}</code>
                  <span>Runtime Report</span>
                  <code>{a2a2aCompletionAudit.runtimeReportPath}</code>
                  <span>Updated</span>
                  <code>{a2a2aCompletionAudit.updatedAt}</code>
                </div>

                <div className="practice-grid">
                  <section
                    className="practice-artifacts"
                    aria-label="A2A2A completion audit checks"
                  >
                    <div className="git-section-title">
                      <span>Completion Checks</span>
                      <span className="approval-badge">
                        {a2a2aCompletionAudit.checks.length}
                      </span>
                    </div>
                    {a2a2aCompletionAudit.checks.map((check) => (
                      <div className="practice-artifact-row" key={check.id}>
                        <span
                          className={`practice-status ${
                            check.status === "pass"
                              ? "payload-ready"
                              : "payload-blocked"
                          }`}
                        >
                          {check.status}
                        </span>
                        <div>
                          <strong>{check.label}</strong>
                          <p>{check.evidence}</p>
                          <code>{check.nextAction}</code>
                        </div>
                      </div>
                    ))}
                  </section>

                  <section
                    className="practice-artifacts"
                    aria-label="A2A2A next priority sequence"
                  >
                    <div className="git-section-title">
                      <span>Priority Sequence</span>
                      <span className="approval-badge">
                        {a2a2aCompletionAudit.prioritySequence.length}
                      </span>
                    </div>
                    {a2a2aCompletionAudit.prioritySequence.map((action) => (
                      <div className="practice-artifact-row" key={action}>
                        <span className="practice-status payload-ready">
                          next
                        </span>
                        <div>
                          <strong>{action}</strong>
                          <p>Keep this lane fixture-backed and reviewable.</p>
                          <code>{a2a2aCompletionAudit.generatedBy}</code>
                        </div>
                      </div>
                    ))}
                  </section>
                </div>
              </div>

              <div className="card practice-card">
                <div className="card-title">
                  <span>First Codex Implementation Lane</span>
                  <span className="accent-cyan">
                    {a2a2aFirstCodexImplementationLane.summary.status}
                  </span>
                </div>

                <div className="practice-summary-grid">
                  <div className="practice-kpi">
                    <span>Tasks</span>
                    <strong>
                      {a2a2aFirstCodexImplementationLane.summary.tasks}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Codex Tasks</span>
                    <strong>
                      {
                        a2a2aFirstCodexImplementationLane.summary
                          .codexReadyTasks
                      }
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Report Inputs</span>
                    <strong>
                      {
                        a2a2aFirstCodexImplementationLane.summary
                          .reportInputTasks
                      }
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Codex Edits</span>
                    <strong>
                      {a2a2aFirstCodexImplementationLane.summary
                        .codexFileEditsAllowed
                        ? "SCOPED"
                        : "BLOCKED"}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Workers Edit</span>
                    <strong>
                      {a2a2aFirstCodexImplementationLane.summary
                        .workerDirectEditsAllowed
                        ? "ALLOW"
                        : "NO"}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Provider Calls</span>
                    <strong>
                      {a2a2aFirstCodexImplementationLane.summary
                        .providerCallsAllowed
                        ? "ALLOW"
                        : "NO"}
                    </strong>
                  </div>
                </div>

                <div className="practice-manifest-line">
                  <span>Lane</span>
                  <code>{a2a2aFirstCodexImplementationLane.lane.laneId}</code>
                  <span>Git Owner</span>
                  <code>{a2a2aFirstCodexImplementationLane.lane.gitOwner}</code>
                  <span>Runtime</span>
                  <code>
                    {a2a2aFirstCodexImplementationLane.runtimeLanePath}
                  </code>
                </div>

                <div className="git-fixture-notice">
                  {a2a2aFirstCodexImplementationLane.lane.objective} This lane
                  opens scoped Codex file edits only; workers remain
                  report-only.
                </div>

                <div className="practice-grid">
                  <section
                    className="practice-artifacts"
                    aria-label="First Codex implementation lane tasks"
                  >
                    <div className="git-section-title">
                      <span>Lane Tasks</span>
                      <span className="approval-badge">
                        {a2a2aFirstCodexImplementationLane.lane.tasks.length}
                      </span>
                    </div>
                    {a2a2aFirstCodexImplementationLane.lane.tasks.map(
                      (task) => (
                        <div
                          className="practice-artifact-row"
                          key={task.taskId}
                        >
                          <span
                            className={`practice-status ${
                              task.status === "ready_for_codex"
                                ? "payload-ready"
                                : "payload-warn"
                            }`}
                          >
                            P{task.priority}
                          </span>
                          <div>
                            <strong>
                              {task.owner}: {task.name}
                            </strong>
                            <p>{task.why}</p>
                            <code>{task.acceptance}</code>
                          </div>
                        </div>
                      ),
                    )}
                  </section>

                  <section
                    className="practice-artifacts"
                    aria-label="First Codex implementation lane boundaries"
                  >
                    <div className="git-section-title">
                      <span>Scope Boundary</span>
                      <span className="approval-badge">
                        {
                          a2a2aFirstCodexImplementationLane.lane.allowedPaths
                            .length
                        }
                      </span>
                    </div>
                    <div className="blocked-action-list">
                      {a2a2aFirstCodexImplementationLane.lane.allowedPaths.map(
                        (path) => (
                          <span
                            className="blocked-action payload-ready"
                            key={path}
                          >
                            {path}
                          </span>
                        ),
                      )}
                      {a2a2aFirstCodexImplementationLane.lane.blockedPaths.map(
                        (path) => (
                          <span
                            className="blocked-action payload-blocked"
                            key={path}
                          >
                            {path}
                          </span>
                        ),
                      )}
                    </div>
                    <div className="practice-artifact-row">
                      <span className="practice-status payload-ready">
                        stage
                      </span>
                      <div>
                        <strong>Scoped stage command</strong>
                        <p>Codex owns staging after validation only.</p>
                        <code>
                          {a2a2aFirstCodexImplementationLane.lane.scopedStageCommand.join(
                            " ",
                          )}
                        </code>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <div className="card practice-card">
                <div className="card-title">
                  <span>A2A2A Team Assignment</span>
                  <span className="accent-cyan">
                    {a2a2aTeamAssignmentBoard.summary.status}
                  </span>
                </div>

                <div className="practice-summary-grid">
                  <div className="practice-kpi">
                    <span>Roles</span>
                    <strong>{a2a2aTeamAssignmentBoard.summary.roles}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Queue</span>
                    <strong>
                      {a2a2aTeamAssignmentBoard.summary.immediateQueueItems}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Codex Tasks</span>
                    <strong>
                      {a2a2aTeamAssignmentBoard.summary.codexReadyTasks}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Report Inputs</span>
                    <strong>
                      {a2a2aTeamAssignmentBoard.summary.reportOnlyWorkerTasks}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>P0 / P1</span>
                    <strong>
                      {a2a2aTeamAssignmentBoard.summary.backlogP0}/
                      {a2a2aTeamAssignmentBoard.summary.backlogP1}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Blocked</span>
                    <strong>
                      {a2a2aTeamAssignmentBoard.summary.blockedGates}
                    </strong>
                  </div>
                </div>

                <div className="practice-manifest-line">
                  <span>Next Codex</span>
                  <code>{a2a2aTeamAssignmentBoard.nextCodexAction.task}</code>
                  <span>Runtime Report</span>
                  <code>{a2a2aTeamAssignmentBoard.runtimeReportPath}</code>
                  <span>Updated</span>
                  <code>{a2a2aTeamAssignmentBoard.updatedAt}</code>
                </div>

                <div className="git-fixture-notice">
                  {a2a2aTeamAssignmentBoard.nextCodexAction.why} Acceptance:
                  {` ${a2a2aTeamAssignmentBoard.nextCodexAction.acceptance}`}
                </div>

                <div className="practice-grid">
                  <section
                    className="practice-artifacts"
                    aria-label="A2A2A team assignment immediate queue"
                  >
                    <div className="git-section-title">
                      <span>Immediate Queue</span>
                      <span className="approval-badge">
                        {a2a2aTeamAssignmentBoard.immediateQueue.length}
                      </span>
                    </div>
                    {a2a2aTeamAssignmentBoard.immediateQueue
                      .slice(0, 8)
                      .map((item) => (
                        <div
                          className="practice-artifact-row"
                          key={item.queueId}
                        >
                          <span
                            className={`practice-status ${
                              item.owner === "codex"
                                ? "payload-ready"
                                : item.status === "blocked"
                                  ? "payload-blocked"
                                  : "payload-warn"
                            }`}
                          >
                            P{item.priority}
                          </span>
                          <div>
                            <strong>
                              {item.owner}: {item.task}
                            </strong>
                            <p>{item.why}</p>
                            <code>{item.acceptance}</code>
                          </div>
                        </div>
                      ))}
                  </section>

                  <section
                    className="practice-artifacts"
                    aria-label="A2A2A team role map"
                  >
                    <div className="git-section-title">
                      <span>Role Map</span>
                      <span className="approval-badge">
                        {a2a2aTeamAssignmentBoard.roles.length}
                      </span>
                    </div>
                    {a2a2aTeamAssignmentBoard.roles.map((role) => (
                      <div className="practice-artifact-row" key={role.role}>
                        <span
                          className={`practice-status ${
                            role.editRights === "scoped_repo_owner"
                              ? "payload-ready"
                              : role.editRights === "read_only_fixture"
                                ? "payload-ready"
                                : "payload-warn"
                          }`}
                        >
                          {role.editRights}
                        </span>
                        <div>
                          <strong>
                            {role.role}: {role.title}
                          </strong>
                          <p>{role.responsibility}</p>
                          <code>{role.currentAction}</code>
                        </div>
                      </div>
                    ))}
                  </section>
                </div>
              </div>

              <div className="card practice-card">
                <div className="card-title">
                  <span>A2A2A Backlog Priority</span>
                  <span className="accent-emerald">
                    {a2a2aBacklogPriority.summary.readyForReview} ready
                  </span>
                </div>

                <div className="practice-summary-grid">
                  <div className="practice-kpi">
                    <span>Pending</span>
                    <strong>{a2a2aBacklogPriority.summary.totalPending}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>P0</span>
                    <strong>{a2a2aBacklogPriority.summary.p0}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>P1</span>
                    <strong>{a2a2aBacklogPriority.summary.p1}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>P2</span>
                    <strong>{a2a2aBacklogPriority.summary.p2}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Blocked</span>
                    <strong>{a2a2aBacklogPriority.summary.blocked}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Owners</span>
                    <strong>{a2a2aBacklogPriority.summary.owners}</strong>
                  </div>
                </div>

                <div className="practice-manifest-line">
                  <span>Source</span>
                  <code>{a2a2aBacklogPriority.sourcePath}</code>
                  <span>Runtime Report</span>
                  <code>{a2a2aBacklogPriority.runtimeReportPath}</code>
                  <span>Updated</span>
                  <code>{a2a2aBacklogPriority.updatedAt}</code>
                </div>

                <div className="practice-grid">
                  <section
                    className="practice-artifacts"
                    aria-label="A2A2A backlog top priority items"
                  >
                    <div className="git-section-title">
                      <span>Top Priority Items</span>
                      <span className="approval-badge">
                        {a2a2aBacklogPriority.topItems.length}
                      </span>
                    </div>
                    {a2a2aBacklogPriority.topItems.slice(0, 8).map((item) => (
                      <div className="practice-artifact-row" key={item.id}>
                        <span
                          className={`practice-status ${
                            item.status === "blocked"
                              ? "payload-blocked"
                              : item.priority === 0
                                ? "payload-ready"
                                : "payload-warn"
                          }`}
                        >
                          P{item.priority}
                        </span>
                        <div>
                          <strong>
                            {item.owner}: {item.task}
                          </strong>
                          <p>
                            {item.section}
                            {item.subsection ? ` / ${item.subsection}` : ""} -
                            line {item.line}
                          </p>
                          <code>{item.nextAction}</code>
                        </div>
                      </div>
                    ))}
                  </section>

                  <section
                    className="practice-artifacts"
                    aria-label="A2A2A backlog owner and blocked gates"
                  >
                    <div className="git-section-title">
                      <span>Owners / Gates</span>
                      <span className="approval-badge">
                        {a2a2aBacklogPriority.ownerCounts.length}
                      </span>
                    </div>
                    <div className="blocked-action-list">
                      {a2a2aBacklogPriority.ownerCounts.map((owner) => (
                        <span
                          className="blocked-action payload-ready"
                          key={owner.owner}
                        >
                          {owner.owner}: {owner.count}
                        </span>
                      ))}
                    </div>
                    {a2a2aBacklogPriority.blockedGates
                      .slice(0, 5)
                      .map((item) => (
                        <div className="practice-artifact-row" key={item.id}>
                          <span className="practice-status payload-blocked">
                            gate
                          </span>
                          <div>
                            <strong>{item.task}</strong>
                            <p>{item.blockedReason}</p>
                            <code>{item.nextAction}</code>
                          </div>
                        </div>
                      ))}
                  </section>
                </div>
              </div>

              <div className="practice-lower-grid">
                <div className="card">
                  <div className="card-title">
                    <span>Mock Interview Pack</span>
                    <span className="accent-purple">interview_quiz.csv</span>
                  </div>
                  <div className="mock-interview-list">
                    {mockInterviewRows.map((row) => (
                      <div className="mock-interview-row" key={row.topic}>
                        <span className="approval-badge">{row.topic}</span>
                        <div>
                          <strong>{row.question}</strong>
                          <p>{row.expectedSignal}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">
                    <span>Hard Boundary</span>
                    <span className="accent-emerald">Practice Safe</span>
                  </div>
                  <div className="blocked-action-list">
                    {igamingBoundaryBlocks.map((action) => (
                      <span className="blocked-action" key={action}>
                        {action}
                      </span>
                    ))}
                  </div>
                  <div className="approval-state-grid practice-boundary-grid">
                    <div>
                      <span>Currency</span>
                      <strong>TEST ONLY</strong>
                    </div>
                    <div>
                      <span>Data</span>
                      <strong>SYNTHETIC</strong>
                    </div>
                    <div>
                      <span>Provider</span>
                      <strong>NONE</strong>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : activePanel === "gitEvidence" ? (
            <>
              <div className="card git-evidence-card">
                <div className="card-title">
                  <span>Git Evidence Review</span>
                  <span className="accent-cyan">Static Fixture</span>
                </div>

                <div className="git-evidence-summary">
                  <div className="git-kpi">
                    <span>Branch</span>
                    <strong>feat/unified-agent-native-monorepo</strong>
                  </div>
                  <div className="git-kpi">
                    <span>Mode</span>
                    <strong>LOCAL ONLY</strong>
                  </div>
                  <div className="git-kpi">
                    <span>Example Files</span>
                    <strong>{gitEvidenceFiles.length}</strong>
                  </div>
                  <div className="git-kpi">
                    <span>Data Source</span>
                    <strong>FIXTURE ONLY</strong>
                  </div>
                </div>

                <div className="git-fixture-notice">
                  {GIT_EVIDENCE_FIXTURE_NOTICE}
                </div>

                <div className="git-evidence-grid">
                  <section className="git-file-list" aria-label="Changed files">
                    <div className="git-section-title">
                      <span>Example Files</span>
                      <span className="approval-badge">fixture-data</span>
                    </div>
                    {gitEvidenceFiles.map((file) => (
                      <button
                        key={file.path}
                        className={`git-file-row ${selectedGitEvidenceFile.path === file.path ? "selected" : ""}`}
                        onClick={() => setSelectedGitFilePath(file.path)}
                        aria-pressed={
                          selectedGitEvidenceFile.path === file.path
                        }
                      >
                        <span className="git-file-path" title={file.path}>
                          {file.path}
                        </span>
                        <span className="git-file-meta">
                          <span className={`git-status status-${file.status}`}>
                            {file.status}
                          </span>
                          <span
                            className={`risk-pill ${getRiskClass(file.risk)}`}
                          >
                            {file.risk}
                          </span>
                          <span className="proof-pill">{file.proofStatus}</span>
                        </span>
                      </button>
                    ))}
                  </section>

                  <section
                    className="diff-viewer"
                    aria-label="Selected file diff"
                  >
                    <div className="diff-header">
                      <div>
                        <span className="diff-title">
                          {selectedGitEvidenceFile.path}
                        </span>
                        <p>{selectedGitEvidenceFile.summary}</p>
                      </div>
                      <span className="approval-badge">
                        {selectedGitEvidenceFile.evidenceId}
                      </span>
                    </div>
                    <div className="diff-lines">
                      {selectedGitEvidenceFile.diff.map((line, index) => (
                        <div
                          className={`diff-line diff-${line.type}`}
                          key={`${line.type}-${index}`}
                        >
                          <span className="diff-line-number">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <code>{line.line}</code>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>

              <div className="git-evidence-lower-grid">
                <div className="card">
                  <div className="card-title">
                    <span>Evidence Packet</span>
                    <span className="accent-purple">Fixture</span>
                  </div>
                  <div className="evidence-checklist">
                    {evidencePacketItems.map((item) => (
                      <div className="evidence-check-row" key={item.label}>
                        <span
                          className={`packet-status ${getPacketStatusClass(item.status)}`}
                        >
                          {item.status.toUpperCase()}
                        </span>
                        <div>
                          <strong>{item.label}</strong>
                          <p>{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">
                    <span>Timeline Mapping</span>
                    <span className="accent-cyan">
                      {selectedGitEvidenceFile.timelineId}
                    </span>
                  </div>
                  <div className="version-history">
                    {versionHistoryItems.map((item) => (
                      <div className="version-history-row" key={item.ref}>
                        <span
                          className={`history-state history-${item.proofStatus.toLowerCase()}`}
                        >
                          {item.proofStatus}
                        </span>
                        <div>
                          <strong>{item.label}</strong>
                          <p>{item.detail}</p>
                          <code>{item.ref}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card git-approval-card">
                <div className="card-title">
                  <span>Approval Status</span>
                  <span className="accent-emerald">Ready For Verification</span>
                </div>
                <div className="approval-state-grid">
                  <div>
                    <span>Current Gate</span>
                    <strong>LOCAL_REVIEW_FIXTURE_ONLY</strong>
                  </div>
                  <div>
                    <span>Next Gate</span>
                    <strong>WIRE_LIVE_GIT_MANIFEST</strong>
                  </div>
                  <div>
                    <span>Proof Boundary</span>
                    <strong>LOCAL / EVIDENCED ONLY</strong>
                  </div>
                </div>
                <div className="blocked-action-list">
                  {[
                    "git push",
                    "deploy",
                    "external GitHub verification",
                    "provider call",
                  ].map((action) => (
                    <span className="blocked-action" key={action}>
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : activePanel === "goalPlan" ? (
            <>
              <div className="card practice-card">
                <div className="card-title">
                  <span>Codex Goal Plan Board</span>
                  <span className="accent-cyan">Local Only</span>
                </div>

                <div className="practice-summary-grid">
                  <div className="practice-kpi">
                    <span>Work Lanes</span>
                    <strong>{codexGoalPlanStatus.summary.workLaneCount}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Safe Next Actions</span>
                    <strong>
                      {codexGoalPlanStatus.summary.safeNextActionCount}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Unbound Connectors</span>
                    <strong>
                      {codexGoalPlanStatus.summary.connectorTargetsUnbound}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Blocked Actions</span>
                    <strong>
                      {codexGoalPlanStatus.summary.blockedActionCount}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Sanitized Actions</span>
                    <strong>
                      {codexGoalPlanStatus.summary.sanitizedRequestedActions}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Sanitized Blocks</span>
                    <strong>
                      {codexGoalPlanStatus.summary.sanitizedBlockedActions}
                    </strong>
                  </div>
                </div>

                <div className="practice-manifest-line">
                  <span>Mode</span>
                  <code>{codexGoalPlanStatus.mode}</code>
                  <span>Status</span>
                  <code>{codexGoalPlanStatus.summary.overallStatus}</code>
                  <span>Updated</span>
                  <code>{codexGoalPlanStatus.updatedAt}</code>
                </div>

                <div className="git-fixture-notice">
                  This board is a static fixture generated from local reports.
                  It does not unlock security, auto-approve every workflow, run
                  shell commands, read secrets, sync connectors, clone repos,
                  push, deploy, call providers, or expose public endpoints.
                </div>

                <div className="practice-grid">
                  <section
                    className="practice-artifacts"
                    aria-label="Codex goal plan work lanes"
                  >
                    <div className="git-section-title">
                      <span>Work Lanes</span>
                      <span className="approval-badge">policy-routed</span>
                    </div>
                    {goalPlanWorkLanes.map((lane) => (
                      <div className="practice-artifact-row" key={lane.id}>
                        <span
                          className={`practice-status ${getGoalLaneStatusClass(lane.status)}`}
                        >
                          {lane.status}
                        </span>
                        <div>
                          <strong>{lane.label}</strong>
                          <p>{lane.nextAction}</p>
                          <code>{lane.source}</code>
                        </div>
                      </div>
                    ))}
                  </section>

                  <section
                    className="practice-artifacts"
                    aria-label="Codex goal plan safe next actions"
                  >
                    <div className="git-section-title">
                      <span>Safe Next Actions</span>
                      <span className="approval-badge">dry-run first</span>
                    </div>
                    {goalPlanSafeNextActions.map((action) => (
                      <div className="practice-artifact-row" key={action}>
                        <span className="practice-status payload-ready">
                          safe
                        </span>
                        <div>
                          <strong>{action}</strong>
                          <p>
                            Route through KOB planning and Codex local execution
                            only when the broker allows the action class.
                          </p>
                        </div>
                      </div>
                    ))}
                  </section>
                </div>
              </div>

              <div className="practice-lower-grid">
                <div className="card">
                  <div className="card-title">
                    <span>Control Node</span>
                    <span className="accent-emerald">Mac mini M2</span>
                  </div>
                  <div className="approval-state-grid practice-boundary-grid">
                    <div>
                      <span>Route</span>
                      <strong>
                        {codexGoalPlanStatus.controlNode.executionRoute}
                      </strong>
                    </div>
                    <div>
                      <span>Registered Repos</span>
                      <strong>
                        {codexGoalPlanStatus.summary.registeredRepos}
                      </strong>
                    </div>
                    <div>
                      <span>Broker Decisions</span>
                      <strong>
                        {codexGoalPlanStatus.summary.brokerDecisions}
                      </strong>
                    </div>
                    <div>
                      <span>Repo Root</span>
                      <strong>
                        {codexGoalPlanStatus.controlNode.repoRoot}
                      </strong>
                    </div>
                    <div>
                      <span>Runtime Root</span>
                      <strong>
                        {codexGoalPlanStatus.controlNode.runtimeRoot}
                      </strong>
                    </div>
                    <div>
                      <span>Obsidian Digest</span>
                      <strong>
                        {codexGoalPlanStatus.controlNode.obsidianDigest}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">
                    <span>Blocked Boundary</span>
                    <span className="accent-purple">No Bypass</span>
                  </div>
                  <div className="blocked-action-list">
                    {[...goalPlanBlockedActions, ...goalPlanPolicyBoundary].map(
                      (action) => (
                        <span className="blocked-action" key={action}>
                          {action}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-title">
                  <span>Autonomous Execution Sanitizer</span>
                  <span className="accent-cyan">
                    {autonomousExecutionPolicyStatus.summary.status}
                  </span>
                </div>
                <div className="practice-summary-grid">
                  <div className="practice-kpi">
                    <span>Requested</span>
                    <strong>
                      {autonomousExecutionPolicyStatus.summary.requestedActions}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Dry Run</span>
                    <strong>
                      {autonomousExecutionPolicyStatus.summary.autoAllowDryRun}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Lease</span>
                    <strong>
                      {
                        autonomousExecutionPolicyStatus.summary
                          .requiresExecutorLease
                      }
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Hard Block</span>
                    <strong>
                      {autonomousExecutionPolicyStatus.summary.blocked}
                    </strong>
                  </div>
                </div>
                <div className="git-fixture-notice">
                  The approve-all YAML is treated as an input to sanitize, not
                  as an instruction to apply. This fixture is generated locally
                  and cannot execute tools from the browser.
                </div>
                <div className="blocked-action-list">
                  {autonomousPolicyBlockedSamples.slice(0, 16).map((item) => (
                    <span className="blocked-action" key={item.action}>
                      {item.action}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : activePanel === "codeReview" ? (
            <>
              <div className="card practice-card">
                <div className="card-title">
                  <span>Automated Code Review Workflow</span>
                  <span className="accent-cyan">Report Only</span>
                </div>

                <div className="practice-summary-grid">
                  <div className="practice-kpi">
                    <span>Stages</span>
                    <strong>
                      {automatedCodeReviewStatus.summary.plannedStages}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Changed Files</span>
                    <strong>
                      {automatedCodeReviewStatus.summary.changedFilesVisible}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Dry Run</span>
                    <strong>
                      {automatedCodeReviewStatus.summary.autoAllowDryRun}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Lease</span>
                    <strong>
                      {automatedCodeReviewStatus.summary.requiresExecutorLease}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Blocked</span>
                    <strong>{automatedCodeReviewStatus.summary.blocked}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Source</span>
                    <strong>
                      {automatedCodeReviewStatus.sourceDocument.exists
                        ? "HASHED"
                        : "MISSING"}
                    </strong>
                  </div>
                </div>

                <div className="practice-manifest-line">
                  <span>Mode</span>
                  <code>{automatedCodeReviewStatus.mode}</code>
                  <span>Status</span>
                  <code>{automatedCodeReviewStatus.summary.status}</code>
                  <span>Updated</span>
                  <code>{automatedCodeReviewStatus.updatedAt}</code>
                </div>

                <div className="git-fixture-notice">
                  This panel reads a static fixture generated from the exported
                  review workflow. It does not run review commands, apply
                  patches, read secrets, sync connectors, push, deploy, or
                  expose endpoints from the browser.
                </div>

                <div className="practice-grid">
                  <section
                    className="practice-artifacts"
                    aria-label="Automated code review planned stages"
                  >
                    <div className="git-section-title">
                      <span>Review Stages</span>
                      <span className="approval-badge">plan-only</span>
                    </div>
                    {codeReviewStages.map((stage) => (
                      <div className="practice-artifact-row" key={stage.id}>
                        <span className="practice-status payload-ready">
                          {stage.mode}
                        </span>
                        <div>
                          <strong>{stage.label}</strong>
                          <p>{stage.checks.join(" / ")}</p>
                        </div>
                      </div>
                    ))}
                  </section>

                  <section
                    className="practice-artifacts"
                    aria-label="Automated code review broker decisions"
                  >
                    <div className="git-section-title">
                      <span>Broker Decisions</span>
                      <span className="approval-badge">codex-local</span>
                    </div>
                    {codeReviewBrokerDecisions.map((decision) => (
                      <div
                        className="practice-artifact-row"
                        key={`${decision.tool}-${decision.action}`}
                      >
                        <span
                          className={`practice-status ${getBrokerDecisionClass(decision.decision)}`}
                        >
                          {decision.decision}
                        </span>
                        <div>
                          <strong>
                            {decision.tool} / {decision.action}
                          </strong>
                          <p>
                            {decision.reason} · gate:{" "}
                            {decision.requiredGate || "none"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </section>
                </div>
              </div>

              <div className="practice-lower-grid">
                <div className="card">
                  <div className="card-title">
                    <span>Source Artifact</span>
                    <span className="accent-emerald">Hash Sync</span>
                  </div>
                  <div className="approval-state-grid practice-boundary-grid">
                    <div>
                      <span>Path</span>
                      <strong>
                        {automatedCodeReviewStatus.sourceDocument.path}
                      </strong>
                    </div>
                    <div>
                      <span>Lines</span>
                      <strong>
                        {automatedCodeReviewStatus.sourceDocument.lines}
                      </strong>
                    </div>
                    <div>
                      <span>Bytes</span>
                      <strong>
                        {automatedCodeReviewStatus.sourceDocument.bytes}
                      </strong>
                    </div>
                    <div>
                      <span>SHA-256</span>
                      <strong>
                        {automatedCodeReviewStatus.sourceDocument.sha256 ||
                          "missing"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">
                    <span>Execution Boundary</span>
                    <span className="accent-purple">No Auto Apply</span>
                  </div>
                  <div className="blocked-action-list">
                    {[
                      ...automatedCodeReviewStatus.blockedWorkflowActions,
                      ...automatedCodeReviewStatus.policyBoundary,
                    ].map((action) => (
                      <span className="blocked-action" key={action}>
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-title">
                  <span>Changed File Samples</span>
                  <span className="accent-cyan">Metadata Only</span>
                </div>
                <div className="blocked-action-list">
                  {codeReviewChangedFileSamples.slice(0, 16).map((item) => (
                    <span
                      className="blocked-action"
                      key={`${item.status}-${item.path}`}
                    >
                      {item.status} {item.path}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : activePanel === "toolMatrix" ? (
            <>
              <div className="card practice-card">
                <div className="card-title">
                  <span>Codex Tool + Git Repo Matrix</span>
                  <span className="accent-cyan">Read Only</span>
                </div>

                <div className="practice-summary-grid">
                  <div className="practice-kpi">
                    <span>Agent Cards</span>
                    <strong>
                      {codexToolRepoMatrixStatus.summary.agentCount}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Broker Routed</span>
                    <strong>
                      {codexToolRepoMatrixStatus.summary.brokerRoutedAgents}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Repos</span>
                    <strong>
                      {codexToolRepoMatrixStatus.summary.repoCount}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Repo Actions</span>
                    <strong>
                      {codexToolRepoMatrixStatus.summary.repoActionCount}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Gated / Blocked</span>
                    <strong>
                      {codexToolRepoMatrixStatus.summary.blockedOrGatedActions}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Clone Allowlist</span>
                    <strong>
                      {codexToolRepoMatrixStatus.summary.cloneAllowCount}
                    </strong>
                  </div>
                </div>

                <div className="practice-manifest-line">
                  <span>Mode</span>
                  <code>{codexToolRepoMatrixStatus.mode}</code>
                  <span>Status</span>
                  <code>{codexToolRepoMatrixStatus.summary.overallStatus}</code>
                  <span>Updated</span>
                  <code>{codexToolRepoMatrixStatus.updatedAt}</code>
                </div>

                <div className="git-fixture-notice">
                  This matrix is generated from local agent cards, the external
                  repo registry, and the Codex command broker. It classifies
                  actions only; it does not clone, push, deploy, call providers,
                  sync connectors, read secrets, or disable policy.
                </div>

                <div className="practice-grid">
                  <section
                    className="practice-artifacts"
                    aria-label="Codex tool and agent route matrix"
                  >
                    <div className="git-section-title">
                      <span>Agent Routes</span>
                      <span className="approval-badge">broker map</span>
                    </div>
                    {toolRepoMatrixAgents.map((agent) => (
                      <div
                        className="practice-artifact-row"
                        key={agent.agentId}
                      >
                        <span
                          className={`practice-status ${
                            agent.brokerRouted
                              ? "payload-ready"
                              : "payload-warn"
                          }`}
                        >
                          {agent.brokerRouted ? "routed" : "missing"}
                        </span>
                        <div>
                          <strong>{agent.agentId}</strong>
                          <p>
                            {agent.role || agent.name} · runtime:{" "}
                            {agent.runtime} · allowed:{" "}
                            {agent.allowedActionCount} · lease:{" "}
                            {agent.leaseRequiredActions.length}
                          </p>
                          <code>{agent.cardPath}</code>
                        </div>
                      </div>
                    ))}
                  </section>

                  <section
                    className="practice-artifacts"
                    aria-label="Codex external Git repository matrix"
                  >
                    <div className="git-section-title">
                      <span>Repo Registry</span>
                      <span className="approval-badge">action classified</span>
                    </div>
                    {toolRepoMatrixRepos.map((repo) => (
                      <div className="practice-artifact-row" key={repo.repo}>
                        <span
                          className={`practice-status ${
                            repo.clonePolicy === "allow"
                              ? "payload-warn"
                              : "payload-blocked"
                          }`}
                        >
                          {repo.clonePolicy}
                        </span>
                        <div>
                          <strong>{repo.repo}</strong>
                          <p>
                            {repo.role} · local path:{" "}
                            {repo.localPathExists ? "present" : "not present"}
                          </p>
                          <code>
                            {Object.entries(repo.summary)
                              .map(([key, value]) => `${key}:${value}`)
                              .join(" / ")}
                          </code>
                        </div>
                      </div>
                    ))}
                  </section>
                </div>
              </div>

              <div className="practice-lower-grid">
                <div className="card">
                  <div className="card-title">
                    <span>Action Decision Counts</span>
                    <span className="accent-emerald">Broker Derived</span>
                  </div>
                  <div className="blocked-action-list">
                    {Object.entries(
                      codexToolRepoMatrixStatus.actionSummary,
                    ).map(([decision, count]) => (
                      <span className="blocked-action" key={decision}>
                        {decision}: {count}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">
                    <span>Execution Boundary</span>
                    <span className="accent-purple">No Jailbreak</span>
                  </div>
                  <div className="blocked-action-list">
                    {toolRepoMatrixBoundary.map((item) => (
                      <span className="blocked-action" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : activePanel === "webDeploy" ? (
            <>
              <div className="card practice-card">
                <div className="card-title">
                  <span>web-sirinx Generated Assets + Deploy Lane</span>
                  <span className="accent-cyan">Local Manifest</span>
                </div>

                <div className="practice-summary-grid">
                  <div className="practice-kpi">
                    <span>Dist Changes</span>
                    <strong>
                      {webSirinxDeployStatus.summary.distChangedFiles}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Source Changes</span>
                    <strong>
                      {webSirinxDeployStatus.summary.sourceChangedFiles}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>HTML Files</span>
                    <strong>{webSirinxDeployStatus.summary.htmlFiles}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Assets</span>
                    <strong>{webSirinxDeployStatus.summary.assetFiles}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Missing Assets</span>
                    <strong>
                      {webSirinxDeployStatus.summary.missingAssetReferences}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Deploy</span>
                    <strong>
                      {webSirinxDeployPacketStatus.summary.deployCommandBlocked
                        ? "BLOCKED"
                        : "READY"}
                    </strong>
                  </div>
                </div>

                <div className="practice-manifest-line">
                  <span>Mode</span>
                  <code>{webSirinxDeployStatus.mode}</code>
                  <span>Status</span>
                  <code>
                    {webSirinxDeployPacketStatus.summary.overallStatus}
                  </code>
                  <span>Updated</span>
                  <code>{webSirinxDeployPacketStatus.updatedAt}</code>
                </div>

                <div className="git-fixture-notice">
                  This lane tracks generated `dist/public` assets and the
                  Cloudflare Pages deploy backlog. It does not stage, push,
                  deploy, call Wrangler, read credentials, or mutate production.
                </div>

                <div className="practice-grid">
                  <section
                    className="practice-artifacts"
                    aria-label="web-sirinx static file preflight"
                  >
                    <div className="git-section-title">
                      <span>Static Files</span>
                      <span className="approval-badge">dist/public</span>
                    </div>
                    {webSirinxDeployStatus.staticFiles.map((file) => (
                      <div className="practice-artifact-row" key={file.name}>
                        <span
                          className={`practice-status ${
                            file.exists ? "payload-ready" : "payload-blocked"
                          }`}
                        >
                          {file.exists ? "exists" : "missing"}
                        </span>
                        <div>
                          <strong>{file.name}</strong>
                          <p>{file.bytes} bytes</p>
                          <code>{file.path}</code>
                        </div>
                      </div>
                    ))}
                  </section>

                  <section
                    className="practice-artifacts"
                    aria-label="web-sirinx deploy broker decisions"
                  >
                    <div className="git-section-title">
                      <span>Broker Decisions</span>
                      <span className="approval-badge">deploy gated</span>
                    </div>
                    {webSirinxDeployStatus.brokerDecisions.map((decision) => (
                      <div
                        className="practice-artifact-row"
                        key={`${decision.tool}-${decision.action}`}
                      >
                        <span
                          className={`practice-status ${getBrokerDecisionClass(decision.decision)}`}
                        >
                          {decision.decision}
                        </span>
                        <div>
                          <strong>
                            {decision.tool} / {decision.action}
                          </strong>
                          <p>
                            {decision.reason} · gate:{" "}
                            {decision.requiredGate || "none"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </section>
                </div>
              </div>

              <div className="practice-lower-grid">
                <div className="card">
                  <div className="card-title">
                    <span>Pending Deploy Lane</span>
                    <span className="accent-cyan">
                      {webSirinxDeployPacketStatus.laneId}
                    </span>
                  </div>
                  <div className="approval-state-grid practice-boundary-grid">
                    <div>
                      <span>Pages Project</span>
                      <strong>
                        {webSirinxDeployPacketStatus.pagesProject}
                      </strong>
                    </div>
                    <div>
                      <span>Required Checks</span>
                      <strong>
                        {
                          webSirinxDeployPacketStatus.summary
                            .requiredValidationCommands
                        }
                      </strong>
                    </div>
                    <div>
                      <span>Lease Required</span>
                      <strong>
                        {
                          webSirinxDeployPacketStatus.summary
                            .leaseRequiredCommands
                        }
                      </strong>
                    </div>
                    <div>
                      <span>Blocked Commands</span>
                      <strong>
                        {webSirinxDeployPacketStatus.summary.blockedCommands}
                      </strong>
                    </div>
                    <div>
                      <span>Dist Path</span>
                      <strong>{webSirinxDeployPacketStatus.distPath}</strong>
                    </div>
                    <div>
                      <span>Manifest</span>
                      <strong>
                        {webSirinxDeployPacketStatus.sourceManifest}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">
                    <span>Changed Samples</span>
                    <span className="accent-emerald">Generated Assets</span>
                  </div>
                  <div className="blocked-action-list">
                    {[
                      ...webSirinxDeployStatus.sourceChangedSamples.slice(0, 8),
                      ...webSirinxDeployStatus.distChangedSamples.slice(0, 24),
                    ].map((item) => (
                      <span className="blocked-action" key={item.path}>
                        {item.status.trim() || "M"} {item.path}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">
                    <span>Deploy Boundary</span>
                    <span className="accent-purple">Production Guard</span>
                  </div>
                  <div className="blocked-action-list">
                    {[
                      ...webSirinxDeployStatus.policyBoundary,
                      ...webSirinxDeployStatus.nextSafeActions,
                    ].map((item) => (
                      <span className="blocked-action" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-title">
                  <span>Deploy Commands</span>
                  <span className="accent-cyan">
                    {webSirinxDeployPacketStatus.commands.length}
                  </span>
                </div>
                <div className="blocked-action-list">
                  {webSirinxDeployPacketStatus.commands.map((command) => (
                    <span className="blocked-action" key={command.id}>
                      {command.brokerDecision} · {command.commandPreview}
                    </span>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-title">
                  <span>Asset Reference Issues</span>
                  <span className="accent-cyan">
                    {webSirinxDeployStatus.assetReferenceIssues.length}
                  </span>
                </div>
                <div className="blocked-action-list">
                  {webSirinxDeployStatus.assetReferenceIssues.length ? (
                    webSirinxDeployStatus.assetReferenceIssues.map((issue) => (
                      <span
                        className="blocked-action"
                        key={`${issue.html}-${issue.asset}`}
                      >
                        {issue.issue} {issue.html} -&gt; {issue.asset}
                      </span>
                    ))
                  ) : (
                    <span className="blocked-action">
                      no missing asset references found in generated HTML
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : activePanel === "commandPacket" ? (
            <>
              <div className="card practice-card">
                <div className="card-title">
                  <span>Codex Command Packet</span>
                  <span className="accent-cyan">No Execution</span>
                </div>

                <div className="practice-summary-grid">
                  <div className="practice-kpi">
                    <span>Packet</span>
                    <strong>{codexCommandPacketStatus.packet_decision}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Broker</span>
                    <strong>{codexCommandPacketStatus.broker.decision}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Risk Flags</span>
                    <strong>
                      {codexCommandPacketStatus.risk_flags.length}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Lease</span>
                    <strong>
                      {codexCommandPacketStatus.lease.valid
                        ? "valid"
                        : "missing"}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Execution</span>
                    <strong>
                      {codexCommandPacketStatus.execution_allowed_by_packet
                        ? "DRY"
                        : "BLOCKED"}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Updated</span>
                    <strong>{codexCommandPacketStatus.created_at}</strong>
                  </div>
                </div>

                <div className="practice-manifest-line">
                  <span>Tool</span>
                  <code>{codexCommandPacketStatus.tool}</code>
                  <span>Action</span>
                  <code>{codexCommandPacketStatus.action}</code>
                  <span>Lane</span>
                  <code>{codexCommandPacketStatus.lane || "none"}</code>
                </div>

                <div className="git-fixture-notice">
                  This packet is a local command-control artifact. It hashes and
                  classifies the command before execution; it does not run shell
                  commands, read secrets, push, deploy, call providers, sync
                  connectors, or open public endpoints.
                </div>

                <div className="practice-grid">
                  <section
                    className="practice-artifacts"
                    aria-label="Codex command packet decision"
                  >
                    <div className="git-section-title">
                      <span>Decision</span>
                      <span className="approval-badge">broker + packet</span>
                    </div>
                    <div className="practice-artifact-row">
                      <span
                        className={`practice-status ${getCommandPacketStatusClass(
                          codexCommandPacketStatus.packet_decision,
                        )}`}
                      >
                        {codexCommandPacketStatus.packet_decision}
                      </span>
                      <div>
                        <strong>
                          {codexCommandPacketStatus.packet_reason}
                        </strong>
                        <p>
                          Broker: {codexCommandPacketStatus.broker.reason} ·
                          gate:{" "}
                          {codexCommandPacketStatus.broker.required_gate ||
                            "none"}
                        </p>
                        <code>{codexCommandPacketStatus.command_sha256}</code>
                      </div>
                    </div>
                  </section>

                  <section
                    className="practice-artifacts"
                    aria-label="Codex command packet command preview"
                  >
                    <div className="git-section-title">
                      <span>Command Preview</span>
                      <span className="approval-badge">masked</span>
                    </div>
                    <div className="practice-artifact-row">
                      <span className="practice-status payload-ready">
                        hash
                      </span>
                      <div>
                        <strong>{codexCommandPacketStatus.goal}</strong>
                        <p>{codexCommandPacketStatus.command_preview}</p>
                        <code>
                          target:{" "}
                          {codexCommandPacketStatus.target_repo || "none"}
                        </code>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <div className="practice-lower-grid">
                <div className="card">
                  <div className="card-title">
                    <span>Risk Flags</span>
                    <span className="accent-emerald">
                      {codexCommandPacketStatus.risk_flags.length}
                    </span>
                  </div>
                  <div className="blocked-action-list">
                    {codexCommandPacketStatus.risk_flags.length ? (
                      codexCommandPacketStatus.risk_flags.map((flag) => (
                        <span
                          className="blocked-action"
                          key={`${flag.level}-${flag.label}`}
                        >
                          {flag.level}: {flag.label}
                        </span>
                      ))
                    ) : (
                      <span className="blocked-action">
                        no command-level blocking pattern detected
                      </span>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">
                    <span>Boundary</span>
                    <span className="accent-purple">Policy Locked</span>
                  </div>
                  <div className="blocked-action-list">
                    {codexCommandPacketStatus.policy_boundary.map((item) => (
                      <span className="blocked-action" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : activePanel === "commandBrokerProduction" ? (
            <>
              <div className="card practice-card">
                <div className="card-title">
                  <span>Production Command Broker</span>
                  <span className="accent-cyan">Read Only</span>
                </div>

                <div className="practice-summary-grid">
                  <div className="practice-kpi">
                    <span>Commands</span>
                    <strong>
                      {commandBrokerProductionStatus.summary.registeredCommands}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Tools</span>
                    <strong>
                      {commandBrokerProductionStatus.summary.registeredTools}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Adapters</span>
                    <strong>
                      {commandBrokerProductionStatus.summary.adapterContracts}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Runtime Files</span>
                    <strong>
                      {commandBrokerProductionStatus.summary.runtimeFiles}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Deny Always</span>
                    <strong>
                      {commandBrokerProductionStatus.summary.denyAlwaysCount}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Contract</span>
                    <strong>
                      {commandBrokerProductionStatus.summary
                        .contractPackagePresent
                        ? "READY"
                        : "MISSING"}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Execution</span>
                    <strong>
                      {commandBrokerProductionStatus.summary
                        .directExecutionEnabled
                        ? "ON"
                        : "OFF"}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Deploy</span>
                    <strong>
                      {commandBrokerProductionStatus.summary
                        .deployCommandAllowed
                        ? "ALLOW"
                        : "BLOCK"}
                    </strong>
                  </div>
                </div>

                <div className="practice-manifest-line">
                  <span>Status</span>
                  <code>{commandBrokerProductionStatus.summary.status}</code>
                  <span>Runtime</span>
                  <code>{commandBrokerProductionStatus.runtimeRoot}</code>
                  <span>Contract</span>
                  <code>
                    {commandBrokerProductionStatus.contractPackage.name}
                  </code>
                  <span>Updated</span>
                  <code>{commandBrokerProductionStatus.updatedAt}</code>
                </div>

                <div className="git-fixture-notice">
                  This panel unlocks command visibility through the broker. It
                  does not execute commands, edit audit logs, read secrets,
                  stage files, push, deploy, sync connectors, or provide an
                  approve-all path. Adapter contracts are preflight validators
                  only for Docker localhost, external repo clone, provider API
                  smoke, and MCP connector activation.
                </div>

                <div className="practice-grid">
                  <section
                    className="practice-artifacts"
                    aria-label="Command broker risk tiers"
                  >
                    <div className="git-section-title">
                      <span>Risk Tiers</span>
                      <span className="approval-badge">T0-T5</span>
                    </div>
                    {commandBrokerProductionStatus.riskTiers.map((tier) => (
                      <div className="practice-artifact-row" key={tier.id}>
                        <span
                          className={`practice-status ${getProductionDecisionClass(
                            tier.defaultDecision,
                          )}`}
                        >
                          {tier.id}
                        </span>
                        <div>
                          <strong>{tier.label}</strong>
                          <p>{tier.defaultDecision}</p>
                          <code>{tier.examples.join(", ")}</code>
                        </div>
                      </div>
                    ))}
                  </section>

                  <section
                    className="practice-artifacts"
                    aria-label="Blocked or review-required commands"
                  >
                    <div className="git-section-title">
                      <span>Blocked / Review Commands</span>
                      <span className="approval-badge">
                        {commandBrokerProductionStatus.blockedCommands.length}
                      </span>
                    </div>
                    {commandBrokerProductionStatus.blockedCommands
                      .slice(0, 12)
                      .map((command) => (
                        <div className="practice-artifact-row" key={command.id}>
                          <span
                            className={`practice-status ${getProductionDecisionClass(
                              command.productionDecision,
                            )}`}
                          >
                            {command.riskTier}
                          </span>
                          <div>
                            <strong>
                              {command.tool} / {command.action}
                            </strong>
                            <p>
                              {command.productionDecision} · gate:{" "}
                              {command.requiredGate || "none"}
                            </p>
                            <code>
                              {command.commandPreview || command.label}
                            </code>
                          </div>
                        </div>
                      ))}
                  </section>
                </div>
              </div>

              <div className="practice-lower-grid">
                <div className="card">
                  <div className="card-title">
                    <span>Decision Counts</span>
                    <span className="accent-emerald">Policy Matrix</span>
                  </div>
                  <div className="blocked-action-list">
                    {Object.entries(
                      commandBrokerProductionStatus.summary.decisionCounts,
                    ).map(([decision, count]) => (
                      <span className="blocked-action" key={decision}>
                        {decision}: {count}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">
                    <span>Runtime Files</span>
                    <span className="accent-cyan">
                      {commandBrokerProductionStatus.runtimeFiles.length}
                    </span>
                  </div>
                  <div className="blocked-action-list">
                    {commandBrokerProductionStatus.runtimeFiles
                      .slice(0, 24)
                      .map((file) => (
                        <span className="blocked-action" key={file}>
                          {file}
                        </span>
                      ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">
                    <span>Policy Boundary</span>
                    <span className="accent-purple">No Bypass</span>
                  </div>
                  <div className="blocked-action-list">
                    {[
                      ...commandBrokerProductionStatus.policyBoundary,
                      ...commandBrokerProductionStatus.nextSafeActions,
                    ].map((item) => (
                      <span className="blocked-action" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : activePanel === "sessionToolkit" ? (
            <>
              <div className="card practice-card">
                <div className="card-title">
                  <span>Codex Session Sidebar Toolkit</span>
                  <span className="accent-cyan">Read Only</span>
                </div>

                <div className="practice-summary-grid">
                  <div className="practice-kpi">
                    <span>Agents</span>
                    <strong>
                      {codexSessionSidebarToolkitStatus.summary.agentCount}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Broker Routed</span>
                    <strong>
                      {
                        codexSessionSidebarToolkitStatus.summary
                          .brokerRoutedAgents
                      }
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Repos</span>
                    <strong>
                      {codexSessionSidebarToolkitStatus.summary.registeredRepos}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Reports</span>
                    <strong>
                      {
                        codexSessionSidebarToolkitStatus.summary
                          .runtimeReportsPresent
                      }
                      /
                      {
                        codexSessionSidebarToolkitStatus.summary
                          .runtimeReportsExpected
                      }
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Auto Dry-Run</span>
                    <strong>
                      {
                        codexSessionSidebarToolkitStatus.summary
                          .autoAllowDryRunActions
                      }
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Lease Required</span>
                    <strong>
                      {
                        codexSessionSidebarToolkitStatus.summary
                          .leaseRequiredActions
                      }
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>First Phase Blocks</span>
                    <strong>
                      {
                        codexSessionSidebarToolkitStatus.summary
                          .blockedFirstPhaseActions
                      }
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Hard Blocks</span>
                    <strong>
                      {
                        codexSessionSidebarToolkitStatus.summary
                          .hardBlockedActions
                      }
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Sync Queue</span>
                    <strong>
                      {codexSessionSidebarToolkitStatus.summary.syncQueueItems}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Ready / Lease / Blocked</span>
                    <strong>
                      {codexSessionSidebarToolkitStatus.summary.syncQueueReady}/
                      {
                        codexSessionSidebarToolkitStatus.summary
                          .syncQueueLeaseRequired
                      }
                      /
                      {
                        codexSessionSidebarToolkitStatus.summary
                          .syncQueueBlocked
                      }
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Integration Rows</span>
                    <strong>
                      {codexSessionSidebarToolkitStatus.summary.integrationRows}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Integration R/L/B</span>
                    <strong>
                      {
                        codexSessionSidebarToolkitStatus.summary
                          .integrationReady
                      }
                      /
                      {
                        codexSessionSidebarToolkitStatus.summary
                          .integrationLeaseRequired
                      }
                      /
                      {
                        codexSessionSidebarToolkitStatus.summary
                          .integrationBlocked
                      }
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Lease Requests</span>
                    <strong>
                      {
                        codexSessionSidebarToolkitStatus.summary
                          .leaseRequestPackets
                      }
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Preflight Commands</span>
                    <strong>
                      {
                        codexSessionSidebarToolkitStatus.summary
                          .executorPreflightCommands
                      }
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Exec Enabled</span>
                    <strong>
                      {
                        codexSessionSidebarToolkitStatus.summary
                          .executorPreflightExecutionEnabled
                      }
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Objective Verified</span>
                    <strong>
                      {
                        codexSessionSidebarToolkitStatus.summary
                          .objectiveVerified
                      }
                      /{codexSessionSidebarToolkitStatus.summary.objectiveTotal}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Objective Blocked</span>
                    <strong>
                      {
                        codexSessionSidebarToolkitStatus.summary
                          .objectiveBlocked
                      }
                    </strong>
                  </div>
                </div>

                <div className="practice-manifest-line">
                  <span>Status</span>
                  <code>{codexSessionSidebarToolkitStatus.status}</code>
                  <span>Project</span>
                  <code>
                    {codexSessionSidebarToolkitStatus.controlSurface.project}
                  </code>
                  <span>Route</span>
                  <code>
                    {
                      codexSessionSidebarToolkitStatus.controlSurface
                        .executionRoute
                    }
                  </code>
                  <span>Updated</span>
                  <code>{codexSessionSidebarToolkitStatus.updatedAt}</code>
                </div>

                <div className="git-fixture-notice">
                  This panel is the local session control surface for Codex,
                  KOB, Hermes, Manus, OpenCode, AGY, and repo registry routes.
                  It reads a generated fixture only. It does not run commands,
                  clone repos, start Docker, call providers, read secrets, sync
                  connectors, push, deploy, mutate generated assets, or provide
                  an approve-all bypass.
                </div>

                <div className="practice-grid">
                  <section
                    className="practice-artifacts"
                    aria-label="A2A agent routes"
                  >
                    <div className="git-section-title">
                      <span>Agent Routes</span>
                      <span className="approval-badge">
                        {sessionToolkitAgents.length}
                      </span>
                    </div>
                    {sessionToolkitAgents.map((agent) => (
                      <div
                        className="practice-artifact-row"
                        key={agent.agentId}
                      >
                        <span
                          className={`practice-status ${
                            agent.brokerRouted
                              ? "payload-ready"
                              : "payload-blocked"
                          }`}
                        >
                          {agent.runtime}
                        </span>
                        <div>
                          <strong>{agent.name}</strong>
                          <p>
                            {agent.role} · local only:{" "}
                            {agent.localOnly ? "yes" : "no"}
                          </p>
                          <code>
                            allow {agent.allowedActions.length} · lease{" "}
                            {agent.leaseRequiredActions.length} · block{" "}
                            {agent.blockedActions.length}
                          </code>
                        </div>
                      </div>
                    ))}
                  </section>

                  <section
                    className="practice-artifacts"
                    aria-label="A2A session workflows"
                  >
                    <div className="git-section-title">
                      <span>Workflows</span>
                      <span className="approval-badge">
                        {sessionToolkitWorkflows.length}
                      </span>
                    </div>
                    {sessionToolkitWorkflows.map((workflow) => (
                      <div className="practice-artifact-row" key={workflow.id}>
                        <span className="practice-status payload-warn">
                          {workflow.execution}
                        </span>
                        <div>
                          <strong>{workflow.name}</strong>
                          <p>{workflow.steps.join(" → ")}</p>
                          <code>{workflow.id}</code>
                        </div>
                      </div>
                    ))}
                  </section>

                  <section
                    className="practice-artifacts"
                    aria-label="A2A local sync queue"
                  >
                    <div className="git-section-title">
                      <span>Local Sync Queue</span>
                      <span className="approval-badge">
                        {sessionToolkitSyncQueue.length}
                      </span>
                    </div>
                    {sessionToolkitSyncQueue.map((item) => (
                      <div className="practice-artifact-row" key={item.id}>
                        <span
                          className={`practice-status ${
                            item.status === "ready"
                              ? "payload-ready"
                              : item.status === "lease_required"
                                ? "payload-warn"
                                : "payload-blocked"
                          }`}
                        >
                          {item.status}
                        </span>
                        <div>
                          <strong>{item.label}</strong>
                          <p>
                            {item.route} · {item.nextAction}
                          </p>
                          <code>
                            {item.id} · {item.decision} · {item.requiredGate}
                          </code>
                        </div>
                      </div>
                    ))}
                  </section>
                </div>
              </div>

              <div className="practice-lower-grid">
                <div className="card">
                  <div className="card-title">
                    <span>Runtime Reports</span>
                    <span className="accent-cyan">
                      {codexSessionSidebarToolkitStatus.reports.present}/
                      {codexSessionSidebarToolkitStatus.reports.expected}
                    </span>
                  </div>
                  <div className="blocked-action-list">
                    {sessionToolkitReportEntries.map(([key, report]) => (
                      <span
                        className={`blocked-action ${
                          report.exists ? "payload-ready" : "payload-blocked"
                        }`}
                        key={key}
                      >
                        {key}: {report.status}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">
                    <span>Integration Readiness</span>
                    <span className="accent-cyan">
                      {sessionToolkitIntegrationRows.length}
                    </span>
                  </div>
                  <div className="practice-artifacts compact-list">
                    {sessionToolkitIntegrationRows.map((row) => (
                      <div className="practice-artifact-row" key={row.id}>
                        <span
                          className={`practice-status ${
                            row.status === "ready"
                              ? "payload-ready"
                              : row.status === "blocked" ||
                                  row.status === "missing"
                                ? "payload-blocked"
                                : "payload-warn"
                          }`}
                        >
                          {row.status}
                        </span>
                        <div>
                          <strong>{row.surface}</strong>
                          <p>
                            {row.role} · {row.nextAction}
                          </p>
                          <code>
                            {row.id} · {row.decision} · {row.evidence}
                          </code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">
                    <span>Lease Request Packets</span>
                    <span className="accent-cyan">
                      {codexSessionSidebarToolkitStatus.leaseRequests.status}
                    </span>
                  </div>
                  <div className="practice-artifacts compact-list">
                    {sessionToolkitLeaseRequests.map((request) => (
                      <div
                        className="practice-artifact-row"
                        key={request.requestId}
                      >
                        <span
                          className={`practice-status ${
                            request.requestStatus === "ready_for_review"
                              ? "payload-ready"
                              : request.requestStatus ===
                                  "blocked_pending_targets"
                                ? "payload-blocked"
                                : "payload-warn"
                          }`}
                        >
                          {request.requestStatus}
                        </span>
                        <div>
                          <strong>{request.surface}</strong>
                          <p>
                            {request.executor || "target binding"} ·{" "}
                            {request.nextAction}
                          </p>
                          <code>
                            {request.sourceRowId} ·{" "}
                            {request.lane || "no active lease"} · {request.path}
                          </code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">
                    <span>Executor Lease Preflight</span>
                    <span className="accent-cyan">
                      {sessionToolkitExecutorPreflight.status}
                    </span>
                  </div>
                  <div className="practice-summary-grid compact">
                    <div className="practice-kpi">
                      <span>Commands</span>
                      <strong>
                        {
                          sessionToolkitExecutorPreflight.summary
                            .registeredCommands
                        }
                      </strong>
                    </div>
                    <div className="practice-kpi">
                      <span>Require Lease</span>
                      <strong>
                        {sessionToolkitExecutorPreflight.summary.requiresLease}
                      </strong>
                    </div>
                    <div className="practice-kpi">
                      <span>Active Leases</span>
                      <strong>
                        {sessionToolkitExecutorPreflight.summary.activeLeases}
                      </strong>
                    </div>
                    <div className="practice-kpi">
                      <span>Active Locks</span>
                      <strong>
                        {
                          sessionToolkitExecutorPreflight.summary
                            .activeLaneLocks
                        }
                      </strong>
                    </div>
                  </div>
                  <div className="blocked-action-list">
                    {sessionToolkitExecutorPreflight.requirements.map(
                      (requirement) => (
                        <span
                          className="blocked-action payload-ready"
                          key={requirement.id}
                        >
                          {requirement.id}: {requirement.status}
                        </span>
                      ),
                    )}
                  </div>
                  <div className="practice-artifacts compact-list">
                    {sessionToolkitExecutorPreflight.sampleCommands
                      .slice(0, 6)
                      .map((command) => (
                        <div className="practice-artifact-row" key={command.id}>
                          <span
                            className={`practice-status ${
                              command.brokerDecision ===
                              "requires_executor_lease"
                                ? "payload-warn"
                                : command.brokerDecision === "blocked"
                                  ? "payload-blocked"
                                  : "payload-ready"
                            }`}
                          >
                            {command.riskTier}
                          </span>
                          <div>
                            <strong>{command.label}</strong>
                            <p>
                              {command.brokerDecision} · {command.requiredGate}
                            </p>
                            <code>{command.commandSha256 || "no-command"}</code>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">
                    <span>Objective Audit</span>
                    <span className="accent-cyan">
                      {sessionToolkitObjectiveAudit.overallStatus}
                    </span>
                  </div>
                  <div className="practice-summary-grid compact">
                    <div className="practice-kpi">
                      <span>Verified</span>
                      <strong>
                        {sessionToolkitObjectiveAudit.verifiedCount}/
                        {sessionToolkitObjectiveAudit.totalCount}
                      </strong>
                    </div>
                    <div className="practice-kpi">
                      <span>Blocked</span>
                      <strong>
                        {sessionToolkitObjectiveAuditCounts.blocked ?? 0}
                      </strong>
                    </div>
                    <div className="practice-kpi">
                      <span>Partial</span>
                      <strong>
                        {sessionToolkitObjectiveAuditCounts.partial ?? 0}
                      </strong>
                    </div>
                    <div className="practice-kpi">
                      <span>Missing</span>
                      <strong>
                        {sessionToolkitObjectiveAuditCounts.missing ?? 0}
                      </strong>
                    </div>
                  </div>
                  <div className="practice-artifacts compact-list">
                    {sessionToolkitObjectiveAudit.requirements.map((item) => (
                      <div className="practice-artifact-row" key={item.id}>
                        <span
                          className={`practice-status ${
                            item.status === "verified"
                              ? "payload-ready"
                              : item.status === "blocked"
                                ? "payload-blocked"
                                : "payload-warn"
                          }`}
                        >
                          {item.status}
                        </span>
                        <div>
                          <strong>{item.label}</strong>
                          <p>{item.evidence}</p>
                          <code>
                            {item.id} · {item.nextAction}
                          </code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">
                    <span>Docs + Repo Registry</span>
                    <span className="accent-emerald">
                      {codexSessionSidebarToolkitStatus.repos.registered} repos
                    </span>
                  </div>
                  <div className="blocked-action-list">
                    {sessionToolkitDocs.map((doc) => (
                      <span
                        className={`blocked-action ${
                          doc.exists ? "payload-ready" : "payload-blocked"
                        }`}
                        key={doc.path}
                      >
                        {doc.path}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">
                    <span>Policy Boundary</span>
                    <span className="accent-purple">Broker Only</span>
                  </div>
                  <div className="blocked-action-list">
                    {codexSessionSidebarToolkitStatus.allowedNow.map(
                      (action) => (
                        <span
                          className="blocked-action payload-ready"
                          key={action}
                        >
                          {action}
                        </span>
                      ),
                    )}
                    {codexSessionSidebarToolkitStatus.blockedInToolkit.map(
                      (action) => (
                        <span
                          className="blocked-action payload-blocked"
                          key={action}
                        >
                          {action}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : activePanel === "a2a2aRunner" ? (
            <>
              <div className="card practice-card">
                <div className="card-title">
                  <span>A2A2A Local Agent Runner</span>
                  <span className="accent-cyan">
                    {a2a2aRunnerStatus.summary.overallStatus}
                  </span>
                </div>

                <div className="practice-summary-grid">
                  <div className="practice-kpi">
                    <span>Roles</span>
                    <strong>{a2a2aRunnerStatus.summary.roles}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Inbox</span>
                    <strong>{a2a2aRunnerStatus.summary.inbox}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Outbox</span>
                    <strong>{a2a2aRunnerStatus.summary.outbox}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Completed</span>
                    <strong>{a2a2aRunnerStatus.summary.completed}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Failed</span>
                    <strong>{a2a2aRunnerStatus.summary.failed}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Provider Calls</span>
                    <strong>{a2a2aRunnerStatus.summary.providerCalls}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Dry Runs</span>
                    <strong>{a2a2aRunnerStatus.summary.dryRunCompleted}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Latest Results</span>
                    <strong>{a2a2aRunnerStatus.summary.latestResults}</strong>
                  </div>
                </div>

                <div className="practice-manifest-line">
                  <span>Mode</span>
                  <code>{a2a2aRunnerStatus.mode}</code>
                  <span>Runtime</span>
                  <code>{a2a2aRunnerStatus.runtimeRoot}</code>
                  <span>Updated</span>
                  <code>{a2a2aRunnerStatus.updatedAt}</code>
                </div>

                <div className="practice-manifest-line">
                  <span>Last Runner</span>
                  <code>{a2a2aRunnerStatus.lastRunnerSummary.mode}</code>
                  <span>Watch</span>
                  <code>
                    {String(a2a2aRunnerStatus.lastRunnerSummary.watch)}
                  </code>
                  <span>Cycles</span>
                  <code>{a2a2aRunnerStatus.lastRunnerSummary.cycles}</code>
                  <span>Processed</span>
                  <code>{a2a2aRunnerStatus.lastRunnerSummary.processed}</code>
                  <span>Provider Allowed</span>
                  <code>
                    {String(
                      a2a2aRunnerStatus.lastRunnerSummary.providerCallAllowed,
                    )}
                  </code>
                </div>

                <div className="git-fixture-notice">
                  This panel reads a generated static fixture from the local
                  runner outbox. It does not poll the filesystem from the
                  browser, call LiteLLM, execute commands, mutate git, sync
                  connectors, push, deploy, or read secrets.
                </div>

                <div className="practice-grid">
                  <section
                    className="practice-artifacts"
                    aria-label="A2A2A runner role queues"
                  >
                    <div className="git-section-title">
                      <span>Role Queue Counts</span>
                      <span className="approval-badge">
                        {a2a2aRunnerStatus.roleCounts.length}
                      </span>
                    </div>
                    {a2a2aRunnerStatus.roleCounts.map((role) => (
                      <div className="practice-artifact-row" key={role.role}>
                        <span
                          className={`practice-status ${
                            role.failed > 0
                              ? "payload-blocked"
                              : "payload-ready"
                          }`}
                        >
                          {role.role}
                        </span>
                        <div>
                          <strong>
                            inbox {role.inbox} · running {role.running} · outbox{" "}
                            {role.outbox}
                          </strong>
                          <p>
                            completed {role.completed}; failed {role.failed}
                          </p>
                          <code>local file queue only</code>
                        </div>
                      </div>
                    ))}
                  </section>

                  <section
                    className="practice-artifacts"
                    aria-label="A2A2A runner latest results"
                  >
                    <div className="git-section-title">
                      <span>Latest Runner Results</span>
                      <span className="approval-badge">
                        {a2a2aRunnerStatus.latestResults.length}
                      </span>
                    </div>
                    {a2a2aRunnerStatus.latestResults.map((result) => (
                      <div className="practice-artifact-row" key={result.path}>
                        <span
                          className={`practice-status ${
                            result.providerCall
                              ? "payload-warn"
                              : "payload-ready"
                          }`}
                        >
                          {result.status}
                        </span>
                        <div>
                          <strong>
                            {result.role} → {result.nextOwner || "queue"}
                          </strong>
                          <p>{result.summary}</p>
                          <code>{result.taskId}</code>
                        </div>
                      </div>
                    ))}
                  </section>
                </div>
              </div>

              <div className="card practice-card">
                <div className="card-title">
                  <span>Dependency Readiness</span>
                  <span className="accent-emerald">
                    {a2a2aDependencyReadiness.summary.overallStatus}
                  </span>
                </div>

                <div className="practice-summary-grid">
                  <div className="practice-kpi">
                    <span>Checks</span>
                    <strong>
                      {a2a2aDependencyReadiness.summary.dependencyChecks}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Codex Queue</span>
                    <strong>
                      {a2a2aDependencyReadiness.summary.codexQueueItems}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Workers</span>
                    <strong>
                      {a2a2aDependencyReadiness.summary.workerReports}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>KOB Reports</span>
                    <strong>
                      {a2a2aDependencyReadiness.summary.kobReports}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Provider Calls</span>
                    <strong>
                      {a2a2aDependencyReadiness.summary.providerCalls}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Worst State</span>
                    <strong>
                      {a2a2aDependencyReadiness.summary.worstDependencyStatus}
                    </strong>
                  </div>
                </div>

                <div className="practice-manifest-line">
                  <span>Mode</span>
                  <code>{a2a2aDependencyReadiness.mode}</code>
                  <span>Generated By</span>
                  <code>{a2a2aDependencyReadiness.generatedBy}</code>
                  <span>Updated</span>
                  <code>{a2a2aDependencyReadiness.updatedAt}</code>
                </div>

                <div className="practice-grid">
                  <section
                    className="practice-artifacts"
                    aria-label="A2A2A dependency checks"
                  >
                    <div className="git-section-title">
                      <span>Dependency Checks</span>
                      <span className="approval-badge">
                        {a2a2aDependencyReadiness.dependencyChecks.length}
                      </span>
                    </div>
                    {a2a2aDependencyReadiness.dependencyChecks.map((check) => (
                      <div className="practice-artifact-row" key={check.id}>
                        <span
                          className={`practice-status ${getDependencyStatusClass(
                            check.status,
                          )}`}
                        >
                          {check.status}
                        </span>
                        <div>
                          <strong>{check.label}</strong>
                          <p>{check.evidence}</p>
                          <code>{check.nextAction}</code>
                        </div>
                      </div>
                    ))}
                  </section>

                  <section
                    className="practice-artifacts"
                    aria-label="A2A2A Codex build queue"
                  >
                    <div className="git-section-title">
                      <span>Codex Build Queue</span>
                      <span className="approval-badge">
                        {a2a2aDependencyReadiness.codexBuildQueue.length}
                      </span>
                    </div>
                    {a2a2aDependencyReadiness.codexBuildQueue.map((item) => (
                      <div className="practice-artifact-row" key={item.queueId}>
                        <span className="practice-status payload-ready">
                          {item.readiness}
                        </span>
                        <div>
                          <strong>
                            {item.sourceRole} → {item.targetOwner}
                          </strong>
                          <p>{item.summary}</p>
                          <code>{item.nextAction}</code>
                        </div>
                      </div>
                    ))}
                  </section>
                </div>
              </div>

              <div className="card practice-card">
                <div className="card-title">
                  <span>Codex Build Plan</span>
                  <span className="accent-cyan">
                    {a2a2aCodexBuildPlan.status}
                  </span>
                </div>

                {a2a2aCodexBuildPlan.plan ? (
                  <>
                    <div className="practice-summary-grid">
                      <div className="practice-kpi">
                        <span>Plan</span>
                        <strong>{a2a2aCodexBuildPlan.plan.planId}</strong>
                      </div>
                      <div className="practice-kpi">
                        <span>Lane</span>
                        <strong>{a2a2aCodexBuildPlan.plan.lane}</strong>
                      </div>
                      <div className="practice-kpi">
                        <span>Source Task</span>
                        <strong>{a2a2aCodexBuildPlan.plan.sourceTaskId}</strong>
                      </div>
                      <div className="practice-kpi">
                        <span>Execution</span>
                        <strong>
                          {a2a2aCodexBuildPlan.plan.executionAllowed
                            ? "ALLOW"
                            : "PLAN ONLY"}
                        </strong>
                      </div>
                    </div>

                    <div className="practice-manifest-line">
                      <span>Mode</span>
                      <code>{a2a2aCodexBuildPlan.mode}</code>
                      <span>Plan Path</span>
                      <code>
                        {a2a2aCodexBuildPlan.planPath || "not-written"}
                      </code>
                      <span>Updated</span>
                      <code>{a2a2aCodexBuildPlan.updatedAt}</code>
                    </div>

                    <div className="git-fixture-notice">
                      {a2a2aCodexBuildPlan.plan.objective} This is a plan-only
                      Codex handoff. It does not edit files or permit worker
                      execution by itself.
                    </div>

                    <div className="practice-grid">
                      <section
                        className="practice-artifacts"
                        aria-label="Codex ordered build steps"
                      >
                        <div className="git-section-title">
                          <span>Ordered Steps</span>
                          <span className="approval-badge">
                            {a2a2aCodexBuildPlan.plan.orderedSteps.length}
                          </span>
                        </div>
                        {a2a2aCodexBuildPlan.plan.orderedSteps.map((step) => (
                          <div
                            className="practice-artifact-row"
                            key={`${step.owner}-${step.action}`}
                          >
                            <span className="practice-status payload-ready">
                              {step.owner}
                            </span>
                            <div>
                              <strong>{step.action}</strong>
                              <p>{step.detail}</p>
                              <code>
                                {a2a2aCodexBuildPlan.plan?.sourceQueueId}
                              </code>
                            </div>
                          </div>
                        ))}
                      </section>

                      <section
                        className="practice-artifacts"
                        aria-label="Worker dispatch recommendations"
                      >
                        <div className="git-section-title">
                          <span>Worker Dispatch</span>
                          <span className="approval-badge">
                            {
                              a2a2aCodexBuildPlan.plan
                                .workerDispatchRecommendations.length
                            }
                          </span>
                        </div>
                        {a2a2aCodexBuildPlan.plan.workerDispatchRecommendations.map(
                          (item) => (
                            <div
                              className="practice-artifact-row"
                              key={`${item.role}-${item.when}`}
                            >
                              <span className="practice-status payload-warn">
                                {item.role}
                              </span>
                              <div>
                                <strong>{item.goal}</strong>
                                <p>{item.when}</p>
                                <code>report-only worker task</code>
                              </div>
                            </div>
                          ),
                        )}
                      </section>
                    </div>
                  </>
                ) : (
                  <div className="git-fixture-notice">
                    No Codex build queue item is ready yet. Run dependency
                    readiness after an Opus handoff exists.
                  </div>
                )}
              </div>

              <div className="practice-lower-grid">
                <div className="card">
                  <div className="card-title">
                    <span>Runner Policy Boundary</span>
                    <span className="accent-purple">No Provider Default</span>
                  </div>
                  <div className="blocked-action-list">
                    {a2a2aRunnerStatus.policyBoundary.map((item) => (
                      <span className="blocked-action payload-ready" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">
                    <span>Readiness Policy</span>
                    <span className="accent-emerald">Dependency First</span>
                  </div>
                  <div className="blocked-action-list">
                    {a2a2aDependencyReadiness.policyBoundary.map((item) => (
                      <span className="blocked-action payload-ready" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">
                    <span>Next Safe Actions</span>
                    <span className="accent-cyan">A2A2A</span>
                  </div>
                  <div className="practice-artifacts compact-list">
                    {[
                      ...a2a2aRunnerStatus.nextSafeActions,
                      ...a2a2aDependencyReadiness.nextSafeActions,
                    ].map((action) => (
                      <div className="practice-artifact-row" key={action}>
                        <span className="practice-status payload-ready">
                          next
                        </span>
                        <div>
                          <strong>{action}</strong>
                          <p>
                            Keep execution local until broker policy allows.
                          </p>
                          <code>{a2a2aRunnerStatus.generatedBy}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : activePanel === "deepResearch" ? (
            <>
              <div className="card practice-card">
                <div className="card-title">
                  <span>Deep Research OS</span>
                  <span className="accent-cyan">
                    {deepResearchStatus.summary.status}
                  </span>
                </div>

                <div className="practice-summary-grid">
                  <div className="practice-kpi">
                    <span>Docs</span>
                    <strong>{deepResearchStatus.summary.docs}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Schemas</span>
                    <strong>{deepResearchStatus.summary.schemaFiles}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Agent Roles</span>
                    <strong>{deepResearchStatus.summary.agentRoles}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Job Classes</span>
                    <strong>{deepResearchStatus.summary.jobClasses}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Output Artifacts</span>
                    <strong>
                      {deepResearchStatus.summary.outputArtifacts}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Report Pack</span>
                    <strong>
                      {deepResearchStatus.summary.reportPackArtifacts}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Source Registry</span>
                    <strong>
                      {deepResearchStatus.summary.sourceRegistryValid
                        ? "valid"
                        : "review"}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>External Exec</span>
                    <strong>
                      {deepResearchStatus.summary.externalExecutionEnabled
                        ? "on"
                        : "off"}
                    </strong>
                  </div>
                </div>

                <div className="practice-manifest-line">
                  <span>Mode</span>
                  <code>{deepResearchStatus.mode}</code>
                  <span>Runtime</span>
                  <code>{deepResearchStatus.runtimeRoot}</code>
                  <span>Updated</span>
                  <code>{deepResearchStatus.updatedAt}</code>
                </div>

                <div className="git-fixture-notice">
                  Deep Research is local-review-only here. This panel reads a
                  generated fixture and does not browse, scrape, call providers,
                  install models, run GPU jobs, publish, push, deploy, write
                  connectors, read secrets, or expose public endpoints.
                </div>

                <div className="practice-grid">
                  <section
                    className="practice-artifacts"
                    aria-label="Deep Research job classes"
                  >
                    <div className="git-section-title">
                      <span>Job Classes</span>
                      <span className="approval-badge">
                        {deepResearchStatus.jobClasses.length}
                      </span>
                    </div>
                    {deepResearchStatus.jobClasses.map((jobClass) => (
                      <div className="practice-artifact-row" key={jobClass.id}>
                        <span className="practice-status payload-ready">
                          {jobClass.gate}
                        </span>
                        <div>
                          <strong>{jobClass.id}</strong>
                          <p>{jobClass.purpose}</p>
                          <code>{jobClass.firstOutput}</code>
                        </div>
                      </div>
                    ))}
                  </section>

                  <section
                    className="practice-artifacts"
                    aria-label="Deep Research agent mesh"
                  >
                    <div className="git-section-title">
                      <span>Agent Mesh</span>
                      <span className="approval-badge">
                        {deepResearchStatus.agentMesh.length}
                      </span>
                    </div>
                    {deepResearchStatus.agentMesh.map((agent) => (
                      <div className="practice-artifact-row" key={agent}>
                        <span className="practice-status payload-ready">
                          local
                        </span>
                        <div>
                          <strong>{agent}</strong>
                          <p>Routes through the Deep Research control plane.</p>
                          <code>read-only status fixture</code>
                        </div>
                      </div>
                    ))}
                  </section>

                  <section
                    className="practice-artifacts"
                    aria-label="Deep Research output pack"
                  >
                    <div className="git-section-title">
                      <span>Output Pack</span>
                      <span className="approval-badge">
                        {deepResearchStatus.outputPack.length}
                      </span>
                    </div>
                    {deepResearchStatus.outputPack.map((artifact) => (
                      <div className="practice-artifact-row" key={artifact}>
                        <span className="practice-status payload-warn">
                          draft
                        </span>
                        <div>
                          <strong>{artifact}</strong>
                          <p>
                            Generated only inside a future local job folder.
                          </p>
                          <code>no retrieval in this panel</code>
                        </div>
                      </div>
                    ))}
                  </section>
                </div>
              </div>

              <div className="practice-lower-grid">
                <div className="card">
                  <div className="card-title">
                    <span>Local Report Pack</span>
                    <span className="accent-cyan">
                      {deepResearchStatus.reportPack.artifact_count}
                    </span>
                  </div>
                  <div className="practice-artifacts compact-list">
                    <div className="practice-artifact-row">
                      <span className="practice-status payload-ready">job</span>
                      <div>
                        <strong>{deepResearchStatus.reportPack.job_id}</strong>
                        <p>Generated local-only for review before retrieval.</p>
                        <code>{deepResearchStatus.reportPack.pack_dir}</code>
                      </div>
                    </div>
                    {deepResearchStatus.reportPack.artifacts.map((artifact) => (
                      <div className="practice-artifact-row" key={artifact}>
                        <span className="practice-status payload-ready">
                          file
                        </span>
                        <div>
                          <strong>{artifact}</strong>
                          <p>Local report-pack artifact.</p>
                          <code>read-only fixture</code>
                        </div>
                      </div>
                    ))}
                    {deepResearchStatus.reportPack.source_registry_errors.map(
                      (error) => (
                        <div className="practice-artifact-row" key={error}>
                          <span className="practice-status payload-blocked">
                            review
                          </span>
                          <div>
                            <strong>{error}</strong>
                            <p>Source registry must be corrected locally.</p>
                            <code>no retrieval until valid</code>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">
                    <span>Validation</span>
                    <span className="accent-emerald">
                      {deepResearchStatus.summary.jobPacketValid &&
                      deepResearchStatus.summary.evidencePackValid
                        ? "Valid"
                        : "Review"}
                    </span>
                  </div>
                  <div className="blocked-action-list">
                    {deepResearchValidationEntries.map(([key, value]) => (
                      <span
                        className={`blocked-action ${
                          Array.isArray(value) && value.length > 0
                            ? "payload-blocked"
                            : "payload-ready"
                        }`}
                        key={key}
                      >
                        {key}:{" "}
                        {Array.isArray(value)
                          ? value.length === 0
                            ? "ok"
                            : value.join(", ")
                          : String(value)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">
                    <span>Blocked Actions</span>
                    <span className="accent-purple">
                      {deepResearchStatus.blockedActions.length}
                    </span>
                  </div>
                  <div className="blocked-action-list">
                    {deepResearchStatus.blockedActions.map((action) => (
                      <span
                        className="blocked-action payload-blocked"
                        key={action}
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">
                    <span>Next Safe Actions</span>
                    <span className="accent-cyan">Local Only</span>
                  </div>
                  <div className="practice-artifacts compact-list">
                    {deepResearchStatus.nextSafeActions.map((action) => (
                      <div className="practice-artifact-row" key={action}>
                        <span className="practice-status payload-ready">
                          next
                        </span>
                        <div>
                          <strong>{action}</strong>
                          <p>Requires no external execution from this panel.</p>
                          <code>
                            open separate lane for retrieval/provider work
                          </code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">
                    <span>Docs + Schemas</span>
                    <span className="accent-emerald">
                      {deepResearchStatus.docs.length +
                        deepResearchStatus.schemas.length}
                    </span>
                  </div>
                  <div className="blocked-action-list">
                    {deepResearchStatus.docs.map((doc) => (
                      <span className="blocked-action payload-ready" key={doc}>
                        {doc}
                      </span>
                    ))}
                    {deepResearchStatus.schemas.map((schema) => (
                      <span
                        className="blocked-action payload-ready"
                        key={schema}
                      >
                        {schema}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : activePanel === "toolPayloads" ? (
            <>
              <div className="card practice-card">
                <div className="card-title">
                  <span>Tool Payloads + Broker Decisions</span>
                  <span className="accent-cyan">Read Only</span>
                </div>

                <div className="practice-summary-grid">
                  <div className="practice-kpi">
                    <span>Connector Payloads</span>
                    <strong>{toolIntegrationPayloadStatus.recordCount}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Broker Decisions</span>
                    <strong>{codexCommandBrokerStatus.summary.total}</strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Lease Required</span>
                    <strong>
                      {codexCommandBrokerStatus.summary.requiresExecutorLease}
                    </strong>
                  </div>
                  <div className="practice-kpi">
                    <span>Blocked</span>
                    <strong>{codexCommandBrokerStatus.summary.blocked}</strong>
                  </div>
                </div>

                <div className="practice-manifest-line">
                  <span>Payload Mode</span>
                  <code>{toolIntegrationPayloadStatus.mode}</code>
                  <span>Broker Mode</span>
                  <code>{codexCommandBrokerStatus.mode}</code>
                  <span>Updated</span>
                  <code>{codexCommandBrokerStatus.updatedAt}</code>
                </div>

                <div className="git-fixture-notice">
                  Fixture-only status panel. Mission Control does not read
                  runtime files from the browser, run shell commands, sync
                  external tools, clone repos, call providers, push, deploy, or
                  expose public endpoints.
                </div>

                <div className="practice-grid">
                  <section
                    className="practice-artifacts"
                    aria-label="Connector draft payloads"
                  >
                    <div className="git-section-title">
                      <span>Connector Drafts</span>
                      <span className="approval-badge">target-gated</span>
                    </div>
                    {toolConnectorStatuses.map((connector) => (
                      <div
                        className="practice-artifact-row"
                        key={connector.key}
                      >
                        <span
                          className={`practice-status ${getPayloadReviewStatusClass(connector.targetBound ? "ready" : "blocked")}`}
                        >
                          {connector.targetBound ? "bound" : "blocked"}
                        </span>
                        <div>
                          <strong>{connector.name}</strong>
                          <p>
                            {connector.intendedUse} · {connector.mode} ·{" "}
                            {connector.draftCount} drafts
                          </p>
                          <code>
                            targets: {connector.requiredTargets.join(", ")}
                          </code>
                        </div>
                      </div>
                    ))}
                  </section>

                  <section
                    className="practice-artifacts"
                    aria-label="Codex command broker decisions"
                  >
                    <div className="git-section-title">
                      <span>Broker Decisions</span>
                      <span className="approval-badge">runtime-fixture</span>
                    </div>
                    {brokerDecisionArtifacts.map((decision) => (
                      <div
                        className="practice-artifact-row"
                        key={decision.artifactPath}
                      >
                        <span
                          className={`practice-status ${getBrokerDecisionClass(decision.decision)}`}
                        >
                          {decision.decision}
                        </span>
                        <div>
                          <strong>
                            {decision.tool} / {decision.action}
                          </strong>
                          <p>
                            {decision.reason} · gate:{" "}
                            {decision.requiredGate || "none"}
                          </p>
                          <code>
                            {decision.targetRepo || decision.goalPreview}
                          </code>
                        </div>
                      </div>
                    ))}
                  </section>
                </div>
              </div>

              <div className="practice-lower-grid">
                <div className="card">
                  <div className="card-title">
                    <span>Payload Review Findings</span>
                    <span className="accent-purple">Local JSON</span>
                  </div>
                  <div className="evidence-checklist">
                    {toolPayloadReviewFindings.map((finding) => (
                      <div className="evidence-check-row" key={finding.label}>
                        <span
                          className={`packet-status ${getPayloadReviewStatusClass(finding.status)}`}
                        >
                          {finding.status}
                        </span>
                        <div>
                          <strong>{finding.label}</strong>
                          <p>{finding.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">
                    <span>Execution Boundary</span>
                    <span className="accent-emerald">Broker Locked</span>
                  </div>
                  <div className="blocked-action-list">
                    {[
                      ...toolPayloadBlockedActions,
                      ...brokerPolicyBoundary,
                    ].map((action) => (
                      <span className="blocked-action" key={action}>
                        {action}
                      </span>
                    ))}
                  </div>
                  <div className="approval-state-grid practice-boundary-grid">
                    <div>
                      <span>Source</span>
                      <strong>{codexCommandBrokerStatus.generatedBy}</strong>
                    </div>
                    <div>
                      <span>Runtime Glob</span>
                      <strong>{codexCommandBrokerStatus.sourceGlob}</strong>
                    </div>
                    <div>
                      <span>External Writes</span>
                      <strong>
                        {toolIntegrationPayloadStatus.policy
                          .externalWritesEnabled
                          ? "ENABLED"
                          : "DISABLED"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* OpenClaw Capability Router Card */}
              <div className="card">
                <div className="card-title">
                  <span>OpenClaw Model Router</span>
                  <span className="accent-cyan">Multi-Model Orchestrator</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.8rem",
                  }}
                >
                  <label
                    style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                  >
                    Input Prompt to Route:
                  </label>
                  <textarea
                    value={routingInput}
                    onChange={(e) => setRoutingInput(e.target.value)}
                    style={{
                      width: "100%",
                      height: "55px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid var(--border-color)",
                      color: "#fff",
                      borderRadius: "6px",
                      padding: "0.5rem",
                      fontSize: "0.8rem",
                      fontFamily: "monospace",
                      resize: "none",
                    }}
                  />
                  <button
                    onClick={handleRouteTask}
                    disabled={isRouting}
                    className="btn btn-cyan"
                    style={{ width: "100%" }}
                  >
                    {isRouting ? "Routing Task..." : "Route Task via OpenClaw"}
                  </button>

                  {routingResult && (
                    <div
                      style={{
                        background: "rgba(0,240,255,0.03)",
                        border: "1px solid rgba(0,240,255,0.15)",
                        borderRadius: "6px",
                        padding: "0.8rem",
                        fontSize: "0.8rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.4rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: 600, color: "#fff" }}>
                          Routed Model:
                        </span>
                        <span
                          className="approval-badge"
                          style={{
                            color: "var(--cyber-cyan)",
                            background: "rgba(0,240,255,0.1)",
                          }}
                        >
                          {routedModelLabel.toUpperCase()}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: 600, color: "#fff" }}>
                          Detected Task Type:
                        </span>
                        <span
                          style={{
                            color: "var(--text-muted)",
                            fontFamily: "monospace",
                          }}
                        >
                          {routedTaskTypeLabel}
                        </span>
                      </div>
                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.75rem",
                          marginTop: "0.3rem",
                          borderTop: "1px dashed var(--border-color)",
                          paddingTop: "0.4rem",
                        }}
                      >
                        {routingResult.text}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* OpenHands Terminal Sandbox Card */}
              <div className="card">
                <div className="card-title">
                  <span>OpenHands Workspace Sandbox</span>
                  <span className="accent-rose">Security Guarded</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                  }}
                >
                  <div
                    style={{
                      background: "#020306",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      padding: "0.6rem",
                      height: "140px",
                      overflowY: "auto",
                      fontFamily: "monospace",
                      fontSize: "0.75rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.4rem",
                    }}
                  >
                    {terminalHistory.map((h, idx) => (
                      <div
                        key={idx}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                          paddingBottom: "0.3rem",
                        }}
                      >
                        <div style={{ color: "var(--cyber-cyan)" }}>
                          $ {h.cmd}
                        </div>
                        <div
                          style={{
                            color:
                              h.type === "error"
                                ? "var(--cyber-rose)"
                                : "var(--text-muted)",
                            marginTop: "0.1rem",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {h.out}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <input
                      type="text"
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      placeholder="Enter command..."
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleExecuteCommand()
                      }
                      style={{
                        flexGrow: 1,
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid var(--border-color)",
                        color: "#fff",
                        borderRadius: "6px",
                        padding: "0.4rem",
                        fontSize: "0.8rem",
                        fontFamily: "monospace",
                      }}
                    />
                    <button
                      onClick={handleExecuteCommand}
                      disabled={isExecuting}
                      className="btn btn-outline"
                      style={{ padding: "0 0.8rem" }}
                    >
                      {isExecuting ? "..." : "Run"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Gemma Compliance Checker Card */}
              <div className="card">
                <div className="card-title">
                  <span>Gemma Compliance Auditor</span>
                  <span className="accent-emerald">Local Guard</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.8rem",
                  }}
                >
                  <textarea
                    value={complianceInput}
                    onChange={(e) => setComplianceInput(e.target.value)}
                    style={{
                      width: "100%",
                      height: "50px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid var(--border-color)",
                      color: "#fff",
                      borderRadius: "6px",
                      padding: "0.5rem",
                      fontSize: "0.8rem",
                      fontFamily: "monospace",
                      resize: "none",
                    }}
                  />
                  <button
                    onClick={handleAuditCompliance}
                    disabled={isAuditing}
                    className="btn btn-cyan"
                    style={{ width: "100%" }}
                  >
                    {isAuditing
                      ? "Auditing Content..."
                      : "Audit Content Compliance"}
                  </button>

                  {complianceResult && (
                    <div
                      style={{
                        background: "rgba(0,255,102,0.03)",
                        border: "1px solid rgba(0,255,102,0.15)",
                        borderRadius: "6px",
                        padding: "0.8rem",
                        fontSize: "0.8rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.4rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: 600, color: "#fff" }}>
                          Compliance status:
                        </span>
                        <span
                          style={{
                            fontWeight: 700,
                            color: complianceResult.compliant
                              ? "var(--cyber-emerald)"
                              : "var(--cyber-rose)",
                          }}
                        >
                          {complianceResult.compliant
                            ? "PASSED"
                            : "VIOLATION FOUND"}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: 600, color: "#fff" }}>
                          Safety Score:
                        </span>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            color: complianceResult.compliant
                              ? "var(--cyber-emerald)"
                              : "var(--cyber-rose)",
                          }}
                        >
                          {complianceResult.score}%
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: 600, color: "#fff" }}>
                          Audit Source:
                        </span>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            color: "var(--cyber-cyan)",
                          }}
                        >
                          {complianceResult.gatewayStatus}
                        </span>
                      </div>
                      {complianceResult.issues.length > 0 && (
                        <div
                          style={{
                            marginTop: "0.3rem",
                            borderTop: "1px dashed rgba(255,0,85,0.2)",
                            paddingTop: "0.3rem",
                          }}
                        >
                          <div
                            style={{
                              color: "var(--cyber-rose)",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          >
                            Detected Issues:
                          </div>
                          {complianceResult.issues.map(
                            (iss: string, i: number) => (
                              <div
                                key={i}
                                style={{
                                  fontSize: "0.7rem",
                                  color: "var(--text-muted)",
                                }}
                              >
                                &bull; {iss}
                              </div>
                            ),
                          )}
                        </div>
                      )}
                      {complianceResult.warnings &&
                        complianceResult.warnings.length > 0 && (
                          <div
                            style={{
                              marginTop: "0.3rem",
                              borderTop: "1px dashed rgba(255,187,0,0.2)",
                              paddingTop: "0.3rem",
                            }}
                          >
                            <div
                              style={{
                                color: "var(--cyber-amber)",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                              }}
                            >
                              Local Warnings:
                            </div>
                            {complianceResult.warnings.map(
                              (warning: string, i: number) => (
                                <div
                                  key={i}
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  &bull; {warning}
                                </div>
                              ),
                            )}
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>

              {/* SIRINX Orchestration Envelope Auditor Card */}
              <div className="card">
                <div className="card-title">
                  <span>SIRINX Envelope Auditor</span>
                  <span className="accent-cyan">Multi-Agent Auditor</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.8rem",
                  }}
                >
                  <label
                    style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                  >
                    Audit Envelope (JSON):
                  </label>
                  <textarea
                    value={envelopeInput}
                    onChange={(e) => setEnvelopeInput(e.target.value)}
                    style={{
                      width: "100%",
                      height: "110px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid var(--border-color)",
                      color: "#fff",
                      borderRadius: "6px",
                      padding: "0.5rem",
                      fontSize: "0.75rem",
                      fontFamily: "monospace",
                      resize: "vertical",
                    }}
                  />
                  <button
                    onClick={handleAuditEnvelope}
                    disabled={isAuditingEnvelope}
                    className="btn btn-cyan"
                    style={{ width: "100%" }}
                  >
                    {isAuditingEnvelope
                      ? "Auditing Envelope..."
                      : "Audit Handoff Envelope"}
                  </button>

                  {envelopeAuditResult && (
                    <div
                      style={{
                        background: envelopeAuditResult.valid
                          ? "rgba(0,255,102,0.03)"
                          : "rgba(255,0,85,0.03)",
                        border: envelopeAuditResult.valid
                          ? "1px solid rgba(0,255,102,0.15)"
                          : "1px solid rgba(255,0,85,0.15)",
                        borderRadius: "6px",
                        padding: "0.8rem",
                        fontSize: "0.8rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.4rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: 600, color: "#fff" }}>
                          Audit Validation:
                        </span>
                        <span
                          style={{
                            fontWeight: 700,
                            color: envelopeAuditResult.valid
                              ? "var(--cyber-emerald)"
                              : "var(--cyber-rose)",
                          }}
                        >
                          {envelopeAuditResult.valid
                            ? "VALID HANDOFF"
                            : "SAFETY BLOCKED"}
                        </span>
                      </div>

                      {envelopeAuditResult.errors &&
                        envelopeAuditResult.errors.length > 0 && (
                          <div
                            style={{
                              marginTop: "0.3rem",
                              borderTop: "1px dashed rgba(255,0,85,0.2)",
                              paddingTop: "0.3rem",
                            }}
                          >
                            <div
                              style={{
                                color: "var(--cyber-rose)",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                              }}
                            >
                              Safety Issues:
                            </div>
                            {envelopeAuditResult.errors.map(
                              (err: string, i: number) => (
                                <div
                                  key={i}
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  &bull; {err}
                                </div>
                              ),
                            )}
                          </div>
                        )}

                      {envelopeAuditResult.remediation &&
                        envelopeAuditResult.remediation.length > 0 && (
                          <div
                            style={{
                              marginTop: "0.3rem",
                              borderTop: "1px dashed rgba(255,187,0,0.2)",
                              paddingTop: "0.3rem",
                            }}
                          >
                            <div
                              style={{
                                color: "var(--cyber-amber)",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                              }}
                            >
                              Remediation Steps:
                            </div>
                            {envelopeAuditResult.remediation.map(
                              (rem: string, i: number) => (
                                <div
                                  key={i}
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  &bull; {rem}
                                </div>
                              ),
                            )}
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </section>

        {/* Right Column - Compliance & Command Log */}
        <section className="column">
          <div className="card">
            <div className="card-title">
              <span>Compliance Guard</span>
              <span className="accent-emerald">Secured</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Zero-Keys Leak Audit</span>
              <span
                className="stat-value"
                style={{ color: "var(--cyber-emerald)" }}
              >
                CLEAN
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Target Allowlist Gate</span>
              <span
                className="stat-value"
                style={{ color: "var(--cyber-cyan)" }}
              >
                LOCKED
              </span>
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                lineHeight: "1.4",
                background: "rgba(0,0,0,0.2)",
                padding: "0.6rem",
                borderRadius: "6px",
                border: "1px solid var(--border-color)",
              }}
            >
              <strong>Rigid Allowlist Rules:</strong> FinalRecon/Pentest Swarm
              commands strictly restricted to owned domains inside{" "}
              <code>owned-targets.txt</code>.
            </div>
          </div>

          {/* Shell / Event Log console */}
          <div className="card" style={{ flexGrow: 1 }}>
            <div className="card-title">
              <span>Live System Audit Terminal</span>
            </div>
            <div
              style={{
                background: "#020306",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                padding: "0.8rem",
                fontFamily: "monospace",
                fontSize: "0.75rem",
                height: "320px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {logs.map((log, idx) => (
                <div
                  key={idx}
                  style={{
                    color:
                      log.type === "success"
                        ? "var(--cyber-emerald)"
                        : log.type === "warn"
                          ? "var(--cyber-amber)"
                          : log.type === "security"
                            ? "var(--cyber-rose)"
                            : "#fff",
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>
                    [{log.timestamp}]
                  </span>{" "}
                  {log.message}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

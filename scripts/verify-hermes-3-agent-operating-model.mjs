import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const OPERATING_MODEL_FILES = Object.freeze({
  policy: "policies/hermes-3-agent-operating-model.v1.json",
  agents: "AGENTS.md",
  constitution: ".ai/constitution.md",
  guidance: "docs/guidance-schema.md",
});

const EXPECTED_AGENTS = Object.freeze([
  "CLAUDE_CODE",
  "CODEX",
  "OPENCODE",
]);

const HUMAN_RED_ACTIONS = Object.freeze([
  "merge",
  "push",
  "deploy",
  "dns",
  "productionDatabase",
  "marketplaceMutation",
  "customerMessage",
  "productionUse",
]);

export const CANONICAL_TOPOLOGY_FIXTURE = Object.freeze({
  runId: "fixture:hermes-3-agent-operating-model",
  activeAgents: [
    {
      principalId: "fixture:claude-maker",
      role: "CLAUDE_CODE",
      mode: "MAKER",
      writeLease: true,
    },
    {
      principalId: "fixture:codex-maker",
      role: "CODEX",
      mode: "MAKER",
      writeLease: true,
    },
    {
      principalId: "fixture:opencode-verifier",
      role: "OPENCODE",
      mode: "INDEPENDENT_VERIFIER",
      writeLease: false,
    },
  ],
  candidateAuthors: [
    {
      candidateId: "fixture:candidate-a",
      principalId: "fixture:claude-maker",
    },
    {
      candidateId: "fixture:candidate-b",
      principalId: "fixture:codex-maker",
    },
  ],
  reviews: [
    {
      candidateId: "fixture:candidate-a",
      reviewerPrincipalId: "fixture:opencode-verifier",
    },
    {
      candidateId: "fixture:candidate-b",
      reviewerPrincipalId: "fixture:opencode-verifier",
    },
  ],
  provider: {
    callRequested: false,
    exactOneUseGrant: false,
    fallbackRequested: false,
    autoFallbackRequested: false,
    fallbackDeclared: false,
  },
});

function addIssue(issues, code, message) {
  issues.push({ code, message });
}

function equalArray(left, right) {
  return (
    Array.isArray(left) &&
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function validateExactKeys(issues, value, expectedKeys, path) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    addIssue(issues, "CLOSED_SHAPE_OBJECT_REQUIRED", `${path} must be an object`);
    return;
  }

  const actualKeys = Object.keys(value);
  const expected = new Set(expectedKeys);
  for (const key of actualKeys) {
    if (!expected.has(key)) {
      addIssue(
        issues,
        "CLOSED_SHAPE_UNKNOWN_KEY",
        `${path}.${key} is not allowed`,
      );
    }
  }
  for (const key of expectedKeys) {
    if (!Object.hasOwn(value, key)) {
      addIssue(
        issues,
        "CLOSED_SHAPE_MISSING_KEY",
        `${path}.${key} is required`,
      );
    }
  }
}

export function validateOperatingModel(policy) {
  const issues = [];

  if (!policy || typeof policy !== "object" || Array.isArray(policy)) {
    return [{ code: "POLICY_OBJECT_REQUIRED", message: "policy must be an object" }];
  }

  validateExactKeys(
    issues,
    policy,
    [
      "schemaVersion",
      "policyId",
      "architectureId",
      "status",
      "authority",
      "principalCapabilities",
      "team",
      "optionalAdapters",
      "identityPolicy",
      "leases",
      "review",
      "handoff",
      "riskGates",
      "approvalPolicy",
      "productionPrerequisites",
      "providerPolicy",
      "overlayPolicy",
      "failureMode",
    ],
    "policy",
  );
  validateExactKeys(
    issues,
    policy.authority,
    ["humanOwner", "hermes", "authorityKernel", "postgresql"],
    "policy.authority",
  );
  validateExactKeys(
    issues,
    policy.principalCapabilities,
    ["HERMES", "OPENCODE"],
    "policy.principalCapabilities",
  );
  for (const principal of ["HERMES", "OPENCODE"]) {
    validateExactKeys(
      issues,
      policy.principalCapabilities?.[principal],
      [
        "worker",
        "mayAuthorProductCode",
        "mayHoldProductWriteLease",
        "maySelfApprove",
      ],
      `policy.principalCapabilities.${principal}`,
    );
  }
  validateExactKeys(
    issues,
    policy.team,
    [
      "implementationAgents",
      "maxParallelAgents",
      "maxParallelWriters",
      "independentReviewerCount",
      "roles",
    ],
    "policy.team",
  );
  validateExactKeys(
    issues,
    policy.team?.roles,
    ["CLAUDE_CODE", "CODEX", "OPENCODE"],
    "policy.team.roles",
  );
  for (const maker of ["CLAUDE_CODE", "CODEX"]) {
    validateExactKeys(
      issues,
      policy.team?.roles?.[maker],
      ["role", "defaultAccess", "primaryScope"],
      `policy.team.roles.${maker}`,
    );
  }
  validateExactKeys(
    issues,
    policy.team?.roles?.OPENCODE,
    [
      "role",
      "defaultAccess",
      "mayAuthorCandidateUnderReview",
      "mayVerifyOwnOutput",
      "mayHoldWriteLease",
    ],
    "policy.team.roles.OPENCODE",
  );
  validateExactKeys(
    issues,
    policy.optionalAdapters,
    ["KIMI"],
    "policy.optionalAdapters",
  );
  validateExactKeys(
    issues,
    policy.optionalAdapters?.KIMI,
    [
      "enabledByDefault",
      "defaultAccess",
      "requiresVerifiedAdapterContract",
      "mayBeDefaultMaker",
      "canBeDefaultWorker",
      "mayHoldWriteLease",
      "mayIssueAuthority",
    ],
    "policy.optionalAdapters.KIMI",
  );
  validateExactKeys(
    issues,
    policy.identityPolicy,
    [
      "parallelCountMode",
      "aliasesCountAsSeparateInstances",
      "duplicateRoleInstancesCountTowardLimit",
      "optionalAdaptersCountTowardParallelAgentLimit",
    ],
    "policy.identityPolicy",
  );
  validateExactKeys(
    issues,
    policy.leases,
    [
      "oneWriterPerPath",
      "isolatedWorktreePerWriter",
      "sameFrozenBaseForWriters",
      "verifierMayHoldWriteLease",
      "integrationRequiresSeparateLease",
    ],
    "policy.leases",
  );
  validateExactKeys(
    issues,
    policy.review,
    [
      "workerSelfReportsTrusted",
      "independentIdentityRequired",
      "makerMaySelfApprove",
      "finalReceiptRequired",
    ],
    "policy.review",
  );
  validateExactKeys(
    issues,
    policy.handoff,
    [
      "authority",
      "workerToWorkerExecutableInstructions",
      "versionedArtifactsRequired",
      "digestBindingRequired",
    ],
    "policy.handoff",
  );
  validateExactKeys(
    issues,
    policy.riskGates,
    HUMAN_RED_ACTIONS,
    "policy.riskGates",
  );
  validateExactKeys(
    issues,
    policy.approvalPolicy,
    [
      "humanRedApprover",
      "automatedApproval",
      "oneUseGrantRequired",
      "digestBindingRequired",
    ],
    "policy.approvalPolicy",
  );
  validateExactKeys(
    issues,
    policy.productionPrerequisites,
    ["keyRotationRequired", "existingKeyProductionUse"],
    "policy.productionPrerequisites",
  );
  validateExactKeys(
    issues,
    policy.providerPolicy,
    [
      "callAuthority",
      "oneUseGrantRequired",
      "digestBindingRequired",
      "autoFallback",
      "undeclaredFallback",
      "secretInLogs",
      "secretInArgv",
      "existingKeyScope",
      "rotationRequiredBeforeProduction",
    ],
    "policy.providerPolicy",
  );
  validateExactKeys(
    issues,
    policy.overlayPolicy,
    [
      "generatedOverlayMayExpandLimits",
      "cliRosterGrantsAuthority",
      "cmuxPaneGrantsAuthority",
      "historicalP092MayOverride",
    ],
    "policy.overlayPolicy",
  );

  if (policy.schemaVersion !== "sirinx.hermes-operating-model.v1") {
    addIssue(issues, "SCHEMA_VERSION_INVALID", "schemaVersion must be v1");
  }
  if (policy.policyId !== "HERMES_3_AGENT_OPERATING_MODEL_V1") {
    addIssue(issues, "POLICY_ID_INVALID", "policyId mismatch");
  }
  if (policy.architectureId !== "SIRINX_NEURAL_FABRIC_V1") {
    addIssue(issues, "ARCHITECTURE_ID_INVALID", "architectureId mismatch");
  }
  if (policy.status !== "ACTIVE_LOCAL_GOVERNANCE") {
    addIssue(issues, "POLICY_STATUS_INVALID", "policy status mismatch");
  }
  if (
    policy.authority?.humanOwner !== "FINAL_RISK_AUTHORITY" ||
    policy.authority?.postgresql !== "DURABLE_RECORD_ONLY"
  ) {
    addIssue(
      issues,
      "AUTHORITY_ROLES_INVALID",
      "human owner and PostgreSQL authority roles are fixed",
    );
  }
  if (policy.authority?.hermes !== "ENGINEERING_MANAGER_ONLY") {
    addIssue(
      issues,
      "HERMES_MANAGER_ONLY_REQUIRED",
      "Hermes must remain engineering-manager-only",
    );
  }
  if (policy.authority?.authorityKernel !== "SOLE_TRANSITION_AND_GRANT_ISSUER") {
    addIssue(
      issues,
      "AUTHORITY_KERNEL_REQUIRED",
      "Authority Kernel must be the sole transition and grant issuer",
    );
  }
  const hermesCapabilities = policy.principalCapabilities?.HERMES;
  if (
    hermesCapabilities?.worker !== false ||
    hermesCapabilities?.mayAuthorProductCode !== false ||
    hermesCapabilities?.mayHoldProductWriteLease !== false ||
    hermesCapabilities?.maySelfApprove !== false
  ) {
    addIssue(
      issues,
      "HERMES_CODER_FORBIDDEN",
      "Hermes cannot be a worker, author, write-lease holder, or approver",
    );
  }
  const openCodeCapabilities = policy.principalCapabilities?.OPENCODE;
  if (
    openCodeCapabilities?.worker !== true ||
    openCodeCapabilities?.mayAuthorProductCode !== false ||
    openCodeCapabilities?.mayHoldProductWriteLease !== false ||
    openCodeCapabilities?.maySelfApprove !== false
  ) {
    addIssue(
      issues,
      "OPENCODE_CAPABILITY_INVALID",
      "OpenCode must be a read-only worker and independent verifier",
    );
  }

  const implementationAgents = policy.team?.implementationAgents;
  if (!equalArray(implementationAgents, EXPECTED_AGENTS)) {
    addIssue(
      issues,
      "IMPLEMENTATION_AGENT_SET_INVALID",
      "implementation agents must be Claude Code, Codex, and OpenCode",
    );
  }
  if (
    Array.isArray(implementationAgents) &&
    implementationAgents.includes("HERMES")
  ) {
    addIssue(
      issues,
      "HERMES_CODER_FORBIDDEN",
      "Hermes cannot be an implementation agent",
    );
  }
  if (policy.team?.maxParallelAgents !== 3) {
    addIssue(
      issues,
      "MAX_PARALLEL_AGENTS_INVALID",
      "maxParallelAgents must equal 3",
    );
  }
  if (policy.team?.maxParallelWriters !== 2) {
    addIssue(
      issues,
      "MAX_PARALLEL_WRITERS_INVALID",
      "maxParallelWriters must equal 2",
    );
  }
  if (policy.team?.independentReviewerCount !== 1) {
    addIssue(
      issues,
      "INDEPENDENT_REVIEWER_COUNT_INVALID",
      "independentReviewerCount must equal 1",
    );
  }

  const roles = policy.team?.roles ?? {};
  if (Object.hasOwn(roles, "HERMES")) {
    addIssue(
      issues,
      "HERMES_CODER_FORBIDDEN",
      "Hermes cannot appear in worker roles",
    );
  }
  const writerRoleCount = Object.values(roles).filter(
    (role) => role?.defaultAccess === "BOUNDED_WRITE",
  ).length;
  if (writerRoleCount !== 2) {
    addIssue(
      issues,
      "WRITER_ROLE_COUNT_INVALID",
      "the policy must define exactly two bounded writer roles",
    );
  }
  for (const maker of ["CLAUDE_CODE", "CODEX"]) {
    if (roles[maker]?.role !== "MAKER") {
      addIssue(issues, `${maker}_MAKER_REQUIRED`, `${maker} must be a maker`);
    }
    if (roles[maker]?.defaultAccess !== "BOUNDED_WRITE") {
      addIssue(
        issues,
        `${maker}_BOUNDED_WRITE_REQUIRED`,
        `${maker} must use bounded write access`,
      );
    }
  }
  if (roles.CLAUDE_CODE?.primaryScope !== "FRONTEND_UX_DESIGN_SYSTEM") {
    addIssue(
      issues,
      "CLAUDE_CODE_SCOPE_INVALID",
      "Claude Code primary scope must remain frontend/UX/design-system",
    );
  }
  if (roles.CODEX?.primaryScope !== "BACKEND_DATA_API_TESTS") {
    addIssue(
      issues,
      "CODEX_SCOPE_INVALID",
      "Codex primary scope must remain backend/data/API/tests",
    );
  }

  const openCode = roles.OPENCODE;
  if (openCode?.role !== "INDEPENDENT_VERIFIER") {
    addIssue(
      issues,
      "OPENCODE_VERIFIER_REQUIRED",
      "OpenCode must be the independent verifier",
    );
  }
  if (openCode?.defaultAccess !== "READ_ONLY") {
    addIssue(
      issues,
      "OPENCODE_WRITE_FORBIDDEN",
      "OpenCode must be read-only by default",
    );
  }
  if (
    openCode?.mayAuthorCandidateUnderReview !== false ||
    openCode?.mayVerifyOwnOutput !== false ||
    openCode?.mayHoldWriteLease !== false
  ) {
    addIssue(
      issues,
      "SELF_REVIEW_FORBIDDEN",
      "OpenCode cannot author or self-review the candidate",
    );
  }

  const kimi = policy.optionalAdapters?.KIMI;
  if (
    kimi?.enabledByDefault !== false ||
    kimi?.defaultAccess !== "READ_ONLY" ||
    kimi?.mayBeDefaultMaker !== false ||
    kimi?.canBeDefaultWorker !== false ||
    kimi?.mayHoldWriteLease !== false ||
    kimi?.mayIssueAuthority !== false ||
    kimi?.requiresVerifiedAdapterContract !== true
  ) {
    addIssue(
      issues,
      "KIMI_OPTIONAL_READ_ONLY_REQUIRED",
      "Kimi must remain optional, read-only, and adapter-gated",
    );
  }

  if (
    policy.identityPolicy?.parallelCountMode !== "ACTIVE_AGENT_INSTANCES" ||
    policy.identityPolicy?.aliasesCountAsSeparateInstances !== true ||
    policy.identityPolicy?.duplicateRoleInstancesCountTowardLimit !== true ||
    policy.identityPolicy?.optionalAdaptersCountTowardParallelAgentLimit !==
      true
  ) {
    addIssue(
      issues,
      "ACTIVE_INSTANCE_COUNT_REQUIRED",
      "parallel limits must count active instances, aliases, and duplicate roles",
    );
  }

  if (
    policy.leases?.oneWriterPerPath !== true ||
    policy.leases?.isolatedWorktreePerWriter !== true ||
    policy.leases?.sameFrozenBaseForWriters !== true ||
    policy.leases?.verifierMayHoldWriteLease !== false ||
    policy.leases?.integrationRequiresSeparateLease !== true
  ) {
    addIssue(
      issues,
      "LEASE_INVARIANTS_INVALID",
      "writer, worktree, verifier, and integration lease invariants are required",
    );
  }

  if (
    policy.review?.workerSelfReportsTrusted !== false ||
    policy.review?.independentIdentityRequired !== true ||
    policy.review?.makerMaySelfApprove !== false ||
    policy.review?.finalReceiptRequired !== true
  ) {
    addIssue(
      issues,
      "REVIEW_INVARIANTS_INVALID",
      "independent evidence and final receipt invariants are required",
    );
  }
  if (
    policy.handoff?.authority !== "HERMES" ||
    policy.handoff?.workerToWorkerExecutableInstructions !== false ||
    policy.handoff?.versionedArtifactsRequired !== true ||
    policy.handoff?.digestBindingRequired !== true
  ) {
    addIssue(
      issues,
      "HANDOFF_INVARIANTS_INVALID",
      "handoffs must be Hermes-routed, non-executable, versioned, and digest-bound",
    );
  }

  for (const action of HUMAN_RED_ACTIONS) {
    if (policy.riskGates?.[action] !== "HUMAN_RED") {
      addIssue(
        issues,
        `HUMAN_RED_${action.toUpperCase()}_REQUIRED`,
        `${action} must remain HUMAN_RED`,
      );
    }
  }
  if (
    policy.approvalPolicy?.humanRedApprover !== "HUMAN_OWNER" ||
    policy.approvalPolicy?.automatedApproval !== false ||
    policy.approvalPolicy?.oneUseGrantRequired !== true ||
    policy.approvalPolicy?.digestBindingRequired !== true
  ) {
    addIssue(
      issues,
      "NON_HUMAN_APPROVAL_FORBIDDEN",
      "HUMAN_RED requires a digest-bound one-use human-owner approval",
    );
  }
  if (
    policy.productionPrerequisites?.keyRotationRequired !== true ||
    policy.productionPrerequisites?.existingKeyProductionUse !== false
  ) {
    addIssue(
      issues,
      "PRODUCTION_ROTATION_GATE_REQUIRED",
      "production requires key rotation in addition to HUMAN_RED approval",
    );
  }

  const provider = policy.providerPolicy;
  if (provider?.callAuthority !== "SEPARATE_EXACT_GATE") {
    addIssue(
      issues,
      "PROVIDER_EXACT_GATE_REQUIRED",
      "provider calls require a separate exact gate",
    );
  }
  if (
    provider?.oneUseGrantRequired !== true ||
    provider?.digestBindingRequired !== true
  ) {
    addIssue(
      issues,
      "PROVIDER_ONE_USE_BINDING_REQUIRED",
      "provider calls require a one-use digest-bound grant",
    );
  }
  if (
    provider?.autoFallback !== false ||
    provider?.undeclaredFallback !== "DENY"
  ) {
    addIssue(
      issues,
      "PROVIDER_AUTO_FALLBACK_FORBIDDEN",
      "automatic or undeclared provider fallback is forbidden",
    );
  }
  if (provider?.secretInLogs !== false || provider?.secretInArgv !== false) {
    addIssue(
      issues,
      "PROVIDER_SECRET_EXPOSURE_FORBIDDEN",
      "provider secrets must not appear in logs or argv",
    );
  }
  if (
    provider?.existingKeyScope !== "LOCAL_DEV_TEST_ONLY" ||
    provider?.rotationRequiredBeforeProduction !== true
  ) {
    addIssue(
      issues,
      "PROVIDER_KEY_SCOPE_INVALID",
      "existing key must be local-dev/test-only and rotated before production",
    );
  }

  const overlay = policy.overlayPolicy;
  if (
    overlay?.generatedOverlayMayExpandLimits !== false ||
    overlay?.cliRosterGrantsAuthority !== false ||
    overlay?.cmuxPaneGrantsAuthority !== false ||
    overlay?.historicalP092MayOverride !== false
  ) {
    addIssue(
      issues,
      "OVERLAY_EXPANSION_FORBIDDEN",
      "generated overlays, rosters, cmux panes, and P092 cannot expand authority",
    );
  }

  if (policy.failureMode !== "FAIL_CLOSED") {
    addIssue(issues, "FAIL_CLOSED_REQUIRED", "failureMode must be FAIL_CLOSED");
  }

  return issues;
}

export function validateRunTopology(policy, run) {
  const issues = [...validateOperatingModel(policy)];
  if (!policy || typeof policy !== "object" || Array.isArray(policy)) {
    return issues;
  }

  validateExactKeys(
    issues,
    run,
    ["runId", "activeAgents", "candidateAuthors", "reviews", "provider"],
    "run",
  );

  const activeAgents = Array.isArray(run?.activeAgents) ? run.activeAgents : [];
  const candidateAuthors = Array.isArray(run?.candidateAuthors)
    ? run.candidateAuthors
    : [];
  const reviews = Array.isArray(run?.reviews) ? run.reviews : [];

  if (!Array.isArray(run?.activeAgents)) {
    addIssue(
      issues,
      "ACTIVE_AGENTS_ARRAY_REQUIRED",
      "run.activeAgents must be an array",
    );
  }
  if (!Array.isArray(run?.candidateAuthors)) {
    addIssue(
      issues,
      "CANDIDATE_AUTHORS_ARRAY_REQUIRED",
      "run.candidateAuthors must be an array",
    );
  }
  if (!Array.isArray(run?.reviews)) {
    addIssue(issues, "REVIEWS_ARRAY_REQUIRED", "run.reviews must be an array");
  }

  for (const [index, agent] of activeAgents.entries()) {
    validateExactKeys(
      issues,
      agent,
      ["principalId", "role", "mode", "writeLease"],
      `run.activeAgents[${index}]`,
    );
  }
  for (const [index, author] of candidateAuthors.entries()) {
    validateExactKeys(
      issues,
      author,
      ["candidateId", "principalId"],
      `run.candidateAuthors[${index}]`,
    );
  }
  for (const [index, review] of reviews.entries()) {
    validateExactKeys(
      issues,
      review,
      ["candidateId", "reviewerPrincipalId"],
      `run.reviews[${index}]`,
    );
  }
  validateExactKeys(
    issues,
    run?.provider,
    [
      "callRequested",
      "exactOneUseGrant",
      "fallbackRequested",
      "autoFallbackRequested",
      "fallbackDeclared",
    ],
    "run.provider",
  );

  if (activeAgents.length > policy.team?.maxParallelAgents) {
    addIssue(
      issues,
      "RUN_MAX_PARALLEL_AGENTS_EXCEEDED",
      `run has ${activeAgents.length} active agents`,
    );
  }

  const writerAgents = activeAgents.filter((agent) => agent?.writeLease === true);
  if (writerAgents.length > policy.team?.maxParallelWriters) {
    addIssue(
      issues,
      "RUN_MAX_PARALLEL_WRITERS_EXCEEDED",
      `run has ${writerAgents.length} active writers`,
    );
  }

  const allowedRoles = new Set([
    ...EXPECTED_AGENTS,
    ...Object.keys(policy.optionalAdapters ?? {}),
  ]);
  const principals = new Map();
  for (const agent of activeAgents) {
    if (typeof agent?.principalId === "string") {
      if (principals.has(agent.principalId)) {
        addIssue(
          issues,
          "DUPLICATE_PRINCIPAL_ID_FORBIDDEN",
          `principal ${agent.principalId} appears more than once`,
        );
      }
      principals.set(agent.principalId, agent);
    }
    if (!allowedRoles.has(agent?.role)) {
      addIssue(
        issues,
        "RUN_ROLE_NOT_ALLOWED",
        `role ${String(agent?.role)} is not allowed`,
      );
    }
    if (agent?.role === "HERMES") {
      addIssue(
        issues,
        "RUN_HERMES_CODER_FORBIDDEN",
        "Hermes cannot be an active worker",
      );
    }
    if (agent?.role === "OPENCODE" && agent?.writeLease !== false) {
      addIssue(
        issues,
        "RUN_OPENCODE_WRITE_FORBIDDEN",
        "OpenCode cannot hold a write lease",
      );
    }
    if (
      agent?.role === "KIMI" &&
      (agent?.mode !== "READ_ONLY_ADAPTER" || agent?.writeLease !== false)
    ) {
      addIssue(
        issues,
        "RUN_KIMI_READ_ONLY_REQUIRED",
        "Kimi must be a read-only adapter and counts toward the agent limit",
      );
    }
  }

  const verifierAgents = activeAgents.filter(
    (agent) =>
      agent?.role === "OPENCODE" &&
      agent?.mode === "INDEPENDENT_VERIFIER" &&
      agent?.writeLease === false,
  );
  if (verifierAgents.length !== policy.team?.independentReviewerCount) {
    addIssue(
      issues,
      "RUN_INDEPENDENT_REVIEWER_COUNT_INVALID",
      "run must have exactly one independent OpenCode verifier",
    );
  }

  const authorByCandidate = new Map();
  for (const author of candidateAuthors) {
    const agent = principals.get(author?.principalId);
    authorByCandidate.set(author?.candidateId, author?.principalId);
    if (
      !agent ||
      !["CLAUDE_CODE", "CODEX"].includes(agent.role) ||
      agent.mode !== "MAKER" ||
      agent.writeLease !== true
    ) {
      addIssue(
        issues,
        "RUN_CANDIDATE_AUTHOR_FORBIDDEN",
        `candidate ${String(author?.candidateId)} has an invalid author`,
      );
    }
  }

  const reviewCountByCandidate = new Map();
  for (const review of reviews) {
    const reviewer = principals.get(review?.reviewerPrincipalId);
    reviewCountByCandidate.set(
      review?.candidateId,
      (reviewCountByCandidate.get(review?.candidateId) ?? 0) + 1,
    );
    if (
      !reviewer ||
      reviewer.role !== "OPENCODE" ||
      reviewer.mode !== "INDEPENDENT_VERIFIER" ||
      reviewer.writeLease !== false
    ) {
      addIssue(
        issues,
        "RUN_REVIEWER_IDENTITY_INVALID",
        `candidate ${String(review?.candidateId)} has an invalid reviewer`,
      );
    }
    if (
      authorByCandidate.get(review?.candidateId) === review?.reviewerPrincipalId
    ) {
      addIssue(
        issues,
        "RUN_SELF_REVIEW_FORBIDDEN",
        `candidate ${String(review?.candidateId)} is self-reviewed`,
      );
    }
  }
  for (const candidateId of authorByCandidate.keys()) {
    if (reviewCountByCandidate.get(candidateId) !== 1) {
      addIssue(
        issues,
        "RUN_CANDIDATE_REVIEW_COUNT_INVALID",
        `candidate ${String(candidateId)} must have exactly one review`,
      );
    }
  }

  const provider = run?.provider;
  if (provider?.callRequested === true && provider?.exactOneUseGrant !== true) {
    addIssue(
      issues,
      "RUN_PROVIDER_EXACT_GATE_REQUIRED",
      "a provider call requires an exact one-use grant",
    );
  }
  if (
    provider?.autoFallbackRequested === true ||
    (provider?.fallbackRequested === true &&
      provider?.fallbackDeclared !== true)
  ) {
    addIssue(
      issues,
      "RUN_PROVIDER_AUTO_FALLBACK_FORBIDDEN",
      "automatic or undeclared provider fallback is forbidden",
    );
  }

  return issues;
}

function requireText(issues, documentName, text, fragments) {
  for (const fragment of fragments) {
    if (!text.includes(fragment)) {
      addIssue(
        issues,
        `${documentName.toUpperCase()}_MISSING_REQUIRED_TEXT`,
        `${documentName} is missing required text: ${fragment}`,
      );
    }
  }
}

function validateOmxMarkers(issues, agentsText) {
  const markerPattern =
    /^<!-- (OMX(?::[A-Z0-9-]+)+):(START|END) -->$/;
  const stack = [];
  const counts = new Map();

  for (const rawLine of agentsText.split(/\r?\n/u)) {
    const match = rawLine.trim().match(markerPattern);
    if (!match) continue;

    const [, markerId, boundary] = match;
    const countKey = `${markerId}:${boundary}`;
    counts.set(countKey, (counts.get(countKey) ?? 0) + 1);

    if (boundary === "START") {
      stack.push(markerId);
      continue;
    }

    const activeMarker = stack.pop();
    if (activeMarker !== markerId) {
      addIssue(
        issues,
        "OMX_MARKER_ORDER_INVALID",
        `expected END for ${activeMarker ?? "none"} but found ${markerId}`,
      );
    }
  }

  for (const markerId of stack) {
    addIssue(
      issues,
      "OMX_MARKER_UNBALANCED",
      `${markerId} is missing its END marker`,
    );
  }
  for (const [countKey, count] of counts) {
    if (count !== 1) {
      addIssue(
        issues,
        "OMX_MARKER_DUPLICATE",
        `${countKey} occurs ${count} times`,
      );
    }
  }
  for (const required of ["OMX:AGENTS:START", "OMX:AGENTS:END"]) {
    if (counts.get(required) !== 1) {
      addIssue(
        issues,
        "OMX_AGENTS_MARKER_REQUIRED",
        `${required} must occur exactly once`,
      );
    }
  }
}

export function validateGuidanceDocuments({
  agentsText,
  constitutionText,
  guidanceText,
}) {
  const issues = [];

  requireText(issues, "agents", agentsText, [
    "HERMES_ROLE           = ENGINEERING_MANAGER_ONLY",
    "IMPLEMENTATION_AGENTS = CLAUDE_CODE + CODEX + OPENCODE",
    "MAX_PARALLEL_AGENTS   = 3",
    "MAX_PARALLEL_WRITERS  = 2",
    "INDEPENDENT_REVIEWER  = 1",
    "KIMI                  = OPTIONAL_READ_ONLY_ADAPTER",
    "MERGE_DEPLOY_PROD     = HUMAN_RED",
    "PROVIDER_CALL         = SEPARATE_EXACT_GATE",
    "policies/hermes-3-agent-operating-model.v1.json",
    "P092 and other pre-Neural-Fabric role assignments are historical inputs only.",
  ]);
  requireText(issues, "constitution", constitutionText, [
    "Hermes must not",
    "**Claude Code** is the bounded frontend/UX maker.",
    "**Codex** is the bounded backend/data/API maker.",
    "**OpenCode** is the independent read-only verifier.",
    "MAX_PARALLEL_AGENTS  = 3",
    "MAX_PARALLEL_WRITERS = 2",
    "INDEPENDENT_REVIEWER = 1",
    "policies/hermes-3-agent-operating-model.v1.json",
    "No policy overlay, tool mode, or agent may downgrade `HUMAN_RED`.",
  ]);
  requireText(issues, "guidance", guidanceText, [
    "Lower layers may narrow execution.",
    "no more than three worker agents per engineering run",
    "no more than two concurrent write leases",
    "policies/hermes-3-agent-operating-model.v1.json",
    "OpenCode a default writer or permits self-review",
    "enables provider calls or undeclared fallback",
    "No final receipt means the task cannot enter `DONE`.",
  ]);
  const canonicalSectionIndex = agentsText.indexOf(
    "## Hermes 3-Agent Engineering Operating Model V1",
  );
  const omxStartIndex = agentsText.indexOf("<!-- OMX:AGENTS:START -->");
  if (
    canonicalSectionIndex === -1 ||
    omxStartIndex === -1 ||
    canonicalSectionIndex > omxStartIndex
  ) {
    addIssue(
      issues,
      "CANONICAL_POLICY_PRECEDENCE_INVALID",
      "canonical operating model must appear before the generated OMX block",
    );
  }
  validateOmxMarkers(issues, agentsText);

  const forbiddenDocumentPatterns = [
    {
      code: "SIX_AGENT_OVERLAY_FORBIDDEN",
      pattern: /max\s+6\s+concurrent\s+child\s+agents/i,
    },
    {
      code: "AUTONOMOUS_UNSCOPED_EXECUTION_FORBIDDEN",
      pattern:
        /AUTONOMOUS CODING AGENT\. EXECUTE TASKS TO COMPLETION WITHOUT ASKING FOR PERMISSION/i,
    },
    {
      code: "OPENCODE_EXECUTOR_TOPOLOGY_FORBIDDEN",
      pattern: /OpenCode\s*(?:\([^)]*\))?\s*(?::|as)\s*(?:the\s+)?executor/i,
    },
    {
      code: "CODEX_REVIEWER_TOPOLOGY_FORBIDDEN",
      pattern: /Codex\s*(?:\([^)]*\))?\s*(?::|as)\s*(?:an?\s+)?(?:adversarial\s+)?reviewer/i,
    },
    {
      code: "OMX_SETUP_IMPLICIT_AUTHORITY_FORBIDDEN",
      pattern: /Execute `omx setup` to install all components/i,
    },
  ];

  for (const { code, pattern } of forbiddenDocumentPatterns) {
    for (const [name, text] of [
      ["AGENTS.md", agentsText],
      [".ai/constitution.md", constitutionText],
      ["docs/guidance-schema.md", guidanceText],
    ]) {
      if (pattern.test(text)) {
        addIssue(issues, code, `${name} contains conflicting guidance`);
      }
    }
  }

  return issues;
}

export function readOperatingModelBundle(root = process.cwd()) {
  const missing = Object.values(OPERATING_MODEL_FILES).filter(
    (relativePath) => !existsSync(resolve(root, relativePath)),
  );
  if (missing.length > 0) {
    throw new Error(`missing operating-model files: ${missing.join(", ")}`);
  }

  return {
    policy: JSON.parse(
      readFileSync(resolve(root, OPERATING_MODEL_FILES.policy), "utf8"),
    ),
    agentsText: readFileSync(resolve(root, OPERATING_MODEL_FILES.agents), "utf8"),
    constitutionText: readFileSync(
      resolve(root, OPERATING_MODEL_FILES.constitution),
      "utf8",
    ),
    guidanceText: readFileSync(
      resolve(root, OPERATING_MODEL_FILES.guidance),
      "utf8",
    ),
  };
}

export function verifyHermesOperatingModel(root = process.cwd()) {
  const bundle = readOperatingModelBundle(root);
  const issues = [
    ...validateGuidanceDocuments(bundle),
    ...validateRunTopology(bundle.policy, CANONICAL_TOPOLOGY_FIXTURE),
  ];

  if (issues.length > 0) {
    const error = new Error(
      issues.map(({ code, message }) => `${code}: ${message}`).join("\n"),
    );
    error.issues = issues;
    throw error;
  }

  return {
    status: "POLICY_OK",
    policyId: bundle.policy.policyId,
    architectureId: bundle.policy.architectureId,
    implementationAgents: bundle.policy.team.implementationAgents,
    maxParallelAgents: bundle.policy.team.maxParallelAgents,
    maxParallelWriters: bundle.policy.team.maxParallelWriters,
    independentReviewerCount: bundle.policy.team.independentReviewerCount,
    providerCallAuthority: bundle.policy.providerPolicy.callAuthority,
    productionUse: bundle.policy.riskGates.productionUse,
    productionKeyRotationRequired:
      bundle.policy.productionPrerequisites.keyRotationRequired,
  };
}

const isDirectExecution =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isDirectExecution) {
  try {
    console.log(JSON.stringify(verifyHermesOperatingModel(), null, 2));
  } catch (error) {
    console.error("Hermes operating-model gate failed.");
    console.error(error.message);
    process.exitCode = 1;
  }
}

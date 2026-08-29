import { createHash } from "node:crypto";
import { types as utilTypes } from "node:util";

export const RESOURCE_RECOVERY_BOOTSTRAP_REVIEW_SCHEMA_URL = new URL(
  "../../../schemas/agent-runtime/resource-recovery-bootstrap-review.v1.schema.json",
  import.meta.url
);

export const RESOURCE_RECOVERY_BOOTSTRAP_REPOSITORY_PATH =
  "/Users/sirinx/SIRINXDev/sirinx-co";
export const RESOURCE_RECOVERY_BOOTSTRAP_REPOSITORY_BRANCH =
  "agent/b1-b2-command-center";
export const RESOURCE_RECOVERY_BOOTSTRAP_REPOSITORY_HEAD =
  "1f05814c3e9d173e525234d69b3ce7f2d1b01a57";
export const RESOURCE_RECOVERY_BOOTSTRAP_STATUS = "BOOTSTRAP_REVIEW_BLOCKED";
export const RESOURCE_RECOVERY_BOOTSTRAP_CLAIM_CEILING =
  "COMPARISON_ONLY_RECORDED_METADATA_NO_AUTHORITY";
export const RESOURCE_RECOVERY_BOOTSTRAP_REVIEW_ID = "RRBR-A32-20260721";
export const RESOURCE_RECOVERY_BOOTSTRAP_TASK_ID = "TASK-RESOURCE-RECOVERY-BOOTSTRAP";
export const RESOURCE_RECOVERY_BOOTSTRAP_RUN_ID = "RUN-A32-RESOURCE-RECOVERY-001";
export const RESOURCE_RECOVERY_BOOTSTRAP_OBSERVED_AT = "2026-07-21T04:40:19+07:00";
export const RESOURCE_RECOVERY_BOOTSTRAP_EXPIRES_AT = "2026-07-21T05:40:19+07:00";
export const RESOURCE_RECOVERY_BOOTSTRAP_PACKET_DIGEST =
  "67f729a0f729535c68a9f7ba244f6999289799f1e2271aa2d264c37079415268";
export const RESOURCE_RECOVERY_BOOTSTRAP_MAX_LIFETIME_SECONDS = 3600;
export const RESOURCE_RECOVERY_BOOTSTRAP_CURRENT_FREE_KIB = 11_820_344;
export const RESOURCE_RECOVERY_BOOTSTRAP_FILESYSTEM_DEVICE_ID = 16_777_232;
export const RESOURCE_RECOVERY_BOOTSTRAP_WORKLOAD_FLOOR_KIB = 15 * 1024 * 1024;
export const RESOURCE_RECOVERY_BOOTSTRAP_CONSERVATIVE_TARGET_KIB = 20 * 1024 * 1024;

function freezeLiteral(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const entry of Object.values(value)) freezeLiteral(entry);
    Object.freeze(value);
  }
  return value;
}

export const RESOURCE_RECOVERY_BOOTSTRAP_PARENT_ARTIFACTS = freezeLiteral([
  {
    artifactId: "A22_REPORT",
    path: `${RESOURCE_RECOVERY_BOOTSTRAP_REPOSITORY_PATH}/reports/runtime/resource-recovery-admission-plan-20260720.md`,
    sha256: "d22040817758472d68587f48b070e6a16686a4f0419005cad85836b17c9bccc3"
  },
  {
    artifactId: "A23_PLAN",
    path: `${RESOURCE_RECOVERY_BOOTSTRAP_REPOSITORY_PATH}/config/agent-runtime/resource-cleanup.plan-only.v2.json`,
    sha256: "859a31f0ed505450f78321d738f43b0d4f204ed745834b1436ab000536470ad1"
  },
  {
    artifactId: "A31_PACKET",
    path: `${RESOURCE_RECOVERY_BOOTSTRAP_REPOSITORY_PATH}/config/agent-runtime/resource-cleanup.review-request.v1.json`,
    sha256: "d7c700253d3b6a6666cb3f321960be00e3aa91a834cef3f0f232df7b7d661ec2"
  },
  {
    artifactId: "A31_REPORT",
    path: `${RESOURCE_RECOVERY_BOOTSTRAP_REPOSITORY_PATH}/reports/runtime/resource-cleanup-review-request-20260721.md`,
    sha256: "0d86a0a8441c29720c4934f13c036dcf95eb643afea3844f5071f476587e1a65"
  }
]);

export const RESOURCE_RECOVERY_BOOTSTRAP_CANDIDATE_PINS = freezeLiteral([
  {
    candidateId: "C01",
    path: `${RESOURCE_RECOVERY_BOOTSTRAP_REPOSITORY_PATH}/target`,
    realPath: `${RESOURCE_RECOVERY_BOOTSTRAP_REPOSITORY_PATH}/target`,
    targetClass: "GENERATED_BUILD_OUTPUT",
    disposition: "CANDIDATE_UNVERIFIED",
    kind: "DIRECTORY",
    isSymlink: false,
    deviceId: RESOURCE_RECOVERY_BOOTSTRAP_FILESYSTEM_DEVICE_ID,
    inode: 35_550_880,
    mode: "0755",
    linkCount: 6,
    allocatedKiB: 3_125_988,
    logicalKiB: 3_098_930,
    metadataScope: "LSTAT_ROOT_IDENTITY_PLUS_ALLOCATED_LOGICAL_SIZE_NO_CONTENT_MANIFEST"
  },
  {
    candidateId: "C02a",
    path: "/Users/sirinx/.npm/_npx/7a45358b2a5848bb",
    realPath: "/Users/sirinx/.npm/_npx/7a45358b2a5848bb",
    targetClass: "PACKAGE_CACHE_ENTRY",
    disposition: "EXCEPTION_CANDIDATE",
    kind: "DIRECTORY",
    isSymlink: false,
    deviceId: RESOURCE_RECOVERY_BOOTSTRAP_FILESYSTEM_DEVICE_ID,
    inode: 36_387_099,
    mode: "0755",
    linkCount: 5,
    allocatedKiB: 2_619_468,
    logicalKiB: 2_397_745,
    metadataScope: "LSTAT_ROOT_IDENTITY_PLUS_ALLOCATED_LOGICAL_SIZE_NO_CONTENT_MANIFEST"
  },
  {
    candidateId: "C05a",
    path: "/Users/sirinx/Library/pnpm/store/v3",
    realPath: "/Users/sirinx/Library/pnpm/store/v3",
    targetClass: "PACKAGE_STORE_GENERATION",
    disposition: "EXCEPTION_CANDIDATE",
    kind: "DIRECTORY",
    isSymlink: false,
    deviceId: RESOURCE_RECOVERY_BOOTSTRAP_FILESYSTEM_DEVICE_ID,
    inode: 3_865_928,
    mode: "0755",
    linkCount: 3,
    allocatedKiB: 1_931_228,
    logicalKiB: 1_705_487,
    metadataScope: "LSTAT_ROOT_IDENTITY_PLUS_ALLOCATED_LOGICAL_SIZE_NO_CONTENT_MANIFEST"
  },
  {
    candidateId: "C05b",
    path: "/Users/sirinx/Library/pnpm/store/v10",
    realPath: "/Users/sirinx/Library/pnpm/store/v10",
    targetClass: "PACKAGE_STORE_GENERATION",
    disposition: "EXCEPTION_CANDIDATE",
    kind: "DIRECTORY",
    isSymlink: false,
    deviceId: RESOURCE_RECOVERY_BOOTSTRAP_FILESYSTEM_DEVICE_ID,
    inode: 1_187_695,
    mode: "0755",
    linkCount: 5,
    allocatedKiB: 2_950_664,
    logicalKiB: 2_683_175,
    metadataScope: "LSTAT_ROOT_IDENTITY_PLUS_ALLOCATED_LOGICAL_SIZE_NO_CONTENT_MANIFEST"
  }
]);

export const RESOURCE_RECOVERY_BOOTSTRAP_INELIGIBLE_ROOTS = freezeLiteral([
  { path: "/Users/sirinx/.npm/_npx", reason: "WHOLESALE_ROOT_INELIGIBLE" },
  { path: "/Users/sirinx/.npm/_cacache", reason: "WHOLESALE_ROOT_INELIGIBLE" },
  { path: "/Users/sirinx/go/pkg/mod", reason: "WHOLESALE_ROOT_INELIGIBLE" },
  { path: "/Users/sirinx/Library/pnpm/store", reason: "WHOLESALE_ROOT_INELIGIBLE" }
]);

export const RESOURCE_RECOVERY_BOOTSTRAP_KEEP_BY_DEFAULT_TARGETS = freezeLiteral([
  {
    candidateId: "C05c",
    path: "/Users/sirinx/Library/pnpm/store/v11",
    targetClass: "PACKAGE_STORE_GENERATION",
    disposition: "KEEP_BY_DEFAULT"
  },
  {
    candidateId: "C06",
    path: "/Users/sirinx/.cargo/registry",
    targetClass: "PACKAGE_REGISTRY",
    disposition: "KEEP_BY_DEFAULT"
  }
]);

export const RESOURCE_RECOVERY_BOOTSTRAP_REQUIRED_BLOCKERS = freezeLiteral([
  "apfs_unique_extent_proof_absent",
  "bootstrap_authority_unavailable",
  "candidate_specific_operation_plans_absent",
  "clone_isolation_proof_absent",
  "consumer_absence_proof_absent",
  "hardlink_isolation_proof_absent",
  "migration_0007_registry_semantics_unresolved",
  "no_single_target_meets_threshold",
  "recovery_proof_absent",
  "staged_recovery_policy_unresolved"
]);

const SHA256 = /^[0-9a-f]{64}$/;
const COMMIT_SHA = /^[0-9a-f]{40}$/;
const REVIEW_ID = /^RRBR-[A-Za-z0-9._-]+$/;
const TASK_ID = /^TASK-[A-Za-z0-9._-]+$/;
const RUN_ID = /^RUN-[A-Za-z0-9._-]+$/;
const MAX_KIB = 1_099_511_627_776;
const MAX_JSON_DEPTH = 64;
const MAX_JSON_NODES = 10_000;
const MAX_JSON_PROPERTIES = 128;
const MAX_JSON_ARRAY_LENGTH = 64;

const TOP_LEVEL_KEYS = [
  "action",
  "authority",
  "blockers",
  "candidates",
  "circuit",
  "claimCeiling",
  "effects",
  "expiresAt",
  "ineligibleRoots",
  "keepByDefaultTargets",
  "observedAt",
  "packetDigest",
  "parentArtifacts",
  "policy",
  "repository",
  "resources",
  "reviewId",
  "runId",
  "schemaVersion",
  "status",
  "taskId"
];
const REPOSITORY_KEYS = ["branch", "headSha", "path"];
const PARENT_ARTIFACT_KEYS = ["artifactId", "path", "sha256"];
const RESOURCE_KEYS = [
  "conservativeTargetKiB",
  "currentFreeKiB",
  "filesystemDeviceId",
  "workloadFloorKiB"
];
const CANDIDATE_KEYS = [
  "allocatedKiB",
  "approvalEligible",
  "candidateId",
  "deviceId",
  "disposition",
  "guaranteedMinimumReclaimKiB",
  "inode",
  "isSymlink",
  "kind",
  "linkCount",
  "logicalKiB",
  "metadataDigest",
  "metadataScope",
  "mode",
  "nominalProjectedFreeKiB",
  "operationPlanBound",
  "path",
  "proofs",
  "realPath",
  "targetClass"
];
const PROOF_KEYS = [
  "apfsUniqueExtentVerified",
  "cloneIsolationVerified",
  "consumerAbsenceVerified",
  "hardlinkIsolationVerified",
  "recoveryVerified"
];
const INELIGIBLE_ROOT_KEYS = ["path", "reason"];
const KEEP_TARGET_KEYS = ["candidateId", "disposition", "path", "targetClass"];
const POLICY_KEYS = [
  "aggregateReclaimCredited",
  "automaticContinuation",
  "multiTargetGrantAllowed",
  "sequentialOneTargetGrantsRequired",
  "stopAndRemeasureAfterEach"
];
const AUTHORITY_KEYS = [
  "admitted",
  "approvalConsumed",
  "authorized",
  "bootstrapAuthorityAvailable",
  "canDispatch",
  "canExecute",
  "circuitOpen",
  "durableAuthorityAvailable",
  "executorAvailable",
  "humanApprovalPresent",
  "replayProtectionAvailable",
  "singleTargetGrantPresent"
];
const EFFECT_KEYS = [
  "cachePruned",
  "cleanupExecuted",
  "commandExecuted",
  "databaseWrites",
  "externalWrites",
  "filesDeleted",
  "networkCalls",
  "processStopped",
  "runtimeActivated",
  "storePruned",
  "trashMoved"
];

function fail(code) {
  throw new Error(`invalid_resource_recovery_bootstrap_review:${code}`);
}

function assertPlainJsonGraph(
  value,
  label = "packet",
  seen = new WeakSet(),
  depth = 0,
  budget = { nodes: 0 }
) {
  if (depth > MAX_JSON_DEPTH) fail(`${label}_exceeds_maximum_depth`);
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail(`${label}_contains_non_finite_number`);
    return;
  }
  if (typeof value !== "object") fail(`${label}_contains_non_json_value`);
  if (utilTypes.isProxy(value)) fail(`${label}_contains_proxy`);
  if (seen.has(value)) fail(`${label}_contains_cycle_or_shared_reference`);
  seen.add(value);
  budget.nodes += 1;
  if (budget.nodes > MAX_JSON_NODES) fail(`${label}_exceeds_node_limit`);

  const names = Object.getOwnPropertyNames(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (names.length > MAX_JSON_PROPERTIES) fail(`${label}_exceeds_property_limit`);
  if (Object.getOwnPropertySymbols(value).length !== 0) fail(`${label}_contains_symbol_property`);

  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) fail(`${label}_array_prototype`);
    if (value.length > MAX_JSON_ARRAY_LENGTH) fail(`${label}_exceeds_array_limit`);
    if (
      names.length !== value.length + 1 ||
      names[names.length - 1] !== "length" ||
      names.slice(0, -1).some((name, index) => name !== String(index))
    ) fail(`${label}_sparse_or_extended_array`);
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (!descriptor || !("value" in descriptor) || descriptor.get || descriptor.set || !descriptor.enumerable) {
        fail(`${label}_${index}_not_plain_data`);
      }
      assertPlainJsonGraph(descriptor.value, `${label}_${index}`, seen, depth + 1, budget);
    }
    return;
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) fail(`${label}_object_prototype`);
  for (const name of names) {
    const descriptor = descriptors[name];
    if (!descriptor || !("value" in descriptor) || descriptor.get || descriptor.set || !descriptor.enumerable) {
      fail(`${label}_${name}_not_plain_data`);
    }
    assertPlainJsonGraph(descriptor.value, `${label}_${name}`, seen, depth + 1, budget);
  }
}

function exactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label}_must_be_object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label}_must_be_closed`);
  }
}

function exact(value, expected, label) {
  if (value !== expected) fail(label);
}

function safeInteger(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    fail(`${label}_must_be_bounded_integer`);
  }
}

function sha256(value, label) {
  if (typeof value !== "string" || !SHA256.test(value)) fail(`${label}_must_be_sha256`);
}

function boundedIdentifier(value, expression, label) {
  if (typeof value !== "string" || value.length > 128 || !expression.test(value)) fail(label);
}

function validDateTime(value, label) {
  const match = typeof value === "string"
    ? value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-](\d{2}):(\d{2}))$/)
    : null;
  if (!match || !Number.isFinite(Date.parse(value))) fail(`${label}_must_be_rfc3339`);
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const daysInMonth = month >= 1 && month <= 12
    ? new Date(Date.UTC(year, month, 0)).getUTCDate()
    : 0;
  if (
    year < 1 || day < 1 || day > daysInMonth || Number(hourText) > 23 ||
    Number(minuteText) > 59 || Number(secondText) > 59 ||
    Number(offsetHourText ?? 0) > 23 || Number(offsetMinuteText ?? 0) > 59
  ) fail(`${label}_must_be_rfc3339`);
}

function canonicalize(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

function digest(domain, value) {
  return createHash("sha256")
    .update(`${domain}\0${canonicalize(value)}`, "utf8")
    .digest("hex");
}

function cloneAndFreezePlainJson(value) {
  if (value === null || typeof value !== "object") return value;
  const clone = Array.isArray(value)
    ? value.map((entry) => cloneAndFreezePlainJson(entry))
    : Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, cloneAndFreezePlainJson(entry)])
    );
  return Object.freeze(clone);
}

function candidateMetadataPayload(candidate) {
  return {
    allocatedKiB: candidate.allocatedKiB,
    candidateId: candidate.candidateId,
    deviceId: candidate.deviceId,
    disposition: candidate.disposition,
    inode: candidate.inode,
    isSymlink: candidate.isSymlink,
    kind: candidate.kind,
    linkCount: candidate.linkCount,
    logicalKiB: candidate.logicalKiB,
    metadataScope: candidate.metadataScope,
    mode: candidate.mode,
    path: candidate.path,
    realPath: candidate.realPath,
    targetClass: candidate.targetClass
  };
}

export function computeResourceRecoveryCandidateMetadataDigest(candidate) {
  assertPlainJsonGraph(candidate, "candidate");
  return digest(
    "sirinx-resource-recovery-bootstrap-review-candidate-metadata-v1",
    candidateMetadataPayload(candidate)
  );
}

export function computeResourceRecoveryBootstrapReviewDigest(packet) {
  assertPlainJsonGraph(packet);
  const { packetDigest: _packetDigest, ...payload } = packet;
  return digest("sirinx-resource-recovery-bootstrap-review-v1", payload);
}

function validateFalseFlags(value, keys, label) {
  exactKeys(value, keys, label);
  for (const key of keys) {
    if (value[key] !== false) fail(`${label}_${key}_must_remain_false`);
  }
}

function validateExactObjectArray(actual, expected, keys, label) {
  if (!Array.isArray(actual) || actual.length !== expected.length) fail(`${label}_shape`);
  for (let index = 0; index < expected.length; index += 1) {
    exactKeys(actual[index], keys, `${label}_${index}`);
    for (const key of keys) exact(actual[index][key], expected[index][key], `${label}_${index}_${key}_drift`);
  }
}

function validateCandidate(candidate, expected, index, currentFreeKiB) {
  const label = `candidate_${index}`;
  exactKeys(candidate, CANDIDATE_KEYS, label);
  const disallowedPaths = new Set([
    ...RESOURCE_RECOVERY_BOOTSTRAP_INELIGIBLE_ROOTS.map((entry) => entry.path),
    ...RESOURCE_RECOVERY_BOOTSTRAP_KEEP_BY_DEFAULT_TARGETS.map((entry) => entry.path)
  ]);
  if (disallowedPaths.has(candidate.path)) fail(`${label}_wholesale_or_keep_target_forbidden`);

  for (const [key, expectedValue] of Object.entries(expected)) {
    exact(candidate[key], expectedValue, `${label}_${key}_drift`);
  }
  safeInteger(candidate.deviceId, `${label}_device_id`);
  safeInteger(candidate.inode, `${label}_inode`, { min: 1 });
  safeInteger(candidate.linkCount, `${label}_link_count`, { min: 1, max: 65_535 });
  safeInteger(candidate.allocatedKiB, `${label}_allocated_kib`, { min: 1, max: MAX_KIB });
  safeInteger(candidate.logicalKiB, `${label}_logical_kib`, { min: 1, max: MAX_KIB });
  if (typeof candidate.mode !== "string" || !/^0[0-7]{3}$/.test(candidate.mode)) fail(`${label}_mode`);

  sha256(candidate.metadataDigest, `${label}_metadata_digest`);
  exact(
    candidate.metadataDigest,
    computeResourceRecoveryCandidateMetadataDigest(candidate),
    `${label}_metadata_digest_mismatch`
  );
  const projectedFreeKiB = currentFreeKiB + candidate.allocatedKiB;
  if (!Number.isSafeInteger(projectedFreeKiB) || projectedFreeKiB > MAX_KIB) {
    fail(`${label}_nominal_projection_overflow`);
  }
  exact(candidate.nominalProjectedFreeKiB, projectedFreeKiB, `${label}_nominal_projection_drift`);
  if (candidate.nominalProjectedFreeKiB >= RESOURCE_RECOVERY_BOOTSTRAP_WORKLOAD_FLOOR_KIB) {
    fail(`${label}_must_remain_below_workload_floor`);
  }
  if (candidate.nominalProjectedFreeKiB >= RESOURCE_RECOVERY_BOOTSTRAP_CONSERVATIVE_TARGET_KIB) {
    fail(`${label}_must_remain_below_conservative_target`);
  }
  exact(candidate.guaranteedMinimumReclaimKiB, 0, `${label}_optimistic_reclaim_forbidden`);
  exact(candidate.approvalEligible, false, `${label}_approval_promotion_forbidden`);
  exact(candidate.operationPlanBound, false, `${label}_operation_plan_promotion_forbidden`);
  validateFalseFlags(candidate.proofs, PROOF_KEYS, `${label}_proofs`);
}

export function validateResourceRecoveryBootstrapReviewV1(packet, { now } = {}) {
  assertPlainJsonGraph(packet);
  exactKeys(packet, TOP_LEVEL_KEYS, "packet");
  exact(packet.schemaVersion, "1.0", "schema_version");
  boundedIdentifier(packet.reviewId, REVIEW_ID, "review_id");
  boundedIdentifier(packet.taskId, TASK_ID, "task_id");
  boundedIdentifier(packet.runId, RUN_ID, "run_id");
  exact(packet.reviewId, RESOURCE_RECOVERY_BOOTSTRAP_REVIEW_ID, "review_id_drift");
  exact(packet.taskId, RESOURCE_RECOVERY_BOOTSTRAP_TASK_ID, "task_id_drift");
  exact(packet.runId, RESOURCE_RECOVERY_BOOTSTRAP_RUN_ID, "run_id_drift");
  exact(packet.action, "RESOURCE_RECOVERY_BOOTSTRAP_REVIEW", "action");
  exact(packet.circuit, "resource_cleanup", "circuit");
  exact(packet.status, RESOURCE_RECOVERY_BOOTSTRAP_STATUS, "status_must_remain_blocked");
  exact(packet.claimCeiling, RESOURCE_RECOVERY_BOOTSTRAP_CLAIM_CEILING, "claim_ceiling");

  validDateTime(packet.observedAt, "observed_at");
  validDateTime(packet.expiresAt, "expires_at");
  exact(packet.observedAt, RESOURCE_RECOVERY_BOOTSTRAP_OBSERVED_AT, "observed_at_drift");
  exact(packet.expiresAt, RESOURCE_RECOVERY_BOOTSTRAP_EXPIRES_AT, "expires_at_drift");
  const observedAtMs = Date.parse(packet.observedAt);
  const expiresAtMs = Date.parse(packet.expiresAt);
  if (expiresAtMs <= observedAtMs) fail("expiry_not_after_observation");
  if (expiresAtMs - observedAtMs !== RESOURCE_RECOVERY_BOOTSTRAP_MAX_LIFETIME_SECONDS * 1000) {
    fail("review_lifetime_must_be_exactly_one_hour");
  }
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) fail("trusted_now_required");
  if (now.getTime() < observedAtMs) fail("observation_from_future");
  if (now.getTime() >= expiresAtMs) fail("bootstrap_review_expired");

  exactKeys(packet.repository, REPOSITORY_KEYS, "repository");
  exact(packet.repository.path, RESOURCE_RECOVERY_BOOTSTRAP_REPOSITORY_PATH, "repository_path_drift");
  exact(packet.repository.branch, RESOURCE_RECOVERY_BOOTSTRAP_REPOSITORY_BRANCH, "repository_branch_drift");
  if (typeof packet.repository.headSha !== "string" || !COMMIT_SHA.test(packet.repository.headSha)) {
    fail("repository_head_must_be_commit_sha");
  }
  exact(packet.repository.headSha, RESOURCE_RECOVERY_BOOTSTRAP_REPOSITORY_HEAD, "repository_head_drift");

  validateExactObjectArray(
    packet.parentArtifacts,
    RESOURCE_RECOVERY_BOOTSTRAP_PARENT_ARTIFACTS,
    PARENT_ARTIFACT_KEYS,
    "parent_artifacts"
  );
  for (const [index, artifact] of packet.parentArtifacts.entries()) {
    sha256(artifact.sha256, `parent_artifact_${index}_sha256`);
  }

  exactKeys(packet.resources, RESOURCE_KEYS, "resources");
  safeInteger(packet.resources.filesystemDeviceId, "resource_filesystem_device_id");
  safeInteger(packet.resources.currentFreeKiB, "resource_current_free_kib", { max: MAX_KIB });
  exact(
    packet.resources.filesystemDeviceId,
    RESOURCE_RECOVERY_BOOTSTRAP_FILESYSTEM_DEVICE_ID,
    "resource_filesystem_device_drift"
  );
  exact(
    packet.resources.currentFreeKiB,
    RESOURCE_RECOVERY_BOOTSTRAP_CURRENT_FREE_KIB,
    "resource_current_free_drift"
  );
  exact(
    packet.resources.workloadFloorKiB,
    RESOURCE_RECOVERY_BOOTSTRAP_WORKLOAD_FLOOR_KIB,
    "resource_workload_floor_drift"
  );
  exact(
    packet.resources.conservativeTargetKiB,
    RESOURCE_RECOVERY_BOOTSTRAP_CONSERVATIVE_TARGET_KIB,
    "resource_conservative_target_drift"
  );

  if (!Array.isArray(packet.candidates) || packet.candidates.length !== RESOURCE_RECOVERY_BOOTSTRAP_CANDIDATE_PINS.length) {
    fail("candidates_must_be_canonical_four");
  }
  const candidateIds = packet.candidates.map((candidate) => candidate.candidateId);
  const candidatePaths = packet.candidates.map((candidate) => candidate.path);
  if (new Set(candidateIds).size !== candidateIds.length) fail("candidate_ids_must_be_unique");
  if (new Set(candidatePaths).size !== candidatePaths.length) fail("candidate_paths_must_be_unique");
  for (let index = 0; index < RESOURCE_RECOVERY_BOOTSTRAP_CANDIDATE_PINS.length; index += 1) {
    validateCandidate(
      packet.candidates[index],
      RESOURCE_RECOVERY_BOOTSTRAP_CANDIDATE_PINS[index],
      index,
      packet.resources.currentFreeKiB
    );
  }

  validateExactObjectArray(
    packet.ineligibleRoots,
    RESOURCE_RECOVERY_BOOTSTRAP_INELIGIBLE_ROOTS,
    INELIGIBLE_ROOT_KEYS,
    "ineligible_roots"
  );
  validateExactObjectArray(
    packet.keepByDefaultTargets,
    RESOURCE_RECOVERY_BOOTSTRAP_KEEP_BY_DEFAULT_TARGETS,
    KEEP_TARGET_KEYS,
    "keep_by_default_targets"
  );

  exactKeys(packet.policy, POLICY_KEYS, "policy");
  exact(packet.policy.multiTargetGrantAllowed, false, "policy_multi_target_grant_must_remain_false");
  exact(packet.policy.aggregateReclaimCredited, false, "policy_aggregate_reclaim_must_remain_false");
  exact(packet.policy.automaticContinuation, false, "policy_automatic_continuation_must_remain_false");
  exact(packet.policy.sequentialOneTargetGrantsRequired, true, "policy_sequential_grants_required");
  exact(packet.policy.stopAndRemeasureAfterEach, true, "policy_stop_and_remeasure_required");

  if (!Array.isArray(packet.blockers) || packet.blockers.length !== RESOURCE_RECOVERY_BOOTSTRAP_REQUIRED_BLOCKERS.length) {
    fail("blockers_must_be_canonical");
  }
  for (let index = 0; index < RESOURCE_RECOVERY_BOOTSTRAP_REQUIRED_BLOCKERS.length; index += 1) {
    exact(
      packet.blockers[index],
      RESOURCE_RECOVERY_BOOTSTRAP_REQUIRED_BLOCKERS[index],
      "blockers_must_be_canonical"
    );
  }

  validateFalseFlags(packet.authority, AUTHORITY_KEYS, "authority");
  validateFalseFlags(packet.effects, EFFECT_KEYS, "effects");

  sha256(packet.packetDigest, "packet_digest");
  exact(packet.packetDigest, RESOURCE_RECOVERY_BOOTSTRAP_PACKET_DIGEST, "packet_digest_pin_drift");
  exact(
    packet.packetDigest,
    computeResourceRecoveryBootstrapReviewDigest(packet),
    "packet_digest_mismatch"
  );
  return cloneAndFreezePlainJson(packet);
}

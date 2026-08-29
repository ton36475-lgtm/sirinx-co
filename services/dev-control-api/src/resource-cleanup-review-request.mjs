import { createHash } from "node:crypto";
import { types as utilTypes } from "node:util";

export const RESOURCE_CLEANUP_REVIEW_REQUEST_SCHEMA_URL = new URL(
  "../../../schemas/agent-runtime/resource-cleanup-review-request.v1.schema.json",
  import.meta.url
);

export const RESOURCE_CLEANUP_REPOSITORY_PATH = "/Users/sirinx/SIRINXDev/sirinx-co";
export const RESOURCE_CLEANUP_TARGET_PATH = `${RESOURCE_CLEANUP_REPOSITORY_PATH}/target`;
export const RESOURCE_CLEANUP_REVIEW_STATUS = "COLLECTED_NOT_APPROVED";
export const RESOURCE_CLEANUP_REVIEW_CLAIM_CEILING =
  "PRE_APPROVAL_LOCAL_READ_ONLY_OBSERVATIONS";
export const RESOURCE_CLEANUP_EMERGENCY_FLOOR_KIB = 5 * 1024 * 1024;
export const RESOURCE_CLEANUP_WORKLOAD_FLOOR_KIB = 15 * 1024 * 1024;
export const RESOURCE_CLEANUP_CONSERVATIVE_TARGET_KIB = 20 * 1024 * 1024;
export const RESOURCE_CLEANUP_REVIEW_MAX_LIFETIME_SECONDS = 3600;
export const RESOURCE_CLEANUP_PLAN_HASH =
  "57a56f10f23c7874c0788bf9bd065e2fd7707764df6996acceb030f86885162c";
export const RESOURCE_CLEANUP_PLAN_FILE_SHA256 =
  "859a31f0ed505450f78321d738f43b0d4f204ed745834b1436ab000536470ad1";
export const RESOURCE_CLEANUP_PLAN_OPERATION_PARAMETERS_DIGEST =
  "1da51a67a5d083cdaaea8fa6dd55de93f29b16a875811d6ab3dd8ec6523f365c";
export const RESOURCE_CLEANUP_EXCLUSIONS_DIGEST =
  "6adcb018036f2331b9e54d8e41dc8ba29acad972f923d895cf1a07fce443649a";

const PLAN_PATH = `${RESOURCE_CLEANUP_REPOSITORY_PATH}/config/agent-runtime/resource-cleanup.plan-only.v2.json`;
const TOOLCHAIN_FILE_PATH = `${RESOURCE_CLEANUP_REPOSITORY_PATH}/rust-toolchain.toml`;
const CARGO_LOCK_PATH = `${RESOURCE_CLEANUP_REPOSITORY_PATH}/Cargo.lock`;
const RECOVERY_PROCEDURE_PATH =
  `${RESOURCE_CLEANUP_REPOSITORY_PATH}/docs/agent-runtime/RESOURCE_RECOVERY_ADMISSION.md`;
const CARGO_INVOCATION_PATH = "/Users/sirinx/.cargo/bin/cargo";
const RUSTUP_PROXY_PATH = "/Users/sirinx/.cargo/bin/rustup";
const SELECTED_CARGO_PATH =
  "/Users/sirinx/.rustup/toolchains/stable-aarch64-apple-darwin/bin/cargo";
const RUSTUP_TOOLCHAIN_PROPOSAL = "stable-aarch64-apple-darwin";
const MAX_COUNT = 250_000;
const MAX_PROCESS_RECORDS = 16_384;
const MAX_KIB = 1_099_511_627_776;
const SHA256 = /^[0-9a-f]{64}$/;
const COMMIT_SHA = /^[0-9a-f]{40}$/;
const REQUEST_ID = /^RCRR-[A-Za-z0-9._-]+$/;
const TASK_ID = /^TASK-[A-Za-z0-9._-]+$/;
const RUN_ID = /^RUN-[A-Za-z0-9._-]+$/;

const TOP_LEVEL_KEYS = [
  "authority",
  "action",
  "blockers",
  "claimCeiling",
  "circuit",
  "exclusionsDigest",
  "expiresAt",
  "limits",
  "observedAt",
  "operationPreview",
  "planBinding",
  "principals",
  "processObservation",
  "proofs",
  "recovery",
  "repository",
  "requestDigest",
  "requestId",
  "resources",
  "runId",
  "schemaVersion",
  "status",
  "taskId",
  "target",
  "tooling"
];
const PLAN_KEYS = ["planFileSha256", "planHash", "planPath"];
const PRINCIPAL_KEYS = ["checker", "maker", "proposedExecutor", "proposedHumanApprover", "requester"];
const LIMIT_KEYS = [
  "emergencyFloorKiB",
  "maxAffectedKiB",
  "maxCalls",
  "maxCostUsd",
  "maxRuntimeSeconds",
  "requiredPostFreeKiB",
  "worstCaseCleanupGrowthKiB"
];
const REPOSITORY_KEYS = [
  "branch",
  "headSha",
  "path",
  "statusDigest",
  "statusEntryCount",
  "statusFormat"
];
const TARGET_KEYS = [
  "allocatedKiB",
  "descendantEntries",
  "deviceId",
  "directoryEntries",
  "hardlinkAliasesInsideTarget",
  "hardlinkEntries",
  "hardlinkGroups",
  "immediateEntries",
  "incompleteHardlinkGroups",
  "inode",
  "isSymlink",
  "kind",
  "linkCount",
  "logicalKiB",
  "metadataDigest",
  "metadataScope",
  "mode",
  "path",
  "realPath",
  "regularFileEntries",
  "specialEntries",
  "symlinkEntries"
];
const PROCESS_KEYS = [
  "completeProcessEvidenceV1",
  "distinctMatchingProcessCount",
  "matchingRecordCount",
  "observationDigest",
  "outputTruncated",
  "recordLimit",
  "scope",
  "source",
  "targetPath",
  "visibility",
  "visibilityLimited",
  "zeroMatchesProvesNoConsumers"
];
const TOOLING_KEYS = [
  "cargoInvocation",
  "repositoryToolchainSelector",
  "rustupProxy",
  "selectedCargo",
  "verificationCeiling"
];
const SYMLINK_ARTIFACT_KEYS = [
  "deviceId",
  "inode",
  "kind",
  "linkCount",
  "linkText",
  "metadataDigest",
  "mode",
  "path",
  "sizeBytes"
];
const FILE_ARTIFACT_KEYS = [
  "contentSha256",
  "deviceId",
  "inode",
  "kind",
  "linkCount",
  "mode",
  "path",
  "sizeBytes"
];
const TOOLCHAIN_SELECTOR_KEYS = ["boundToPlan", "contentSha256", "mutable", "path", "value"];
const RESOURCE_KEYS = [
  "conservativeHeadroomKiB",
  "conservativeTargetKiB",
  "currentFreeKiB",
  "emergencyFloorKiB",
  "emergencyHeadroomKiB",
  "filesystemDeviceId",
  "projectedFreeKiB",
  "projectionBasis",
  "reclaimCertainty",
  "targetAllocatedKiB",
  "targetLogicalKiB",
  "workloadFloorKiB",
  "workloadHeadroomKiB"
];
const OPERATION_KEYS = [
  "argv",
  "cwd",
  "environment",
  "executablePath",
  "kind",
  "planOperationParametersDigest",
  "rustupToolchainProposal",
  "toolId"
];
const ENVIRONMENT_KEYS = ["inherit", "set"];
const ENVIRONMENT_SET_KEYS = [
  "CARGO_HOME",
  "CARGO_TARGET_DIR",
  "HOME",
  "RUSTUP_HOME",
  "RUSTUP_TOOLCHAIN"
];
const TOOLCHAIN_PROPOSAL_KEYS = [
  "approvedForExecution",
  "boundToPlan",
  "mutable",
  "name",
  "selectorClass",
  "value"
];
const RECOVERY_KEYS = [
  "checkerReceiptId",
  "installRequirement",
  "networkRequirement",
  "procedurePath",
  "sourceFileSha256",
  "sourcePath",
  "status",
  "targetClass"
];
const PROOF_KEYS = [
  "actionTimeEvidenceComplete",
  "canonicalWorktreeSnapshotComplete",
  "durableAuthorityVerified",
  "executableIdentityV1Complete",
  "humanApprovalVerified",
  "processEvidenceV1Complete",
  "recoveryVerified",
  "runtimeStateVerified",
  "targetManifestV1Complete"
];
const AUTHORITY_KEYS = [
  "admitted",
  "approvalConsumed",
  "authorized",
  "canDispatch",
  "canExecute",
  "circuitOpen",
  "cleanupExecuted",
  "commandExecuted",
  "executorAvailable",
  "externalWrites",
  "grantPresent",
  "humanApprovalPresent",
  "networkCalls",
  "processStopped",
  "replayProtectionAvailable",
  "runtimeActivated"
];
const EXACT_ARGV = [
  "clean",
  "--manifest-path",
  `${RESOURCE_CLEANUP_REPOSITORY_PATH}/Cargo.toml`,
  "--target-dir",
  RESOURCE_CLEANUP_TARGET_PATH
];
const CORE_BLOCKERS = [
  "action_time_evidence_absent",
  "canonical_worktree_snapshot_absent",
  "clock_authority_unattested",
  "cleanup_growth_margin_unreviewed",
  "cleanup_executor_absent",
  "complete_process_evidence_v1_absent",
  "durable_cleanup_authority_absent",
  "executable_identity_v1_incomplete",
  "human_approval_absent",
  "independent_review_absent",
  "mutable_stable_toolchain_unbound",
  "non_atomic_collection_not_action_time",
  "nominal_reclaim_not_guaranteed",
  "plan_file_not_revalidated_action_time",
  "recovery_evidence_unverified",
  "replay_protection_absent",
  "resource_cleanup_circuit_hold",
  "rustup_toolchain_proposal_not_bound_to_plan",
  "target_manifest_v1_absent",
  "scope_artifacts_not_independently_validated",
  "visible_process_scope_limited"
];

function fail(code) {
  throw new Error(`invalid_resource_cleanup_review_request:${code}`);
}

const MAX_JSON_DEPTH = 128;
const MAX_JSON_NODES = 20_000;
const MAX_JSON_PROPERTIES = 1_000;
const MAX_JSON_ARRAY_LENGTH = 1_000;

function assertPlainJsonGraph(
  value,
  label = "request",
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

function safeInteger(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (!Number.isSafeInteger(value) || value < min || value > max) fail(`${label}_must_be_bounded_integer`);
}

function sha256(value, label) {
  if (typeof value !== "string" || !SHA256.test(value)) fail(`${label}_must_be_sha256`);
}

function exact(value, expected, label) {
  if (value !== expected) fail(label);
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
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
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

export function computeResourceCleanupReviewRequestDigest(request) {
  assertPlainJsonGraph(request);
  const { requestDigest: _requestDigest, ...payload } = request;
  return digest("sirinx-resource-cleanup-review-request-v1", payload);
}

export function requiredResourceCleanupReviewRequestBlockers(request) {
  const blockers = [...CORE_BLOCKERS];
  if (request?.resources?.projectedFreeKiB < RESOURCE_CLEANUP_CONSERVATIVE_TARGET_KIB) {
    blockers.push("conservative_20gib_target_not_met");
  }
  if (request?.processObservation?.distinctMatchingProcessCount > 0) {
    blockers.push("visible_target_consumer_observed");
  }
  return Object.freeze(blockers.sort());
}

function validateFileArtifact(artifact, expectedPath, label) {
  exactKeys(artifact, FILE_ARTIFACT_KEYS, label);
  exact(artifact.path, expectedPath, `${label}_path`);
  exact(artifact.kind, "REGULAR_FILE", `${label}_kind`);
  safeInteger(artifact.deviceId, `${label}_device`);
  safeInteger(artifact.inode, `${label}_inode`, { min: 1 });
  if (typeof artifact.mode !== "string" || !/^[0-7]{3,6}$/.test(artifact.mode)) fail(`${label}_mode`);
  if ((Number.parseInt(artifact.mode.slice(-3), 8) & 0o022) !== 0) fail(`${label}_writable_by_group_or_other`);
  exact(artifact.linkCount, 1, `${label}_hardlink`);
  safeInteger(artifact.sizeBytes, `${label}_size`, { min: 1, max: 1_073_741_824 });
  sha256(artifact.contentSha256, `${label}_content`);
}

function validateFalseFlags(value, keys, label) {
  exactKeys(value, keys, label);
  for (const key of keys) {
    if (value[key] !== false) fail(`${label}_${key}_must_remain_false`);
  }
}

export function validateResourceCleanupReviewRequestV1(request, { now } = {}) {
  assertPlainJsonGraph(request);
  exactKeys(request, TOP_LEVEL_KEYS, "request");
  exact(request.schemaVersion, "1.0", "schema_version");
  if (typeof request.requestId !== "string" || !REQUEST_ID.test(request.requestId) || request.requestId.length > 128) {
    fail("request_id");
  }
  if (typeof request.taskId !== "string" || !TASK_ID.test(request.taskId) || request.taskId.length > 128) fail("task_id");
  if (typeof request.runId !== "string" || !RUN_ID.test(request.runId) || request.runId.length > 128) fail("run_id");
  exact(request.action, "RESOURCE_CLEANUP", "action");
  exact(request.circuit, "resource_cleanup", "circuit");
  exact(request.status, RESOURCE_CLEANUP_REVIEW_STATUS, "status_must_remain_collected_not_approved");
  exact(request.claimCeiling, RESOURCE_CLEANUP_REVIEW_CLAIM_CEILING, "claim_ceiling");
  validDateTime(request.observedAt, "observed_at");
  validDateTime(request.expiresAt, "expires_at");
  const observedAtMs = Date.parse(request.observedAt);
  const expiresAtMs = Date.parse(request.expiresAt);
  if (expiresAtMs <= observedAtMs) fail("expiry_not_after_observation");
  if (expiresAtMs - observedAtMs > RESOURCE_CLEANUP_REVIEW_MAX_LIFETIME_SECONDS * 1000) {
    fail("review_lifetime_exceeds_limit");
  }
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) fail("trusted_now_required");
  if (now.getTime() < observedAtMs) fail("observation_from_future");
  if (now.getTime() >= expiresAtMs) fail("review_request_expired");

  exactKeys(request.planBinding, PLAN_KEYS, "plan_binding");
  exact(request.planBinding.planPath, PLAN_PATH, "plan_path");
  sha256(request.planBinding.planHash, "plan_hash");
  sha256(request.planBinding.planFileSha256, "plan_file_sha256");
  exact(request.planBinding.planHash, RESOURCE_CLEANUP_PLAN_HASH, "plan_hash_drift");
  exact(request.planBinding.planFileSha256, RESOURCE_CLEANUP_PLAN_FILE_SHA256, "plan_file_sha256_drift");

  exactKeys(request.principals, PRINCIPAL_KEYS, "principals");
  for (const key of PRINCIPAL_KEYS) {
    const value = request.principals[key];
    if (typeof value !== "string" || value.length === 0 || value.length > 256 || /[\x00-\x1f\x7f]/.test(value)) {
      fail(`principal_${key}`);
    }
  }
  if (new Set(PRINCIPAL_KEYS.map((key) => request.principals[key])).size !== PRINCIPAL_KEYS.length) {
    fail("principals_must_be_pairwise_distinct");
  }
  sha256(request.exclusionsDigest, "exclusions_digest");
  exact(request.exclusionsDigest, RESOURCE_CLEANUP_EXCLUSIONS_DIGEST, "exclusions_digest_drift");
  exactKeys(request.limits, LIMIT_KEYS, "limits");
  exact(request.limits.maxCalls, 1, "limits_max_calls");
  exact(request.limits.maxCostUsd, 0, "limits_max_cost");
  safeInteger(request.limits.maxRuntimeSeconds, "limits_runtime", { min: 1, max: 3600 });
  safeInteger(request.limits.maxAffectedKiB, "limits_max_affected", { min: 1, max: MAX_KIB });
  safeInteger(request.limits.worstCaseCleanupGrowthKiB, "limits_cleanup_growth", { max: MAX_KIB });
  exact(request.limits.emergencyFloorKiB, RESOURCE_CLEANUP_EMERGENCY_FLOOR_KIB, "limits_emergency_floor");
  exact(request.limits.requiredPostFreeKiB, RESOURCE_CLEANUP_WORKLOAD_FLOOR_KIB, "limits_required_post_free");

  exactKeys(request.repository, REPOSITORY_KEYS, "repository");
  exact(request.repository.path, RESOURCE_CLEANUP_REPOSITORY_PATH, "repository_path");
  if (
    typeof request.repository.branch !== "string" || request.repository.branch.length === 0 ||
    request.repository.branch.length > 1024 || /[\x00-\x1f\x7f]/.test(request.repository.branch)
  ) fail("repository_branch");
  if (typeof request.repository.headSha !== "string" || !COMMIT_SHA.test(request.repository.headSha)) {
    fail("repository_head_sha");
  }
  exact(
    request.repository.statusFormat,
    "GIT_STATUS_PORCELAIN_V2_Z_PROTECTED_CONTENT_EXCLUDED_V1",
    "repository_status_format"
  );
  safeInteger(request.repository.statusEntryCount, "repository_status_entry_count", { max: MAX_COUNT });
  sha256(request.repository.statusDigest, "repository_status_digest");

  const target = request.target;
  exactKeys(target, TARGET_KEYS, "target");
  exact(target.path, RESOURCE_CLEANUP_TARGET_PATH, "target_path");
  exact(target.realPath, RESOURCE_CLEANUP_TARGET_PATH, "target_real_path");
  exact(target.kind, "DIRECTORY", "target_kind");
  exact(target.isSymlink, false, "target_symlink_forbidden");
  safeInteger(target.deviceId, "target_device");
  safeInteger(target.inode, "target_inode", { min: 1 });
  if (typeof target.mode !== "string" || !/^0[0-7]{3}$/.test(target.mode)) fail("target_mode");
  if ((Number.parseInt(target.mode, 8) & 0o022) !== 0) fail("target_writable_by_group_or_other");
  safeInteger(target.linkCount, "target_link_count", { min: 1, max: 65_535 });
  for (const key of [
    "descendantEntries",
    "immediateEntries",
    "regularFileEntries",
    "directoryEntries",
    "symlinkEntries",
    "specialEntries",
    "hardlinkEntries",
    "hardlinkGroups",
    "hardlinkAliasesInsideTarget",
    "incompleteHardlinkGroups"
  ]) safeInteger(target[key], `target_${key}`, { max: MAX_COUNT });
  if (target.descendantEntries < 1) fail("target_empty");
  if (target.immediateEntries > target.descendantEntries) fail("target_immediate_count_drift");
  const classifiedEntries = target.regularFileEntries + target.directoryEntries +
    target.symlinkEntries + target.specialEntries;
  if (!Number.isSafeInteger(classifiedEntries) || classifiedEntries !== target.descendantEntries) {
    fail("target_entry_count_drift");
  }
  if (target.symlinkEntries !== 0) fail("target_contains_symlink");
  if (target.specialEntries !== 0) fail("target_contains_special_file");
  if (target.incompleteHardlinkGroups !== 0) fail("target_incomplete_hardlink_group");
  if (target.hardlinkEntries > target.regularFileEntries) fail("target_hardlink_count_drift");
  if (target.hardlinkEntries !== target.hardlinkGroups + target.hardlinkAliasesInsideTarget) {
    fail("target_hardlink_alias_count_drift");
  }
  if (
    (target.hardlinkEntries === 0) !==
      (target.hardlinkGroups === 0 && target.hardlinkAliasesInsideTarget === 0) ||
    target.hardlinkAliasesInsideTarget < target.hardlinkGroups
  ) fail("target_hardlink_group_count_drift");
  safeInteger(target.allocatedKiB, "target_allocated_kib", { min: 1, max: MAX_KIB });
  safeInteger(target.logicalKiB, "target_logical_kib", { min: 1, max: MAX_KIB });
  exact(request.limits.maxAffectedKiB, target.allocatedKiB, "limits_target_allocation_drift");
  exact(target.metadataScope, "LSTAT_METADATA_ONLY_NO_CONTENT_MANIFEST", "target_metadata_scope");
  sha256(target.metadataDigest, "target_metadata_digest");

  const processObservation = request.processObservation;
  exactKeys(processObservation, PROCESS_KEYS, "process_observation");
  exact(processObservation.source, "LSOF_TARGET_PREFIX_OBSERVATION", "process_source");
  exact(processObservation.targetPath, RESOURCE_CLEANUP_TARGET_PATH, "process_target_path");
  exact(processObservation.scope, "EXACT_TARGET_PATH_OR_DESCENDANT_PREFIX", "process_scope");
  exact(processObservation.visibility, "CURRENT_USER_VISIBLE_PROCESSES_ONLY", "process_visibility");
  exact(processObservation.visibilityLimited, true, "process_visibility_must_remain_limited");
  exact(processObservation.recordLimit, MAX_PROCESS_RECORDS, "process_record_limit");
  safeInteger(processObservation.matchingRecordCount, "process_matching_records", { max: MAX_PROCESS_RECORDS });
  safeInteger(processObservation.distinctMatchingProcessCount, "process_matching_processes", { max: MAX_PROCESS_RECORDS });
  if (processObservation.distinctMatchingProcessCount > processObservation.matchingRecordCount) {
    fail("process_count_drift");
  }
  exact(processObservation.outputTruncated, false, "process_output_truncated");
  exact(processObservation.completeProcessEvidenceV1, false, "false_complete_process_proof");
  exact(processObservation.zeroMatchesProvesNoConsumers, false, "false_zero_match_process_proof");
  sha256(processObservation.observationDigest, "process_observation_digest");

  exactKeys(request.tooling, TOOLING_KEYS, "tooling");
  const invocation = request.tooling.cargoInvocation;
  exactKeys(invocation, SYMLINK_ARTIFACT_KEYS, "cargo_invocation");
  exact(invocation.path, CARGO_INVOCATION_PATH, "cargo_invocation_path");
  exact(invocation.kind, "SYMLINK", "cargo_invocation_kind");
  safeInteger(invocation.deviceId, "cargo_invocation_device");
  safeInteger(invocation.inode, "cargo_invocation_inode", { min: 1 });
  if (typeof invocation.mode !== "string" || !/^[0-7]{3,6}$/.test(invocation.mode)) fail("cargo_invocation_mode");
  exact(invocation.linkCount, 1, "cargo_invocation_link_count");
  safeInteger(invocation.sizeBytes, "cargo_invocation_size", { min: 1, max: 4096 });
  exact(invocation.linkText, "rustup", "cargo_invocation_link_text");
  sha256(invocation.metadataDigest, "cargo_invocation_metadata_digest");
  validateFileArtifact(request.tooling.rustupProxy, RUSTUP_PROXY_PATH, "rustup_proxy");
  validateFileArtifact(request.tooling.selectedCargo, SELECTED_CARGO_PATH, "selected_cargo");
  const selector = request.tooling.repositoryToolchainSelector;
  exactKeys(selector, TOOLCHAIN_SELECTOR_KEYS, "toolchain_selector");
  exact(selector.path, TOOLCHAIN_FILE_PATH, "toolchain_selector_path");
  exact(selector.value, "stable", "toolchain_selector_value");
  exact(selector.mutable, true, "mutable_toolchain_must_not_be_promoted");
  exact(selector.boundToPlan, false, "mutable_toolchain_must_remain_unbound");
  sha256(selector.contentSha256, "toolchain_selector_content");
  exact(
    request.tooling.verificationCeiling,
    "LOCAL_FILE_HASHES_ONLY_NO_RUNTIME_REVISION_PROBE",
    "tooling_verification_ceiling"
  );

  const resources = request.resources;
  exactKeys(resources, RESOURCE_KEYS, "resources");
  safeInteger(resources.filesystemDeviceId, "resource_filesystem_device");
  safeInteger(resources.currentFreeKiB, "resource_current_free", { max: MAX_KIB });
  safeInteger(resources.targetAllocatedKiB, "resource_target_allocated", { min: 1, max: MAX_KIB });
  safeInteger(resources.targetLogicalKiB, "resource_target_logical", { min: 1, max: MAX_KIB });
  exact(resources.filesystemDeviceId, target.deviceId, "resource_target_device_drift");
  exact(resources.targetAllocatedKiB, target.allocatedKiB, "resource_target_allocation_drift");
  exact(resources.targetLogicalKiB, target.logicalKiB, "resource_target_logical_drift");
  exact(resources.emergencyFloorKiB, RESOURCE_CLEANUP_EMERGENCY_FLOOR_KIB, "resource_emergency_floor");
  exact(resources.workloadFloorKiB, RESOURCE_CLEANUP_WORKLOAD_FLOOR_KIB, "resource_workload_floor");
  exact(resources.conservativeTargetKiB, RESOURCE_CLEANUP_CONSERVATIVE_TARGET_KIB, "resource_conservative_target");
  const projectedFreeKiB = resources.currentFreeKiB + resources.targetAllocatedKiB -
    request.limits.worstCaseCleanupGrowthKiB;
  if (!Number.isSafeInteger(projectedFreeKiB) || projectedFreeKiB > MAX_KIB) fail("resource_projection_overflow");
  exact(resources.projectedFreeKiB, projectedFreeKiB, "resource_projected_free_drift");
  exact(
    resources.emergencyHeadroomKiB,
    resources.currentFreeKiB - RESOURCE_CLEANUP_EMERGENCY_FLOOR_KIB,
    "resource_emergency_headroom_drift"
  );
  exact(
    resources.workloadHeadroomKiB,
    projectedFreeKiB - RESOURCE_CLEANUP_WORKLOAD_FLOOR_KIB,
    "resource_workload_headroom_drift"
  );
  exact(
    resources.conservativeHeadroomKiB,
    projectedFreeKiB - RESOURCE_CLEANUP_CONSERVATIVE_TARGET_KIB,
    "resource_conservative_headroom_drift"
  );
  if (resources.currentFreeKiB < RESOURCE_CLEANUP_EMERGENCY_FLOOR_KIB + request.limits.worstCaseCleanupGrowthKiB) {
    fail("resource_cleanup_start_margin_not_met");
  }
  if (projectedFreeKiB < RESOURCE_CLEANUP_WORKLOAD_FLOOR_KIB) fail("resource_projected_workload_floor_not_met");
  exact(
    resources.projectionBasis,
    "CURRENT_FREE_PLUS_TARGET_ALLOCATED_UPPER_BOUND_MINUS_PROPOSED_UNVERIFIED_GROWTH",
    "resource_projection_basis"
  );
  exact(resources.reclaimCertainty, "NOT_GUARANTEED", "resource_reclaim_certainty");

  const operation = request.operationPreview;
  exactKeys(operation, OPERATION_KEYS, "operation_preview");
  exact(operation.kind, "TOOL_NATIVE_CLEAN", "operation_kind");
  exact(operation.toolId, "cargo-clean", "operation_tool");
  exact(operation.executablePath, CARGO_INVOCATION_PATH, "operation_executable");
  exact(operation.cwd, RESOURCE_CLEANUP_REPOSITORY_PATH, "operation_cwd");
  if (!Array.isArray(operation.argv) || operation.argv.length !== EXACT_ARGV.length ||
    operation.argv.some((value, index) => value !== EXACT_ARGV[index])) fail("operation_argv");
  exactKeys(operation.environment, ENVIRONMENT_KEYS, "operation_environment");
  exact(operation.environment.inherit, false, "operation_environment_inheritance");
  exactKeys(operation.environment.set, ENVIRONMENT_SET_KEYS, "operation_environment_set");
  const expectedEnvironment = {
    CARGO_HOME: "/Users/sirinx/.cargo",
    CARGO_TARGET_DIR: RESOURCE_CLEANUP_TARGET_PATH,
    HOME: "/Users/sirinx",
    RUSTUP_HOME: "/Users/sirinx/.rustup",
    RUSTUP_TOOLCHAIN: RUSTUP_TOOLCHAIN_PROPOSAL
  };
  for (const [key, value] of Object.entries(expectedEnvironment)) {
    exact(operation.environment.set[key], value, `operation_environment_${key}`);
  }
  sha256(operation.planOperationParametersDigest, "operation_plan_parameters_digest");
  exact(
    operation.planOperationParametersDigest,
    RESOURCE_CLEANUP_PLAN_OPERATION_PARAMETERS_DIGEST,
    "operation_plan_parameters_digest_drift"
  );
  const proposal = operation.rustupToolchainProposal;
  exactKeys(proposal, TOOLCHAIN_PROPOSAL_KEYS, "toolchain_proposal");
  exact(proposal.name, "RUSTUP_TOOLCHAIN", "toolchain_proposal_name");
  exact(proposal.value, RUSTUP_TOOLCHAIN_PROPOSAL, "toolchain_proposal_value");
  exact(proposal.selectorClass, "MUTABLE_CHANNEL_ALIAS", "toolchain_proposal_class");
  exact(proposal.mutable, true, "toolchain_proposal_mutability");
  exact(proposal.boundToPlan, false, "toolchain_proposal_plan_binding");
  exact(proposal.approvedForExecution, false, "toolchain_proposal_approval");

  exactKeys(request.recovery, RECOVERY_KEYS, "recovery");
  exact(request.recovery.targetClass, "GENERATED_BUILD_OUTPUT_CANDIDATE", "recovery_target_class");
  exact(request.recovery.status, "CANDIDATE_NOT_ACTION_TIME_VERIFIED", "recovery_status");
  exact(request.recovery.sourcePath, CARGO_LOCK_PATH, "recovery_source_path");
  sha256(request.recovery.sourceFileSha256, "recovery_source_digest");
  exact(request.recovery.procedurePath, RECOVERY_PROCEDURE_PATH, "recovery_procedure_path");
  exact(request.recovery.networkRequirement, "UNVERIFIED_NOT_AUTHORIZED", "recovery_network_requirement");
  exact(request.recovery.installRequirement, "UNVERIFIED_NOT_AUTHORIZED", "recovery_install_requirement");
  exact(request.recovery.checkerReceiptId, null, "recovery_checker_receipt");

  validateFalseFlags(request.proofs, PROOF_KEYS, "proofs");
  validateFalseFlags(request.authority, AUTHORITY_KEYS, "authority");

  if (!Array.isArray(request.blockers) || new Set(request.blockers).size !== request.blockers.length) {
    fail("blockers_must_be_unique_array");
  }
  const requiredBlockers = requiredResourceCleanupReviewRequestBlockers(request);
  if (request.blockers.length !== requiredBlockers.length ||
    request.blockers.some((blocker, index) => blocker !== requiredBlockers[index])) {
    fail("required_blockers_missing_or_not_canonical");
  }

  sha256(request.requestDigest, "request_digest");
  if (request.requestDigest !== computeResourceCleanupReviewRequestDigest(request)) {
    fail("request_digest_mismatch");
  }
  return cloneAndFreezePlainJson(request);
}

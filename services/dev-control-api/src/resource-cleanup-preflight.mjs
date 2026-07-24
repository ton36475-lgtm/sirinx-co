import { createHash } from "node:crypto";
import path from "node:path";
import { readFile } from "node:fs/promises";

export const RESOURCE_CLEANUP_PLAN_URL = new URL(
  "../../../config/agent-runtime/resource-cleanup.plan-only.v2.json",
  import.meta.url
);
export const RESOURCE_CLEANUP_PLAN_SCHEMA_URL = new URL(
  "../../../schemas/agent-runtime/resource-cleanup-plan.v2.schema.json",
  import.meta.url
);
export const RESOURCE_CLEANUP_APPROVAL_SCHEMA_URL = new URL(
  "../../../schemas/agent-runtime/resource-cleanup-approval.v2.schema.json",
  import.meta.url
);
export const TARGET_MANIFEST_SCHEMA_URL = new URL(
  "../../../schemas/agent-runtime/target-manifest.v1.schema.json",
  import.meta.url
);
export const PROCESS_EVIDENCE_SCHEMA_URL = new URL(
  "../../../schemas/agent-runtime/process-evidence.v1.schema.json",
  import.meta.url
);

const PLAN_KEYS = [
  "authority",
  "blockedActions",
  "candidateTargets",
  "forbiddenExactTargets",
  "forbiddenPrefixes",
  "generatedAt",
  "operationPreview",
  "repositoryPath",
  "runtime",
  "safety",
  "schemaVersion",
  "status",
  "stopRules"
];
const CANDIDATE_TARGET_KEYS = ["absolutePath", "class"];
const OPERATION_PREVIEW_KEYS = ["argv", "cwd", "environment", "executablePath", "kind", "toolId"];
const OPERATION_ENVIRONMENT_KEYS = ["inherit", "set"];
const OPERATION_ENVIRONMENT_SET_KEYS = ["CARGO_HOME", "CARGO_TARGET_DIR", "HOME", "RUSTUP_HOME"];
const AUTHORITY_KEYS = [
  "action",
  "approvalAuthority",
  "approvalSchema",
  "circuit",
  "processEvidenceSchema",
  "targetManifestSchema",
  "transitionAuthority"
];
const SAFETY_KEYS = [
  "automaticContinuation",
  "conservativeTargetKiB",
  "emergencyFloorKiB",
  "maxEvidenceAgeSeconds",
  "maxGrantLifetimeSeconds",
  "maxProcessEvidenceEntries",
  "maxTargetManifestEntries",
  "maxTargetsPerGrant",
  "sameFilesystemTrashReclaimKiB",
  "targetManifestVersion",
  "workloadFloorKiB",
  "worktreeSnapshotVersion"
];
const RUNTIME_KEYS = [
  "canExecute",
  "circuitState",
  "executorAvailable",
  "grantPresent",
  "replayProtectionAvailable"
];
const GRANT_KEYS = [
  "action",
  "approval",
  "circuit",
  "exclusions",
  "expiresAt",
  "grantId",
  "hashes",
  "issuedAt",
  "limits",
  "operation",
  "principals",
  "recovery",
  "repository",
  "schemaVersion",
  "status",
  "target",
  "targetManifest",
  "taskId",
  "ticketId"
];
const TARGET_KEYS = ["absolutePath", "class", "deviceId", "inode"];
const REPOSITORY_KEYS = [
  "branch",
  "commitSha",
  "path",
  "worktreeSnapshotDigest",
  "worktreeSnapshotVersion"
];
const HASH_KEYS = ["actionDigest", "planHash", "processEvidenceDigest", "scopeHash"];
const PRINCIPAL_KEYS = ["approver", "checker", "executor", "maker"];
const APPROVAL_KEYS = ["approverAssertionRef", "issuerAttestationDigest", "nonceDigest"];
const MANIFEST_KEYS = [
  "containsEscapingSymlinks",
  "containsSpecialFiles",
  "entriesDigest",
  "entryCount",
  "incompleteHardlinkSets",
  "manifestId",
  "manifestDigest",
  "schemaVersion",
  "totalSizeBytes"
];
const TARGET_MANIFEST_KEYS = [
  "canonicalEncoding",
  "containsEscapingSymlinks",
  "containsSpecialFiles",
  "entries",
  "entriesDigest",
  "entryCount",
  "generatedAt",
  "incompleteHardlinkSets",
  "manifestId",
  "manifestDigest",
  "schemaVersion",
  "status",
  "targetDeviceId",
  "targetInode",
  "targetPath",
  "totalSizeBytes"
];
const TARGET_MANIFEST_ENTRY_KEYS = [
  "contentSha256",
  "deviceId",
  "inode",
  "kind",
  "linkCount",
  "mode",
  "mtimeNs",
  "relativePath",
  "sizeBytes",
  "symlinkText"
];
const PROCESS_EVIDENCE_KEYS = [
  "activeConsumers",
  "capturedAt",
  "complete",
  "entries",
  "schemaVersion",
  "snapshotDigest",
  "snapshotId",
  "source",
  "status",
  "targetPath"
];
const PROCESS_EVIDENCE_ENTRY_KEYS = [
  "commandDigest",
  "cwd",
  "executablePath",
  "parentPid",
  "pid",
  "processGroupId",
  "startTime",
  "targetReference"
];
const OPERATION_KEYS = ["destinationDeviceId", "kind", "parametersDigest", "toolId"];
const RECOVERY_KEYS = [
  "installRequired",
  "networkRequired",
  "procedureRef",
  "sourceRef",
  "supportingTicketIds"
];
const LIMIT_KEYS = [
  "emergencyFloorKiB",
  "maxAffectedKiB",
  "maxCalls",
  "maxCostUsd",
  "maxEvidenceAgeSeconds",
  "maxRuntimeSeconds",
  "minReclaimKiB",
  "requiredPostFreeKiB",
  "worstCaseCleanupGrowthKiB"
];
const EVIDENCE_KEYS = [
  "activeConsumers",
  "containsEscapingSymlinks",
  "containsSpecialFiles",
  "currentFreeKiB",
  "exclusionOverlap",
  "filesystemDeviceId",
  "gitIgnored",
  "gitTracked",
  "incompleteHardlinkSets",
  "observedAt",
  "operationParametersDigest",
  "processEvidenceComplete",
  "processEvidenceDigest",
  "recoveryProcedureVerified",
  "recoverySourceVerified",
  "repositoryBranch",
  "repositoryCommitSha",
  "repositoryPath",
  "targetAllocatedKiB",
  "targetDeviceId",
  "targetEntryCount",
  "targetEntriesDigest",
  "targetExists",
  "targetInode",
  "targetIsSymlink",
  "targetManifestDigest",
  "targetManifestVersion",
  "targetPath",
  "targetRealPath",
  "targetTotalSizeBytes",
  "targetType",
  "worktreeSnapshotDigest",
  "worktreeSnapshotVersion"
];
const TARGET_CLASSES = new Set(["GENERATED_BUILD_OUTPUT"]);
const OPERATION_KINDS = new Set(["TOOL_NATIVE_CLEAN"]);
const MAX_TARGET_MANIFEST_ENTRIES = 250000;
const MAX_PROCESS_EVIDENCE_ENTRIES = 16384;
const HASH_PATTERN = /^[0-9a-f]{64}$/;
const COMMIT_PATTERN = /^[0-9a-f]{40}$/;
const ID_PATTERNS = Object.freeze({
  ticketId: /^TKT-[A-Za-z0-9._-]+$/,
  grantId: /^GRANT-[A-Za-z0-9._-]+$/,
  taskId: /^TASK-[A-Za-z0-9._-]+$/,
  manifestId: /^TM-[A-Za-z0-9._-]+$/,
  processEvidenceId: /^PE-[A-Za-z0-9._-]+$/
});

function fail(code) {
  throw new Error(`invalid_resource_cleanup_preflight:${code}`);
}

function exactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label}_must_be_object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label}_must_be_closed`);
  }
}

function nonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") fail(`${label}_must_be_nonempty_string`);
}

function integer(value, label, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (!Number.isSafeInteger(value) || value < min || value > max) fail(`${label}_must_be_safe_integer`);
}

function boolean(value, label) {
  if (typeof value !== "boolean") fail(`${label}_must_be_boolean`);
}

function sha256(value, label) {
  if (typeof value !== "string" || !HASH_PATTERN.test(value)) fail(`${label}_must_be_sha256`);
}

function identifier(value, label, pattern) {
  if (typeof value !== "string" || !pattern.test(value)) fail(`${label}_invalid`);
}

function stringArray(value, label, { nonEmpty = false } = {}) {
  if (!Array.isArray(value) || (nonEmpty && value.length === 0)) fail(`${label}_must_be_array`);
  if (value.some((item) => typeof item !== "string" || item.trim() === "")) {
    fail(`${label}_must_contain_nonempty_strings`);
  }
  if (new Set(value).size !== value.length) fail(`${label}_must_be_unique`);
}

function validDateTime(value, label) {
  const match = typeof value === "string"
    ? value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-](\d{2}):(\d{2}))$/)
    : null;
  if (!match) fail(`${label}_must_be_rfc3339`);
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const offsetHour = offsetHourText === undefined ? 0 : Number(offsetHourText);
  const offsetMinute = offsetMinuteText === undefined ? 0 : Number(offsetMinuteText);
  const daysInMonth = month >= 1 && month <= 12
    ? new Date(Date.UTC(year, month, 0)).getUTCDate()
    : 0;
  if (
    year < 1 ||
    day < 1 ||
    day > daysInMonth ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    offsetHour > 23 ||
    offsetMinute > 59 ||
    !Number.isFinite(Date.parse(value))
  ) {
    fail(`${label}_must_be_rfc3339`);
  }
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

export function computeResourceCleanupPlanHash(plan) {
  return digest("sirinx-resource-cleanup-plan-v2", plan);
}

export function computeResourceCleanupOperationParametersDigest(operationPreview) {
  return digest("sirinx-resource-cleanup-operation-parameters-v2", operationPreview);
}

function compareUtf8(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

export function computeTargetManifestEntriesDigest(entries) {
  const hash = createHash("sha256").update("sirinx-target-manifest-entries-v1\0", "utf8");
  for (const entry of [...entries].sort((left, right) => compareUtf8(left.relativePath, right.relativePath))) {
    const fields = [
      entry.relativePath,
      entry.kind,
      String(entry.deviceId),
      String(entry.inode),
      entry.mode,
      String(entry.linkCount),
      String(entry.sizeBytes),
      entry.mtimeNs,
      entry.contentSha256 ?? "<null>",
      entry.symlinkText ?? "<null>"
    ];
    hash.update(fields.join("\0"), "utf8").update("\0", "utf8");
  }
  return hash.digest("hex");
}

export function computeTargetManifestDigest(manifest) {
  const { manifestDigest: _manifestDigest, ...payload } = manifest;
  return digest("sirinx-target-manifest-v1", payload);
}

export function validateTargetManifestV1(manifest) {
  exactKeys(manifest, TARGET_MANIFEST_KEYS, "target_manifest");
  if (manifest.schemaVersion !== "1.0") fail("target_manifest_version");
  identifier(manifest.manifestId, "target_manifest_id", ID_PATTERNS.manifestId);
  nonEmptyString(manifest.targetPath, "target_manifest_path");
  if (
    !path.isAbsolute(manifest.targetPath) ||
    path.normalize(manifest.targetPath) !== manifest.targetPath ||
    Buffer.byteLength(manifest.targetPath, "utf8") > 4096
  ) {
    fail("target_manifest_path_invalid");
  }
  integer(manifest.targetDeviceId, "target_manifest_device");
  integer(manifest.targetInode, "target_manifest_inode", { min: 1 });
  if (manifest.canonicalEncoding !== "sorted-nul-v1") fail("target_manifest_encoding");
  if (
    !Array.isArray(manifest.entries) ||
    manifest.entries.length === 0 ||
    manifest.entries.length > MAX_TARGET_MANIFEST_ENTRIES
  ) {
    fail("target_manifest_entries");
  }

  const seenPaths = new Set();
  const fileLinkGroups = new Map();
  let previousPath = null;
  let totalSizeBytes = 0;
  for (const entry of manifest.entries) {
    exactKeys(entry, TARGET_MANIFEST_ENTRY_KEYS, "target_manifest_entry");
    nonEmptyString(entry.relativePath, "target_manifest_relative_path");
    if (
      Buffer.byteLength(entry.relativePath, "utf8") > 4096 ||
      /[\x00-\x1f\x7f]/.test(entry.relativePath) ||
      path.posix.isAbsolute(entry.relativePath) ||
      path.posix.normalize(entry.relativePath) !== entry.relativePath ||
      entry.relativePath === "." ||
      entry.relativePath.split("/").includes("..")
    ) {
      fail("target_manifest_relative_path_invalid");
    }
    if (seenPaths.has(entry.relativePath)) fail("target_manifest_duplicate_path");
    if (previousPath !== null && compareUtf8(previousPath, entry.relativePath) >= 0) {
      fail("target_manifest_entries_not_sorted");
    }
    seenPaths.add(entry.relativePath);
    previousPath = entry.relativePath;

    if (!new Set(["FILE", "DIRECTORY", "SYMLINK"]).has(entry.kind)) fail("target_manifest_entry_kind");
    integer(entry.deviceId, "target_manifest_entry_device");
    integer(entry.inode, "target_manifest_entry_inode", { min: 1 });
    if (typeof entry.mode !== "string" || !/^[0-7]{3,6}$/.test(entry.mode)) fail("target_manifest_entry_mode");
    integer(entry.linkCount, "target_manifest_entry_link_count", { min: 1 });
    integer(entry.sizeBytes, "target_manifest_entry_size");
    if (typeof entry.mtimeNs !== "string" || !/^[0-9]+$/.test(entry.mtimeNs)) fail("target_manifest_entry_mtime");
    totalSizeBytes += entry.sizeBytes;
    if (!Number.isSafeInteger(totalSizeBytes)) fail("target_manifest_size_overflow");

    if (entry.kind === "FILE") {
      sha256(entry.contentSha256, "target_manifest_entry_content");
      if (entry.symlinkText !== null) fail("target_manifest_file_symlink_text");
      const linkKey = `${entry.deviceId}:${entry.inode}`;
      const group = fileLinkGroups.get(linkKey) || { count: 0, linkCount: entry.linkCount };
      if (group.linkCount !== entry.linkCount) fail("target_manifest_link_count_drift");
      group.count += 1;
      fileLinkGroups.set(linkKey, group);
    } else if (entry.kind === "DIRECTORY") {
      if (entry.contentSha256 !== null || entry.symlinkText !== null) fail("target_manifest_directory_payload");
    } else {
      if (
        entry.contentSha256 !== null ||
        typeof entry.symlinkText !== "string" ||
        Buffer.byteLength(entry.symlinkText, "utf8") > 4096 ||
        /\0/.test(entry.symlinkText)
      ) {
        fail("target_manifest_symlink_payload");
      }
      const linkLocation = path.join(manifest.targetPath, entry.relativePath);
      const resolvedLink = path.resolve(path.dirname(linkLocation), entry.symlinkText);
      if (!pathMatchesPrefixExact(resolvedLink, manifest.targetPath)) {
        fail("target_manifest_escaping_symlink");
      }
    }
  }

  for (const group of fileLinkGroups.values()) {
    if (group.count !== group.linkCount) fail("target_manifest_incomplete_hardlink_set");
  }
  integer(manifest.entryCount, "target_manifest_entry_count", { min: 1 });
  integer(manifest.totalSizeBytes, "target_manifest_total_size");
  if (manifest.entryCount !== manifest.entries.length) fail("target_manifest_entry_count_mismatch");
  if (manifest.totalSizeBytes !== totalSizeBytes) fail("target_manifest_total_size_mismatch");
  sha256(manifest.entriesDigest, "target_manifest_entries_digest");
  if (manifest.entriesDigest !== computeTargetManifestEntriesDigest(manifest.entries)) {
    fail("target_manifest_entries_digest_mismatch");
  }
  sha256(manifest.manifestDigest, "target_manifest_digest");
  if (manifest.manifestDigest !== computeTargetManifestDigest(manifest)) {
    fail("target_manifest_digest_mismatch");
  }
  if (manifest.containsSpecialFiles !== false) fail("target_manifest_special_file");
  if (manifest.containsEscapingSymlinks !== false) fail("target_manifest_escaping_symlink");
  if (manifest.incompleteHardlinkSets !== false) fail("target_manifest_external_hardlink");
  validDateTime(manifest.generatedAt, "target_manifest_generated_at");
  if (manifest.status !== "VERIFIED_MATCH") fail("target_manifest_not_verified");
  return manifest;
}

export function computeProcessEvidenceSnapshotDigest(processEvidence) {
  const { snapshotDigest: _snapshotDigest, ...payload } = processEvidence;
  return digest("sirinx-process-evidence-v1", payload);
}

export function validateProcessEvidenceV1(processEvidence) {
  exactKeys(processEvidence, PROCESS_EVIDENCE_KEYS, "process_evidence");
  if (processEvidence.schemaVersion !== "1.0") fail("process_evidence_version");
  identifier(
    processEvidence.snapshotId,
    "process_evidence_id",
    ID_PATTERNS.processEvidenceId
  );
  nonEmptyString(processEvidence.targetPath, "process_evidence_target");
  if (
    !path.isAbsolute(processEvidence.targetPath) ||
    path.normalize(processEvidence.targetPath) !== processEvidence.targetPath ||
    /[\x00-\x1f\x7f]/.test(processEvidence.targetPath) ||
    Buffer.byteLength(processEvidence.targetPath, "utf8") > 4096
  ) {
    fail("process_evidence_target_invalid");
  }
  validDateTime(processEvidence.capturedAt, "process_evidence_captured_at");
  if (processEvidence.source !== "LOCAL_PROCESS_SNAPSHOT") fail("process_evidence_source");
  if (processEvidence.complete !== true) fail("process_evidence_incomplete");
  if (
    !Array.isArray(processEvidence.entries) ||
    processEvidence.entries.length > MAX_PROCESS_EVIDENCE_ENTRIES
  ) {
    fail("process_evidence_entries");
  }

  const identities = new Set();
  let activeConsumers = 0;
  let previousIdentity = null;
  for (const entry of processEvidence.entries) {
    exactKeys(entry, PROCESS_EVIDENCE_ENTRY_KEYS, "process_evidence_entry");
    integer(entry.pid, "process_evidence_pid", { min: 1 });
    integer(entry.parentPid, "process_evidence_parent_pid");
    integer(entry.processGroupId, "process_evidence_process_group");
    validDateTime(entry.startTime, "process_evidence_start_time");
    if (Date.parse(entry.startTime) > Date.parse(processEvidence.capturedAt)) {
      fail("process_evidence_start_after_capture");
    }
    for (const [key, value] of [["executable", entry.executablePath], ["cwd", entry.cwd]]) {
      if (value !== null) {
        nonEmptyString(value, `process_evidence_${key}`);
        if (
          !path.isAbsolute(value) ||
          path.normalize(value) !== value ||
          /[\x00-\x1f\x7f]/.test(value) ||
          Buffer.byteLength(value, "utf8") > 4096
        ) {
          fail(`process_evidence_${key}_invalid`);
        }
      }
    }
    sha256(entry.commandDigest, "process_evidence_command_digest");
    if (!new Set(["NONE", "CWD", "OPEN_FILE", "ARGUMENT", "MOUNT"]).has(entry.targetReference)) {
      fail("process_evidence_target_reference");
    }
    const cwdInsideTarget = entry.cwd !== null && pathMatchesPrefix(entry.cwd, processEvidence.targetPath);
    const executableInsideTarget =
      entry.executablePath !== null && pathMatchesPrefix(entry.executablePath, processEvidence.targetPath);
    if (entry.targetReference === "NONE" && (cwdInsideTarget || executableInsideTarget)) {
      fail("process_evidence_hidden_target_reference");
    }
    if (entry.targetReference === "CWD" && !cwdInsideTarget) fail("process_evidence_cwd_reference_mismatch");
    const identity = `${String(entry.pid).padStart(20, "0")}:${entry.startTime}`;
    if (identities.has(identity)) fail("process_evidence_duplicate_identity");
    if (previousIdentity !== null && previousIdentity >= identity) fail("process_evidence_entries_not_sorted");
    identities.add(identity);
    previousIdentity = identity;
    if (entry.targetReference !== "NONE") activeConsumers += 1;
  }
  integer(processEvidence.activeConsumers, "process_evidence_active_consumers");
  if (processEvidence.activeConsumers !== activeConsumers) fail("process_evidence_active_consumer_mismatch");
  sha256(processEvidence.snapshotDigest, "process_evidence_snapshot_digest");
  if (processEvidence.snapshotDigest !== computeProcessEvidenceSnapshotDigest(processEvidence)) {
    fail("process_evidence_snapshot_digest_mismatch");
  }
  if (processEvidence.status !== "VERIFIED_MATCH") fail("process_evidence_not_verified");
  return processEvidence;
}

export function resourceCleanupScopePayload(grant) {
  return {
    exclusions: grant.exclusions,
    repository: grant.repository,
    target: grant.target,
    targetManifest: grant.targetManifest
  };
}

export function resourceCleanupActionPayload(grant) {
  return {
    ...grant,
    hashes: {
      planHash: grant.hashes.planHash,
      processEvidenceDigest: grant.hashes.processEvidenceDigest,
      scopeHash: grant.hashes.scopeHash
    }
  };
}

export function computeResourceCleanupScopeHash(grant) {
  return digest("sirinx-resource-cleanup-scope-v2", resourceCleanupScopePayload(grant));
}

export function computeResourceCleanupActionDigest(grant) {
  return digest("sirinx-resource-cleanup-action-v2", resourceCleanupActionPayload(grant));
}

function pathMatchesPrefix(candidate, prefix) {
  const normalizedCandidate = candidate.toLocaleLowerCase("en-US");
  const normalizedPrefix = prefix.toLocaleLowerCase("en-US");
  return normalizedCandidate === normalizedPrefix || normalizedCandidate.startsWith(`${normalizedPrefix}${path.sep}`);
}

function pathMatchesPrefixExact(candidate, prefix) {
  return candidate === prefix || candidate.startsWith(`${prefix}${path.sep}`);
}

function pathsOverlap(left, right) {
  return pathMatchesPrefix(left, right) || pathMatchesPrefix(right, left);
}

export function validateLiteralCleanupTarget(targetPath, plan) {
  nonEmptyString(targetPath, "target_path");
  if (!path.isAbsolute(targetPath)) fail("target_not_absolute");
  if (/[\x00-\x1f\x7f]/.test(targetPath) || /[*?\[\]{}$]/.test(targetPath) || targetPath.startsWith("~")) {
    fail("target_not_literal");
  }
  if (targetPath.split(path.sep).includes("..") || path.basename(targetPath).toLocaleLowerCase("en-US") === "all") {
    fail("target_not_literal");
  }
  const normalized = path.normalize(targetPath);
  if (normalized !== targetPath || normalized === path.parse(normalized).root) fail("target_root_forbidden");
  if (plan.forbiddenExactTargets.some((candidate) => pathMatchesPrefix(candidate, normalized))) {
    fail("target_root_forbidden");
  }
  if (plan.forbiddenPrefixes.some((prefix) => pathsOverlap(normalized, prefix))) fail("target_protected");
  return normalized;
}

export function validateResourceCleanupPlan(plan) {
  exactKeys(plan, PLAN_KEYS, "plan");
  if (plan.schemaVersion !== "2.0-plan") fail("plan_schema_version");
  if (plan.status !== "PLAN_ONLY / NO_GRANT / CIRCUIT_HOLD") fail("plan_status");
  validDateTime(plan.generatedAt, "plan_generated_at");
  if (plan.repositoryPath !== "/Users/sirinx/SIRINXDev/sirinx-co") fail("plan_repository_path");

  exactKeys(plan.authority, AUTHORITY_KEYS, "plan_authority");
  if (plan.authority.action !== "RESOURCE_CLEANUP") fail("plan_action");
  if (plan.authority.circuit !== "resource_cleanup") fail("plan_circuit");
  if (plan.authority.approvalSchema !== "schemas/agent-runtime/resource-cleanup-approval.v2.schema.json") {
    fail("plan_approval_schema");
  }
  if (plan.authority.targetManifestSchema !== "schemas/agent-runtime/target-manifest.v1.schema.json") {
    fail("plan_manifest_schema");
  }
  if (plan.authority.processEvidenceSchema !== "schemas/agent-runtime/process-evidence.v1.schema.json") {
    fail("plan_process_evidence_schema");
  }
  if (plan.authority.transitionAuthority !== "future-managed-postgres-plus-sirinx-control-not-yet-wired") {
    fail("plan_transition_authority");
  }
  if (plan.authority.approvalAuthority !== "attested-human-operator-only") fail("plan_approval_authority");

  exactKeys(plan.safety, SAFETY_KEYS, "plan_safety");
  if (plan.safety.emergencyFloorKiB !== 5 * 1024 * 1024) fail("plan_emergency_floor");
  if (plan.safety.workloadFloorKiB !== 15 * 1024 * 1024) fail("plan_workload_floor");
  if (plan.safety.conservativeTargetKiB !== 20 * 1024 * 1024) fail("plan_conservative_target");
  if (plan.safety.maxTargetsPerGrant !== 1) fail("plan_target_count");
  if (plan.safety.targetManifestVersion !== "1.0") fail("plan_manifest_version");
  if (plan.safety.worktreeSnapshotVersion !== "1.0") fail("plan_worktree_version");
  if (plan.safety.maxEvidenceAgeSeconds !== 60) fail("plan_evidence_age");
  if (plan.safety.maxGrantLifetimeSeconds !== 300) fail("plan_grant_lifetime");
  if (plan.safety.maxTargetManifestEntries !== MAX_TARGET_MANIFEST_ENTRIES) fail("plan_manifest_entry_limit");
  if (plan.safety.maxProcessEvidenceEntries !== MAX_PROCESS_EVIDENCE_ENTRIES) fail("plan_process_entry_limit");
  if (plan.safety.sameFilesystemTrashReclaimKiB !== 0) fail("plan_trash_reclaim");
  if (plan.safety.automaticContinuation !== false) fail("plan_automatic_continuation");

  exactKeys(plan.runtime, RUNTIME_KEYS, "plan_runtime");
  if (plan.runtime.circuitState !== "HOLD") fail("plan_runtime_circuit");
  if (plan.runtime.grantPresent !== false) fail("plan_runtime_grant");
  if (plan.runtime.executorAvailable !== false) fail("plan_runtime_executor");
  if (plan.runtime.replayProtectionAvailable !== false) fail("plan_runtime_replay_protection");
  if (plan.runtime.canExecute !== false) fail("plan_runtime_execution");

  stringArray(plan.forbiddenExactTargets, "plan_forbidden_exact", { nonEmpty: true });
  stringArray(plan.forbiddenPrefixes, "plan_forbidden_prefixes", { nonEmpty: true });
  for (const candidate of [...plan.forbiddenExactTargets, ...plan.forbiddenPrefixes]) {
    if (!path.isAbsolute(candidate) || path.normalize(candidate) !== candidate) fail("plan_forbidden_path");
  }
  if (!plan.forbiddenExactTargets.includes(plan.repositoryPath)) fail("plan_repository_not_forbidden_target");
  if (!Array.isArray(plan.candidateTargets) || plan.candidateTargets.length !== 1) fail("plan_candidates_required");
  const candidatePaths = new Set();
  for (const candidate of plan.candidateTargets) {
    exactKeys(candidate, CANDIDATE_TARGET_KEYS, "plan_candidate");
    const candidatePath = validateLiteralCleanupTarget(candidate.absolutePath, plan);
    if (!TARGET_CLASSES.has(candidate.class)) fail("plan_candidate_class");
    if (candidatePath !== `${plan.repositoryPath}/target`) fail("plan_candidate_path");
    if (candidatePaths.has(candidatePath)) fail("plan_candidate_duplicate");
    candidatePaths.add(candidatePath);
  }
  exactKeys(plan.operationPreview, OPERATION_PREVIEW_KEYS, "plan_operation_preview");
  if (
    plan.operationPreview.kind !== "TOOL_NATIVE_CLEAN" ||
    plan.operationPreview.toolId !== "cargo-clean" ||
    plan.operationPreview.executablePath !== "/Users/sirinx/.cargo/bin/cargo" ||
    plan.operationPreview.cwd !== plan.repositoryPath ||
    canonicalize(plan.operationPreview.argv) !== canonicalize([
      "clean",
      "--manifest-path",
      `${plan.repositoryPath}/Cargo.toml`,
      "--target-dir",
      `${plan.repositoryPath}/target`
    ])
  ) {
    fail("plan_operation_preview");
  }
  exactKeys(plan.operationPreview.environment, OPERATION_ENVIRONMENT_KEYS, "plan_operation_environment");
  if (plan.operationPreview.environment.inherit !== false) fail("plan_operation_environment_inherit");
  exactKeys(plan.operationPreview.environment.set, OPERATION_ENVIRONMENT_SET_KEYS, "plan_operation_environment_set");
  if (
    plan.operationPreview.environment.set.HOME !== "/Users/sirinx" ||
    plan.operationPreview.environment.set.CARGO_HOME !== "/Users/sirinx/.cargo" ||
    plan.operationPreview.environment.set.RUSTUP_HOME !== "/Users/sirinx/.rustup" ||
    plan.operationPreview.environment.set.CARGO_TARGET_DIR !== `${plan.repositoryPath}/target`
  ) {
    fail("plan_operation_environment");
  }
  stringArray(plan.blockedActions, "plan_blocked_actions", { nonEmpty: true });
  stringArray(plan.stopRules, "plan_stop_rules", { nonEmpty: true });
  for (const required of ["delete", "move-to-trash", "tool-native-clean", "cache-prune", "process-stop", "build", "database-start", "model-load"] ) {
    if (!plan.blockedActions.includes(required)) fail("plan_missing_blocked_action");
  }
  return plan;
}

export function validateResourceCleanupGrant(grant, plan, options = {}) {
  exactKeys(grant, GRANT_KEYS, "grant");
  if (grant.schemaVersion !== "2.0-plan") fail("grant_schema_version");
  identifier(grant.ticketId, "ticket_id", ID_PATTERNS.ticketId);
  identifier(grant.grantId, "grant_id", ID_PATTERNS.grantId);
  identifier(grant.taskId, "task_id", ID_PATTERNS.taskId);
  if (grant.action !== "RESOURCE_CLEANUP") fail("grant_action");
  if (grant.circuit !== "resource_cleanup") fail("grant_circuit");
  if (grant.status !== "ISSUED") fail("grant_not_issued");

  exactKeys(grant.target, TARGET_KEYS, "grant_target");
  const normalizedTarget = validateLiteralCleanupTarget(grant.target.absolutePath, plan);
  if (!TARGET_CLASSES.has(grant.target.class)) fail("grant_target_class");
  const candidateTarget = plan.candidateTargets.find((candidate) => candidate.absolutePath === normalizedTarget);
  if (!candidateTarget || candidateTarget.class !== grant.target.class) fail("grant_target_not_planned");
  integer(grant.target.deviceId, "grant_target_device");
  integer(grant.target.inode, "grant_target_inode", { min: 1 });

  exactKeys(grant.repository, REPOSITORY_KEYS, "grant_repository");
  if (grant.repository.path !== plan.repositoryPath) fail("grant_repository_path");
  nonEmptyString(grant.repository.branch, "grant_repository_branch");
  if (!COMMIT_PATTERN.test(grant.repository.commitSha)) fail("grant_repository_commit");
  if (grant.repository.worktreeSnapshotVersion !== plan.safety.worktreeSnapshotVersion) {
    fail("grant_worktree_version");
  }
  sha256(grant.repository.worktreeSnapshotDigest, "grant_worktree_digest");

  exactKeys(grant.hashes, HASH_KEYS, "grant_hashes");
  sha256(grant.hashes.planHash, "grant_plan_hash");
  sha256(grant.hashes.scopeHash, "grant_scope_hash");
  sha256(grant.hashes.actionDigest, "grant_action_digest");
  sha256(grant.hashes.processEvidenceDigest, "grant_process_evidence_digest");

  exactKeys(grant.principals, PRINCIPAL_KEYS, "grant_principals");
  for (const [key, value] of Object.entries(grant.principals)) nonEmptyString(value, `grant_principal_${key}`);
  if (new Set(Object.values(grant.principals)).size !== 4) fail("grant_principals_must_be_distinct");

  exactKeys(grant.approval, APPROVAL_KEYS, "grant_approval");
  nonEmptyString(grant.approval.approverAssertionRef, "grant_approver_assertion");
  sha256(grant.approval.issuerAttestationDigest, "grant_issuer_attestation");
  sha256(grant.approval.nonceDigest, "grant_nonce");

  exactKeys(grant.targetManifest, MANIFEST_KEYS, "grant_manifest");
  if (grant.targetManifest.schemaVersion !== plan.safety.targetManifestVersion) fail("grant_manifest_version");
  identifier(grant.targetManifest.manifestId, "grant_manifest_id", ID_PATTERNS.manifestId);
  sha256(grant.targetManifest.entriesDigest, "grant_manifest_digest");
  sha256(grant.targetManifest.manifestDigest, "grant_full_manifest_digest");
  integer(grant.targetManifest.entryCount, "grant_manifest_entries", { min: 1 });
  integer(grant.targetManifest.totalSizeBytes, "grant_manifest_size");
  if (grant.targetManifest.containsSpecialFiles !== false) fail("grant_manifest_special_file");
  if (grant.targetManifest.containsEscapingSymlinks !== false) fail("grant_manifest_escaping_symlink");
  if (grant.targetManifest.incompleteHardlinkSets !== false) fail("grant_manifest_external_hardlink");

  exactKeys(grant.operation, OPERATION_KEYS, "grant_operation");
  if (!OPERATION_KINDS.has(grant.operation.kind)) fail("grant_operation_kind");
  nonEmptyString(grant.operation.toolId, "grant_operation_tool");
  sha256(grant.operation.parametersDigest, "grant_operation_parameters");
  if (
    grant.target.class !== "GENERATED_BUILD_OUTPUT" ||
    grant.operation.toolId !== "cargo-clean" ||
    grant.operation.destinationDeviceId !== null
  ) {
    fail("grant_operation_not_allowlisted");
  }
  if (
    grant.operation.parametersDigest !==
    computeResourceCleanupOperationParametersDigest(plan.operationPreview)
  ) {
    fail("grant_operation_parameters_mismatch");
  }

  exactKeys(grant.recovery, RECOVERY_KEYS, "grant_recovery");
  nonEmptyString(grant.recovery.sourceRef, "grant_recovery_source");
  nonEmptyString(grant.recovery.procedureRef, "grant_recovery_procedure");
  boolean(grant.recovery.networkRequired, "grant_recovery_network");
  boolean(grant.recovery.installRequired, "grant_recovery_install");
  stringArray(grant.recovery.supportingTicketIds, "grant_recovery_tickets");
  for (const ticket of grant.recovery.supportingTicketIds) identifier(ticket, "grant_recovery_ticket", ID_PATTERNS.ticketId);
  if ((grant.recovery.networkRequired || grant.recovery.installRequired) && grant.recovery.supportingTicketIds.length === 0) {
    fail("grant_recovery_ticket_required");
  }

  stringArray(grant.exclusions, "grant_exclusions", { nonEmpty: true });
  for (const exclusion of grant.exclusions) {
    if (
      exclusion.length < 2 ||
      !path.isAbsolute(exclusion) ||
      path.normalize(exclusion) !== exclusion ||
      /[\x00-\x1f\x7f]/.test(exclusion) ||
      /[*?\[\]{}$]/.test(exclusion) ||
      exclusion.split(path.sep).includes("..")
    ) {
      fail("grant_exclusion_path");
    }
  }
  if (plan.forbiddenPrefixes.some((required) => !grant.exclusions.includes(required))) {
    fail("grant_required_exclusion_missing");
  }
  if (grant.exclusions.some((exclusion) => pathsOverlap(normalizedTarget, exclusion))) {
    fail("grant_target_excluded");
  }

  exactKeys(grant.limits, LIMIT_KEYS, "grant_limits");
  if (grant.limits.maxCalls !== 1 || grant.limits.maxCostUsd !== 0) fail("grant_limits_single_zero_cost");
  integer(grant.limits.maxRuntimeSeconds, "grant_runtime", { min: 1, max: 3600 });
  if (grant.limits.maxEvidenceAgeSeconds !== plan.safety.maxEvidenceAgeSeconds) fail("grant_evidence_age");
  integer(grant.limits.maxAffectedKiB, "grant_max_affected", { min: 1 });
  integer(grant.limits.minReclaimKiB, "grant_min_reclaim", { min: 1 });
  if (grant.limits.emergencyFloorKiB !== plan.safety.emergencyFloorKiB) fail("grant_emergency_floor");
  integer(grant.limits.worstCaseCleanupGrowthKiB, "grant_cleanup_growth");
  integer(grant.limits.requiredPostFreeKiB, "grant_required_post_free", { min: plan.safety.conservativeTargetKiB });
  if (grant.limits.minReclaimKiB > grant.limits.maxAffectedKiB) fail("grant_reclaim_exceeds_affected");
  if (Math.ceil(grant.targetManifest.totalSizeBytes / 1024) > grant.limits.maxAffectedKiB) {
    fail("grant_manifest_exceeds_affected");
  }

  validDateTime(grant.issuedAt, "grant_issued_at");
  validDateTime(grant.expiresAt, "grant_expires_at");
  const issuedAt = Date.parse(grant.issuedAt);
  const expiresAt = Date.parse(grant.expiresAt);
  const now = options.now ? options.now.getTime() : Date.now();
  if (!Number.isFinite(now)) fail("grant_now_invalid");
  if (expiresAt <= issuedAt) fail("grant_expiry_order");
  if (issuedAt < Date.parse(plan.generatedAt)) fail("grant_before_plan");
  if (expiresAt - issuedAt > plan.safety.maxGrantLifetimeSeconds * 1000) {
    fail("grant_lifetime_exceeded");
  }
  if (now < issuedAt || now >= expiresAt) fail("grant_not_current");

  if (grant.hashes.planHash !== computeResourceCleanupPlanHash(plan)) fail("grant_plan_hash_mismatch");
  if (grant.hashes.scopeHash !== computeResourceCleanupScopeHash(grant)) fail("grant_scope_hash_mismatch");
  if (grant.hashes.actionDigest !== computeResourceCleanupActionDigest(grant)) fail("grant_action_digest_mismatch");
  return grant;
}

export function validateResourceCleanupEvidence(evidence) {
  exactKeys(evidence, EVIDENCE_KEYS, "evidence");
  validDateTime(evidence.observedAt, "evidence_observed_at");
  for (const key of [
    "targetExists",
    "targetIsSymlink",
    "processEvidenceComplete",
    "recoveryProcedureVerified",
    "recoverySourceVerified",
    "gitIgnored",
    "gitTracked",
    "containsSpecialFiles",
    "containsEscapingSymlinks",
    "incompleteHardlinkSets",
    "exclusionOverlap"
  ]) boolean(evidence[key], `evidence_${key}`);
  for (const key of [
    "currentFreeKiB",
    "filesystemDeviceId",
    "targetAllocatedKiB",
    "targetDeviceId",
    "targetEntryCount",
    "targetInode",
    "targetTotalSizeBytes",
    "activeConsumers"
  ]) integer(evidence[key], `evidence_${key}`);
  nonEmptyString(evidence.targetPath, "evidence_target_path");
  nonEmptyString(evidence.targetRealPath, "evidence_target_real_path");
  nonEmptyString(evidence.repositoryPath, "evidence_repository_path");
  nonEmptyString(evidence.repositoryBranch, "evidence_repository_branch");
  if (!COMMIT_PATTERN.test(evidence.repositoryCommitSha)) fail("evidence_repository_commit");
  if (!new Set(["DIRECTORY", "FILE"]).has(evidence.targetType)) fail("evidence_target_type");
  if (evidence.targetManifestVersion !== "1.0") fail("evidence_manifest_version");
  sha256(evidence.targetManifestDigest, "evidence_manifest_digest");
  sha256(evidence.targetEntriesDigest, "evidence_entries_digest");
  sha256(evidence.operationParametersDigest, "evidence_operation_parameters_digest");
  sha256(evidence.processEvidenceDigest, "evidence_process_digest");
  if (evidence.worktreeSnapshotVersion !== "1.0") fail("evidence_worktree_version");
  sha256(evidence.worktreeSnapshotDigest, "evidence_worktree_digest");
  return evidence;
}

function evidenceBlockers(grant, evidence, plan, now) {
  const blockers = [];
  const observedAt = Date.parse(evidence.observedAt);
  const nowMs = now ? now.getTime() : Date.now();
  if (!Number.isFinite(nowMs)) blockers.push("evidence_now_invalid");
  if (observedAt > nowMs) blockers.push("evidence_from_future");
  if (observedAt < Date.parse(grant.issuedAt)) blockers.push("evidence_before_grant");
  if (nowMs - observedAt > grant.limits.maxEvidenceAgeSeconds * 1000) blockers.push("evidence_stale");
  if (!evidence.targetExists) blockers.push("target_missing");
  if (evidence.targetIsSymlink || evidence.targetRealPath !== grant.target.absolutePath) blockers.push("target_path_symlink");
  if (evidence.targetPath !== grant.target.absolutePath) blockers.push("target_path_drift");
  if (
    evidence.repositoryPath !== grant.repository.path ||
    evidence.repositoryBranch !== grant.repository.branch ||
    evidence.repositoryCommitSha !== grant.repository.commitSha
  ) {
    blockers.push("repository_identity_drift");
  }
  if (evidence.filesystemDeviceId !== grant.target.deviceId || evidence.targetDeviceId !== grant.target.deviceId || evidence.targetInode !== grant.target.inode) {
    blockers.push("target_identity_changed");
  }
  if (!evidence.processEvidenceComplete) blockers.push("process_evidence_unavailable");
  if (evidence.processEvidenceDigest !== grant.hashes.processEvidenceDigest) blockers.push("process_evidence_drift");
  if (evidence.activeConsumers !== 0) blockers.push("target_active_consumer");
  if (evidence.gitTracked || !evidence.gitIgnored) blockers.push("target_not_verified_regenerable");
  if (evidence.containsSpecialFiles) blockers.push("target_manifest_special_file");
  if (evidence.containsEscapingSymlinks) blockers.push("target_manifest_symlink_unreviewed");
  if (evidence.incompleteHardlinkSets) blockers.push("target_manifest_external_hardlink");
  if (evidence.exclusionOverlap) blockers.push("target_excluded");
  if (!evidence.recoverySourceVerified) blockers.push("recovery_source_unverified");
  if (!evidence.recoveryProcedureVerified) blockers.push("recovery_procedure_unverified");
  if (evidence.operationParametersDigest !== grant.operation.parametersDigest) blockers.push("operation_preview_drift");
  if (
    evidence.targetManifestVersion !== grant.targetManifest.schemaVersion ||
    evidence.targetManifestDigest !== grant.targetManifest.manifestDigest ||
    evidence.targetEntriesDigest !== grant.targetManifest.entriesDigest ||
    evidence.targetEntryCount !== grant.targetManifest.entryCount ||
    evidence.targetTotalSizeBytes !== grant.targetManifest.totalSizeBytes
  ) {
    blockers.push("target_manifest_drift");
  }
  if (evidence.worktreeSnapshotVersion !== grant.repository.worktreeSnapshotVersion || evidence.worktreeSnapshotDigest !== grant.repository.worktreeSnapshotDigest) {
    blockers.push("worktree_manifest_drift");
  }
  if (evidence.targetAllocatedKiB > grant.limits.maxAffectedKiB) blockers.push("target_allocation_exceeds_limit");
  if (grant.limits.minReclaimKiB > evidence.targetAllocatedKiB) blockers.push("minimum_reclaim_exceeds_allocation");
  if (evidence.currentFreeKiB < grant.limits.emergencyFloorKiB + grant.limits.worstCaseCleanupGrowthKiB) {
    blockers.push("cleanup_start_margin_insufficient");
  }
  const projectedMinimumFree = evidence.currentFreeKiB - grant.limits.worstCaseCleanupGrowthKiB + grant.limits.minReclaimKiB;
  if (projectedMinimumFree < grant.limits.requiredPostFreeKiB) blockers.push("projected_reclaim_below_threshold");
  if (
    plan.runtime.circuitState !== "HOLD" ||
    plan.runtime.grantPresent !== false ||
    plan.runtime.executorAvailable !== false ||
    plan.runtime.replayProtectionAvailable !== false ||
    plan.runtime.canExecute !== false
  ) {
    blockers.push("plan_runtime_not_fail_closed");
  }
  return blockers;
}

function targetManifestBlockers(grant, evidence, manifest, now) {
  const blockers = [];
  if (
    manifest.targetPath !== grant.target.absolutePath ||
    manifest.targetDeviceId !== grant.target.deviceId ||
    manifest.targetInode !== grant.target.inode
  ) {
    blockers.push("target_manifest_root_drift");
  }
  if (
    manifest.manifestId !== grant.targetManifest.manifestId ||
    manifest.schemaVersion !== grant.targetManifest.schemaVersion ||
    manifest.manifestDigest !== grant.targetManifest.manifestDigest ||
    manifest.entriesDigest !== grant.targetManifest.entriesDigest ||
    manifest.entryCount !== grant.targetManifest.entryCount ||
    manifest.totalSizeBytes !== grant.targetManifest.totalSizeBytes
  ) {
    blockers.push("target_manifest_grant_drift");
  }
  if (manifest.entries.some((entry) => entry.deviceId !== grant.target.deviceId)) {
    blockers.push("target_manifest_cross_device");
  }
  const generatedAt = Date.parse(manifest.generatedAt);
  const observedAt = Date.parse(evidence.observedAt);
  const nowMs = now ? now.getTime() : Date.now();
  if (generatedAt > Date.parse(grant.issuedAt)) blockers.push("target_manifest_after_grant");
  if (generatedAt > observedAt || generatedAt > nowMs) blockers.push("target_manifest_from_future");
  if (nowMs - generatedAt > grant.limits.maxEvidenceAgeSeconds * 1000) blockers.push("target_manifest_stale");
  return blockers;
}

function processEvidenceBlockers(grant, evidence, processEvidence, now) {
  const blockers = [];
  if (processEvidence.targetPath !== grant.target.absolutePath) blockers.push("process_evidence_target_drift");
  if (
    processEvidence.snapshotDigest !== grant.hashes.processEvidenceDigest ||
    processEvidence.snapshotDigest !== evidence.processEvidenceDigest
  ) {
    blockers.push("process_evidence_drift");
  }
  if (!processEvidence.complete || !evidence.processEvidenceComplete) blockers.push("process_evidence_unavailable");
  if (
    processEvidence.activeConsumers !== evidence.activeConsumers ||
    processEvidence.activeConsumers !== 0
  ) {
    blockers.push("target_active_consumer");
  }
  const capturedAt = Date.parse(processEvidence.capturedAt);
  const observedAt = Date.parse(evidence.observedAt);
  const nowMs = now ? now.getTime() : Date.now();
  if (capturedAt > Date.parse(grant.issuedAt)) blockers.push("process_evidence_after_grant");
  if (capturedAt > observedAt || capturedAt > nowMs) blockers.push("process_evidence_from_future");
  if (nowMs - capturedAt > grant.limits.maxEvidenceAgeSeconds * 1000) blockers.push("process_evidence_stale");
  return blockers;
}

export function evaluateResourceCleanupPreflight({
  plan,
  grant = null,
  evidence = null,
  targetManifest = null,
  processEvidence = null,
  now
} = {}) {
  validateResourceCleanupPlan(plan);
  const blockers = ["cleanup_authority_unavailable"];
  let grantStructureValidated = false;
  let evidenceStructureValidated = false;
  let targetManifestValidated = false;
  let processEvidenceValidated = false;

  if (!grant) {
    blockers.push("cleanup_grant_absent");
  } else {
    try {
      validateResourceCleanupGrant(grant, plan, { now });
      grantStructureValidated = true;
    } catch (error) {
      blockers.push(error instanceof Error ? error.message.replace("invalid_resource_cleanup_preflight:", "") : "cleanup_grant_invalid");
    }
  }

  if (!evidence) {
    blockers.push("cleanup_evidence_absent");
  } else {
    try {
      validateResourceCleanupEvidence(evidence);
      evidenceStructureValidated = true;
    } catch (error) {
      blockers.push(error instanceof Error ? error.message.replace("invalid_resource_cleanup_preflight:", "") : "cleanup_evidence_invalid");
    }
  }

  if (!targetManifest) {
    blockers.push("target_manifest_absent");
  } else {
    try {
      validateTargetManifestV1(targetManifest);
      targetManifestValidated = true;
    } catch (error) {
      blockers.push(error instanceof Error ? error.message.replace("invalid_resource_cleanup_preflight:", "") : "target_manifest_invalid");
    }
  }

  if (!processEvidence) {
    blockers.push("process_evidence_absent");
  } else {
    try {
      validateProcessEvidenceV1(processEvidence);
      processEvidenceValidated = true;
    } catch (error) {
      blockers.push(error instanceof Error ? error.message.replace("invalid_resource_cleanup_preflight:", "") : "process_evidence_invalid");
    }
  }

  if (grantStructureValidated && evidenceStructureValidated) {
    blockers.push(...evidenceBlockers(grant, evidence, plan, now));
  }
  if (grantStructureValidated && evidenceStructureValidated && targetManifestValidated) {
    blockers.push(...targetManifestBlockers(grant, evidence, targetManifest, now));
  }
  if (grantStructureValidated && evidenceStructureValidated && processEvidenceValidated) {
    blockers.push(...processEvidenceBlockers(grant, evidence, processEvidence, now));
  }
  blockers.push(
    "resource_cleanup_circuit_hold",
    "resource_cleanup_executor_unavailable",
    "cleanup_replay_protection_unavailable"
  );

  return {
    title: "SIRINX resource cleanup v2 preflight",
    schemaVersion: "2.0-plan",
    status: "HOLD",
    mode: "local-read-only-evidence-plane",
    action: "RESOURCE_CLEANUP",
    circuit: "resource_cleanup",
    readOnly: true,
    mutations: false,
    cleanupExecuted: false,
    approvalConsumed: false,
    replayProtectionAvailable: false,
    networkCalls: false,
    processStopped: false,
    commandExecuted: false,
    externalWrites: false,
    canExecute: false,
    eligibleForExecutorHandoff: false,
    requiresHumanApproval: true,
    grantStructureValidated,
    evidenceStructureValidated,
    targetManifestValidated,
    processEvidenceValidated,
    authorityValidated: false,
    admissionValidated: false,
    blockers: [...new Set(blockers)],
    stopPoint: "RESOURCE CLEANUP PREFLIGHT HOLD - NO MUTATION OR APPROVAL CONSUMPTION"
  };
}

export async function getResourceCleanupPreflight(options = {}) {
  const readFileImpl = options.readFileImpl || readFile;
  let plan;
  try {
    plan = JSON.parse(await readFileImpl(options.planUrl || RESOURCE_CLEANUP_PLAN_URL, "utf8"));
  } catch {
    fail("plan_json_parse");
  }
  return evaluateResourceCleanupPreflight({
    plan,
    grant: options.grant || null,
    evidence: options.evidence || null,
    targetManifest: options.targetManifest || null,
    processEvidence: options.processEvidence || null,
    now: options.now
  });
}

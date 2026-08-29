import { createHash } from "node:crypto";
import path from "node:path";

import {
  computeResourceCleanupOperationParametersDigest,
  validateProcessEvidenceV1,
  validateResourceCleanupGrant,
  validateResourceCleanupPlan,
  validateTargetManifestV1
} from "./resource-cleanup-preflight.mjs";

const SHA256 = /^[0-9a-f]{64}$/;
const HEX40 = /^[0-9a-f]{40}$/;
const DECIMAL = /^(0|[1-9][0-9]*)$/;
const IDENTIFIERS = Object.freeze({
  identity: /^EXE-[A-Za-z0-9._-]+$/,
  evidence: /^RCAE-[A-Za-z0-9._-]+$/,
  attempt: /^ATTEMPT-[A-Za-z0-9._-]+$/,
  ticket: /^TKT-[A-Za-z0-9._-]+$/,
  grant: /^GRANT-[A-Za-z0-9._-]+$/,
  task: /^TASK-[A-Za-z0-9._-]+$/,
  run: /^RUN-[A-Za-z0-9._-]+$/,
  lease: /^LEASE-[A-Za-z0-9._-]+$/,
  receipt: /^RECEIPT-[A-Za-z0-9._-]+$/,
  artifact: /^ARTIFACT-[A-Za-z0-9._-]+$/
});

const NODE_KEYS = ["deviceId", "gid", "inode", "kind", "linkCount", "mode", "mtimeNs", "sizeBytes", "uid"];
const FILE_IDENTITY_KEYS = ["contentSha256", "node", "path"];
const DIRECTORY_IDENTITY_KEYS = ["node", "path"];
const SYMLINK_HOP_KEYS = ["linkText", "node", "path", "resolvedNextPath"];
const REVISION_KEYS = ["commitDate", "commitHash", "hostTriple", "version"];
const EXECUTABLE_KEYS = [
  "architecture", "binary", "cwdIdentity", "environmentDigest", "identityDigest",
  "identityId", "invocationArgv0", "invocationNode", "invocationPath", "manifestPathIdentity",
  "observedAt", "operationParametersDigest", "ownerUid", "parentDirectories", "platform",
  "resolvedNode", "resolvedPath", "schemaVersion", "selectedTool", "status", "symlinkChain"
];
const SELECTED_TOOL_KEYS = [
  "cargoRevision", "exactToolchainEnvironment", "proxy", "repositorySelector",
  "revisionProbeDigest", "rustcRevision", "selectedCargoExecutable", "tool",
  "toolchainManifestDigest", "toolchainName", "toolchainSelectorSource"
];
const EVIDENCE_KEYS = [
  "action", "circuit", "circuitSnapshot", "collectedAt", "evidenceDigest", "evidenceId",
  "executableIdentity", "executor", "grantBinding", "grantId", "lease", "operation",
  "processEvidence", "recovery", "replaySnapshot", "repository", "resources", "runId",
  "schemaVersion", "status", "targetManifest", "taskId", "ticketId"
];
const ATTEMPT_KEYS = [
  "action", "actionDigest", "admissionDigest", "attemptDigest", "attemptId", "automaticRetry",
  "circuit", "createdAt", "effectKey", "executorPrincipalId", "exit", "expectedVersion",
  "finishedAt", "grantId", "postReceiptId", "processIdentity", "requestingAt", "retryCount",
  "runId", "schemaVersion", "startedAt", "state", "status", "taskId", "ticketId"
];
const RECEIPT_KEYS = [
  "action", "after", "artifactId", "attemptId", "bindings", "circuit", "createdAt",
  "effect", "effectKey", "effectState", "grantId", "receiptDigest", "receiptId", "runId",
  "schemaVersion", "status", "taskId", "ticketId", "verdict", "verification"
];
const OWNED_PATH_ROOT = "/Users/sirinx";
const RUSTUP_HOME = "/Users/sirinx/.rustup";

const EFFECT_STATES = new Set([
  "PREPARED", "REQUESTING", "RUNNING", "VERIFYING", "CONFIRMED", "FAILED",
  "BLOCKED", "CANCELED", "EFFECT_UNKNOWN"
]);
const EFFECT_TRANSITIONS = Object.freeze({
  PREPARED: new Set(["REQUESTING", "BLOCKED", "CANCELED"]),
  REQUESTING: new Set(["RUNNING", "EFFECT_UNKNOWN"]),
  RUNNING: new Set(["VERIFYING", "EFFECT_UNKNOWN"]),
  VERIFYING: new Set(["CONFIRMED", "FAILED", "BLOCKED", "EFFECT_UNKNOWN"]),
  CONFIRMED: new Set(),
  FAILED: new Set(),
  BLOCKED: new Set(),
  CANCELED: new Set(),
  EFFECT_UNKNOWN: new Set()
});

function fail(code) {
  throw new Error(`invalid_resource_cleanup_admission:${code}`);
}

function exactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${label}_must_be_object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    fail(`${label}_must_be_closed`);
  }
}

function string(value, label, max = 4096) {
  if (typeof value !== "string" || value.trim() === "" || value.length > max) fail(`${label}_invalid`);
}

function integer(value, label, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(value) || value < min || value > max) fail(`${label}_invalid`);
}

function decimal(value, label, { nonZero = false } = {}) {
  if (typeof value !== "string" || !DECIMAL.test(value) || value.length > 40 || (nonZero && value === "0")) {
    fail(`${label}_invalid`);
  }
}

function sha256(value, label) {
  if (typeof value !== "string" || !SHA256.test(value)) fail(`${label}_invalid`);
}

function identifier(value, pattern, label) {
  if (typeof value !== "string" || !pattern.test(value)) fail(`${label}_invalid`);
}

function instant(value, label) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(value) || !Number.isFinite(Date.parse(value))) {
    fail(`${label}_invalid`);
  }
  return Date.parse(value);
}

function absolute(value, label) {
  string(value, label);
  if (
    !path.isAbsolute(value) || path.normalize(value) !== value || /[\x00-\x1f\x7f]/.test(value) ||
    /[*?\[\]{}$]/.test(value) || value.split(path.sep).includes("..")
  ) fail(`${label}_invalid`);
  return value;
}

function canonicalize(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function digest(domain, value) {
  return createHash("sha256").update(`${domain}\0${canonicalize(value)}`, "utf8").digest("hex");
}

function same(left, right) {
  return canonicalize(left) === canonicalize(right);
}

function modeNumber(value, label) {
  if (typeof value !== "string" || !/^[0-7]{3,6}$/.test(value)) fail(`${label}_mode_invalid`);
  return Number.parseInt(value, 8);
}

function validateNode(node, expectedKind, ownerUid, label, { executable = false } = {}) {
  exactKeys(node, NODE_KEYS, label);
  if (!new Set(["SYMLINK", "REGULAR_FILE", "DIRECTORY"]).has(node.kind)) fail(`${label}_kind_invalid`);
  if (expectedKind && node.kind !== expectedKind) fail(`${label}_kind_mismatch`);
  for (const key of ["deviceId", "uid", "gid", "sizeBytes", "mtimeNs"]) decimal(node[key], `${label}_${key}`);
  for (const key of ["inode", "linkCount"]) decimal(node[key], `${label}_${key}`, { nonZero: true });
  const mode = modeNumber(node.mode, label);
  if (ownerUid !== undefined && node.uid !== ownerUid) fail(`${label}_owner_mismatch`);
  // Symlink mode bits are not access-control bits on Darwin. Security applies
  // to every traversed parent and the resolved regular executables instead.
  if (node.kind !== "SYMLINK" && (mode & 0o6000) !== 0) fail(`${label}_setid_forbidden`);
  if (node.kind !== "SYMLINK" && (mode & 0o022) !== 0) fail(`${label}_group_world_writable`);
  if (executable && (mode & 0o111) === 0) fail(`${label}_not_executable`);
  return node;
}

function validateFileIdentity(value, ownerUid, label, options = {}) {
  exactKeys(value, FILE_IDENTITY_KEYS, label);
  absolute(value.path, `${label}_path`);
  validateNode(value.node, "REGULAR_FILE", ownerUid, `${label}_node`, options);
  sha256(value.contentSha256, `${label}_content`);
  return value;
}

function validateDirectoryIdentity(value, ownerUid, label) {
  exactKeys(value, DIRECTORY_IDENTITY_KEYS, label);
  absolute(value.path, `${label}_path`);
  validateNode(value.node, "DIRECTORY", ownerUid, `${label}_node`);
  return value;
}

function validateRevision(value, label) {
  exactKeys(value, REVISION_KEYS, label);
  if (typeof value.version !== "string" || !/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/.test(value.version)) {
    fail(`${label}_version_invalid`);
  }
  if (!HEX40.test(value.commitHash)) fail(`${label}_commit_invalid`);
  if (typeof value.commitDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.commitDate)) {
    fail(`${label}_date_invalid`);
  }
  if (value.hostTriple !== "aarch64-apple-darwin") fail(`${label}_host_invalid`);
}

export function computeResourceCleanupEnvironmentDigest(environment) {
  return digest("sirinx-resource-cleanup-environment-v1", environment);
}

export function computeResourceCleanupExclusionsDigest(exclusions) {
  return digest("sirinx-resource-cleanup-exclusions-v1", exclusions);
}

export function computeResourceCleanupRecoveryReferenceDigest(kind, reference) {
  if (!new Set(["source", "procedure"]).has(kind)) fail("cleanup_recovery_reference_kind");
  string(reference, `cleanup_recovery_${kind}_reference`, 2048);
  return digest(`sirinx-resource-cleanup-recovery-${kind}-v1`, reference);
}

function ownedAncestorDirectories(targetPath, { directory = false } = {}) {
  let cursor = directory ? targetPath : path.dirname(targetPath);
  const ancestors = [];
  while (cursor === OWNED_PATH_ROOT || cursor.startsWith(`${OWNED_PATH_ROOT}${path.sep}`)) {
    ancestors.push(cursor);
    if (cursor === OWNED_PATH_ROOT) break;
    cursor = path.dirname(cursor);
  }
  return ancestors;
}

export function computeExecutableIdentityDigest(identity) {
  const { identityDigest: _identityDigest, ...payload } = identity;
  return digest("sirinx-executable-identity-v1", payload);
}

export function validateExecutableIdentityV1(identity, options = {}) {
  exactKeys(identity, EXECUTABLE_KEYS, "executable_identity");
  if (identity.schemaVersion !== "1.0") fail("executable_identity_version");
  identifier(identity.identityId, IDENTIFIERS.identity, "executable_identity_id");
  const observedAt = instant(identity.observedAt, "executable_identity_observed_at");
  if (identity.platform !== "darwin" || identity.architecture !== "arm64") fail("executable_identity_host");
  decimal(identity.ownerUid, "executable_identity_owner_uid");
  absolute(identity.invocationPath, "executable_identity_invocation_path");
  if (identity.invocationArgv0 !== "cargo") fail("executable_identity_argv0");
  validateNode(identity.invocationNode, null, identity.ownerUid, "executable_identity_invocation_node", {
    executable: identity.invocationNode.kind === "REGULAR_FILE"
  });
  if (!new Set(["SYMLINK", "REGULAR_FILE"]).has(identity.invocationNode.kind)) {
    fail("executable_identity_invocation_kind");
  }
  absolute(identity.resolvedPath, "executable_identity_resolved_path");
  validateNode(identity.resolvedNode, "REGULAR_FILE", identity.ownerUid, "executable_identity_resolved_node", { executable: true });

  if (!Array.isArray(identity.symlinkChain) || identity.symlinkChain.length > 16) fail("executable_identity_symlink_chain");
  if (identity.invocationNode.kind === "SYMLINK" && identity.symlinkChain.length === 0) fail("executable_identity_symlink_chain_missing");
  if (identity.invocationNode.kind === "REGULAR_FILE" && identity.symlinkChain.length !== 0) fail("executable_identity_unexpected_symlink_chain");
  const seenLinks = new Set();
  let expectedPath = identity.invocationPath;
  for (let index = 0; index < identity.symlinkChain.length; index += 1) {
    const hop = identity.symlinkChain[index];
    exactKeys(hop, SYMLINK_HOP_KEYS, "executable_identity_symlink_hop");
    absolute(hop.path, "executable_identity_symlink_path");
    absolute(hop.resolvedNextPath, "executable_identity_symlink_next");
    validateNode(hop.node, "SYMLINK", identity.ownerUid, "executable_identity_symlink_node");
    string(hop.linkText, "executable_identity_symlink_text");
    if (hop.path !== expectedPath || seenLinks.has(hop.path)) fail("executable_identity_symlink_order");
    const resolved = path.resolve(path.dirname(hop.path), hop.linkText);
    if (resolved !== hop.resolvedNextPath) fail("executable_identity_symlink_resolution");
    if (index === 0 && !same(hop.node, identity.invocationNode)) fail("executable_identity_invocation_lstat_drift");
    seenLinks.add(hop.path);
    expectedPath = hop.resolvedNextPath;
  }
  if (identity.symlinkChain.length > 0 && expectedPath !== identity.resolvedPath) fail("executable_identity_resolved_path_drift");
  if (identity.symlinkChain.length === 0) {
    if (identity.resolvedPath !== identity.invocationPath || !same(identity.resolvedNode, identity.invocationNode)) {
      fail("executable_identity_regular_resolution_drift");
    }
  }

  if (!Array.isArray(identity.parentDirectories) || identity.parentDirectories.length === 0 || identity.parentDirectories.length > 32) {
    fail("executable_identity_parent_directories");
  }
  const parents = new Set();
  for (const directory of identity.parentDirectories) {
    validateDirectoryIdentity(directory, identity.ownerUid, "executable_identity_parent");
    if (parents.has(directory.path)) fail("executable_identity_duplicate_parent");
    parents.add(directory.path);
  }
  exactKeys(identity.binary, ["architecture", "contentSha256", "contentSizeBytes", "format"], "executable_identity_binary");
  if (identity.binary.format !== "MACH_O_64" || identity.binary.architecture !== "arm64") fail("executable_identity_binary_format");
  sha256(identity.binary.contentSha256, "executable_identity_binary_content");
  decimal(identity.binary.contentSizeBytes, "executable_identity_binary_size");
  if (identity.binary.contentSizeBytes !== identity.resolvedNode.sizeBytes) fail("executable_identity_binary_size_drift");

  exactKeys(identity.selectedTool, SELECTED_TOOL_KEYS, "executable_identity_selected_tool");
  if (
    identity.selectedTool.tool !== "cargo" || identity.selectedTool.proxy !== "rustup" ||
    identity.selectedTool.toolchainSelectorSource !== "ACTION_TIME_EXACT_OVERRIDE_PREVIEW"
  ) fail("executable_identity_selected_tool");
  string(identity.selectedTool.toolchainName, "executable_identity_toolchain", 256);
  if (/^(stable|beta|nightly)(?:-.+)?$/i.test(identity.selectedTool.toolchainName)) {
    fail("executable_identity_mutable_toolchain_alias");
  }
  exactKeys(identity.selectedTool.repositorySelector, ["contentSha256", "kind", "node", "path", "value"], "executable_identity_repository_selector");
  if (identity.selectedTool.repositorySelector.kind !== "RUST_TOOLCHAIN_TOML") fail("executable_identity_repository_selector_kind");
  string(identity.selectedTool.repositorySelector.value, "executable_identity_repository_selector_value", 256);
  absolute(identity.selectedTool.repositorySelector.path, "executable_identity_repository_selector_path");
  validateNode(identity.selectedTool.repositorySelector.node, "REGULAR_FILE", identity.ownerUid, "executable_identity_repository_selector_node");
  sha256(identity.selectedTool.repositorySelector.contentSha256, "executable_identity_repository_selector_digest");
  exactKeys(identity.selectedTool.exactToolchainEnvironment, ["includedInOperationPreview", "name", "value"], "executable_identity_toolchain_environment");
  if (
    identity.selectedTool.exactToolchainEnvironment.name !== "RUSTUP_TOOLCHAIN" ||
    identity.selectedTool.exactToolchainEnvironment.value !== identity.selectedTool.toolchainName ||
    identity.selectedTool.exactToolchainEnvironment.includedInOperationPreview !== false
  ) fail("executable_identity_toolchain_environment");
  validateRevision(identity.selectedTool.cargoRevision, "executable_identity_cargo_revision");
  validateRevision(identity.selectedTool.rustcRevision, "executable_identity_rustc_revision");
  validateFileIdentity(identity.selectedTool.selectedCargoExecutable, identity.ownerUid, "executable_identity_selected_cargo", { executable: true });
  const expectedToolchainRoot = `${RUSTUP_HOME}/toolchains/${identity.selectedTool.toolchainName}`;
  if (
    identity.selectedTool.selectedCargoExecutable.path !== `${expectedToolchainRoot}/bin/cargo` ||
    !identity.selectedTool.selectedCargoExecutable.path.startsWith(`${RUSTUP_HOME}/toolchains/`)
  ) {
    fail("executable_identity_selected_cargo_toolchain_drift");
  }
  sha256(identity.selectedTool.toolchainManifestDigest, "executable_identity_toolchain_manifest");
  sha256(identity.selectedTool.revisionProbeDigest, "executable_identity_revision_probe");

  validateFileIdentity(identity.manifestPathIdentity, identity.ownerUid, "executable_identity_manifest");
  validateDirectoryIdentity(identity.cwdIdentity, identity.ownerUid, "executable_identity_cwd");
  const requiredParents = new Set([
    ...ownedAncestorDirectories(identity.invocationPath),
    ...ownedAncestorDirectories(identity.resolvedPath),
    ...ownedAncestorDirectories(identity.selectedTool.selectedCargoExecutable.path),
    ...ownedAncestorDirectories(identity.selectedTool.repositorySelector.path),
    ...ownedAncestorDirectories(identity.manifestPathIdentity.path),
    ...ownedAncestorDirectories(identity.cwdIdentity.path, { directory: true })
  ]);
  for (const requiredParent of requiredParents) {
    if (!parents.has(requiredParent)) fail("executable_identity_parent_missing");
  }
  sha256(identity.operationParametersDigest, "executable_identity_operation_parameters");
  sha256(identity.environmentDigest, "executable_identity_environment");
  sha256(identity.identityDigest, "executable_identity_digest");
  if (identity.identityDigest !== computeExecutableIdentityDigest(identity)) fail("executable_identity_digest_mismatch");
  if (identity.status !== "VERIFIED_MATCH") fail("executable_identity_status");

  if (options.plan) {
    const plan = validateResourceCleanupPlan(options.plan);
    if (
      identity.invocationPath !== plan.operationPreview.executablePath ||
      identity.invocationArgv0 !== path.basename(plan.operationPreview.executablePath) ||
      identity.manifestPathIdentity.path !== `${plan.repositoryPath}/Cargo.toml` ||
      identity.selectedTool.repositorySelector.path !== `${plan.repositoryPath}/rust-toolchain.toml` ||
      identity.cwdIdentity.path !== plan.repositoryPath ||
      identity.operationParametersDigest !== computeResourceCleanupOperationParametersDigest(plan.operationPreview) ||
      identity.environmentDigest !== computeResourceCleanupEnvironmentDigest(plan.operationPreview.environment)
    ) fail("executable_identity_plan_drift");
  }
  const now = options.now instanceof Date ? options.now.getTime() : Date.now();
  if (!Number.isFinite(now) || observedAt > now) fail("executable_identity_from_future");
  if (options.notBefore && observedAt < Date.parse(options.notBefore)) fail("executable_identity_before_grant");
  if (options.maxAgeSeconds !== undefined && now - observedAt > options.maxAgeSeconds * 1000) fail("executable_identity_stale");
  return identity;
}

export function computeResourceCleanupActionTimeEvidenceDigest(evidence) {
  const { evidenceDigest: _evidenceDigest, ...payload } = evidence;
  return digest("sirinx-resource-cleanup-action-time-evidence-v1", payload);
}

function validateGrantBinding(binding, grant) {
  exactKeys(binding, [
    "actionDigest", "expiresAt", "issuedAt", "nonceDigest", "planHash",
    "proposalManifestDigest", "proposalProcessEvidenceDigest", "scopeHash"
  ], "cleanup_evidence_grant_binding");
  for (const key of ["planHash", "scopeHash", "actionDigest", "nonceDigest", "proposalManifestDigest", "proposalProcessEvidenceDigest"]) {
    sha256(binding[key], `cleanup_evidence_grant_${key}`);
  }
  if (
    binding.planHash !== grant.hashes.planHash || binding.scopeHash !== grant.hashes.scopeHash ||
    binding.actionDigest !== grant.hashes.actionDigest || binding.nonceDigest !== grant.approval.nonceDigest ||
    binding.proposalManifestDigest !== grant.targetManifest.manifestDigest ||
    binding.proposalProcessEvidenceDigest !== grant.hashes.processEvidenceDigest ||
    binding.issuedAt !== grant.issuedAt || binding.expiresAt !== grant.expiresAt
  ) fail("cleanup_evidence_grant_binding_drift");
}

export function validateResourceCleanupActionTimeEvidenceV1(evidence, plan, grant, options = {}) {
  validateResourceCleanupPlan(plan);
  validateResourceCleanupGrant(grant, plan, { now: options.now });
  exactKeys(evidence, EVIDENCE_KEYS, "cleanup_action_time_evidence");
  if (evidence.schemaVersion !== "1.0-plan" || evidence.status !== "STRUCTURALLY_VERIFIED_ONLY") fail("cleanup_evidence_version_status");
  identifier(evidence.evidenceId, IDENTIFIERS.evidence, "cleanup_evidence_id");
  for (const [key, pattern] of [["ticketId", IDENTIFIERS.ticket], ["grantId", IDENTIFIERS.grant], ["taskId", IDENTIFIERS.task], ["runId", IDENTIFIERS.run]]) {
    identifier(evidence[key], pattern, `cleanup_evidence_${key}`);
  }
  if (
    evidence.ticketId !== grant.ticketId || evidence.grantId !== grant.grantId || evidence.taskId !== grant.taskId ||
    evidence.action !== "RESOURCE_CLEANUP" || evidence.circuit !== "resource_cleanup"
  ) fail("cleanup_evidence_identity_drift");
  const collectedAt = instant(evidence.collectedAt, "cleanup_evidence_collected_at");
  const now = options.now instanceof Date ? options.now.getTime() : Date.now();
  if (!Number.isFinite(now) || collectedAt > now) fail("cleanup_evidence_from_future");
  if (collectedAt < Date.parse(grant.issuedAt)) fail("cleanup_evidence_before_grant");
  if (collectedAt >= Date.parse(grant.expiresAt)) fail("cleanup_evidence_after_expiry");
  if (now - collectedAt > grant.limits.maxEvidenceAgeSeconds * 1000) fail("cleanup_evidence_stale");
  validateGrantBinding(evidence.grantBinding, grant);

  exactKeys(evidence.repository, [
    "baselineWorktreeSnapshotDigest", "branch", "commitSha", "currentWorktreeSnapshotDigest",
    "path", "worktreeSnapshotVersion"
  ], "cleanup_evidence_repository");
  if (
    evidence.repository.path !== grant.repository.path || evidence.repository.branch !== grant.repository.branch ||
    evidence.repository.commitSha !== grant.repository.commitSha ||
    evidence.repository.worktreeSnapshotVersion !== grant.repository.worktreeSnapshotVersion ||
    evidence.repository.baselineWorktreeSnapshotDigest !== grant.repository.worktreeSnapshotDigest ||
    evidence.repository.currentWorktreeSnapshotDigest !== grant.repository.worktreeSnapshotDigest
  ) fail("cleanup_evidence_worktree_drift");

  validateTargetManifestV1(evidence.targetManifest);
  if (
    evidence.targetManifest.targetPath !== grant.target.absolutePath ||
    evidence.targetManifest.targetDeviceId !== grant.target.deviceId || evidence.targetManifest.targetInode !== grant.target.inode ||
    evidence.targetManifest.entriesDigest !== grant.targetManifest.entriesDigest ||
    evidence.targetManifest.entryCount !== grant.targetManifest.entryCount ||
    evidence.targetManifest.totalSizeBytes !== grant.targetManifest.totalSizeBytes
  ) fail("cleanup_evidence_target_manifest_drift");
  const manifestAt = instant(evidence.targetManifest.generatedAt, "cleanup_evidence_manifest_at");
  if (manifestAt < Date.parse(grant.issuedAt) || manifestAt > collectedAt) fail("cleanup_evidence_manifest_not_action_time");

  validateProcessEvidenceV1(evidence.processEvidence);
  if (evidence.processEvidence.targetPath !== grant.target.absolutePath || evidence.processEvidence.activeConsumers !== 0) {
    fail("cleanup_evidence_process_consumer");
  }
  const processAt = instant(evidence.processEvidence.capturedAt, "cleanup_evidence_process_at");
  if (processAt < Date.parse(grant.issuedAt) || processAt > collectedAt) fail("cleanup_evidence_process_not_action_time");

  validateExecutableIdentityV1(evidence.executableIdentity, {
    plan, now: new Date(collectedAt), notBefore: grant.issuedAt, maxAgeSeconds: grant.limits.maxEvidenceAgeSeconds
  });

  exactKeys(evidence.executor, ["available", "binaryIdentityDigest", "capabilities", "hostAttestationDigest", "networkDenied", "principalId"], "cleanup_evidence_executor");
  string(evidence.executor.principalId, "cleanup_evidence_executor_principal", 256);
  sha256(evidence.executor.binaryIdentityDigest, "cleanup_evidence_executor_binary");
  sha256(evidence.executor.hostAttestationDigest, "cleanup_evidence_executor_host");
  if (!same(evidence.executor.capabilities, ["RESOURCE_CLEANUP"]) || evidence.executor.networkDenied !== true || evidence.executor.available !== false) {
    fail("cleanup_evidence_executor_must_be_unavailable");
  }
  if (evidence.executor.principalId !== grant.principals.executor) fail("cleanup_evidence_executor_principal_drift");

  exactKeys(evidence.lease, [
    "executorPrincipalId", "expiresAt", "grantId", "leaseId", "nonceDigest", "path",
    "resource", "runId", "state", "taskId"
  ], "cleanup_evidence_lease");
  identifier(evidence.lease.leaseId, IDENTIFIERS.lease, "cleanup_evidence_lease_id");
  sha256(evidence.lease.nonceDigest, "cleanup_evidence_lease_nonce");
  if (
    evidence.lease.taskId !== evidence.taskId || evidence.lease.runId !== evidence.runId ||
    evidence.lease.grantId !== evidence.grantId || evidence.lease.executorPrincipalId !== evidence.executor.principalId ||
    evidence.lease.state !== "ACTIVE" || evidence.lease.path !== grant.target.absolutePath ||
    evidence.lease.resource !== `resource_cleanup:${grant.target.absolutePath}` ||
    evidence.lease.nonceDigest === grant.approval.nonceDigest
  ) fail("cleanup_evidence_lease_drift");
  const leaseExpiry = instant(evidence.lease.expiresAt, "cleanup_evidence_lease_expiry");
  if (leaseExpiry <= collectedAt || leaseExpiry > Date.parse(grant.expiresAt)) fail("cleanup_evidence_lease_expiry");

  exactKeys(evidence.circuitSnapshot, ["backend", "circuit", "durable", "observedAt", "snapshotDigest", "state", "version"], "cleanup_evidence_circuit");
  if (
    evidence.circuitSnapshot.circuit !== "resource_cleanup" ||
    !new Set(["HOLD", "OPEN"]).has(evidence.circuitSnapshot.state) ||
    evidence.circuitSnapshot.backend !== "POSTGRES" || evidence.circuitSnapshot.durable !== true
  ) fail("cleanup_evidence_circuit_shape");
  integer(evidence.circuitSnapshot.version, "cleanup_evidence_circuit_version", 1);
  sha256(evidence.circuitSnapshot.snapshotDigest, "cleanup_evidence_circuit_digest");
  const circuitAt = instant(evidence.circuitSnapshot.observedAt, "cleanup_evidence_circuit_at");
  if (circuitAt < Date.parse(grant.issuedAt) || circuitAt > collectedAt) fail("cleanup_evidence_circuit_order");

  exactKeys(evidence.replaySnapshot, [
    "authoritative", "consumedAt", "expectedVersion", "grantState", "nonceState",
    "observedAt", "snapshotDigest", "status"
  ], "cleanup_evidence_replay");
  if (
    evidence.replaySnapshot.grantState !== "ACTIVE" || evidence.replaySnapshot.nonceState !== "UNUSED" ||
    evidence.replaySnapshot.consumedAt !== null || evidence.replaySnapshot.authoritative !== false ||
    evidence.replaySnapshot.status !== "STRUCTURAL_ONLY_NO_REPLAY_AUTHORITY"
  ) fail("cleanup_evidence_replay_not_structural_only");
  integer(evidence.replaySnapshot.expectedVersion, "cleanup_evidence_replay_version", 1);
  sha256(evidence.replaySnapshot.snapshotDigest, "cleanup_evidence_replay_digest");
  const replayAt = instant(evidence.replaySnapshot.observedAt, "cleanup_evidence_replay_at");
  if (replayAt < Date.parse(grant.issuedAt) || replayAt > collectedAt) fail("cleanup_evidence_replay_order");

  exactKeys(evidence.operation, ["environmentDigest", "exactToolchainEnvironment", "parametersDigest"], "cleanup_evidence_operation");
  sha256(evidence.operation.parametersDigest, "cleanup_evidence_operation_parameters");
  sha256(evidence.operation.environmentDigest, "cleanup_evidence_operation_environment");
  exactKeys(evidence.operation.exactToolchainEnvironment, ["includedInPlanDigest", "name", "value"], "cleanup_evidence_operation_toolchain");
  if (
    evidence.operation.parametersDigest !== grant.operation.parametersDigest ||
    evidence.operation.parametersDigest !== evidence.executableIdentity.operationParametersDigest ||
    evidence.operation.environmentDigest !== evidence.executableIdentity.environmentDigest ||
    evidence.operation.exactToolchainEnvironment.name !== "RUSTUP_TOOLCHAIN" ||
    evidence.operation.exactToolchainEnvironment.value !== evidence.executableIdentity.selectedTool.toolchainName ||
    evidence.operation.exactToolchainEnvironment.includedInPlanDigest !== false
  ) fail("cleanup_evidence_operation_drift");

  exactKeys(evidence.resources, [
    "currentFreeKiB", "filesystemDeviceId", "projectedMinimumFreeKiB", "targetAllocatedKiB",
    "worstCaseCleanupGrowthKiB"
  ], "cleanup_evidence_resources");
  for (const key of Object.keys(evidence.resources)) integer(evidence.resources[key], `cleanup_evidence_resource_${key}`);
  if (
    evidence.resources.filesystemDeviceId !== grant.target.deviceId ||
    evidence.resources.targetAllocatedKiB > grant.limits.maxAffectedKiB ||
    grant.limits.minReclaimKiB > evidence.resources.targetAllocatedKiB ||
    evidence.resources.worstCaseCleanupGrowthKiB !== grant.limits.worstCaseCleanupGrowthKiB ||
    evidence.resources.projectedMinimumFreeKiB !==
      evidence.resources.currentFreeKiB - evidence.resources.worstCaseCleanupGrowthKiB + grant.limits.minReclaimKiB ||
    evidence.resources.currentFreeKiB < grant.limits.emergencyFloorKiB + grant.limits.worstCaseCleanupGrowthKiB ||
    evidence.resources.projectedMinimumFreeKiB < grant.limits.requiredPostFreeKiB
  ) fail("cleanup_evidence_resource_admission");

  exactKeys(evidence.recovery, ["checkerReceiptId", "installRequired", "networkRequired", "procedureDigest", "sourceDigest", "verifiedAt"], "cleanup_evidence_recovery");
  sha256(evidence.recovery.sourceDigest, "cleanup_evidence_recovery_source");
  sha256(evidence.recovery.procedureDigest, "cleanup_evidence_recovery_procedure");
  identifier(evidence.recovery.checkerReceiptId, IDENTIFIERS.receipt, "cleanup_evidence_recovery_receipt");
  if (evidence.recovery.networkRequired !== false || evidence.recovery.installRequired !== false) fail("cleanup_evidence_recovery_external_authority");
  const recoveryAt = instant(evidence.recovery.verifiedAt, "cleanup_evidence_recovery_at");
  if (recoveryAt < Date.parse(grant.issuedAt) || recoveryAt > collectedAt) {
    fail("cleanup_evidence_recovery_time_order");
  }
  if (
    evidence.recovery.sourceDigest !== computeResourceCleanupRecoveryReferenceDigest("source", grant.recovery.sourceRef) ||
    evidence.recovery.procedureDigest !== computeResourceCleanupRecoveryReferenceDigest("procedure", grant.recovery.procedureRef)
  ) fail("cleanup_evidence_recovery_binding_drift");

  sha256(evidence.evidenceDigest, "cleanup_evidence_digest");
  if (evidence.evidenceDigest !== computeResourceCleanupActionTimeEvidenceDigest(evidence)) fail("cleanup_evidence_digest_mismatch");
  return evidence;
}

export function computeResourceCleanupEffectAttemptDigest(attempt) {
  const { attemptDigest: _attemptDigest, ...payload } = attempt;
  return digest("sirinx-resource-cleanup-effect-attempt-v1", payload);
}

export function validateResourceCleanupEffectAttemptV1(attempt, grant, evidence) {
  exactKeys(attempt, ATTEMPT_KEYS, "cleanup_effect_attempt");
  if (attempt.schemaVersion !== "1.0-plan" || attempt.status !== "PLAN_ONLY_NO_DISPATCH") fail("cleanup_effect_attempt_version_status");
  identifier(attempt.attemptId, IDENTIFIERS.attempt, "cleanup_effect_attempt_id");
  if (attempt.effectKey !== `resource_cleanup:${grant.grantId}`) fail("cleanup_effect_attempt_key");
  if (
    attempt.ticketId !== grant.ticketId || attempt.grantId !== grant.grantId || attempt.taskId !== grant.taskId ||
    attempt.runId !== evidence.runId || attempt.action !== "RESOURCE_CLEANUP" || attempt.circuit !== "resource_cleanup" ||
    attempt.actionDigest !== grant.hashes.actionDigest || attempt.admissionDigest !== evidence.evidenceDigest ||
    attempt.executorPrincipalId !== grant.principals.executor
  ) fail("cleanup_effect_attempt_binding");
  if (
    attempt.state !== "PREPARED" || attempt.expectedVersion !== 1 || attempt.requestingAt !== null ||
    attempt.startedAt !== null || attempt.processIdentity !== null || attempt.finishedAt !== null ||
    attempt.exit !== null || attempt.postReceiptId !== null || attempt.retryCount !== 0 ||
    attempt.automaticRetry !== false
  ) fail("cleanup_effect_attempt_must_be_prepared_only");
  instant(attempt.createdAt, "cleanup_effect_attempt_created_at");
  sha256(attempt.attemptDigest, "cleanup_effect_attempt_digest");
  if (attempt.attemptDigest !== computeResourceCleanupEffectAttemptDigest(attempt)) fail("cleanup_effect_attempt_digest_mismatch");
  return attempt;
}

export function getCleanupEffectTransitionDecision(from, to) {
  if (!EFFECT_STATES.has(from) || !EFFECT_STATES.has(to)) fail("cleanup_effect_transition_state");
  const protocolAllowed = EFFECT_TRANSITIONS[from].has(to);
  const effectBoundary = new Set(["REQUESTING", "RUNNING", "VERIFYING", "CONFIRMED", "FAILED", "EFFECT_UNKNOWN"]).has(to);
  return Object.freeze({
    from,
    to,
    protocolAllowed,
    availableInThisSlice: protocolAllowed && !effectBoundary,
    requiresDurableRequesting: to === "REQUESTING",
    automaticRetry: false
  });
}

export function validateCleanupEffectTransition(from, to) {
  const decision = getCleanupEffectTransitionDecision(from, to);
  if (!decision.protocolAllowed) fail("cleanup_effect_transition_skipped_or_terminal");
  if (!decision.availableInThisSlice) fail("cleanup_effect_transition_runtime_unavailable");
  return decision;
}

export function classifyCleanupEffectInterruption(state) {
  if (!EFFECT_STATES.has(state)) fail("cleanup_effect_interruption_state");
  if (state === "PREPARED") return "CANCELED";
  if (new Set(["REQUESTING", "RUNNING", "VERIFYING"]).has(state)) return "EFFECT_UNKNOWN";
  return state;
}

export function computeResourceCleanupPostActionReceiptDigest(receipt) {
  const { receiptDigest: _receiptDigest, ...payload } = receipt;
  return digest("sirinx-resource-cleanup-post-action-receipt-v1", payload);
}

function validateCheckerReceiptContext(checkerReceipt, receipt) {
  exactKeys(checkerReceipt, [
    "actionDigest", "artifactDigests", "principalId", "receiptId", "result", "taskId"
  ], "cleanup_post_receipt_checker_context");
  identifier(checkerReceipt.receiptId, IDENTIFIERS.receipt, "cleanup_post_receipt_checker_context_id");
  identifier(checkerReceipt.taskId, IDENTIFIERS.task, "cleanup_post_receipt_checker_context_task");
  string(checkerReceipt.principalId, "cleanup_post_receipt_checker_context_principal", 256);
  sha256(checkerReceipt.actionDigest, "cleanup_post_receipt_checker_context_action");
  if (!Array.isArray(checkerReceipt.artifactDigests) || checkerReceipt.artifactDigests.length === 0) {
    fail("cleanup_post_receipt_checker_context_artifacts");
  }
  for (const artifactDigest of checkerReceipt.artifactDigests) {
    sha256(artifactDigest, "cleanup_post_receipt_checker_context_artifact");
  }
  if (
    checkerReceipt.result !== "PASS" ||
    checkerReceipt.receiptId !== receipt.verification.verificationReceiptId ||
    checkerReceipt.receiptId === receipt.receiptId ||
    checkerReceipt.taskId !== receipt.taskId ||
    checkerReceipt.principalId !== receipt.verification.checkerPrincipalId ||
    checkerReceipt.actionDigest !== receipt.bindings.actionDigest ||
    !checkerReceipt.artifactDigests.includes(receipt.verification.evidenceDigest)
  ) fail("cleanup_post_receipt_checker_context_drift");
}

function validateReceiptEffect(effect) {
  exactKeys(effect, [
    "endedAt", "environmentDigest", "exitCode", "interruptionObserved", "operationParametersDigest",
    "outputTruncated", "pid", "processStartTime", "signal", "startedAt", "stderrBytes",
    "stderrDigest", "stdoutBytes", "stdoutDigest", "timedOut"
  ], "cleanup_receipt_effect");
  for (const key of ["operationParametersDigest", "environmentDigest", "stdoutDigest", "stderrDigest"]) sha256(effect[key], `cleanup_receipt_effect_${key}`);
  for (const key of ["stdoutBytes", "stderrBytes"]) integer(effect[key], `cleanup_receipt_effect_${key}`, 0, 1_048_576);
  for (const key of ["outputTruncated", "timedOut", "interruptionObserved"]) {
    if (typeof effect[key] !== "boolean") fail(`cleanup_receipt_effect_${key}_invalid`);
  }
  let startedAt = null;
  let endedAt = null;
  if (effect.startedAt === null || effect.endedAt === null) {
    if (effect.startedAt !== null || effect.endedAt !== null) fail("cleanup_receipt_effect_partial_times");
  } else {
    startedAt = instant(effect.startedAt, "cleanup_receipt_effect_started");
    endedAt = instant(effect.endedAt, "cleanup_receipt_effect_ended");
    if (endedAt < startedAt) fail("cleanup_receipt_effect_time_order");
  }
  if (effect.pid !== null) integer(effect.pid, "cleanup_receipt_effect_pid", 1);
  if ((effect.pid === null) !== (effect.processStartTime === null)) fail("cleanup_receipt_effect_process_identity_partial");
  if (effect.processStartTime !== null) {
    const processStart = instant(effect.processStartTime, "cleanup_receipt_effect_process_start");
    if (startedAt === null || endedAt === null || processStart < startedAt || processStart > endedAt) {
      fail("cleanup_receipt_effect_process_time_order");
    }
  }
  if (effect.exitCode !== null) integer(effect.exitCode, "cleanup_receipt_effect_exit", 0, 255);
  if (effect.signal !== null) string(effect.signal, "cleanup_receipt_effect_signal", 64);
}

export function validateResourceCleanupPostActionReceiptV1(receipt, options = {}) {
  exactKeys(receipt, RECEIPT_KEYS, "cleanup_post_receipt");
  if (
    receipt.schemaVersion !== "1.0" || receipt.status !== "STRUCTURAL_ONLY_NO_AUTHORITY" ||
    receipt.action !== "RESOURCE_CLEANUP" || receipt.circuit !== "resource_cleanup"
  ) {
    fail("cleanup_post_receipt_version_action");
  }
  for (const [key, pattern] of [
    ["receiptId", IDENTIFIERS.receipt], ["artifactId", IDENTIFIERS.artifact], ["attemptId", IDENTIFIERS.attempt],
    ["ticketId", IDENTIFIERS.ticket], ["grantId", IDENTIFIERS.grant], ["taskId", IDENTIFIERS.task], ["runId", IDENTIFIERS.run]
  ]) identifier(receipt[key], pattern, `cleanup_post_receipt_${key}`);
  if (receipt.effectKey !== `resource_cleanup:${receipt.grantId}`) fail("cleanup_post_receipt_effect_key");
  const verdictStates = Object.freeze({ PASS: "CONFIRMED", FAIL: "FAILED", BLOCKED: "BLOCKED", CANCELED: "CANCELED", EFFECT_UNKNOWN: "EFFECT_UNKNOWN" });
  if (verdictStates[receipt.verdict] !== receipt.effectState) fail("cleanup_post_receipt_verdict_state");

  exactKeys(receipt.bindings, [
    "actionDigest", "admissionDigest", "beforeManifestDigest", "beforeProcessDigest",
    "beforeWorktreeDigest", "executableIdentityDigest", "nonceDigest", "planHash", "scopeHash"
  ], "cleanup_post_receipt_bindings");
  for (const [key, value] of Object.entries(receipt.bindings)) sha256(value, `cleanup_post_receipt_binding_${key}`);
  validateReceiptEffect(receipt.effect);

  exactKeys(receipt.after, [
    "actualAffectedKiB", "actualReclaimedKiB", "currentFreeKiB", "excludedPathsUnchanged",
    "exclusionsDigest", "filesystemDeviceId", "impactBounded", "minReclaimSatisfied", "observedAt",
    "processEvidenceComplete", "processEvidenceDigest", "targetAllocatedKiB", "targetDeviceId",
    "targetExists", "targetInode", "targetManifestDigest", "targetPath", "thresholdSatisfied",
    "worktreeSnapshotDigest", "worktreeUnchanged"
  ], "cleanup_post_receipt_after");
  const afterObservedAt = instant(receipt.after.observedAt, "cleanup_post_receipt_after_observed");
  if (receipt.after.targetPath !== "/Users/sirinx/SIRINXDev/sirinx-co/target") fail("cleanup_post_receipt_target_path");
  for (const key of ["filesystemDeviceId", "targetAllocatedKiB", "currentFreeKiB", "actualAffectedKiB", "actualReclaimedKiB"]) integer(receipt.after[key], `cleanup_post_receipt_after_${key}`);
  for (const key of ["processEvidenceDigest", "worktreeSnapshotDigest", "exclusionsDigest"]) sha256(receipt.after[key], `cleanup_post_receipt_after_${key}`);
  for (const key of ["excludedPathsUnchanged", "worktreeUnchanged", "processEvidenceComplete", "thresholdSatisfied", "minReclaimSatisfied", "impactBounded", "targetExists"]) {
    if (typeof receipt.after[key] !== "boolean") fail(`cleanup_post_receipt_after_${key}_invalid`);
  }
  if (receipt.after.targetExists) {
    integer(receipt.after.targetDeviceId, "cleanup_post_receipt_target_device");
    integer(receipt.after.targetInode, "cleanup_post_receipt_target_inode", 1);
    sha256(receipt.after.targetManifestDigest, "cleanup_post_receipt_target_manifest");
  } else if (receipt.after.targetDeviceId !== null || receipt.after.targetInode !== null || receipt.after.targetManifestDigest !== null) {
    fail("cleanup_post_receipt_absent_target_identity");
  }
  if (receipt.after.actualReclaimedKiB > receipt.after.actualAffectedKiB) fail("cleanup_post_receipt_reclaim_overclaim");

  exactKeys(receipt.verification, ["checkerPrincipalId", "evidenceDigest", "makerPrincipalId", "principalsDistinct", "verificationReceiptId"], "cleanup_post_receipt_verification");
  string(receipt.verification.makerPrincipalId, "cleanup_post_receipt_maker", 256);
  string(receipt.verification.checkerPrincipalId, "cleanup_post_receipt_checker", 256);
  identifier(receipt.verification.verificationReceiptId, IDENTIFIERS.receipt, "cleanup_post_receipt_verification_receipt");
  sha256(receipt.verification.evidenceDigest, "cleanup_post_receipt_verification_evidence");
  if (
    receipt.verification.principalsDistinct !== true ||
    receipt.verification.makerPrincipalId === receipt.verification.checkerPrincipalId ||
    receipt.verification.verificationReceiptId === receipt.receiptId
  ) fail("cleanup_post_receipt_verification_separation");
  const createdAt = instant(receipt.createdAt, "cleanup_post_receipt_created_at");
  if (createdAt < afterObservedAt) fail("cleanup_post_receipt_created_before_readback");
  if (receipt.effect.endedAt !== null && afterObservedAt < Date.parse(receipt.effect.endedAt)) {
    fail("cleanup_post_receipt_readback_before_effect_end");
  }

  if (receipt.verdict === "PASS") {
    if (
      !options.plan || !options.grant || !options.evidence || !options.attempt ||
      !options.postProcessEvidence || !options.checkerReceipt ||
      (receipt.after.targetExists && !options.postTargetManifest)
    ) {
      fail("cleanup_post_receipt_pass_requires_bound_context");
    }
    const pass = receipt.effectState === "CONFIRMED" && receipt.effect.startedAt !== null && receipt.effect.endedAt !== null &&
      receipt.effect.pid !== null && receipt.effect.exitCode === 0 && receipt.effect.signal === null &&
      receipt.effect.timedOut === false && receipt.effect.interruptionObserved === false &&
      receipt.effect.outputTruncated === false &&
      receipt.after.processEvidenceComplete === true && receipt.after.worktreeUnchanged === true &&
      receipt.after.excludedPathsUnchanged === true && receipt.after.impactBounded === true &&
      receipt.after.thresholdSatisfied === true && receipt.after.minReclaimSatisfied === true;
    if (!pass) fail("cleanup_post_receipt_false_pass");
  }
  if (receipt.effectState === "EFFECT_UNKNOWN" && receipt.verdict !== "EFFECT_UNKNOWN") fail("cleanup_post_receipt_unknown_mismatch");

  if (options.grant) {
    const grant = options.grant;
    if (
      receipt.ticketId !== grant.ticketId || receipt.grantId !== grant.grantId || receipt.taskId !== grant.taskId ||
      receipt.bindings.planHash !== grant.hashes.planHash || receipt.bindings.scopeHash !== grant.hashes.scopeHash ||
      receipt.bindings.actionDigest !== grant.hashes.actionDigest || receipt.bindings.nonceDigest !== grant.approval.nonceDigest ||
      receipt.after.filesystemDeviceId !== grant.target.deviceId ||
      receipt.after.exclusionsDigest !== computeResourceCleanupExclusionsDigest(grant.exclusions) ||
      receipt.after.actualAffectedKiB > grant.limits.maxAffectedKiB ||
      (receipt.after.currentFreeKiB < grant.limits.requiredPostFreeKiB && receipt.verdict === "PASS") ||
      (receipt.after.actualReclaimedKiB < grant.limits.minReclaimKiB && receipt.verdict === "PASS")
    ) fail("cleanup_post_receipt_grant_drift");
    if (
      receipt.verification.makerPrincipalId !== grant.principals.maker ||
      receipt.verification.checkerPrincipalId !== grant.principals.checker
    ) fail("cleanup_post_receipt_principal_drift");
  }
  if (options.evidence) {
    const expectedAffected = Math.max(
      0,
      options.evidence.resources.targetAllocatedKiB - receipt.after.targetAllocatedKiB
    );
    const measuredFreeDelta = Math.max(
      0,
      receipt.after.currentFreeKiB - options.evidence.resources.currentFreeKiB
    );
    if (
      receipt.runId !== options.evidence.runId || receipt.bindings.admissionDigest !== options.evidence.evidenceDigest ||
      receipt.bindings.executableIdentityDigest !== options.evidence.executableIdentity.identityDigest ||
      receipt.bindings.beforeManifestDigest !== options.evidence.targetManifest.manifestDigest ||
      receipt.bindings.beforeProcessDigest !== options.evidence.processEvidence.snapshotDigest ||
      receipt.bindings.beforeWorktreeDigest !== options.evidence.repository.currentWorktreeSnapshotDigest ||
      receipt.effect.operationParametersDigest !== options.evidence.operation.parametersDigest ||
      receipt.effect.environmentDigest !== options.evidence.operation.environmentDigest ||
      receipt.after.worktreeSnapshotDigest !== options.evidence.repository.currentWorktreeSnapshotDigest ||
      receipt.after.actualAffectedKiB !== expectedAffected ||
      receipt.after.actualReclaimedKiB !== measuredFreeDelta
    ) fail("cleanup_post_receipt_evidence_drift");
    if (
      receipt.verdict === "PASS" && (
        receipt.after.impactBounded !== (expectedAffected <= (options.grant?.limits.maxAffectedKiB ?? Number.MAX_SAFE_INTEGER)) ||
        receipt.after.minReclaimSatisfied !== (measuredFreeDelta >= (options.grant?.limits.minReclaimKiB ?? Number.MAX_SAFE_INTEGER)) ||
        receipt.after.thresholdSatisfied !== (receipt.after.currentFreeKiB >= (options.grant?.limits.requiredPostFreeKiB ?? Number.MAX_SAFE_INTEGER))
      )
    ) fail("cleanup_post_receipt_evidence_drift");
    if (
      receipt.after.targetExists &&
      (receipt.after.targetDeviceId !== options.evidence.targetManifest.targetDeviceId ||
        receipt.after.targetInode !== options.evidence.targetManifest.targetInode)
    ) fail("cleanup_post_receipt_target_identity_drift");
  }
  if (options.plan && options.grant && options.evidence) {
    const structuralTime = new Date(options.evidence.collectedAt);
    validateResourceCleanupActionTimeEvidenceV1(
      options.evidence,
      options.plan,
      options.grant,
      { now: structuralTime }
    );
  }
  if (options.attempt) {
    if (receipt.attemptId !== options.attempt.attemptId) fail("cleanup_post_receipt_attempt_drift");
    if (options.grant && options.evidence) {
      validateResourceCleanupEffectAttemptV1(options.attempt, options.grant, options.evidence);
    }
  }
  if (options.postTargetManifest) {
    validateTargetManifestV1(options.postTargetManifest);
    const postManifestAt = Date.parse(options.postTargetManifest.generatedAt);
    if (
      !receipt.after.targetExists ||
      options.postTargetManifest.targetPath !== receipt.after.targetPath ||
      options.postTargetManifest.targetDeviceId !== receipt.after.targetDeviceId ||
      options.postTargetManifest.targetInode !== receipt.after.targetInode ||
      options.postTargetManifest.manifestDigest !== receipt.after.targetManifestDigest ||
      postManifestAt > afterObservedAt ||
      (receipt.effect.endedAt !== null && postManifestAt < Date.parse(receipt.effect.endedAt))
    ) fail("cleanup_post_receipt_target_manifest_drift");
  } else if (receipt.verdict === "PASS" && receipt.after.targetExists) {
    fail("cleanup_post_receipt_pass_requires_post_target_manifest");
  }
  if (options.postProcessEvidence) {
    validateProcessEvidenceV1(options.postProcessEvidence);
    const postCapturedAt = Date.parse(options.postProcessEvidence.capturedAt);
    if (
      options.postProcessEvidence.targetPath !== receipt.after.targetPath ||
      options.postProcessEvidence.snapshotDigest !== receipt.after.processEvidenceDigest ||
      options.postProcessEvidence.complete !== true ||
      options.postProcessEvidence.activeConsumers !== 0 ||
      postCapturedAt > afterObservedAt ||
      (receipt.effect.endedAt !== null && postCapturedAt < Date.parse(receipt.effect.endedAt))
    ) fail("cleanup_post_receipt_process_evidence_drift");
  } else if (receipt.verdict === "PASS") {
    fail("cleanup_post_receipt_pass_requires_post_process_evidence");
  }
  if (options.checkerReceipt) {
    validateCheckerReceiptContext(options.checkerReceipt, receipt);
  } else if (receipt.verdict === "PASS") {
    fail("cleanup_post_receipt_pass_requires_checker_receipt");
  }
  sha256(receipt.receiptDigest, "cleanup_post_receipt_digest");
  if (receipt.receiptDigest !== computeResourceCleanupPostActionReceiptDigest(receipt)) fail("cleanup_post_receipt_digest_mismatch");
  return receipt;
}

export function evaluateResourceCleanupExecutorAdmission({ plan, grant, actionTimeEvidence, effectAttempt, now } = {}) {
  const blockers = [];
  let planValidated = false;
  let grantStructureValidated = false;
  let actionTimeEvidenceValidated = false;
  let effectAttemptValidated = false;
  try {
    validateResourceCleanupPlan(plan);
    planValidated = true;
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : "cleanup_plan_invalid");
  }
  if (planValidated && grant) {
    try {
      validateResourceCleanupGrant(grant, plan, { now });
      grantStructureValidated = true;
    } catch (error) {
      blockers.push(error instanceof Error ? error.message : "cleanup_grant_invalid");
    }
  } else blockers.push("cleanup_grant_absent");
  if (grantStructureValidated && actionTimeEvidence) {
    try {
      validateResourceCleanupActionTimeEvidenceV1(actionTimeEvidence, plan, grant, { now });
      actionTimeEvidenceValidated = true;
    } catch (error) {
      blockers.push(error instanceof Error ? error.message : "cleanup_action_time_evidence_invalid");
    }
  } else blockers.push("cleanup_action_time_evidence_absent");
  if (actionTimeEvidenceValidated && effectAttempt) {
    try {
      validateResourceCleanupEffectAttemptV1(effectAttempt, grant, actionTimeEvidence);
      effectAttemptValidated = true;
    } catch (error) {
      blockers.push(error instanceof Error ? error.message : "cleanup_effect_attempt_invalid");
    }
  } else blockers.push("cleanup_effect_attempt_absent");

  if (actionTimeEvidenceValidated) {
    if (actionTimeEvidence.circuitSnapshot.state !== "OPEN") blockers.push("resource_cleanup_circuit_snapshot_hold");
    blockers.push("executable_identity_not_bound_in_grant");
    if (actionTimeEvidence.operation.exactToolchainEnvironment.includedInPlanDigest !== true) {
      blockers.push("exact_toolchain_selector_not_bound_in_plan");
    }
  }
  blockers.push(
    "cleanup_authority_unavailable",
    "resource_cleanup_circuit_hold",
    "cleanup_replay_protection_unavailable",
    "resource_cleanup_executor_unavailable",
    "cleanup_dispatch_disabled"
  );

  return Object.freeze({
    title: "SIRINX resource cleanup executor admission",
    schemaVersion: "1.0-plan",
    status: "HOLD",
    mode: "local-read-only-evidence-plane",
    action: "RESOURCE_CLEANUP",
    circuit: "resource_cleanup",
    effectState: "PREPARED",
    readOnly: true,
    mutations: false,
    commandExecuted: false,
    cleanupExecuted: false,
    networkCalls: false,
    externalWrites: false,
    executorAvailable: false,
    approvalConsumed: false,
    replayProtectionAvailable: false,
    authorityValidated: false,
    canDispatch: false,
    eligibleForExecutorHandoff: false,
    nextEffectState: null,
    automaticRetry: false,
    planValidated,
    grantStructureValidated,
    actionTimeEvidenceValidated,
    effectAttemptValidated,
    blockers: [...new Set(blockers)],
    stopPoint: "RESOURCE CLEANUP ADMISSION HOLD - NO REQUESTING TRANSITION OR EXECUTOR"
  });
}

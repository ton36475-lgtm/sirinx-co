#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

export const EVIDENCE_SCHEMA = "sirinx.release.evidence.v2";
export const RESULT_SCHEMA = "sirinx.release.packet-shape-result.v1";

const SHA_PATTERN = /^[0-9a-f]{40}$/;
const DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/;
const RFC3339_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,199}$/;
const SAFE_REF_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,199}$/;
const RUST_SERVICE_POLICIES = Object.freeze({
  "sirinx-web": "public",
  "sirinx-control": "private",
});
const REQUIRED_BROWSER_ASSERTIONS = Object.freeze([
  "b1-b2-completed",
  "held-gates",
  "no-console-errors",
  "no-interactive-controls",
  "no-production-writes",
  "owner-view",
]);
const MAX_EXTERNAL_RECEIPT_VALIDITY_MS = 24 * 60 * 60 * 1_000;
const MAX_ACTION_AUTHORIZATION_VALIDITY_MS = 60 * 60 * 1_000;
const PLACEHOLDER_IDENTIFIERS = new Set(["example", "pending", "placeholder", "prod", "production", "tbd", "todo", "unknown"]);

const GATES = [
  ["billing_unlock", validateBilling],
  ["exact_sha_ci", validateCi],
  ["disposable_postgres_migrations", validateMigrations],
  ["authenticated_browser_smoke", validateBrowserSmoke],
  ["independent_review", validateReview],
  ["merge_authorization", validateMergeAuthorization],
  ["rust_deploy_sirinx_web", (context) => validateRustDeployPacket(context, "sirinx-web")],
  ["rust_deploy_sirinx_control", (context) => validateRustDeployPacket(context, "sirinx-control")],
];

class GateError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

function requireCondition(condition, code) {
  if (!condition) throw new GateError(code);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireObject(value, code) {
  requireCondition(isObject(value), code);
  return value;
}

function requireClosedObject(value, allowedKeys, missingCode, unknownCode) {
  const object = requireObject(value, missingCode);
  requireCondition(Object.keys(object).every((key) => allowedKeys.includes(key)), unknownCode);
  return object;
}

function requireString(value, code, pattern = SAFE_ID_PATTERN) {
  requireCondition(typeof value === "string" && pattern.test(value), code);
  return value;
}

function requireConcreteIdentifier(value, code) {
  const identifier = requireString(value, code);
  requireCondition(!PLACEHOLDER_IDENTIFIERS.has(identifier.toLowerCase()), `${code}_PLACEHOLDER`);
  return identifier;
}

function requireSha(value, expectedSha, code) {
  requireCondition(typeof value === "string" && SHA_PATTERN.test(value), `${code}_FORMAT`);
  requireCondition(value === expectedSha, `${code}_MISMATCH`);
}

function parseTime(value, code) {
  requireCondition(typeof value === "string" && RFC3339_PATTERN.test(value), `${code}_INVALID`);
  const timestamp = Date.parse(value);
  requireCondition(Number.isFinite(timestamp), `${code}_INVALID`);
  return timestamp;
}

function requireObserved(value, nowMs, code) {
  const observedMs = parseTime(value, code);
  requireCondition(observedMs <= nowMs + 60_000, `${code}_IN_FUTURE`);
  return observedMs;
}

function requireUnexpired(value, nowMs, code) {
  const expiryMs = parseTime(value, code);
  requireCondition(expiryMs > nowMs, `${code}_EXPIRED`);
  return expiryMs;
}

function requireBoundedValidity(startMs, expiryMs, maxValidityMs, code) {
  requireCondition(expiryMs > startMs, `${code}_ORDER_INVALID`);
  requireCondition(expiryMs - startMs <= maxValidityMs, `${code}_TOO_BROAD`);
}

function requireHttpsUrl(value, code) {
  requireCondition(typeof value === "string", `${code}_MISSING`);
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new GateError(`${code}_INVALID`);
  }
  requireCondition(url.protocol === "https:", `${code}_NOT_HTTPS`);
  requireCondition(!["localhost", "127.0.0.1", "::1"].includes(url.hostname), `${code}_LOCALHOST`);
  requireCondition(url.username === "" && url.password === "", `${code}_HAS_CREDENTIALS`);
  requireCondition(url.search === "" && url.hash === "", `${code}_HAS_QUERY_OR_FRAGMENT`);
  return url.href;
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isObject(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}

function evidenceFingerprint(evidence) {
  return `sha256:${createHash("sha256").update(JSON.stringify(canonicalize(evidence))).digest("hex")}`;
}

export function computeReleaseSubjectFingerprint({ repository, pullRequest, headSha, packet }) {
  const subject = {
    schemaVersion: "sirinx.rust-release-subject.v1",
    repository,
    pullRequest,
    headSha,
    service: packet.service,
    artifactDigest: packet.artifactDigest,
    target: {
      environment: packet.target?.environment,
      targetId: packet.target?.targetId,
      provider: packet.target?.provider,
      exposure: packet.target?.exposure,
    },
    rollback: {
      runbookRef: packet.rollback?.runbookRef,
      receiptId: packet.rollback?.receiptId,
      verifiedAt: packet.rollback?.verifiedAt,
      artifactDigest: packet.rollback?.artifactDigest,
    },
  };
  return evidenceFingerprint(subject);
}

function validateBilling(context) {
  const gate = requireClosedObject(
    context.evidence.billing,
    ["status", "source", "acknowledgementId", "observedAt", "validUntil"],
    "BILLING_EVIDENCE_MISSING",
    "BILLING_EVIDENCE_UNKNOWN_FIELD",
  );
  requireCondition(gate.status === "UNLOCKED", "BILLING_NOT_UNLOCKED");
  requireCondition(gate.source === "GITHUB_BILLING", "BILLING_SOURCE_NOT_GITHUB");
  requireString(gate.acknowledgementId, "BILLING_ACKNOWLEDGEMENT_MISSING");
  const observedMs = requireObserved(gate.observedAt, context.nowMs, "BILLING_OBSERVED_AT");
  const expiryMs = requireUnexpired(gate.validUntil, context.nowMs, "BILLING_ACKNOWLEDGEMENT");
  requireBoundedValidity(observedMs, expiryMs, MAX_EXTERNAL_RECEIPT_VALIDITY_MS, "BILLING_VALIDITY");
}

function validateCi(context) {
  const gate = requireClosedObject(
    context.evidence.ci,
    ["status", "source", "headSha", "runId", "workflow", "completedAt"],
    "CI_EVIDENCE_MISSING",
    "CI_EVIDENCE_UNKNOWN_FIELD",
  );
  requireCondition(gate.status === "SUCCESS", "CI_NOT_SUCCESS");
  requireCondition(gate.source === "GITHUB_ACTIONS", "CI_SOURCE_NOT_GITHUB_ACTIONS");
  requireSha(gate.headSha, context.expectedSha, "CI_HEAD_SHA");
  requireString(gate.runId, "CI_RUN_ID_MISSING");
  requireString(gate.workflow, "CI_WORKFLOW_MISSING");
  requireObserved(gate.completedAt, context.nowMs, "CI_COMPLETED_AT");
}

function validateMigrations(context) {
  const gate = requireClosedObject(
    context.evidence.migrations,
    ["status", "headSha", "database", "disposable", "disposed", "receiptId", "completedAt", "versions"],
    "MIGRATION_EVIDENCE_MISSING",
    "MIGRATION_EVIDENCE_UNKNOWN_FIELD",
  );
  requireCondition(gate.status === "PASSED", "MIGRATIONS_NOT_PASSED");
  requireSha(gate.headSha, context.expectedSha, "MIGRATION_HEAD_SHA");
  requireCondition(gate.database === "postgres", "MIGRATION_DATABASE_NOT_POSTGRES");
  requireCondition(gate.disposable === true, "MIGRATION_DATABASE_NOT_DISPOSABLE");
  requireCondition(gate.disposed === true, "MIGRATION_DATABASE_NOT_DISPOSED");
  requireString(gate.receiptId, "MIGRATION_RECEIPT_MISSING");
  requireObserved(gate.completedAt, context.nowMs, "MIGRATION_COMPLETED_AT");
  requireCondition(Array.isArray(gate.versions), "MIGRATION_VERSIONS_MISSING");
  const versions = [...new Set(gate.versions)];
  requireCondition(versions.length === 2 && versions.includes("0003") && versions.includes("0004"), "MIGRATION_VERSIONS_INCOMPLETE");
}

function validateBrowserSmoke(context) {
  const gate = requireClosedObject(
    context.evidence.browserSmoke,
    ["status", "authenticated", "headSha", "targetUrl", "receiptId", "assertions", "completedAt", "validUntil"],
    "BROWSER_SMOKE_EVIDENCE_MISSING",
    "BROWSER_SMOKE_EVIDENCE_UNKNOWN_FIELD",
  );
  requireCondition(gate.status === "PASSED", "BROWSER_SMOKE_NOT_PASSED");
  requireCondition(gate.authenticated === true, "BROWSER_SMOKE_NOT_AUTHENTICATED");
  requireSha(gate.headSha, context.expectedSha, "BROWSER_SMOKE_HEAD_SHA");
  const targetUrl = requireHttpsUrl(gate.targetUrl, "BROWSER_SMOKE_TARGET_URL");
  requireCondition(targetUrl === context.expectedBrowserTarget, "BROWSER_SMOKE_TARGET_MISMATCH");
  requireString(gate.receiptId, "BROWSER_SMOKE_RECEIPT_MISSING");
  requireCondition(Array.isArray(gate.assertions) && gate.assertions.length > 0, "BROWSER_SMOKE_ASSERTIONS_MISSING");
  requireCondition(gate.assertions.every((item) => typeof item === "string" && SAFE_ID_PATTERN.test(item)), "BROWSER_SMOKE_ASSERTION_INVALID");
  const assertions = [...new Set(gate.assertions)].sort();
  requireCondition(
    assertions.length === REQUIRED_BROWSER_ASSERTIONS.length && assertions.every((assertion, index) => assertion === REQUIRED_BROWSER_ASSERTIONS[index]),
    "BROWSER_SMOKE_ASSERTION_SCOPE_MISMATCH",
  );
  const observedMs = requireObserved(gate.completedAt, context.nowMs, "BROWSER_SMOKE_COMPLETED_AT");
  const expiryMs = requireUnexpired(gate.validUntil, context.nowMs, "BROWSER_SMOKE_RECEIPT");
  requireBoundedValidity(observedMs, expiryMs, MAX_EXTERNAL_RECEIPT_VALIDITY_MS, "BROWSER_SMOKE_VALIDITY");
}

function validateReview(context) {
  const gate = requireClosedObject(
    context.evidence.review,
    ["decision", "headSha", "reviewerId", "authorId", "independent", "reviewId", "submittedAt"],
    "REVIEW_EVIDENCE_MISSING",
    "REVIEW_EVIDENCE_UNKNOWN_FIELD",
  );
  requireCondition(gate.decision === "APPROVED", "REVIEW_NOT_APPROVED");
  requireSha(gate.headSha, context.expectedSha, "REVIEW_HEAD_SHA");
  const reviewerId = requireString(gate.reviewerId, "REVIEWER_ID_MISSING");
  requireCondition(gate.authorId === context.authorId, "REVIEW_AUTHOR_MISMATCH");
  requireCondition(reviewerId.toLowerCase() !== context.authorId.toLowerCase(), "REVIEW_NOT_INDEPENDENT");
  requireCondition(gate.independent === true, "REVIEW_INDEPENDENCE_NOT_ATTESTED");
  requireString(gate.reviewId, "REVIEW_ID_MISSING");
  requireObserved(gate.submittedAt, context.nowMs, "REVIEW_SUBMITTED_AT");
}

function validateMergeAuthorization(context) {
  const gate = requireClosedObject(
    context.evidence.mergeAuthorization,
    ["decision", "scope", "headSha", "authorizationId", "ticketId", "approvedBy", "nonce", "consumed", "approvedAt", "expiresAt"],
    "MERGE_AUTHORIZATION_MISSING",
    "MERGE_AUTHORIZATION_UNKNOWN_FIELD",
  );
  requireCondition(gate.decision === "APPROVE", "MERGE_NOT_AUTHORIZED");
  requireCondition(gate.scope === "merge-pr", "MERGE_SCOPE_INVALID");
  requireSha(gate.headSha, context.expectedSha, "MERGE_HEAD_SHA");
  requireString(gate.authorizationId, "MERGE_AUTHORIZATION_ID_MISSING");
  requireString(gate.ticketId, "MERGE_TICKET_ID_MISSING");
  const approvedBy = requireString(gate.approvedBy, "MERGE_APPROVER_MISSING");
  requireCondition(approvedBy.toLowerCase() !== context.authorId.toLowerCase(), "MERGE_SELF_APPROVAL_FORBIDDEN");
  requireString(gate.nonce, "MERGE_NONCE_MISSING");
  requireCondition(gate.consumed === false, "MERGE_AUTHORIZATION_ALREADY_CONSUMED");
  const approvedAt = requireObserved(gate.approvedAt, context.nowMs, "MERGE_APPROVED_AT");
  const expiresAt = requireUnexpired(gate.expiresAt, context.nowMs, "MERGE_AUTHORIZATION");
  requireBoundedValidity(approvedAt, expiresAt, MAX_ACTION_AUTHORIZATION_VALIDITY_MS, "MERGE_AUTHORIZATION_VALIDITY");
}

function requireDistinct(values, code) {
  requireCondition(new Set(values).size === values.length, code);
}

function rustDeployPackets(context) {
  const packets = requireClosedObject(
    context.evidence.rustDeploy,
    Object.keys(RUST_SERVICE_POLICIES),
    "RUST_DEPLOY_EVIDENCE_MISSING",
    "RUST_DEPLOY_PACKET_SCOPE_MISMATCH",
  );
  const services = Object.keys(packets).sort();
  const requiredServices = Object.keys(RUST_SERVICE_POLICIES).sort();
  requireCondition(
    services.length === requiredServices.length && services.every((service, index) => service === requiredServices[index]),
    "RUST_DEPLOY_PACKET_SCOPE_MISMATCH",
  );
  const web = requireObject(packets["sirinx-web"], "RUST_DEPLOY_SIRINX_WEB_PACKET_MISSING");
  const control = requireObject(packets["sirinx-control"], "RUST_DEPLOY_SIRINX_CONTROL_PACKET_MISSING");
  const allPackets = [web, control];

  requireDistinct(allPackets.map((packet) => packet.ticketId), "RUST_DEPLOY_TICKETS_NOT_SEPARATE");
  requireDistinct(allPackets.map((packet) => packet.authorizationId), "RUST_DEPLOY_AUTHORIZATIONS_NOT_SEPARATE");
  requireDistinct(allPackets.map((packet) => packet.nonce), "RUST_DEPLOY_NONCES_NOT_SEPARATE");
  requireDistinct(allPackets.map((packet) => packet.target?.targetId), "RUST_DEPLOY_TARGETS_NOT_SEPARATE");
  requireDistinct(allPackets.map((packet) => packet.artifactDigest), "RUST_DEPLOY_ARTIFACTS_NOT_SEPARATE");
  requireDistinct(allPackets.map((packet) => packet.rollback?.receiptId), "RUST_DEPLOY_ROLLBACK_RECEIPTS_NOT_SEPARATE");
  requireCondition(allPackets.every((packet) => packet.ticketId !== context.evidence.mergeAuthorization.ticketId), "RUST_DEPLOY_TICKET_REUSES_MERGE_TICKET");
  requireCondition(
    allPackets.every((packet) => packet.authorizationId !== context.evidence.mergeAuthorization.authorizationId),
    "RUST_DEPLOY_AUTHORIZATION_REUSES_MERGE_AUTHORIZATION",
  );
  requireCondition(allPackets.every((packet) => packet.nonce !== context.evidence.mergeAuthorization.nonce), "RUST_DEPLOY_NONCE_REUSES_MERGE_NONCE");
  return packets;
}

function validateRustDeployPacket(context, service) {
  const packets = rustDeployPackets(context);
  const prefix = `RUST_DEPLOY_${service.replaceAll("-", "_").toUpperCase()}`;
  const gate = requireClosedObject(
    packets[service],
    [
      "service",
      "decision",
      "scope",
      "headSha",
      "authorizationId",
      "ticketId",
      "approvedBy",
      "nonce",
      "consumed",
      "approvedAt",
      "expiresAt",
      "artifactDigest",
      "releaseSubjectFingerprint",
      "target",
      "rollback",
    ],
    `${prefix}_PACKET_MISSING`,
    `${prefix}_PACKET_UNKNOWN_FIELD`,
  );
  requireCondition(gate.service === service, `${prefix}_SERVICE_MISMATCH`);
  requireCondition(gate.decision === "APPROVE", `${prefix}_NOT_AUTHORIZED`);
  requireCondition(gate.scope === "rust-service-deploy", `${prefix}_SCOPE_INVALID`);
  requireSha(gate.headSha, context.expectedSha, `${prefix}_HEAD_SHA`);
  requireString(gate.authorizationId, `${prefix}_AUTHORIZATION_ID_MISSING`);
  requireString(gate.ticketId, `${prefix}_TICKET_ID_MISSING`);
  const approvedBy = requireString(gate.approvedBy, `${prefix}_APPROVER_MISSING`);
  requireCondition(approvedBy.toLowerCase() !== context.authorId.toLowerCase(), `${prefix}_SELF_APPROVAL_FORBIDDEN`);
  requireString(gate.nonce, `${prefix}_NONCE_MISSING`);
  requireCondition(gate.consumed === false, `${prefix}_AUTHORIZATION_ALREADY_CONSUMED`);
  const approvedAt = requireObserved(gate.approvedAt, context.nowMs, `${prefix}_APPROVED_AT`);
  const expiresAt = requireUnexpired(gate.expiresAt, context.nowMs, `${prefix}_AUTHORIZATION`);
  requireBoundedValidity(approvedAt, expiresAt, MAX_ACTION_AUTHORIZATION_VALIDITY_MS, `${prefix}_AUTHORIZATION_VALIDITY`);
  requireCondition(typeof gate.artifactDigest === "string" && DIGEST_PATTERN.test(gate.artifactDigest), `${prefix}_ARTIFACT_DIGEST_INVALID`);

  const target = requireClosedObject(
    gate.target,
    ["environment", "targetId", "provider", "exposure"],
    `${prefix}_TARGET_MISSING`,
    `${prefix}_TARGET_UNKNOWN_FIELD`,
  );
  requireCondition(target.environment === "production", `${prefix}_TARGET_NOT_PRODUCTION`);
  requireConcreteIdentifier(target.targetId, `${prefix}_TARGET_ID_MISSING`);
  requireConcreteIdentifier(target.provider, `${prefix}_PROVIDER_MISSING`);
  requireCondition(target.exposure === RUST_SERVICE_POLICIES[service], `${prefix}_TARGET_EXPOSURE_INVALID`);

  const rollback = requireClosedObject(
    gate.rollback,
    ["runbookRef", "receiptId", "verifiedAt", "artifactDigest"],
    `${prefix}_ROLLBACK_MISSING`,
    `${prefix}_ROLLBACK_UNKNOWN_FIELD`,
  );
  requireString(rollback.runbookRef, `${prefix}_ROLLBACK_RUNBOOK_MISSING`, SAFE_REF_PATTERN);
  requireString(rollback.receiptId, `${prefix}_ROLLBACK_RECEIPT_MISSING`);
  requireObserved(rollback.verifiedAt, context.nowMs, `${prefix}_ROLLBACK_VERIFIED_AT`);
  requireCondition(typeof rollback.artifactDigest === "string" && DIGEST_PATTERN.test(rollback.artifactDigest), `${prefix}_ROLLBACK_DIGEST_INVALID`);
  requireCondition(rollback.artifactDigest !== gate.artifactDigest, `${prefix}_ROLLBACK_DIGEST_NOT_DISTINCT`);
  requireCondition(
    typeof gate.releaseSubjectFingerprint === "string" && DIGEST_PATTERN.test(gate.releaseSubjectFingerprint),
    `${prefix}_SUBJECT_FINGERPRINT_INVALID`,
  );
  const computedFingerprint = computeReleaseSubjectFingerprint({
    repository: context.repository,
    pullRequest: context.pullRequest,
    headSha: context.expectedSha,
    packet: gate,
  });
  requireCondition(gate.releaseSubjectFingerprint === computedFingerprint, `${prefix}_SUBJECT_FINGERPRINT_MISMATCH`);
  requireCondition(
    gate.releaseSubjectFingerprint === context.expectedReleaseSubjectFingerprints[service],
    `${prefix}_EXPECTED_SUBJECT_FINGERPRINT_MISMATCH`,
  );
}

function validateEnvelope(evidence, options) {
  requireClosedObject(
    evidence,
    ["schemaVersion", "repository", "pullRequest", "headSha", "authorId", "billing", "ci", "migrations", "browserSmoke", "review", "mergeAuthorization", "rustDeploy"],
    "EVIDENCE_NOT_OBJECT",
    "EVIDENCE_UNKNOWN_FIELD",
  );
  requireCondition(evidence.schemaVersion === EVIDENCE_SCHEMA, "EVIDENCE_SCHEMA_UNSUPPORTED");
  requireCondition(evidence.repository === options.repository, "REPOSITORY_MISMATCH");
  requireCondition(evidence.pullRequest === options.pullRequest, "PULL_REQUEST_MISMATCH");
  requireSha(evidence.headSha, options.expectedSha, "EVIDENCE_HEAD_SHA");
  requireString(evidence.authorId, "AUTHOR_ID_MISSING");
}

export function evaluatePreflight(evidence, options) {
  const expectedSha = options?.expectedSha;
  const repository = options?.repository;
  const pullRequest = options?.pullRequest;
  const expectedBrowserTarget = requireHttpsUrl(options?.expectedBrowserTarget, "EXPECTED_BROWSER_TARGET");
  const expectedReleaseSubjectFingerprints = requireClosedObject(
    options?.expectedReleaseSubjectFingerprints,
    Object.keys(RUST_SERVICE_POLICIES),
    "EXPECTED_RELEASE_SUBJECT_FINGERPRINTS_MISSING",
    "EXPECTED_RELEASE_SUBJECT_FINGERPRINTS_UNKNOWN_FIELD",
  );
  const now = options?.now ?? new Date();
  requireCondition(typeof expectedSha === "string" && SHA_PATTERN.test(expectedSha), "EXPECTED_SHA_INVALID");
  requireCondition(typeof repository === "string" && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository), "EXPECTED_REPOSITORY_INVALID");
  requireCondition(Number.isInteger(pullRequest) && pullRequest > 0, "EXPECTED_PULL_REQUEST_INVALID");
  for (const service of Object.keys(RUST_SERVICE_POLICIES)) {
    requireCondition(
      typeof expectedReleaseSubjectFingerprints[service] === "string" && DIGEST_PATTERN.test(expectedReleaseSubjectFingerprints[service]),
      "EXPECTED_RELEASE_SUBJECT_FINGERPRINT_INVALID",
    );
  }
  requireCondition(now instanceof Date && Number.isFinite(now.getTime()), "NOW_INVALID");

  const baseResult = {
    schemaVersion: RESULT_SCHEMA,
    mode: "LOCAL_PREFLIGHT_ONLY",
    repository,
    pullRequest,
    expectedSha,
    expectedBrowserTarget,
    evaluatedAt: now.toISOString(),
    verificationScope: "SHAPE_FRESHNESS_AND_BINDING_ONLY",
    receiptAuthorityVerified: false,
    executionAuthorityGranted: false,
    externalActionsExecuted: false,
    productionComplete: false,
    authorityBlockers: ["TRUSTED_ISSUER_VERIFICATION_UNAVAILABLE", "ATOMIC_NONCE_CLAIM_UNAVAILABLE"],
  };

  try {
    validateEnvelope(evidence, { expectedSha, repository, pullRequest });
  } catch (error) {
    if (!(error instanceof GateError)) throw error;
    return {
      ...baseResult,
      packetShapeValid: false,
      preflightReady: false,
      mergeGateReady: false,
      rustDeployGateReady: false,
      firstShapeErrorGate: "evidence_envelope",
      gates: [],
      errors: [error.code],
      nextAction: "BLOCKED_UNVERIFIED_AUTHORITY",
    };
  }

  const context = {
    evidence,
    expectedSha,
    repository,
    pullRequest,
    authorId: evidence.authorId,
    expectedBrowserTarget,
    expectedReleaseSubjectFingerprints,
    nowMs: now.getTime(),
  };
  const fingerprint = evidenceFingerprint(evidence);
  const gates = [];
  let firstShapeErrorGate = null;

  for (let index = 0; index < GATES.length; index += 1) {
    const [id, validator] = GATES[index];
    if (firstShapeErrorGate) {
      gates.push({ order: index + 1, id, status: "SHAPE_BLOCKED", blockedBy: firstShapeErrorGate });
      continue;
    }
    try {
      validator(context);
      gates.push({ order: index + 1, id, status: "SHAPE_VALID" });
    } catch (error) {
      if (!(error instanceof GateError)) throw error;
      firstShapeErrorGate = id;
      gates.push({ order: index + 1, id, status: "SHAPE_INVALID", errors: [error.code] });
    }
  }

  const packetShapeValid = gates.length === GATES.length && gates.every((gate) => gate.status === "SHAPE_VALID");
  const firstFailure = gates.find((gate) => gate.status === "SHAPE_INVALID");

  return {
    ...baseResult,
    evidenceFingerprint: fingerprint,
    packetShapeValid,
    preflightReady: false,
    mergeGateReady: false,
    rustDeployGateReady: false,
    firstShapeErrorGate,
    gates,
    errors: firstFailure?.errors ?? [],
    nextAction: "BLOCKED_UNVERIFIED_AUTHORITY",
  };
}

function usage() {
  return [
    "Usage: node scripts/release/release-conductor.mjs --evidence <file.json> --repository <owner/repo> --pr <number> --sha <40-hex> --browser-target <https-url> --web-subject <sha256> --control-subject <sha256>",
    "",
    "Validates local packet shape only and always blocks action authority. It never updates billing, reruns CI, pushes, merges, or deploys.",
  ].join("\n");
}

function parseArgs(argv) {
  const allowed = new Set(["--evidence", "--repository", "--pr", "--sha", "--browser-target", "--web-subject", "--control-subject"]);
  const values = new Map();
  if (argv.includes("--help") || argv.includes("-h")) return { help: true };
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    requireCondition(allowed.has(flag), "CLI_ARGUMENT_UNKNOWN");
    requireCondition(typeof value === "string" && !value.startsWith("--"), "CLI_ARGUMENT_VALUE_MISSING");
    requireCondition(!values.has(flag), "CLI_ARGUMENT_DUPLICATED");
    values.set(flag, value);
  }
  for (const flag of allowed) requireCondition(values.has(flag), "CLI_ARGUMENT_REQUIRED");
  const pullRequest = Number(values.get("--pr"));
  requireCondition(Number.isSafeInteger(pullRequest) && pullRequest > 0, "CLI_PULL_REQUEST_INVALID");
  return {
    help: false,
    evidencePath: values.get("--evidence"),
    repository: values.get("--repository"),
    pullRequest,
    expectedSha: values.get("--sha"),
    expectedBrowserTarget: values.get("--browser-target"),
    expectedReleaseSubjectFingerprints: {
      "sirinx-web": values.get("--web-subject"),
      "sirinx-control": values.get("--control-subject"),
    },
  };
}

export function runCli(argv, io = {}) {
  const readFile = io.readFile ?? ((path) => readFileSync(path, "utf8"));
  const stdout = io.stdout ?? ((line) => process.stdout.write(line));
  const stderr = io.stderr ?? ((line) => process.stderr.write(line));
  const now = io.now ?? new Date();
  try {
    const args = parseArgs(argv);
    if (args.help) {
      stdout(`${usage()}\n`);
      return 0;
    }
    let serializedEvidence;
    try {
      serializedEvidence = readFile(args.evidencePath);
    } catch {
      throw new GateError("EVIDENCE_FILE_UNREADABLE");
    }
    let evidence;
    try {
      evidence = JSON.parse(serializedEvidence);
    } catch {
      throw new GateError("EVIDENCE_FILE_INVALID_JSON");
    }
    const result = evaluatePreflight(evidence, { ...args, now });
    stdout(`${JSON.stringify(result)}\n`);
    return 2;
  } catch (error) {
    const code = error instanceof GateError ? error.code : "PREFLIGHT_INTERNAL_ERROR";
    stderr(`${JSON.stringify({ schemaVersion: RESULT_SCHEMA, mode: "LOCAL_PREFLIGHT_ONLY", verificationScope: "SHAPE_FRESHNESS_AND_BINDING_ONLY", packetShapeValid: false, preflightReady: false, mergeGateReady: false, rustDeployGateReady: false, receiptAuthorityVerified: false, executionAuthorityGranted: false, externalActionsExecuted: false, productionComplete: false, nextAction: "BLOCKED_UNVERIFIED_AUTHORITY", errors: [code] })}\n`);
    return 64;
  }
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) process.exitCode = runCli(process.argv.slice(2));

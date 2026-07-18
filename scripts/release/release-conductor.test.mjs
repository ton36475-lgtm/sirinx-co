import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { EVIDENCE_SCHEMA, computeReleaseSubjectFingerprint, evaluatePreflight, runCli } from "./release-conductor.mjs";

const SHA = "b7ba23f86471797e330d334de4d6112813b45a9e";
const WEB_OLD_DIGEST = `sha256:${"1".repeat(64)}`;
const WEB_NEW_DIGEST = `sha256:${"2".repeat(64)}`;
const CONTROL_OLD_DIGEST = `sha256:${"3".repeat(64)}`;
const CONTROL_NEW_DIGEST = `sha256:${"4".repeat(64)}`;
const WEB_SUBJECT_FINGERPRINT = "sha256:f066621b5fd190f295015e81e192ff52c5c97a4b30412b085a1ce27533272a67";
const CONTROL_SUBJECT_FINGERPRINT = "sha256:baa7c90e1c327503664476ec59f77c7002f21c67c2a7492f491469b0f13e0942";
const NOW = new Date("2026-07-19T12:00:00.000Z");
const BROWSER_TARGET = "https://ghostclaw-hermes-command-center.e-galli.chatgpt.site/";

function validEvidence() {
  const evidence = {
    schemaVersion: EVIDENCE_SCHEMA,
    repository: "ton36475-lgtm/sirinx-co",
    pullRequest: 8,
    headSha: SHA,
    authorId: "pr-author",
    billing: {
      status: "UNLOCKED",
      source: "GITHUB_BILLING",
      acknowledgementId: "billing-ack-123",
      observedAt: "2026-07-19T11:00:00.000Z",
      validUntil: "2026-07-19T13:00:00.000Z",
    },
    ci: {
      status: "SUCCESS",
      source: "GITHUB_ACTIONS",
      headSha: SHA,
      runId: "29652380775",
      workflow: "CI",
      completedAt: "2026-07-19T11:05:00.000Z",
    },
    migrations: {
      status: "PASSED",
      headSha: SHA,
      database: "postgres",
      disposable: true,
      disposed: true,
      receiptId: "pg-receipt-123",
      completedAt: "2026-07-19T11:10:00.000Z",
      versions: ["0003", "0004"],
    },
    browserSmoke: {
      status: "PASSED",
      authenticated: true,
      headSha: SHA,
      targetUrl: BROWSER_TARGET,
      receiptId: "browser-receipt-123",
      assertions: [
        "owner-view",
        "held-gates",
        "b1-b2-completed",
        "no-production-writes",
        "no-interactive-controls",
        "no-console-errors",
      ],
      completedAt: "2026-07-19T11:15:00.000Z",
      validUntil: "2026-07-19T13:00:00.000Z",
    },
    review: {
      decision: "APPROVED",
      headSha: SHA,
      reviewerId: "independent-reviewer",
      authorId: "pr-author",
      independent: true,
      reviewId: "review-123",
      submittedAt: "2026-07-19T11:20:00.000Z",
    },
    mergeAuthorization: {
      decision: "APPROVE",
      scope: "merge-pr",
      headSha: SHA,
      authorizationId: "merge-auth-123",
      ticketId: "MERGE-8",
      approvedBy: "release-owner",
      nonce: "merge-nonce-123",
      consumed: false,
      approvedAt: "2026-07-19T11:25:00.000Z",
      expiresAt: "2026-07-19T12:15:00.000Z",
    },
    rustDeploy: {
      "sirinx-web": {
        service: "sirinx-web",
        decision: "APPROVE",
        scope: "rust-service-deploy",
        headSha: SHA,
        authorizationId: "deploy-web-auth-123",
        ticketId: "DEPLOY-WEB-8",
        approvedBy: "release-owner",
        nonce: "deploy-web-nonce-123",
        consumed: false,
        approvedAt: "2026-07-19T11:30:00.000Z",
        expiresAt: "2026-07-19T12:15:00.000Z",
        artifactDigest: WEB_NEW_DIGEST,
        target: {
          environment: "production",
          targetId: "prod-web-runtime-1",
          provider: "approved-runtime",
          exposure: "public",
        },
        rollback: {
          runbookRef: "DEPLOY_RUST.md#web-rollback",
          receiptId: "web-rollback-test-123",
          verifiedAt: "2026-07-19T10:30:00.000Z",
          artifactDigest: WEB_OLD_DIGEST,
        },
      },
      "sirinx-control": {
        service: "sirinx-control",
        decision: "APPROVE",
        scope: "rust-service-deploy",
        headSha: SHA,
        authorizationId: "deploy-control-auth-123",
        ticketId: "DEPLOY-CONTROL-8",
        approvedBy: "release-owner",
        nonce: "deploy-control-nonce-123",
        consumed: false,
        approvedAt: "2026-07-19T11:30:00.000Z",
        expiresAt: "2026-07-19T12:15:00.000Z",
        artifactDigest: CONTROL_NEW_DIGEST,
        target: {
          environment: "production",
          targetId: "prod-private-control-runtime-1",
          provider: "approved-runtime",
          exposure: "private",
        },
        rollback: {
          runbookRef: "DEPLOY_RUST.md#control-rollback",
          receiptId: "control-rollback-test-123",
          verifiedAt: "2026-07-19T10:30:00.000Z",
          artifactDigest: CONTROL_OLD_DIGEST,
        },
      },
    },
  };
  evidence.rustDeploy["sirinx-web"].releaseSubjectFingerprint = WEB_SUBJECT_FINGERPRINT;
  evidence.rustDeploy["sirinx-control"].releaseSubjectFingerprint = CONTROL_SUBJECT_FINGERPRINT;
  return evidence;
}

const options = {
  repository: "ton36475-lgtm/sirinx-co",
  pullRequest: 8,
  expectedSha: SHA,
  expectedBrowserTarget: BROWSER_TARGET,
  expectedReleaseSubjectFingerprints: {
    "sirinx-web": WEB_SUBJECT_FINGERPRINT,
    "sirinx-control": CONTROL_SUBJECT_FINGERPRINT,
  },
  now: NOW,
};

function cliArgs() {
  return [
    "--evidence", "receipt.json",
    "--repository", options.repository,
    "--pr", "8",
    "--sha", SHA,
    "--browser-target", BROWSER_TARGET,
    "--web-subject", options.expectedReleaseSubjectFingerprints["sirinx-web"],
    "--control-subject", options.expectedReleaseSubjectFingerprints["sirinx-control"],
  ];
}

test("fabricated all-valid JSON is only shape-valid and remains authority-blocked", () => {
  const result = evaluatePreflight(validEvidence(), options);
  assert.equal(result.packetShapeValid, true);
  assert.equal(result.preflightReady, false);
  assert.equal(result.mergeGateReady, false);
  assert.equal(result.rustDeployGateReady, false);
  assert.equal(result.externalActionsExecuted, false);
  assert.equal(result.receiptAuthorityVerified, false);
  assert.equal(result.executionAuthorityGranted, false);
  assert.equal(result.verificationScope, "SHAPE_FRESHNESS_AND_BINDING_ONLY");
  assert.equal(result.productionComplete, false);
  assert.match(result.evidenceFingerprint, /^sha256:[0-9a-f]{64}$/);
  assert.equal(result.firstShapeErrorGate, null);
  assert.equal(result.nextAction, "BLOCKED_UNVERIFIED_AUTHORITY");
  assert.deepEqual(result.authorityBlockers, ["TRUSTED_ISSUER_VERIFICATION_UNAVAILABLE", "ATOMIC_NONCE_CLAIM_UNAVAILABLE"]);
  assert.deepEqual(result.gates.map(({ id, status }) => [id, status]), [
    ["billing_unlock", "SHAPE_VALID"],
    ["exact_sha_ci", "SHAPE_VALID"],
    ["disposable_postgres_migrations", "SHAPE_VALID"],
    ["authenticated_browser_smoke", "SHAPE_VALID"],
    ["independent_review", "SHAPE_VALID"],
    ["merge_authorization", "SHAPE_VALID"],
    ["rust_deploy_sirinx_web", "SHAPE_VALID"],
    ["rust_deploy_sirinx_control", "SHAPE_VALID"],
  ]);
});

test("fails exact-SHA CI and blocks every later gate in order", () => {
  const evidence = validEvidence();
  evidence.ci.headSha = "a".repeat(40);
  const result = evaluatePreflight(evidence, options);
  assert.equal(result.packetShapeValid, false);
  assert.equal(result.preflightReady, false);
  assert.equal(result.firstShapeErrorGate, "exact_sha_ci");
  assert.deepEqual(result.gates[1].errors, ["CI_HEAD_SHA_MISMATCH"]);
  assert.deepEqual(result.errors, ["CI_HEAD_SHA_MISMATCH"]);
  assert.equal(result.gates[2].status, "SHAPE_BLOCKED");
  assert.equal(result.gates[2].blockedBy, "exact_sha_ci");
  assert.equal(result.mergeGateReady, false);
  assert.equal(result.rustDeployGateReady, false);
});

test("requires migrations 0003 and 0004 on a disposed disposable Postgres", () => {
  for (const mutate of [
    (evidence) => { evidence.migrations.versions = ["0003"]; },
    (evidence) => { evidence.migrations.disposable = false; },
    (evidence) => { evidence.migrations.disposed = false; },
    (evidence) => { evidence.migrations.database = "sqlite"; },
  ]) {
    const evidence = validEvidence();
    mutate(evidence);
    const result = evaluatePreflight(evidence, options);
    assert.equal(result.firstShapeErrorGate, "disposable_postgres_migrations");
    assert.equal(result.gates[2].status, "SHAPE_INVALID");
  }
});

test("requires an authenticated, unexpired HTTPS browser receipt bound to the SHA", () => {
  const evidence = validEvidence();
  evidence.browserSmoke.authenticated = false;
  const result = evaluatePreflight(evidence, options);
  assert.equal(result.firstShapeErrorGate, "authenticated_browser_smoke");
  assert.deepEqual(result.gates[3].errors, ["BROWSER_SMOKE_NOT_AUTHENTICATED"]);

  const localEvidence = validEvidence();
  localEvidence.browserSmoke.targetUrl = "http://127.0.0.1:4173/";
  assert.equal(evaluatePreflight(localEvidence, options).firstShapeErrorGate, "authenticated_browser_smoke");

  const wrongOrigin = validEvidence();
  wrongOrigin.browserSmoke.targetUrl = "https://other.example.com/";
  const wrongOriginResult = evaluatePreflight(wrongOrigin, options);
  assert.deepEqual(wrongOriginResult.gates[3].errors, ["BROWSER_SMOKE_TARGET_MISMATCH"]);

  const incompleteAssertions = validEvidence();
  incompleteAssertions.browserSmoke.assertions = ["owner-view"];
  const assertionResult = evaluatePreflight(incompleteAssertions, options);
  assert.deepEqual(assertionResult.gates[3].errors, ["BROWSER_SMOKE_ASSERTION_SCOPE_MISMATCH"]);
});

test("rejects self-review and self-approved merge authorization", () => {
  const selfReview = validEvidence();
  selfReview.review.reviewerId = selfReview.authorId;
  assert.deepEqual(evaluatePreflight(selfReview, options).gates[4].errors, ["REVIEW_NOT_INDEPENDENT"]);

  const selfMerge = validEvidence();
  selfMerge.mergeAuthorization.approvedBy = selfMerge.authorId;
  assert.deepEqual(evaluatePreflight(selfMerge, options).gates[5].errors, ["MERGE_SELF_APPROVAL_FORBIDDEN"]);
});

test("requires separate per-service deploy tickets, targets, artifacts, and rollback receipts", () => {
  const sharedTicket = validEvidence();
  sharedTicket.rustDeploy["sirinx-control"].ticketId = sharedTicket.rustDeploy["sirinx-web"].ticketId;
  assert.deepEqual(evaluatePreflight(sharedTicket, options).gates[6].errors, ["RUST_DEPLOY_TICKETS_NOT_SEPARATE"]);

  const sharedTarget = validEvidence();
  sharedTarget.rustDeploy["sirinx-control"].target.targetId = sharedTarget.rustDeploy["sirinx-web"].target.targetId;
  assert.deepEqual(evaluatePreflight(sharedTarget, options).gates[6].errors, ["RUST_DEPLOY_TARGETS_NOT_SEPARATE"]);

  const sharedArtifact = validEvidence();
  sharedArtifact.rustDeploy["sirinx-control"].artifactDigest = sharedArtifact.rustDeploy["sirinx-web"].artifactDigest;
  assert.deepEqual(evaluatePreflight(sharedArtifact, options).gates[6].errors, ["RUST_DEPLOY_ARTIFACTS_NOT_SEPARATE"]);

  const sharedRollbackReceipt = validEvidence();
  sharedRollbackReceipt.rustDeploy["sirinx-control"].rollback.receiptId = sharedRollbackReceipt.rustDeploy["sirinx-web"].rollback.receiptId;
  assert.deepEqual(evaluatePreflight(sharedRollbackReceipt, options).gates[6].errors, ["RUST_DEPLOY_ROLLBACK_RECEIPTS_NOT_SEPARATE"]);

  const missingTarget = validEvidence();
  delete missingTarget.rustDeploy["sirinx-web"].target.targetId;
  assert.equal(evaluatePreflight(missingTarget, options).firstShapeErrorGate, "rust_deploy_sirinx_web");

  const placeholderTarget = validEvidence();
  placeholderTarget.rustDeploy["sirinx-web"].target.targetId = "tbd";
  assert.deepEqual(evaluatePreflight(placeholderTarget, options).gates[6].errors, ["RUST_DEPLOY_SIRINX_WEB_TARGET_ID_MISSING_PLACEHOLDER"]);

  const publicControl = validEvidence();
  publicControl.rustDeploy["sirinx-control"].target.exposure = "public";
  const controlResult = evaluatePreflight(publicControl, options);
  assert.deepEqual(controlResult.gates[7].errors, ["RUST_DEPLOY_SIRINX_CONTROL_TARGET_EXPOSURE_INVALID"]);
  assert.equal(controlResult.mergeGateReady, false);
  assert.equal(controlResult.rustDeployGateReady, false);

  const sameRollback = validEvidence();
  sameRollback.rustDeploy["sirinx-web"].rollback.artifactDigest = WEB_NEW_DIGEST;
  assert.deepEqual(evaluatePreflight(sameRollback, options).gates[6].errors, ["RUST_DEPLOY_SIRINX_WEB_ROLLBACK_DIGEST_NOT_DISTINCT"]);

  const broadAuthorization = validEvidence();
  broadAuthorization.rustDeploy["sirinx-web"].expiresAt = "2026-07-20T11:30:00.000Z";
  assert.deepEqual(evaluatePreflight(broadAuthorization, options).gates[6].errors, ["RUST_DEPLOY_SIRINX_WEB_AUTHORIZATION_VALIDITY_TOO_BROAD"]);
});

test("rejects missing or extra Rust service deploy packets", () => {
  const missingControl = validEvidence();
  delete missingControl.rustDeploy["sirinx-control"];
  assert.deepEqual(evaluatePreflight(missingControl, options).gates[6].errors, ["RUST_DEPLOY_PACKET_SCOPE_MISMATCH"]);

  const broadened = validEvidence();
  broadened.rustDeploy["another-service"] = structuredClone(broadened.rustDeploy["sirinx-web"]);
  assert.deepEqual(evaluatePreflight(broadened, options).gates[6].errors, ["RUST_DEPLOY_PACKET_SCOPE_MISMATCH"]);
});

test("binds each artifact, target, and rollback packet to its expected release subject", () => {
  const canonical = validEvidence();
  assert.equal(
    computeReleaseSubjectFingerprint({
      repository: canonical.repository,
      pullRequest: canonical.pullRequest,
      headSha: canonical.headSha,
      packet: canonical.rustDeploy["sirinx-web"],
    }),
    WEB_SUBJECT_FINGERPRINT,
  );
  assert.equal(
    computeReleaseSubjectFingerprint({
      repository: canonical.repository,
      pullRequest: canonical.pullRequest,
      headSha: canonical.headSha,
      packet: canonical.rustDeploy["sirinx-control"],
    }),
    CONTROL_SUBJECT_FINGERPRINT,
  );

  for (const mutate of [
    (packet) => { packet.artifactDigest = `sha256:${"5".repeat(64)}`; },
    (packet) => { packet.target.targetId = "different-prod-web-runtime"; },
    (packet) => { packet.target.provider = "different-runtime"; },
    (packet) => { packet.rollback.receiptId = "different-rollback-receipt"; },
    (packet) => { packet.rollback.artifactDigest = `sha256:${"6".repeat(64)}`; },
  ]) {
    const changed = validEvidence();
    mutate(changed.rustDeploy["sirinx-web"]);
    const result = evaluatePreflight(changed, options);
    assert.deepEqual(result.gates[6].errors, ["RUST_DEPLOY_SIRINX_WEB_SUBJECT_FINGERPRINT_MISMATCH"]);
  }

  const wrongConfiguredSubject = {
    ...options,
    expectedReleaseSubjectFingerprints: {
      ...options.expectedReleaseSubjectFingerprints,
      "sirinx-web": `sha256:${"f".repeat(64)}`,
    },
  };
  const configuredResult = evaluatePreflight(validEvidence(), wrongConfiguredSubject);
  assert.deepEqual(configuredResult.gates[6].errors, ["RUST_DEPLOY_SIRINX_WEB_EXPECTED_SUBJECT_FINGERPRINT_MISMATCH"]);
});

test("closed schemas reject unknown secret-like and benign fields", () => {
  const secretLike = validEvidence();
  secretLike.browserSmoke.apiCredential = "must-not-be-recorded";
  const secretResult = evaluatePreflight(secretLike, options);
  assert.deepEqual(secretResult.gates[3].errors, ["BROWSER_SMOKE_EVIDENCE_UNKNOWN_FIELD"]);

  const benign = validEvidence();
  benign.billing.note = "also rejected because the schema is closed";
  const benignResult = evaluatePreflight(benign, options);
  assert.deepEqual(benignResult.gates[0].errors, ["BILLING_EVIDENCE_UNKNOWN_FIELD"]);

  const envelopeUnknown = validEvidence();
  envelopeUnknown.comment = "closed envelope";
  const envelopeResult = evaluatePreflight(envelopeUnknown, options);
  assert.equal(envelopeResult.firstShapeErrorGate, "evidence_envelope");
  assert.deepEqual(envelopeResult.errors, ["EVIDENCE_UNKNOWN_FIELD"]);
  assert.deepEqual(envelopeResult.gates, []);
});

test("self-asserted unconsumed approvals remain blocked and cannot become replay authority", () => {
  const evidence = validEvidence();
  assert.equal(evidence.mergeAuthorization.consumed, false);
  assert.equal(evidence.rustDeploy["sirinx-web"].consumed, false);
  assert.equal(evidence.rustDeploy["sirinx-control"].consumed, false);

  const first = evaluatePreflight(evidence, options);
  const replay = evaluatePreflight(evidence, options);
  for (const result of [first, replay]) {
    assert.equal(result.packetShapeValid, true);
    assert.equal(result.preflightReady, false);
    assert.equal(result.mergeGateReady, false);
    assert.equal(result.rustDeployGateReady, false);
    assert.equal(result.executionAuthorityGranted, false);
    assert.equal(result.nextAction, "BLOCKED_UNVERIFIED_AUTHORITY");
  }
  assert.equal(replay.evidenceFingerprint, first.evidenceFingerprint);
});

test("blocks at billing when the external acknowledgement has expired", () => {
  const evidence = validEvidence();
  evidence.billing.validUntil = "2026-07-19T11:59:59.000Z";
  const result = evaluatePreflight(evidence, options);
  assert.equal(result.firstShapeErrorGate, "billing_unlock");
  assert.deepEqual(result.errors, ["BILLING_ACKNOWLEDGEMENT_EXPIRED"]);
  assert.equal(result.gates[1].status, "SHAPE_BLOCKED");
});

test("CLI emits shape result but always exits nonzero without authority", () => {
  const output = [];
  const errors = [];
  let readCount = 0;
  const exitCode = runCli(
    cliArgs(),
    {
      readFile(path) {
        readCount += 1;
        assert.equal(path, "receipt.json");
        return JSON.stringify(validEvidence());
      },
      stdout: (line) => output.push(line),
      stderr: (line) => errors.push(line),
      now: NOW,
    },
  );
  assert.equal(exitCode, 2);
  assert.equal(readCount, 1);
  assert.equal(errors.length, 0);
  const result = JSON.parse(output.join(""));
  assert.equal(result.packetShapeValid, true);
  assert.equal(result.preflightReady, false);
  assert.equal(result.mergeGateReady, false);
  assert.equal(result.rustDeployGateReady, false);
  assert.equal(result.executionAuthorityGranted, false);
  assert.equal(result.nextAction, "BLOCKED_UNVERIFIED_AUTHORITY");
  assert.equal(result.externalActionsExecuted, false);
});

test("CLI fails closed for invalid JSON and exposes no execution primitives", () => {
  const errors = [];
  const exitCode = runCli(
    cliArgs(),
    { readFile: () => "{", stdout: () => {}, stderr: (line) => errors.push(line), now: NOW },
  );
  assert.equal(exitCode, 64);
  const errorResult = JSON.parse(errors.join(""));
  assert.deepEqual(errorResult.errors, ["EVIDENCE_FILE_INVALID_JSON"]);
  assert.equal(errorResult.preflightReady, false);
  assert.equal(errorResult.nextAction, "BLOCKED_UNVERIFIED_AUTHORITY");

  const source = readFileSync(new URL("./release-conductor.mjs", import.meta.url), "utf8");
  for (const forbiddenImport of ["node:child_process", "node:http", "node:https", "fetch("]) {
    assert.equal(source.includes(forbiddenImport), false, `source must not contain ${forbiddenImport}`);
  }
  for (const forbiddenReadiness of ["preflightReady: true", "mergeGateReady: true", "rustDeployGateReady: true", "executionAuthorityGranted: true"]) {
    assert.equal(source.includes(forbiddenReadiness), false, `source must not contain ${forbiddenReadiness}`);
  }
});

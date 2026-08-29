import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

import {
  computeProcessEvidenceSnapshotDigest,
  computeResourceCleanupActionDigest,
  computeResourceCleanupOperationParametersDigest,
  computeResourceCleanupPlanHash,
  computeResourceCleanupScopeHash,
  computeTargetManifestDigest,
  computeTargetManifestEntriesDigest,
  RESOURCE_CLEANUP_PLAN_URL
} from "./resource-cleanup-preflight.mjs";
import {
  classifyCleanupEffectInterruption,
  computeExecutableIdentityDigest,
  computeResourceCleanupActionTimeEvidenceDigest,
  computeResourceCleanupEffectAttemptDigest,
  computeResourceCleanupEnvironmentDigest,
  computeResourceCleanupExclusionsDigest,
  computeResourceCleanupPostActionReceiptDigest,
  computeResourceCleanupRecoveryReferenceDigest,
  evaluateResourceCleanupExecutorAdmission,
  getCleanupEffectTransitionDecision,
  validateCleanupEffectTransition,
  validateExecutableIdentityV1,
  validateResourceCleanupActionTimeEvidenceV1,
  validateResourceCleanupEffectAttemptV1,
  validateResourceCleanupPostActionReceiptV1
} from "./resource-cleanup-admission.mjs";

const fixedNow = new Date("2026-07-20T15:00:10.000Z");
const hex = (character, length = 64) => character.repeat(length);
const testRequire = createRequire(import.meta.url);

async function strictResourceCleanupSchemaValidators() {
  const ajvModule = testRequire("ajv/dist/2020.js");
  const formatsModule = testRequire("ajv-formats");
  const Ajv2020 = ajvModule.default;
  const addFormats = formatsModule.default ?? formatsModule;
  const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: true });
  addFormats(ajv);

  const schemaUrls = {
    executable: "../../../schemas/agent-runtime/executable-identity.v1.schema.json",
    targetManifest: "../../../schemas/agent-runtime/target-manifest.v1.schema.json",
    processEvidence: "../../../schemas/agent-runtime/process-evidence.v1.schema.json",
    actionTimeEvidence: "../../../schemas/agent-runtime/resource-cleanup-action-time-evidence.v1.schema.json",
    effectAttempt: "../../../schemas/agent-runtime/resource-cleanup-effect-attempt.v1.schema.json",
    postActionReceipt: "../../../schemas/agent-runtime/resource-cleanup-post-action-receipt.v1.schema.json"
  };
  const schemas = Object.fromEntries(await Promise.all(Object.entries(schemaUrls).map(async ([name, url]) => [
    name,
    JSON.parse(await readFile(new URL(url, import.meta.url), "utf8"))
  ])));

  for (const name of ["targetManifest", "processEvidence", "executable"]) {
    ajv.addSchema(schemas[name]);
  }
  return {
    schemas,
    executable: ajv.getSchema(schemas.executable.$id),
    actionTimeEvidence: ajv.compile(schemas.actionTimeEvidence),
    effectAttempt: ajv.compile(schemas.effectAttempt),
    postActionReceipt: ajv.compile(schemas.postActionReceipt)
  };
}

async function rawPlan() {
  return JSON.parse(await readFile(RESOURCE_CLEANUP_PLAN_URL, "utf8"));
}

function node(kind, inode, sizeBytes, mode = kind === "REGULAR_FILE" ? "100755" : "040755") {
  return {
    kind,
    deviceId: "16777232",
    inode: String(inode),
    mode,
    uid: "501",
    gid: "20",
    linkCount: "1",
    sizeBytes: String(sizeBytes),
    mtimeNs: "1784563185000000000"
  };
}

function manifestForTarget(target, generatedAt, manifestId) {
  const entries = [{
    relativePath: "artifact.bin",
    kind: "FILE",
    deviceId: target.deviceId,
    inode: target.inode + 1,
    mode: "100644",
    linkCount: 1,
    sizeBytes: 3173187584,
    mtimeNs: "1784563185000000000",
    contentSha256: hex("6"),
    symlinkText: null
  }];
  const manifest = {
    schemaVersion: "1.0",
    manifestId,
    targetPath: target.absolutePath,
    targetDeviceId: target.deviceId,
    targetInode: target.inode,
    canonicalEncoding: "sorted-nul-v1",
    entries,
    entryCount: entries.length,
    totalSizeBytes: entries[0].sizeBytes,
    entriesDigest: computeTargetManifestEntriesDigest(entries),
    manifestDigest: hex("0"),
    containsSpecialFiles: false,
    containsEscapingSymlinks: false,
    incompleteHardlinkSets: false,
    generatedAt,
    status: "VERIFIED_MATCH"
  };
  manifest.manifestDigest = computeTargetManifestDigest(manifest);
  return manifest;
}

function processEvidence(targetPath, capturedAt, snapshotId) {
  const evidence = {
    schemaVersion: "1.0",
    snapshotId,
    targetPath,
    capturedAt,
    source: "LOCAL_PROCESS_SNAPSHOT",
    complete: true,
    entries: [],
    activeConsumers: 0,
    snapshotDigest: hex("0"),
    status: "VERIFIED_MATCH"
  };
  evidence.snapshotDigest = computeProcessEvidenceSnapshotDigest(evidence);
  return evidence;
}

function validGrant(plan) {
  const target = {
    absolutePath: "/Users/sirinx/SIRINXDev/sirinx-co/target",
    class: "GENERATED_BUILD_OUTPUT",
    deviceId: 16777232,
    inode: 35550880
  };
  const proposalManifest = manifestForTarget(target, "2026-07-20T14:59:45.000Z", "TM-PROPOSAL-C01");
  const proposalProcess = processEvidence(target.absolutePath, "2026-07-20T14:59:50.000Z", "PE-PROPOSAL-C01");
  const grant = {
    schemaVersion: "2.0-plan",
    ticketId: "TKT-RESOURCE-C01",
    grantId: "GRANT-RESOURCE-C01-ONCE",
    taskId: "TASK-RESOURCE-RECOVERY",
    action: "RESOURCE_CLEANUP",
    circuit: "resource_cleanup",
    target,
    repository: {
      path: "/Users/sirinx/SIRINXDev/sirinx-co",
      branch: "agent/b1-b2-command-center",
      commitSha: hex("1", 40),
      worktreeSnapshotVersion: "1.0",
      worktreeSnapshotDigest: hex("2")
    },
    hashes: {
      planHash: computeResourceCleanupPlanHash(plan),
      scopeHash: hex("0"),
      actionDigest: hex("0"),
      processEvidenceDigest: proposalProcess.snapshotDigest
    },
    principals: {
      approver: "principal:human-operator",
      maker: "principal:ronin-41",
      checker: "principal:ronin-42",
      executor: "principal:resource-cleanup-executor"
    },
    approval: {
      approverAssertionRef: "host-attestation://operator/assertion/RESOURCE-C01",
      issuerAttestationDigest: hex("4"),
      nonceDigest: hex("5")
    },
    targetManifest: {
      schemaVersion: "1.0",
      manifestId: proposalManifest.manifestId,
      entriesDigest: proposalManifest.entriesDigest,
      manifestDigest: proposalManifest.manifestDigest,
      entryCount: proposalManifest.entryCount,
      totalSizeBytes: proposalManifest.totalSizeBytes,
      containsSpecialFiles: false,
      containsEscapingSymlinks: false,
      incompleteHardlinkSets: false
    },
    operation: {
      kind: "TOOL_NATIVE_CLEAN",
      toolId: "cargo-clean",
      parametersDigest: computeResourceCleanupOperationParametersDigest(plan.operationPreview),
      destinationDeviceId: null
    },
    recovery: {
      sourceRef: "repo-lockfiles://Cargo.lock",
      procedureRef: "docs://resource-recovery/C01",
      networkRequired: false,
      installRequired: false,
      supportingTicketIds: []
    },
    exclusions: [...plan.forbiddenPrefixes],
    limits: {
      maxCalls: 1,
      maxCostUsd: 0,
      maxRuntimeSeconds: 600,
      maxEvidenceAgeSeconds: 60,
      maxAffectedKiB: 3200000,
      minReclaimKiB: 3000000,
      emergencyFloorKiB: 5242880,
      worstCaseCleanupGrowthKiB: 0,
      requiredPostFreeKiB: 20971520
    },
    issuedAt: "2026-07-20T14:59:55.000Z",
    expiresAt: "2026-07-20T15:04:55.000Z",
    status: "ISSUED"
  };
  grant.hashes.scopeHash = computeResourceCleanupScopeHash(grant);
  grant.hashes.actionDigest = computeResourceCleanupActionDigest(grant);
  return grant;
}

function validExecutableIdentity(plan) {
  const invocationNode = node("SYMLINK", 30862423, 6, "120777");
  const parentPaths = [
    "/Users/sirinx",
    "/Users/sirinx/.cargo",
    "/Users/sirinx/.cargo/bin",
    "/Users/sirinx/.rustup",
    "/Users/sirinx/.rustup/toolchains",
    "/Users/sirinx/.rustup/toolchains/1.88.0-aarch64-apple-darwin",
    "/Users/sirinx/.rustup/toolchains/1.88.0-aarch64-apple-darwin/bin",
    "/Users/sirinx/SIRINXDev",
    "/Users/sirinx/SIRINXDev/sirinx-co"
  ];
  const identity = {
    schemaVersion: "1.0",
    identityId: "EXE-CARGO-C01",
    observedAt: "2026-07-20T15:00:08.000Z",
    platform: "darwin",
    architecture: "arm64",
    ownerUid: "501",
    invocationPath: "/Users/sirinx/.cargo/bin/cargo",
    invocationArgv0: "cargo",
    invocationNode,
    symlinkChain: [{
      path: "/Users/sirinx/.cargo/bin/cargo",
      node: structuredClone(invocationNode),
      linkText: "rustup",
      resolvedNextPath: "/Users/sirinx/.cargo/bin/rustup"
    }],
    resolvedPath: "/Users/sirinx/.cargo/bin/rustup",
    resolvedNode: node("REGULAR_FILE", 30862417, 11053296),
    parentDirectories: parentPaths.map((parentPath, index) => ({
      path: parentPath,
      node: node("DIRECTORY", 7685315 + index, 832)
    })),
    binary: {
      format: "MACH_O_64",
      architecture: "arm64",
      contentSha256: hex("7"),
      contentSizeBytes: "11053296"
    },
    selectedTool: {
      tool: "cargo",
      proxy: "rustup",
      toolchainSelectorSource: "ACTION_TIME_EXACT_OVERRIDE_PREVIEW",
      toolchainName: "1.88.0-aarch64-apple-darwin",
      repositorySelector: {
        kind: "RUST_TOOLCHAIN_TOML",
        value: "stable",
        path: "/Users/sirinx/SIRINXDev/sirinx-co/rust-toolchain.toml",
        node: node("REGULAR_FILE", 35270434, 66, "100644"),
        contentSha256: hex("8")
      },
      exactToolchainEnvironment: {
        name: "RUSTUP_TOOLCHAIN",
        value: "1.88.0-aarch64-apple-darwin",
        includedInOperationPreview: false
      },
      cargoRevision: {
        version: "1.88.0",
        commitHash: hex("a", 40),
        commitDate: "2026-06-23",
        hostTriple: "aarch64-apple-darwin"
      },
      rustcRevision: {
        version: "1.88.0",
        commitHash: hex("b", 40),
        commitDate: "2026-06-23",
        hostTriple: "aarch64-apple-darwin"
      },
      selectedCargoExecutable: {
        path: "/Users/sirinx/.rustup/toolchains/1.88.0-aarch64-apple-darwin/bin/cargo",
        node: node("REGULAR_FILE", 41000001, 42000000),
        contentSha256: hex("c")
      },
      toolchainManifestDigest: hex("d"),
      revisionProbeDigest: hex("e")
    },
    manifestPathIdentity: {
      path: "/Users/sirinx/SIRINXDev/sirinx-co/Cargo.toml",
      node: node("REGULAR_FILE", 35270760, 1324, "100644"),
      contentSha256: hex("f")
    },
    cwdIdentity: {
      path: "/Users/sirinx/SIRINXDev/sirinx-co",
      node: node("DIRECTORY", 35270000, 1024)
    },
    operationParametersDigest: computeResourceCleanupOperationParametersDigest(plan.operationPreview),
    environmentDigest: computeResourceCleanupEnvironmentDigest(plan.operationPreview.environment),
    identityDigest: hex("0"),
    status: "VERIFIED_MATCH"
  };
  identity.identityDigest = computeExecutableIdentityDigest(identity);
  return identity;
}

function validActionTimeEvidence(plan, grant) {
  const targetManifest = manifestForTarget(grant.target, "2026-07-20T15:00:01.000Z", "TM-ACTION-C01");
  const processes = processEvidence(grant.target.absolutePath, "2026-07-20T15:00:05.000Z", "PE-ACTION-C01");
  const executableIdentity = validExecutableIdentity(plan);
  const evidence = {
    schemaVersion: "1.0-plan",
    evidenceId: "RCAE-RESOURCE-C01",
    ticketId: grant.ticketId,
    grantId: grant.grantId,
    taskId: grant.taskId,
    runId: "RUN-RESOURCE-C01",
    action: "RESOURCE_CLEANUP",
    circuit: "resource_cleanup",
    collectedAt: "2026-07-20T15:00:10.000Z",
    grantBinding: {
      planHash: grant.hashes.planHash,
      scopeHash: grant.hashes.scopeHash,
      actionDigest: grant.hashes.actionDigest,
      nonceDigest: grant.approval.nonceDigest,
      proposalManifestDigest: grant.targetManifest.manifestDigest,
      proposalProcessEvidenceDigest: grant.hashes.processEvidenceDigest,
      issuedAt: grant.issuedAt,
      expiresAt: grant.expiresAt
    },
    repository: {
      path: grant.repository.path,
      branch: grant.repository.branch,
      commitSha: grant.repository.commitSha,
      worktreeSnapshotVersion: grant.repository.worktreeSnapshotVersion,
      baselineWorktreeSnapshotDigest: grant.repository.worktreeSnapshotDigest,
      currentWorktreeSnapshotDigest: grant.repository.worktreeSnapshotDigest
    },
    targetManifest,
    processEvidence: processes,
    executableIdentity,
    executor: {
      principalId: grant.principals.executor,
      binaryIdentityDigest: hex("1"),
      hostAttestationDigest: hex("2"),
      capabilities: ["RESOURCE_CLEANUP"],
      networkDenied: true,
      available: false
    },
    lease: {
      leaseId: "LEASE-RESOURCE-C01",
      taskId: grant.taskId,
      runId: "RUN-RESOURCE-C01",
      grantId: grant.grantId,
      executorPrincipalId: grant.principals.executor,
      state: "ACTIVE",
      path: grant.target.absolutePath,
      resource: `resource_cleanup:${grant.target.absolutePath}`,
      nonceDigest: hex("9"),
      expiresAt: "2026-07-20T15:04:00.000Z"
    },
    circuitSnapshot: {
      circuit: "resource_cleanup",
      state: "OPEN",
      backend: "POSTGRES",
      durable: true,
      observedAt: "2026-07-20T15:00:06.000Z",
      version: 1,
      snapshotDigest: hex("3")
    },
    replaySnapshot: {
      grantState: "ACTIVE",
      nonceState: "UNUSED",
      consumedAt: null,
      expectedVersion: 1,
      observedAt: "2026-07-20T15:00:07.000Z",
      snapshotDigest: hex("4"),
      authoritative: false,
      status: "STRUCTURAL_ONLY_NO_REPLAY_AUTHORITY"
    },
    operation: {
      parametersDigest: grant.operation.parametersDigest,
      environmentDigest: executableIdentity.environmentDigest,
      exactToolchainEnvironment: {
        name: "RUSTUP_TOOLCHAIN",
        value: executableIdentity.selectedTool.toolchainName,
        includedInPlanDigest: false
      }
    },
    resources: {
      filesystemDeviceId: grant.target.deviceId,
      currentFreeKiB: 18000000,
      targetAllocatedKiB: 3098816,
      worstCaseCleanupGrowthKiB: 0,
      projectedMinimumFreeKiB: 21000000
    },
    recovery: {
      sourceDigest: computeResourceCleanupRecoveryReferenceDigest("source", grant.recovery.sourceRef),
      procedureDigest: computeResourceCleanupRecoveryReferenceDigest("procedure", grant.recovery.procedureRef),
      networkRequired: false,
      installRequired: false,
      verifiedAt: "2026-07-20T15:00:04.000Z",
      checkerReceiptId: "RECEIPT-RECOVERY-CHECK-C01"
    },
    evidenceDigest: hex("0"),
    status: "STRUCTURALLY_VERIFIED_ONLY"
  };
  evidence.evidenceDigest = computeResourceCleanupActionTimeEvidenceDigest(evidence);
  return evidence;
}

function validAttempt(grant, evidence) {
  const attempt = {
    schemaVersion: "1.0-plan",
    attemptId: "ATTEMPT-RESOURCE-C01",
    effectKey: `resource_cleanup:${grant.grantId}`,
    ticketId: grant.ticketId,
    grantId: grant.grantId,
    taskId: grant.taskId,
    runId: evidence.runId,
    action: "RESOURCE_CLEANUP",
    circuit: "resource_cleanup",
    actionDigest: grant.hashes.actionDigest,
    admissionDigest: evidence.evidenceDigest,
    executorPrincipalId: grant.principals.executor,
    state: "PREPARED",
    expectedVersion: 1,
    createdAt: evidence.collectedAt,
    requestingAt: null,
    startedAt: null,
    processIdentity: null,
    finishedAt: null,
    exit: null,
    postReceiptId: null,
    retryCount: 0,
    automaticRetry: false,
    attemptDigest: hex("0"),
    status: "PLAN_ONLY_NO_DISPATCH"
  };
  attempt.attemptDigest = computeResourceCleanupEffectAttemptDigest(attempt);
  return attempt;
}

function postProcessEvidenceForTarget(grant) {
  return processEvidence(
    grant.target.absolutePath,
    "2026-07-20T15:00:12.500Z",
    "PE-POST-C01"
  );
}

function postTargetManifestForTarget(grant) {
  const entries = [{
    relativePath: "incremental",
    kind: "DIRECTORY",
    deviceId: grant.target.deviceId,
    inode: grant.target.inode + 2,
    mode: "040755",
    linkCount: 1,
    sizeBytes: 0,
    mtimeNs: "1784563212750000000",
    contentSha256: null,
    symlinkText: null
  }];
  const manifest = {
    schemaVersion: "1.0",
    manifestId: "TM-POST-C01",
    targetPath: grant.target.absolutePath,
    targetDeviceId: grant.target.deviceId,
    targetInode: grant.target.inode,
    canonicalEncoding: "sorted-nul-v1",
    entries,
    entryCount: entries.length,
    totalSizeBytes: 0,
    entriesDigest: computeTargetManifestEntriesDigest(entries),
    manifestDigest: hex("0"),
    containsSpecialFiles: false,
    containsEscapingSymlinks: false,
    incompleteHardlinkSets: false,
    generatedAt: "2026-07-20T15:00:12.750Z",
    status: "VERIFIED_MATCH"
  };
  manifest.manifestDigest = computeTargetManifestDigest(manifest);
  return manifest;
}

function checkerReceiptFor(receipt) {
  return {
    receiptId: receipt.verification.verificationReceiptId,
    taskId: receipt.taskId,
    principalId: receipt.verification.checkerPrincipalId,
    result: "PASS",
    actionDigest: receipt.bindings.actionDigest,
    artifactDigests: [receipt.verification.evidenceDigest]
  };
}

function validPassReceipt(grant, evidence, attempt) {
  const postProcesses = postProcessEvidenceForTarget(grant);
  const postManifest = postTargetManifestForTarget(grant);
  const receipt = {
    schemaVersion: "1.0",
    status: "STRUCTURAL_ONLY_NO_AUTHORITY",
    receiptId: "RECEIPT-RESOURCE-C01",
    artifactId: "ARTIFACT-RESOURCE-C01",
    attemptId: attempt.attemptId,
    effectKey: attempt.effectKey,
    ticketId: grant.ticketId,
    grantId: grant.grantId,
    taskId: grant.taskId,
    runId: evidence.runId,
    action: "RESOURCE_CLEANUP",
    circuit: "resource_cleanup",
    verdict: "PASS",
    effectState: "CONFIRMED",
    bindings: {
      planHash: grant.hashes.planHash,
      scopeHash: grant.hashes.scopeHash,
      actionDigest: grant.hashes.actionDigest,
      admissionDigest: evidence.evidenceDigest,
      nonceDigest: grant.approval.nonceDigest,
      executableIdentityDigest: evidence.executableIdentity.identityDigest,
      beforeManifestDigest: evidence.targetManifest.manifestDigest,
      beforeProcessDigest: evidence.processEvidence.snapshotDigest,
      beforeWorktreeDigest: evidence.repository.currentWorktreeSnapshotDigest
    },
    effect: {
      operationParametersDigest: evidence.operation.parametersDigest,
      environmentDigest: evidence.operation.environmentDigest,
      startedAt: "2026-07-20T15:00:11.000Z",
      endedAt: "2026-07-20T15:00:12.000Z",
      pid: 4242,
      processStartTime: "2026-07-20T15:00:11.000Z",
      exitCode: 0,
      signal: null,
      stdoutDigest: hex("1"),
      stdoutBytes: 128,
      stderrDigest: hex("2"),
      stderrBytes: 0,
      outputTruncated: false,
      timedOut: false,
      interruptionObserved: false
    },
    after: {
      observedAt: "2026-07-20T15:00:13.000Z",
      filesystemDeviceId: grant.target.deviceId,
      targetPath: grant.target.absolutePath,
      targetExists: true,
      targetDeviceId: grant.target.deviceId,
      targetInode: grant.target.inode,
      targetManifestDigest: postManifest.manifestDigest,
      targetAllocatedKiB: 98816,
      currentFreeKiB: 21000000,
      actualAffectedKiB: 3000000,
      actualReclaimedKiB: 3000000,
      processEvidenceDigest: postProcesses.snapshotDigest,
      worktreeSnapshotDigest: evidence.repository.currentWorktreeSnapshotDigest,
      exclusionsDigest: computeResourceCleanupExclusionsDigest(grant.exclusions),
      excludedPathsUnchanged: true,
      worktreeUnchanged: true,
      processEvidenceComplete: true,
      thresholdSatisfied: true,
      minReclaimSatisfied: true,
      impactBounded: true
    },
    verification: {
      makerPrincipalId: grant.principals.maker,
      checkerPrincipalId: grant.principals.checker,
      principalsDistinct: true,
      verificationReceiptId: "RECEIPT-RESOURCE-C01-CHECK",
      evidenceDigest: hex("6")
    },
    createdAt: "2026-07-20T15:00:14.000Z",
    receiptDigest: hex("0")
  };
  receipt.receiptDigest = computeResourceCleanupPostActionReceiptDigest(receipt);
  return receipt;
}

describe("resource cleanup executor admission contracts", () => {
  it("strictly compiles Draft 2020-12 schemas and validates positive and negative instances", async () => {
    const validators = await strictResourceCleanupSchemaValidators();
    const plan = await rawPlan();
    const grant = validGrant(plan);
    const evidence = validActionTimeEvidence(plan, grant);
    const attempt = validAttempt(grant, evidence);
    const receipt = validPassReceipt(grant, evidence, attempt);
    const instances = {
      executable: evidence.executableIdentity,
      actionTimeEvidence: evidence,
      effectAttempt: attempt,
      postActionReceipt: receipt
    };

    const newSchemas = [
      validators.schemas.executable,
      validators.schemas.actionTimeEvidence,
      validators.schemas.effectAttempt,
      validators.schemas.postActionReceipt
    ];
    expect(newSchemas.every((schema) => schema.additionalProperties === false)).toBe(true);
    expect(validators.schemas.effectAttempt.properties.state.const).toBe("PREPARED");
    expect(validators.schemas.effectAttempt.properties.automaticRetry.const).toBe(false);
    expect(validators.schemas.postActionReceipt.allOf).toHaveLength(1);

    for (const [name, instance] of Object.entries(instances)) {
      const validate = validators[name];
      expect(validate(instance), JSON.stringify(validate.errors)).toBe(true);
      const openInstance = structuredClone(instance);
      openInstance.unexpected = true;
      expect(validate(openInstance)).toBe(false);
    }

    const malformedTimestamp = structuredClone(instances.executable);
    malformedTimestamp.observedAt = "not-a-date-time";
    expect(validators.executable(malformedTimestamp)).toBe(false);

    const requestingAttempt = structuredClone(instances.effectAttempt);
    requestingAttempt.state = "REQUESTING";
    expect(validators.effectAttempt(requestingAttempt)).toBe(false);

    const openTargetManifest = structuredClone(instances.actionTimeEvidence);
    openTargetManifest.targetManifest.entries[0].unexpected = true;
    expect(validators.actionTimeEvidence(openTargetManifest)).toBe(false);

    const malformedProcessEvidence = structuredClone(instances.actionTimeEvidence);
    malformedProcessEvidence.processEvidence.capturedAt = "not-a-date-time";
    expect(validators.actionTimeEvidence(malformedProcessEvidence)).toBe(false);

    const falsePass = structuredClone(instances.postActionReceipt);
    falsePass.effect.exitCode = 1;
    expect(validators.postActionReceipt(falsePass)).toBe(false);
  });

  it("validates structural identity/evidence/PREPARED attempt but always holds dispatch", async () => {
    const plan = await rawPlan();
    const grant = validGrant(plan);
    const evidence = validActionTimeEvidence(plan, grant);
    const attempt = validAttempt(grant, evidence);
    expect(validateExecutableIdentityV1(evidence.executableIdentity, {
      plan, now: fixedNow, notBefore: grant.issuedAt, maxAgeSeconds: 60
    })).toBe(evidence.executableIdentity);
    expect(validateResourceCleanupActionTimeEvidenceV1(evidence, plan, grant, { now: fixedNow })).toBe(evidence);
    expect(validateResourceCleanupEffectAttemptV1(attempt, grant, evidence)).toBe(attempt);

    const result = evaluateResourceCleanupExecutorAdmission({ plan, grant, actionTimeEvidence: evidence, effectAttempt: attempt, now: fixedNow });
    expect(result).toMatchObject({
      status: "HOLD",
      effectState: "PREPARED",
      readOnly: true,
      mutations: false,
      commandExecuted: false,
      cleanupExecuted: false,
      executorAvailable: false,
      approvalConsumed: false,
      replayProtectionAvailable: false,
      authorityValidated: false,
      canDispatch: false,
      eligibleForExecutorHandoff: false,
      nextEffectState: null,
      automaticRetry: false,
      actionTimeEvidenceValidated: true,
      effectAttemptValidated: true
    });
    expect(result.blockers).toEqual(expect.arrayContaining([
      "executable_identity_not_bound_in_grant",
      "exact_toolchain_selector_not_bound_in_plan",
      "cleanup_authority_unavailable",
      "resource_cleanup_circuit_hold",
      "cleanup_replay_protection_unavailable",
      "resource_cleanup_executor_unavailable",
      "cleanup_dispatch_disabled"
    ]));
  });

  it("rejects launcher, selected Cargo, parent, selector, revision, and digest drift", async () => {
    const plan = await rawPlan();
    const cases = [
      (identity) => { identity.symlinkChain[0].linkText = "other"; },
      (identity) => { identity.parentDirectories[0].node.mode = "040777"; },
      (identity) => { identity.resolvedNode.inode = "999"; },
      (identity) => { identity.selectedTool.selectedCargoExecutable.path = "/tmp/cargo"; },
      (identity) => {
        identity.selectedTool.selectedCargoExecutable.path =
          "/tmp/1.88.0-aarch64-apple-darwin/bin/cargo";
      },
      (identity) => {
        identity.parentDirectories = identity.parentDirectories.filter(
          (directory) => directory.path !== "/Users/sirinx/.rustup/toolchains"
        );
      },
      (identity) => { identity.selectedTool.cargoRevision.commitHash = hex("f", 40); },
      (identity) => { identity.selectedTool.repositorySelector.node.inode = "999"; },
      (identity) => { identity.selectedTool.exactToolchainEnvironment.value = "other"; },
      (identity) => { identity.binary.contentSha256 = hex("0"); }
    ];
    for (const mutate of cases) {
      const identity = validExecutableIdentity(plan);
      mutate(identity);
      expect(() => validateExecutableIdentityV1(identity, { plan, now: fixedNow })).toThrow(/^invalid_resource_cleanup_admission:/);
    }

    const mutableAlias = validExecutableIdentity(plan);
    mutableAlias.selectedTool.toolchainName = "stable-aarch64-apple-darwin";
    mutableAlias.selectedTool.exactToolchainEnvironment.value = mutableAlias.selectedTool.toolchainName;
    mutableAlias.selectedTool.selectedCargoExecutable.path =
      "/Users/sirinx/.rustup/toolchains/stable-aarch64-apple-darwin/bin/cargo";
    mutableAlias.identityDigest = computeExecutableIdentityDigest(mutableAlias);
    expect(() => validateExecutableIdentityV1(mutableAlias, { plan, now: fixedNow })).toThrow(
      /mutable_toolchain_alias/
    );
  });

  it("rejects stale, future, pre-grant, process, target, worktree, lease, and replay drift", async () => {
    const plan = await rawPlan();
    const grant = validGrant(plan);
    const cases = [
      [(evidence) => { evidence.collectedAt = "2026-07-20T14:59:54.000Z"; }, fixedNow, "before_grant"],
      [(evidence) => { evidence.collectedAt = "2026-07-20T15:00:11.000Z"; }, fixedNow, "from_future"],
      [(evidence) => { evidence.repository.currentWorktreeSnapshotDigest = hex("f"); }, fixedNow, "worktree_drift"],
      [(evidence) => { evidence.targetManifest.entries[0].sizeBytes += 1; }, fixedNow, "target_manifest"],
      [(evidence) => { evidence.processEvidence.capturedAt = "2026-07-20T14:59:54.000Z"; evidence.processEvidence.snapshotDigest = computeProcessEvidenceSnapshotDigest(evidence.processEvidence); }, fixedNow, "process_not_action_time"],
      [(evidence) => { evidence.lease.executorPrincipalId = "principal:other"; }, fixedNow, "lease_drift"],
      [(evidence) => { evidence.replaySnapshot.authoritative = true; }, fixedNow, "replay_not_structural_only"],
      [(evidence) => { evidence.recovery.sourceDigest = hex("f"); }, fixedNow, "recovery_binding_drift"],
      [(evidence) => { evidence.recovery.verifiedAt = "2026-07-20T14:59:54.000Z"; }, fixedNow, "recovery_time_order"]
    ];
    for (const [mutate, now, expected] of cases) {
      const evidence = validActionTimeEvidence(plan, grant);
      mutate(evidence);
      evidence.evidenceDigest = computeResourceCleanupActionTimeEvidenceDigest(evidence);
      expect(() => validateResourceCleanupActionTimeEvidenceV1(evidence, plan, grant, { now })).toThrow(
        new RegExp(expected)
      );
    }

    const stale = validActionTimeEvidence(plan, grant);
    const staleNow = new Date("2026-07-20T15:01:11.000Z");
    expect(() => validateResourceCleanupActionTimeEvidenceV1(stale, plan, grant, { now: staleNow })).toThrow(
      /stale/
    );
  });

  it("models closed transitions, forbids REQUESTING here, and makes uncertain effects terminal", () => {
    expect(validateCleanupEffectTransition("PREPARED", "BLOCKED")).toMatchObject({ availableInThisSlice: true });
    expect(getCleanupEffectTransitionDecision("PREPARED", "REQUESTING")).toEqual({
      from: "PREPARED",
      to: "REQUESTING",
      protocolAllowed: true,
      availableInThisSlice: false,
      requiresDurableRequesting: true,
      automaticRetry: false
    });
    expect(() => validateCleanupEffectTransition("PREPARED", "REQUESTING")).toThrow(/runtime_unavailable/);
    expect(() => validateCleanupEffectTransition("PREPARED", "VERIFYING")).toThrow(/skipped_or_terminal/);
    expect(() => validateCleanupEffectTransition("REQUESTING", "PREPARED")).toThrow(/skipped_or_terminal/);
    expect(() => validateCleanupEffectTransition("EFFECT_UNKNOWN", "REQUESTING")).toThrow(/skipped_or_terminal/);
    expect(classifyCleanupEffectInterruption("PREPARED")).toBe("CANCELED");
    for (const state of ["REQUESTING", "RUNNING", "VERIFYING"]) {
      expect(classifyCleanupEffectInterruption(state)).toBe("EFFECT_UNKNOWN");
    }
    expect(classifyCleanupEffectInterruption("EFFECT_UNKNOWN")).toBe("EFFECT_UNKNOWN");
  });

  it("accepts only a PREPARED plan attempt and rejects retry or effect-state claims", async () => {
    const plan = await rawPlan();
    const grant = validGrant(plan);
    const evidence = validActionTimeEvidence(plan, grant);
    for (const mutate of [
      (attempt) => { attempt.state = "REQUESTING"; attempt.requestingAt = evidence.collectedAt; },
      (attempt) => { attempt.retryCount = 1; },
      (attempt) => { attempt.automaticRetry = true; },
      (attempt) => { attempt.expectedVersion = 2; },
      (attempt) => { attempt.admissionDigest = hex("f"); }
    ]) {
      const attempt = validAttempt(grant, evidence);
      mutate(attempt);
      attempt.attemptDigest = computeResourceCleanupEffectAttemptDigest(attempt);
      expect(() => validateResourceCleanupEffectAttemptV1(attempt, grant, evidence)).toThrow(
        /^invalid_resource_cleanup_admission:/
      );
    }
  });

  it("validates a structural post-action PASS and rejects every false-PASS variant", async () => {
    const plan = await rawPlan();
    const grant = validGrant(plan);
    const evidence = validActionTimeEvidence(plan, grant);
    const attempt = validAttempt(grant, evidence);
    const postProcessEvidence = postProcessEvidenceForTarget(grant);
    const postTargetManifest = postTargetManifestForTarget(grant);
    const pass = validPassReceipt(grant, evidence, attempt);
    const checkerReceipt = checkerReceiptFor(pass);
    expect(() => validateResourceCleanupPostActionReceiptV1(pass)).toThrow(/pass_requires_bound_context/);
    expect(validateResourceCleanupPostActionReceiptV1(pass, {
      plan, grant, evidence, attempt, postProcessEvidence, postTargetManifest, checkerReceipt
    })).toBe(pass);

    const cases = [
      (receipt) => { receipt.effect.exitCode = 1; },
      (receipt) => { receipt.effect.timedOut = true; },
      (receipt) => { receipt.effect.interruptionObserved = true; },
      (receipt) => { receipt.effect.outputTruncated = true; },
      (receipt) => { receipt.after.worktreeUnchanged = false; },
      (receipt) => { receipt.after.excludedPathsUnchanged = false; },
      (receipt) => { receipt.after.processEvidenceComplete = false; },
      (receipt) => { receipt.after.thresholdSatisfied = false; },
      (receipt) => { receipt.after.minReclaimSatisfied = false; },
      (receipt) => { receipt.after.impactBounded = false; },
      (receipt) => { receipt.verification.checkerPrincipalId = receipt.verification.makerPrincipalId; },
      (receipt) => { receipt.verification.verificationReceiptId = receipt.receiptId; },
      (receipt) => { receipt.after.filesystemDeviceId += 1; },
      (receipt) => { receipt.after.targetInode += 1; },
      (receipt) => { receipt.after.actualReclaimedKiB -= 1; },
      (receipt) => { receipt.after.targetExists = false; }
    ];
    for (const mutate of cases) {
      const receipt = validPassReceipt(grant, evidence, attempt);
      mutate(receipt);
      receipt.receiptDigest = computeResourceCleanupPostActionReceiptDigest(receipt);
      expect(() => validateResourceCleanupPostActionReceiptV1(receipt, {
        plan, grant, evidence, attempt, postProcessEvidence, postTargetManifest, checkerReceipt
      })).toThrow(
        /^invalid_resource_cleanup_admission:/
      );
    }

    const processOrder = validPassReceipt(grant, evidence, attempt);
    processOrder.effect.processStartTime = "2026-07-20T15:00:10.000Z";
    processOrder.receiptDigest = computeResourceCleanupPostActionReceiptDigest(processOrder);
    expect(() => validateResourceCleanupPostActionReceiptV1(processOrder, {
      plan, grant, evidence, attempt, postProcessEvidence, postTargetManifest, checkerReceipt
    })).toThrow(/process_time_order/);

    const readbackOrder = validPassReceipt(grant, evidence, attempt);
    readbackOrder.after.observedAt = "2026-07-20T15:00:11.500Z";
    readbackOrder.createdAt = "2026-07-20T15:00:14.000Z";
    readbackOrder.receiptDigest = computeResourceCleanupPostActionReceiptDigest(readbackOrder);
    expect(() => validateResourceCleanupPostActionReceiptV1(readbackOrder, {
      plan, grant, evidence, attempt, postProcessEvidence, postTargetManifest, checkerReceipt
    })).toThrow(/readback_before_effect_end/);
  });

  it("represents a crash before spawn only as EFFECT_UNKNOWN with nullable process times", async () => {
    const plan = await rawPlan();
    const grant = validGrant(plan);
    const evidence = validActionTimeEvidence(plan, grant);
    const attempt = validAttempt(grant, evidence);
    const receipt = validPassReceipt(grant, evidence, attempt);
    receipt.verdict = "EFFECT_UNKNOWN";
    receipt.effectState = "EFFECT_UNKNOWN";
    receipt.effect.startedAt = null;
    receipt.effect.endedAt = null;
    receipt.effect.pid = null;
    receipt.effect.processStartTime = null;
    receipt.effect.exitCode = null;
    receipt.effect.interruptionObserved = true;
    receipt.after.processEvidenceComplete = false;
    receipt.after.thresholdSatisfied = false;
    receipt.after.minReclaimSatisfied = false;
    receipt.receiptDigest = computeResourceCleanupPostActionReceiptDigest(receipt);
    expect(validateResourceCleanupPostActionReceiptV1(receipt, { grant, evidence, attempt })).toBe(receipt);
  });

  it("contains no route, network, process-start, collector, or filesystem-mutation primitive", async () => {
    const source = await readFile(new URL("./resource-cleanup-admission.mjs", import.meta.url), "utf8");
    expect(source).not.toMatch(/node:child_process/);
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/\b(?:spawn|exec|execFile|fork|writeFile|appendFile|mkdir|rm|rmdir|unlink|rename|truncate)\s*\(/);
    expect(source).not.toMatch(/\.canDispatch\s*=\s*true/);
    expect(source).not.toMatch(/executorAvailable:\s*true/);
    expect(source).not.toMatch(/approvalConsumed:\s*true/);
    expect(source).not.toMatch(/\.route\s*\(/);
  });
});

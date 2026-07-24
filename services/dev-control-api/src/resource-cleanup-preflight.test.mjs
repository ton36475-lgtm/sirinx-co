import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  RESOURCE_CLEANUP_APPROVAL_SCHEMA_URL,
  RESOURCE_CLEANUP_PLAN_SCHEMA_URL,
  RESOURCE_CLEANUP_PLAN_URL,
  PROCESS_EVIDENCE_SCHEMA_URL,
  TARGET_MANIFEST_SCHEMA_URL,
  computeProcessEvidenceSnapshotDigest,
  computeResourceCleanupActionDigest,
  computeResourceCleanupOperationParametersDigest,
  computeResourceCleanupPlanHash,
  computeResourceCleanupScopeHash,
  computeTargetManifestEntriesDigest,
  computeTargetManifestDigest,
  evaluateResourceCleanupPreflight,
  getResourceCleanupPreflight,
  validateLiteralCleanupTarget,
  validateProcessEvidenceV1,
  validateResourceCleanupEvidence,
  validateResourceCleanupGrant,
  validateResourceCleanupPlan,
  validateTargetManifestV1
} from "./resource-cleanup-preflight.mjs";

const fixedNow = new Date("2026-07-20T15:00:00.000Z");
const hex = (character, length = 64) => character.repeat(length);

async function rawPlan() {
  return JSON.parse(await readFile(RESOURCE_CLEANUP_PLAN_URL, "utf8"));
}

function targetManifestForTarget(target) {
  const entries = [
    {
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
    }
  ];
  const manifest = {
    schemaVersion: "1.0",
    manifestId: "TM-RESOURCE-C01",
    targetPath: target.absolutePath,
    targetDeviceId: target.deviceId,
    targetInode: target.inode,
    canonicalEncoding: "sorted-nul-v1",
    entries,
    entryCount: entries.length,
    totalSizeBytes: entries.reduce((total, entry) => total + entry.sizeBytes, 0),
    entriesDigest: computeTargetManifestEntriesDigest(entries),
    manifestDigest: hex("0"),
    containsSpecialFiles: false,
    containsEscapingSymlinks: false,
    incompleteHardlinkSets: false,
    generatedAt: "2026-07-20T14:59:45.000Z",
    status: "VERIFIED_MATCH"
  };
  manifest.manifestDigest = computeTargetManifestDigest(manifest);
  return manifest;
}

function processEvidenceForTarget(targetPath) {
  const processEvidence = {
    schemaVersion: "1.0",
    snapshotId: "PE-RESOURCE-C01",
    targetPath,
    capturedAt: "2026-07-20T14:59:50.000Z",
    source: "LOCAL_PROCESS_SNAPSHOT",
    complete: true,
    entries: [],
    activeConsumers: 0,
    snapshotDigest: hex("0"),
    status: "VERIFIED_MATCH"
  };
  processEvidence.snapshotDigest = computeProcessEvidenceSnapshotDigest(processEvidence);
  return processEvidence;
}

function validGrant(plan) {
  const target = {
    absolutePath: "/Users/sirinx/SIRINXDev/sirinx-co/target",
    class: "GENERATED_BUILD_OUTPUT",
    deviceId: 16777232,
    inode: 123456
  };
  const targetManifest = targetManifestForTarget(target);
  const processEvidence = processEvidenceForTarget(target.absolutePath);
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
      processEvidenceDigest: processEvidence.snapshotDigest
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
      manifestId: targetManifest.manifestId,
      entriesDigest: targetManifest.entriesDigest,
      manifestDigest: targetManifest.manifestDigest,
      entryCount: targetManifest.entryCount,
      totalSizeBytes: targetManifest.totalSizeBytes,
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

function validEvidence(grant) {
  return {
    observedAt: "2026-07-20T15:00:00.000Z",
    currentFreeKiB: 18000000,
    filesystemDeviceId: grant.target.deviceId,
    targetPath: grant.target.absolutePath,
    targetRealPath: grant.target.absolutePath,
    targetExists: true,
    targetType: "DIRECTORY",
    targetIsSymlink: false,
    targetDeviceId: grant.target.deviceId,
    targetInode: grant.target.inode,
    targetManifestVersion: grant.targetManifest.schemaVersion,
    targetManifestDigest: grant.targetManifest.manifestDigest,
    targetEntriesDigest: grant.targetManifest.entriesDigest,
    targetEntryCount: grant.targetManifest.entryCount,
    targetTotalSizeBytes: grant.targetManifest.totalSizeBytes,
    targetAllocatedKiB: 3098816,
    containsSpecialFiles: false,
    containsEscapingSymlinks: false,
    incompleteHardlinkSets: false,
    activeConsumers: 0,
    processEvidenceComplete: true,
    processEvidenceDigest: grant.hashes.processEvidenceDigest,
    operationParametersDigest: grant.operation.parametersDigest,
    recoverySourceVerified: true,
    recoveryProcedureVerified: true,
    repositoryPath: grant.repository.path,
    repositoryBranch: grant.repository.branch,
    repositoryCommitSha: grant.repository.commitSha,
    gitIgnored: true,
    gitTracked: false,
    worktreeSnapshotVersion: grant.repository.worktreeSnapshotVersion,
    worktreeSnapshotDigest: grant.repository.worktreeSnapshotDigest,
    exclusionOverlap: false
  };
}

describe("resource cleanup v2 plan", () => {
  it("loads a closed NO_GRANT/CIRCUIT_HOLD plan with no execution surface", async () => {
    const plan = await rawPlan();
    expect(validateResourceCleanupPlan(plan)).toBe(plan);

    const result = await getResourceCleanupPreflight({ now: fixedNow });
    expect(result).toMatchObject({
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
      grantStructureValidated: false,
      evidenceStructureValidated: false,
      targetManifestValidated: false,
      processEvidenceValidated: false,
      authorityValidated: false,
      admissionValidated: false
    });
    expect(result.blockers).toEqual(
      expect.arrayContaining([
        "cleanup_authority_unavailable",
        "cleanup_grant_absent",
        "cleanup_evidence_absent",
        "target_manifest_absent",
        "process_evidence_absent",
        "resource_cleanup_circuit_hold",
        "resource_cleanup_executor_unavailable",
        "cleanup_replay_protection_unavailable"
      ])
    );
  });

  it("rejects any plan that advertises a grant, open circuit, executor, execution, Trash reclaim, or continuation", async () => {
    const base = await rawPlan();
    const mutations = [
      (plan) => { plan.runtime.grantPresent = true; },
      (plan) => { plan.runtime.circuitState = "OPEN"; },
      (plan) => { plan.runtime.executorAvailable = true; },
      (plan) => { plan.runtime.replayProtectionAvailable = true; },
      (plan) => { plan.runtime.canExecute = true; },
      (plan) => { plan.safety.sameFilesystemTrashReclaimKiB = 1; },
      (plan) => { plan.safety.automaticContinuation = true; },
      (plan) => { plan.repositoryPath = "/Users/sirinx/SIRINXDev/other"; },
      (plan) => { plan.candidateTargets[0].absolutePath = "/Users/sirinx/Documents"; },
      (plan) => { plan.operationPreview.environment.inherit = true; },
      (plan) => { plan.authority.approvalAuthority = "self-approved-agent"; },
      (plan) => { plan.extra = true; }
    ];

    for (const mutate of mutations) {
      const plan = structuredClone(base);
      mutate(plan);
      expect(() => validateResourceCleanupPlan(plan)).toThrow(/^invalid_resource_cleanup_preflight:/);
    }
  });

  it("keeps the four closed JSON Schemas parseable, aligned, and v1 unchanged", async () => {
    const [planSchema, approvalSchema, manifestSchema, processSchema, approvalV1] = await Promise.all([
      readFile(RESOURCE_CLEANUP_PLAN_SCHEMA_URL, "utf8"),
      readFile(RESOURCE_CLEANUP_APPROVAL_SCHEMA_URL, "utf8"),
      readFile(TARGET_MANIFEST_SCHEMA_URL, "utf8"),
      readFile(PROCESS_EVIDENCE_SCHEMA_URL, "utf8"),
      readFile(new URL("../../../schemas/agent-runtime/approval-receipt.v1.schema.json", import.meta.url), "utf8")
    ]);
    expect(() => JSON.parse(planSchema)).not.toThrow();
    expect(() => JSON.parse(approvalSchema)).not.toThrow();
    expect(() => JSON.parse(manifestSchema)).not.toThrow();
    expect(() => JSON.parse(processSchema)).not.toThrow();
    expect(JSON.parse(approvalSchema).properties.action.const).toBe("RESOURCE_CLEANUP");
    expect(JSON.parse(approvalSchema).properties.circuit.const).toBe("resource_cleanup");
    expect(JSON.parse(approvalSchema).properties.status.const).toBe("ISSUED");
    expect(JSON.parse(approvalSchema).properties.consumedAt).toBeUndefined();
    expect(JSON.parse(processSchema).properties.complete.const).toBe(true);
    expect(JSON.parse(approvalV1).properties.action.enum).not.toContain("RESOURCE_CLEANUP");
  });
});

describe("resource cleanup v2 grant validation", () => {
  it("accepts one structurally complete, single-use, distinct-principal plan grant", async () => {
    const plan = await rawPlan();
    const grant = validGrant(plan);
    expect(validateResourceCleanupGrant(grant, plan, { now: fixedNow })).toBe(grant);
  });

  it("rejects root, home, repository root, glob, traversal, protected, and non-absolute targets", async () => {
    const plan = await rawPlan();
    const invalid = [
      "/",
      "/Users/sirinx",
      "/Users/sirinx/SIRINXDev/sirinx-co",
      "/Users/sirinx/SIRINXDev/sirinx-co/target*",
      "/Users/sirinx/SIRINXDev/sirinx-co/../sirinx-co/target",
      "/Users/sirinx/.hermes/cache",
      "/Users/sirinx/SIRINXDev/sirinx-co/.git/objects",
      "target"
    ];
    for (const target of invalid) {
      expect(() => validateLiteralCleanupTarget(target, plan)).toThrow(/^invalid_resource_cleanup_preflight:/);
    }
  });

  it("rejects authority drift, unplanned scope, unsafe exclusions, and non-allowlisted operations", async () => {
    const plan = await rawPlan();
    const cases = [
      (grant) => { grant.extra = true; },
      (grant) => { grant.principals.checker = grant.principals.maker; },
      (grant) => { grant.circuit = "deploy"; },
      (grant) => { grant.hashes.scopeHash = hex("f"); },
      (grant) => { grant.hashes.actionDigest = hex("f"); },
      (grant) => { grant.hashes.planHash = hex("f"); },
      (grant) => { grant.repository.path = "/Users/sirinx/SIRINXDev/other"; },
      (grant) => { grant.target.absolutePath = "/Users/sirinx/SIRINXDev/sirinx-co/build"; },
      (grant) => { grant.exclusions.push(`${grant.target.absolutePath}/keep`); },
      (grant) => { grant.exclusions[0] = "/Users/sirinx/*"; },
      (grant) => { grant.operation.toolId = "rm -rf"; },
      (grant) => { grant.expiresAt = "2026-07-20T15:05:00.000Z"; },
      (grant) => { grant.expiresAt = "2026-07-20T14:59:30.000Z"; },
      (grant) => {
        grant.operation = {
          kind: "OFF_FILESYSTEM_TRANSFER",
          toolId: null,
          parametersDigest: hex("7"),
          destinationDeviceId: grant.target.deviceId
        };
      }
    ];
    for (const mutate of cases) {
      const grant = validGrant(plan);
      mutate(grant);
      expect(() => validateResourceCleanupGrant(grant, plan, { now: fixedNow })).toThrow(/^invalid_resource_cleanup_preflight:/);
    }
  });
});

describe("resource cleanup read-only evidence preflight", () => {
  it("validates complete evidence but still cannot execute without runtime authority", async () => {
    const plan = await rawPlan();
    const grant = validGrant(plan);
    const evidence = validEvidence(grant);
    const targetManifest = targetManifestForTarget(grant.target);
    const processEvidence = processEvidenceForTarget(grant.target.absolutePath);
    expect(validateResourceCleanupEvidence(evidence)).toBe(evidence);
    expect(validateTargetManifestV1(targetManifest)).toBe(targetManifest);
    expect(validateProcessEvidenceV1(processEvidence)).toBe(processEvidence);

    const result = evaluateResourceCleanupPreflight({
      plan,
      grant,
      evidence,
      targetManifest,
      processEvidence,
      now: fixedNow
    });
    expect(result.grantStructureValidated).toBe(true);
    expect(result.evidenceStructureValidated).toBe(true);
    expect(result.targetManifestValidated).toBe(true);
    expect(result.processEvidenceValidated).toBe(true);
    expect(result.authorityValidated).toBe(false);
    expect(result.admissionValidated).toBe(false);
    expect(result.canExecute).toBe(false);
    expect(result.eligibleForExecutorHandoff).toBe(false);
    expect(result.cleanupExecuted).toBe(false);
    expect(result.approvalConsumed).toBe(false);
    expect(result.blockers).toEqual([
      "cleanup_authority_unavailable",
      "resource_cleanup_circuit_hold",
      "resource_cleanup_executor_unavailable",
      "cleanup_replay_protection_unavailable"
    ]);
  });

  it("maps target/process/manifest/worktree/recovery/resource failures to stable blockers", async () => {
    const plan = await rawPlan();
    const mutations = [
      [(evidence) => { evidence.targetIsSymlink = true; }, "target_path_symlink"],
      [(evidence) => { evidence.targetInode += 1; }, "target_identity_changed"],
      [(evidence) => { evidence.processEvidenceComplete = false; }, "process_evidence_unavailable"],
      [(evidence) => { evidence.processEvidenceDigest = hex("9"); }, "process_evidence_drift"],
      [(evidence) => { evidence.activeConsumers = 1; }, "target_active_consumer"],
      [(evidence) => { evidence.repositoryCommitSha = hex("9", 40); }, "repository_identity_drift"],
      [(evidence) => { evidence.gitIgnored = false; }, "target_not_verified_regenerable"],
      [(evidence) => { evidence.containsSpecialFiles = true; }, "target_manifest_special_file"],
      [(evidence) => { evidence.containsEscapingSymlinks = true; }, "target_manifest_symlink_unreviewed"],
      [(evidence) => { evidence.incompleteHardlinkSets = true; }, "target_manifest_external_hardlink"],
      [(evidence) => { evidence.exclusionOverlap = true; }, "target_excluded"],
      [(evidence) => { evidence.recoverySourceVerified = false; }, "recovery_source_unverified"],
      [(evidence) => { evidence.recoveryProcedureVerified = false; }, "recovery_procedure_unverified"],
      [(evidence) => { evidence.operationParametersDigest = hex("9"); }, "operation_preview_drift"],
      [(evidence) => { evidence.observedAt = "2026-07-20T14:58:59.000Z"; }, "evidence_stale"],
      [(evidence) => { evidence.observedAt = "2026-07-20T15:00:01.000Z"; }, "evidence_from_future"],
      [(evidence) => { evidence.targetManifestDigest = hex("9"); }, "target_manifest_drift"],
      [(evidence) => { evidence.worktreeSnapshotDigest = hex("9"); }, "worktree_manifest_drift"],
      [(evidence) => { evidence.targetAllocatedKiB = 3200001; }, "target_allocation_exceeds_limit"],
      [(evidence) => { evidence.targetAllocatedKiB = 2999999; }, "minimum_reclaim_exceeds_allocation"],
      [(evidence) => { evidence.currentFreeKiB = 5000000; }, "cleanup_start_margin_insufficient"],
      [(evidence) => { evidence.currentFreeKiB = 17000000; }, "projected_reclaim_below_threshold"]
    ];

    for (const [mutate, expected] of mutations) {
      const grant = validGrant(plan);
      const evidence = validEvidence(grant);
      const targetManifest = targetManifestForTarget(grant.target);
      const processEvidence = processEvidenceForTarget(grant.target.absolutePath);
      mutate(evidence);
      const result = evaluateResourceCleanupPreflight({
        plan,
        grant,
        evidence,
        targetManifest,
        processEvidence,
        now: fixedNow
      });
      expect(result.blockers).toContain(expected);
      expect(result.canExecute).toBe(false);
      expect(result.commandExecuted).toBe(false);
    }
  });

  it("recomputes full manifest and process snapshots before reporting structural validity", async () => {
    const plan = await rawPlan();
    const grant = validGrant(plan);
    const evidence = validEvidence(grant);

    const driftedManifest = targetManifestForTarget(grant.target);
    driftedManifest.entries[0].sizeBytes += 1;
    const manifestResult = evaluateResourceCleanupPreflight({
      plan,
      grant,
      evidence,
      targetManifest: driftedManifest,
      processEvidence: processEvidenceForTarget(grant.target.absolutePath),
      now: fixedNow
    });
    expect(manifestResult.targetManifestValidated).toBe(false);
    expect(manifestResult.blockers).toContain("target_manifest_total_size_mismatch");

    const caseVariantEscape = targetManifestForTarget(grant.target);
    caseVariantEscape.entries = [
      {
        relativePath: "alias",
        kind: "SYMLINK",
        deviceId: grant.target.deviceId,
        inode: grant.target.inode + 2,
        mode: "120777",
        linkCount: 1,
        sizeBytes: 0,
        mtimeNs: "1784563185000000000",
        contentSha256: null,
        symlinkText: "../TARGET/file"
      }
    ];
    caseVariantEscape.entryCount = 1;
    caseVariantEscape.totalSizeBytes = 0;
    caseVariantEscape.entriesDigest =
      computeTargetManifestEntriesDigest(caseVariantEscape.entries);
    caseVariantEscape.manifestDigest = computeTargetManifestDigest(caseVariantEscape);
    expect(() => validateTargetManifestV1(caseVariantEscape)).toThrow(
      /target_manifest_escaping_symlink/
    );

    const activeProcessEvidence = processEvidenceForTarget(grant.target.absolutePath);
    activeProcessEvidence.entries = [
      {
        pid: 4242,
        parentPid: 1,
        processGroupId: 4242,
        startTime: "2026-07-20T14:59:40.000Z",
        executablePath: "/usr/bin/cargo",
        cwd: grant.target.absolutePath,
        commandDigest: hex("a"),
        targetReference: "CWD"
      }
    ];
    activeProcessEvidence.activeConsumers = 1;
    activeProcessEvidence.snapshotDigest = computeProcessEvidenceSnapshotDigest(activeProcessEvidence);
    const processResult = evaluateResourceCleanupPreflight({
      plan,
      grant,
      evidence,
      targetManifest: targetManifestForTarget(grant.target),
      processEvidence: activeProcessEvidence,
      now: fixedNow
    });
    expect(processResult.processEvidenceValidated).toBe(true);
    expect(processResult.blockers).toEqual(
      expect.arrayContaining(["process_evidence_drift", "target_active_consumer"])
    );
    expect(processResult.canExecute).toBe(false);

    const contradictoryProcessEvidence = processEvidenceForTarget(grant.target.absolutePath);
    contradictoryProcessEvidence.entries = [
      {
        pid: 4243,
        parentPid: 1,
        processGroupId: 4243,
        startTime: "2026-07-20T14:59:40.000Z",
        executablePath: "/usr/bin/zsh",
        cwd: grant.target.absolutePath,
        commandDigest: hex("b"),
        targetReference: "NONE"
      }
    ];
    contradictoryProcessEvidence.snapshotDigest =
      computeProcessEvidenceSnapshotDigest(contradictoryProcessEvidence);
    expect(() => validateProcessEvidenceV1(contradictoryProcessEvidence)).toThrow(
      /process_evidence_hidden_target_reference/
    );

    const oversizedProcessEvidence = processEvidenceForTarget(grant.target.absolutePath);
    oversizedProcessEvidence.entries = [
      {
        pid: 4244,
        parentPid: 1,
        processGroupId: 4244,
        startTime: "2026-07-20T14:59:40.000Z",
        executablePath: "/usr/bin/zsh",
        cwd: `/${"x".repeat(4097)}`,
        commandDigest: hex("c"),
        targetReference: "NONE"
      }
    ];
    oversizedProcessEvidence.snapshotDigest =
      computeProcessEvidenceSnapshotDigest(oversizedProcessEvidence);
    expect(() => validateProcessEvidenceV1(oversizedProcessEvidence)).toThrow(
      /process_evidence_cwd_invalid/
    );
  });

  it("contains no network, process-start, or filesystem-mutation primitive", async () => {
    const source = await readFile(new URL("./resource-cleanup-preflight.mjs", import.meta.url), "utf8");
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/node:child_process/);
    expect(source).not.toMatch(/\b(?:spawn|exec|execFile|writeFile|appendFile|mkdir|rm|rmdir|unlink|rename|truncate)\s*\(/);
    expect(source).not.toMatch(/\.canExecute\s*=\s*true/);
  });
});

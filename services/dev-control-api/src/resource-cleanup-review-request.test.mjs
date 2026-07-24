import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

import {
  RESOURCE_CLEANUP_CONSERVATIVE_TARGET_KIB,
  RESOURCE_CLEANUP_EMERGENCY_FLOOR_KIB,
  RESOURCE_CLEANUP_EXCLUSIONS_DIGEST,
  RESOURCE_CLEANUP_PLAN_FILE_SHA256,
  RESOURCE_CLEANUP_PLAN_HASH,
  RESOURCE_CLEANUP_PLAN_OPERATION_PARAMETERS_DIGEST,
  RESOURCE_CLEANUP_REVIEW_CLAIM_CEILING,
  RESOURCE_CLEANUP_REVIEW_REQUEST_SCHEMA_URL,
  RESOURCE_CLEANUP_REVIEW_STATUS,
  RESOURCE_CLEANUP_WORKLOAD_FLOOR_KIB,
  computeResourceCleanupReviewRequestDigest,
  requiredResourceCleanupReviewRequestBlockers,
  validateResourceCleanupReviewRequestV1
} from "./resource-cleanup-review-request.mjs";

const fixedNow = new Date("2026-07-21T00:00:30.000Z");
const hex = (character, length = 64) => character.repeat(length);
const CANONICAL_REQUEST_URL = new URL(
  "../../../config/agent-runtime/resource-cleanup.review-request.v1.json",
  import.meta.url
);

function syncArithmetic(request, { refreshBlockers = true } = {}) {
  request.limits.maxAffectedKiB = request.target.allocatedKiB;
  request.resources.filesystemDeviceId = request.target.deviceId;
  request.resources.targetAllocatedKiB = request.target.allocatedKiB;
  request.resources.targetLogicalKiB = request.target.logicalKiB;
  request.resources.projectedFreeKiB = request.resources.currentFreeKiB +
    request.target.allocatedKiB - request.limits.worstCaseCleanupGrowthKiB;
  request.resources.emergencyHeadroomKiB = request.resources.currentFreeKiB -
    RESOURCE_CLEANUP_EMERGENCY_FLOOR_KIB;
  request.resources.workloadHeadroomKiB = request.resources.projectedFreeKiB -
    RESOURCE_CLEANUP_WORKLOAD_FLOOR_KIB;
  request.resources.conservativeHeadroomKiB = request.resources.projectedFreeKiB -
    RESOURCE_CLEANUP_CONSERVATIVE_TARGET_KIB;
  if (refreshBlockers) request.blockers = [...requiredResourceCleanupReviewRequestBlockers(request)];
  request.requestDigest = computeResourceCleanupReviewRequestDigest(request);
  return request;
}

function reseal(request, { refreshBlockers = false } = {}) {
  if (refreshBlockers) request.blockers = [...requiredResourceCleanupReviewRequestBlockers(request)];
  request.requestDigest = computeResourceCleanupReviewRequestDigest(request);
  return request;
}

function validRequest() {
  const request = {
    schemaVersion: "1.0",
    requestId: "RCRR-C01-SYNTHETIC",
    taskId: "TASK-RESOURCE-RECOVERY",
    runId: "RUN-RESOURCE-REVIEW-001",
    action: "RESOURCE_CLEANUP",
    circuit: "resource_cleanup",
    status: RESOURCE_CLEANUP_REVIEW_STATUS,
    claimCeiling: RESOURCE_CLEANUP_REVIEW_CLAIM_CEILING,
    observedAt: "2026-07-21T00:00:00.000Z",
    expiresAt: "2026-07-21T00:30:00.000Z",
    planBinding: {
      planPath: "/Users/sirinx/SIRINXDev/sirinx-co/config/agent-runtime/resource-cleanup.plan-only.v2.json",
      planHash: RESOURCE_CLEANUP_PLAN_HASH,
      planFileSha256: RESOURCE_CLEANUP_PLAN_FILE_SHA256
    },
    principals: {
      requester: "principal:review-requester",
      maker: "principal:ronin-41",
      checker: "principal:ronin-42",
      proposedHumanApprover: "principal:human-operator-unattested",
      proposedExecutor: "principal:resource-cleanup-executor-unavailable"
    },
    exclusionsDigest: RESOURCE_CLEANUP_EXCLUSIONS_DIGEST,
    limits: {
      maxCalls: 1,
      maxCostUsd: 0,
      maxRuntimeSeconds: 600,
      maxAffectedKiB: 3_125_988,
      worstCaseCleanupGrowthKiB: 0,
      emergencyFloorKiB: RESOURCE_CLEANUP_EMERGENCY_FLOOR_KIB,
      requiredPostFreeKiB: RESOURCE_CLEANUP_WORKLOAD_FLOOR_KIB
    },
    repository: {
      path: "/Users/sirinx/SIRINXDev/sirinx-co",
      branch: "agent/synthetic-review",
      headSha: hex("2", 40),
      statusFormat: "GIT_STATUS_PORCELAIN_V2_Z_PROTECTED_CONTENT_EXCLUDED_V1",
      statusEntryCount: 256,
      statusDigest: hex("3")
    },
    target: {
      path: "/Users/sirinx/SIRINXDev/sirinx-co/target",
      realPath: "/Users/sirinx/SIRINXDev/sirinx-co/target",
      kind: "DIRECTORY",
      isSymlink: false,
      deviceId: 16_777_232,
      inode: 35_550_880,
      mode: "0755",
      linkCount: 6,
      descendantEntries: 27_787,
      immediateEntries: 4,
      regularFileEntries: 26_826,
      directoryEntries: 961,
      symlinkEntries: 0,
      specialEntries: 0,
      hardlinkEntries: 18_716,
      hardlinkGroups: 5_492,
      hardlinkAliasesInsideTarget: 13_224,
      incompleteHardlinkGroups: 0,
      allocatedKiB: 3_125_988,
      logicalKiB: 3_098_930,
      metadataScope: "LSTAT_METADATA_ONLY_NO_CONTENT_MANIFEST",
      metadataDigest: hex("4")
    },
    processObservation: {
      source: "LSOF_TARGET_PREFIX_OBSERVATION",
      targetPath: "/Users/sirinx/SIRINXDev/sirinx-co/target",
      scope: "EXACT_TARGET_PATH_OR_DESCENDANT_PREFIX",
      visibility: "CURRENT_USER_VISIBLE_PROCESSES_ONLY",
      visibilityLimited: true,
      recordLimit: 16_384,
      matchingRecordCount: 0,
      distinctMatchingProcessCount: 0,
      outputTruncated: false,
      completeProcessEvidenceV1: false,
      zeroMatchesProvesNoConsumers: false,
      observationDigest: hex("5")
    },
    tooling: {
      cargoInvocation: {
        path: "/Users/sirinx/.cargo/bin/cargo",
        kind: "SYMLINK",
        deviceId: 16_777_232,
        inode: 30_862_423,
        mode: "120777",
        linkCount: 1,
        sizeBytes: 6,
        linkText: "rustup",
        metadataDigest: hex("6")
      },
      rustupProxy: {
        path: "/Users/sirinx/.cargo/bin/rustup",
        kind: "REGULAR_FILE",
        deviceId: 16_777_232,
        inode: 30_862_417,
        mode: "100755",
        linkCount: 1,
        sizeBytes: 11_053_296,
        contentSha256: hex("7")
      },
      selectedCargo: {
        path: "/Users/sirinx/.rustup/toolchains/stable-aarch64-apple-darwin/bin/cargo",
        kind: "REGULAR_FILE",
        deviceId: 16_777_232,
        inode: 30_863_144,
        mode: "100755",
        linkCount: 1,
        sizeBytes: 31_887_528,
        contentSha256: hex("8")
      },
      repositoryToolchainSelector: {
        path: "/Users/sirinx/SIRINXDev/sirinx-co/rust-toolchain.toml",
        value: "stable",
        mutable: true,
        boundToPlan: false,
        contentSha256: hex("9")
      },
      verificationCeiling: "LOCAL_FILE_HASHES_ONLY_NO_RUNTIME_REVISION_PROBE"
    },
    resources: {
      filesystemDeviceId: 16_777_232,
      currentFreeKiB: 13_625_216,
      targetAllocatedKiB: 3_125_988,
      targetLogicalKiB: 3_098_930,
      emergencyFloorKiB: RESOURCE_CLEANUP_EMERGENCY_FLOOR_KIB,
      workloadFloorKiB: RESOURCE_CLEANUP_WORKLOAD_FLOOR_KIB,
      conservativeTargetKiB: RESOURCE_CLEANUP_CONSERVATIVE_TARGET_KIB,
      projectedFreeKiB: 0,
      emergencyHeadroomKiB: 0,
      workloadHeadroomKiB: 0,
      conservativeHeadroomKiB: 0,
      projectionBasis: "CURRENT_FREE_PLUS_TARGET_ALLOCATED_UPPER_BOUND_MINUS_PROPOSED_UNVERIFIED_GROWTH",
      reclaimCertainty: "NOT_GUARANTEED"
    },
    operationPreview: {
      kind: "TOOL_NATIVE_CLEAN",
      toolId: "cargo-clean",
      executablePath: "/Users/sirinx/.cargo/bin/cargo",
      cwd: "/Users/sirinx/SIRINXDev/sirinx-co",
      argv: [
        "clean",
        "--manifest-path",
        "/Users/sirinx/SIRINXDev/sirinx-co/Cargo.toml",
        "--target-dir",
        "/Users/sirinx/SIRINXDev/sirinx-co/target"
      ],
      environment: {
        inherit: false,
        set: {
          CARGO_HOME: "/Users/sirinx/.cargo",
          CARGO_TARGET_DIR: "/Users/sirinx/SIRINXDev/sirinx-co/target",
          HOME: "/Users/sirinx",
          RUSTUP_HOME: "/Users/sirinx/.rustup",
          RUSTUP_TOOLCHAIN: "stable-aarch64-apple-darwin"
        }
      },
      planOperationParametersDigest: RESOURCE_CLEANUP_PLAN_OPERATION_PARAMETERS_DIGEST,
      rustupToolchainProposal: {
        name: "RUSTUP_TOOLCHAIN",
        value: "stable-aarch64-apple-darwin",
        selectorClass: "MUTABLE_CHANNEL_ALIAS",
        mutable: true,
        boundToPlan: false,
        approvedForExecution: false
      }
    },
    recovery: {
      targetClass: "GENERATED_BUILD_OUTPUT_CANDIDATE",
      status: "CANDIDATE_NOT_ACTION_TIME_VERIFIED",
      sourcePath: "/Users/sirinx/SIRINXDev/sirinx-co/Cargo.lock",
      sourceFileSha256: hex("a"),
      procedurePath: "/Users/sirinx/SIRINXDev/sirinx-co/docs/agent-runtime/RESOURCE_RECOVERY_ADMISSION.md",
      networkRequirement: "UNVERIFIED_NOT_AUTHORIZED",
      installRequirement: "UNVERIFIED_NOT_AUTHORIZED",
      checkerReceiptId: null
    },
    proofs: {
      targetManifestV1Complete: false,
      processEvidenceV1Complete: false,
      actionTimeEvidenceComplete: false,
      canonicalWorktreeSnapshotComplete: false,
      executableIdentityV1Complete: false,
      recoveryVerified: false,
      humanApprovalVerified: false,
      durableAuthorityVerified: false,
      runtimeStateVerified: false
    },
    authority: {
      humanApprovalPresent: false,
      grantPresent: false,
      circuitOpen: false,
      replayProtectionAvailable: false,
      executorAvailable: false,
      approvalConsumed: false,
      authorized: false,
      admitted: false,
      canDispatch: false,
      canExecute: false,
      commandExecuted: false,
      cleanupExecuted: false,
      processStopped: false,
      networkCalls: false,
      externalWrites: false,
      runtimeActivated: false
    },
    blockers: [],
    requestDigest: hex("0")
  };
  return syncArithmetic(request);
}

describe("resource cleanup pre-approval review request", () => {
  it("validates the canonical fresh C01 observation packet without authority", async () => {
    const request = JSON.parse(await readFile(CANONICAL_REQUEST_URL, "utf8"));
    const validated = validateResourceCleanupReviewRequestV1(request, {
      now: new Date("2026-07-21T04:16:00+07:00")
    });
    expect(validated).not.toBe(request);
    expect(validated).toEqual(request);
    expect(Object.isFrozen(validated)).toBe(true);
    expect(Object.isFrozen(validated.authority)).toBe(true);
    expect(request.requestDigest).toBe("aecc0a0e0f6dd93bd1e4967a4ccbc754d9a7e003f432a9b086acaa19b09d8896");
    expect(request.resources.projectedFreeKiB).toBe(16_751_204);
    expect(request.resources.conservativeHeadroomKiB).toBe(-4_220_316);
    expect(request.blockers).toHaveLength(22);
    expect(Object.values(request.authority).every((value) => value === false)).toBe(true);
  });

  it("accepts a bounded synthetic packet while preserving the hard claim ceiling", () => {
    const request = validRequest();
    const validated = validateResourceCleanupReviewRequestV1(request, { now: fixedNow });
    expect(validated).not.toBe(request);
    expect(validated).toEqual(request);
    expect(() => { validated.authority.canExecute = true; }).toThrow(TypeError);
    expect(validated.authority.canExecute).toBe(false);
    expect(request.status).toBe("COLLECTED_NOT_APPROVED");
    expect(request.claimCeiling).toBe("PRE_APPROVAL_LOCAL_READ_ONLY_OBSERVATIONS");
    expect(request.resources.projectedFreeKiB).toBe(16_751_204);
    expect(request.blockers).toContain("conservative_20gib_target_not_met");
    expect(request.blockers).toContain("cleanup_growth_margin_unreviewed");
    expect(Object.values(request.proofs)).toEqual(expect.arrayContaining([false]));
    expect(Object.values(request.authority).every((value) => value === false)).toBe(true);
    expect(request.target.hardlinkEntries).toBe(
      request.target.hardlinkGroups + request.target.hardlinkAliasesInsideTarget
    );
  });

  it("strictly compiles the closed Draft 2020-12 schema and rejects unknown fields", async () => {
    const require = createRequire(import.meta.url);
    const Ajv2020 = require("ajv/dist/2020.js").default;
    const formatsModule = require("ajv-formats");
    const addFormats = formatsModule.default ?? formatsModule;
    const schema = JSON.parse(await readFile(RESOURCE_CLEANUP_REVIEW_REQUEST_SCHEMA_URL, "utf8"));
    const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    expect(validate(validRequest())).toBe(true);
    const open = validRequest();
    open.target.unreviewed = true;
    expect(validate(open)).toBe(false);
    expect(() => validateResourceCleanupReviewRequestV1(open, { now: fixedNow })).toThrow(/must_be_closed/);

    for (const [key, unsafePath] of [
      ["rustupProxy", "/tmp/rustup"],
      ["selectedCargo", "/tmp/cargo"]
    ]) {
      const wrongTool = validRequest();
      wrongTool.tooling[key].path = unsafePath;
      reseal(wrongTool);
      expect(validate(wrongTool)).toBe(false);
      expect(() => validateResourceCleanupReviewRequestV1(wrongTool, { now: fixedNow })).toThrow(/_path/);
    }
  });

  it("rejects approval, proof, runtime, process-completeness, and mutable-selector promotion", () => {
    const mutations = [
      (value) => { value.status = "APPROVED"; },
      (value) => { value.authority.canExecute = true; },
      (value) => { value.authority.humanApprovalPresent = true; },
      (value) => { value.proofs.processEvidenceV1Complete = true; },
      (value) => { value.processObservation.completeProcessEvidenceV1 = true; },
      (value) => { value.processObservation.zeroMatchesProvesNoConsumers = true; },
      (value) => { value.tooling.repositoryToolchainSelector.boundToPlan = true; },
      (value) => { value.operationPreview.rustupToolchainProposal.approvedForExecution = true; }
    ];
    for (const mutate of mutations) {
      const request = validRequest();
      mutate(request);
      reseal(request);
      expect(() => validateResourceCleanupReviewRequestV1(request, { now: fixedNow })).toThrow(
        /^invalid_resource_cleanup_review_request:/
      );
    }
  });

  it("rejects unsafe target identity and incomplete metadata sets while allowing complete internal hardlinks", () => {
    const mutations = [
      (value) => { value.target.path = "/Users/sirinx/SIRINXDev/sirinx-co"; },
      (value) => { value.target.realPath = "/Users/sirinx/SIRINXDev/sirinx-co/elsewhere"; },
      (value) => { value.target.isSymlink = true; },
      (value) => { value.target.mode = "0777"; },
      (value) => { value.target.symlinkEntries = 1; value.target.directoryEntries -= 1; },
      (value) => { value.target.specialEntries = 1; value.target.directoryEntries -= 1; },
      (value) => { value.target.incompleteHardlinkGroups = 1; },
      (value) => { value.target.hardlinkAliasesInsideTarget -= 1; }
    ];
    for (const mutate of mutations) {
      const request = validRequest();
      mutate(request);
      reseal(request);
      expect(() => validateResourceCleanupReviewRequestV1(request, { now: fixedNow })).toThrow(
        /^invalid_resource_cleanup_review_request:/
      );
    }
  });

  it("rejects unbounded or contradictory repository, target, and lsof counts", () => {
    const mutations = [
      (value) => { value.repository.statusEntryCount = 250_001; },
      (value) => { value.target.descendantEntries = 250_001; },
      (value) => { value.target.descendantEntries += 1; },
      (value) => { value.target.hardlinkEntries = value.target.regularFileEntries + 1; },
      (value) => { value.processObservation.matchingRecordCount = 16_385; },
      (value) => { value.processObservation.distinctMatchingProcessCount = 1; }
    ];
    for (const mutate of mutations) {
      const request = validRequest();
      mutate(request);
      reseal(request, { refreshBlockers: true });
      expect(() => validateResourceCleanupReviewRequestV1(request, { now: fixedNow })).toThrow(
        /^invalid_resource_cleanup_review_request:/
      );
    }
  });

  it("recomputes 5/15/20 GiB decision arithmetic and requires the conservative blocker", () => {
    const drifted = validRequest();
    drifted.resources.projectedFreeKiB += 1;
    reseal(drifted);
    expect(() => validateResourceCleanupReviewRequestV1(drifted, { now: fixedNow })).toThrow(/projected_free_drift/);

    const belowWorkload = validRequest();
    belowWorkload.resources.currentFreeKiB = 12_000_000;
    syncArithmetic(belowWorkload);
    expect(() => validateResourceCleanupReviewRequestV1(belowWorkload, { now: fixedNow })).toThrow(
      /projected_workload_floor_not_met/
    );

    const missingConservativeBlocker = validRequest();
    missingConservativeBlocker.blockers = missingConservativeBlocker.blockers.filter(
      (value) => value !== "conservative_20gib_target_not_met"
    );
    reseal(missingConservativeBlocker);
    expect(() => validateResourceCleanupReviewRequestV1(missingConservativeBlocker, { now: fixedNow })).toThrow(
      /required_blockers_missing/
    );

    const startMargin = validRequest();
    startMargin.limits.worstCaseCleanupGrowthKiB = 9_000_000;
    syncArithmetic(startMargin);
    expect(() => validateResourceCleanupReviewRequestV1(startMargin, { now: fixedNow })).toThrow(
      /cleanup_start_margin_not_met/
    );
  });

  it("rejects pinned-plan drift, digest drift, future, expired, and overlong requests", () => {
    const planDrift = validRequest();
    planDrift.planBinding.planHash = hex("f");
    reseal(planDrift);
    expect(() => validateResourceCleanupReviewRequestV1(planDrift, { now: fixedNow })).toThrow(/plan_hash_drift/);

    const digestDrift = validRequest();
    digestDrift.requestDigest = hex("f");
    expect(() => validateResourceCleanupReviewRequestV1(digestDrift, { now: fixedNow })).toThrow(/digest_mismatch/);

    const future = validRequest();
    expect(() => validateResourceCleanupReviewRequestV1(future, {
      now: new Date("2026-07-20T23:59:59.000Z")
    })).toThrow(/observation_from_future/);

    const expired = validRequest();
    expect(() => validateResourceCleanupReviewRequestV1(expired, {
      now: new Date("2026-07-21T00:30:01.000Z")
    })).toThrow(/review_request_expired/);

    const exactExpiry = validRequest();
    expect(() => validateResourceCleanupReviewRequestV1(exactExpiry, {
      now: new Date("2026-07-21T00:30:00.000Z")
    })).toThrow(/review_request_expired/);

    const overlong = validRequest();
    overlong.expiresAt = "2026-07-21T01:00:01.000Z";
    reseal(overlong);
    expect(() => validateResourceCleanupReviewRequestV1(overlong, { now: fixedNow })).toThrow(/lifetime_exceeds_limit/);
  });

  it("rejects exclusion drift, principal collisions, Proxy input, and accessor input without invoking traps", () => {
    const exclusionDrift = validRequest();
    exclusionDrift.exclusionsDigest = hex("f");
    reseal(exclusionDrift);
    expect(() => validateResourceCleanupReviewRequestV1(exclusionDrift, { now: fixedNow })).toThrow(
      /exclusions_digest_drift/
    );

    const collision = validRequest();
    collision.principals.checker = collision.principals.maker;
    reseal(collision);
    expect(() => validateResourceCleanupReviewRequestV1(collision, { now: fixedNow })).toThrow(
      /principals_must_be_pairwise_distinct/
    );

    let proxyTrapReads = 0;
    const proxied = new Proxy(validRequest(), {
      get() {
        proxyTrapReads += 1;
        throw new Error("proxy trap invoked");
      }
    });
    expect(() => validateResourceCleanupReviewRequestV1(proxied, { now: fixedNow })).toThrow(/contains_proxy/);
    expect(proxyTrapReads).toBe(0);

    const accessor = validRequest();
    let accessorReads = 0;
    Object.defineProperty(accessor.target, "path", {
      enumerable: true,
      get() {
        accessorReads += 1;
        return "/Users/sirinx/SIRINXDev/sirinx-co/target";
      }
    });
    expect(() => validateResourceCleanupReviewRequestV1(accessor, { now: fixedNow })).toThrow(/not_plain_data/);
    expect(accessorReads).toBe(0);
  });

  it("contains no collector, filesystem, process, network, environment, or write primitive", async () => {
    const source = await readFile(new URL("./resource-cleanup-review-request.mjs", import.meta.url), "utf8");
    expect(source).not.toMatch(/node:(?:fs|child_process|http|https|net|dgram|worker_threads)/);
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/\bprocess\s*\.\s*env\b/);
    expect(source).not.toMatch(/\b(?:readFile|writeFile|appendFile|mkdir|rm|rmdir|unlink|rename|truncate|spawn|exec|execFile)\s*\(/);
    expect(source).not.toMatch(/\.canExecute\s*=\s*true/);
    expect(source).not.toMatch(/\.authorized\s*=\s*true/);
  });
});

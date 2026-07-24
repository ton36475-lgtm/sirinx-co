import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

import {
  RESOURCE_RECOVERY_BOOTSTRAP_CANDIDATE_PINS,
  RESOURCE_RECOVERY_BOOTSTRAP_CLAIM_CEILING,
  RESOURCE_RECOVERY_BOOTSTRAP_CONSERVATIVE_TARGET_KIB,
  RESOURCE_RECOVERY_BOOTSTRAP_CURRENT_FREE_KIB,
  RESOURCE_RECOVERY_BOOTSTRAP_FILESYSTEM_DEVICE_ID,
  RESOURCE_RECOVERY_BOOTSTRAP_INELIGIBLE_ROOTS,
  RESOURCE_RECOVERY_BOOTSTRAP_KEEP_BY_DEFAULT_TARGETS,
  RESOURCE_RECOVERY_BOOTSTRAP_PARENT_ARTIFACTS,
  RESOURCE_RECOVERY_BOOTSTRAP_REPOSITORY_BRANCH,
  RESOURCE_RECOVERY_BOOTSTRAP_REPOSITORY_HEAD,
  RESOURCE_RECOVERY_BOOTSTRAP_REPOSITORY_PATH,
  RESOURCE_RECOVERY_BOOTSTRAP_REQUIRED_BLOCKERS,
  RESOURCE_RECOVERY_BOOTSTRAP_REVIEW_SCHEMA_URL,
  RESOURCE_RECOVERY_BOOTSTRAP_STATUS,
  RESOURCE_RECOVERY_BOOTSTRAP_WORKLOAD_FLOOR_KIB,
  computeResourceRecoveryBootstrapReviewDigest,
  computeResourceRecoveryCandidateMetadataDigest,
  validateResourceRecoveryBootstrapReviewV1
} from "./resource-recovery-bootstrap-review.mjs";

const fixedNow = new Date("2026-07-21T05:00:00+07:00");
const hex = (character) => character.repeat(64);
const clone = (value) => JSON.parse(JSON.stringify(value));
const CANONICAL_PACKET_URL = new URL(
  "../../../config/agent-runtime/resource-recovery.bootstrap-review.v1.json",
  import.meta.url
);

function reseal(packet) {
  packet.packetDigest = computeResourceRecoveryBootstrapReviewDigest(packet);
  return packet;
}

function candidateFromPin(pin) {
  const candidate = {
    ...clone(pin),
    metadataDigest: hex("0"),
    nominalProjectedFreeKiB: RESOURCE_RECOVERY_BOOTSTRAP_CURRENT_FREE_KIB + pin.allocatedKiB,
    guaranteedMinimumReclaimKiB: 0,
    approvalEligible: false,
    operationPlanBound: false,
    proofs: {
      apfsUniqueExtentVerified: false,
      cloneIsolationVerified: false,
      consumerAbsenceVerified: false,
      hardlinkIsolationVerified: false,
      recoveryVerified: false
    }
  };
  candidate.metadataDigest = computeResourceRecoveryCandidateMetadataDigest(candidate);
  return candidate;
}

function validPacket() {
  return reseal({
    schemaVersion: "1.0",
    reviewId: "RRBR-A32-20260721",
    taskId: "TASK-RESOURCE-RECOVERY-BOOTSTRAP",
    runId: "RUN-A32-RESOURCE-RECOVERY-001",
    action: "RESOURCE_RECOVERY_BOOTSTRAP_REVIEW",
    circuit: "resource_cleanup",
    status: RESOURCE_RECOVERY_BOOTSTRAP_STATUS,
    claimCeiling: RESOURCE_RECOVERY_BOOTSTRAP_CLAIM_CEILING,
    observedAt: "2026-07-21T04:40:19+07:00",
    expiresAt: "2026-07-21T05:40:19+07:00",
    repository: {
      path: RESOURCE_RECOVERY_BOOTSTRAP_REPOSITORY_PATH,
      branch: RESOURCE_RECOVERY_BOOTSTRAP_REPOSITORY_BRANCH,
      headSha: RESOURCE_RECOVERY_BOOTSTRAP_REPOSITORY_HEAD
    },
    parentArtifacts: clone(RESOURCE_RECOVERY_BOOTSTRAP_PARENT_ARTIFACTS),
    resources: {
      filesystemDeviceId: RESOURCE_RECOVERY_BOOTSTRAP_FILESYSTEM_DEVICE_ID,
      currentFreeKiB: RESOURCE_RECOVERY_BOOTSTRAP_CURRENT_FREE_KIB,
      workloadFloorKiB: RESOURCE_RECOVERY_BOOTSTRAP_WORKLOAD_FLOOR_KIB,
      conservativeTargetKiB: RESOURCE_RECOVERY_BOOTSTRAP_CONSERVATIVE_TARGET_KIB
    },
    candidates: RESOURCE_RECOVERY_BOOTSTRAP_CANDIDATE_PINS.map(candidateFromPin),
    ineligibleRoots: clone(RESOURCE_RECOVERY_BOOTSTRAP_INELIGIBLE_ROOTS),
    keepByDefaultTargets: clone(RESOURCE_RECOVERY_BOOTSTRAP_KEEP_BY_DEFAULT_TARGETS),
    policy: {
      aggregateReclaimCredited: false,
      automaticContinuation: false,
      multiTargetGrantAllowed: false,
      sequentialOneTargetGrantsRequired: true,
      stopAndRemeasureAfterEach: true
    },
    blockers: [...RESOURCE_RECOVERY_BOOTSTRAP_REQUIRED_BLOCKERS],
    authority: {
      admitted: false,
      approvalConsumed: false,
      authorized: false,
      bootstrapAuthorityAvailable: false,
      canDispatch: false,
      canExecute: false,
      circuitOpen: false,
      durableAuthorityAvailable: false,
      executorAvailable: false,
      humanApprovalPresent: false,
      replayProtectionAvailable: false,
      singleTargetGrantPresent: false
    },
    effects: {
      cachePruned: false,
      cleanupExecuted: false,
      commandExecuted: false,
      databaseWrites: false,
      externalWrites: false,
      filesDeleted: false,
      networkCalls: false,
      processStopped: false,
      runtimeActivated: false,
      storePruned: false,
      trashMoved: false
    },
    packetDigest: hex("0")
  });
}

function expectDeepFrozen(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  expect(Object.isFrozen(value)).toBe(true);
  for (const entry of Object.values(value)) expectDeepFrozen(entry, seen);
}

function expectInvalid(packet, pattern = /^invalid_resource_recovery_bootstrap_review:/) {
  expect(() => validateResourceRecoveryBootstrapReviewV1(packet, { now: fixedNow })).toThrow(pattern);
}

describe("resource recovery bootstrap comparison review", () => {
  it("validates the exact canonical A32 packet without granting authority", async () => {
    const packet = JSON.parse(await readFile(CANONICAL_PACKET_URL, "utf8"));
    const validated = validateResourceRecoveryBootstrapReviewV1(packet, {
      now: new Date("2026-07-21T05:00:00+07:00")
    });
    expect(validated).not.toBe(packet);
    expect(validated).toEqual(packet);
    expect(packet.packetDigest).toBe(
      "67f729a0f729535c68a9f7ba244f6999289799f1e2271aa2d264c37079415268"
    );
    expect(packet.packetDigest).toBe(computeResourceRecoveryBootstrapReviewDigest(packet));
    expect(packet.candidates.map((candidate) => candidate.candidateId)).toEqual([
      "C01",
      "C02a",
      "C05a",
      "C05b"
    ]);
    expect(Object.values(packet.authority).every((value) => value === false)).toBe(true);
    expect(Object.values(packet.effects).every((value) => value === false)).toBe(true);
  });

  it("returns a distinct deeply frozen comparison-only clone", () => {
    const packet = validPacket();
    const validated = validateResourceRecoveryBootstrapReviewV1(packet, { now: fixedNow });
    expect(validated).not.toBe(packet);
    expect(validated.repository).not.toBe(packet.repository);
    expect(validated.candidates).not.toBe(packet.candidates);
    expect(validated.candidates[0].proofs).not.toBe(packet.candidates[0].proofs);
    expect(validated).toEqual(packet);
    expectDeepFrozen(validated);
    expect(() => { validated.candidates[0].approvalEligible = true; }).toThrow(TypeError);
    expect(validated.status).toBe("BOOTSTRAP_REVIEW_BLOCKED");
    expect(validated.claimCeiling).toBe("COMPARISON_ONLY_RECORDED_METADATA_NO_AUTHORITY");
  });

  it("strictly compiles the closed Draft 2020-12 schema", async () => {
    const require = createRequire(import.meta.url);
    const Ajv2020 = require("ajv/dist/2020.js").default;
    const formatsModule = require("ajv-formats");
    const addFormats = formatsModule.default ?? formatsModule;
    const schema = JSON.parse(await readFile(RESOURCE_RECOVERY_BOOTSTRAP_REVIEW_SCHEMA_URL, "utf8"));
    const ajv = new Ajv2020({ allErrors: true, strict: true, validateFormats: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    expect(validate(validPacket())).toBe(true);
    const canonicalPacket = JSON.parse(await readFile(CANONICAL_PACKET_URL, "utf8"));
    expect(validate(canonicalPacket)).toBe(true);

    const open = validPacket();
    open.candidates[0].unreviewed = true;
    expect(validate(open)).toBe(false);
    expectInvalid(open, /must_be_closed/);
  });

  it("rejects exact repository and parent-artifact drift", () => {
    const mutations = [
      (packet) => { packet.repository.branch = "main"; },
      (packet) => { packet.repository.headSha = "f".repeat(40); },
      (packet) => { packet.parentArtifacts[0].path = "/tmp/a22.md"; },
      (packet) => { packet.parentArtifacts[1].sha256 = hex("f"); },
      (packet) => { [packet.parentArtifacts[0], packet.parentArtifacts[1]] = [packet.parentArtifacts[1], packet.parentArtifacts[0]]; }
    ];
    for (const mutate of mutations) {
      const packet = validPacket();
      mutate(packet);
      reseal(packet);
      expectInvalid(packet);
    }
  });

  it("rejects candidate reorder, duplicate, path, class, and disposition promotion", () => {
    const mutations = [
      (packet) => { [packet.candidates[0], packet.candidates[1]] = [packet.candidates[1], packet.candidates[0]]; },
      (packet) => { packet.candidates[1] = clone(packet.candidates[0]); },
      (packet) => { packet.candidates[0].path = "/tmp/target"; },
      (packet) => { packet.candidates[1].targetClass = "GENERATED_BUILD_OUTPUT"; },
      (packet) => { packet.candidates[2].disposition = "CANDIDATE_UNVERIFIED"; }
    ];
    for (const mutate of mutations) {
      const packet = validPacket();
      mutate(packet);
      reseal(packet);
      expectInvalid(packet);
    }
  });

  it("rejects wholesale roots and keep-by-default targets as candidates", () => {
    for (const forbiddenPath of [
      "/Users/sirinx/.npm/_npx",
      "/Users/sirinx/.npm/_cacache",
      "/Users/sirinx/go/pkg/mod",
      "/Users/sirinx/Library/pnpm/store",
      "/Users/sirinx/Library/pnpm/store/v11",
      "/Users/sirinx/.cargo/registry"
    ]) {
      const packet = validPacket();
      packet.candidates[0].path = forbiddenPath;
      reseal(packet);
      expectInvalid(packet, /wholesale_or_keep_target_forbidden/);
    }
  });

  it("rejects lstat identity, allocation, projection, and metadata-digest drift", () => {
    const mutations = [
      (packet) => { packet.candidates[0].inode += 1; },
      (packet) => { packet.candidates[1].isSymlink = true; },
      (packet) => { packet.candidates[2].allocatedKiB += 1; },
      (packet) => { packet.candidates[3].logicalKiB += 1; },
      (packet) => { packet.candidates[0].nominalProjectedFreeKiB += 1; },
      (packet) => { packet.candidates[1].metadataDigest = hex("f"); }
    ];
    for (const mutate of mutations) {
      const packet = validPacket();
      mutate(packet);
      reseal(packet);
      expectInvalid(packet);
    }
  });

  it("rejects optimistic reclaim, candidate eligibility, operation binding, and proof promotion", () => {
    const mutations = [
      (packet) => { packet.candidates[0].guaranteedMinimumReclaimKiB = 1; },
      (packet) => { packet.candidates[1].approvalEligible = true; },
      (packet) => { packet.candidates[2].operationPlanBound = true; },
      (packet) => { packet.candidates[3].proofs.apfsUniqueExtentVerified = true; },
      (packet) => { packet.candidates[0].proofs.consumerAbsenceVerified = true; },
      (packet) => { packet.candidates[1].proofs.hardlinkIsolationVerified = true; },
      (packet) => { packet.candidates[2].proofs.cloneIsolationVerified = true; },
      (packet) => { packet.candidates[3].proofs.recoveryVerified = true; }
    ];
    for (const mutate of mutations) {
      const packet = validPacket();
      mutate(packet);
      reseal(packet);
      expectInvalid(packet);
    }
  });

  it("keeps every nominal candidate projection below both recovery thresholds", () => {
    const packet = validPacket();
    validateResourceRecoveryBootstrapReviewV1(packet, { now: fixedNow });
    for (const candidate of packet.candidates) {
      expect(candidate.nominalProjectedFreeKiB).toBe(
        packet.resources.currentFreeKiB + candidate.allocatedKiB
      );
      expect(candidate.nominalProjectedFreeKiB).toBeLessThan(
        RESOURCE_RECOVERY_BOOTSTRAP_WORKLOAD_FLOOR_KIB
      );
      expect(candidate.nominalProjectedFreeKiB).toBeLessThan(
        RESOURCE_RECOVERY_BOOTSTRAP_CONSERVATIVE_TARGET_KIB
      );
      expect(candidate.guaranteedMinimumReclaimKiB).toBe(0);
    }
  });

  it("rejects multi-target, aggregate-credit, automatic, and sequential-policy promotion", () => {
    const mutations = [
      (packet) => { packet.policy.multiTargetGrantAllowed = true; },
      (packet) => { packet.policy.aggregateReclaimCredited = true; },
      (packet) => { packet.policy.automaticContinuation = true; },
      (packet) => { packet.policy.sequentialOneTargetGrantsRequired = false; },
      (packet) => { packet.policy.stopAndRemeasureAfterEach = false; }
    ];
    for (const mutate of mutations) {
      const packet = validPacket();
      mutate(packet);
      reseal(packet);
      expectInvalid(packet);
    }
  });

  it("requires all ten canonical blockers in canonical order", () => {
    expect(RESOURCE_RECOVERY_BOOTSTRAP_REQUIRED_BLOCKERS).toContain(
      "candidate_specific_operation_plans_absent"
    );
    expect(RESOURCE_RECOVERY_BOOTSTRAP_REQUIRED_BLOCKERS).toContain(
      "migration_0007_registry_semantics_unresolved"
    );
    for (const mutate of [
      (packet) => { packet.blockers.pop(); },
      (packet) => { [packet.blockers[0], packet.blockers[1]] = [packet.blockers[1], packet.blockers[0]]; },
      (packet) => { packet.blockers[2] = "human_approval_absent"; }
    ]) {
      const packet = validPacket();
      mutate(packet);
      reseal(packet);
      expectInvalid(packet, /blockers_must_be_canonical/);
    }
  });

  it("rejects every authority or effect promotion", () => {
    for (const section of ["authority", "effects"]) {
      for (const key of Object.keys(validPacket()[section])) {
        const packet = validPacket();
        packet[section][key] = true;
        reseal(packet);
        expectInvalid(packet, new RegExp(`${section}_${key}_must_remain_false`));
      }
    }
  });

  it("rejects future, exact-expiry, stale, non-one-hour, and untrusted-time packets", () => {
    const packet = validPacket();
    expect(() => validateResourceRecoveryBootstrapReviewV1(packet, {
      now: new Date("2026-07-21T04:40:18.999+07:00")
    })).toThrow(/observation_from_future/);
    expect(() => validateResourceRecoveryBootstrapReviewV1(packet, {
      now: new Date("2026-07-21T05:40:19+07:00")
    })).toThrow(/bootstrap_review_expired/);
    expect(() => validateResourceRecoveryBootstrapReviewV1(packet, {
      now: new Date("2026-07-21T05:40:19.001+07:00")
    })).toThrow(/bootstrap_review_expired/);
    expect(() => validateResourceRecoveryBootstrapReviewV1(packet)).toThrow(/trusted_now_required/);

    const refreshed = validPacket();
    refreshed.observedAt = "2026-07-21T10:00:00+07:00";
    refreshed.expiresAt = "2026-07-21T11:00:00+07:00";
    reseal(refreshed);
    expect(() => validateResourceRecoveryBootstrapReviewV1(refreshed, {
      now: new Date("2026-07-21T10:30:00+07:00")
    })).toThrow(/observed_at_drift/);

    for (const expiresAt of [
      "2026-07-21T05:40:18+07:00",
      "2026-07-21T05:40:20+07:00"
    ]) {
      const wrongExpiry = validPacket();
      wrongExpiry.expiresAt = expiresAt;
      reseal(wrongExpiry);
      expectInvalid(wrongExpiry, /expires_at_drift/);
    }
  });

  it("rejects packet and candidate metadata digest mismatches", () => {
    const packetDigestDrift = validPacket();
    packetDigestDrift.packetDigest = hex("f");
    expectInvalid(packetDigestDrift, /packet_digest_pin_drift/);

    const metadataDigestDrift = validPacket();
    metadataDigestDrift.candidates[0].metadataDigest = hex("f");
    reseal(metadataDigestDrift);
    expectInvalid(metadataDigestDrift, /metadata_digest_mismatch/);
  });

  it("rejects Proxy and accessor inputs without invoking traps", () => {
    let proxyTrapReads = 0;
    const proxied = new Proxy(validPacket(), {
      get() {
        proxyTrapReads += 1;
        throw new Error("proxy trap invoked");
      }
    });
    expect(() => validateResourceRecoveryBootstrapReviewV1(proxied, { now: fixedNow })).toThrow(/contains_proxy/);
    expect(proxyTrapReads).toBe(0);

    const accessor = validPacket();
    let accessorReads = 0;
    Object.defineProperty(accessor.repository, "branch", {
      enumerable: true,
      get() {
        accessorReads += 1;
        return RESOURCE_RECOVERY_BOOTSTRAP_REPOSITORY_BRANCH;
      }
    });
    expectInvalid(accessor, /not_plain_data/);
    expect(accessorReads).toBe(0);
  });

  it("rejects shared, cyclic, and sparse JSON graphs", () => {
    const shared = validPacket();
    shared.candidates[1].proofs = shared.candidates[0].proofs;
    expectInvalid(shared, /cycle_or_shared_reference/);

    const cyclic = validPacket();
    cyclic.repository.loop = cyclic;
    expectInvalid(cyclic, /cycle_or_shared_reference/);

    const sparse = validPacket();
    sparse.candidates = new Array(4);
    sparse.candidates[0] = validPacket().candidates[0];
    expectInvalid(sparse, /sparse_or_extended_array/);
  });

  it("rejects excessively deep and wide graphs before semantic reads", () => {
    const deep = validPacket();
    let branch = {};
    for (let index = 0; index < 70; index += 1) branch = { next: branch };
    deep.overflow = branch;
    expectInvalid(deep, /exceeds_maximum_depth/);

    const wide = validPacket();
    wide.overflow = Object.fromEntries(
      Array.from({ length: 129 }, (_, index) => [`key${index}`, index])
    );
    expectInvalid(wide, /exceeds_property_limit/);
  });

  it("contains only crypto/util imports and no collector, route, database, or effect primitive", async () => {
    const source = await readFile(
      new URL("./resource-recovery-bootstrap-review.mjs", import.meta.url),
      "utf8"
    );
    const imports = [...source.matchAll(/^import .* from "([^"]+)";$/gm)].map((match) => match[1]);
    expect(imports).toEqual(["node:crypto", "node:util"]);
    expect(source).not.toMatch(/node:(?:fs|child_process|http|https|net|dgram|worker_threads)/);
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/\bprocess\s*\.\s*env\b/);
    expect(source).not.toMatch(/\b(?:readFile|writeFile|appendFile|mkdir|rm|rmdir|unlink|rename|truncate|spawn|exec|execFile)\s*\(/);
    expect(source).not.toMatch(/\b(?:createConnection|createServer|listen|query|transaction)\s*\(/);
    expect(source).not.toMatch(/\b(?:router|app)\s*\.\s*(?:get|post|put|patch|delete|use)\s*\(/);
    expect(source).not.toMatch(/\.authorized\s*=\s*true/);
    expect(source).not.toMatch(/\.canExecute\s*=\s*true/);
  });
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ExistingComponentProvenanceError,
  modeMatchesExpected,
  parseJsonRejectDuplicateKeys,
  REPO_ROOT,
  SCHEMA_PATH,
  SNAPSHOT_PATH,
  validateCanonicalExistingComponentProvenance,
  validateSnapshotShape,
} from "./validate-existing-component-provenance.mjs";

const snapshotBytes = readFileSync(`${REPO_ROOT}/${SNAPSHOT_PATH}`);
const schemaBytes = readFileSync(`${REPO_ROOT}/${SCHEMA_PATH}`);
const snapshot = JSON.parse(snapshotBytes);
const schema = JSON.parse(schemaBytes);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("canonical Wave 0 provenance validates exact local artifacts without admission", () => {
  assert.deepEqual(validateCanonicalExistingComponentProvenance(), {
    status: "PROVENANCE_VALIDATED_NOT_ADMITTED",
    claimCeiling: "EXACT_LOCAL_ARTIFACTS_AND_LOCKFILE_ONLY",
    components: 6,
    artifacts: 26,
    cargoPackages: 7,
    upstreamIdentitiesBound: 0,
    admitted: false,
    runtimeVerified: false,
    mcpConnected: false,
    a2aLive: false,
    modelInvoked: false,
    providerCalled: false,
    messageSent: false,
    deployed: false,
    productionReady: false,
    resourceAdmission: "HOLD_BELOW_15_GIB",
    stopAt: "RECONCILIATION_PACKET_REVIEWED_NOT_ACTIVATED",
  });
});

test("shape validator preserves the lower static claim ceiling", () => {
  const result = validateSnapshotShape(snapshot, schema);
  assert.equal(result.status, "SHAPE_VALIDATED_NOT_ADMITTED");
  assert.equal(result.claimCeiling, "FROZEN_READ_ONLY_RECONCILIATION_PACKET");
  assert.equal(result.admitted, false);

  const changedSchema = clone(schema);
  changedSchema.title = "CallerControlledSchema";
  assert.throws(() => validateSnapshotShape(snapshot, changedSchema), /schema semantic digest drift/);
});

test("duplicate JSON keys are rejected before parsing", () => {
  const duplicate = snapshotBytes.toString("utf8").replace(
    '"schemaVersion": "1.0",',
    '"schemaVersion": "1.0",\n  "schemaVersion": "1.0",',
  );
  assert.throws(() => parseJsonRejectDuplicateKeys(duplicate, "snapshot"), /duplicate key/);

  const deeplyNestedRawJson = `${"[".repeat(20_000)}0${"]".repeat(20_000)}`;
  assert.throws(
    () => parseJsonRejectDuplicateKeys(deeplyNestedRawJson, "snapshot"),
    (error) => error instanceof ExistingComponentProvenanceError && /maximum raw JSON nesting depth/.test(error.message),
  );

  let coercionTraps = 0;
  const proxiedInput = new Proxy(
    {},
    {
      get() {
        coercionTraps += 1;
        throw new Error("coercion trap invoked");
      },
    },
  );
  assert.throws(() => parseJsonRejectDuplicateKeys(proxiedInput, "snapshot"), /input is a Proxy/);
  assert.equal(coercionTraps, 0);

  const bufferInput = Buffer.from('{"safe":true}');
  let bufferAccessorReads = 0;
  Object.defineProperty(bufferInput, "toString", {
    get() {
      bufferAccessorReads += 1;
      throw new Error("buffer accessor invoked");
    },
  });
  assert.deepEqual(parseJsonRejectDuplicateKeys(bufferInput, "snapshot"), { safe: true });
  assert.equal(bufferAccessorReads, 0);
});

test("authority and proof flags cannot be promoted", () => {
  for (const mutate of [
    (value) => {
      value.authority.installGrantPresent = true;
    },
    (value) => {
      value.proofFlags.modelInvoked = true;
    },
    (value) => {
      value.proofFlags.mcpConnected = true;
    },
  ]) {
    const changed = clone(snapshot);
    mutate(changed);
    assert.throws(() => validateSnapshotShape(changed, schema));
  }
});

test("component admission and runtime claims cannot be promoted", () => {
  for (const key of ["upstreamIdentityBound", "runtimeVerified", "admitted", "canRun", "canConnect"]) {
    const changed = clone(snapshot);
    changed.components[0].claims[key] = true;
    assert.throws(() => validateSnapshotShape(changed, schema));
  }
});

test("component order and semantic content are frozen", () => {
  const reordered = clone(snapshot);
  [reordered.components[0], reordered.components[1]] = [reordered.components[1], reordered.components[0]];
  assert.throws(
    () => validateSnapshotShape(reordered, schema),
    ExistingComponentProvenanceError,
  );

  const edited = clone(snapshot);
  edited.components[4].unresolvedGaps[0] = "publisher discrepancy erased";
  assert.throws(() => validateSnapshotShape(edited, schema), /semantic digest drift/);
});

test("artifact path injection and artifact reordering fail closed", () => {
  const injected = clone(snapshot);
  injected.components[1].artifacts[0].path = "/Users/sirinx/.hermes/config.yaml";
  injected.components[1].artifacts[0].canonicalPath = "/Users/sirinx/.hermes/config.yaml";
  assert.throws(() => validateSnapshotShape(injected, schema));

  const reordered = clone(snapshot);
  [reordered.components[5].artifacts[0], reordered.components[5].artifacts[1]] = [
    reordered.components[5].artifacts[1],
    reordered.components[5].artifacts[0],
  ];
  assert.throws(() => validateSnapshotShape(reordered, schema));
});

test("Cargo package membership and checksums are frozen", () => {
  const changed = clone(snapshot);
  changed.components[3].packageRecords[0].lockChecksum = "0".repeat(64);
  changed.components[3].packageRecords[0].cacheArchiveSha256 = "0".repeat(64);
  assert.throws(() => validateSnapshotShape(changed, schema));
});

test("protected-read boundary cannot be narrowed or reordered", () => {
  const narrowed = clone(snapshot);
  narrowed.protectedReadBoundary.splice(1, 1);
  assert.throws(() => validateSnapshotShape(narrowed, schema));

  const reordered = clone(snapshot);
  reordered.protectedReadBoundary.reverse();
  assert.throws(() => validateSnapshotShape(reordered, schema));
});

test("capture metadata, baseline, and stop rules are semantically frozen", () => {
  for (const mutate of [
    (value) => {
      value.generatedAt = "2026-07-21T00:00:00Z";
    },
    (value) => {
      value.baseline.branch = "main";
    },
    (value) => {
      value.baseline.resourceReceipt.freeDiskKiB -= 1;
    },
    (value) => {
      value.stopRules.pop();
    },
  ]) {
    const changed = clone(snapshot);
    mutate(changed);
    assert.throws(() => validateSnapshotShape(changed, schema), /top-level semantic digest drift/);
  }
});

test("special permission bits fail closed", () => {
  assert.equal(modeMatchesExpected(0o100755n, "755"), true);
  assert.equal(modeMatchesExpected(0o104755n, "755"), false);
  assert.equal(modeMatchesExpected(0o102755n, "755"), false);
});

test("excessive JSON nesting and sparse-array width are rejected with bounded provenance errors", () => {
  const deep = clone(snapshot);
  let cursor = deep.components[0].observations;
  for (let index = 0; index < 300; index += 1) {
    const next = [];
    cursor.push(next);
    cursor = next;
  }
  assert.throws(
    () => validateSnapshotShape(deep, schema),
    (error) => error instanceof ExistingComponentProvenanceError && /maximum JSON nesting depth/.test(error.message),
  );

  const sparse = clone(snapshot);
  sparse.components.length = 0xffffffff;
  assert.throws(
    () => validateSnapshotShape(sparse, schema),
    (error) => error instanceof ExistingComponentProvenanceError && /array-length ceiling/.test(error.message),
  );
});

test("Proxy and accessor inputs are rejected without invoking traps", () => {
  let traps = 0;
  const proxied = new Proxy(snapshot, {
    get() {
      traps += 1;
      throw new Error("trap invoked");
    },
  });
  assert.throws(() => validateSnapshotShape(proxied, schema), /contains a Proxy/);
  assert.equal(traps, 0);

  const accessor = clone(snapshot);
  let getterReads = 0;
  Object.defineProperty(accessor.components[0], "status", {
    enumerable: true,
    get() {
      getterReads += 1;
      return "LOCAL_EVIDENCE_CAPTURED_NOT_ADMITTED";
    },
  });
  assert.throws(() => validateSnapshotShape(accessor, schema), /not a plain enumerable data property/);
  assert.equal(getterReads, 0);
});

test("validator source has no execution, network, environment, or write primitive", () => {
  const source = readFileSync(new URL("./validate-existing-component-provenance.mjs", import.meta.url), "utf8");
  for (const forbidden of [
    "node:child_process",
    "process.env",
    "fetch(",
    "node:http",
    "node:https",
    "writeFile",
    "appendFile",
    "unlink",
    "rename",
    "mkdir",
  ]) {
    assert.equal(source.includes(forbidden), false, `forbidden primitive present: ${forbidden}`);
  }
  for (const required of [
    "constants.O_NOFOLLOW",
    "constants.O_NONBLOCK",
    "fstatSync",
    "opened artifact identity drift",
    "artifact target changed while hashing",
    "opened repository file identity drift",
    "hard-link aliases",
    "repository read path is not allowlisted",
    "JSON array-length ceiling",
    "repository file exceeds bounded read ceiling",
    "0o7777n",
  ]) {
    assert.equal(source.includes(required), true, `race/mode defense missing: ${required}`);
  }
  assert.equal(source.includes('from "./validate-external-component-intake.mjs"'), false);
  assert.equal(source.includes("export function readCanonicalFile"), false);
  assert.ok(
    source.indexOf("opened repository file identity drift") <
      source.indexOf("const bytes = Buffer.alloc(Number(before.size))"),
    "repository fd identity must be checked before byte allocation/read",
  );
  assert.ok(
    source.indexOf("opened artifact identity drift") < source.indexOf("let remaining = expectedSize"),
    "artifact fd identity must be checked before the first byte read",
  );
});

import assert from "node:assert/strict";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";

import {
  collectEvidence,
  extractAxumRoutes,
  extractHttpRoutes,
  extractStringFirstArgumentCalls,
  loadStaticFiles,
  parseJsonRejectDuplicateKeys,
  runValidation,
  validateEvidence,
  validateManifest,
} from "./validate-b3-route-inventory.mjs";

function cloneManifest() {
  return structuredClone(loadStaticFiles().manifest);
}

function expectRejected(mutator, pattern) {
  const manifest = cloneManifest();
  mutator(manifest);
  assert.throws(() => validateManifest(manifest), pattern);
}

const validateSchemaInstance = new Ajv2020({ allErrors: true, strict: true })
  .compile(loadStaticFiles().schema);

function expectSchemaRejected(mutator) {
  const manifest = cloneManifest();
  mutator(manifest);
  assert.equal(validateSchemaInstance(manifest), false, "schema should reject unsafe manifest mutation");
  assert.ok(validateSchemaInstance.errors?.length, "schema rejection should include an error");
}

test("baseline is inventory-valid but explicitly not parity, completion, or authority", () => {
  const result = runValidation();
  assert.deepEqual(
    {
      status: result.status,
      sourceOperations: result.sourceOperations,
      targetRegistrations: result.targetRegistrations,
      exactParityCount: result.exactParityCount,
      parityComplete: result.parityComplete,
      b3Complete: result.b3Complete,
      productionReady: result.productionReady,
      resourceAdmission: result.resourceAdmission,
      authorityValidated: result.authorityValidated,
      canDispatch: result.canDispatch,
      canRegisterRoutes: result.canRegisterRoutes,
      externalEffectsAuthorized: result.externalEffectsAuthorized,
    },
    {
      status: "STATIC_INVENTORY_VALIDATED_NOT_PARITY",
      sourceOperations: 54,
      targetRegistrations: 10,
      exactParityCount: 0,
      parityComplete: false,
      b3Complete: false,
      productionReady: false,
      resourceAdmission: "HOLD",
      authorityValidated: false,
      canDispatch: false,
      canRegisterRoutes: false,
      externalEffectsAuthorized: false,
    },
  );
  assert.deepEqual(result.derived, {
    targetRoutes: 10,
    automationGatewayRoutes: 25,
    sirinxCanonicalOperations: 29,
    sirinxObservedOperations: 29,
  });

  let injectedCollectorCalled = false;
  const authoritativeResult = runValidation({
    collect: () => {
      injectedCollectorCalled = true;
      throw new Error("injected collector must not run");
    },
  });
  assert.equal(injectedCollectorCalled, false);
  assert.equal(authoritativeResult.status, "STATIC_INVENTORY_VALIDATED_NOT_PARITY");
});

test("raw JSON parser rejects duplicate keys before JSON.parse can overwrite them", () => {
  assert.throws(
    () => parseJsonRejectDuplicateKeys('{"status":"hold","status":"open"}', "fixture"),
    /duplicate key "status"/,
  );
});

test("manifest rejects unknown fields and authority promotion", () => {
  expectRejected(manifest => {
    manifest.unreviewed = true;
  }, /manifest keys must be exactly/);
  expectRejected(manifest => {
    manifest.authority.canExecute = true;
  }, /canExecute must remain false/);

  expectSchemaRejected(manifest => {
    manifest.operations[0].method = "QUERY";
  });
  expectSchemaRejected(manifest => {
    manifest.operations[1].id = "A01";
  });
  expectSchemaRejected(manifest => {
    manifest.operations[0].targetIds = [];
  });
  expectSchemaRejected(manifest => {
    manifest.operations.find(row => row.id === "A09").disposition = "OVERLAP_ONLY";
  });
  expectSchemaRejected(manifest => {
    manifest.operations.find(row => row.id === "S11").disposition = "HOLD_AUTH_DATA";
  });
});

test("manifest rejects missing, duplicate, and reordered source operation IDs", () => {
  expectRejected(manifest => {
    manifest.operations.pop();
  }, /exactly 54/);
  expectRejected(manifest => {
    manifest.operations[1].id = "A01";
  }, /operation IDs must be exactly/);
  expectRejected(manifest => {
    [manifest.operations[0], manifest.operations[1]] = [manifest.operations[1], manifest.operations[0]];
  }, /operation IDs must be exactly/);
});

test("name or target overlap can never claim exact parity or implementation", () => {
  expectRejected(manifest => {
    manifest.operations.find(row => row.id === "A01").exactParity = true;
  }, /cannot claim parity or implementation/);
  expectRejected(manifest => {
    manifest.operations.find(row => row.id === "S06").implemented = true;
  }, /cannot claim parity or implementation/);
});

test("security, privacy, and effect holds cannot be promoted", () => {
  for (const id of ["A02", "A13", "S02", "S23", "A09", "S03", "S27", "S29"]) {
    expectRejected(manifest => {
      manifest.operations.find(row => row.id === id).disposition = "OVERLAP_ONLY";
    }, /(requires a target reference|must remain held|IDs must be exactly)/);
  }
});

test("S11 and S12 remain safe replacements with zero exact-parity credit", () => {
  for (const id of ["S11", "S12"]) {
    expectRejected(manifest => {
      manifest.operations.find(row => row.id === id).disposition = "OVERLAP_ONLY";
    }, /overlap requires a target reference/);
    expectRejected(manifest => {
      manifest.operations.find(row => row.id === id).effect = "EXTERNAL_EFFECT";
    }, /safe replacement must be a public local read query/);
    expectRejected(manifest => {
      manifest.operations.find(row => row.id === id).exactParity = true;
    }, /cannot claim parity or implementation/);
  }
});

test("selected slice and completion flags cannot authorize work or claim B3 done", () => {
  expectRejected(manifest => {
    manifest.selectedSlice.authorizesImplementation = true;
  }, /selectedSlice drift/);
  expectRejected(manifest => {
    manifest.selectedSlice.authorizesMigration = true;
  }, /selectedSlice drift/);
  expectRejected(manifest => {
    manifest.completion.routeInventoryDiffEmpty = true;
  }, /completion must remain explicitly incomplete/);
  expectRejected(manifest => {
    manifest.completion.b3Complete = true;
  }, /completion must remain explicitly incomplete/);
});

test("snapshot paths and pins reject traversal, absolute paths, and digest drift", () => {
  expectRejected(manifest => {
    manifest.snapshots.sirinx.files[0].path = "../.env";
  }, /forbidden path form/);
  expectRejected(manifest => {
    manifest.snapshots.sirinx.files[0].path = "/Users/sirinx/.hermes/config.yaml";
  }, /forbidden path form/);
  expectRejected(manifest => {
    manifest.snapshots.sirinx.canonicalAuditCommit = "41dced72faae5536269f097c25626ffe004374a2";
  }, /canonicalAuditCommit drift/);
});

test("evidence rejects source HEAD and canonical blob digest drift", () => {
  const manifest = cloneManifest();
  const evidence = collectEvidence();
  evidence.snapshots.sirinx.observedHead = "0".repeat(40);
  assert.throws(() => validateEvidence(manifest, evidence), /observed HEAD drift/);

  const second = collectEvidence();
  second.snapshots.sirinx.files["server/routers.ts"].canonicalBytes = Buffer.from(
    second.snapshots.sirinx.files["server/routers.ts"].canonicalBytes,
  );
  second.snapshots.sirinx.files["server/routers.ts"].canonicalBytes[0] ^= 1;
  assert.throws(() => validateEvidence(manifest, second), /canonical blob drift/);

  const third = collectEvidence();
  third.snapshots.target.files["crates/sirinx-web/src/lib.rs"].observedBytes = Buffer.from(
    third.snapshots.target.files["crates/sirinx-web/src/lib.rs"].observedBytes,
  );
  third.snapshots.target.files["crates/sirinx-web/src/lib.rs"].observedBytes[0] ^= 1;
  assert.throws(() => validateEvidence(manifest, third), /observed file drift/);
});

test("extractors ignore comments and strings and distinguish methods on the same path", () => {
  const httpSource = [
    "    // app.get('/line-comment', handler)",
    "    /* opener text /*",
    "    */",
    "    const template = `",
    "      app.put('/template-string', handler)",
    "    `;",
    "    const multiline = \"not code",
    "      app.patch('/multiline-string', handler)",
    "    either\";",
    "    app.get('/same', readHandler)",
    "    app.post('/same', writeHandler)",
  ].join("\n");
  const http = extractHttpRoutes(httpSource, "app");
  assert.deepEqual(http, [
    { method: "GET", pathOrProcedure: "/same" },
    { method: "POST", pathOrProcedure: "/same" },
  ]);

  const axumSource = [
    "    //! .route(\"/line-comment\", get(example))",
    "    /*",
    "      .route(\"/block-comment\", delete(example))",
    "      /* nested */",
    "      .route(\"/nested-block-tail\", delete(example))",
    "    */",
    "    const RAW: &str = r#\"",
    "      .route(\"/raw-string\", put(example))",
    "    \"#;",
    "    const MULTILINE: &str = \"not code",
    "      .route(\"/multiline-string\", patch(example))",
    "    either\";",
    "    Router::new()",
    "      .route(\"/same\", get(read_handler))",
    "      .route(\"/same\", post(write_handler))",
  ].join("\n");
  const axum = extractAxumRoutes(axumSource);
  assert.deepEqual(axum, [
    { method: "GET", route: "/same" },
    { method: "POST", route: "/same" },
  ]);

  const mounts = extractStringFirstArgumentCalls([
    "/* app.use('/comment-only', handler) */",
    "const fixture = `app.use('/template-only', handler)`;",
    "app.use('/api/trpc', handler);",
  ].join("\n"), "app", "use");
  assert.deepEqual(mounts, ["/api/trpc"]);
});

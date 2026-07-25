// Compatibility status for the retired broad filesystem RAG prototype.
//
// Retrieval authority now belongs to the fixed-root, digest-bound
// `tools/graph-memory` ContextBundleV1 path consumed by Rust Harness
// Engineering. This module deliberately imports no filesystem, subprocess,
// provider, MCP, graph, or vault capability.

const replacement = {
  contract: "ContextBundleV1",
  implementation: "tools/graph-memory",
  coordinator: "sirinx-control::harness_engineering",
  futureApi: "/api/harness-engineering/runs"
};

const denied = {
  filesystemTraversal: false,
  subprocessLaunch: false,
  graphBuild: false,
  vaultRead: false,
  vaultWrite: false,
  providerCall: false,
  mcpConnection: false,
  externalWrite: false,
  productionWrite: false,
  deploy: false,
  push: false,
  messageSend: false
};

export function getLocalRagStatus() {
  return {
    schemaVersion: "1.0.0",
    title: "Local RAG Compatibility Surface",
    status: "deprecated",
    mode: "compatibility-status-only",
    replacement,
    capabilities: denied,
    externalWrites: false,
    productionWrites: false,
    customerVisible: false,
    canCallPaidApi: false,
    canActivateConnector: false,
    canRunMcp: false,
    canReadSecrets: false,
    canDeploy: false,
    canPublish: false,
    corpusScope: {
      id: "retired-broad-filesystem-scan",
      title: "Retired",
      projectRoot: "none",
      include: [],
      exclude: ["all direct filesystem scanning"]
    },
    dependency: {
      turbovec: { status: "retired", optional: false },
      pythonWorker: { status: "retired", path: "none" }
    },
    summary: {
      corpusScope: "ContextBundleV1 only",
      embeddingBackend: "none",
      optionalVectorIndex: "none",
      turbovecStatus: "retired",
      canCallPaidApi: false,
      canRunMcp: false,
      canReadSecrets: false,
      externalWrites: false
    },
    blockedActions: [
      "direct filesystem scan",
      "direct local-rag query",
      "subprocess launch",
      "provider call",
      "vault read"
    ],
    scannerAvailable: false,
    queryAvailable: false,
    executionAuthority: "NONE",
    stopPoint: "LOCAL RAG PROTOTYPE RETIRED — USE DIGEST-BOUND CONTEXTBUNDLEV1"
  };
}

export function getLocalRagGone(operation) {
  return {
    schemaVersion: "1.0.0",
    status: "gone",
    error: "local_rag_prototype_retired",
    operation,
    replacement,
    capabilities: denied,
    executionAuthority: "NONE"
  };
}

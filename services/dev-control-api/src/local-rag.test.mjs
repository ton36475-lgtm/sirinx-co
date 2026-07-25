import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getLocalRagGone, getLocalRagStatus } from "./local-rag.mjs";

describe("retired Local RAG compatibility module", () => {
  it("exposes status only and points to digest-bound ContextBundleV1", () => {
    expect(getLocalRagStatus()).toMatchObject({
      schemaVersion: "1.0.0",
      title: "Local RAG Compatibility Surface",
      status: "deprecated",
      mode: "compatibility-status-only",
      replacement: {
        contract: "ContextBundleV1",
        implementation: "tools/graph-memory",
        coordinator: "sirinx-control::harness_engineering",
        futureApi: "/api/harness-engineering/runs"
      },
      capabilities: {
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
      },
      externalWrites: false,
      canCallPaidApi: false,
      canRunMcp: false,
      canReadSecrets: false,
      corpusScope: {
        id: "retired-broad-filesystem-scan"
      },
      dependency: {
        turbovec: { status: "retired", optional: false }
      },
      summary: {
        embeddingBackend: "none",
        optionalVectorIndex: "none"
      },
      scannerAvailable: false,
      queryAvailable: false,
      executionAuthority: "NONE",
      stopPoint: "LOCAL RAG PROTOTYPE RETIRED — USE DIGEST-BOUND CONTEXTBUNDLEV1"
    });
  });

  it("returns a zero-authority gone response for retired operations", () => {
    expect(getLocalRagGone("query/dry-run")).toMatchObject({
      status: "gone",
      error: "local_rag_prototype_retired",
      operation: "query/dry-run",
      executionAuthority: "NONE",
      capabilities: {
        filesystemTraversal: false,
        subprocessLaunch: false,
        vaultRead: false,
        providerCall: false,
        externalWrite: false
      }
    });
  });

  it("contains no filesystem traversal, child process, Graphify, vault, or provider import", async () => {
    const source = await readFile(new URL("./local-rag.mjs", import.meta.url), "utf8");
    expect(source).not.toMatch(/from ["']node:(?:fs|child_process|path)["']/);
    expect(source).not.toMatch(/\b(?:readdir|readFile|execFile|spawn|graphify|turbovec)\s*\(/i);
    expect(source).not.toMatch(/OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY/);
  });
});

describe("retired Local RAG HTTP routes", () => {
  const port = 19200 + Math.floor(Math.random() * 1000);
  const baseUrl = `http://127.0.0.1:${port}`;
  let server;

  beforeAll(async () => {
    server = spawn("node", ["services/dev-control-api/server.mjs"], {
      cwd: process.cwd(),
      env: {
        PATH: process.env.PATH,
        DEV_CONTROL_API_PORT: String(port),
        DEV_CONTROL_API_HOST: "127.0.0.1"
      },
      stdio: ["ignore", "pipe", "pipe"]
    });
    await waitForServer(`${baseUrl}/api/local-rag`);
  }, 10000);

  afterAll(() => {
    if (server && !server.killed) {
      server.kill("SIGTERM");
    }
  });

  it("serves deprecation status", async () => {
    const response = await fetch(`${baseUrl}/api/local-rag`);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.status).toBe("deprecated");
    expect(body.executionAuthority).toBe("NONE");
  });

  for (const path of ["scan/dry-run", "query/dry-run"]) {
    it(`returns 410 without parsing or executing ${path}`, async () => {
      const response = await fetch(`${baseUrl}/api/local-rag/${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{untrusted-invalid-json"
      });
      const body = await response.json();
      expect(response.status).toBe(410);
      expect(body).toMatchObject({
        status: "gone",
        error: "local_rag_prototype_retired",
        operation: path,
        executionAuthority: "NONE"
      });
    });
  }
});

async function waitForServer(url) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 8000) {
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error(`server did not start for ${url}`);
}

import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  MCP_CONNECTION_PLAN_URL,
  getMcpConnectionPlan,
  validateMcpConnectionPlan
} from "./mcp-connection-plan.mjs";

async function rawPlan() {
  return JSON.parse(await readFile(MCP_CONNECTION_PLAN_URL, "utf8"));
}

describe("MCP and A2A connection plan", () => {
  it("keeps every service disabled and runtime-unverified", async () => {
    const plan = await getMcpConnectionPlan();

    expect(plan).toMatchObject({
      status: "PLAN_ONLY / ALL_CONNECTIONS_DISABLED",
      mode: "local-static-plan",
      canConnect: false,
      canRunMcp: false,
      canEmitA2a: false,
      canSendMessages: false,
      externalWrites: false,
      commandExecuted: false,
      summary: {
        connections: 16,
        enabled: 0,
        runtimeVerified: 0,
        remoteMcpServers: 2,
        mcpPortals: 1,
        mcpClients: 5,
        localMcpServers: 2,
        messagingTransports: 2,
        a2aPeers: 4
      }
    });
    expect(plan.connections.every((connection) => connection.enabled === false)).toBe(true);
    expect(plan.connections.every((connection) => connection.runtimeEvidence === "UNVERIFIED")).toBe(true);
    expect(plan.connections.every((connection) => connection.toolPolicy === "deny-all")).toBe(true);
  });

  it("rejects enablement, duplicate identities, insecure endpoints, and missing tickets", async () => {
    const base = await rawPlan();
    const mutations = [
      (plan) => { plan.connections[0].enabled = true; },
      (plan) => { plan.connections[1].connectionId = plan.connections[0].connectionId; },
      (plan) => { plan.connections[0].endpoint = "http://docs.example.test/mcp"; },
      (plan) => { plan.connections[0].requiredTicketKinds = []; },
      (plan) => { plan.generatedAt = "July 20, 2026"; },
      (plan) => { plan.connections[0].service = "x".repeat(129); },
      (plan) => { plan.connections[0].capabilities = ["x".repeat(129)]; },
      (plan) => { plan.connections[0].blockers = ["x".repeat(257)]; },
      (plan) => { plan.connections[0].notes = "x".repeat(1025); },
      (plan) => { plan.connections[0].endpoint = "https://user:password@docs.example.test/mcp"; },
      (plan) => { plan.connections[0].endpoint = "https://docs.example.test/mcp?token=redacted"; }
    ];

    for (const mutate of mutations) {
      const plan = structuredClone(base);
      mutate(plan);
      expect(() => validateMcpConnectionPlan(plan)).toThrow(/^invalid_mcp_connection_plan:/);
    }
  });

  it("contains no network or process-start primitive", async () => {
    const source = await readFile(new URL("./mcp-connection-plan.mjs", import.meta.url), "utf8");

    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/node:child_process/);
    expect(source).not.toMatch(/\.enabled\s*=\s*true/);
  });
});

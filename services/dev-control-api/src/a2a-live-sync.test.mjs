import { describe, expect, it, vi } from "vitest";
import {
  A2A_LIVE_SYNC_VERSION,
  buildAgentCard,
  buildAllAgentCards,
  getLiveSyncStatus,
  routeThroughControl
} from "./a2a-live-sync.mjs";

describe("a2a-live-sync", () => {
  describe("buildAgentCard", () => {
    it("returns a card for known agents", () => {
      const card = buildAgentCard("hermes-agent");
      expect(card).not.toBeNull();
      expect(card.id).toBe("hermes-agent");
      expect(card.name).toBe("Hermes Agent");
      expect(card.capabilities).toContain("orchestrate");
      expect(card.capabilities).toContain("route");
      expect(card.endpoint).toBe("http://127.0.0.1:9000");
      expect(card.priority).toBeGreaterThanOrEqual(0);
    });

    it("returns a card for telegram-bot with messaging capabilities", () => {
      const card = buildAgentCard("telegram-bot");
      expect(card).not.toBeNull();
      expect(card.capabilities).toContain("messaging");
      expect(card.capabilities).toContain("telegram");
      expect(card.capabilities).toContain("notify");
      expect(card.endpoint).toBe("http://127.0.0.1:8791");
    });

    it("returns a card for codex with coding capabilities", () => {
      const card = buildAgentCard("codex");
      expect(card).not.toBeNull();
      expect(card.capabilities).toContain("code");
      expect(card.capabilities).toContain("implement");
    });

    it("returns null for unknown agents", () => {
      expect(buildAgentCard("nonexistent")).toBeNull();
    });
  });

  describe("buildAllAgentCards", () => {
    it("returns cards for all 16 sync agents", () => {
      const cards = buildAllAgentCards();
      expect(cards).toHaveLength(16);
      const ids = cards.map((c) => c.id).sort();
      expect(ids).toContain("hermes-agent");
      expect(ids).toContain("codex");
      expect(ids).toContain("telegram-bot");
      expect(ids).toContain("a2a-sync");
      expect(ids).toContain("antigravity");
    });
  });

  describe("getLiveSyncStatus", () => {
    it("returns configured status without requiring a control plane", async () => {
      const status = await getLiveSyncStatus();
      expect(status.version).toBe(A2A_LIVE_SYNC_VERSION);
      expect(status.agentCount).toBe(16);
      expect(status.cards).toHaveLength(16);
      expect(status.mode).toBe("live-sync-configured");
    });
  });

  describe("routeThroughControl", () => {
    it("returns not-found when control plane is unreachable", async () => {
      const fetchImpl = vi.fn().mockRejectedValue(new Error("fetch failed"));
      const result = await routeThroughControl(["code"], { fetchImpl, timeoutMs: 100 });
      expect(result.found).toBe(false);
      expect(result.error).toBe("fetch failed");
    });

    it("returns not-found on 404", async () => {
      const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 404 });
      const result = await routeThroughControl(["code"], { fetchImpl, timeoutMs: 100 });
      expect(result.found).toBe(false);
    });

    it("returns card on successful route", async () => {
      const mockCard = { id: "codex", name: "Codex", capabilities: ["code"] };
      const fetchImpl = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCard)
      });
      const result = await routeThroughControl(["code"], { fetchImpl, timeoutMs: 100 });
      expect(result.found).toBe(true);
      expect(result.card.id).toBe("codex");
    });
  });

  describe("syncAllAgents with mock fetch", () => {
    it("reports failures when control plane is unreachable", async () => {
      const { syncAllAgents } = await import("./a2a-live-sync.mjs");
      const fetchImpl = vi.fn().mockRejectedValue(new Error("connection refused"));
      const result = await syncAllAgents({ fetchImpl, timeoutMs: 50 });
      expect(result.total).toBe(16);
      expect(result.registered).toBe(0);
      expect(result.failed).toBe(16);
    });

    it("reports success when all agents register", async () => {
      const { syncAllAgents } = await import("./a2a-live-sync.mjs");
      const fetchImpl = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ node: { id: "test" }, peerAgents: [], missingWork: [] })
      });
      const result = await syncAllAgents({ fetchImpl, timeoutMs: 100 });
      expect(result.total).toBe(16);
      expect(result.registered).toBe(16);
      expect(result.failed).toBe(0);
    });
  });
});

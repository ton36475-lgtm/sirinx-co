import { describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { queueLocalLeadSubmission, isDatabaseUnavailableError } from "./localLeadQueue";

describe("local lead queue", () => {
  it("detects database unavailable errors", () => {
    expect(isDatabaseUnavailableError(new Error("Database not available"))).toBe(true);
    expect(isDatabaseUnavailableError(new Error("Other failure"))).toBe(false);
  });

  it("queues lead submissions into local JSONL storage", async () => {
    const queueDir = await fs.mkdtemp(path.join(os.tmpdir(), "sirinx-local-leads-"));
    process.env.SIRINX_LOCAL_QUEUE_DIR = queueDir;

    const result = await queueLocalLeadSubmission(
      {
        source: "contact",
        name: "Local Queue Lead",
        message: "x".repeat(2500),
      },
      { ipAddress: "127.0.0.1", userAgent: "vitest" }
    );

    expect(result.path.endsWith("leads.jsonl")).toBe(true);

    const content = await fs.readFile(path.join(queueDir, "leads.jsonl"), "utf-8");
    const lastLine = content.trim().split(/\r?\n/).at(-1);
    expect(lastLine).toBeTruthy();

    const record = JSON.parse(lastLine ?? "{}") as {
      id: string;
      data: { name: string; message: string };
      context: { userAgent: string };
    };

    expect(record.id).toBe(result.id);
    expect(record.data.name).toBe("Local Queue Lead");
    expect(record.data.message.length).toBe(2000);
    expect(record.context.userAgent).toBe("vitest");

    delete process.env.SIRINX_LOCAL_QUEUE_DIR;
  });
});

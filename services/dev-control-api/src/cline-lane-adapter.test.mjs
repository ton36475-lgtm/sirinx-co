import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import { buildClineInvocation, runClineLane } from "./cline-lane-adapter.mjs";

function packet(overrides = {}) {
  return {
    role_id: "L4-37",
    duty: "maker",
    goal: "propose the smallest patch",
    action_class: "PROPOSAL_ONLY",
    stop_conditions: ["no provider call without ticket"],
    effects: { provider_call: false, queue_mutation: false, live_send: false, spawn: false },
    ...overrides
  };
}

const workspaceRoot = "/Users/sirinx/SIRINXDev/sirinx-co";

describe("Cline lane adapter", () => {
  it("builds a headless plan run with approval left on", () => {
    const invocation = buildClineInvocation(packet(), {
      workspaceRoot,
      timeoutSeconds: 600,
      model: "moonshotai/kimi-k2.7-code",
      dataDir: "/Users/sirinx/Downloads/cline-bot/data"
    });

    expect(invocation.command).toBe("cline");
    expect(invocation.mode).toBe("plan");
    expect(invocation.autoApprove).toBe(false);
    expect(invocation.args.slice(0, 2)).toEqual(["--json", "--cwd"]);
    expect(invocation.args).toContain("--auto-approve");
    expect(invocation.args[invocation.args.indexOf("--auto-approve") + 1]).toBe("false");
    expect(invocation.args).toContain("-p");
    expect(invocation.args).toContain("-m");
    expect(invocation.args).not.toContain("--yolo");
    expect(invocation.env.CLINE_MCP_SETTINGS_PATH).toBe(
      "/Users/sirinx/Downloads/cline-bot/data/settings/cline_mcp_settings.json"
    );
  });

  it("rejects auto-approve, relative paths, traversal, and secret-bearing values", () => {
    expect(() => buildClineInvocation(packet(), { workspaceRoot, autoApprove: true })).toThrow(
      /^invalid_cline_lane:auto_approve_must_stay_false/
    );
    expect(() => buildClineInvocation(packet(), { workspaceRoot: "relative/path" })).toThrow(
      /^invalid_cline_lane:workspace_root_must_be_absolute/
    );
    expect(() => buildClineInvocation(packet(), { workspaceRoot: "/tmp/../etc" })).toThrow(
      /^invalid_cline_lane:workspace_root_must_be_scoped/
    );
    expect(() => buildClineInvocation(packet(), { workspaceRoot, mode: "act" })).toThrow(
      /^invalid_cline_lane:act_requires_explicit_allow/
    );
    expect(() =>
      buildClineInvocation(packet(), { workspaceRoot, model: "model; rm -rf /" })
    ).toThrow(/^invalid_cline_lane:model/);
    expect(() =>
      buildClineInvocation(packet({ goal: "read the api_key value" }), { workspaceRoot })
    ).toThrow(/^invalid_cline_lane:prompt_must_not_carry_secrets/);
  });

  it("stays dry and never starts a process without flag, ticket, and runner", async () => {
    const invocation = buildClineInvocation(packet(), { workspaceRoot });
    const runner = vi.fn();

    expect(await runClineLane(invocation, { env: {}, runner })).toMatchObject({
      status: "DRY_RUN",
      providerCalled: false
    });

    expect(
      await runClineLane(invocation, { env: { SIRINX_CLINE_LIVE: "1" }, runner })
    ).toMatchObject({ status: "BLOCKED", reason: "missing_or_invalid_provider_call_ticket" });

    expect(
      await runClineLane(invocation, {
        env: { SIRINX_CLINE_LIVE: "1", SIRINX_PROVIDER_CALL_TICKET: "PROVIDER-CALL-0001" }
      })
    ).toMatchObject({ status: "BLOCKED", reason: "missing_injected_runner" });

    expect(runner).not.toHaveBeenCalled();
  });

  it("returns the run_result line and nothing else", async () => {
    const invocation = buildClineInvocation(packet(), { workspaceRoot });
    const runner = vi.fn(async () => ({
      stdout: [
        JSON.stringify({ type: "agent_event", text: "thinking" }),
        JSON.stringify({ type: "run_result", text: "patch proposal", sessionId: "s-1" })
      ].join("\n")
    }));

    const result = await runClineLane(invocation, {
      env: { SIRINX_CLINE_LIVE: "1", SIRINX_PROVIDER_CALL_TICKET: "PROVIDER-CALL-0001" },
      runner
    });

    expect(result).toEqual({
      status: "COMPLETED",
      providerCalled: true,
      text: "patch proposal",
      sessionId: "s-1"
    });
    expect(runner).toHaveBeenCalledWith("cline", invocation.args, expect.objectContaining({
      cwd: workspaceRoot,
      shell: false
    }));
  });

  it("contains no process primitive", async () => {
    const source = await readFile(new URL("./cline-lane-adapter.mjs", import.meta.url), "utf8");
    expect(source).not.toMatch(/node:child_process/);
    expect(source).not.toMatch(/\bfetch\s*\(/);
  });
});

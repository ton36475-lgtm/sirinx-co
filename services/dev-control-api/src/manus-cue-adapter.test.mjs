import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import {
  MANUS_TASK_CREATE_URL,
  buildManusTaskRequest,
  createManusTask
} from "./manus-cue-adapter.mjs";

function packet(overrides = {}) {
  return {
    task_id: "task_0123456789abcdef",
    run_id: "run_0123456789abcdef",
    role_id: "L2-17",
    duty: "source-analyst",
    goal: "summarise the public architecture notes",
    action_class: "PROPOSAL_ONLY",
    stop_conditions: ["no provider call without ticket"],
    effects: { provider_call: false, queue_mutation: false, live_send: false, spawn: false },
    ...overrides
  };
}

describe("Manus v2 adapter", () => {
  it("builds a private, non-interactive task.create request", () => {
    const request = buildManusTaskRequest(packet());

    expect(request.url).toBe(MANUS_TASK_CREATE_URL);
    expect(request.method).toBe("POST");
    expect(request.headers).toEqual({ "content-type": "application/json" });
    expect(request.auth).toEqual({
      headerName: "x-manus-api-key",
      credentialRef: "env:MANUS_API_KEY"
    });
    expect(request.body).toMatchObject({
      title: "L2-17 source-analyst",
      locale: "en",
      interactive_mode: false,
      hide_in_task_list: true,
      share_visibility: "private",
      agent_profile: "standard"
    });
    expect(request.body.message.content).toHaveLength(1);
    expect(request.body.message.content[0].visibility).toBe("visible");
    expect(JSON.stringify(request)).not.toMatch(/MANUS_API_KEY_VALUE/);
  });

  it("rejects effectful packets, unknown profiles, and secret-bearing prompts", () => {
    expect(() => buildManusTaskRequest(packet({ action_class: "EXECUTE" }))).toThrow(
      /^invalid_manus_task:action_class/
    );
    expect(() =>
      buildManusTaskRequest(packet({ effects: { ...packet().effects, provider_call: true } }))
    ).toThrow(/^invalid_manus_task:packet_effects/);
    expect(() => buildManusTaskRequest(packet(), { agentProfile: "turbo" })).toThrow(
      /^invalid_manus_task:agent_profile/
    );
    expect(() => buildManusTaskRequest(packet({ goal: "use api_key sk-live to finish" }))).toThrow(
      /^invalid_manus_task:prompt_must_not_carry_secrets/
    );
  });

  it("stays a dry run unless the live flag and a ticket are both present", async () => {
    const dry = await createManusTask(packet(), { env: {} });
    expect(dry).toMatchObject({ status: "DRY_RUN", providerCalled: false });

    const noTicket = await createManusTask(packet(), {
      env: { SIRINX_MANUS_LIVE: "1" }
    });
    expect(noTicket).toMatchObject({
      status: "BLOCKED",
      providerCalled: false,
      reason: "missing_or_invalid_provider_call_ticket"
    });

    const noFetch = await createManusTask(packet(), {
      env: { SIRINX_MANUS_LIVE: "1", SIRINX_PROVIDER_CALL_TICKET: "PROVIDER-CALL-0001" }
    });
    expect(noFetch).toMatchObject({
      status: "BLOCKED",
      providerCalled: false,
      reason: "missing_fetch_impl"
    });
  });

  it("passes the key only at call time and returns the created task", async () => {
    const fetchImpl = vi.fn(async (url, init) => ({
      ok: true,
      json: async () => ({
        ok: true,
        request_id: "req_1",
        task_id: "t".repeat(22),
        task_title: "L2-17 source-analyst",
        task_url: "https://manus.im/app/task",
        share_url: "https://manus.im/share/task",
        share_visibility: "private"
      })
    }));

    const result = await createManusTask(packet(), {
      env: {
        SIRINX_MANUS_LIVE: "1",
        SIRINX_PROVIDER_CALL_TICKET: "PROVIDER-CALL-0001",
        MANUS_API_KEY: "MANUS_API_KEY_VALUE"
      },
      fetchImpl
    });

    expect(result.status).toBe("CREATED");
    expect(result.providerCalled).toBe(true);
    expect(result.taskId).toBe("t".repeat(22));
    expect(JSON.stringify(result)).not.toContain("MANUS_API_KEY_VALUE");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(MANUS_TASK_CREATE_URL);
    expect(init.headers["x-manus-api-key"]).toBe("MANUS_API_KEY_VALUE");
    expect(init.headers["content-type"]).toBe("application/json");
  });

  it("maps an API refusal without inventing a task", async () => {
    const result = await createManusTask(packet(), {
      env: {
        SIRINX_MANUS_LIVE: "1",
        SIRINX_PROVIDER_CALL_TICKET: "PROVIDER-CALL-0001",
        MANUS_API_KEY: "MANUS_API_KEY_VALUE"
      },
      fetchImpl: async () => ({
        ok: false,
        json: async () => ({
          ok: false,
          request_id: "req_2",
          error: { code: "rate_limited", message: "slow down" }
        })
      })
    });

    expect(result).toMatchObject({ status: "ERROR", providerCalled: true, reason: "rate_limited" });
  });

  it("contains no network primitive outside the injected fetch", async () => {
    const source = await readFile(new URL("./manus-cue-adapter.mjs", import.meta.url), "utf8");
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/node:child_process/);
  });
});

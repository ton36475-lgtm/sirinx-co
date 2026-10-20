import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  VIBE_TEAM_PLAN_URL,
  buildVibeTeamPackets,
  getVibeTeamPlan,
  validateVibeTeamPlan
} from "./vibe-team-spawn.mjs";

async function rawPlan() {
  return JSON.parse(await readFile(VIBE_TEAM_PLAN_URL, "utf8"));
}

describe("vibe-team spawn plan", () => {
  it("validates the shipped plan with zero authority", async () => {
    const plan = await getVibeTeamPlan();

    expect(plan.status).toBe("PLAN_ONLY / LIVE_ADAPTERS_NOT_ACTIVATED");
    expect(plan.references.map((reference) => reference.referenceId)).toEqual([
      "openbot",
      "openmanus",
      "opendots"
    ]);
    expect(plan.lanes.map((lane) => lane.laneId)).toEqual(["cline", "manus", "cue"]);
    expect(plan.lanes.every((lane) => lane.liveCallsAllowed === false)).toBe(true);
    expect(Object.values(plan.authority).every((flag) => flag === false)).toBe(true);
    expect(plan.limits.maxCostMicroUsd).toBe(0);
    expect(plan.modelRouting).toMatchObject({
      provider: "freebuff",
      modelId: "gpt-6.1-sol",
      catalogSource: "infra/9router/model-catalog.json",
      catalogVerified: true,
      accessVerified: false,
      liveCallsAllowed: false
    });
  });

  it("builds deterministic packets capped by the worker limit", async () => {
    const plan = await getVibeTeamPlan();
    const first = buildVibeTeamPackets("map the public web routes", { plan, shapeId: "research" });
    const second = buildVibeTeamPackets("map the public web routes", { plan, shapeId: "research" });

    expect(first.packets.map((packet) => packet.task_id)).toEqual(
      second.packets.map((packet) => packet.task_id)
    );
    expect(first.worker_count).toBeLessThanOrEqual(plan.limits.maxWorkers);
    expect(first.coordinator).toMatch(/^task_[0-9a-f]{16}$/);
    expect(first.provider_called).toBe(false);
    expect(first.runtime_spawned).toBe(false);
    expect(first.queue_mutated).toBe(false);
    expect(first.packets.every((packet) => packet.action_class === "PROPOSAL_ONLY")).toBe(true);
    expect(
      first.packets.every(
        (packet) =>
          packet.model.model_id === "gpt-6.1-sol" &&
          packet.model.access_verified === false &&
          packet.model.live_calls_allowed === false
      )
    ).toBe(true);
    expect(
      first.packets.every((packet) =>
        Object.values(packet.effects).every((flag) => flag === false)
      )
    ).toBe(true);
  });

  it("rejects authority, live lanes, duplicate lanes, and worker overflow", async () => {
    const base = await rawPlan();
    const mutations = [
      (plan) => { plan.authority.providerCall = true; },
      (plan) => { plan.lanes[0].liveCallsAllowed = true; },
      (plan) => { plan.lanes[1].laneId = "cline"; },
      (plan) => { plan.lanes[2].endpoints = ["/v2/task.create"]; },
      (plan) => { plan.references[0].sourceUrl = "http://github.com/CopilotKit/OpenBot"; },
      (plan) => { plan.references[1].runtimeState = "INSTALLED"; },
      (plan) => { plan.teamShapes[1].maxWorkers = 5; },
      (plan) => { plan.teamShapes[0].roles[1].roleId = "not-a-role"; },
      (plan) => { plan.limits.maxCostMicroUsd = 1; },
      (plan) => { plan.modelRouting.accessVerified = true; },
      (plan) => { plan.modelRouting.liveCallsAllowed = true; },
      (plan) => { plan.modelRouting.modelId = "GPT 6.1 Sol"; },
      (plan) => { plan.modelRouting.catalogSource = "somewhere/else.json"; },
      (plan) => { plan.modelRouting.appliesToLanes = ["gemini"]; },
      (plan) => { plan.extra = true; }
    ];

    for (const mutate of mutations) {
      const plan = structuredClone(base);
      mutate(plan);
      expect(() => validateVibeTeamPlan(plan)).toThrow(/^invalid_vibe_team_plan:/);
    }
  });

  it("refuses to build packets without a goal or with an unknown shape", async () => {
    const plan = await getVibeTeamPlan();

    expect(() => buildVibeTeamPackets("", { plan })).toThrow(/^invalid_vibe_team_plan:goal/);
    expect(() => buildVibeTeamPackets("x".repeat(4001), { plan })).toThrow(/^invalid_vibe_team_plan:goal/);
    expect(() => buildVibeTeamPackets("goal", { plan, shapeId: "unknown" })).toThrow(
      /^invalid_vibe_team_plan:shape_missing/
    );
  });
});

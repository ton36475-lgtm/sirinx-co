import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { RONIN_ROLE_REGISTRY } from "../services/dev-control-api/src/ronin-role-registry.mjs";
import {
  validateBackgroundTaskPlan,
  validatePassiveCard,
  validateRepositoryContracts
} from "./validate-ronin-role-registry.mjs";

const root = new URL("..", import.meta.url).pathname;
const schedulePath = join(root, "config/agent-runtime/background-tasks.plan-only.v1.json");

function scheduleFixture() {
  return JSON.parse(readFileSync(schedulePath, "utf8"));
}

function roleCard(role) {
  return readFileSync(join(root, "docs/agents/ronin/cards", `${role.cardId}.md`), "utf8");
}

describe("Ronin passive-card and background-plan contracts", () => {
  it("validates every canonical role/card field and the disabled plan", async () => {
    const result = await validateRepositoryContracts();
    expect(result.failures).toEqual([]);
    expect(result.numberedCards).toHaveLength(47);
  });

  it("rejects canonical identity aliases in background assignments", () => {
    const schedule = scheduleFixture();
    schedule.tasks[0].roleAssignments[0].cardId = "ronin-13-positional-alias";

    expect(validateBackgroundTaskPlan(schedule, RONIN_ROLE_REGISTRY.roles)).toContain(
      "background plan: runtime-admission-observation role 13 cardId drifted"
    );
  });

  it("rejects unrelated contribution outputs and canonical cadence drift", () => {
    const schedule = scheduleFixture();
    schedule.tasks[0].roleAssignments[0].contributionOutputs = ["ResourceAdmissionV1"];
    schedule.tasks[0].roleAssignments[0].cadence = "Every 5 minutes.";

    const failures = validateBackgroundTaskPlan(schedule, RONIN_ROLE_REGISTRY.roles);
    expect(failures).toContain(
      "background plan: runtime-admission-observation role 13 declares non-canonical outputs: ResourceAdmissionV1"
    );
    expect(failures).toContain(
      "background plan: runtime-admission-observation role 13 cadence does not equal its canonical card cadence"
    );
  });

  it("rejects a receipt-producing contribution when receipt creation is prohibited", () => {
    const schedule = scheduleFixture();
    const task = schedule.tasks.find((candidate) => candidate.id === "gate-evidence-index");
    task.roleAssignments[0].contributionOutputs = ["transition-receipt"];

    expect(validateBackgroundTaskPlan(schedule, RONIN_ROLE_REGISTRY.roles)).toContain(
      "background plan: gate-evidence-index cannot contribute transition-receipt while receipt-create is prohibited"
    );
  });

  it("rejects any enabled task and any numerically convenient owner substitution", () => {
    const schedule = scheduleFixture();
    schedule.tasks[0].enabled = true;
    schedule.tasks[0].roleAssignments[0] = {
      ...schedule.tasks[0].roleAssignments[0],
      roleId: 16,
      cardId: "ronin-16-kinemon-context-summarizer",
      functionalRoleId: "perception.context-summarizer"
    };

    const failures = validateBackgroundTaskPlan(schedule, RONIN_ROLE_REGISTRY.roles);
    expect(failures).toContain("background plan: runtime-admission-observation must remain disabled");
    expect(failures).toContain("background plan: runtime-admission-observation role assignment allowlist drifted");
  });

  it("rejects drift in canonical Markdown identity, mission, or list sections", () => {
    const role = RONIN_ROLE_REGISTRY.roles.find((candidate) => candidate.roleId === 13);
    const drifted = roleCard(role)
      .replace("- Runtime principal: hermes", "- Runtime principal: positional-alias")
      .replace(role.mission, "Observe an unrelated system.")
      .replace(`- ${role.outputs[0]}`, "- unrelated-output");

    const failures = validatePassiveCard(role, drifted);
    expect(failures).toContain("role 13 card: Identity.Runtime principal drifted");
    expect(failures).toContain("role 13 card: mission drifted");
    expect(failures).toContain("role 13 card: outputs drifted");
  });
});

import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  AGENT_IDS,
  MULTI_AGENT_ROSTER,
  SPECIALIST_LANES,
  SPECIALIST_LANE_ROSTER,
  WORKFLOW_STAGES,
} from "@shared/_core/agentContracts";

const root = path.resolve(import.meta.dirname, "../..");

describe("multi-agent contract baseline", () => {
  it("keeps the governed five-agent roster in order", () => {
    expect(AGENT_IDS).toEqual(["Hermes", "Analyst", "Creator", "Validator", "Delivery"]);
    expect(WORKFLOW_STAGES).toEqual(["route", "analyze", "create", "validate", "deliver"]);
    expect(MULTI_AGENT_ROSTER.map((agent) => agent.stage)).toEqual(WORKFLOW_STAGES);
    expect(SPECIALIST_LANES).toEqual(["DatabaseSteward", "Mentor", "Apprentice"]);
    expect(SPECIALIST_LANE_ROSTER.map((lane) => lane.id)).toEqual(SPECIALIST_LANES);
  });

  it("keeps orchestration and manifest files parseable", () => {
    const orchestration = JSON.parse(
      readFileSync(path.join(root, "ORCHESTRATION_SCHEMA.json"), "utf8"),
    ) as {
      properties: {
        assigned_agent: { enum: string[] };
        workflow_stage: { enum: string[] };
        specialist_lane: { enum: Array<string | null> };
      };
    };

    const manifest = JSON.parse(
      readFileSync(path.join(root, ".ops", "contracts", "HANDOFF_BUNDLE_MANIFEST.json"), "utf8"),
    ) as {
      requiredFiles: string[];
    };

    expect(orchestration.properties.assigned_agent.enum).toEqual(AGENT_IDS);
    expect(orchestration.properties.workflow_stage.enum).toEqual(WORKFLOW_STAGES);
    expect(orchestration.properties.specialist_lane.enum).toEqual([
      "DatabaseSteward",
      "Mentor",
      "Apprentice",
      null,
    ]);
    expect(manifest.requiredFiles).toContain("AGENTS.md");
    expect(manifest.requiredFiles).toContain("ORCHESTRATION_SCHEMA.json");
    expect(manifest.requiredFiles).toContain(".ops/contracts/DELIVERY_SCHEMA.json");
    expect(manifest.requiredFiles).toContain(".ops/contracts/DATABASE_STEWARD_SCHEMA.json");
    expect(manifest.requiredFiles).toContain("docs/migration/HERMES_DATABASE_BRAIN_SETUP_RUNBOOK.md");
  });
});

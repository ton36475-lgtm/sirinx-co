#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const autoloopPath = "docs/roadmaps/ALL_PROJECT_GOAL_AUTOLOOP_20260708.json";
const ledgerPath = "docs/roadmaps/ALL_PROJECT_AGENT_NATIVE_INTEGRATION_LEDGER_20260708.json";
const backlogPath = "docs/roadmaps/ALL_PROJECT_EXECUTION_BACKLOG_20260708.json";
const discoveryPath = "docs/roadmaps/ALL_PROJECT_SOURCE_DISCOVERY_20260708.json";

const fail = (message) => {
  console.error(`all-project autoloop preview failed: ${message}`);
  process.exit(1);
};

const parseJson = (file) => {
  const fullPath = join(root, file);
  if (!existsSync(fullPath)) fail(`missing ${file}`);
  try {
    return JSON.parse(readFileSync(fullPath, "utf8"));
  } catch (error) {
    fail(`invalid JSON in ${file}: ${error.message}`);
  }
};

const autoloop = parseJson(autoloopPath);
const ledger = parseJson(ledgerPath);
const backlog = parseJson(backlogPath);
const discovery = parseJson(discoveryPath);

if (autoloop.mode !== "LOCAL_ONLY_GOAL_AUTOLOOP") {
  fail("autoloop mode must be LOCAL_ONLY_GOAL_AUTOLOOP");
}

const ledgerById = new Map((ledger.projects ?? []).map((project) => [project.id, project]));
const backlogById = new Map((backlog.projects ?? []).map((project) => [project.id, project]));
const discoveryById = new Map((discovery.projects ?? []).map((project) => [project.id, project]));

const projectIds = new Set([
  ...ledgerById.keys(),
  ...backlogById.keys(),
  ...discoveryById.keys(),
  ...(autoloop.projects ?? []).map((project) => project.id),
]);

const chooseNextBacklogTask = (project) => {
  const tasks = backlogById.get(project.id)?.tasks ?? [];
  return tasks.find((task) => task.status.includes("ready") || task.status.includes("pending")) ?? tasks[0] ?? null;
};

const classify = (project) => {
  if (project.hardStops.includes("manual_browser_uat_required")) return "WAIT_MANUAL_REVIEW";
  if (project.hardStops.includes("source_confirmation_required")) return "WAIT_SOURCE_CONFIRMATION";
  if (project.hardStops.some((stop) => stop.includes("gate_required"))) return "LOCAL_ONLY_GATE_GUARDED";
  return "LOCAL_READY";
};

const queue = (autoloop.projects ?? []).map((project) => {
  const ledgerProject = ledgerById.get(project.id);
  const discoveryProject = discoveryById.get(project.id);
  const nextTask = chooseNextBacklogTask(project);

  if (!ledgerProject) fail(`${project.id} missing from ledger`);
  if (!discoveryProject) fail(`${project.id} missing from source discovery`);
  if (project.ledgerState !== ledgerProject.currentState) {
    fail(`${project.id} ledgerState does not match ledger currentState`);
  }
  if (project.sourceState !== discoveryProject.status) {
    fail(`${project.id} sourceState does not match source discovery status`);
  }

  return {
    projectId: project.id,
    phase: project.phase,
    queueStatus: classify(project),
    ledgerState: project.ledgerState,
    sourceState: project.sourceState,
    nextLocalAction: project.allowedAutoloopActions[0],
    nextBacklogTask: nextTask
      ? {
          id: nextTask.id,
          status: nextTask.status,
          blockedUntil: nextTask.blockedUntil,
          evidenceRequired: nextTask.evidenceRequired,
        }
      : null,
    nextSafeGate: project.nextSafeGate,
    hardStops: project.hardStops,
    exactGateActions: project.controls?.requiresExactGateFor ?? [],
    dryRunOnly: true,
  };
});

for (const projectId of projectIds) {
  if (!queue.some((item) => item.projectId === projectId)) {
    fail(`missing project in preview queue: ${projectId}`);
  }
}

const summary = queue.reduce(
  (accumulator, item) => {
    accumulator.total += 1;
    accumulator.byStatus[item.queueStatus] = (accumulator.byStatus[item.queueStatus] ?? 0) + 1;
    return accumulator;
  },
  { total: 0, byStatus: {} },
);

const preview = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  mode: "LOCAL_ONLY_GOAL_AUTOLOOP_PREVIEW",
  dryRunOnly: true,
  sourceOfTruth: [autoloopPath, ledgerPath, backlogPath, discoveryPath],
  broadApprovalAliasesNotGates: autoloop.globalPolicy?.broadApprovalAliasesNotGates ?? [],
  summary,
  queue,
  blockedWithoutExactGate: autoloop.requiredExactGateActions ?? [],
};

console.log(JSON.stringify(preview, null, 2));

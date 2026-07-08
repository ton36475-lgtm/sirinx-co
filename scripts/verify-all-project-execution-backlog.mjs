#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const backlogPath = "docs/roadmaps/ALL_PROJECT_EXECUTION_BACKLOG_20260708.json";
const ledgerPath = "docs/roadmaps/ALL_PROJECT_AGENT_NATIVE_INTEGRATION_LEDGER_20260708.json";
const discoveryPath = "docs/roadmaps/ALL_PROJECT_SOURCE_DISCOVERY_20260708.json";

const requiredTasks = [
  "source_confirmation",
  "brd",
  "frd",
  "data_contract",
  "ui_flow",
  "test_cases",
  "rollback_plan",
  "local_verification",
  "evidence_packet",
  "exact_gate_review",
];

const fail = (message) => {
  console.error(`all-project execution backlog failed: ${message}`);
  process.exit(1);
};

const read = (file) => readFileSync(join(root, file), "utf8");
const parseJson = (file) => {
  try {
    return JSON.parse(read(file));
  } catch (error) {
    fail(`invalid JSON in ${file}: ${error.message}`);
  }
};

for (const file of [backlogPath, ledgerPath, discoveryPath]) {
  if (!existsSync(join(root, file))) fail(`missing ${file}`);
}

const backlog = parseJson(backlogPath);
const ledger = parseJson(ledgerPath);
const discovery = parseJson(discoveryPath);

if (backlog.schemaVersion !== 1) fail("schemaVersion must be 1");
if (backlog.mode !== "LOCAL_ONLY_BACKLOG") fail("mode must be LOCAL_ONLY_BACKLOG");

for (const sourceFile of backlog.sourceOfTruth ?? []) {
  if (!existsSync(join(root, sourceFile))) fail(`missing sourceOfTruth file ${sourceFile}`);
}
for (const requiredSource of [ledgerPath, discoveryPath, "docs/specs/all-projects/PROJECT_CONTEXT_PACKS_20260708.md"]) {
  if (!backlog.sourceOfTruth?.includes(requiredSource)) {
    fail(`sourceOfTruth missing ${requiredSource}`);
  }
}

if (!Array.isArray(backlog.projects) || backlog.projects.length === 0) {
  fail("backlog projects must be a non-empty array");
}

const backlogById = new Map(backlog.projects.map((project) => [project.id, project]));
const ledgerIds = new Set((ledger.projects ?? []).map((project) => project.id));
const discoveryIds = new Set((discovery.projects ?? []).map((project) => project.id));

for (const projectId of ledgerIds) {
  if (!backlogById.has(projectId)) fail(`missing backlog project from ledger: ${projectId}`);
}
for (const projectId of discoveryIds) {
  if (!backlogById.has(projectId)) fail(`missing backlog project from discovery: ${projectId}`);
}
for (const project of backlog.projects) {
  if (!ledgerIds.has(project.id)) fail(`unexpected backlog project not in ledger: ${project.id}`);
  if (!discoveryIds.has(project.id)) fail(`unexpected backlog project not in discovery: ${project.id}`);
  if (!Array.isArray(project.tasks)) fail(`${project.id} tasks must be an array`);
  if (project.tasks.length !== requiredTasks.length) {
    fail(`${project.id} must have ${requiredTasks.length} tasks`);
  }

  const taskIds = new Set(project.tasks.map((task) => task.id));
  for (const taskId of requiredTasks) {
    if (!taskIds.has(taskId)) fail(`${project.id} missing task ${taskId}`);
  }

  for (const task of project.tasks) {
    if (task.allowedMode !== "local_only") {
      fail(`${project.id}/${task.id} allowedMode must be local_only`);
    }
    if (!task.status) fail(`${project.id}/${task.id} missing status`);
    if (!task.blockedUntil) fail(`${project.id}/${task.id} missing blockedUntil`);
    if (!task.evidenceRequired) fail(`${project.id}/${task.id} missing evidenceRequired`);
    for (const forbidden of ["deploy=true", "push=true", "live_send=true", "crm_customer_data_storage=true"]) {
      if (JSON.stringify(task).includes(forbidden)) {
        fail(`${project.id}/${task.id} contains forbidden flag ${forbidden}`);
      }
    }
  }
}

console.log("All-project execution backlog verification passed.");

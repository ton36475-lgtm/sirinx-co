#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const autoloopPath = "docs/roadmaps/ALL_PROJECT_GOAL_AUTOLOOP_20260708.json";
const ledgerPath = "docs/roadmaps/ALL_PROJECT_AGENT_NATIVE_INTEGRATION_LEDGER_20260708.json";
const backlogPath = "docs/roadmaps/ALL_PROJECT_EXECUTION_BACKLOG_20260708.json";
const discoveryPath = "docs/roadmaps/ALL_PROJECT_SOURCE_DISCOVERY_20260708.json";

const safeLocalActions = new Set([
  "review_local_diff",
  "rerun_local_verification",
  "update_local_evidence",
  "draft_context_pack",
  "draft_spec_pack",
  "draft_uat_plan",
  "prepare_review_notes",
  "draft_gate_request",
  "run_read_only_inventory",
  "draft_governance_doc",
  "draft_offline_copy_matrix",
  "draft_editorial_policy",
  "update_task_dependency_map",
  "draft_rollback_plan",
]);

const requiredExactGateActions = [
  "git_push",
  "pr_creation_or_merge",
  "deploy",
  "webhook_activation",
  "production_analytics_mutation",
  "crm_customer_data_storage",
  "paid_provider_call",
  "customer_or_social_live_send",
  "secret_read_or_print",
];

const requiredBroadApprovalAliases = [
  "approve_all",
  "full_auto",
  "godmode",
  "max_auto_permission",
  "auto_approve",
];

const fail = (message) => {
  console.error(`all-project goal autoloop failed: ${message}`);
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

for (const file of [autoloopPath, ledgerPath, backlogPath, discoveryPath]) {
  if (!existsSync(join(root, file))) fail(`missing ${file}`);
}

const autoloop = parseJson(autoloopPath);
const ledger = parseJson(ledgerPath);
const backlog = parseJson(backlogPath);
const discovery = parseJson(discoveryPath);

if (autoloop.schemaVersion !== 1) fail("schemaVersion must be 1");
if (autoloop.mode !== "LOCAL_ONLY_GOAL_AUTOLOOP") fail("mode must be LOCAL_ONLY_GOAL_AUTOLOOP");
if (autoloop.authority !== "SIRINXDev Agent-Native Governed Monorepo") fail("authority mismatch");

for (const file of autoloop.sourceOfTruth ?? []) {
  if (!existsSync(join(root, file))) fail(`missing sourceOfTruth file ${file}`);
}
for (const requiredSource of [
  ledgerPath,
  backlogPath,
  discoveryPath,
  "docs/specs/all-projects/PROJECT_CONTEXT_PACKS_20260708.md",
  "docs/specs/all-projects/PER_PROJECT_SPEC_SKELETONS_20260708.md",
]) {
  if (!autoloop.sourceOfTruth?.includes(requiredSource)) {
    fail(`sourceOfTruth missing ${requiredSource}`);
  }
}

const policy = autoloop.globalPolicy ?? {};
for (const [field, expected] of [
  ["localOnly", true],
  ["dryRunDefault", true],
  ["externalWriteDefault", false],
  ["pushDefault", false],
  ["deployDefault", false],
  ["providerCallDefault", false],
  ["secretReadDefault", false],
  ["customerDataStorageDefault", false],
  ["liveSendDefault", false],
]) {
  if (policy[field] !== expected) fail(`globalPolicy.${field} must be ${expected}`);
}
for (const alias of requiredBroadApprovalAliases) {
  if (!policy.broadApprovalAliasesNotGates?.includes(alias)) {
    fail(`broadApprovalAliasesNotGates missing ${alias}`);
  }
}

for (const action of autoloop.safeLocalActionAllowlist ?? []) {
  if (!safeLocalActions.has(action)) fail(`unexpected safe local action ${action}`);
}
for (const action of safeLocalActions) {
  if (!autoloop.safeLocalActionAllowlist?.includes(action)) {
    fail(`safeLocalActionAllowlist missing ${action}`);
  }
}
for (const action of requiredExactGateActions) {
  if (!autoloop.requiredExactGateActions?.includes(action)) {
    fail(`requiredExactGateActions missing ${action}`);
  }
}

const ledgerById = new Map((ledger.projects ?? []).map((project) => [project.id, project]));
const backlogIds = new Set((backlog.projects ?? []).map((project) => project.id));
const discoveryById = new Map((discovery.projects ?? []).map((project) => [project.id, project]));
const autoloopById = new Map((autoloop.projects ?? []).map((project) => [project.id, project]));

if (autoloopById.size !== ledgerById.size) fail("project count must match governance ledger");

for (const projectId of ledgerById.keys()) {
  if (!autoloopById.has(projectId)) fail(`missing autoloop project from ledger: ${projectId}`);
  if (!backlogIds.has(projectId)) fail(`missing backlog project for ${projectId}`);
  if (!discoveryById.has(projectId)) fail(`missing discovery project for ${projectId}`);
}
for (const projectId of autoloopById.keys()) {
  if (!ledgerById.has(projectId)) fail(`unexpected autoloop project not in ledger: ${projectId}`);
}

for (const project of autoloop.projects) {
  const ledgerProject = ledgerById.get(project.id);
  const discoveryProject = discoveryById.get(project.id);

  if (!project.phase) fail(`${project.id} missing phase`);
  if (project.ledgerState !== ledgerProject.currentState) {
    fail(`${project.id} ledgerState must match governance ledger currentState`);
  }
  if (project.sourceState !== discoveryProject.status) {
    fail(`${project.id} sourceState must match source discovery status`);
  }
  if (project.nextSafeGate !== ledgerProject.nextSafeGate?.gate) {
    fail(`${project.id} nextSafeGate must match governance ledger`);
  }

  if (!Array.isArray(project.allowedAutoloopActions) || project.allowedAutoloopActions.length === 0) {
    fail(`${project.id} allowedAutoloopActions must be a non-empty array`);
  }
  for (const action of project.allowedAutoloopActions) {
    if (!safeLocalActions.has(action)) fail(`${project.id} has unsafe autoloop action ${action}`);
  }

  if (!Array.isArray(project.hardStops) || !project.hardStops.includes("exact_gate_required")) {
    fail(`${project.id} hardStops must include exact_gate_required`);
  }

  const exactGateActions = project.controls?.requiresExactGateFor ?? [];
  for (const action of requiredExactGateActions) {
    if (!exactGateActions.includes(action)) {
      fail(`${project.id} requiresExactGateFor missing ${action}`);
    }
  }

  if (!Array.isArray(project.evidenceRequired) || project.evidenceRequired.length === 0) {
    fail(`${project.id} evidenceRequired must be a non-empty array`);
  }
  for (const evidencePath of project.evidenceRequired) {
    if (!existsSync(join(root, evidencePath))) {
      fail(`${project.id} references missing evidence ${evidencePath}`);
    }
  }
}

console.log("All-project goal autoloop verification passed.");

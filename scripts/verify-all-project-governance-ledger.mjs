#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const ledgerPath = "docs/roadmaps/ALL_PROJECT_AGENT_NATIVE_INTEGRATION_LEDGER_20260708.json";
const requiredProjects = [
  "SIRINX_SOLAR",
  "POCKET_HATCHERY",
  "AGM_CREATIVE",
  "ADS_ANDROMEDA",
  "PHITSANULOK_NEWS",
  "GHOSTCLAW_OS",
  "SIRINXDEV_AGENT_NATIVE_MONOREPO",
];

const requiredGlobalBlocks = [
  "push_without_exact_gate",
  "deploy_without_exact_command",
  "line_webhook_activation_without_approval",
  "production_analytics_mutation_without_approval",
  "crm_customer_data_storage_without_approval",
  "secret_read_or_print",
  "paid_provider_call_without_approval",
  "customer_or_social_live_send_without_approval",
];

const requiredProjectBlocks = [
  "deploy",
  "production_analytics_mutation",
  "crm_customer_data_storage",
  "paid_provider_call",
  "secret_read_or_print",
];

const requiredApprovalGates = [
  "deploy",
  "production_analytics",
];

const fail = (message) => {
  console.error(`all-project governance ledger failed: ${message}`);
  process.exit(1);
};

const read = (file) => readFileSync(join(root, file), "utf8");

if (!existsSync(join(root, ledgerPath))) {
  fail(`missing ${ledgerPath}`);
}

let ledger;
try {
  ledger = JSON.parse(read(ledgerPath));
} catch (error) {
  fail(`invalid JSON in ${ledgerPath}: ${error.message}`);
}

if (ledger.schemaVersion !== 1) fail("schemaVersion must be 1");
if (ledger.mode !== "LOCAL_ONLY") fail("mode must be LOCAL_ONLY");
if (ledger.authority !== "SIRINXDev Agent-Native Governed Monorepo") {
  fail("authority mismatch");
}

for (const blockedAction of requiredGlobalBlocks) {
  if (!ledger.globalBlockedActions?.includes(blockedAction)) {
    fail(`globalBlockedActions missing ${blockedAction}`);
  }
}

if (!Array.isArray(ledger.projects)) fail("projects must be an array");
if (ledger.projects.length !== requiredProjects.length) {
  fail(`expected ${requiredProjects.length} projects, found ${ledger.projects.length}`);
}

const projectIds = new Set(ledger.projects.map((project) => project.id));
for (const projectId of requiredProjects) {
  if (!projectIds.has(projectId)) fail(`missing project ${projectId}`);
}

for (const project of ledger.projects) {
  if (!project.id || !requiredProjects.includes(project.id)) {
    fail(`unexpected project id ${project.id}`);
  }
  if (!project.displayName) fail(`${project.id} missing displayName`);
  if (!project.laneOwner) fail(`${project.id} missing laneOwner`);
  if (!project.surface) fail(`${project.id} missing surface`);
  if (!project.currentState) fail(`${project.id} missing currentState`);
  if (!Array.isArray(project.evidence) || project.evidence.length === 0) {
    fail(`${project.id} must have evidence paths`);
  }
  for (const evidencePath of project.evidence) {
    if (!existsSync(join(root, evidencePath))) {
      fail(`${project.id} references missing evidence ${evidencePath}`);
    }
  }

  if (!project.nextSafeGate?.gate) fail(`${project.id} missing nextSafeGate.gate`);
  if (!Array.isArray(project.nextSafeGate.allowedLocalActions) || project.nextSafeGate.allowedLocalActions.length === 0) {
    fail(`${project.id} missing allowed local actions`);
  }
  if (!Array.isArray(project.nextSafeGate.requiresApprovalBefore) || project.nextSafeGate.requiresApprovalBefore.length === 0) {
    fail(`${project.id} missing approval gates`);
  }
  for (const approvalGate of requiredApprovalGates) {
    if (!project.nextSafeGate.requiresApprovalBefore.includes(approvalGate)) {
      fail(`${project.id} approval gates missing ${approvalGate}`);
    }
  }

  if (!Array.isArray(project.blockedActions)) fail(`${project.id} missing blockedActions array`);
  for (const blockedAction of requiredProjectBlocks) {
    if (!project.blockedActions.includes(blockedAction)) {
      fail(`${project.id} blockedActions missing ${blockedAction}`);
    }
  }
}

const solar = ledger.projects.find((project) => project.id === "SIRINX_SOLAR");
if (solar.currentState !== "local_validated_remote_branch_pushed_review_pending") {
  fail("SIRINX_SOLAR currentState must record pushed branch review state");
}
if (!solar.nextSafeGate.requiresApprovalBefore.includes("pr_creation_or_merge")) {
  fail("SIRINX_SOLAR must require approval before PR creation or merge");
}
if (!solar.evidence.includes("docs/receipts/PUBLIC_WEB_PUSH_GATE_SUCCEEDED_20260708_1604.md")) {
  fail("SIRINX_SOLAR must reference successful push receipt");
}

console.log("All-project governance ledger verification passed.");

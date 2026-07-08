#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const skeletonPath = "docs/specs/all-projects/PER_PROJECT_SPEC_SKELETONS_20260708.md";
const ledgerPath = "docs/roadmaps/ALL_PROJECT_AGENT_NATIVE_INTEGRATION_LEDGER_20260708.json";
const backlogPath = "docs/roadmaps/ALL_PROJECT_EXECUTION_BACKLOG_20260708.json";

const requiredSubsections = [
  "### BRD",
  "### FRD",
  "### DATA_CONTRACT",
  "### UI_FLOW",
  "### TEST_CASES",
  "### ROLLBACK_PLAN",
];

const requiredGatePolicy = [
  "No push approval in this skeleton.",
  "No deploy approval in this skeleton.",
  "No LINE webhook activation approval in this skeleton.",
  "No production analytics approval in this skeleton.",
  "No CRM/customer data storage approval in this skeleton.",
  "No paid provider approval in this skeleton.",
  "No customer/social live send approval in this skeleton.",
  "No secret read or secret print.",
];

const forbiddenApprovalFlags = [
  "deploy=true",
  "push=true",
  "live_send=true",
  "crm_customer_data_storage=true",
  "production_analytics=true",
  "line_webhook_activation=true",
  "paid_provider_call=true",
];

const fail = (message) => {
  console.error(`all-project spec skeleton failed: ${message}`);
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

for (const file of [skeletonPath, ledgerPath, backlogPath]) {
  if (!existsSync(join(root, file))) fail(`missing ${file}`);
}

const skeleton = read(skeletonPath);
const ledger = parseJson(ledgerPath);
const backlog = parseJson(backlogPath);

if (!skeleton.includes("Status: `LOCAL_ONLY_DRAFT_PENDING_SOURCE_CONFIRMATION`")) {
  fail("skeleton status must be LOCAL_ONLY_DRAFT_PENDING_SOURCE_CONFIRMATION");
}
if (!skeleton.includes(`Source map: \`docs/roadmaps/ALL_PROJECT_SOURCE_DISCOVERY_20260708.json\``)) {
  fail("skeleton missing source map reference");
}
if (!skeleton.includes(`Backlog: \`docs/roadmaps/ALL_PROJECT_EXECUTION_BACKLOG_20260708.json\``)) {
  fail("skeleton missing backlog reference");
}

for (const policy of requiredGatePolicy) {
  if (!skeleton.includes(policy)) fail(`missing gate policy: ${policy}`);
}
for (const forbidden of forbiddenApprovalFlags) {
  if (skeleton.includes(forbidden)) fail(`forbidden approval flag present: ${forbidden}`);
}

if (!Array.isArray(ledger.projects) || ledger.projects.length === 0) {
  fail("ledger has no projects");
}
if (!Array.isArray(backlog.projects) || backlog.projects.length === 0) {
  fail("backlog has no projects");
}

const backlogIds = new Set(backlog.projects.map((project) => project.id));
for (const project of ledger.projects) {
  if (!backlogIds.has(project.id)) fail(`project missing from backlog: ${project.id}`);

  const heading = `## ${project.id}`;
  const headingIndex = skeleton.indexOf(heading);
  if (headingIndex === -1) fail(`missing project section ${heading}`);
  const nextHeadingIndex = skeleton.indexOf("\n## ", headingIndex + heading.length);
  const section = nextHeadingIndex === -1
    ? skeleton.slice(headingIndex)
    : skeleton.slice(headingIndex, nextHeadingIndex);

  if (!section.includes("Source status: `")) {
    fail(`${project.id} missing source status`);
  }
  for (const subsection of requiredSubsections) {
    if (!section.includes(subsection)) fail(`${project.id} missing subsection ${subsection}`);
  }
  for (const blockedMarker of ["no deploy", "blocked", "No", "gate"]) {
    if (!section.toLowerCase().includes(blockedMarker.toLowerCase())) {
      fail(`${project.id} section missing blocked/gate marker ${blockedMarker}`);
    }
  }
}

console.log("All-project spec skeleton verification passed.");

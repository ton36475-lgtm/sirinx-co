#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const ledgerPath = "docs/roadmaps/ALL_PROJECT_AGENT_NATIVE_INTEGRATION_LEDGER_20260708.json";
const specPackPath = "docs/specs/all-projects/PROJECT_CONTEXT_PACKS_20260708.md";

const requiredLabels = [
  "Project intent:",
  "Current evidence:",
  "Allowed local actions:",
  "Blocked actions:",
  "Next safe gate:",
];

const requiredGlobalRules = [
  "No push without exact push gate.",
  "No deploy without exact deploy command.",
  "No LINE webhook activation without exact approval.",
  "No production analytics mutation without exact approval.",
  "No CRM/customer data storage without exact approval.",
  "No customer/social live send without exact approval.",
  "No secret read or secret print.",
];

const forbiddenLiveFlags = [
  "live_send=true",
  "deploy=true",
  "crm_customer_data_storage=true",
  "production_analytics_mutation=true",
  "line_webhook_activation=true",
  "paid_provider_call=true",
];

const fail = (message) => {
  console.error(`all-project spec pack failed: ${message}`);
  process.exit(1);
};

const read = (file) => readFileSync(join(root, file), "utf8");

if (!existsSync(join(root, ledgerPath))) fail(`missing ${ledgerPath}`);
if (!existsSync(join(root, specPackPath))) fail(`missing ${specPackPath}`);

let ledger;
try {
  ledger = JSON.parse(read(ledgerPath));
} catch (error) {
  fail(`invalid JSON in ${ledgerPath}: ${error.message}`);
}

const specPack = read(specPackPath);

if (!specPack.includes("Status: `LOCAL_ONLY_SPEC_FOUNDATION`")) {
  fail("spec pack status must be LOCAL_ONLY_SPEC_FOUNDATION");
}
if (!specPack.includes("Authority: `SIRINXDev Agent-Native Governed Monorepo`")) {
  fail("spec pack authority mismatch");
}

for (const rule of requiredGlobalRules) {
  if (!specPack.includes(rule)) fail(`missing global rule: ${rule}`);
}

for (const forbiddenFlag of forbiddenLiveFlags) {
  if (specPack.includes(forbiddenFlag)) fail(`forbidden live flag present: ${forbiddenFlag}`);
}

if (!Array.isArray(ledger.projects) || ledger.projects.length === 0) {
  fail("ledger has no projects");
}

for (const project of ledger.projects) {
  const heading = `## ${project.id}`;
  const headingIndex = specPack.indexOf(heading);
  if (headingIndex === -1) fail(`missing project section ${heading}`);

  const nextHeadingIndex = specPack.indexOf("\n## ", headingIndex + heading.length);
  const section = nextHeadingIndex === -1
    ? specPack.slice(headingIndex)
    : specPack.slice(headingIndex, nextHeadingIndex);

  for (const label of requiredLabels) {
    if (!section.includes(label)) fail(`${project.id} missing label ${label}`);
  }

  for (const blockedAction of ["deploy", "production analytics", "CRM/customer data storage", "secret read"]) {
    if (!section.toLowerCase().includes(blockedAction.toLowerCase())) {
      fail(`${project.id} section missing blocked action marker: ${blockedAction}`);
    }
  }
}

console.log("All-project spec pack verification passed.");

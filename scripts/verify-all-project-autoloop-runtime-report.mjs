#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const reportPath = ".ghostclaw_runtime/all-project-autoloop/latest.json";
const markdownPath = ".ghostclaw_runtime/all-project-autoloop/latest.md";

const requiredProjects = [
  "SIRINX_SOLAR",
  "POCKET_HATCHERY",
  "AGM_CREATIVE",
  "ADS_ANDROMEDA",
  "PHITSANULOK_NEWS",
  "GHOSTCLAW_OS",
  "SIRINXDEV_AGENT_NATIVE_MONOREPO",
];

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

const safetyKeys = [
  "deploy",
  "push",
  "prOrMerge",
  "webhookActivation",
  "productionAnalyticsMutation",
  "crmCustomerDataStorage",
  "providerCall",
  "liveSend",
  "secretReadOrPrint",
  "packageInstall",
];

const fail = (message) => {
  console.error(`all-project autoloop runtime report failed: ${message}`);
  process.exit(1);
};

const gitValue = (...args) => {
  const result = spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
    timeout: 10_000,
  });
  if (result.status !== 0) {
    fail(`git ${args.join(" ")} failed: ${(result.stderr || result.stdout || "").trim()}`);
  }
  return result.stdout.trim();
};

const read = (file) => {
  const fullPath = join(root, file);
  if (!existsSync(fullPath)) fail(`missing ${file}; run npm run autoloop:dry-run first`);
  return readFileSync(fullPath, "utf8");
};

let report;
try {
  report = JSON.parse(read(reportPath));
} catch (error) {
  fail(`invalid JSON in ${reportPath}: ${error.message}`);
}

const markdown = read(markdownPath);

if (report.schemaVersion !== 1) fail("schemaVersion must be 1");
if (report.mode !== "LOCAL_ONLY_GOAL_AUTOLOOP_DRY_RUN_REPORT") {
  fail("mode must be LOCAL_ONLY_GOAL_AUTOLOOP_DRY_RUN_REPORT");
}
if (report.dryRunOnly !== true) fail("dryRunOnly must be true");

const currentBranch = gitValue("branch", "--show-current");
const currentHead = gitValue("rev-parse", "HEAD");
if (report.branch !== currentBranch) fail(`branch mismatch: report=${report.branch}, current=${currentBranch}`);
if (report.head !== currentHead) fail(`head mismatch: report=${report.head}, current=${currentHead}`);

if (!report.sha256) fail("missing sha256");
const { sha256, ...reportWithoutHash } = report;
const recomputed = createHash("sha256")
  .update(`${JSON.stringify(reportWithoutHash, null, 2)}\n`)
  .digest("hex");
if (sha256 !== recomputed) fail("sha256 digest mismatch");
if (!markdown.includes(sha256)) fail("latest markdown does not include report sha256");

for (const key of safetyKeys) {
  if (report.safety?.[key] !== false) fail(`safety.${key} must be false`);
}

if (!Array.isArray(report.checks) || report.checks.length < 2) fail("checks must contain verifier and preview");
for (const check of report.checks) {
  if (check.ok !== true) fail(`check did not pass: ${check.name}`);
}

if (report.previewSummary?.total !== requiredProjects.length) {
  fail(`previewSummary.total must be ${requiredProjects.length}`);
}
if (!Array.isArray(report.queue) || report.queue.length !== requiredProjects.length) {
  fail(`queue must contain ${requiredProjects.length} projects`);
}
const projectIds = new Set(report.queue.map((item) => item.projectId));
for (const projectId of requiredProjects) {
  if (!projectIds.has(projectId)) fail(`queue missing project ${projectId}`);
}
for (const item of report.queue) {
  if (item.dryRunOnly !== true) fail(`${item.projectId} dryRunOnly must be true`);
  for (const action of requiredExactGateActions) {
    if (!item.exactGateActions?.includes(action)) {
      fail(`${item.projectId} exactGateActions missing ${action}`);
    }
  }
}

for (const action of requiredExactGateActions) {
  if (!report.blockedWithoutExactGate?.includes(action)) {
    fail(`blockedWithoutExactGate missing ${action}`);
  }
}
for (const alias of requiredBroadApprovalAliases) {
  if (!report.broadApprovalAliasesNotGates?.includes(alias)) {
    fail(`broadApprovalAliasesNotGates missing ${alias}`);
  }
}

console.log("All-project autoloop runtime report verification passed.");

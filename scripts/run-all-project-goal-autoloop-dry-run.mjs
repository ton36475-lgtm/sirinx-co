#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const runtimeDir = join(root, ".ghostclaw_runtime", "all-project-autoloop");

const run = (name, command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    timeout: options.timeout ?? 30_000,
  });
  return {
    name,
    command: [command, ...args],
    exitCode: result.status,
    ok: result.status === 0,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
};

const fail = (message, checks = []) => {
  const detail = checks
    .map((check) => {
      const output = [check.stdout, check.stderr].filter(Boolean).join("\n").trim();
      return `${check.name}: exit=${check.exitCode}${output ? `\n${output}` : ""}`;
    })
    .join("\n\n");
  console.error(`all-project autoloop dry-run failed: ${message}`);
  if (detail) console.error(detail);
  process.exit(1);
};

const parseJson = (text, label) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`invalid JSON from ${label}: ${error.message}`);
  }
};

const gitValue = (...args) => {
  const result = run(`git ${args.join(" ")}`, "git", args, { timeout: 10_000 });
  return result.ok ? result.stdout.trim() : "unknown";
};

const verify = run("verify all-project goal autoloop", "node", [
  "scripts/verify-all-project-goal-autoloop.mjs",
]);
if (!verify.ok) fail("autoloop verification failed", [verify]);

const previewResult = run("preview all-project goal autoloop", "node", [
  "scripts/preview-all-project-goal-autoloop.mjs",
]);
if (!previewResult.ok) fail("autoloop preview failed", [verify, previewResult]);

const preview = parseJson(previewResult.stdout, previewResult.name);
if (preview.mode !== "LOCAL_ONLY_GOAL_AUTOLOOP_PREVIEW" || preview.dryRunOnly !== true) {
  fail("preview is not local-only dry-run output", [verify, previewResult]);
}

const generatedAt = new Date().toISOString();
const branch = gitValue("branch", "--show-current");
const head = gitValue("rev-parse", "HEAD");
const remoteHead = gitValue("rev-parse", `origin/${branch}`);
const gitStatus = gitValue("status", "--short", "--branch");

const report = {
  schemaVersion: 1,
  generatedAt,
  mode: "LOCAL_ONLY_GOAL_AUTOLOOP_DRY_RUN_REPORT",
  dryRunOnly: true,
  branch,
  head,
  remoteHead,
  localMatchesRemote: head === remoteHead,
  gitStatus,
  safety: {
    deploy: false,
    push: false,
    prOrMerge: false,
    webhookActivation: false,
    productionAnalyticsMutation: false,
    crmCustomerDataStorage: false,
    providerCall: false,
    liveSend: false,
    secretReadOrPrint: false,
    packageInstall: false,
  },
  checks: [
    {
      name: verify.name,
      command: verify.command,
      ok: verify.ok,
      exitCode: verify.exitCode,
      outputPreview: verify.stdout.trim().split("\n").filter(Boolean).slice(0, 20),
    },
    {
      name: previewResult.name,
      command: previewResult.command,
      ok: previewResult.ok,
      exitCode: previewResult.exitCode,
      outputPreview: [`queue_total=${preview.summary?.total ?? "unknown"}`],
    },
  ],
  previewSummary: preview.summary,
  queue: preview.queue,
  blockedWithoutExactGate: preview.blockedWithoutExactGate,
  broadApprovalAliasesNotGates: preview.broadApprovalAliasesNotGates,
};

const reportPayload = `${JSON.stringify(report, null, 2)}\n`;
const digest = createHash("sha256").update(reportPayload).digest("hex");
const timestamp = generatedAt.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const reportWithHash = { ...report, sha256: digest };
const reportWithHashPayload = `${JSON.stringify(reportWithHash, null, 2)}\n`;

mkdirSync(runtimeDir, { recursive: true });
const jsonPath = join(runtimeDir, `${timestamp}.json`);
const latestJsonPath = join(runtimeDir, "latest.json");
const latestMarkdownPath = join(runtimeDir, "latest.md");

writeFileSync(jsonPath, reportWithHashPayload);
writeFileSync(latestJsonPath, reportWithHashPayload);
writeFileSync(
  latestMarkdownPath,
  [
    "# All-Project Goal Autoloop Dry-Run Report",
    "",
    `Generated: ${generatedAt}`,
    `Branch: ${branch}`,
    `HEAD: ${head}`,
    `Remote HEAD: ${remoteHead}`,
    `Local matches remote: ${head === remoteHead}`,
    `SHA-256: ${digest}`,
    "",
    "## Summary",
    "",
    `- Total lanes: ${preview.summary?.total ?? "unknown"}`,
    ...Object.entries(preview.summary?.byStatus ?? {}).map(([status, count]) => `- ${status}: ${count}`),
    "",
    "## Blocked Without Exact Gate",
    "",
    ...(preview.blockedWithoutExactGate ?? []).map((action) => `- ${action}`),
    "",
    "## Safety",
    "",
    "- Deploy: false",
    "- Push: false",
    "- PR/merge: false",
    "- Webhook activation: false",
    "- Production analytics mutation: false",
    "- CRM/customer data storage: false",
    "- Provider call: false",
    "- Live send: false",
    "- Secret read or print: false",
    "- Package install: false",
    "",
  ].join("\n"),
);

console.log(`All-project goal autoloop dry-run passed.`);
console.log(`Report: ${jsonPath}`);
console.log(`Latest JSON: ${latestJsonPath}`);
console.log(`Latest Markdown: ${latestMarkdownPath}`);
console.log(`SHA-256: ${digest}`);

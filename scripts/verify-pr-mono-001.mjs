import { existsSync, lstatSync, readdirSync, readFileSync } from "node:fs";
import { join, sep } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "AGENTS.md",
  "agent.md",
  "README.md",
  "PROJECT_STATE.md",
  "NEXT_ACTIONS.md",
  "REPO_AUDIT_AND_MERGE_MAP.md",
  "SECURITY_QUARANTINE_REPORT.md",
  "AGENTS_SOURCE_INTEGRITY.md",
  "HERMES_AUTOPILOT_STATUS.md",
  "BRAIN_DNA_IMPORT_RULES.md",
  "MONOREPO_TARGET_TREE.md",
  "MIGRATION_SEQUENCE.md",
  "NODE_TOPOLOGY.md",
  "MAC_CONTROL_PLANE.md",
  "WINDOWS_WORKER_NODE.md",
  "NETWORK_PORT_MAP.md",
  "CLOUDFLARE_EDGE_PLAN.md",
  "CLOUDFLARE_ACCESS_POLICY.md",
  "PUBLIC_WEBSITE_GO_LIVE_CHECKLIST.md",
  "MAC_HANDOFF_CHECKLIST.md",
  "RELEASE_GATE.md",
  "VALIDATION_MATRIX.md",
  "ALPHA_VERIFICATION_REPORT.md",
  "MOBILE_COMMAND_CENTER_SCHEMA.md",
  "ALL_DEVICE_TOPOLOGY.md",
  "NODE_HEARTBEAT_SCHEMA.md",
  "EMERGENCY_STOP_RUNBOOK.md",
  "CODEX_WORK_REPORT.md",
  ".env.example",
  "package.json",
  "pnpm-workspace.yaml",
  "turbo.json",
];

const forbiddenEnvNames = new Set([
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  ".env.test",
]);

const skipDirs = new Set([".git", "node_modules", "dist", "build", ".next"]);
const skipPathPrefixes = [join(root, "tools", "repo-intake")];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (skipDirs.has(entry)) continue;
    const full = join(dir, entry);
    if (skipPathPrefixes.some((prefix) => full === prefix || full.startsWith(`${prefix}${sep}`))) {
      continue;
    }
    const stat = lstatSync(full);
    if (stat.isDirectory()) {
      walk(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));
if (missing.length > 0) {
  console.error("Missing required PR-MONO-001 files:");
  for (const file of missing) console.error(`- ${file}`);
  process.exit(1);
}

const allFiles = walk(root);
const forbiddenEnvFiles = allFiles
  .map((file) => file.slice(root.length + 1))
  .filter((file) => forbiddenEnvNames.has(file.split("/").pop()));

if (forbiddenEnvFiles.length > 0) {
  console.error("Forbidden real env files found:");
  for (const file of forbiddenEnvFiles) console.error(`- ${file}`);
  process.exit(1);
}

const repoMap = readFileSync(join(root, "REPO_AUDIT_AND_MERGE_MAP.md"), "utf8");
for (const repo of [
  "automated-marketing-agency",
  "sirinx-solar-energy",
  "sirinx",
  "ghost-claw-os",
  "automation-mobile-app",
  "automation-system-backend",
  "automation-documentation",
  "automation-dashboard",
  "chokma-growth-os",
  "oz_mobile_app",
  "oz-corp-omega-dual-node",
]) {
  if (!repoMap.includes(repo)) {
    console.error(`Repo inventory is missing ${repo}`);
    process.exit(1);
  }
}

const releaseGate = readFileSync(join(root, "RELEASE_GATE.md"), "utf8");
if (!releaseGate.includes("Gate 15: Cloudflare Edge Gate")) {
  console.error("Cloudflare Gate 15 is missing from RELEASE_GATE.md");
  process.exit(1);
}

const autopilot = readFileSync(join(root, "HERMES_AUTOPILOT_STATUS.md"), "utf8");
if (autopilot.includes(".github/workflows") && !autopilot.includes("not installed under `.github/workflows`")) {
  console.error("Autopilot status must keep workflow assets disabled in PR-MONO-001");
  process.exit(1);
}

console.log("PR-MONO-001 verification passed.");

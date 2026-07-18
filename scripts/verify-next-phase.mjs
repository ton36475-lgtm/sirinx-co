import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const required = [
  "docs/ADAPTIVE_SYNC_PC_NODE.md",
  "docs/TELEGRAM_CONTROL_PLANE.md",
  "docs/VIBECODING_READY_MONOREPO.md",
  "docs/PIPELINE_AUDIT_RUNBOOK.md",
  "docs/NEXT_PHASE_EXECUTION_PLAN.md",
  "apps/mobile-command/README.md",
  "services/telegram-command-bot/README.md",
  "services/telegram-command-bot/src/index.mjs",
  "packages/types/src/command-schemas.ts",
  "infra/windows/drive-d/setup-drive-d.ps1",
  "scripts/adaptive-sync-plan.mjs",
  "scripts/pipeline-audit.mjs",
  "scripts/telegram-notify-preview.mjs",
  "scripts/windows-drive-d-handoff.mjs",
  "memory/CHAT_SYSTEM_INGEST_MANIFEST.md",
];

const missing = required.filter((file) => !existsSync(join(root, file)));
if (missing.length > 0) {
  console.error("Missing next-phase files:");
  for (const file of missing) console.error(`- ${file}`);
  process.exit(1);
}

const skipDirs = new Set([".git", "node_modules", "dist", "build", ".next"]);
const forbiddenNames = new Set([".env", ".env.local", ".env.production", ".env.development", ".env.test"]);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (skipDirs.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

const forbidden = walk(root)
  .map((file) => file.slice(root.length + 1))
  .filter((file) => forbiddenNames.has(file.split("/").pop()));

if (forbidden.length > 0) {
  console.error("Forbidden real env files found:");
  for (const file of forbidden) console.error(`- ${file}`);
  process.exit(1);
}

// Phase advanced (Rust monorepo migration): CI is now required instead of
// forbidden. Deploy-style workflows remain out of scope — only ci.yml may
// exist until the deploy gate opens.
const workflowsDir = join(root, ".github", "workflows");
if (!existsSync(join(workflowsDir, "ci.yml"))) {
  console.error("CI workflow .github/workflows/ci.yml must exist in this phase.");
  process.exit(1);
}
const allowedWorkflows = new Set(["ci.yml"]);
for (const file of readdirSync(workflowsDir)) {
  if (!allowedWorkflows.has(file)) {
    console.error(`Unexpected workflow '${file}' — only ci.yml is allowed before the deploy gate opens.`);
    process.exit(1);
  }
}

console.log("Next phase AdaptiveSync/Telegram scaffold verification passed.");

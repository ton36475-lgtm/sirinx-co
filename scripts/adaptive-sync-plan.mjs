import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const targetArg = process.argv.find((arg) => arg.startsWith("--target="));
const requestedTarget =
  targetArg?.slice("--target=".length) ||
  process.env.SIRINX_WINDOWS_D_MOUNT ||
  "/Volumes/Windows-D/SIRINX_OS/sirinx-co";

const dryRun = !args.has("--execute");
const confirm = process.env.SIRINX_SYNC_CONFIRM === "EXECUTE";
const target = requestedTarget;
const targetExists = existsSync(target);

const excludes = [
  ".git/",
  ".env",
  ".env.*",
  ".ssh/",
  "node_modules/",
  "dist/",
  "build/",
  ".next/",
  "coverage/",
  "playwright-report/",
  "test-results/",
  ".turbo/",
  ".cache/",
  "quarantine/raw/",
  "legacy-cache/",
  "*.pem",
  "*.key",
  "*.p12",
  "*.log",
];

if (!dryRun && !confirm) {
  console.error("Refusing execution: set SIRINX_SYNC_CONFIRM=EXECUTE and pass --execute after human approval.");
  process.exit(1);
}

const rsyncArgs = [
  "-a",
  "--delete",
  "--itemize-changes",
  ...(dryRun ? ["--dry-run"] : []),
  ...excludes.flatMap((pattern) => ["--exclude", pattern]),
  `${root}/`,
  target,
];

const plan = {
  generatedAt: new Date().toISOString(),
  mode: dryRun ? "dry-run" : "execute",
  source: root,
  target,
  windowsNativeTarget: "D:\\SIRINX_OS\\sirinx-co",
  targetExists,
  command: ["rsync", ...rsyncArgs],
  excludes,
  status: targetExists ? "ready_for_dry_run" : "target_unavailable",
  guardrails: [
    "No raw home-directory mirror",
    "No secrets",
    "No caches",
    "No .git directory",
    "No execution without SIRINX_SYNC_CONFIRM=EXECUTE",
  ],
};

mkdirSync(join(root, "exports"), { recursive: true });
writeFileSync(join(root, "exports", "adaptive-sync-plan-latest.json"), `${JSON.stringify(plan, null, 2)}\n`);

if (targetExists) {
  const result = spawnSync("rsync", rsyncArgs, { encoding: "utf8" });
  plan.rsyncExitCode = result.status;
  plan.rsyncStdoutPreview = result.stdout.split("\n").slice(0, 120);
  plan.rsyncStderrPreview = result.stderr.split("\n").slice(0, 40);
  writeFileSync(join(root, "exports", "adaptive-sync-plan-latest.json"), `${JSON.stringify(plan, null, 2)}\n`);
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exit(result.status ?? 0);
}

console.log(JSON.stringify(plan, null, 2));
console.log("\nWindows D: is not mounted on this Mac. Mount the share, set SIRINX_WINDOWS_D_MOUNT, then rerun npm run sync:plan.");

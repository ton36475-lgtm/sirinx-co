#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DEFAULT_SOURCE_REPO = "https://github.com/ton36475-lgtm/sirinx.git";
const DEFAULT_SOURCE_REF = "main";
const DEFAULT_TARGET = "apps/public-web";

const IMPORT_PATHS = [
  "package.json",
  "pnpm-lock.yaml",
  "vite.config.ts",
  "tsconfig.json",
  "components.json",
  "drizzle.config.ts",
  "client",
  "server",
  "shared",
  "brands",
  "drizzle",
  "patches",
  "attached_assets",
];

function parseArgs(argv) {
  const args = {
    sourceRepo: process.env.SIRINX_SOURCE_REPO || DEFAULT_SOURCE_REPO,
    sourceRef: process.env.SIRINX_SOURCE_REF || DEFAULT_SOURCE_REF,
    target: process.env.SIRINX_PUBLIC_WEB_TARGET || DEFAULT_TARGET,
    force: false,
    dryRun: false,
  };

  for (const item of argv) {
    if (item === "--force") args.force = true;
    else if (item === "--dry-run") args.dryRun = true;
    else if (item.startsWith("--source-repo=")) args.sourceRepo = item.slice("--source-repo=".length);
    else if (item.startsWith("--source-ref=")) args.sourceRef = item.slice("--source-ref=".length);
    else if (item.startsWith("--target=")) args.target = item.slice("--target=".length);
    else throw new Error(`Unknown argument: ${item}`);
  }

  return args;
}

function run(command, args, options = {}) {
  console.log(`$ ${command} ${args.join(" ")}`);
  if (options.dryRun) return "";
  return execFileSync(command, args, {
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: "utf-8",
    ...options,
  });
}

function isNonEmptyDirectory(dir) {
  return fs.existsSync(dir) && fs.statSync(dir).isDirectory() && fs.readdirSync(dir).length > 0;
}

function copyPath(sourceRoot, targetRoot, relativePath, dryRun) {
  const source = path.join(sourceRoot, relativePath);
  const target = path.join(targetRoot, relativePath);

  if (!fs.existsSync(source)) {
    console.log(`skip missing optional path: ${relativePath}`);
    return false;
  }

  console.log(`copy ${relativePath} -> ${path.relative(process.cwd(), target)}`);
  if (!dryRun) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.cpSync(source, target, { recursive: true, force: true, errorOnExist: false });
  }
  return true;
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeRootPackageScripts(rootDir, dryRun) {
  const packagePath = path.join(rootDir, "package.json");
  const pkg = readJsonIfExists(packagePath);
  pkg.name = pkg.name || "sirinx-co";
  pkg.private = pkg.private ?? true;
  pkg.scripts = {
    ...(pkg.scripts || {}),
    "restore:public-web": "node scripts/restore-public-web-from-sirinx.mjs",
    "verify:public-web-import": "node scripts/verify-public-web-import.mjs",
    "web:check": "pnpm --config.verify-deps-before-run=false --dir apps/public-web check",
    "web:test": "pnpm --config.verify-deps-before-run=false --dir apps/public-web test",
    "web:build": "pnpm --config.verify-deps-before-run=false --dir apps/public-web build",
  };

  console.log("update root package.json recovery scripts");
  if (!dryRun) {
    fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, "utf-8");
  }
}

function ensureWorkspace(rootDir, dryRun) {
  const workspacePath = path.join(rootDir, "pnpm-workspace.yaml");
  if (fs.existsSync(workspacePath)) {
    console.log("pnpm-workspace.yaml exists; leaving it unchanged");
    return;
  }

  console.log("create pnpm-workspace.yaml");
  if (!dryRun) {
    fs.writeFileSync(workspacePath, 'packages:\n  - "apps/*"\n  - "services/*"\n', "utf-8");
  }
}

function writeReceipt(rootDir, details, dryRun) {
  const receiptDir = path.join(rootDir, "reports", "import");
  const receiptPath = path.join(receiptDir, "SIRINX_PUBLIC_WEB_SOURCE_RESTORED_20260707.md");
  const body = [
    "# SIRINX Public Web Source Restored",
    "",
    `Date: ${new Date().toISOString()}`,
    `Source repo: ${details.sourceRepo}`,
    `Source ref: ${details.sourceRef}`,
    `Target path: ${details.target}`,
    "",
    "Imported paths:",
    ...details.imported.map(item => `- ${item}`),
    "",
    "Required validation:",
    "- node scripts/verify-public-web-import.mjs",
    "- pnpm --dir apps/public-web install --ignore-scripts",
    "- pnpm --config.verify-deps-before-run=false --dir apps/public-web check",
    "- pnpm --config.verify-deps-before-run=false --dir apps/public-web build",
    "",
    "Safety: no deploy, no Cloudflare mutation, no secret read/print, no live-send.",
    "",
  ].join("\n");

  console.log(`write receipt ${path.relative(rootDir, receiptPath)}`);
  if (!dryRun) {
    fs.mkdirSync(receiptDir, { recursive: true });
    fs.writeFileSync(receiptPath, body, "utf-8");
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rootDir = process.cwd();
  const targetRoot = path.resolve(rootDir, args.target);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "sirinx-public-web-"));
  const sourceDir = path.join(tempDir, "source");

  console.log("SIRINX public web source recovery");
  console.log(`source: ${args.sourceRepo}#${args.sourceRef}`);
  console.log(`target: ${path.relative(rootDir, targetRoot)}`);

  if (isNonEmptyDirectory(targetRoot)) {
    if (!args.force) {
      throw new Error(`${args.target} already exists and is not empty. Re-run with --force to back it up and replace it.`);
    }
    const backupPath = `${targetRoot}.backup-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    console.log(`backup existing target -> ${path.relative(rootDir, backupPath)}`);
    if (!args.dryRun) {
      fs.renameSync(targetRoot, backupPath);
    }
  }

  run("git", ["clone", "--depth", "1", "--branch", args.sourceRef, args.sourceRepo, sourceDir], { dryRun: args.dryRun });

  const imported = [];
  for (const relativePath of IMPORT_PATHS) {
    if (copyPath(sourceDir, targetRoot, relativePath, args.dryRun)) {
      imported.push(relativePath);
    }
  }

  writeRootPackageScripts(rootDir, args.dryRun);
  ensureWorkspace(rootDir, args.dryRun);
  writeReceipt(rootDir, { ...args, imported }, args.dryRun);

  console.log("restore complete");
  console.log("next: node scripts/verify-public-web-import.mjs");
  console.log("next: pnpm --dir apps/public-web install --ignore-scripts");
  console.log("next: pnpm --config.verify-deps-before-run=false --dir apps/public-web check");
  console.log("next: pnpm --config.verify-deps-before-run=false --dir apps/public-web build");
}

main().catch(error => {
  console.error(`restore failed: ${error.message}`);
  process.exit(1);
});

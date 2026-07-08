#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const DEFAULT_TARGET = "apps/public-web";
const REQUIRED_PACKAGES = [
  "vite",
  "vitest",
  "typescript",
  "@types/node",
  "@vitejs/plugin-react",
  "@tailwindcss/vite",
  "@builder.io/vite-plugin-jsx-loc",
  "vite-plugin-manus-runtime",
  "vite-plugin-javascript-obfuscator",
  "tsx",
  "esbuild",
  "react",
  "react-dom",
  "wouter",
];

function parseArgs(argv) {
  const args = { target: process.env.SIRINX_PUBLIC_WEB_TARGET || DEFAULT_TARGET };
  for (const item of argv) {
    if (item.startsWith("--target=")) args.target = item.slice("--target=".length);
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function packagePath(nodeModules, packageName) {
  return path.join(nodeModules, ...packageName.split("/"));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = process.cwd();
  const targetRoot = path.resolve(root, args.target);
  const nodeModules = path.join(targetRoot, "node_modules");
  const missing = [];
  const present = [];

  if (!fs.existsSync(path.join(targetRoot, "package.json"))) {
    console.error(`missing package.json under ${args.target}`);
    process.exit(1);
  }

  for (const packageName of REQUIRED_PACKAGES) {
    const expected = packagePath(nodeModules, packageName);
    if (fs.existsSync(expected)) present.push(packageName);
    else missing.push(packageName);
  }

  console.log("SIRINX public-web dependency layout preflight");
  console.log(`target: ${args.target}`);
  console.log(`present: ${present.length ? present.join(", ") : "none"}`);

  if (missing.length > 0) {
    console.error(`missing: ${missing.join(", ")}`);
    console.error("package-level check/test/build remain blocked until the app dependency layout is restored");
    process.exit(1);
  }

  console.log("dependency layout verification passed");
}

try {
  main();
} catch (error) {
  console.error(`verification failed: ${error.message}`);
  process.exit(1);
}

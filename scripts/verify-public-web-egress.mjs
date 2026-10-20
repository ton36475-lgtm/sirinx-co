#!/usr/bin/env node
// Static egress guard for apps/public-web (B16).
//
// Requirement: "one CI-able check that fails on a new literal host outside an
// allowlist". This scans the shipped source surface for literal http(s) hosts and
// compares them with config/public-web/egress.allowlist.v1.json.
//
// Read-only and offline: no build, no network, no target execution.
//
// Usage:
//   node scripts/verify-public-web-egress.mjs [--json] [--dist] [--root=.]
//
// Exit codes: 0 = pass (warnings allowed), 1 = at least one error,
//             2 = allowlist or surface is structurally invalid.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";

export const ALLOWLIST_PATH = "config/public-web/egress.allowlist.v1.json";
export const ALLOWLIST_SCHEMA = "public-web.egress.allowlist.v1";

export const SOURCE_SURFACES = [
  "apps/public-web/client/index.html",
  "apps/public-web/client/public",
  "apps/public-web/client/src",
  "apps/public-web/brands",
  "apps/public-web/shared",
  "apps/public-web/server",
];

// Both shipped bundles: the .co build and the sirinx.org host variant produced
// by scripts/build-public-web-variant.mjs.
export const DIST_SURFACES = ["apps/public-web/dist/public", "apps/public-web/dist-org"];

const SKIP_DIRS = new Set([".git", "node_modules", "dist", "build", ".next"]);
const EXTENSIONLESS = new Set(["_headers", "_redirects"]);
const SCANNABLE = /\.(?:[cm]?[jt]sx?|html?|css|json|mdx?|xml|txt|webmanifest|svg)$/i;
const TEST_FILE = /\.(?:test|spec)\.[cm]?[jt]sx?$/i;
const URL_PATTERN = /https?:\/\/([a-zA-Z0-9._*-]+)/g;

// Hosts that must never ship. Deliberately independent of the allowlist: a
// placeholder cannot be waived by adding it to the allowlist.
const PLACEHOLDER_HOSTS = [
  /^(?:cdn|assets|static|img|images)\.example\.(?:com|net|org)$/,
  /^(?:www\.)?example\.(?:com|net|org|invalid)$/,
  /\.invalid$/,
  /\.test$/,
  /^your-[a-z0-9-]+\./,
];

export const HOST_CLASSES = new Set([
  "own-origin",
  "own-infra",
  "service-api",
  "third-party-asset",
  "third-party-font",
  "navigation-link",
  "vocabulary",
  "local-dev",
  "documentation",
  "upstream-reference",
  "template-scaffold",
]);

// Classes that make the visitor's browser fetch a third-party resource. These
// require an operator waiver; without one the guard fails.
const FETCH_CLASSES = new Set(["third-party-asset", "third-party-font"]);

const SCAFFOLD_SURFACE = /(?:^|[/\\])brands[/\\]_[^/\\]+[/\\]/;

function fail(message) {
  throw new Error(`egress_allowlist_invalid: ${message}`);
}

function walk(dir, root, files = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, root, files);
    else if ((SCANNABLE.test(entry) || EXTENSIONLESS.has(entry)) && !TEST_FILE.test(entry)) files.push(full);
  }
  return files;
}

export function collectFiles(root, { includeDist = false } = {}) {
  const surfaces = includeDist ? [...SOURCE_SURFACES, ...DIST_SURFACES] : SOURCE_SURFACES;
  const files = [];
  for (const surface of surfaces) {
    const full = join(root, surface);
    if (!existsSync(full)) continue;
    const stat = statSync(full);
    // An explicitly listed file surface is always scanned, even without a
    // conventional extension (e.g. Cloudflare `_headers` / `_redirects`).
    if (stat.isDirectory()) walk(full, root, files);
    else files.push(full);
  }
  return files;
}

export function extractHosts(text) {
  const found = [];
  for (const match of text.matchAll(URL_PATTERN)) {
    const raw = match[1].toLowerCase().replace(/\.+$/, "");
    if (!raw || raw === "*") continue;
    const wildcard = raw.startsWith("*.");
    const host = wildcard ? raw.slice(2) : raw;
    if (!host) continue;
    // A bare label is only meaningful for loopback; anything else is not a host
    // and must not mask a real egress origin.
    if (!host.includes(".") && host !== "localhost") continue;
    found.push({ host, wildcard });
  }
  return found;
}

export function scan(root, { includeDist = false } = {}) {
  const files = collectFiles(root, { includeDist });
  const occurrences = [];
  for (const file of files) {
    const rel = relative(root, file).split(sep).join("/");
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const { host, wildcard } of extractHosts(line)) {
        occurrences.push({ file: rel, line: index + 1, host, wildcard });
      }
    });
  }
  return { files, occurrences };
}

export function validateAllowlist(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) fail("root must be an object");
  if (data.schema !== ALLOWLIST_SCHEMA) fail(`schema must be ${ALLOWLIST_SCHEMA}`);
  if (!Array.isArray(data.hosts) || data.hosts.length === 0) fail("hosts must be a non-empty array");
  const seen = new Set();
  for (const [index, entry] of data.hosts.entries()) {
    const label = `hosts[${index}]`;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) fail(`${label} must be an object`);
    const allowedKeys = new Set(["host", "class", "reason", "waiver", "subdomains"]);
    for (const key of Object.keys(entry)) {
      if (!allowedKeys.has(key)) fail(`${label} has unknown key ${key}`);
    }
    if (typeof entry.host !== "string" || !/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$|^localhost$/.test(entry.host)) {
      fail(`${label} has an invalid host`);
    }
    if (entry.host !== entry.host.toLowerCase()) fail(`${label} host must be lowercase`);
    if (seen.has(entry.host)) fail(`duplicate host ${entry.host}`);
    seen.add(entry.host);
    if (entry.class === "placeholder") fail(`${label} may not use class placeholder`);
    if (!HOST_CLASSES.has(entry.class)) fail(`${label} has unknown class ${entry.class}`);
    if (typeof entry.reason !== "string" || entry.reason.trim().length < 8) fail(`${label} needs a reason`);
    if (entry.class === "documentation" && !/^example\.(?:com|net|org|invalid)$/.test(entry.host)) {
      fail(`${label} documentation class is only valid for the bare example.* hosts`);
    }
    if (entry.subdomains !== undefined && typeof entry.subdomains !== "boolean") fail(`${label} subdomains must be boolean`);
    if (entry.waiver !== undefined) {
      if (!entry.waiver || typeof entry.waiver !== "object") fail(`${label} waiver must be an object`);
      if (typeof entry.waiver.ticket !== "string" || entry.waiver.ticket.trim() === "") fail(`${label} waiver needs a ticket`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.waiver.until || "")) fail(`${label} waiver needs until=YYYY-MM-DD`);
      if (FETCH_CLASSES.has(entry.class) === false) fail(`${label} waiver is only meaningful on a fetch class`);
    }
    if (FETCH_CLASSES.has(entry.class) && entry.waiver === undefined) {
      // Structurally valid: the evaluation step reports the missing waiver as an
      // error, which is the path a new third-party host takes.
    }
  }
  return data;
}

export function loadAllowlist(root) {
  const raw = readFileSync(join(root, ALLOWLIST_PATH), "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    fail("allowlist is not valid JSON");
  }
  return validateAllowlist(parsed);
}

export function isPlaceholderHost(host) {
  return PLACEHOLDER_HOSTS.some((pattern) => pattern.test(host));
}

function matchesEntry(host, entry) {
  if (entry.host === host) return true;
  return entry.subdomains === true && host.endsWith(`.${entry.host}`);
}

export function evaluate({ occurrences, allowlist }) {
  const errors = [];
  const warnings = [];
  const seenError = new Set();
  const seenWarning = new Set();
  const usedHosts = new Set();

  const report = (bucket, seen, code, host, detail, file) => {
    const key = `${code}:${host}`;
    if (seen.has(key)) return;
    seen.add(key);
    bucket.push({ code, host, detail, file });
  };

  for (const occurrence of occurrences) {
    const { host, file } = occurrence;
    const scaffold = SCAFFOLD_SURFACE.test(file);
    const entry = allowlist.hosts.find((candidate) => matchesEntry(host, candidate));

    if (isPlaceholderHost(host)) {
      // Only the bare reserved host may be declared documentation; a subdomain
      // such as cdn.example.com can never be waived into passing.
      if (entry && entry.class === "documentation") {
        usedHosts.add(entry.host);
        continue;
      }
      usedHosts.add(host);
      const detail = `placeholder host ${host} in ${file}:${occurrence.line}`;
      if (scaffold) report(warnings, seenWarning, "placeholder_host_scaffold", host, detail, file);
      else report(errors, seenError, "placeholder_host", host, detail, file);
      continue;
    }

    if (!entry) {
      usedHosts.add(host);
      report(errors, seenError, "unknown_host", host, `not in ${ALLOWLIST_PATH} (${file}:${occurrence.line})`, file);
      continue;
    }
    usedHosts.add(entry.host);

    if (FETCH_CLASSES.has(entry.class)) {
      if (entry.waiver) {
        report(
          warnings,
          seenWarning,
          "waived_third_party",
          entry.host,
          `${entry.class} waived by ${entry.waiver.ticket} until ${entry.waiver.until} (${file})`,
          file
        );
      } else {
        report(errors, seenError, "third_party_without_waiver", entry.host, `${entry.class} needs a waiver (${file})`, file);
      }
    } else if (entry.class === "upstream-reference") {
      // Literal URL inside a vendored library's comment or error text. Never
      // fetched by our code, but it still travels in the bundle.
      report(warnings, seenWarning, "upstream_reference", entry.host, `upstream reference text in ${file}`, file);
    } else if (entry.class === "service-api") {
      // Declared service APIs do not fail the build, but a third-party runtime
      // call stays visible in every run so the inventory cannot go quiet.
      report(warnings, seenWarning, "third_party_runtime_api", entry.host, `runtime call to ${entry.host} (${file})`, file);
    }
  }

  for (const entry of allowlist.hosts) {
    if (!usedHosts.has(entry.host)) {
      report(warnings, seenWarning, "stale_allowlist_entry", entry.host, "allowlisted but not found in the scanned surface", null);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    hostCount: usedHosts.size,
  };
}

export function runGuard({ root = process.cwd(), includeDist = false } = {}) {
  const allowlist = loadAllowlist(root);
  const { files, occurrences } = scan(root, { includeDist });
  const result = evaluate({ occurrences, allowlist });
  return { ...result, files: files.length, occurrences: occurrences.length, includeDist, surfaces: includeDist ? [...SOURCE_SURFACES, ...DIST_SURFACES] : SOURCE_SURFACES };
}

function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes("--json");
  const includeDist = args.includes("--dist");
  const rootArg = args.find((arg) => arg.startsWith("--root="));
  const root = rootArg ? rootArg.slice("--root=".length) : process.cwd();

  let result;
  try {
    result = runGuard({ root, includeDist });
  } catch (error) {
    console.error(JSON.stringify({ ok: false, code: "allowlist_invalid", message: error.message }));
    process.exit(2);
  }

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`public-web egress guard — ${result.files} files, ${result.occurrences} URL occurrences, ${result.hostCount} hosts`);
    console.log(`surfaces: ${result.includeDist ? "source + dist" : "source"}`);
    for (const error of result.errors) console.log(`ERROR ${error.code} ${error.host} — ${error.detail}`);
    for (const warning of result.warnings) console.log(`warn  ${warning.code} ${warning.host} — ${warning.detail}`);
    console.log(`RESULT: ${result.ok ? "PASS" : "FAIL"} (${result.errors.length} errors, ${result.warnings.length} warnings)`);
  }
  process.exit(result.ok ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

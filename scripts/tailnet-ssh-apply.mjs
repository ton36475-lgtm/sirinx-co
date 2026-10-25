#!/usr/bin/env node
// =============================================================================
// SIRINX OS — apply the MASTER_PLAN C6 tailnet SSH accept rule
//
// The tailnet policy on 2026-10-25 carries one ssh rule whose action is
// `holdAndDelegate` at the placeholder `https://unused/...`, so no session can
// ever be approved. This script adds a narrow `accept` rule for exactly one
// src/dst pair and leaves every other rule untouched.
//
//   TAILSCALE_API_TOKEN=... node scripts/tailnet-ssh-apply.mjs            # dry run
//   TAILSCALE_API_TOKEN=... node scripts/tailnet-ssh-apply.mjs --apply    # write
//   node scripts/tailnet-ssh-apply.mjs --policy-file=/tmp/acl.json         # offline
//
// Guarantees:
//   * dry run unless --apply; prints the ssh array it would send and exits 0;
//   * idempotent: a second run reports "already present" and writes nothing;
//   * only the `ssh` array changes — grants, hosts, tags, tests, autoApprovers
//     are passed through byte-for-byte as parsed;
//   * uses the ETag as If-Match, so a concurrent console edit is refused
//     (HTTP 412) instead of silently overwritten;
//   * never prints the token; refuses to run without one when it must call out.
//
// Docs: infra/omarchy/TAILNET_SSH_ACCESS.md
// =============================================================================

import { readFileSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const API = "https://api.tailscale.com/api/v2";

export const DEFAULT_SRC = ["100.90.189.112"]; // mac-mini M2
export const DEFAULT_DST = ["100.87.189.34"]; // omarchy node
export const DEFAULT_USERS = ["root", "autogroup:nonroot"];

const isStringList = (value) =>
  Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === "string");

const sameSet = (a, b) => a.length === b.length && a.every((v) => b.includes(v));

/** Build the narrow accept rule this repo wants for C6. */
export function buildRule({ src = DEFAULT_SRC, dst = DEFAULT_DST, users = DEFAULT_USERS } = {}) {
  for (const [name, value] of [["src", src], ["dst", dst], ["users", users]]) {
    if (!isStringList(value)) {
      throw new Error(`${name} must be a non-empty list of strings`);
    }
  }
  return { action: "accept", src: [...src], dst: [...dst], users: [...users] };
}

/**
 * Insert (or widen) the accept rule in a policy object.
 * Returns a new object; the input is never mutated.
 */
export function applyRule(policy, rule) {
  if (!policy || typeof policy !== "object" || Array.isArray(policy)) {
    throw new Error("policy must be a JSON object");
  }
  const next = structuredClone(policy);
  const ssh = Array.isArray(next.ssh) ? next.ssh : [];

  const match = ssh.find(
    (entry) =>
      entry &&
      entry.action === "accept" &&
      isStringList(entry.src) &&
      isStringList(entry.dst) &&
      isStringList(entry.users) &&
      sameSet(entry.src, rule.src) &&
      sameSet(entry.dst, rule.dst),
  );

  if (match) {
    const missing = rule.users.filter((u) => !match.users.includes(u));
    if (missing.length === 0) {
      return { policy: next, changed: false, reason: "accept rule already present" };
    }
    match.users = [...match.users, ...missing];
    return { policy: next, changed: true, reason: `widened users (+${missing.join(", +")})` };
  }

  // Prepend: Tailscale evaluates ssh rules top-down, and the existing
  // holdAndDelegate rule must not swallow this pair first.
  next.ssh = [structuredClone(rule), ...ssh];
  return { policy: next, changed: true, reason: "accept rule inserted at the top of ssh" };
}

/** Compact view of only what this script may touch, for the run log. */
export function summarize(policy) {
  const ssh = Array.isArray(policy?.ssh) ? policy.ssh : [];
  return ssh.map((entry) => {
    if (typeof entry?.action === "string") {
      return {
        action: entry.action,
        src: entry.src?.length,
        dst: entry.dst?.length,
        users: entry.users,
      };
    }
    return { action: "holdAndDelegate", principals: entry?.principals?.length };
  });
}

async function apiRequest(path, { token, method = "GET", body, etag } = {}) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (etag) headers["If-Match"] = etag;

  const response = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const hint =
      response.status === 401 || response.status === 403
        ? "token missing the acl/policy write scope"
        : response.status === 412
          ? "policy changed since the read (ETag mismatch) — re-run to rebase"
          : "";
    throw new Error(
      `${method} ${path} -> HTTP ${response.status}${hint ? ` (${hint})` : ""}: ${text.slice(0, 300)}`,
    );
  }
  return { response, etag: response.headers.get("etag") ?? undefined };
}

async function hostCheck(host) {
  try {
    const { stdout } = await execFileAsync(
      "ssh",
      ["-o", "BatchMode=yes", "-o", "ConnectTimeout=8", "-o", "ConnectionAttempts=1", `root@${host}`, "id -un; hostname"],
      { timeout: 20_000 },
    );
    return { ok: true, output: stdout.trim() };
  } catch (error) {
    return { ok: false, output: String(error.stderr || error.message).trim().slice(0, 300) };
  }
}

function parseArgs(argv) {
  const options = {
    apply: false,
    json: false,
    policyFile: "",
    tailnet: "-",
    src: [...DEFAULT_SRC],
    dst: [...DEFAULT_DST],
    users: [...DEFAULT_USERS],
    checkHost: false,
  };
  for (const arg of argv) {
    if (arg === "--apply") options.apply = true;
    else if (arg === "--dry-run") options.apply = false;
    else if (arg === "--json") options.json = true;
    else if (arg === "--check-host") options.checkHost = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg.startsWith("--policy-file=")) options.policyFile = arg.slice("--policy-file=".length);
    else if (arg.startsWith("--tailnet=")) options.tailnet = arg.slice("--tailnet=".length);
    else if (arg.startsWith("--src=")) options.src = arg.slice("--src=".length).split(",").map((s) => s.trim());
    else if (arg.startsWith("--dst=")) options.dst = arg.slice("--dst=".length).split(",").map((s) => s.trim());
    else if (arg.startsWith("--users=")) options.users = arg.slice("--users=".length).split(",").map((s) => s.trim());
    else throw new Error(`unknown argument: ${arg}`);
  }
  return options;
}

function usage() {
  return [
    "usage: node scripts/tailnet-ssh-apply.mjs [--apply] [--dry-run] [--json]",
    "       [--policy-file=<acl.json>] [--tailnet=-] [--src=<ip,ip>] [--dst=<ip,ip>]",
    "       [--users=root,autogroup:nonroot] [--check-host]",
    "",
    "env: TAILSCALE_API_TOKEN (required unless --policy-file is given)",
  ].join("\n");
}

function printPlan(plan, rule, options) {
  if (options.json) {
    console.log(JSON.stringify({ rule, changed: plan.changed, reason: plan.reason, ssh: summarize(plan.policy) }, null, 2));
    return;
  }
  console.log(`rule   : ${JSON.stringify(rule)}`);
  console.log(`result : ${plan.reason}`);
  console.log("ssh    :");
  for (const entry of summarize(plan.policy)) console.log(`  ${JSON.stringify(entry)}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return 0;
  }

  const rule = buildRule({ src: options.src, dst: options.dst, users: options.users });
  const token = process.env.TAILSCALE_API_TOKEN;
  const path = `/tailnet/${options.tailnet}/acl`;

  let policy;
  let etag;
  if (options.policyFile) {
    policy = JSON.parse(readFileSync(options.policyFile, "utf8"));
  } else {
    if (!token) {
      console.error("TAILSCALE_API_TOKEN is not set; nothing was read or written");
      console.error(usage());
      return 2;
    }
    const read = await apiRequest(path, { token });
    policy = await read.response.json();
    etag = read.etag;
  }

  const plan = applyRule(policy, rule);
  printPlan(plan, rule, options);

  if (!plan.changed) return 0;
  if (options.policyFile) {
    console.log("\noffline mode: nothing written. Add --apply without --policy-file to write.");
    return 0;
  }
  if (!options.apply) {
    console.log("\ndry run: nothing written. Re-run with --apply to update the tailnet policy.");
    return 0;
  }

  const write = await apiRequest(path, { token, method: "POST", body: plan.policy, etag });
  console.log(`\nwritten: HTTP ${write.response.status}${write.etag ? ` (etag ${write.etag})` : ""}`);

  const confirm = await apiRequest(path, { token });
  const confirmed = applyRule(await confirm.response.json(), rule);
  if (confirmed.changed) {
    console.error("verification failed: the rule is not present after the write");
    return 3;
  }
  console.log("verified: accept rule present in the live policy");

  if (options.checkHost) {
    const probe = await hostCheck(options.dst[0]);
    console.log(`host check ${probe.ok ? "PASS" : "FAIL"}: ${probe.output}`);
    if (!probe.ok) return 4;
  }
  return 0;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (invokedDirectly) {
  main()
    .then((code) => process.exit(code))
    .catch((error) => {
      console.error(`tailnet-ssh-apply: ${error.message}`);
      process.exit(1);
    });
}

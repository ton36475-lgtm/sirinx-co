#!/usr/bin/env node
// Split home offload: copy each declared dataset to BOTH targets (USB + iCloud),
// except `localOnly` sets, which stay on the Mac mini. Copy-only: this script
// never deletes a source file and never passes --delete to rsync.
//
// Usage:
//   node scripts/home-offload.mjs plan [--sizes] [--json]
//   node scripts/home-offload.mjs probe [--json]
//   node scripts/home-offload.mjs sync --set=<id> [--target=usb|icloud|both] --confirm [--dry-run]
//   node scripts/home-offload.mjs verify --set=<id> [--target=usb|icloud|both]
//
// Exit codes: 0 ok, 1 failure, 2 refused (guard).

import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..");
const CONFIG_PATH = join(REPO, "config/backup/home-offload.v1.json");
const PROBE_TIMEOUT_MS = 6000;

const args = process.argv.slice(2);
const mode = args[0];
const flag = (name) => args.includes(`--${name}`);
const value = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");

function fail(message, code = 1) {
  console.error(`refused: ${message}`);
  process.exit(code);
}

if (!["plan", "probe", "sync", "verify"].includes(mode)) {
  fail("usage: plan | probe | sync --set=<id> --confirm | verify --set=<id>", 2);
}

const config = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
const expand = (p) => (p.startsWith("~/") ? join(homedir(), p.slice(2)) : p.startsWith("~") ? homedir() : p);

function targetNames() {
  const wanted = value("target");
  if (!wanted || wanted === "both") return Object.keys(config.targets);
  if (!config.targets[wanted]) fail(`unknown target "${wanted}"`, 2);
  return [wanted];
}

function setById(id) {
  const set = config.sets.find((s) => s.id === id);
  if (!set) fail(`unknown set "${id}" (known: ${config.sets.map((s) => s.id).join(", ")})`, 2);
  return set;
}

function listEntries(set) {
  const base = set.repoRelative ? REPO : expand(config.home);
  const found = [];
  const missing = [];
  const seen = new Set();
  for (const entry of set.entries) {
    if (entry.path) {
      const full = resolve(base, expand(entry.path));
      if (existsSync(full)) {
        // Case-insensitive APFS makes e.g. `hermes` and `Hermes` one directory.
        let key = full;
        try {
          key = realpathSync(full);
        } catch {
          /* keep the resolved path as the key */
        }
        if (seen.has(key)) continue;
        seen.add(key);
        found.push({ path: full, name: entry.path.split("/").pop(), excludes: entry.excludes || [] });
      } else missing.push(entry.path);
      continue;
    }
    if (entry.glob === "*") {
      for (const name of readdirSync(base)) {
        const full = join(base, name);
        let stat;
        try {
          stat = statSync(full);
        } catch {
          continue;
        }
        if (entry.filesOnly && !stat.isFile()) continue;
        if ((entry.skipExtensions || []).some((ext) => name.endsWith(ext))) continue;
        found.push({ path: full, name, bytes: stat.size });
      }
    }
  }
  return { found, missing };
}

// Any call into a wedged volume blocks the event loop, so every target probe and
// every rsync runs in a child process with a hard timeout.
function run(cmd, cmdArgs, timeoutMs = 0) {
  return new Promise((done) => {
    const child = spawn(cmd, cmdArgs, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      done(result);
    };
    const timer = timeoutMs
      ? setTimeout(() => {
          // A process stuck in uninterruptible I/O cannot be killed; drop every
          // handle so this script can still exit instead of waiting on it.
          child.kill("SIGKILL");
          child.stdout.destroy();
          child.stderr.destroy();
          child.unref();
          finish({ code: null, timedOut: true, stdout, stderr });
        }, timeoutMs)
      : null;
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", (error) => finish({ code: null, error: error.message, stdout, stderr }));
    child.on("close", (code) => finish({ code, timedOut: false, stdout, stderr }));
  });
}

async function probeTarget(name) {
  const volume = expand(config.targets[name].volume);
  const result = await run(
    process.execPath,
    [
      "-e",
      'const s=require("node:fs").statfsSync(process.argv[1]);process.stdout.write(JSON.stringify({freeGiB:s.bavail*s.bsize/2**30,totalGiB:s.blocks*s.bsize/2**30}))',
      volume,
    ],
    PROBE_TIMEOUT_MS
  );
  if (result.timedOut) return { target: name, volume, responsive: false, reason: "statfs_timeout" };
  if (result.code !== 0) return { target: name, volume, responsive: false, reason: (result.stderr || "statfs_error").trim().slice(0, 200) };
  const facts = JSON.parse(result.stdout);
  return { target: name, volume, responsive: true, freeGiB: Math.round(facts.freeGiB * 10) / 10, totalGiB: Math.round(facts.totalGiB * 10) / 10 };
}

function duBytes(paths) {
  // Bounded: callers only use this on repo paths or on `--sizes`.
  const out = spawnSyncSafe("du", ["-sk", ...paths]);
  if (!out) return null;
  let kib = 0;
  for (const line of out.split("\n")) {
    const n = Number(line.trim().split(/\s+/)[0]);
    if (Number.isFinite(n)) kib += n;
  }
  return kib * 1024;
}

function spawnSyncSafe(cmd, cmdArgs) {
  try {
    return execFileSync(cmd, cmdArgs, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 120000 });
  } catch {
    return null;
  }
}

function writeReceipt(name, payload) {
  const now = new Date();
  const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const dir = join(REPO, "reports", "backup", day);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${name}.json`);
  writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
  return file;
}

function table(rows) {
  const widths = rows[0].map((_, i) => Math.max(...rows.map((r) => String(r[i]).length)));
  return rows.map((r) => r.map((c, i) => String(c).padEnd(widths[i])).join("  ")).join("\n");
}

async function plan() {
  const rows = [["set", "local-only", "entries", "missing", "size", "targets"]];
  for (const set of config.sets) {
    const { found, missing } = listEntries(set);
    let size = "-";
    if (flag("sizes") && found.length) {
      const bytes = duBytes(found.map((f) => f.path));
      size = bytes === null ? "?" : `${(bytes / 2 ** 30).toFixed(2)} GiB`;
    }
    rows.push([
      set.id,
      set.localOnly ? "YES (mac only)" : "no",
      found.length,
      missing.length ? missing.join(",") : "-",
      size,
      set.localOnly ? "none" : targetNames().join("+"),
    ]);
  }
  if (flag("json")) {
    console.log(JSON.stringify({ config: CONFIG_PATH, targets: config.targets, rows: rows.slice(1) }, null, 2));
  } else {
    console.log(table(rows));
    console.log("\ntargets:");
    for (const [name, t] of Object.entries(config.targets)) console.log(`  ${name}: ${t.root}`);
    console.log(`\ncopy-only: rsync never runs with --delete; localOnly sets are never synced.`);
  }
}

async function probe() {
  const results = await Promise.all(Object.keys(config.targets).map(probeTarget));
  if (flag("json")) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    for (const r of results) {
      console.log(
        r.responsive
          ? `${r.target}: RESPONSIVE  free ${r.freeGiB} GiB / ${r.totalGiB} GiB  (${r.volume})`
          : `${r.target}: WEDGED (${r.reason})  ${r.volume}`
      );
    }
  }
  if (results.some((r) => !r.responsive)) process.exitCode = 1;
}

function excludeArgs() {
  return config.excludes.flatMap((pattern) => ["--exclude", pattern]);
}

async function sync() {
  const set = setById(value("set") || "");
  if (set.localOnly) fail(`set "${set.id}" is local-only and must stay on this Mac`, 2);
  if (!flag("confirm")) fail("sync requires --confirm (it writes to the declared targets)", 2);

  const targets = targetNames();
  const probes = await Promise.all(targets.map(probeTarget));
  for (const p of probes) {
    if (!p.responsive) fail(`target ${p.target} is not responsive (${p.reason}); nothing was written`, 2);
  }

  const { found, missing } = listEntries(set);
  if (!found.length) fail(`set "${set.id}" has no existing entries`, 2);

  const started = new Date().toISOString();
  const results = [];
  for (const target of targets) {
    const root = expand(config.targets[target].root);
    for (const entry of found) {
      const dest = join(root, set.id, entry.name);
      const mk = await run("/bin/mkdir", ["-p", dest], 15000);
      if (mk.code !== 0) {
        results.push({ target, entry: entry.name, ok: false, stage: "mkdir", detail: mk.timedOut ? "timeout" : mk.stderr.trim().slice(0, 200) });
        continue;
      }
      const rsyncArgs = ["-a", "--partial", ...excludeArgs(), ...entry.excludes.flatMap((p) => ["--exclude", p])];
      if (flag("dry-run")) rsyncArgs.push("-n", "--itemize-changes");
      rsyncArgs.push(`${entry.path}/`, `${dest}/`);
      const t0 = Date.now();
      const rs = await run("/usr/bin/rsync", rsyncArgs);
      results.push({
        target,
        entry: entry.name,
        dest,
        ok: rs.code === 0,
        code: rs.code,
        timedOut: rs.timedOut,
        seconds: Math.round((Date.now() - t0) / 1000),
        detail: rs.code === 0 ? undefined : (rs.stderr || rs.stdout).trim().slice(-400),
      });
      const mark = rs.code === 0 ? "ok" : "FAIL";
      console.error(`[${target}] ${set.id}/${entry.name} ${mark}${rs.timedOut ? " (timeout)" : ""}`);
    }
  }

  const failed = results.filter((r) => !r.ok);
  const receipt = {
    kind: "home-offload-sync",
    set: set.id,
    dryRun: flag("dry-run"),
    started,
    finished: new Date().toISOString(),
    targets: probes,
    missing,
    results,
    ok: failed.length === 0,
  };
  const file = writeReceipt(`sync-${set.id}-${Date.now()}`, receipt);
  console.log(`\n${failed.length === 0 ? "SYNC_OK" : "SYNC_FAILED"}  receipt: ${file}`);
  if (failed.length) process.exitCode = 1;
}

async function verify() {
  const set = setById(value("set") || "");
  if (set.localOnly) fail(`set "${set.id}" is local-only; there is no remote copy to verify`, 2);
  const targets = targetNames();
  const { found } = listEntries(set);
  let drift = 0;
  for (const target of targets) {
    const probe = await probeTarget(target);
    if (!probe.responsive) {
      console.log(`${target}: WEDGED (${probe.reason}) — cannot verify`);
      process.exitCode = 1;
      continue;
    }
    const root = expand(config.targets[target].root);
    for (const entry of found) {
      const dest = join(root, set.id, entry.name);
      if (!existsSync(dest)) {
        console.log(`${target}/${entry.name}: MISSING`);
        drift += 1;
        continue;
      }
      const rs = await run("/usr/bin/rsync", [
        "-a",
        "-n",
        "-c",
        "--itemize-changes",
        ...excludeArgs(),
        ...entry.excludes.flatMap((p) => ["--exclude", p]),
        `${entry.path}/`,
        `${dest}/`,
      ]);
      const changed = rs.stdout.split("\n").filter((line) => line.startsWith(">") || line.startsWith("c")).length;
      console.log(`${target}/${entry.name}: ${rs.code === 0 ? (changed === 0 ? "MATCH" : `DRIFT ${changed}`) : "ERROR"}`);
      if (rs.code !== 0 || changed > 0) drift += 1;
    }
  }
  if (drift > 0) process.exitCode = 1;
}

await { plan, probe, sync, verify }[mode]();

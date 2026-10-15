import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";

const root = process.cwd();
const args = process.argv.slice(2);
const scheduled = args.includes("--scheduled");
const unknownArgs = args.filter((arg) => arg !== "--scheduled");
if (unknownArgs.length > 0) {
  console.error(`Unknown argument: ${unknownArgs.join(" ")}\nUsage: node scripts/pipeline-audit.mjs [--scheduled]`);
  process.exit(2);
}

function run(name, command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    timeout: options.timeout ?? 30_000,
  });
  const stdout = (result.stdout || "").trim();
  const stderr = (result.stderr || "").trim();
  const spawnError = result.error ? `${result.error.code ?? "SPAWN_ERROR"}: ${result.error.message}` : "";
  const output = [stdout, stderr, spawnError].filter(Boolean).join("\n");
  const outputPreview = options.redactOutput
    ? result.status === 0
      ? ["matches found; output redacted"]
      : result.status === 1
        ? []
        : [spawnError || "command failed; output redacted"]
    : output
      ? output.split("\n").slice(0, options.lines ?? 40)
      : [];
  return {
    name,
    command: [command, ...args],
    exitCode: result.status,
    errorCode: result.error?.code ?? null,
    signal: result.signal ?? null,
    ok: result.status === 0,
    outputPreview,
  };
}

function classify(check) {
  if (check.ok) return "pass";
  if (check.warnOnly) return "warn";
  return "fail";
}

const checks = [];

if (scheduled) {
  checks.push(run("git status", "git", ["status", "--porcelain"]));
  checks.push(run("branch", "git", ["branch", "--show-current"]));
  checks.push(run("internal disk capacity", "df", ["-Pk", root]));
} else {
  checks.push(run("git status", "git", ["status", "-sb"]));
  checks.push(run("commit log", "git", ["log", "--oneline", "--decorate", "-4"]));
  checks.push(run("local verifier", "npm", ["run", "check"], { timeout: 60_000, lines: 80 }));
  checks.push(run("adaptive sync dry-run", "npm", ["run", "sync:plan"], { timeout: 60_000, lines: 80 }));
  checks.at(-1).warnOnly = true;
  checks.push(run("telegram preview", "npm", ["run", "telegram:preview"], { lines: 60 }));
  checks.at(-1).warnOnly = true;
  checks.push(run("telegram bot dry-run", "npm", ["run", "telegram:bot:dry-run"], { lines: 60 }));

  checks.push(run("hq service", "curl", ["-sS", "-o", "/dev/null", "-w", "%{http_code}", "http://127.0.0.1:5177/"]));
  checks.push(run("office health", "curl", ["-sS", "-o", "/dev/null", "-w", "%{http_code}", "http://127.0.0.1:8790/health"]));
  checks.push(run("office token gate", "curl", ["-sS", "-o", "/dev/null", "-w", "%{http_code}", "http://127.0.0.1:8790/api/projects"]));

  checks.push(run("github auth", "gh", ["auth", "status"], { lines: 40 }));
  checks.at(-1).warnOnly = true;
  checks.push(run("cloudflared tunnel list", "cloudflared", ["tunnel", "list"], { lines: 60 }));
  checks.at(-1).warnOnly = true;
  checks.push(run("dev.sirinx.co dns", "dig", ["+short", "dev.sirinx.co"], { lines: 20 }));
  checks.at(-1).warnOnly = true;
  checks.push(run("www.sirinx.co http", "curl", ["-sS", "-I", "-L", "--max-time", "10", "https://www.sirinx.co"], { lines: 20 }));
  checks.at(-1).warnOnly = true;
  checks.push(run("windows d mount", "test", ["-d", "/Volumes/Windows-D/SIRINX_OS/sirinx-co"], { lines: 20 }));
  checks.at(-1).warnOnly = true;

  checks.push(
    run(
      "strict secret pattern scan",
      "rg",
      [
        "-n",
        "(sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{20,}|github_pat_[0-9A-Za-z_]{20,}|cfat_[0-9A-Za-z_]{20,}|hf_[0-9A-Za-z]{20,}|sk-ant-[0-9A-Za-z_-]{20,})",
        ".",
        "-g",
        "!node_modules",
        "-g",
        "!dist",
        "-g",
        "!build",
        "-g",
        "!.git",
      ],
      { lines: 40, redactOutput: true },
    ),
  );
}

for (const check of checks) {
  if (scheduled && check.name === "git status" && check.ok && check.outputPreview.length > 0) {
    check.ok = false;
    check.warnOnly = true;
  }
  if (check.name === "hq service") check.ok = check.ok && check.outputPreview.join("") === "200";
  if (check.name === "office health") check.ok = check.ok && check.outputPreview.join("") === "200";
  if (check.name === "office token gate") check.ok = check.ok && check.outputPreview.join("") === "401";
  if (check.name === "www.sirinx.co http") {
    check.ok = check.ok && /^HTTP\/\d(?:\.\d)? 2\d\d(?:\s|$)/im.test(check.outputPreview.join("\n"));
  }
  if (check.name === "strict secret pattern scan") {
    if (check.exitCode === 1) check.ok = true;
    if (check.exitCode === 0) check.ok = false;
  }
  if (check.name === "internal disk capacity") {
    const availableKiB = Number(check.outputPreview.at(-1)?.trim().split(/\s+/)[3]);
    if (check.ok && Number.isFinite(availableKiB)) {
      check.availableGiB = Number((availableKiB / 1024 / 1024).toFixed(2));
      check.ok = availableKiB >= 15 * 1024 * 1024;
      check.warnOnly = !check.ok;
    } else {
      check.ok = false;
    }
  }
  if (check.name === "adaptive sync dry-run" && check.outputPreview.join("\n").includes("target_unavailable")) {
    check.ok = false;
    check.warnOnly = true;
  }
  if (check.name === "dev.sirinx.co dns" && check.outputPreview.length === 0) {
    check.ok = false;
    check.warnOnly = true;
  }
}

const classified = checks.map((check) => ({ ...check, status: classify(check) }));
const summary = {
  pass: classified.filter((check) => check.status === "pass").length,
  warn: classified.filter((check) => check.status === "warn").length,
  fail: classified.filter((check) => check.status === "fail").length,
};

const report = {
  generatedAt: new Date().toISOString(),
  branch: scheduled
    ? checks.find((check) => check.name === "branch")?.outputPreview[0] || "unknown"
    : run("branch", "git", ["branch", "--show-current"]).outputPreview[0] || "unknown",
  mode: scheduled ? "scheduled lightweight local audit" : "full manual pipeline audit",
  summary,
  checks: classified,
  nextBlockedActions: [
    "GitHub push requires gh auth login",
    "Cloudflare mutation requires origin cert/login and exact preview confirmation",
    "Drive D sync requires mounted Windows share and reviewed dry-run",
    "Telegram send requires token/chat id outside repo and action-time approval",
  ],
};

const outputPath = resolve(
  process.env.PIPELINE_AUDIT_OUTPUT ??
    join(root, "exports", scheduled ? "pipeline-audit-scheduled-latest.json" : "pipeline-audit-latest.json"),
);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`Mode: ${report.mode}`);
for (const check of classified) {
  console.log(`[${check.status.toUpperCase()}] ${check.name}`);
  for (const line of check.outputPreview.slice(0, 6)) {
    console.log(`  ${line}`);
  }
}

console.log(`\nSummary: ${summary.pass} pass, ${summary.warn} warn, ${summary.fail} fail`);

if (summary.fail > 0) {
  process.exit(1);
}

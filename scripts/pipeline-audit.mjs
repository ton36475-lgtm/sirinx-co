import { mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();

function run(name, command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    timeout: options.timeout ?? 30_000,
  });
  const stdout = (result.stdout || "").trim();
  const stderr = (result.stderr || "").trim();
  const output = [stdout, stderr].filter(Boolean).join("\n");
  const outputPreview = output ? output.split("\n").slice(0, options.lines ?? 40) : [];
  return {
    name,
    command: [command, ...args],
    exitCode: result.status,
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

checks.push(run("git status", "git", ["status", "-sb"]));
checks.push(run("commit log", "git", ["log", "--oneline", "--decorate", "-4"]));
checks.push(run("local verifier", "npm", ["run", "check"], { timeout: 60_000, lines: 80 }));
checks.push(run("adaptive sync dry-run", "npm", ["run", "sync:plan"], { timeout: 60_000, lines: 80 }));
checks.at(-1).warnOnly = true;
checks.push(run("telegram preview", "npm", ["run", "telegram:preview"], { lines: 60 }));
checks.at(-1).warnOnly = true;
checks.push(run("telegram bot dry-run", "npm", ["run", "telegram:bot:dry-run"], { lines: 60 }));

checks.push(run("hq service", "curl", ["-s", "-o", "/dev/null", "-w", "%{http_code}", "http://127.0.0.1:5177/"]));
checks.push(run("office health", "curl", ["-s", "-o", "/dev/null", "-w", "%{http_code}", "http://127.0.0.1:8790/health"]));
checks.push(run("office token gate", "curl", ["-s", "-o", "/dev/null", "-w", "%{http_code}", "http://127.0.0.1:8790/api/projects"]));

checks.push(run("github auth", "gh", ["auth", "status"], { lines: 40 }));
checks.at(-1).warnOnly = true;
checks.push(run("cloudflared tunnel list", "cloudflared", ["tunnel", "list"], { lines: 60 }));
checks.at(-1).warnOnly = true;
checks.push(run("dev.sirinx.co dns", "sh", ["-lc", "dig +short dev.sirinx.co || true"], { lines: 20 }));
checks.at(-1).warnOnly = true;
checks.push(run("www.sirinx.co http", "sh", ["-lc", "curl -I -L --max-time 10 https://www.sirinx.co 2>/dev/null | sed -n '1,12p'"], { lines: 20 }));
checks.at(-1).warnOnly = true;
checks.push(run("windows d mount", "sh", ["-lc", "test -d /Volumes/Windows-D/SIRINX_OS/sirinx-co"], { lines: 20 }));
checks.at(-1).warnOnly = true;

checks.push(
  run(
    "strict secret pattern scan",
    "sh",
    [
      "-lc",
      "rg -n \"(sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{20,}|github_pat_[0-9A-Za-z_]{20,}|cfat_[0-9A-Za-z_]{20,}|hf_[0-9A-Za-z]{20,}|sk-ant-[0-9A-Za-z_-]{20,})\" . -g '!node_modules' -g '!dist' -g '!build' -g '!.git' || true",
    ],
    { lines: 40 },
  ),
);

for (const check of checks) {
  if (check.name === "hq service") check.ok = check.outputPreview.join("").includes("200");
  if (check.name === "office health") check.ok = check.outputPreview.join("").includes("200");
  if (check.name === "office token gate") check.ok = check.outputPreview.join("").includes("401");
  if (check.name === "strict secret pattern scan") check.ok = check.outputPreview.length === 0;
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
  branch: run("branch", "git", ["branch", "--show-current"]).outputPreview[0] || "unknown",
  mode: "read-only pipeline audit",
  summary,
  checks: classified,
  nextBlockedActions: [
    "GitHub push requires gh auth login",
    "Cloudflare mutation requires origin cert/login and exact preview confirmation",
    "Drive D sync requires mounted Windows share and reviewed dry-run",
    "Telegram send requires token/chat id outside repo and action-time approval",
  ],
};

mkdirSync(join(root, "exports"), { recursive: true });
writeFileSync(join(root, "exports", "pipeline-audit-latest.json"), `${JSON.stringify(report, null, 2)}\n`);

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

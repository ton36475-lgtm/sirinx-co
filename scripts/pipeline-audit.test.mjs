import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = process.cwd();
const auditScript = join(root, "scripts", "pipeline-audit.mjs");

function makeTempDir(t) {
  const path = mkdtempSync(join(tmpdir(), "sirinx-pipeline-audit-"));
  t.after(() => rmSync(path, { recursive: true, force: true }));
  return path;
}

function runAudit(args, env = process.env) {
  return spawnSync(process.execPath, [auditScript, ...args], {
    cwd: root,
    encoding: "utf8",
    env,
  });
}

test("scheduled mode writes an isolated, lightweight local-only report", (t) => {
  const temp = makeTempDir(t);
  const output = join(temp, "scheduled.json");
  const result = runAudit(["--scheduled"], { ...process.env, PIPELINE_AUDIT_OUTPUT: output });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(readFileSync(output, "utf8"));
  assert.equal(report.mode, "scheduled lightweight local audit");
  assert.deepEqual(report.checks.map(({ name }) => name), ["git status", "branch", "internal disk capacity"]);
  assert.equal(report.checks.find(({ name }) => name === "git status").status, "warn");
  assert.equal(report.checks.some(({ command }) => command[0] === "npm"), false);
  assert.match(result.stdout, /internal disk capacity/);
});

test("scheduled command failures remain failures and are represented in the report", (t) => {
  const temp = makeTempDir(t);
  const bin = join(temp, "bin");
  const output = join(temp, "failed.json");
  mkdirSync(bin);
  for (const command of ["git", "df"]) {
    const path = join(bin, command);
    writeFileSync(path, "#!/bin/sh\necho intentional-audit-test-failure >&2\nexit 23\n");
    chmodSync(path, 0o755);
  }

  const result = runAudit(["--scheduled"], {
    PATH: bin,
    HOME: process.env.HOME ?? "",
    TMPDIR: temp,
    PIPELINE_AUDIT_OUTPUT: output,
  });
  assert.equal(result.status, 1, result.stderr || result.stdout);
  const report = JSON.parse(readFileSync(output, "utf8"));
  assert.equal(report.summary.fail, 3);
  assert.ok(report.checks.every((check) => check.status === "fail"));
  assert.ok(report.checks.every((check) => check.exitCode === 23));
  assert.match(result.stdout, /scheduled lightweight local audit/);
});

test("unknown arguments are rejected before creating an audit report", (t) => {
  const temp = makeTempDir(t);
  const output = join(temp, "should-not-exist.json");
  const before = existsSync(output) ? readFileSync(output, "utf8") : null;
  const result = runAudit(["--scheduled", "--send"], {
    ...process.env,
    TMPDIR: temp,
    PIPELINE_AUDIT_OUTPUT: output,
  });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /Unknown argument: --send/);
  assert.equal(existsSync(output) ? readFileSync(output, "utf8") : null, before);
});

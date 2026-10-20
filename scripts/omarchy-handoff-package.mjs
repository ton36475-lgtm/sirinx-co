import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

// Builds the Omarchy handoff package: one archive of irreplaceable repo evidence.
// cline-bot (~368 MB of node_modules) is deliberately NOT shipped; it is rebuilt
// on the target with npm. This keeps the payload inside Telegram's 50 MB document
// ceiling and avoids duplicating 28k files.
//
// Usage: node scripts/omarchy-handoff-package.mjs [--date=YYYY-MM-DD] [--max-mb=45]

const args = process.argv.slice(2);
const dateArg = args.find((arg) => arg.startsWith("--date="))?.slice("--date=".length);
const maxMbArg = Number(args.find((arg) => arg.startsWith("--max-mb="))?.slice("--max-mb=".length) || 45);
const date = dateArg || new Date().toISOString().slice(0, 10);
const root = process.cwd();
const outDir = join(root, "exports", "omarchy-handoff");
const archiveName = `sirinx-ai-evidence-${date}.tar.gz`;

const skip = new Set([relative(root, outDir)]);
const sources = ["reports", "receipts", "exports"];

function walk(path) {
  const entries = [];
  for (const name of readdirSync(path)) {
    const full = join(path, name);
    if (skip.has(relative(root, full))) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) entries.push(...walk(full));
    else entries.push(full);
  }
  return entries;
}

const files = [];
for (const source of sources) {
  const full = join(root, source);
  if (!existsSync(full)) continue;
  files.push(...walk(full));
}
if (files.length === 0) {
  console.error(JSON.stringify({ error: "no_input_files" }));
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const listFile = join(outDir, "filelist.txt");
writeFileSync(listFile, `${files.map((file) => relative(root, file)).join("\n")}\n`);
const archivePath = join(outDir, archiveName);
execFileSync("tar", ["-czf", archivePath, "-T", listFile], { cwd: root, stdio: "pipe" });
rmSync(listFile);

const bytes = statSync(archivePath).size;
const sha256 = createHash("sha256").update(readFileSync(archivePath)).digest("hex");
const maxBytes = maxMbArg * 1024 * 1024;

const chunks = [];
if (bytes > maxBytes) {
  execFileSync("split", ["-b", `${maxMbArg}m`, "-d", "-a", "2", archivePath, `${archivePath}.part-`]);
  rmSync(archivePath);
  for (const name of readdirSync(outDir).filter((entry) => entry.startsWith(`${archiveName}.part-`)).sort()) {
    const full = join(outDir, name);
    chunks.push({
      name,
      bytes: statSync(full).size,
      sha256: createHash("sha256").update(readFileSync(full)).digest("hex")
    });
  }
} else {
  chunks.push({ name: archiveName, bytes, sha256 });
}

const manifest = {
  generatedAt: new Date().toISOString(),
  host: "macminisirinx",
  target: "omarchy (aiagent 100.67.78.88, tailnet tondhm.z99@)",
  payload: {
    sources,
    files: files.length,
    archiveBytes: bytes,
    sha256,
    chunks,
    chunked: chunks.length > 1,
    maxChunkBytes: maxBytes
  },
  excluded: [
    { path: "~/Downloads/cline-bot", reason: "368 MB of node_modules; rebuild on target instead of transferring" },
    { path: "node_modules", reason: "reinstallable" }
  ],
  reconstructOnTarget: [
    "tar -xzf sirinx-ai-evidence-<date>.tar.gz -C ~/sirinx",
    "npm install -g @cline/cli@3.0.73",
    "npm install -g rea-agents@6.7.0",
    "npm install -g chrome-devtools-mcp@1.11.0"
  ],
  deliveryOptions: [
    {
      channel: "taildrop",
      command: "tailscale file cp exports/omarchy-handoff/* omarchy-aiagent:",
      requires: "target online, tailscaled running in WSL2, Taildrop enabled",
      status: "PREFERRED"
    },
    {
      channel: "hermes-telegram-fusion",
      command: "community chat document upload (bot API, 50 MB ceiling)",
      requires: "GO_LIVE_GATE telegram_send open + ticket + bot token + chat id",
      status: "GATED / metadata-and-notice-only until ticket"
    }
  ],
  effects: { network: false, telegramSend: false, queueMutation: false, transfer: false }
};

writeFileSync(join(outDir, "MANIFEST.json"), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(
  join(outDir, "SHA256SUMS"),
  `${chunks.map((chunk) => `${chunk.sha256}  ${chunk.name}`).join("\n")}\n`
);

console.log(
  JSON.stringify(
    {
      outDir: relative(root, outDir),
      files: files.length,
      archiveBytes: bytes,
      chunks: chunks.length,
      sha256,
      stopPoint: "HANDOFF PACKAGE BUILT - ZERO TRANSFERS, SENDS, OR CALLS"
    },
    null,
    2
  )
);

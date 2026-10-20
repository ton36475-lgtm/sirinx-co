import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

// REA (reverse-engineer-anything) artifact audit for SIRINX shipped bundles.
//
// REA applies to shipped artifacts, not to source trees: for a source-owned
// system the repository is already the truth. This script therefore records, per
// target, what the *built* output actually contains, with the REA Evidence id and
// root digest attached, and keeps the (100-200 MB) full Evidence bundle outside
// the repo.
//
// Usage:
//   node scripts/rea-artifact-audit.mjs --target=<path> [--label=<name>]
//     [--evidence-dir=<dir>] [--out=<file>] [--rea=<bin>] [--budget-mb=6144]
//
// Exit codes: 0 = receipt written, 1 = target/evidence/parse failure.
//
// The script never executes the target. JavaScript is parsed as inert text by
// REA; every number below is a static observation, not runtime proof.

const root = process.cwd();
const args = process.argv.slice(2);
const argOf = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);

const targetArg = argOf("target");
if (!targetArg) {
  console.error(JSON.stringify({ error: "missing_target", usage: "node scripts/rea-artifact-audit.mjs --target=<path>" }));
  process.exit(1);
}

const target = targetArg.startsWith("/") ? targetArg : join(root, targetArg);
const label = argOf("label") || relative(root, target).replace(/[^a-zA-Z0-9._-]+/g, "-");
const evidenceDir = argOf("evidence-dir") || join(process.env.TMPDIR || "/tmp", "rea-audit");
const outFile = argOf("out") || join(root, "reports", "runtime", "rea", `${label}.receipt.json`);
const reaBin = argOf("rea") || "rea";
const budgetMb = argOf("budget-mb") || "6144";

if (!existsSync(target)) {
  console.error(JSON.stringify({ error: "target_missing", target }));
  process.exit(1);
}

mkdirSync(evidenceDir, { recursive: true });
const evidencePath = join(evidenceDir, `${label}.evidence.json`);

if (!existsSync(evidencePath)) {
  const run = spawnSync(reaBin, ["analyze-javascript-application", target, "--json"], {
    env: { ...process.env, NODE_OPTIONS: `${process.env.NODE_OPTIONS || ""} --max-old-space-size=${budgetMb}`.trim() },
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 1024 * 1024 * 1024,
    timeout: 900_000
  });
  if (run.status !== 0) {
    console.error(JSON.stringify({ error: "rea_run_failed", status: run.status, signal: run.signal, stderr: String(run.stderr || "").slice(-800) }));
    process.exit(1);
  }
  writeFileSync(evidencePath, run.stdout);
}

let evidence;
try {
  evidence = JSON.parse(readFileSync(evidencePath, "utf8"));
} catch (error) {
  console.error(JSON.stringify({ error: "evidence_parse_failed", evidencePath, detail: String(error.message).slice(0, 300) }));
  process.exit(1);
}

const normalized = evidence.normalized_result || {};
const graph = normalized.graph || { nodes: [], edges: [] };
const statistics = normalized.statistics || {};
const limitations = Array.isArray(evidence.limitations) ? evidence.limitations : [];

const endpointNamespaces = {};
const storageNamespaces = {};
const literalUrls = new Set();
const urlPattern = /https?:\/\/[^\s"'\\\]]+/g;

for (const node of graph.nodes || []) {
  const namespace = node?.identity?.namespace;
  if (node.kind === "endpoint") {
    endpointNamespaces[namespace] = (endpointNamespaces[namespace] || 0) + 1;
    for (const match of String(node.identity?.key || "").match(urlPattern) || []) literalUrls.add(match);
  } else if (node.kind === "storage") {
    storageNamespaces[namespace] = (storageNamespaces[namespace] || 0) + 1;
  }
}

const resourceConstrainedFiles = limitations
  .filter((line) => /\bResource constraint\b/.test(line))
  .map((line) => line.split(":")[0]);

const hosts = new Set([...literalUrls].map((url) => {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}).filter(Boolean));

const receipt = {
  schema: "sirinx.rea.artifact-receipt/v1",
  generatedAt: new Date().toISOString(),
  rea: { bin: reaBin, evidencePath, evidenceBytes: statSync(evidencePath).size },
  label,
  target: { path: relative(root, target), absolutePath: target },
  evidence: {
    evidenceId: evidence.evidence_id || null,
    confidence: evidence.confidence || null,
    authority: evidence.authority || null,
    provider: evidence.provider || null,
    subjectDigestSha256: evidence.subject?.digest?.sha256 || null,
    rootArtifactSha256: normalized.root_artifact_sha256 || null,
    inventoryManifestId: normalized.inventory_manifest_id || null,
    inventoryGraphSha256: normalized.inventory_graph_sha256 || null
  },
  observed: {
    statistics,
    graph: { nodes: (graph.nodes || []).length, edges: (graph.edges || []).length, coverageStatus: graph.coverage?.status || null },
    endpointNamespaces,
    storageNamespaces,
    literalUrlCount: literalUrls.size,
    literalUrlHosts: [...hosts].sort(),
    integrityContradictions: normalized.integrity_contradictions || []
  },
  limitations: {
    count: limitations.length,
    resourceConstrainedFiles,
    items: limitations
  },
  checks: {
    parseFailures: statistics.parse_failures ?? null,
    skippedJavascriptFiles: statistics.skipped_javascript_files ?? null,
    incompleteCoverage: resourceConstrainedFiles.length > 0 || graph.coverage?.status === "partial",
    executesTarget: false,
    networkUsed: false
  },
  truthRule: "Static observation of a shipped bundle only. Not runtime proof: no page was loaded, no request was sent, no provider was called."
};

receipt.receiptSha256 = createHash("sha256").update(JSON.stringify({ ...receipt, receiptSha256: undefined })).digest("hex");
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({
  ok: true,
  label,
  out: relative(root, outFile),
  evidenceId: receipt.evidence.evidenceId,
  files: statistics.relevant_files ?? null,
  parseFailures: receipt.checks.parseFailures,
  resourceConstrained: resourceConstrainedFiles.length,
  receiptSha256: receipt.receiptSha256
}));

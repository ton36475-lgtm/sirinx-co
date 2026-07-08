#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const discoveryPath = "docs/roadmaps/ALL_PROJECT_SOURCE_DISCOVERY_20260708.json";
const ledgerPath = "docs/roadmaps/ALL_PROJECT_AGENT_NATIVE_INTEGRATION_LEDGER_20260708.json";

const fail = (message) => {
  console.error(`all-project source discovery failed: ${message}`);
  process.exit(1);
};

const read = (file) => readFileSync(join(root, file), "utf8");

if (!existsSync(join(root, discoveryPath))) fail(`missing ${discoveryPath}`);
if (!existsSync(join(root, ledgerPath))) fail(`missing ${ledgerPath}`);

let discovery;
let ledger;
try {
  discovery = JSON.parse(read(discoveryPath));
} catch (error) {
  fail(`invalid JSON in ${discoveryPath}: ${error.message}`);
}
try {
  ledger = JSON.parse(read(ledgerPath));
} catch (error) {
  fail(`invalid JSON in ${ledgerPath}: ${error.message}`);
}

if (discovery.schemaVersion !== 1) fail("schemaVersion must be 1");
if (discovery.mode !== "LOCAL_ONLY_DISCOVERY") fail("mode must be LOCAL_ONLY_DISCOVERY");

for (const [key, value] of Object.entries(discovery.scanPolicy ?? {})) {
  if (value !== false) fail(`scanPolicy.${key} must be false`);
}
for (const requiredPolicy of ["secretRead", "externalWrite", "providerCall", "push", "deploy"]) {
  if (!(requiredPolicy in (discovery.scanPolicy ?? {}))) {
    fail(`missing scanPolicy.${requiredPolicy}`);
  }
}

if (!Array.isArray(discovery.projects) || discovery.projects.length === 0) {
  fail("discovery projects must be a non-empty array");
}
if (!Array.isArray(ledger.projects) || ledger.projects.length === 0) {
  fail("ledger projects must be a non-empty array");
}

const discoveryById = new Map(discovery.projects.map((project) => [project.id, project]));
for (const ledgerProject of ledger.projects) {
  const project = discoveryById.get(ledgerProject.id);
  if (!project) fail(`missing discovery project ${ledgerProject.id}`);
  if (project.status !== "candidate_source_found") {
    fail(`${project.id} status must be candidate_source_found`);
  }
  if (!Array.isArray(project.candidatePaths) || project.candidatePaths.length === 0) {
    fail(`${project.id} must have at least one candidate path`);
  }
  if (project.nextSafeAction !== "human_confirm_authoritative_source_before_implementation") {
    fail(`${project.id} must require human source confirmation`);
  }

  for (const candidate of project.candidatePaths) {
    if (!candidate.path) fail(`${project.id} has candidate without path`);
    if (!candidate.kind) fail(`${project.id} candidate ${candidate.path} missing kind`);
    if (!candidate.evidence) fail(`${project.id} candidate ${candidate.path} missing evidence`);
    if (!existsSync(candidate.path)) {
      fail(`${project.id} candidate path missing on disk: ${candidate.path}`);
    }
  }
}

for (const project of discovery.projects) {
  if (!ledger.projects.some((ledgerProject) => ledgerProject.id === project.id)) {
    fail(`unexpected discovery project ${project.id}`);
  }
}

console.log("All-project source discovery verification passed.");

/**
 * Playwright scaffold:
 *   npx playwright test tests/e2e/handoff-bundle.spec.ts
 *
 * Verifies the handoff bundle metadata and exclusion rules from the repo side.
 */

import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../..");
const bundleRoot = path.join(repoRoot, "04_deployment_bundle");

test("handoff bundle metadata exists and excludes unsafe artifacts", async () => {
  expect(existsSync(path.join(bundleRoot, "MANIFEST.md"))).toBeTruthy();
  expect(existsSync(path.join(bundleRoot, "MANIFEST.json"))).toBeTruthy();
  expect(existsSync(path.join(bundleRoot, "CHECKSUMS.SHA256.txt"))).toBeTruthy();

  const manifest = readFileSync(path.join(repoRoot, ".ops/contracts/HANDOFF_BUNDLE_MANIFEST.json"), "utf8");
  expect(manifest).toContain("\"path\": \"skills\"");
  expect(manifest).toContain("\"path\": \"agents/system_prompts\"");
  expect(manifest).not.toContain("\".env\"");
});

/**
 * Playwright scaffold:
 *   npx playwright test tests/e2e/package-facts.spec.ts
 *
 * Verifies locked package facts and scenario wording before UI smoke runs.
 */

import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../..");
const lockedFacts = readFileSync(path.join(repoRoot, "governance/LOCKED_BUSINESS_FACTS.md"), "utf8");

test("locked package facts remain exact", async () => {
  await expect(lockedFacts).toContain("Brand: SIRINX");
  await expect(lockedFacts).toContain("Slogan: Clean Tech • Smart Future");
  await expect(lockedFacts).toContain("START: 125,000 THB + VAT 7% | AIKO 1U+ (5kW+) | Solis 5kW | Premium DC Cable 6 sqmm");
  await expect(lockedFacts).toContain("PRO: 315,000 THB + VAT 7% | AIKO 1U+ (8kW+) Seamless Black | 6kW Hybrid | GSL ENERGY 16.08kWh");
  await expect(lockedFacts).toContain("ENTERPRISE BESS: 4,990,000 THB + VAT 7% | 175kWp solar array | 125kW 3-Phase | Premium Liquid-Cooled BESS 261kWh");
  await expect(lockedFacts).toContain("validated project scenario and sales modeling target");
});


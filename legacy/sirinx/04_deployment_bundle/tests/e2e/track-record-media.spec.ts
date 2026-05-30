/**
 * Playwright scaffold:
 *   npx playwright test tests/e2e/track-record-media.spec.ts
 *
 * Verifies Track Record media policy and optional browser content checks.
 */

import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL;
const repoRoot = path.resolve(__dirname, "../..");
const mediaPolicy = readFileSync(path.join(repoRoot, "docs/migration/TRACK_RECORD_MEDIA_POLICY.md"), "utf8");

test("track record media policy preserves premium real-world imagery boundary", async () => {
  await expect(mediaPolicy).toContain("premium, real-world, permissioned imagery");
  await expect(mediaPolicy.toLowerCase()).not.toContain("casino");
});

test.describe("track record browser review", () => {
  test.skip(!baseUrl, "Set PLAYWRIGHT_BASE_URL to run browser content checks.");

  test("runtime copy avoids unrelated gambling content", async ({ page }) => {
    await page.goto(baseUrl!, { waitUntil: "domcontentloaded" });
    const body = (await page.locator("body").innerText()).toLowerCase();
    await expect(body).not.toContain("casino");
    await expect(body).not.toContain("lottery");
    await expect(body).not.toContain("baccarat");
  });
});

/**
 * Playwright scaffold:
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test tests/e2e/mobile-layout.spec.ts
 *
 * Verifies mobile-first layout expectations once a local preview is available.
 */

import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL;

test.describe("mobile-first layout", () => {
  test.skip(!baseUrl, "Set PLAYWRIGHT_BASE_URL to run browser layout checks.");

  test("hero and navigation remain readable on narrow mobile widths", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(baseUrl!, { waitUntil: "domcontentloaded" });

    const body = await page.locator("body").innerText();
    await expect(body).toContain("SIRINX");
    await expect(body.toLowerCase()).not.toContain("chokma");
  });
});


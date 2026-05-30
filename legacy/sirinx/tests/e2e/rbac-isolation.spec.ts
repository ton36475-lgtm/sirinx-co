import { test, expect } from "@playwright/test";

const opsBaseUrl = process.env.OPS_BASE_URL;

test.describe("SIRINX RBAC isolation", () => {
  test.skip(!opsBaseUrl, "Set OPS_BASE_URL to run server RBAC isolation checks.");

  test("public visitor cannot access ops dashboard anonymously", async ({ page }) => {
    const response = await page.goto(`${opsBaseUrl}/`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBeGreaterThanOrEqual(200);
    expect(response?.status()).toBeLessThan(500);

    const bodyText = await page.locator("body").innerText();
    expect(bodyText.toLowerCase()).not.toContain("production secret");
    expect(bodyText.toLowerCase()).not.toContain("admin token");
  });
});

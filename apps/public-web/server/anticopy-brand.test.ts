/**
 * Tests for Anti-Copy Protection + White-Label Brand Config
 */
import { describe, it, expect } from "vitest";

// ── Brand Config Tests ──
describe("Brand Configuration", () => {
  it("should export a valid SIRINX brand config", async () => {
    const { default: config } = await import("../brands/sirinx/config");
    expect(config).toBeDefined();
    expect(config.id).toBe("sirinx");
    expect(config.name).toBe("SIRINX");
  });

  it("should have all required identity fields", async () => {
    const { default: config } = await import("../brands/sirinx/config");
    expect(config.tagline).toBeTruthy();
    expect(config.legalName).toBeTruthy();
    expect(config.description).toBeTruthy();
    expect(config.foundedYear).toBeGreaterThan(2000);
  });

  it("should have valid asset URLs", async () => {
    const { default: config } = await import("../brands/sirinx/config");
    expect(config.logo).toMatch(/^https?:\/\//);
    expect(config.heroImage).toMatch(/^https?:\/\//);
  });

  it("should have complete contact information", async () => {
    const { default: config } = await import("../brands/sirinx/config");
    expect(config.contact.phone).toBeTruthy();
    expect(config.contact.email).toContain("@");
    expect(config.contact.lineId).toBeTruthy();
    expect(config.contact.address).toBeTruthy();
  });

  it("should have at least one social media link", async () => {
    const { default: config } = await import("../brands/sirinx/config");
    const socialValues = Object.values(config.social).filter(Boolean);
    expect(socialValues.length).toBeGreaterThan(0);
  });

  it("should have valid theme configuration", async () => {
    const { default: config } = await import("../brands/sirinx/config");
    expect(["dark", "light"]).toContain(config.theme.mode);
    expect(config.theme.colors.primary).toBeTruthy();
    expect(config.theme.colors.background).toBeTruthy();
    expect(config.theme.fonts.display).toBeTruthy();
  });

  it("should have at least 3 solutions defined", async () => {
    const { default: config } = await import("../brands/sirinx/config");
    expect(config.solutions.length).toBeGreaterThanOrEqual(3);
    config.solutions.forEach((sol) => {
      expect(sol.id).toBeTruthy();
      expect(sol.titleTH).toBeTruthy();
      expect(sol.titleEN).toBeTruthy();
      expect(sol.titleCN).toBeTruthy();
      expect(sol.href).toBeTruthy();
    });
  });

  it("should have at least 3 industries defined", async () => {
    const { default: config } = await import("../brands/sirinx/config");
    expect(config.industries.length).toBeGreaterThanOrEqual(3);
    config.industries.forEach((ind) => {
      expect(ind.id).toBeTruthy();
      expect(ind.titleTH).toBeTruthy();
      expect(ind.titleEN).toBeTruthy();
    });
  });

  it("should have SEO configuration", async () => {
    const { default: config } = await import("../brands/sirinx/config");
    expect(config.seo.titleTemplate).toContain("%s");
    expect(config.seo.defaultTitle).toBeTruthy();
    expect(config.seo.keywords.length).toBeGreaterThan(0);
  });

  it("should have allowed domains for anti-copy", async () => {
    const { default: config } = await import("../brands/sirinx/config");
    expect(config.allowedDomains.length).toBeGreaterThan(0);
    expect(config.allowedDomains).toContain("localhost");
  });
});

// ── Brand Registry Tests ──
describe("Brand Registry", () => {
  it("should return SIRINX as default brand", async () => {
    const { getActiveBrand } = await import("../brands/index");
    const brand = getActiveBrand();
    expect(brand.id).toBe("sirinx");
  });

  it("should list at least one brand", async () => {
    const { listBrands } = await import("../brands/index");
    const brands = listBrands();
    expect(brands.length).toBeGreaterThan(0);
    expect(brands).toContain("sirinx");
  });

  it("should get brand by ID", async () => {
    const { getBrand } = await import("../brands/index");
    const brand = getBrand("sirinx");
    expect(brand).toBeDefined();
    expect(brand?.name).toBe("SIRINX");
  });

  it("should return undefined for unknown brand", async () => {
    const { getBrand } = await import("../brands/index");
    const brand = getBrand("nonexistent-brand");
    expect(brand).toBeUndefined();
  });
});

// ── Anti-Copy Vite Config Tests ──
describe("Anti-Copy Build Configuration", () => {
  it("should have obfuscator plugin in devDependencies", async () => {
    const fs = await import("fs");
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
    expect(pkg.devDependencies["vite-plugin-javascript-obfuscator"]).toBeDefined();
    expect(pkg.devDependencies["javascript-obfuscator"]).toBeDefined();
  });

  it("should have sourcemap disabled in vite config", async () => {
    const fs = await import("fs");
    const viteConfig = fs.readFileSync("vite.config.ts", "utf-8");
    expect(viteConfig).toContain("sourcemap: false");
  });

  it("should have obfuscator plugin configured for production", async () => {
    const fs = await import("fs");
    const viteConfig = fs.readFileSync("vite.config.ts", "utf-8");
    expect(viteConfig).toContain("obfuscatorPlugin");
    expect(viteConfig).toContain("isProduction");
    expect(viteConfig).toContain("selfDefending: true");
    expect(viteConfig).toContain("stringArray: true");
    expect(viteConfig).toContain("controlFlowFlattening: true");
  });
});

// ── BrandConfig Type Completeness ──
describe("BrandConfig Type Interface", () => {
  it("should export BrandConfig type from sirinx config", async () => {
    const mod = await import("../brands/sirinx/config");
    // Type check: ensure the default export matches BrandConfig shape
    const config: import("../brands/sirinx/config").BrandConfig = mod.default;
    expect(config).toBeDefined();
  });

  it("template config should match BrandConfig interface", async () => {
    const { default: templateConfig } = await import("../brands/_template/config");
    expect(templateConfig.id).toBeTruthy();
    expect(templateConfig.name).toBeTruthy();
    expect(templateConfig.solutions).toBeInstanceOf(Array);
    expect(templateConfig.industries).toBeInstanceOf(Array);
  });
});

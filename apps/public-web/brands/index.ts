/**
 * Brand Registry
 *
 * Register all available brands here.
 * The active brand is determined by the BRAND environment variable,
 * defaulting to "sirinx" if not set.
 */
import sirinxConfig from "./sirinx/config";
import type { BrandConfig } from "./sirinx/config";

export type { BrandConfig };

const brands: Record<string, BrandConfig> = {
  sirinx: sirinxConfig,
  // Add new brands here:
  // "brand-b": brandBConfig,
};

/**
 * Get the active brand configuration.
 * Reads from BRAND env var, defaults to "sirinx".
 */
export function getActiveBrand(): BrandConfig {
  const brandId = (typeof process !== "undefined" && process.env?.BRAND) || "sirinx";
  const config = brands[brandId];
  if (!config) {
    console.warn(`Brand "${brandId}" not found, falling back to "sirinx"`);
    return brands.sirinx;
  }
  return config;
}

/**
 * Get a specific brand configuration by ID.
 */
export function getBrand(brandId: string): BrandConfig | undefined {
  return brands[brandId];
}

/**
 * List all registered brand IDs.
 */
export function listBrands(): string[] {
  return Object.keys(brands);
}

export default getActiveBrand;

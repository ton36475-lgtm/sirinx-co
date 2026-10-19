# B6 Review: Five-Province Static SEO Canary Foundation & Content Contracts

**Date:** 2026-10-17  
**Reviewer:** Buffy (AI Agent)  
**Status:** Source review and validation complete

## Overview

B6 includes: "Wave 1 public-web content contracts and default-off five-province static SEO canary foundation are locally implemented". This review covers the implemented components.

## Files Reviewed

1. **apps/public-web/shared/siteContentRegistry.ts** - Core implementation
2. **apps/public-web/server/staticSeoBuild.ts** - Integration in static SEO build
3. **apps/public-web/shared/thaiProvinces.ts** - Province data (referenced)
4. **apps/public-web/shared/publicProjectContent.ts** - Project content (referenced)

## Findings

### 1. Five-Province Static SEO Canary Foundation ✓

The implementation in `siteContentRegistry.ts` is correct:

- **Default-off behavior**: `isStaticProvinceCanaryEnabled()` returns `true` only when `SIRINX_STATIC_PROVINCE_CANARY === "1"`. When env var is unset/other value, returns `false`. ✓
- **Five provinces**: `staticProvinceCanarySlugs = ["bangkok", "chiang-mai", "chonburi", "khon-kaen", "phuket"]` - exactly 5 provinces as specified. ✓
- **Routes generation**: `getStaticProvinceCanaryRoutes()` returns empty array when disabled, and generates 5 routes (`/solar-carport/{slug}`) when enabled. ✓
- **Route validation**: `getStaticProvinceCanaryRecord()` validates route format, checks if slug is in canary set, looks up province data. Returns `null` for invalid routes. ✓
- **Content status**: Canary records include `contentStatus: "DRAFT_CANARY"`. ✓
- **Integrity assertion**: `assertSiteContentRegistryIntegrity()` validates 77 unique provinces, valid canary slugs, no duplicate project IDs, schema validation, and business rules. ✓

### 2. Integration with Static SEO Build ✓

In `staticSeoBuild.ts`, the canary functions are imported and used correctly - routes are determined via `getStaticProvinceCanaryRoutes()`, shells built via `buildStaticProvinceCanaryShell()`, and the default-off behavior is respected.

### 3. Content Contracts ✓

The `siteContentRegistry.ts` defines comprehensive Zod schemas for content contracts with proper validation constraints and `.strict()` mode.

### 4. Validation Testing ✓

Manual validation confirms correct default-off behavior, 5 routes when enabled, proper record lookup/validation.

## Conclusion

The five-province static SEO canary foundation and Wave 1 content contracts are correctly implemented, properly default-off, and meet the stated requirements.

**Recommendation:** Mark source review and validation as complete. The "per-app cutover remains queued" part remains pending as stated in MASTER_PLAN.

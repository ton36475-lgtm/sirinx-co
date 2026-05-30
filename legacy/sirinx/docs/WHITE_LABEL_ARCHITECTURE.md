# White-Label Architecture Guide

**SIRINX Solar Platform — Multi-Brand Reuse Framework**

**Version:** 1.0
**Date:** April 2026
**Author:** Manus AI

---

## Executive Summary

This document describes the architecture and implementation strategy for transforming the SIRINX Solar website into a **white-label platform** that can be rapidly deployed for multiple brands in the solar energy industry and beyond. The system is designed around a **Brand Configuration Layer** that abstracts all brand-specific content, theming, and assets into a single configuration file per brand, while sharing the same application codebase, components, and infrastructure.

The architecture supports three deployment models: **build-time branding** (separate builds per brand), **runtime branding** (single deployment with domain-based brand detection), and a **hybrid approach** that combines both for maximum flexibility.

---

## Architecture Overview

The platform is organized into six distinct layers, each with a clear responsibility boundary. This separation ensures that adding a new brand requires changes only in the Brand Config Layer and Asset Layer, with zero modifications to the shared application code.

| Layer | Responsibility | Brand-Specific? | Files |
|-------|---------------|-----------------|-------|
| Brand Config | Company identity, contact, solutions, industries, SEO | Yes | `brands/<brand>/config.ts` |
| Theme | Colors, fonts, spacing, dark/light mode | Yes | CSS variables in `index.css` + config |
| Content | Translations (TH/EN/CN), copy, descriptions | Yes | `brands/<brand>/config.ts` translations |
| Component | Reusable UI components (buttons, cards, layouts) | No | `client/src/components/` |
| Layout | Page templates that consume brand config | No | `client/src/pages/` |
| Asset | Logos, images, favicons, trust badges | Yes | CDN URLs in config |

### Layer Interaction Diagram

```
┌─────────────────────────────────────────────────────┐
│                   Brand Config Layer                 │
│  brands/sirinx/config.ts  │  brands/brand-b/config  │
└──────────────┬──────────────────────┬────────────────┘
               │                      │
        ┌──────▼──────┐        ┌──────▼──────┐
        │ BrandContext │        │ BrandContext │
        │  (React)     │        │  (React)     │
        └──────┬──────┘        └──────┬──────┘
               │                      │
     ┌─────────▼──────────────────────▼─────────┐
     │           Shared Component Layer          │
     │  Layout, Navbar, Footer, Cards, Pages     │
     │  (reads brand config via useBrand() hook) │
     └─────────┬────────────────────────────────┘
               │
     ┌─────────▼─────────────┐
     │    Theme Layer (CSS)   │
     │  CSS variables driven  │
     │  by brand.theme config │
     └───────────────────────┘
```

---

## Brand Configuration File

Each brand is defined by a single TypeScript configuration file that implements the `BrandConfig` interface. This file contains all brand-specific data organized into logical sections.

### BrandConfig Interface

The interface is defined in `brands/sirinx/config.ts` and exported for reuse. It contains the following sections:

| Section | Fields | Purpose |
|---------|--------|---------|
| Identity | `id`, `name`, `tagline`, `legalName`, `description`, `foundedYear` | Core brand identity |
| Assets | `logo`, `favicon`, `heroImage`, `ogImage` | Visual brand assets (CDN URLs) |
| Contact | `phone`, `email`, `lineId`, `lineUrl`, `address`, `mapUrl` | Business contact information |
| Social | `facebook`, `instagram`, `youtube`, `linkedin`, `tiktok`, `twitter` | Social media profiles |
| Trust Badges | Array of `{ name, imageUrl, link? }` | Certification and trust marks |
| Theme | `mode`, `colors`, `fonts` | Visual theming parameters |
| Solutions | Array with multilingual titles and descriptions | Product/service offerings |
| Industries | Array with multilingual titles and descriptions | Target market segments |
| SEO | `titleTemplate`, `defaultTitle`, `defaultDescription`, `keywords` | Search engine optimization |
| Domain Lock | `allowedDomains` | Anti-copy domain restrictions |

### Creating a New Brand

To create a new brand, follow these steps:

1. Copy the template directory: `cp -r brands/_template brands/<new-brand>`
2. Edit `brands/<new-brand>/config.ts` with the new brand's information
3. Upload brand assets to CDN using `manus-upload-file --webdev`
4. Register the brand in `brands/index.ts`
5. Build with `BRAND=<new-brand> pnpm build`

---

## Anti-Copy Protection System

The platform includes a multi-layered protection system to deter unauthorized code copying and content theft. The protections are implemented at both the build level and the runtime level.

### Build-Level Protections

**JavaScript Obfuscation** is applied during production builds using `vite-plugin-javascript-obfuscator`. The obfuscation configuration includes the following techniques:

| Technique | Setting | Effect |
|-----------|---------|--------|
| Control Flow Flattening | 50% threshold | Restructures code logic to make reverse-engineering difficult |
| Dead Code Injection | 20% threshold | Inserts non-functional code paths to confuse analysis |
| Self-Defending | Enabled | Code detects and resists formatting/beautification attempts |
| String Array Encoding | Base64 | Encodes string literals to prevent easy text search |
| Identifier Renaming | Hexadecimal | Replaces variable/function names with hex identifiers |
| Source Map Removal | `sourcemap: false` | Prevents browser DevTools from mapping to original source |

These protections are only applied in production builds (`NODE_ENV=production`), keeping the development experience unaffected.

### Runtime Protections

The `AntiCopy` component (`client/src/components/AntiCopy.tsx`) provides client-side deterrents:

**Context Menu Blocking** prevents right-click access to "View Source" and "Inspect Element" options. **Keyboard Shortcut Interception** blocks F12, Ctrl+Shift+I (DevTools), Ctrl+U (View Source), and Ctrl+S (Save Page). **Copy/Cut Prevention** intercepts clipboard events and replaces copied content with a copyright notice. **Text Selection Blocking** applies CSS `user-select: none` globally while preserving input field usability. **Image Drag Prevention** disables drag-and-drop on all image elements.

The `AntiCopy` component is conditionally enabled only in production (`import.meta.env.PROD`), so developers can work normally during development.

### Important Limitations

These protections are **deterrents, not absolute security**. A determined attacker with technical knowledge can bypass client-side protections. The real value lies in raising the barrier of effort required, which deters casual copying. Server-side business logic and API keys remain protected by the server architecture itself.

---

## Theming System

The theming system uses CSS custom properties (variables) that can be driven by the brand configuration. The current implementation in `client/src/index.css` defines semantic color tokens that the entire UI references.

### How Brand Theming Works

When a brand config is loaded, the `BrandProvider` makes the theme configuration available to all components. Components reference semantic CSS variables rather than hardcoded colors, allowing the entire visual identity to change by updating the CSS variable values.

The recommended approach for applying brand themes at runtime is:

```typescript
// In a useEffect within BrandProvider or a ThemeApplier component
const root = document.documentElement;
root.style.setProperty("--color-accent-primary", brand.theme.colors.primary);
root.style.setProperty("--color-accent-secondary", brand.theme.colors.secondary);
root.style.setProperty("--color-background", brand.theme.colors.background);
root.style.setProperty("--color-foreground", brand.theme.colors.foreground);
```

For build-time theming, each brand can have its own CSS override file that is imported based on the `BRAND` environment variable.

---

## Deployment Models

### Model 1: Build-Time Branding (Recommended for Start)

Each brand gets a separate production build. The `BRAND` environment variable determines which brand config is loaded during the build process.

**Advantages:** Complete isolation between brands, optimal bundle size (no unused brand code), simpler debugging. **Disadvantages:** Requires separate build and deployment per brand.

### Model 2: Runtime Branding

A single deployment serves multiple brands, detecting the active brand from the request domain or subdomain.

**Advantages:** Single deployment, instant brand switching, easier maintenance. **Disadvantages:** Slightly larger bundle (all brand configs included), more complex routing logic.

### Model 3: Hybrid (Future)

Core application is shared, but brand-specific assets and configurations are loaded dynamically from a CDN or API based on the detected domain.

---

## Migration Checklist for New Brands

When onboarding a new brand to the platform, complete the following checklist:

| Step | Action | Status |
|------|--------|--------|
| 1 | Copy `brands/_template` to `brands/<brand>` | |
| 2 | Fill in all identity fields (name, tagline, legal name) | |
| 3 | Upload logo, hero image, OG image to CDN | |
| 4 | Configure contact information | |
| 5 | Add social media links | |
| 6 | Upload and configure trust badges | |
| 7 | Define color palette and fonts | |
| 8 | List all solutions with TH/EN/CN translations | |
| 9 | List all target industries with translations | |
| 10 | Configure SEO metadata | |
| 11 | Add production domains to `allowedDomains` | |
| 12 | Register brand in `brands/index.ts` | |
| 13 | Test build with `BRAND=<brand> pnpm build` | |
| 14 | Verify all pages render correctly | |
| 15 | Test language switching (TH/EN/CN) | |

---

## File Structure Reference

```
brands/
  _template/           ← Copy this for new brands
    config.ts          ← Brand config template with instructions
  sirinx/              ← Reference implementation
    config.ts          ← Complete SIRINX brand config
  index.ts             ← Brand registry (getActiveBrand, getBrand, listBrands)

client/src/
  contexts/
    BrandContext.tsx    ← React context + useBrand() hook
  components/
    AntiCopy.tsx       ← Runtime anti-copy protections
    Layout.tsx         ← Brand-aware navbar + footer
  pages/               ← Page components (brand-agnostic)

docs/
  WHITE_LABEL_ARCHITECTURE.md  ← This document
  ANTI_COPY_PROTECTION.md      ← Detailed anti-copy documentation
```

---

## Future Enhancements

The following enhancements are planned for future iterations of the white-label system:

**Brand Admin Panel** — A web interface for non-technical users to configure brand settings, upload assets, and preview changes without touching code.

**Dynamic Content Loading** — Load brand-specific content from a database or CMS rather than static config files, enabling real-time updates without redeployment.

**A/B Testing per Brand** — Support for running experiments on different brand configurations to optimize conversion rates.

**Multi-Tenant Database** — Add `brandId` columns to relevant database tables for data isolation between brands sharing the same infrastructure.

**Automated Brand Onboarding** — A CLI tool or wizard that guides users through the brand setup process, validates configurations, and generates initial builds.

---

## References

- [White Label React App: Runtime and Build-Time Theming](https://corecotechnologies.com/development/white-label-react-app/) — CoReCo Technologies
- [Building React Components for Multiple Brands](https://medium.com/walmartglobaltech/building-react-components-for-multiple-brands-and-applications-7e9157a39db4) — Walmart Global Tech
- [We Built One Platform That Powers 30+ Brands](https://medium.com/@jose_98883/we-built-one-platform-that-powers-30-brands-the-white-label-playbook-for-saas-in-emerging-56b6650859bc) — Medium
- [JScrambler: Code Locks for JavaScript-based Apps](https://jscrambler.com/blog/jscrambler-101-code-locks) — JScrambler
- [javascript-obfuscator](https://www.npmjs.com/package/javascript-obfuscator) — NPM

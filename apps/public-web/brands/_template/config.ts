/**
 * Brand Configuration Template
 *
 * INSTRUCTIONS:
 * 1. Copy this entire _template/ directory to brands/<your-brand-name>/
 * 2. Fill in all values below with your brand's information
 * 3. Update brands/index.ts to register your new brand
 * 4. Run the build with BRAND=<your-brand-name> to generate a branded version
 *
 * Fields marked with "REQUIRED" must be filled in.
 * Fields marked with "OPTIONAL" can be left empty or removed.
 */

import type { BrandConfig } from "../sirinx/config";

const brandConfig: BrandConfig = {
  // ── Identity (REQUIRED) ──
  id: "your-brand-id",
  name: "Your Brand Name",
  tagline: "Your Brand Tagline",
  legalName: "Your Legal Company Name",
  description: "A brief description of your company and services",
  foundedYear: 2024,

  // ── Assets (REQUIRED) ──
  // Upload to CDN first, then paste URLs here
  logo: "https://your-cdn.com/logo.png",
  favicon: "/favicon.ico",
  heroImage: "https://your-cdn.com/hero.webp",
  ogImage: "https://your-cdn.com/og-image.webp",

  // ── Contact (REQUIRED) ──
  contact: {
    phone: "000-000-0000",
    email: "contact@yourbrand.com",
    lineId: "@yourbrand",
    lineUrl: "https://line.me/ti/p/~@yourbrand",
    address: "Your Address",
    mapUrl: "https://maps.google.com/?q=your+address",
  },

  // ── Social Media (OPTIONAL) ──
  social: {
    facebook: "",
    instagram: "",
    youtube: "",
    linkedin: "",
    tiktok: "",
    twitter: "",
  },

  // ── Trust Badges (OPTIONAL) ──
  trustBadges: [],

  // ── Theme (REQUIRED) ──
  theme: {
    mode: "dark",
    colors: {
      primary: "#2dd4bf",
      secondary: "#f59e0b",
      accent: "#06b6d4",
      background: "#0a1628",
      foreground: "#f1f5f9",
    },
    fonts: {
      display: "Inter, sans-serif",
      body: "Inter, sans-serif",
    },
  },

  // ── Solutions (REQUIRED — at least 1) ──
  solutions: [
    {
      id: "solution-1",
      icon: "Sun",
      titleTH: "โซลูชัน 1",
      titleEN: "Solution 1",
      titleCN: "解决方案1",
      descTH: "คำอธิบายภาษาไทย",
      descEN: "English description",
      descCN: "中文描述",
      href: "/solutions#solution-1",
      featured: true,
    },
  ],

  // ── Industries (REQUIRED — at least 1) ──
  industries: [
    {
      id: "industry-1",
      icon: "Factory",
      titleTH: "อุตสาหกรรม 1",
      titleEN: "Industry 1",
      titleCN: "行业1",
      descTH: "คำอธิบายภาษาไทย",
      descEN: "English description",
      descCN: "中文描述",
      href: "/industries#industry-1",
    },
  ],

  // ── SEO (REQUIRED) ──
  seo: {
    titleTemplate: "%s | Your Brand",
    defaultTitle: "Your Brand — Your Tagline",
    defaultDescription: "Your brand description for search engines",
    keywords: ["keyword1", "keyword2"],
  },

  // ── Domain Lock (REQUIRED for production) ──
  allowedDomains: [
    "yourdomain.com",
    "localhost",
    "127.0.0.1",
  ],
};

export default brandConfig;

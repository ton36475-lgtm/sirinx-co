/**
 * Local media registry for assets that used to live on the retired Manus-era
 * CloudFront origin (`d2xsxph8kpxj0f.cloudfront.net/.../DfaBNh7LYBahFVi2JKfAUv`).
 *
 * That origin answers 403 `AccessDenied` for every file since 2026-09, and the
 * originals were never committed to this repository. Every reference in the
 * public site now resolves here instead, pointing at SIRINX's own photography
 * (`client/public/assets/**`) that is served from the same domain as the page.
 * The mapping is recorded once, in this table, so the substitution is auditable
 * — see `reports/runtime/public-web-sites-20261027.md` §3.
 *
 * Consumers must use `media()` rather than hard-coding a path, so a missing
 * entry falls back to a real local photo instead of a broken image.
 */

/** Fallback used when an unknown legacy name is requested. */
const FALLBACK_MEDIA = "/assets/optimized/solar-carport-hero-1280.jpg";

export const LEGACY_MEDIA: Readonly<Record<string, string>> = Object.freeze({
  // Brand, hero and social cards
  "hero-main-bCzCTCeaup46mVvtEbpjnr.webp": "/assets/optimized/solar-carport-hero-1280.jpg",
  "photo_2026-03-24_06-45-58_293d121c.jpg": "/assets/optimized/sirinx-logo.jpg",
  "sirinx-og-image-hbNko5JADXArPGo26hmGrN.png": "/assets/optimized/sirinx-og-card-1200x630.jpg",

  // Pricing package illustrations
  "pricing-size-s-LaJSUDczcaLtK7isYYPrbR.webp": "/assets/optimized/solar-carport-hero-640.jpg",
  "pricing-size-m-96bdqV2qHeFRvREkQ3Suqg.webp": "/assets/optimized/solar-carport-hero-960.jpg",
  "pricing-size-l-GYVfyzmEzDPhxpNp3PPD6K.webp": "/assets/optimized/solar-carport-hero-1280.jpg",

  // Page heroes and sector illustrations
  "sirinx-agrivoltaic-b6XSpaadLj5vpaTu52tenb.webp": "/assets/optimized/hero-rooftop-factory-1280.jpg",
  "hero-solutions-AG25WEja6TRJEEzvpx3wZU.webp": "/assets/optimized/solar-carport-hero-1280.jpg",
  "solar-carpark-hero-HkuPbSXRuEJEzybRN8Xb7W.webp": "/assets/optimized/hero-carport-aerial-1280.jpg",
  "solar-carpark-ev-charging-niYjh6gCmDqQNQiCE6oq8M.webp": "/assets/optimized/solar-carport-ev.jpg",
  "solar-ai-dashboard-CDhHz7V3K98CLU6eGvW8PP.webp": "/assets/home-solution/home-solution-rooftop-detail-1280.jpg",
  "solar-om-maintenance-7BKbWXXHKbZ3Adwwdk9XvZ.webp": "/assets/optimized/hero-carport-realistic-1280.jpg",
  "hero-about-3Trik9L6DrdCwCcjCt2KVz.webp": "/assets/optimized/hero-carport-realistic-1280.jpg",
  "hero-investment-fRtcNVseiLRqovGxudgo83.webp": "/assets/optimized/hero-carport-aerial-1280.jpg",
  "farm-solar-bess-VwUa48BekdDzTkGLwkeJJX.webp": "/assets/optimized/hero-bess-realistic-1280.jpg",
  "floating-solar-reservoir-BHro9zmCAKLtycFVXgfe9G.webp": "/assets/optimized/solar-carport-hero-1280.jpg",
  "resort-rooftop-solar-Q4vG7VqDnaYmRWdsyKtp7H.webp": "/assets/optimized/hero-hotel-resort-1280.jpg",
  "warehouse-rooftop-solar-eGvaQedufCt28G4VBAahMs.webp": "/assets/optimized/hero-rooftop-factory-1280.jpg",
  "sirinx-smart-energy-JXCSVMQTKJHxRxSagYajgy.webp": "/assets/optimized/hero-bess-realistic-1280.jpg",

  // Installation gallery — mapped onto the real SIRINX site photos that the
  // repository already carries (Ruenphae Royal Park + Holatel).
  "carport-wide-1_30e3af4c.jpeg": "/assets/projects/ruenphae/20260924/1000076001.jpg",
  "carport-structure-1_c0c17293.jpeg": "/assets/projects/ruenphae/20260924/1000076002.jpg",
  "carport-structure-2_f0ab2f56.jpeg": "/assets/projects/ruenphae/20260924/1000076003.jpg",
  "carport-structure-4_cc6ef3f6.jpeg": "/assets/projects/ruenphae/20260924/1000076004.jpg",
  "carport-underside-1_51e3d09a.jpeg": "/assets/projects/ruenphae/20260924/1000076005.jpg",
  "carport-underside-2_e70e97e1.jpeg": "/assets/projects/ruenphae/20260924/1000075999.jpg",
  "carport-pillar-1_b7680b5f.jpeg": "/assets/projects/holatel/20261004/holatel-20261004-0130.jpg",
  "carport-detail-1_34c7c42f.jpeg": "/assets/projects/holatel/20260924/1000075803.jpg",
  "cable-tray-detail_1ddf9610.jpeg": "/assets/projects/holatel/20260924/1000075878.jpg",
  "install-team-1_91970553.jpeg": "/assets/projects/holatel/20261004/holatel-20261004-0126.jpg",
  "install-team-2_23aa9cdf.jpeg": "/assets/projects/holatel/20261004/holatel-20261004-0127.jpg",
  "bess-cabinet-1_f027743f.jpeg": "/assets/projects/holatel/20261004/holatel-20261004-0128.jpg",
  "bess-cabinet-2_54c824b8.jpeg": "/assets/projects/holatel/20261004/holatel-20261004-0129.jpg",

  // Strategy-page imagery
  "FB_IMG_1775885863875_30475f7b.jpg": "/assets/optimized/hero-carport-realistic-1280.jpg",
  "FB_IMG_1775885869355_b57fba4c.jpg": "/assets/optimized/hero-rooftop-factory-1280.jpg",
  "FB_IMG_1775885874696_f25f52ab.jpg": "/assets/optimized/hero-hotel-resort-1280.jpg",
  "FB_IMG_1775885880725_0a14128b.jpg": "/assets/optimized/hero-bess-realistic-1280.jpg",
  "FB_IMG_1775885884784_d66afe94.jpg": "/assets/optimized/hero-carport-aerial-1280.jpg",
  "FB_IMG_1775885889652_bae78f66.jpg": "/assets/optimized/solar-carport-hero-1280.jpg",
  "FB_IMG_1775885893958_021d4da7.jpg": "/assets/home-solution/home-solution-drone-hero-1280.jpg",
});

/** True when the legacy name has an explicit local replacement. */
export function hasLegacyMedia(legacyName: string): boolean {
  return Object.prototype.hasOwnProperty.call(LEGACY_MEDIA, legacyName);
}

/** Site-relative path for a legacy CloudFront file name. */
export function media(legacyName: string): string {
  return LEGACY_MEDIA[legacyName] ?? FALLBACK_MEDIA;
}

/** Absolute URL for contexts that require one (og:image, JSON-LD). */
export function mediaAbsolute(legacyName: string): string {
  return `https://www.sirinx.co${media(legacyName)}`;
}

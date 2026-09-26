/**
 * Route-level SEO helpers shared by pages and tests.
 *
 * The route JSON-LD itself is owned by the static build (server/ogTags.ts) so a
 * document carries exactly one graph. This module holds the small pieces both
 * surfaces need: the locale mapping, the province lookup, and the FAQ resolver
 * that tests use to prove the marked-up questions match the rendered ones.
 */

import { getProvinceBySlug, type ThaiProvince } from "@shared/thaiProvinces";
import {
  buildSolarCarportFaq,
  type SeoLanguage,
} from "@shared/solarCarportFaq";
import { homeSolutionFaq } from "@shared/homeSolutionFaq";

export const bcp47ByLanguage = {
  th: "th-TH",
  en: "en",
  cn: "zh-CN",
} as const satisfies Record<SeoLanguage, string>;

export const provincesIndexPath = "/provinces";

export function getRouteProvince(path: string): ThaiProvince | null {
  if (!path.startsWith("/solar-carport/")) return null;
  const slug = path.replace("/solar-carport/", "").replace(/\/$/, "");
  return getProvinceBySlug(slug) ?? null;
}

export function isSolarCarportPath(path: string) {
  return path === "/solar-carport" || path.startsWith("/solar-carport/");
}

/** Ordered province list for the province index page, sorted by English name. */
export function getProvincesForIndex(provinces: readonly ThaiProvince[]) {
  return [...provinces].sort((a, b) => a.nameEn.localeCompare(b.nameEn, "en"));
}

/**
 * The questions a route marks up. Compare this against the text the page renders
 * to prove the schema and the visible content agree.
 */
export function buildRouteFaq(options: {
  path: string;
  lang: SeoLanguage;
  province?: ThaiProvince | null;
}) {
  const { path, lang, province = getRouteProvince(path) } = options;
  if (isSolarCarportPath(path)) {
    return buildSolarCarportFaq({ lang, province });
  }
  if (path === "/home-solution" && lang === "th") {
    return homeSolutionFaq.map(item => ({ ...item }));
  }
  return undefined;
}

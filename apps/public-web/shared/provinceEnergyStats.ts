/**
 * Statistics over the sourced PVGIS province data (provinceEnergyData.ts).
 *
 * Pure functions — used by the 3D yield infographic
 * (client/src/components/three/ProvinceYieldChart3D.tsx), long-form content,
 * and tests. Every number here is derived from real PVGIS climate normals;
 * none of it is a savings promise.
 */
import { provinceEnergyData, type ProvinceEnergyFact } from "./provinceEnergyData";

export type YieldRankingEntry = {
  slug: string;
  specificYield: number;
  /** 1 = highest specific yield. */
  rank: number;
};

export type NationalYieldStats = {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  /** Slugs of min/max, for citation. */
  minSlug: string;
  maxSlug: string;
};

export type ProvinceYieldSummary = {
  slug: string;
  specificYield: number;
  irradiationDaily: number;
  rank: number;
  count: number;
  /** Percent difference vs the national mean, e.g. +4.2 = 4.2% above. */
  vsMeanPct: number;
  /** 0–100, share of provinces with lower or equal yield. */
  percentile: number;
  fact: ProvinceEnergyFact;
};

/** All provinces sorted by specific yield, descending, ranks 1..n. */
export function yieldRanking(): YieldRankingEntry[] {
  return Object.entries(provinceEnergyData)
    .map(([slug, fact]) => ({ slug, specificYield: fact.specificYield }))
    .sort((a, b) => b.specificYield - a.specificYield)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function nationalYieldStats(): NationalYieldStats {
  const ranking = yieldRanking();
  const values = ranking.map((r) => r.specificYield);
  const count = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(count / 2);
  return {
    count,
    min: sorted[0],
    max: sorted[count - 1],
    mean: Math.round((sum / count) * 100) / 100,
    median:
      count % 2 === 0
        ? Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 100) / 100
        : sorted[mid],
    minSlug: ranking[count - 1].slug,
    maxSlug: ranking[0].slug,
  };
}

export function provinceYieldSummary(slug: string): ProvinceYieldSummary | null {
  const fact = provinceEnergyData[slug];
  if (!fact) return null;
  const ranking = yieldRanking();
  const stats = nationalYieldStats();
  const entry = ranking.find((r) => r.slug === slug);
  if (!entry) return null;
  const lowerOrEqual = ranking.filter((r) => r.specificYield <= fact.specificYield).length;
  return {
    slug,
    specificYield: fact.specificYield,
    irradiationDaily: fact.irradiationDaily,
    rank: entry.rank,
    count: ranking.length,
    vsMeanPct:
      Math.round(((fact.specificYield - stats.mean) / stats.mean) * 10000) / 100,
    percentile: Math.round((lowerOrEqual / ranking.length) * 10000) / 100,
    fact,
  };
}

/** Top-N and bottom-N for citation blocks in content. */
export function yieldExtremes(n = 3): { top: YieldRankingEntry[]; bottom: YieldRankingEntry[] } {
  const ranking = yieldRanking();
  return {
    top: ranking.slice(0, n),
    bottom: ranking.slice(-n).reverse(),
  };
}

import { describe, expect, it } from "vitest";
import { thaiProvinces } from "@shared/thaiProvinces";
import { provinceEnergyData } from "@shared/provinceEnergyData";
import {
  getProvinceLongformEntry,
  getProvinceLongformSource,
  getProvinceSiblings,
} from "@shared/provinceLongformResolver";
import { buildProvinceLongformHtml } from "@shared/provinceLongformHtml";
import { getStructuredData } from "../server/ogTags";

const slugs = thaiProvinces.map(p => p.slug);

const flatten = (entry: ReturnType<typeof getProvinceLongformEntry>) => {
  if (!entry) return "";
  const parts: string[] = [...entry.intro];
  for (const section of entry.sections) {
    parts.push(section.h2);
    for (const block of section.blocks as Array<Record<string, unknown>>) {
      if (typeof block.text === "string") parts.push(block.text);
      if (Array.isArray(block.items)) parts.push(block.items.join(" "));
    }
  }
  for (const faq of entry.faq) parts.push(faq.q, faq.a);
  parts.push(entry.cta);
  return parts.join(" ");
};

const shingles = (text: string, k = 5) => {
  const words = text.split(/\s+/).filter(Boolean);
  const set = new Set<string>();
  for (let i = 0; i + k <= words.length; i++) set.add(words.slice(i, i + k).join(" "));
  return set;
};
const jaccard = (a: Set<string>, b: Set<string>) => {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 1 : inter / union;
};

describe("province longform coverage", () => {
  it("covers every province in the registry", () => {
    const missing = slugs.filter(slug => !getProvinceLongformEntry(slug));
    expect(missing).toEqual([]);
  });

  it("keeps a hand-written entry ahead of a generated one", () => {
    expect(getProvinceLongformSource("bangkok")).toBe("hand-written");
  });

  it("names its own province in the body", () => {
    for (const province of thaiProvinces) {
      const text = flatten(getProvinceLongformEntry(province.slug));
      expect(text.length, province.slug).toBeGreaterThan(1500);
      expect(text, province.slug).toContain(province.nameTh);
    }
  });

  it("never publishes a figure that is not in the province energy record", () => {
    for (const province of thaiProvinces) {
      const text = flatten(getProvinceLongformEntry(province.slug));
      const fact = provinceEnergyData[province.slug];
      if (!fact) continue;
      // Strip thousands separators so "1,401.4" matches the recorded 1401.4.
      const plain = text.replace(/(\d),(\d{3})/g, "$1$2");
      expect(plain, province.slug).toContain(String(fact.irradiationDaily));
      expect(plain, province.slug).toContain(String(fact.specificYield));
    }
  });

  it("does not claim a tariff, a district count, or a grid operator", () => {
    // None of these are verified, so generated content must not assert them.
    // The check looks for a number attached to a currency or unit, because the
    // generated copy does discuss per-watt pricing as a mistake to avoid.
    for (const province of thaiProvinces) {
      if (getProvinceLongformSource(province.slug) !== "generated") continue;
      const text = flatten(getProvinceLongformEntry(province.slug));
      expect(text, province.slug).not.toMatch(/\d[\d,.]*\s*บาท/);
      expect(text, province.slug).not.toMatch(/\d+\s*อำเภอ/);
      expect(text, province.slug).not.toMatch(/การไฟฟ้านครหลวง|\bPEA\b|\bMEA\b/);
    }
  });

  it("gives every province exactly one h1 that names the province", () => {
    // The prerender shell used to start straight at the intro paragraphs, so
    // all 77 pages shipped with no <h1> at all — the audit found 0/77.
    for (const province of thaiProvinces) {
      const html = buildProvinceLongformHtml(province.slug) ?? "";
      expect((html.match(/<h1[\s>]/g) ?? []).length, province.slug).toBe(1);
      expect(html, province.slug).toContain(
        `font-bold leading-tight text-foreground">Solar Carport ใน${province.nameTh}</h1>`,
      );
    }
  });

  it("links every province to the hub, the trail, and its neighbours", () => {
    // The audit measured one <a> per province page and 0/77 province pages
    // reachable from the homepage by crawling: they were link islands.
    for (const province of thaiProvinces) {
      const html = buildProvinceLongformHtml(province.slug) ?? "";
      expect(html, province.slug).toContain('aria-label="Breadcrumb"');
      expect(html, province.slug).toContain('href="/provinces/"');
      expect(html, province.slug).toContain('href="/solar-carport/"');
      expect(html, province.slug).toContain('href="/contact"');
      const siblings = getProvinceSiblings(province.slug);
      expect(siblings.length, province.slug).toBeGreaterThan(0);
      for (const sibling of siblings) {
        expect(html, province.slug).toContain(
          `href="/solar-carport/${sibling.slug}/"`,
        );
      }
    }
  });

  it("describes every province page as an Article with a real HowTo", () => {
    // The audit found Article and HowTo on 0/77 province pages. Person and
    // LocalBusiness stay absent on purpose: no verified individual author and
    // no verified NAP, so asserting them would mean inventing facts.
    for (const province of thaiProvinces) {
      const data = getStructuredData(
        `/solar-carport/${province.slug}`,
        "https://www.sirinx.co",
        "2026-09-26T00:00:00.000Z",
      ) as { "@graph": Array<Record<string, unknown>> };
      const graph = data["@graph"];
      const article = graph.find((node) => node["@type"] === "Article");
      const howTo = graph.find((node) => node["@type"] === "HowTo");
      expect(article, province.slug).toBeDefined();
      expect(howTo, province.slug).toBeDefined();
      expect(article!.headline, province.slug).toBe(
        `Solar Carport ใน${province.nameTh}`,
      );
      expect(article!.dateModified, province.slug).toBe(
        "2026-09-26T00:00:00.000Z",
      );
      expect(article!.author, province.slug).toEqual({
        "@id": "https://www.sirinx.co/#organization",
      });
      expect(article!.datePublished, province.slug).toBeUndefined();
      const steps = howTo!.step as Array<Record<string, unknown>>;
      expect(steps.length, province.slug).toBeGreaterThanOrEqual(5);
      expect(steps[0].position, province.slug).toBe(1);
      // The install steps must not name a grid operator: PEA/MEA per province
      // is still unverified, and the prose content forbids it too.
      const howToText = JSON.stringify(howTo);
      expect(howToText, province.slug).not.toMatch(/\bPEA\b|\bMEA\b/);
      expect(howToText, province.slug).not.toMatch(/\d+\s*บาท/);
      const wholeGraph = JSON.stringify(graph);
      expect(wholeGraph, province.slug).not.toContain('"@type":"Person"');
      expect(wholeGraph, province.slug).not.toContain('"@type":"LocalBusiness"');
      expect(wholeGraph, province.slug).not.toContain("telephone");
    }
  });

  it("keeps every province URL on the canonical /solar-carport/ pattern", () => {
    // The sirinx-os set publishes www.sirinx.co/solar/<slug>/ with its own
    // canonicals. If that ever gets imported or merged here, the two URL
    // families would fight over the same 77 pages. Guard it.
    for (const province of thaiProvinces) {
      const data = getStructuredData(
        `/solar-carport/${province.slug}`,
        "https://www.sirinx.co",
        "2026-09-26T00:00:00.000Z",
      ) as { "@graph": Array<Record<string, unknown>> };
      const crumbs = data["@graph"].find(
        (node) => node["@type"] === "BreadcrumbList",
      ) as { itemListElement: Array<{ item: string }> };
      const items = crumbs.itemListElement.map((entry) => entry.item);
      expect(items[items.length - 1], province.slug).toBe(
        `https://www.sirinx.co/solar-carport/${province.slug}/`,
      );
      // The hub must sit between the service page and the province.
      expect(items, province.slug).toContain("https://www.sirinx.co/provinces/");
      const serialized = JSON.stringify(data);
      expect(serialized, province.slug).not.toMatch(/sirinx\.co\/solar\//);
    }
  });

  it("keeps the worst cross-province pair below the duplicate threshold", () => {
    const sets = new Map(
      thaiProvinces.map(p => [p.slug, shingles(flatten(getProvinceLongformEntry(p.slug)))])
    );
    let worst = 0;
    let worstPair = "";
    const list = thaiProvinces.map(p => p.slug);
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const score = jaccard(sets.get(list[i])!, sets.get(list[j])!);
        if (score > worst) {
          worst = score;
          worstPair = `${list[i]}~${list[j]}`;
        }
      }
    }
    expect(worst, `worst pair ${worstPair}`).toBeLessThan(0.6);
  });
});

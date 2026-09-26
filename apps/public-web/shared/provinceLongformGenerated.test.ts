/**
 * Quality gate for shared/provinceLongformGenerated.ts and the resolver /
 * prerender / FAQPage paths that publish it.
 *
 * Generated content is a baseline, not the 12,000-word standard: the floors
 * below are regression guards around the measured baseline (mean ~2,265 words),
 * and the gap versus the 3,200 floor / 12,000 target is tracked in
 * docs/seo/SEO_AEO_GEO_MASTERY_PLAN_20260926.md, not hidden here.
 *
 * Verification discipline — these gates are proven able to go red:
 *  - GENERATED_LONGFORM_WORD_FLOOR=99999 turns the word-floor test red
 *  - GENERATED_DUP_CEILING=0.5 turns the anti-duplication test red
 *  - the typo/placeholder gates were red before the generator fixes:
 *    `${name}` x228, "ตู้แฟ" x76, "ต้นข่าย" x152, "ความยาวรอ", "ยึดยง",
 *    and Latin slug leaks ("สูงสุดคือ phuket") in every generated entry.
 */
import { describe, expect, it } from "vitest";
import { countWords, provinceLongform } from "./provinceLongform";
import {
  generatedProvinceLongform,
  generatedProvinceLongformCoverage,
  type GeneratedLongform,
} from "./provinceLongformGenerated";
import {
  getProvinceLongformEntry,
  getProvinceLongformSource,
} from "./provinceLongformResolver";
import { buildProvinceLongformHtml } from "./provinceLongformHtml";
import { thaiProvinces } from "./thaiProvinces";
import { getStructuredData } from "../server/ogTags";

/** Regression guard around the measured generated baseline (min 2,247). */
const WORD_FLOOR = Number(process.env.GENERATED_LONGFORM_WORD_FLOOR ?? 2_200);
/**
 * The hand-written standard is SequenceMatcher-style similarity < 0.80.
 * Generated content is templated and measures ~0.98 Dice even after masking
 * province names and figures — this ceiling only stops it getting worse while
 * the uniqueness roadmap is executed.
 */
const DUP_CEILING = Number(process.env.GENERATED_DUP_CEILING ?? 0.99);

const entries = Object.values(generatedProvinceLongform);

function allText(entry: GeneratedLongform): string {
  const parts: string[] = [...entry.intro, entry.cta];
  for (const section of entry.sections) {
    parts.push(section.h2);
    for (const block of section.blocks) {
      if (block.type === "list") parts.push(...block.items);
      else parts.push(block.text);
    }
  }
  for (const item of entry.faq) parts.push(item.q, item.a);
  return parts.join("\n");
}

function normalizeForComparison(text: string): string {
  let out = text;
  for (const entry of entries) {
    out = out.split(entry.nameTh).join("X");
    out = out.split("จังหวัด").join("X");
  }
  out = out.replace(/[0-9,.\-–%]+/g, "N");
  return out.replace(/\s+/g, " ");
}

function bigramDice(a: string, b: string): number {
  const grams = (t: string) => {
    const set = new Set<string>();
    for (let i = 0; i < t.length - 1; i++) set.add(t.slice(i, i + 2));
    return set;
  };
  const setA = grams(a);
  const setB = grams(b);
  let inter = 0;
  for (const g of setA) if (setB.has(g)) inter++;
  return (2 * inter) / (setA.size + setB.size);
}

describe("provinceLongformGenerated", () => {
  it("covers every province except the hand-written one", () => {
    expect(entries.length).toBe(76);
    expect(generatedProvinceLongformCoverage.withData).toBe(76);
    expect(generatedProvinceLongformCoverage.totalProvinces).toBe(77);
    const covered = new Set([
      ...Object.keys(generatedProvinceLongform),
      ...Object.keys(provinceLongform),
    ]);
    expect(covered.size).toBe(thaiProvinces.length);
    for (const province of thaiProvinces) {
      expect(covered.has(province.slug), `${province.slug} missing`).toBe(true);
    }
  });

  it("every entry clears the regression word floor (GAP vs 3,200 standard is tracked)", () => {
    for (const entry of entries) {
      const words = countWords(allText(entry));
      expect(
        words,
        `${entry.slug} generated long-form is ${words} words, below floor ${WORD_FLOOR}`,
      ).toBeGreaterThanOrEqual(WORD_FLOOR);
    }
  });

  it("every H2 section names its province and the intro names it at least 3 times", () => {
    for (const entry of entries) {
      for (const section of entry.sections) {
        expect(
          section.h2.includes(entry.nameTh),
          `section "${section.h2}" does not name ${entry.nameTh}`,
        ).toBe(true);
      }
      const mentions = entry.intro.join(" ").split(entry.nameTh).length - 1;
      expect(mentions, `intro of ${entry.slug} names the province ${mentions}x`)
        .toBeGreaterThanOrEqual(3);
    }
  });

  it("carries the PVGIS climate-normals disclaimer", () => {
    for (const entry of entries) {
      const text = allText(entry);
      expect(text, entry.slug).toContain("PVGIS");
      expect(
        text.includes("ไม่ใช่คำสัญญา") || text.includes("ไม่ใช่การรับประกัน"),
        entry.slug,
      ).toBe(true);
    }
  });

  it("has no template leaks, invented payback figures, or typos", () => {
    const forbidden: Array<[string, RegExp]> = [
      ["template placeholder leak", /\$\{/],
      ["invented payback figure", /คืนทุน[^ก]{0,12}\d+\s*ปี/],
      ["placeholder phone", /\+66-?\d/],
      ["placeholder marker", /XXX|TBD|Lorem|placeholder/i],
      ["typo ตู้แฟ (should be ตู้ไฟ)", /ตู้แฟ/],
      ["typo ต้นข่าย (should be สายส่ง)", /ต้นข่าย/],
      ["typo ความยาวรอ (should be ระยะเวลารอ)", /ความยาวรอ/],
      ["typo ยึดยง (should be ยึดโยง)", /ยึดยง/],
      ["typo กำล่ง (should be กำลัง)", /กำล่ง/],
    ];
    for (const entry of entries) {
      const text = allText(entry);
      for (const [label, pattern] of forbidden) {
        expect(pattern.test(text), `${entry.slug}: ${label}`).toBe(false);
      }
    }
  });

  it("never leaks Latin province slugs into Thai prose", () => {
    for (const entry of entries) {
      const text = allText(entry).toLowerCase();
      for (const province of thaiProvinces) {
        expect(
          text.includes(province.slug),
          `${entry.slug}: prose contains slug "${province.slug}"`,
        ).toBe(false);
      }
    }
  });

  it("answers 5 FAQ questions in visible h3 blocks with substantive answers", () => {
    for (const entry of entries) {
      expect(entry.faq.length, entry.slug).toBeGreaterThanOrEqual(5);
      const h3Texts = entry.sections.flatMap((section) =>
        section.blocks.filter((b) => b.type === "h3").map((b) => b.text),
      );
      for (const item of entry.faq) {
        expect(h3Texts, `${entry.slug}: FAQ question not visible`).toContain(item.q);
        expect(countWords(item.a), `${entry.slug}: answer too thin`).toBeGreaterThanOrEqual(15);
        // The question carries the province name; the pair must too.
        expect(
          item.q.includes(entry.nameTh) || item.a.includes(entry.nameTh),
          entry.slug,
        ).toBe(true);
      }
    }
  });

  it("has a substantive local CTA naming the province", () => {
    for (const entry of entries) {
      expect(countWords(entry.cta), entry.slug).toBeGreaterThanOrEqual(25);
      expect(entry.cta, entry.slug).toContain(entry.nameTh);
    }
  });

  it("keeps cross-province templated similarity under the regression ceiling", () => {
    const normalized = entries.map((entry) =>
      normalizeForComparison(allText(entry)).slice(0, 6_000),
    );
    const sampled: number[] = [];
    for (let i = 0; i < entries.length; i += 7) {
      for (let j = i + 1; j < entries.length; j += 11) {
        sampled.push(bigramDice(normalized[i], normalized[j]));
      }
    }
    expect(sampled.length).toBeGreaterThan(20);
    for (const score of sampled) {
      expect(
        score,
        `pairwise similarity ${score.toFixed(3)} exceeds ceiling ${DUP_CEILING}`,
      ).toBeLessThanOrEqual(DUP_CEILING);
    }
  });
});

describe("provinceLongformResolver", () => {
  it("prefers the hand-written entry and falls back to generated content", () => {
    expect(getProvinceLongformEntry("bangkok")).toBe(provinceLongform.bangkok);
    expect(getProvinceLongformSource("bangkok")).toBe("hand-written");
    const generated = getProvinceLongformEntry("amnat-charoen");
    expect(generated?.nameTh).toBe("อำนาจเจริญ");
    expect(getProvinceLongformSource("amnat-charoen")).toBe("generated");
    expect(getProvinceLongformEntry("nonexistent-province")).toBeNull();
    expect(getProvinceLongformSource("nonexistent-province")).toBe("none");
  });
});

describe("province long-form prerender (generated path)", () => {
  it("renders a generated province into static HTML with its visible FAQ", () => {
    const html = buildProvinceLongformHtml("/solar-carport/phuket/");
    expect(html).toBeTruthy();
    expect(html!).toContain('data-sirinx-static-shell="province-longform"');
    expect(html!).toContain("ภูเก็ต");
    expect(html!).toContain("PVGIS");
    // The FAQ answers must reach the static HTML, not just the JSON-LD.
    expect(html!).toContain("คืนทุนกี่ปี");
    expect(html!).toContain("ไม่มีใครให้ตัวเลขที่ซื่อสัตย์");
    expect(html!.length).toBeGreaterThan(12_000);
    expect(html!).not.toMatch(/<script/i);
  });

  it("still returns null for routes without long-form content", () => {
    expect(buildProvinceLongformHtml("nonexistent-province")).toBeNull();
    expect(buildProvinceLongformHtml("/solar-carport/nonexistent/")).toBeNull();
  });
});

describe("province FAQPage schema merge (one FAQPage per document)", () => {
  it("appends long-form questions to the single FAQPage node for province routes", () => {
    const data = getStructuredData(
      "/solar-carport/amnat-charoen",
      "https://www.sirinx.co",
    ) as { "@graph": Array<Record<string, unknown>> };
    const faqNodes = data["@graph"].filter((node) => node["@type"] === "FAQPage");
    expect(faqNodes).toHaveLength(1);
    const mainEntity = faqNodes[0].mainEntity as Array<{
      name: string;
      acceptedAnswer: { text: string };
    }>;
    const names = mainEntity.map((q) => q.name);
    expect(names).toContain("ติดตั้งโซลาร์เซลล์จังหวัดอำนาจเจริญคุ้มไหม");
    expect(names.length).toBeGreaterThanOrEqual(10);
    const merged = names.find((n) => n.includes("อำนาจเจริญคุ้มไหม"));
    expect(merged).toBeTruthy();
  });
});

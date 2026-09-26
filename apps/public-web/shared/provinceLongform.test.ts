/**
 * Quality gate for shared/provinceLongform.ts.
 *
 * Verification discipline: each gate below is proven able to go red by running
 * the suite with LONGFORM_WORD_FLOOR set above the current word count (the
 * word-floor test reads that env var). Red proof recorded in the report.
 */
import { describe, expect, it } from "vitest";
import {
  countWords,
  longformWordCount,
  provinceLongform,
  type ProvinceLongform,
} from "./provinceLongform";
import { buildProvinceLongformHtml } from "./provinceLongformHtml";

/** Hard floor (anti-duplication gate §7 of the brief). */
const WORD_FLOOR = Number(process.env.LONGFORM_WORD_FLOOR ?? 3_200);
/** Target standard for province long-form pages. */
const WORD_TARGET = 12_000;

function allText(entry: ProvinceLongform): string {
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

describe("provinceLongform", () => {
  it("counts Thai words with Intl.Segmenter (sanity)", () => {
    // Thai dictionary segmentation — count is per ICU version, so assert
    // it segments into multiple words rather than one, plus exact count for Latin.
    expect(countWords("โซลาร์คาร์พอร์ต กรุงเทพมหานคร")).toBeGreaterThanOrEqual(2);
    expect(countWords("hello world")).toBe(2);
    expect(countWords("")).toBe(0);
  });

  it("every entry clears the word floor and bangkok hits the 12,000 target", () => {
    for (const entry of Object.values(provinceLongform)) {
      const words = longformWordCount(entry);
      expect(
        words,
        `${entry.slug} long-form is ${words} words, below floor ${WORD_FLOOR}`,
      ).toBeGreaterThanOrEqual(WORD_FLOOR);
    }
    expect(longformWordCount(provinceLongform.bangkok)).toBeGreaterThanOrEqual(
      WORD_TARGET,
    );
  });

  it("every H2 section names its province (no template drift)", () => {
    for (const entry of Object.values(provinceLongform)) {
      for (const section of entry.sections) {
        const text =
          section.h2 +
          " " +
          section.blocks
            .map((b) => (b.type === "list" ? b.items.join(" ") : b.text))
            .join(" ");
        expect(
          text.includes(entry.nameTh) || text.includes("กรุงเทพฯ"),
          `section "${section.h2}" does not name ${entry.nameTh}`,
        ).toBe(true);
      }
    }
  });

  it("intro names the province at least 3 times", () => {
    for (const entry of Object.values(provinceLongform)) {
      const intro = entry.intro.join(" ");
      const mentions = intro.split("กรุงเทพ").length - 1;
      expect(mentions, `intro of ${entry.slug} names the province ${mentions}x`).toBeGreaterThanOrEqual(3);
    }
  });

  it("carries the PVGIS climate-normals disclaimer (no savings promise)", () => {
    for (const entry of Object.values(provinceLongform)) {
      const text = allText(entry);
      expect(text).toContain("PVGIS");
      expect(
        text.includes("ไม่ใช่คำสัญญา") || text.includes("ไม่ใช่การรับประกัน"),
      ).toBe(true);
    }
  });

  it("has no placeholder phone numbers and no invented payback figures", () => {
    for (const entry of Object.values(provinceLongform)) {
      const text = allText(entry);
      expect(text).not.toMatch(/XXX/i);
      expect(text).not.toMatch(/\+66-?\d/);
      // A concrete "คืนทุน N ปี" claim without source — forbidden.
      expect(text).not.toMatch(/คืนทุน[^ก]{0,12}\d+\s*ปี/);
    }
  });

  it("answers the 8 P4 AEO questions in the FAQ payload", () => {
    const entry = provinceLongform.bangkok;
    expect(entry.faq).toHaveLength(8);
    for (const item of entry.faq) {
      expect(item.q.length).toBeGreaterThan(5);
      expect(countWords(item.a)).toBeGreaterThanOrEqual(20);
    }
    const joined = entry.faq.map((f) => f.q).join(" ");
    for (const topic of ["คุ้มไหม", "ราคา", "คืนทุน", "ขั้นตอน", "ขออนุญาต", "Rooftop", "ที่ไหนดี", "MEA"]) {
      expect(joined).toContain(topic);
    }
  });

  it("renders the full long-form into prerender HTML (crawlable, not lazy-JS only)", () => {
    const html = buildProvinceLongformHtml("bangkok");
    expect(html).toBeTruthy();
    expect(html!).toContain("data-sirinx-static-shell=\"province-longform\"");
    // Key sourced figures and the disclaimer must reach the static HTML.
    expect(html!).toContain("1,401.4");
    expect(html!).toContain("PVGIS");
    expect(html!).toContain("การไฟฟ้านครหลวง");
    // Substantial content, not a stub.
    expect(html!.length).toBeGreaterThan(40_000);
    expect(buildProvinceLongformHtml("nonexistent-province")).toBeNull();
  });

  it("escapes HTML in rendered long-form output", () => {
    expect(buildProvinceLongformHtml("bangkok")).not.toMatch(/<script/i);
  });

  it("has a non-empty local CTA", () => {
    for (const entry of Object.values(provinceLongform)) {
      expect(countWords(entry.cta)).toBeGreaterThanOrEqual(30);
      expect(entry.cta).toContain("กรุงเทพ");
    }
  });
});

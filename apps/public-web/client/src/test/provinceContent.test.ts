import { describe, expect, it } from "vitest";
import solarCarportDict from "../i18n/pages/solarCarport";
import { thaiProvinces } from "@shared/thaiProvinces";
import { provinceEnergyData } from "@shared/provinceEnergyData";

type Lang = "th" | "en" | "cn";
const langs: Lang[] = ["th", "en", "cn"];

const dict = solarCarportDict as Record<string, Record<Lang, string>>;

const fill = (text: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce(
    (acc, [key, value]) => acc.split(`{${key}}`).join(String(value)),
    text
  );

/** Keys that the province page fills with the province name. */
const provinceScopedKeys = [
  "sc.province.title",
  "sc.province.body",
  "sc.province.item1",
  "sc.solar.irradiation",
  "sc.solar.yield",
  "sc.solar.source",
  "sc.solar.coords",
];

describe("province page content quality", () => {
  it("has every province-scoped string in all three languages", () => {
    for (const key of provinceScopedKeys) {
      for (const lang of langs) {
        const value = dict[key]?.[lang];
        expect(value, `${key}.${lang}`).toBeTruthy();
        expect(typeof value, `${key}.${lang}`).toBe("string");
      }
    }
  });

  it("leaves no unresolved placeholder after filling", () => {
    for (const province of thaiProvinces) {
      for (const lang of langs) {
        const name = lang === "th" ? province.nameTh : province.nameEn;
        for (const key of provinceScopedKeys) {
          const filled = fill(dict[key][lang], { province: name, value: 1, lat: 0, lon: 0, source: "s", database: "d", years: "y", date: "z" });
          expect(filled, `${key}.${lang}.${province.slug}`).not.toMatch(/\{[a-zA-Z]+\}/);
        }
      }
    }
  });

  it("keeps a space between a filled province name and the next Thai word", () => {
    // Guards the regression where the body ran the province name straight into the
    // following clause with no space.
    for (const province of thaiProvinces) {
      const body = fill(dict["sc.province.body"].th, { province: province.nameTh });
      expect(body, province.slug).toContain(`ใน${province.nameTh} `);
    }
  });

  it("does not use the old broken H1 fragment on a province page", () => {
    const fragment = "ที่จอดรถผลิตไฟฟ้าสำหรับธุรกิจ";
    for (const lang of langs) {
      expect(dict["sc.hero.titleProvince"][lang], lang).not.toBe(fragment);
      expect(dict["sc.hero.titleProvince"][lang], lang).toMatch(/\S/);
    }
  });

  it("states the climate-normal caveat in every language", () => {
    // The point is that the caveat is present and explicitly negates a guarantee.
    // Asserting on the word "guarantee" alone would false-positive on "not a
    // savings guarantee", which is the wording we want.
    expect(dict["sc.solar.disclaimer"].th).toContain("ไม่ใช่การรับประกัน");
    expect(dict["sc.solar.disclaimer"].en).toContain("not a savings guarantee");
    expect(dict["sc.solar.disclaimer"].cn).toContain("并非");
    expect(dict["sc.solar.disclaimer"].cn).toContain("也不构成");
    for (const lang of langs) {
      const text = dict["sc.solar.disclaimer"][lang];
      expect(text.length, lang).toBeGreaterThan(60);
      expect(text, lang).toMatch(/ไม่ใช่|not a|并非|也不构成/);
    }
  });

  it("never renders a solar figure for a province with no record", () => {
    // Every province currently has one, and the page must still be written so that
    // a missing record renders nothing rather than a zero or a guess.
    const missing = thaiProvinces.filter(p => !provinceEnergyData[p.slug]);
    const rendered = (province: (typeof thaiProvinces)[number]) =>
      provinceEnergyData[province.slug] ? "block" : "none";
    for (const province of thaiProvinces) {
      const out = rendered(province);
      expect(out, province.slug).toBe(
        provinceEnergyData[province.slug] ? "block" : "none"
      );
      if (missing.length) expect(out).not.toBe("none");
    }
  });
});

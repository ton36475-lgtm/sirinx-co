import { describe, expect, it } from "vitest";
import solarCarportDict from "../i18n/pages/solarCarport";
import { buildRouteFaq, getRouteProvince, provincesIndexPath } from "../lib/routeSeoContent";
import { thaiProvinces } from "@shared/thaiProvinces";
import { solarCarportFaq, solarCarportProvinceFaq, provincePlaceholder } from "@shared/solarCarportFaq";

/** Renders the FAQ exactly the way client/src/pages/SolarCarport.tsx does. */
function renderVisibleFaq(lang: "th" | "en" | "cn", provinceName?: string) {
  const t = (key: string) => {
    const entry = solarCarportDict[key];
    if (!entry) return key;
    return entry[lang] || entry.th || key;
  };
  const fill = (text: string) =>
    text.split(provincePlaceholder).join(provinceName ?? "");

  const items = solarCarportFaq.map((item, index) => ({
    id: item.id,
    q: t(`sc.faq${index + 1}.q`),
    a: t(`sc.faq${index + 1}.a`),
  }));
  if (provinceName) {
    solarCarportProvinceFaq.forEach((item, index) => {
      items.push({
        id: item.id,
        q: fill(t(`sc.faqProvince${index + 1}.q`)),
        a: fill(t(`sc.faqProvince${index + 1}.a`)),
      });
    });
  }
  return items;
}

describe("province route SEO content", () => {
  it("marks up the same questions the page renders, in every language", () => {
    for (const lang of ["th", "en", "cn"] as const) {
      for (const province of [null, ...thaiProvinces]) {
        const path = province
          ? `/solar-carport/${province.slug}`
          : "/solar-carport";
        const marked = buildRouteFaq({ path, lang });
        const visible = renderVisibleFaq(
          lang,
          province ? (lang === "th" ? province.nameTh : province.nameEn) : undefined
        );

        expect(marked).toBeDefined();
        expect(marked!.length).toBe(visible.length);
        for (const [index, item] of visible.entries()) {
          expect(marked![index].question).toBe(item.q);
          expect(marked![index].answer).toBe(item.a);
        }
      }
    }
  });

  it("adds province-aware questions only on a province route", () => {
    const generic = buildRouteFaq({ path: "/solar-carport", lang: "th" })!;
    const phitsanulok = buildRouteFaq({
      path: "/solar-carport/phitsanulok",
      lang: "th",
    })!;

    expect(phitsanulok.length).toBe(generic.length + solarCarportProvinceFaq.length);
    expect(
      phitsanulok.some(item => item.question.includes("พิษณุโลก"))
    ).toBe(true);
    expect(
      phitsanulok.some(item => item.question.includes("{province}"))
    ).toBe(false);
  });

  it("does not invent a province for an unknown slug", () => {
    expect(getRouteProvince("/solar-carport/ayutthaya")).toBeNull();
    expect(
      buildRouteFaq({ path: "/solar-carport/ayutthaya", lang: "th" })!.length
    ).toBe(solarCarportFaq.length);
  });

  it("keeps the province index link on one shared path", () => {
    expect(provincesIndexPath).toBe("/provinces");
  });
});

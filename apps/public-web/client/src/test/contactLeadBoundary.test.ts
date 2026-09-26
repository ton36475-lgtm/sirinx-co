import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const contactPage = readFileSync(new URL("../pages/Contact.tsx", import.meta.url), "utf8");
const assessmentPage = readFileSync(
  new URL("../pages/SolarAssessment.tsx", import.meta.url),
  "utf8"
);
const assessmentCopy = readFileSync(
  new URL("../i18n/pages/solarAssessment.ts", import.meta.url),
  "utf8"
);
const linePage = readFileSync(new URL("../pages/Line.tsx", import.meta.url), "utf8");
const lineConfig = readFileSync(
  new URL("../../../shared/lineOfficial.ts", import.meta.url),
  "utf8"
);

describe("public conversion boundary", () => {
  it("uses the shared LINE Official destination from Contact and LINE surfaces", () => {
    expect(contactPage).toContain('import { lineOfficialConfig } from "@shared/lineOfficial"');
    expect(contactPage).toContain("lineOfficialConfig.addFriendUrl");
    expect(contactPage).not.toContain("https://lin.ee/sirinx");
    expect(linePage).toContain("lineOfficialConfig.addFriendUrl");
    expect(linePage).toContain("lineOfficialConfig.chatUrl");
    expect(lineConfig).toContain("https://line.me/R/oaMessage/%40304zrttj");
  });

  it("keeps Assessment as a preliminary-to-Contact handoff", () => {
    expect(assessmentPage).toContain('href={`/contact?system=');
    expect(assessmentPage).toContain("ผลคำนวณเป็นการประมาณการเบื้องต้น");
    expect(assessmentCopy).toContain("ไม่ใช่ใบเสนอราคา");
    expect(assessmentCopy).toContain("ไม่ถือเป็นข้อเสนอทางการค้า");
    expect(assessmentPage).not.toMatch(/fetch\([^)]*webhook/i);
  });

  it("does not add a public LINE webhook or message-send endpoint", () => {
    const source = [contactPage, assessmentPage, linePage, lineConfig].join("\n");
    expect(source).not.toMatch(/\/webhook/i);
    expect(source).not.toMatch(/send\s*message/i);
  });
});

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const appPath = join(root, "client/src/App.tsx");
const floatingChatWidgetPath = join(
  root,
  "client/src/components/FloatingChatWidget.tsx"
);
const layoutPath = join(root, "client/src/components/Layout.tsx");
const lineConfigPath = join(root, "shared/lineOfficial.ts");
const linePagePath = join(root, "client/src/pages/Line.tsx");

describe("footer LINE Official QR CTA", () => {
  it("exposes a dedicated /line landing page with the shared LINE config", () => {
    const appSource = readFileSync(appPath, "utf8");
    const linePageSource = readFileSync(linePagePath, "utf8");

    expect(appSource).toContain('const Line = lazy(() => import("./pages/Line"))');
    expect(appSource).toContain('<Route path="/line" component={Line} />');
    expect(linePageSource).toContain("lineOfficialConfig.shortLink");
    expect(linePageSource).toContain("lineOfficialConfig.addFriendUrl");
    expect(linePageSource).toContain("lineOfficialConfig.chatUrl");
    expect(linePageSource).toContain("lineOfficialConfig.basicId");
  });

  it("keeps canonical LINE Official data in a local shared config", () => {
    expect(existsSync(lineConfigPath)).toBe(true);

    const source = existsSync(lineConfigPath)
      ? readFileSync(lineConfigPath, "utf8")
      : "";

    expect(source).toContain("https://lin.ee/S97R6nj");
    expect(source).toContain("@304zrttj");
    expect(source).toContain(
      "https://qr-official.line.me/gs/M_304zrttj_GW.png?oat_content=qr"
    );
    expect(source).toContain("https://line.me/R/ti/p/%40304zrttj");
    expect(source).toContain("https://line.me/R/oaMessage/%40304zrttj");
  });

  it("renders a footer/contact LINE QR CTA without replacing page structure", () => {
    const source = readFileSync(layoutPath, "utf8");

    expect(source).toContain("footer-line-qr");
    expect(source).toContain("LINE Official");
    expect(source).toContain("ส่งข้อมูลโครงการผ่าน LINE");
    expect(source).toContain("ส่งบิลค่าไฟ รูปพื้นที่ หรือคำถามโครงการผ่าน LINE Official");
    expect(source).toContain("เพิ่มเพื่อน LINE");
    expect(source).toContain("แชท LINE");
    expect(source).toContain("lineOfficialConfig.qrImageUrl");
    expect(source).toContain("lineOfficialConfig.shortLink");
    expect(source).toContain("lineOfficialConfig.chatUrl");
  });

  it("renders a floating LINE CTA beside the initial AI bot trigger", () => {
    const source = readFileSync(appPath, "utf8");

    expect(source).toContain("sirinx-floating-contact-dock");
    expect(source).toContain("floating-line-cta");
    expect(source).toContain("lineOfficialConfig.addFriendUrl");
    expect(source).toContain("LINE Official");
    expect(source).toContain("เปิดแชท SIRINX Solar Assistant");
  });

  it("keeps the loaded chatbot trigger grouped with the floating LINE CTA", () => {
    const source = readFileSync(floatingChatWidgetPath, "utf8");

    expect(source).toContain("sirinx-floating-contact-dock");
    expect(source).toContain("floating-line-cta");
    expect(source).toContain("lineOfficialConfig.addFriendUrl");
    expect(source).toContain("line_click");
    expect(source).toContain("เปิดแชท SIRINX Solar Assistant");
  });

  it("does not introduce webhook, message-send, or customer-storage endpoints", () => {
    const sources = [
      readFileSync(appPath, "utf8"),
      readFileSync(floatingChatWidgetPath, "utf8"),
      readFileSync(layoutPath, "utf8"),
      existsSync(lineConfigPath) ? readFileSync(lineConfigPath, "utf8") : "",
    ].join("\n");

    expect(sources).not.toMatch(/\/webhook/i);
    expect(sources).not.toMatch(/\/messages/i);
    expect(sources).not.toMatch(/send\s*email/i);
    expect(sources).not.toMatch(/crm/i);
  });
});

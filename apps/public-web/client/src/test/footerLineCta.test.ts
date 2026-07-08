import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const appPath = join(root, "client/src/App.tsx");
const floatingChatWidgetPath = join(
  root,
  "client/src/components/FloatingChatWidget.tsx"
);
const clientIndexPath = join(root, "client/index.html");
const layoutPath = join(root, "client/src/components/Layout.tsx");
const languageContextPath = join(root, "client/src/contexts/LanguageContext.tsx");
const lineConfigPath = join(root, "shared/lineOfficial.ts");
const contactPath = join(root, "client/src/pages/Contact.tsx");
const linePagePath = join(root, "client/src/pages/Line.tsx");

describe("footer LINE Official QR CTA", () => {
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
    const languageSource = readFileSync(languageContextPath, "utf8");

    expect(source).toContain("footer-line-qr");
    expect(source).toContain('t("footer.lineTitle")');
    expect(source).toContain('t("footer.lineDesc")');
    expect(source).toContain('t("footer.lineAdd")');
    expect(source).toContain('t("footer.lineChat")');
    expect(source).toContain('t("footer.linePage")');
    expect(source).toContain('t("footer.lineQrCaption")');
    expect(source).toContain("lineOfficialConfig.qrImageUrl");
    expect(source).toContain("lineOfficialConfig.shortLink");
    expect(source).toContain("lineOfficialConfig.chatUrl");

    expect(source).not.toContain("ส่งข้อมูลโครงการผ่าน LINE");
    expect(source).not.toContain("ส่งบิลค่าไฟ รูปพื้นที่ หรือคำถามโครงการผ่าน LINE Official");
    expect(source).not.toContain("เพิ่มเพื่อน LINE");
    expect(source).not.toContain("แชท LINE");
    expect(source).not.toContain("สแกน QR เพื่อเพิ่มเพื่อน LINE Official");

    expect(languageSource).toContain("Send project details via LINE");
    expect(languageSource).toContain("通过 LINE 发送项目资料");
    expect(languageSource).toContain("Scan the QR code to add LINE Official");
    expect(languageSource).toContain("扫描二维码添加 LINE 官方账号");
  });

  it("registers a dedicated /line landing page using canonical LINE config", () => {
    const appSource = readFileSync(appPath, "utf8");
    const linePageSource = readFileSync(linePagePath, "utf8");
    const contactSource = readFileSync(contactPath, "utf8");

    expect(appSource).toContain('const Line = lazy(() => import("./pages/Line"))');
    expect(appSource).toContain('<Route path="/line" component={Line} />');
    expect(linePageSource).toContain("lineOfficialConfig.qrImageUrl");
    expect(linePageSource).toContain("lineOfficialConfig.shortLink");
    expect(linePageSource).toContain("lineOfficialConfig.chatUrl");
    expect(linePageSource).toContain("lineOfficialConfig.basicId");
    expect(contactSource).toContain("lineOfficialConfig.shortLink");
    expect(contactSource).not.toContain("https://lin.ee/sirinx");
  });

  it("renders a floating LINE CTA beside the initial AI bot trigger", () => {
    const source = readFileSync(appPath, "utf8");

    expect(source).toContain("sirinx-floating-contact-dock");
    expect(source).toContain("floating-line-cta");
    expect(source).toContain("const FloatingChatWidget = lazy(");
    expect(source).toContain("const [shouldLoad, setShouldLoad] = useState(false)");
    expect(source).toContain("onClick={() => setShouldLoad(true)}");
    expect(source).toContain("<FloatingChatWidget initialOpen />");
    expect(source).toContain("lineOfficialConfig.addFriendUrl");
    expect(source).toContain('t("floating.lineAria")');
    expect(source).toContain('t("floating.botAria")');
    expect(source).not.toContain("เปิด LINE Official ของ SIRINX");
    expect(source).not.toContain("เปิดแชท SIRINX Solar Assistant");
  });

  it("keeps the desktop language switcher clickable and keyboard accessible", () => {
    const source = readFileSync(layoutPath, "utf8");

    expect(source).toContain("onClick={() => setLangMenuOpen(open => !open)}");
    expect(source).toContain('aria-haspopup="menu"');
    expect(source).toContain("aria-expanded={langMenuOpen}");
    expect(source).toContain('role="menu"');
    expect(source).toContain('role="menuitemradio"');
    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain("event.currentTarget.contains(event.relatedTarget)");
    expect(source).not.toContain("onMouseLeave={() => setLangMenuOpen(false)}");
  });

  it("keeps the loaded chatbot trigger grouped with the floating LINE CTA", () => {
    const source = readFileSync(floatingChatWidgetPath, "utf8");
    const languageSource = readFileSync(languageContextPath, "utf8");

    expect(source).toContain("sirinx-floating-contact-dock");
    expect(source).toContain("floating-line-cta");
    expect(source).toContain("lineOfficialConfig.addFriendUrl");
    expect(source).toContain("line_click");
    expect(source).toContain('t("floating.botAria")');
    expect(source).toContain('t("chat.welcomeTitle")');
    expect(source).toContain('t("chat.aiDisclaimer")');
    [
      "ปิดข้อความแนะนำ",
      "สนใจโซลาร์เซลล์ไหมครับ?",
      "พิมพ์ถามได้เลย หรือแอดไลน์คุยกัน",
      "ออนไลน์ พร้อมให้บริการ",
      "สวัสดีครับ! ยินดีให้บริการ",
      "แอดไลน์ @sirinx",
      "ข้อมูลประเมิน",
      "ต่อสายผ่าน LINE",
      "พิมพ์ข้อความถึง SIRINX Assistant",
      "พิมพ์ข้อความ...",
      "AI อาจตอบไม่ถูกต้อง 100%",
    ].forEach(text => {
      expect(source).not.toContain(text);
    });

    expect(languageSource).toContain("Online and ready to help");
    expect(languageSource).toContain("在线，可随时协助");
    expect(languageSource).toContain("AI responses may need confirmation");
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

  it("keeps the HTML entry compatible with the deployed CSP", () => {
    const source = readFileSync(clientIndexPath, "utf8");

    expect(source).not.toMatch(/\son[a-z]+=/i);
    expect(source).not.toContain("javascript:");
    expect(source).toContain('rel="stylesheet"');
  });
});

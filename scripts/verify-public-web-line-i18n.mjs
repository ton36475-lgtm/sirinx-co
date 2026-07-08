#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const DEFAULT_TARGET = "apps/public-web";

const REQUIRED_FILES = {
  app: "client/src/App.tsx",
  floatingChatWidget: "client/src/components/FloatingChatWidget.tsx",
  layout: "client/src/components/Layout.tsx",
  languageContext: "client/src/contexts/LanguageContext.tsx",
  lineConfig: "shared/lineOfficial.ts",
};

const REQUIRED_LINE_CONFIG_STRINGS = [
  "https://lin.ee/S97R6nj",
  "@304zrttj",
  "https://qr-official.line.me/gs/M_304zrttj_GW.png?oat_content=qr",
  "https://line.me/R/ti/p/%40304zrttj",
  "https://line.me/R/oaMessage/%40304zrttj",
];

const REQUIRED_APP_STRINGS = [
  "sirinx-floating-contact-dock",
  "floating-line-cta",
  "lineOfficialConfig.addFriendUrl",
  't("floating.lineAria")',
  't("floating.botAria")',
];

const FORBIDDEN_APP_STRINGS = [
  "เปิด LINE Official ของ SIRINX",
  "เปิดแชท SIRINX Solar Assistant",
];

const REQUIRED_LAYOUT_STRINGS = [
  "footer-line-qr",
  't("footer.lineTitle")',
  't("footer.lineDesc")',
  't("footer.lineAdd")',
  't("footer.lineChat")',
  't("footer.lineQrCaption")',
  "lineOfficialConfig.qrImageUrl",
  "lineOfficialConfig.shortLink",
  "lineOfficialConfig.chatUrl",
];

const FORBIDDEN_LAYOUT_STRINGS = [
  "ส่งข้อมูลโครงการผ่าน LINE",
  "ส่งบิลค่าไฟ รูปพื้นที่ หรือคำถามโครงการผ่าน LINE Official",
  "เพิ่มเพื่อน LINE",
  "แชท LINE",
  "สแกน QR เพื่อเพิ่มเพื่อน LINE Official",
];

const REQUIRED_FLOATING_WIDGET_STRINGS = [
  "sirinx-floating-contact-dock",
  "floating-line-cta",
  "lineOfficialConfig.addFriendUrl",
  "line_click",
  't("floating.botAria")',
  't("chat.welcomeTitle")',
  't("chat.aiDisclaimer")',
];

const FORBIDDEN_FLOATING_WIDGET_STRINGS = [
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
];

const REQUIRED_TRANSLATION_STRINGS = [
  "Send project details via LINE",
  "通过 LINE 发送项目资料",
  "Scan the QR code to add LINE Official",
  "扫描二维码添加 LINE 官方账号",
  "Open SIRINX Solar Assistant chat",
  "打开 SIRINX Solar Assistant 聊天",
  "Online and ready to help",
  "在线，可随时协助",
  "AI responses may need confirmation from the SIRINX team.",
];

const FORBIDDEN_SECURITY_PATTERNS = [
  /\/webhook/i,
  /\/messages/i,
  /send\s*email/i,
  /crm/i,
];

function parseArgs(argv) {
  const args = { target: process.env.SIRINX_PUBLIC_WEB_TARGET || DEFAULT_TARGET };
  for (const item of argv) {
    if (item.startsWith("--target=")) args.target = item.slice("--target=".length);
    else throw new Error(`Unknown argument: ${item}`);
  }
  return args;
}

function readRequiredFile(root, relativePath, failures) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) {
    failures.push(`missing file: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(filePath, "utf8");
}

function requireStrings(label, source, checks, failures) {
  for (const check of checks) {
    if (!source.includes(check)) {
      failures.push(`${label} missing: ${check}`);
    }
  }
}

function forbidStrings(label, source, checks, failures) {
  for (const check of checks) {
    if (source.includes(check)) {
      failures.push(`${label} still hardcodes: ${check}`);
    }
  }
}

function forbidPatterns(label, source, patterns, failures) {
  for (const pattern of patterns) {
    if (pattern.test(source)) {
      failures.push(`${label} matched forbidden pattern: ${pattern}`);
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(process.cwd(), args.target);
  const failures = [];

  const sources = Object.fromEntries(
    Object.entries(REQUIRED_FILES).map(([key, relativePath]) => [
      key,
      readRequiredFile(root, relativePath, failures),
    ])
  );

  requireStrings("line config", sources.lineConfig, REQUIRED_LINE_CONFIG_STRINGS, failures);
  requireStrings("app dock", sources.app, REQUIRED_APP_STRINGS, failures);
  forbidStrings("app dock", sources.app, FORBIDDEN_APP_STRINGS, failures);
  requireStrings("footer layout", sources.layout, REQUIRED_LAYOUT_STRINGS, failures);
  forbidStrings("footer layout", sources.layout, FORBIDDEN_LAYOUT_STRINGS, failures);
  requireStrings(
    "floating chat widget",
    sources.floatingChatWidget,
    REQUIRED_FLOATING_WIDGET_STRINGS,
    failures
  );
  forbidStrings(
    "floating chat widget",
    sources.floatingChatWidget,
    FORBIDDEN_FLOATING_WIDGET_STRINGS,
    failures
  );
  requireStrings(
    "language context",
    sources.languageContext,
    REQUIRED_TRANSLATION_STRINGS,
    failures
  );

  forbidPatterns(
    "line/bot source bundle",
    [
      sources.app,
      sources.floatingChatWidget,
      sources.layout,
      sources.lineConfig,
    ].join("\n"),
    FORBIDDEN_SECURITY_PATTERNS,
    failures
  );

  if (failures.length > 0) {
    console.error("SIRINX public-web LINE i18n verification failed:");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log("SIRINX public-web LINE i18n verification passed");
  console.log(`target: ${args.target}`);
  console.log("covered: footer LINE CTA, floating LINE dock, chat widget copy, aria labels, canonical LINE config");
}

try {
  main();
} catch (error) {
  console.error(`verification failed: ${error.message}`);
  process.exit(1);
}

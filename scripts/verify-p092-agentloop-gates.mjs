import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const requiredFiles = [
  "docs/command-center/P092_TELEGRAM_COMMAND_CENTER_APPROVAL_20260708.md",
  "docs/packets/packet_092_full_automation_agentloop_a2a2a_sync.json",
  "docs/specs/p092-agentloop-a2a2a-sync/BRD.md",
  "docs/specs/p092-agentloop-a2a2a-sync/FRD.md",
  "docs/specs/p092-agentloop-a2a2a-sync/DATA_CONTRACT.md",
  "docs/specs/p092-agentloop-a2a2a-sync/RUNBOOK.md",
  "docs/receipts/SIRINX_LINE_OA_GATE_P092_AUTO_LOOP_SYNC_20260708.md",
  "apps/public-web/server/_core/lineWebhookCore.ts",
  "apps/public-web/server/_core/lineWebhook.ts",
  "apps/public-web/server/_core/lineWebhook.test.ts",
  "apps/public-web/server/_core/index.ts",
  "apps/public-web/shared/lineOfficial.ts",
];

const fail = (message) => {
  console.error(`P092 gate failed: ${message}`);
  process.exit(1);
};

const read = (file) => readFileSync(join(root, file), "utf8");

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) fail(`missing ${file}`);
}

const packageJson = JSON.parse(read("package.json"));
if (packageJson.scripts?.["verify:p092-agentloop"] !== "node scripts/verify-p092-agentloop-gates.mjs") {
  fail("package.json is missing verify:p092-agentloop script");
}

const packet = JSON.parse(read("docs/packets/packet_092_full_automation_agentloop_a2a2a_sync.json"));
if (packet.packet_id !== "packet_092_full_automation_agentloop_a2a2a_sync") {
  fail("packet id mismatch");
}
if (packet.safe_execution !== "safe_execution_v3") {
  fail("safe execution profile mismatch");
}
if (packet.required_locks?.SIRINX_LINE_MODE !== "dry-run") {
  fail("SIRINX_LINE_MODE lock is not dry-run");
}
if (packet.required_locks?.SIRINX_LINE_AUTO_REPLY_APPROVED !== "false") {
  fail("SIRINX_LINE_AUTO_REPLY_APPROVED lock is not false");
}
if (packet.expected_receipt !== "docs/receipts/SIRINX_LINE_OA_GATE_P092_AUTO_LOOP_SYNC_20260708.md") {
  fail("expected receipt path mismatch");
}

const approval = read("docs/command-center/P092_TELEGRAM_COMMAND_CENTER_APPROVAL_20260708.md");
for (const requiredText of [
  "This approval is not approve-all",
  "SIRINX_LINE_MODE=dry-run",
  "SIRINX_LINE_AUTO_REPLY_APPROVED=false",
  "Register LINE webhook route before `express.json()`",
]) {
  if (!approval.includes(requiredText)) fail(`approval doc missing: ${requiredText}`);
}

const runbook = read("docs/specs/p092-agentloop-a2a2a-sync/RUNBOOK.md");
for (const blocked of [
  "No push",
  "deploy",
  "external sends",
  "production webhook activation",
  "CRM/customer storage",
]) {
  if (!runbook.includes(blocked)) fail(`runbook missing blocked action marker: ${blocked}`);
}

const indexSource = read("apps/public-web/server/_core/index.ts");
const routeIndex = indexSource.indexOf("registerLineWebhookRoutes(app)");
const jsonParserIndex = indexSource.indexOf("app.use(express.json");
if (routeIndex === -1) fail("LINE webhook route is not registered");
if (jsonParserIndex === -1) fail("global JSON parser was not found");
if (routeIndex > jsonParserIndex) {
  fail("LINE webhook route must be registered before express.json()");
}

const webhookSource = read("apps/public-web/server/_core/lineWebhook.ts");
for (const requiredText of [
  "express.raw",
  "/api/line/webhook",
  "/api/line/webhook/health",
  "liveReplySent: false",
]) {
  if (!webhookSource.includes(requiredText)) fail(`LINE webhook source missing: ${requiredText}`);
}
for (const forbiddenText of ["fetch(", "axios.", "client.replyMessage", "pushMessage", "broadcast("]) {
  if (webhookSource.includes(forbiddenText)) {
    fail(`LINE webhook source contains forbidden live-send call marker: ${forbiddenText}`);
  }
}

const webhookCoreSource = read("apps/public-web/server/_core/lineWebhookCore.ts");
for (const requiredText of [
  "createHmac",
  "timingSafeEqual",
  "SIRINX_LINE_MODE",
  "SIRINX_LINE_AUTO_REPLY_APPROVED",
  "requestedMode === \"live\" && !autoReplyApproved ? \"dry-run\"",
]) {
  if (!webhookCoreSource.includes(requiredText)) fail(`LINE webhook core missing: ${requiredText}`);
}

const lineOfficial = read("apps/public-web/shared/lineOfficial.ts");
for (const requiredText of [
  "SIRINX โซล่าเซลล์",
  "https://lin.ee/S97R6nj",
  "@304zrttj",
  "https://qr-official.line.me/gs/M_304zrttj_GW.png?oat_content=qr",
]) {
  if (!lineOfficial.includes(requiredText)) fail(`LINE config missing: ${requiredText}`);
}

const receipt = read("docs/receipts/SIRINX_LINE_OA_GATE_P092_AUTO_LOOP_SYNC_20260708.md");
for (const requiredText of [
  "Telegram live send: no",
  "LINE live reply: no",
  "Push: no",
  "Deploy: no",
  "Secret read or print: no",
]) {
  if (!receipt.includes(requiredText)) fail(`receipt missing safety marker: ${requiredText}`);
}

const docsForSecretScan = requiredFiles
  .filter((file) => file.startsWith("docs/"))
  .map((file) => [file, read(file)]);
const secretPatterns = [
  /TELEGRAM_BOT_TOKEN\s*=\s*\d+:[A-Za-z0-9_-]+/,
  /LINE_CHANNEL_ACCESS_TOKEN\s*=\s*[A-Za-z0-9+/_=-]{20,}/,
  /sk-[A-Za-z0-9_-]{20,}/,
  /xox[baprs]-[A-Za-z0-9-]{20,}/,
];

for (const [file, content] of docsForSecretScan) {
  for (const pattern of secretPatterns) {
    if (pattern.test(content)) fail(`possible secret value in ${file}`);
  }
}

console.log("P092 agentloop governance gates passed.");

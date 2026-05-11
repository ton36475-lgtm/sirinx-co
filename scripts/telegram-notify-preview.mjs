import https from "node:https";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const send = args.has("--send");
const messageArg = process.argv.find((arg) => arg.startsWith("--message="));
const message =
  messageArg?.slice("--message=".length) ||
  "SIRINX OS PR-MONO status: local scaffold ready. External writes remain locked.";

const token = process.env.TELEGRAM_BOT_TOKEN || "";
const chatId = process.env.TELEGRAM_CHAT_ID || "";
const confirm = process.env.SIRINX_TELEGRAM_CONFIRM === "SEND";

const payload = {
  chat_id: chatId || "REQUIRED_FOR_REAL_SEND",
  text: message,
  disable_web_page_preview: true,
};

const preview = {
  generatedAt: new Date().toISOString(),
  mode: send ? "send-requested" : "dry-run",
  tokenConfigured: Boolean(token),
  chatIdConfigured: Boolean(chatId),
  confirmConfigured: confirm,
  payload,
  guardrail:
    "Real Telegram send requires --send, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, and SIRINX_TELEGRAM_CONFIRM=SEND.",
};

mkdirSync(join(root, "exports"), { recursive: true });
writeFileSync(join(root, "exports", "telegram-preview-latest.json"), `${JSON.stringify(preview, null, 2)}\n`);

if (!send) {
  console.log(JSON.stringify(preview, null, 2));
  process.exit(0);
}

if (!token || !chatId || !confirm) {
  console.error("Refusing Telegram send: missing token/chat id/confirmation.");
  console.error(JSON.stringify(preview, null, 2));
  process.exit(1);
}

const body = JSON.stringify(payload);
const request = https.request(
  {
    method: "POST",
    hostname: "api.telegram.org",
    path: `/bot${token}/sendMessage`,
    headers: {
      "content-type": "application/json",
      "content-length": Buffer.byteLength(body),
    },
  },
  (response) => {
    let data = "";
    response.on("data", (chunk) => {
      data += chunk;
    });
    response.on("end", () => {
      console.log(JSON.stringify({ statusCode: response.statusCode, body: data }, null, 2));
      process.exit(response.statusCode && response.statusCode < 400 ? 0 : 1);
    });
  },
);

request.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});

request.write(body);
request.end();

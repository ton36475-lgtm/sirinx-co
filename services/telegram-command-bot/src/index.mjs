import { BLOCKED_ACTIONS, resolveTelegramGatewayConfig } from "./config.mjs";

const args = new Set(process.argv.slice(2));

if (args.has("--config")) {
  console.log(JSON.stringify(resolveTelegramGatewayConfig(), null, 2));
  process.exit(0);
}

const allowedCommands = resolveTelegramGatewayConfig().allowedCommands;
const blockedActions = [...BLOCKED_ACTIONS];

const status = {
  service: "telegram-command-bot",
  mode: args.has("--dry-run") ? "dry-run" : "blocked-live-mode",
  tokenConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
  chatIdConfigured: Boolean(process.env.TELEGRAM_CHAT_ID),
  ownerIdsConfigured: Boolean(process.env.TELEGRAM_OWNER_IDS),
  allowedCommands,
  blockedActions,
  guardrail:
    "Live Telegram polling/sending is disabled in this scaffold. Use telegram-notify-preview.mjs and an explicit approval gate for real sends.",
};

if (!args.has("--dry-run")) {
  console.error(JSON.stringify(status, null, 2));
  console.error("Refusing live mode in PR-MONO-002 scaffold.");
  process.exit(1);
}

console.log(JSON.stringify(status, null, 2));

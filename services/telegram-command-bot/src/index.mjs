import { handleGatesCommand } from "./gate-status.mjs";

const args = new Set(process.argv.slice(2));

const allowedCommands = ["/status", "/gates", "/sync-plan", "/stop"];
const blockedActions = [
  "deploy",
  "push",
  "cloudflare-write",
  "production-db-write",
  "customer-send",
  "paid-api",
  "direct-shell",
];

async function buildStatus() {
  return {
    service: "telegram-command-bot",
    mode: args.has("--dry-run") ? "dry-run" : "blocked-live-mode",
    tokenConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    ownerIdsConfigured: Boolean(process.env.TELEGRAM_OWNER_IDS),
    allowedCommands,
    blockedActions,
    guardrail:
      "Live Telegram polling/sending is disabled in this scaffold. Use telegram-notify-preview.mjs and an explicit approval gate for real sends.",
    // B9 fix: real gate state from sirinx-control, not a hardcoded
    // string. Fails closed (assumes hold) if the control plane is
    // unreachable — see gate-status.mjs.
    gates: await handleGatesCommand(),
  };
}

const status = await buildStatus();

if (!args.has("--dry-run")) {
  console.error(JSON.stringify(status, null, 2));
  console.error("Refusing live mode in PR-MONO-002 scaffold.");
  process.exit(1);
}

console.log(JSON.stringify(status, null, 2));

#!/usr/bin/env node
/**
 * SIRINX Telegram Notification Utility
 * =====================================
 * Send formatted messages to Telegram from any script or agent.
 *
 * Usage:
 *   node scripts/telegram-notify.js "Your message here"
 *   node scripts/telegram-notify.js --type=critical "Server down!"
 *   node scripts/telegram-notify.js --type=revenue "Deal won: 250kWp ฿3.75M"
 *   node scripts/telegram-notify.js --type=lead "New lead: ABC Factory"
 *
 * Env vars (or set in .env):
 *   TELEGRAM_BOT_TOKEN  — bot token from @BotFather
 *   TELEGRAM_CHAT_ID    — your personal chat ID (run telegram-setup.js to find it)
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

// ── Load env from .env if present ──────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env')
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n')
    for (const line of lines) {
      const match = line.match(/^([A-Z_]+)\s*=\s*(.+)$/)
      if (match) process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '')
    }
  }
}

// ── Fallback: read token from openclaw.json ────────────────────────────────
function getTokenFromOpenClaw() {
  const ocPath = path.join(process.env.USERPROFILE || process.env.HOME, '.openclaw', 'openclaw.json')
  try {
    const config = JSON.parse(fs.readFileSync(ocPath, 'utf8'))
    return config?.channels?.telegram?.botToken || null
  } catch {
    return null
  }
}

// ── Message formatters ─────────────────────────────────────────────────────
const TEMPLATES = {
  critical: (msg) => `🔴 *SIRINX CRITICAL ALERT*\n\n${msg}\n\n⏰ ${bangkokTime()}`,
  warning:  (msg) => `🟡 *SIRINX WARNING*\n\n${msg}\n\n⏰ ${bangkokTime()}`,
  info:     (msg) => `🟢 *SIRINX INFO*\n\n${msg}\n\n⏰ ${bangkokTime()}`,
  revenue:  (msg) => `💰 *SIRINX REVENUE*\n\n${msg}\n\n⏰ ${bangkokTime()}`,
  lead:     (msg) => `📋 *SIRINX NEW LEAD*\n\n${msg}\n\n⏰ ${bangkokTime()}`,
  deploy:   (msg) => `🚀 *SIRINX DEPLOY*\n\n${msg}\n\n⏰ ${bangkokTime()}`,
  default:  (msg) => `🤖 *SIRINX*\n\n${msg}\n\n⏰ ${bangkokTime()}`,
}

function bangkokTime() {
  return new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', hour12: false })
}

function formatMessage(text, type = 'default') {
  const formatter = TEMPLATES[type] || TEMPLATES.default
  return formatter(text)
}

// ── Telegram API call ──────────────────────────────────────────────────────
function sendTelegramMessage(token, chatId, text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    })

    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        const parsed = JSON.parse(data)
        if (parsed.ok) {
          resolve(parsed.result)
        } else {
          reject(new Error(`Telegram API error: ${parsed.description} (${parsed.error_code})`))
        }
      })
    })

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  loadEnv()

  const args = process.argv.slice(2)
  if (args.length === 0 || args.includes('--help')) {
    console.log(`
SIRINX Telegram Notify
Usage: node scripts/telegram-notify.js [--type=TYPE] "message"

Types: critical | warning | info | revenue | lead | deploy | default
    `)
    process.exit(0)
  }

  // Parse --type=xxx flag
  let type = 'default'
  const typeArg = args.find((a) => a.startsWith('--type='))
  if (typeArg) type = typeArg.split('=')[1]

  const message = args.filter((a) => !a.startsWith('--')).join(' ')
  if (!message) {
    console.error('Error: No message provided.')
    process.exit(1)
  }

  const token = process.env.TELEGRAM_BOT_TOKEN || getTokenFromOpenClaw()
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token) {
    console.error('Error: No TELEGRAM_BOT_TOKEN found. Set it in .env or openclaw.json.')
    process.exit(1)
  }
  if (!chatId) {
    console.error(`
Error: TELEGRAM_CHAT_ID not set.
Run: node scripts/telegram-setup.js
to find your chat ID, then add it to .env:
  TELEGRAM_CHAT_ID=your_id_here
    `)
    process.exit(1)
  }

  const formatted = formatMessage(message, type)
  console.log(`Sending [${type}] to chat ${chatId}...`)

  try {
    const result = await sendTelegramMessage(token, chatId, formatted)
    console.log(`✓ Sent! Message ID: ${result.message_id}`)
  } catch (err) {
    console.error(`✗ Failed: ${err.message}`)
    process.exit(1)
  }
}

main()

// ── Export for use as a module ─────────────────────────────────────────────
module.exports = {
  notify: async (message, type = 'default') => {
    loadEnv()
    const token = process.env.TELEGRAM_BOT_TOKEN || getTokenFromOpenClaw()
    const chatId = process.env.TELEGRAM_CHAT_ID
    if (!token || !chatId) throw new Error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID')
    const formatted = formatMessage(message, type)
    return sendTelegramMessage(token, chatId, formatted)
  },
  formatMessage,
  sendTelegramMessage,
}

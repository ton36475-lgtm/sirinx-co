#!/usr/bin/env node
/**
 * SIRINX System Report Sender
 * ============================
 * Finds your Telegram chat ID (from getUpdates), saves it to .env,
 * then sends the full system status report.
 *
 * Usage:
 *   node scripts/send-system-report.js
 *
 * Pre-requisite:
 *   1. Open Telegram → search @MultiAgentAiCompany_bot
 *   2. Send /start to the bot
 *   3. Then run this script
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

const TOKEN = '8719485384:AAEq_gdr0WdhYje_5k4ZlirKKCV37KrlFfs'
const ENV_PATH = path.join(__dirname, '..', '.env')

function apiCall(method, params = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(params)
    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${TOKEN}/${method}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => resolve(JSON.parse(data)))
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

function saveEnvVar(key, value) {
  let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : ''
  if (content.includes(`${key}=`)) {
    content = content.replace(new RegExp(`${key}=.*`), `${key}=${value}`)
  } else {
    content += `\n${key}=${value}`
  }
  fs.writeFileSync(ENV_PATH, content.trim() + '\n')
  console.log(`  ✓ Saved ${key}=${value} to .env`)
}

const REPORT = `🚀 *SIRINX AI-WarRoom — System Report*
📅 April 2, 2026

✅ *COMPLETED:*
• 13 web pages (sirinx-app)
• 31+ Skills deployed
• Master GEM Skill (image gen + SEO/AEO)
• SEO 77 Provinces Skill (385 pages)
• 30 Pro Starter Commands
• CLAUDE.md + .claudeignore fixed
• Design System v2.0
• WarRoom Dashboard
• 4 Sales Media Infographics
• 22 Image Generation Prompts

⏳ *PENDING:*
• Supabase integration
• SEO implementation Phase 1
• n8n workflows
• Cloudflare setup
• Customer + Contractor Apps

🏗 *ARCHITECTURE:*
• 3 Apps + 47 AI Agents (47 Ronin)
• OpenClaw on Alibaba Cloud Bangkok
• AI Cost: ~1,400 THB/month
• MRR Target: Y1 750K | Y3 3M THB`

async function main() {
  console.log('\n╔═════════════════════════════════════╗')
  console.log('║  SIRINX System Report Sender         ║')
  console.log('╚═════════════════════════════════════╝\n')

  // Step 1: Get chat_id
  console.log('📡 Fetching updates to find your chat ID...')
  const updates = await apiCall('getUpdates', { limit: 20, timeout: 0 })

  if (!updates.ok || updates.result.length === 0) {
    console.log('\n❌ No messages found.\n')
    console.log('You need to send /start to the bot first:')
    console.log('  1. Open Telegram')
    console.log('  2. Search: @MultiAgentAiCompany_bot')
    console.log('  3. Press START or send /start')
    console.log('  4. Run this script again\n')
    process.exit(1)
  }

  // Find first private chat
  let chatId = null
  let chatName = null
  for (const u of updates.result) {
    const chat = u.message?.chat || u.message?.from
    if (chat && chat.id && !chatId) {
      chatId = u.message.chat.id
      chatName = u.message.chat.first_name || u.message.chat.title || 'Unknown'
    }
  }

  if (!chatId) {
    console.log('❌ Could not extract chat_id from updates.')
    console.log(JSON.stringify(updates.result.slice(0, 2), null, 2))
    process.exit(1)
  }

  console.log(`✅ Found chat ID: ${chatId} (${chatName})\n`)

  // Step 2: Save to .env
  saveEnvVar('TELEGRAM_CHAT_ID', chatId)

  // Step 3: Send report
  console.log('📤 Sending system report...')
  const result = await apiCall('sendMessage', {
    chat_id: chatId,
    text: REPORT,
    parse_mode: 'Markdown',
  })

  if (result.ok) {
    console.log('✅ System report sent! Check Telegram.\n')
  } else {
    console.log(`❌ Send failed: ${result.description}\n`)
    process.exit(1)
  }
}

main().catch(console.error)

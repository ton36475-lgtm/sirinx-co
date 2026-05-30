#!/usr/bin/env node
/**
 * SIRINX Telegram Setup Helper
 * =============================
 * Helps you find your Telegram Chat ID and test the bot connection.
 *
 * Usage:
 *   node scripts/telegram-setup.js           — guided setup
 *   node scripts/telegram-setup.js --test    — send a test notification
 *   node scripts/telegram-setup.js --getid   — fetch latest updates to find your chat ID
 *                                              (OpenClaw must be STOPPED first)
 */

const https = require('https')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

// ── Load env ───────────────────────────────────────────────────────────────
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

function getTokenFromOpenClaw() {
  const ocPath = path.join(process.env.USERPROFILE || process.env.HOME, '.openclaw', 'openclaw.json')
  try {
    const config = JSON.parse(fs.readFileSync(ocPath, 'utf8'))
    return config?.channels?.telegram?.botToken || null
  } catch {
    return null
  }
}

// ── API helpers ────────────────────────────────────────────────────────────
function apiCall(token, method, params = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(params)
    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${token}/${method}`,
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

// ── Write/update .env file ─────────────────────────────────────────────────
function saveEnvVar(key, value) {
  const envPath = path.join(__dirname, '..', '.env')
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''

  if (content.includes(`${key}=`)) {
    content = content.replace(new RegExp(`${key}=.*`), `${key}=${value}`)
  } else {
    content += `\n${key}=${value}`
  }
  fs.writeFileSync(envPath, content.trim() + '\n')
  console.log(`  ✓ Saved ${key} to .env`)
}

// ── Prompt helper ──────────────────────────────────────────────────────────
function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()) }))
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  loadEnv()
  const args = process.argv.slice(2)
  const token = process.env.TELEGRAM_BOT_TOKEN || getTokenFromOpenClaw()

  console.log('\n╔══════════════════════════════════════════╗')
  console.log('║   SIRINX Telegram Setup Helper            ║')
  console.log('╚══════════════════════════════════════════╝\n')

  if (!token) {
    console.log('❌ No bot token found.\n')
    console.log('Steps to get one:')
    console.log('  1. Open Telegram → search @BotFather')
    console.log('  2. Send /newbot, follow instructions')
    console.log('  3. Copy the token (looks like: 123456789:ABCdef...)')
    console.log('  4. Add to .env:  TELEGRAM_BOT_TOKEN=your_token_here')
    console.log('  5. Run this script again\n')
    process.exit(1)
  }

  // Verify bot
  const me = await apiCall(token, 'getMe')
  if (!me.ok) {
    console.log(`❌ Bot token invalid: ${me.description}`)
    process.exit(1)
  }
  console.log(`✅ Bot verified: @${me.result.username} (ID: ${me.result.id})\n`)

  // ── --getid mode ───────────────────────────────────────────────────────
  if (args.includes('--getid')) {
    console.log('📡 Fetching recent messages to find your chat ID...')
    console.log('⚠️  Note: OpenClaw must be STOPPED for this to work.\n')

    const updates = await apiCall(token, 'getUpdates', { limit: 10, timeout: 0 })
    if (!updates.ok || updates.result.length === 0) {
      console.log('No recent messages found.\n')
      console.log('How to get your chat ID without stopping OpenClaw:')
      console.log('  Option 1: Open Telegram → message @userinfobot → it replies with your ID')
      console.log('  Option 2: Open Telegram → message @RawDataBot')
      console.log('  Option 3: Visit https://t.me/getidsbot and start a chat\n')
      console.log('Once you have your ID (a number like 123456789), add to .env:')
      console.log('  TELEGRAM_CHAT_ID=123456789\n')
    } else {
      console.log('Recent chats found:')
      const seen = new Set()
      for (const u of updates.result) {
        const chat = u.message?.chat
        if (chat && !seen.has(chat.id)) {
          seen.add(chat.id)
          const name = chat.first_name ? `${chat.first_name} ${chat.last_name || ''}`.trim()
                     : chat.title || 'Unknown'
          console.log(`  Chat ID: ${chat.id}  |  Name: ${name}  |  Type: ${chat.type}`)
        }
      }
      console.log('\nCopy your personal chat ID and add to .env:')
      console.log('  TELEGRAM_CHAT_ID=your_id_here\n')
    }
    return
  }

  // ── --test mode ────────────────────────────────────────────────────────
  if (args.includes('--test')) {
    const chatId = process.env.TELEGRAM_CHAT_ID
    if (!chatId) {
      console.log('❌ TELEGRAM_CHAT_ID not set in .env')
      console.log('Run: node scripts/telegram-setup.js --getid\n')
      process.exit(1)
    }

    console.log(`📤 Sending test message to chat ID: ${chatId}`)
    const result = await apiCall(token, 'sendMessage', {
      chat_id: chatId,
      text: '✅ *SIRINX System Online*\n\nTelegram notifications active\n🤖 47 Ronin agents ready\n⏰ ' +
            new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', hour12: false }),
      parse_mode: 'Markdown',
    })

    if (result.ok) {
      console.log('✅ Test message sent! Check Telegram.\n')
    } else {
      console.log(`❌ Failed: ${result.description}\n`)
      if (result.error_code === 400 && result.description?.includes('chat not found')) {
        console.log('💡 The bot has never received a message from this chat ID.')
        console.log('   Open Telegram, find @MultiAgentAiCompany_bot, and send /start first.\n')
      }
    }
    return
  }

  // ── Interactive guided setup ───────────────────────────────────────────
  console.log('─── Step 1: Bot Token ───────────────────────')
  console.log(`✅ Token found (from ${process.env.TELEGRAM_BOT_TOKEN ? '.env' : 'openclaw.json'})`)
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    const save = await prompt('Save token to .env? (y/n): ')
    if (save.toLowerCase() === 'y') saveEnvVar('TELEGRAM_BOT_TOKEN', token)
  }

  console.log('\n─── Step 2: Your Chat ID ────────────────────')
  if (process.env.TELEGRAM_CHAT_ID) {
    console.log(`✅ TELEGRAM_CHAT_ID already set: ${process.env.TELEGRAM_CHAT_ID}`)
  } else {
    console.log('To find your Telegram Chat ID:\n')
    console.log('  • Open Telegram and message @userinfobot')
    console.log('    It replies instantly with your numeric ID\n')
    console.log('  • OR: message @RawDataBot or @getidsbot\n')
    const id = await prompt('Enter your Telegram Chat ID (or press Enter to skip): ')
    if (id) {
      saveEnvVar('TELEGRAM_CHAT_ID', id)
      process.env.TELEGRAM_CHAT_ID = id
    }
  }

  if (process.env.TELEGRAM_CHAT_ID) {
    console.log('\n─── Step 3: Test ────────────────────────────')
    const doTest = await prompt('Send a test notification now? (y/n): ')
    if (doTest.toLowerCase() === 'y') {
      const result = await apiCall(token, 'sendMessage', {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: '✅ *SIRINX System Online*\n\nTelegram notifications active\n🤖 47 Ronin agents ready',
        parse_mode: 'Markdown',
      })
      if (result.ok) {
        console.log('\n✅ Test message sent! Check your Telegram.\n')
      } else {
        console.log(`\n❌ Failed: ${result.description}`)
        console.log('\n💡 Make sure you have started a chat with @MultiAgentAiCompany_bot first.\n')
      }
    }
  }

  console.log('\n─── Setup Complete ──────────────────────────')
  console.log('Usage examples:')
  console.log('  node scripts/telegram-notify.js "System check complete"')
  console.log('  node scripts/telegram-notify.js --type=revenue "Deal closed: 500kWp"')
  console.log('  node scripts/telegram-notify.js --type=critical "Agent crash detected"')
  console.log('')
}

main().catch(console.error)

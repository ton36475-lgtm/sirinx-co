#!/usr/bin/env node
/**
 * SIRINX AI-WarRoom — Telegram Bot (Clean)
 * ==========================================
 * - Long-polling เท่านั้น (ไม่ใช่ webhook)
 * - ไม่มี setInterval สำหรับรายงานซ้ำ — ตอบกลับเมื่อมี event เท่านั้น
 * - Native fetch (Node 18+) — Thai UTF-8 ถูกต้อง
 * - ป้องกัน 409 conflict: ใช้ lock file + graceful shutdown
 *
 * Usage:
 *   node scripts/sirinx-bot.js
 *   pm2 start scripts/sirinx-bot.js --name sirinx-bot
 */

'use strict'

const path = require('path')
const fs   = require('fs')

// ── Load .env from sirinx-app/.env.local ─────────────────────────────────────
const envPath = path.join(__dirname, '..', 'sirinx-app', '.env.local')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = val
  }
}

const TOKEN   = process.env.TELEGRAM_BOT_TOKEN
const CHAT_ID = String(process.env.TELEGRAM_CHAT_ID || '5320654632')

if (!TOKEN) {
  console.error('✗ TELEGRAM_BOT_TOKEN not set. ตรวจสอบ sirinx-app/.env.local')
  process.exit(1)
}

// ── Constants ──────────────────────────────────────────────────────────────────
const API     = `https://api.telegram.org/bot${TOKEN}`
const LOCK    = path.join(__dirname, '..', 'state', 'bot.lock')
const LOG_DIR = path.join(__dirname, '..', 'logs')

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true })
if (!fs.existsSync(path.join(__dirname, '..', 'state')))
  fs.mkdirSync(path.join(__dirname, '..', 'state'), { recursive: true })

// ── Logging ────────────────────────────────────────────────────────────────────
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`
  console.log(line)
  fs.appendFileSync(path.join(LOG_DIR, 'bot.log'), line + '\n')
}

// ── Lock: ป้องกัน multiple instances (409 conflict) ──────────────────────────
function acquireLock() {
  if (fs.existsSync(LOCK)) {
    const pid = fs.readFileSync(LOCK, 'utf8').trim()
    // ตรวจว่า process นั้นยังอยู่
    try {
      process.kill(Number(pid), 0)
      console.error(`✗ Bot กำลัง run อยู่แล้ว (PID ${pid}). หยุด instance นั้นก่อน.`)
      process.exit(1)
    } catch {
      // Process หายไปแล้ว — lock stale
      log(`⚠ Stale lock removed (PID ${pid})`)
    }
  }
  fs.writeFileSync(LOCK, String(process.pid))
}

function releaseLock() {
  try { fs.unlinkSync(LOCK) } catch {}
}

// ── Telegram API helpers (native fetch, UTF-8 safe) ───────────────────────────
async function tgGet(method, params = {}) {
  const url = new URL(`${API}/${method}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))
  const res = await fetch(url.toString())
  return res.json()
}

async function sendMessage(chatId, text, extra = {}) {
  const body = {
    chat_id:    chatId,
    text,
    parse_mode: 'HTML',
    ...extra,
  }
  const res = await fetch(`${API}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body:    JSON.stringify(body),
  })
  const data = await res.json()
  if (!data.ok) log(`✗ sendMessage error: ${JSON.stringify(data)}`)
  return data
}

// ── LLM Chat (Ollama primary, Anthropic fallback) ─────────────────────────────
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3-vl:4b'
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

async function sendChatAction(chatId, action = 'typing') {
  try {
    await fetch(`${API}/sendChatAction`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: chatId, action }),
    })
  } catch {}
}

async function callOllama(userMessage) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      model:  OLLAMA_MODEL,
      stream: false,
      messages: [
        {
          role:    'system',
          content: 'คุณคือ SIRINX AI Assistant ผู้ช่วย CEO WarRoom ของบริษัท SIRINX Solar Energy Thailand ตอบเป็นภาษาไทยหรืออังกฤษตามที่ผู้ใช้ถาม กระชับ ตรงประเด็น ไม่เกิน 3-4 ย่อหน้า',
        },
        { role: 'user', content: userMessage },
      ],
    }),
  })
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`)
  const data = await res.json()
  return data.message?.content || data.response || 'ไม่มีคำตอบจาก LLM'
}

async function callAnthropic(userMessage) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system:     'คุณคือ SIRINX AI Assistant ผู้ช่วย CEO WarRoom ของบริษัท SIRINX Solar Energy Thailand ตอบเป็นภาษาไทยหรืออังกฤษตามที่ผู้ใช้ถาม กระชับ ตรงประเด็น',
      messages:   [{ role: 'user', content: userMessage }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}`)
  const data = await res.json()
  return data.content?.[0]?.text || 'ไม่มีคำตอบจาก LLM'
}

async function handleLLMChat(chatId, userMessage) {
  await sendChatAction(chatId, 'typing')
  let reply
  try {
    reply = await callOllama(userMessage)
    log(`→ [LLM/Ollama] replied (${reply.length} chars)`)
  } catch (ollamaErr) {
    log(`⚠ Ollama failed: ${ollamaErr.message} — trying Anthropic fallback`)
    if (ANTHROPIC_KEY) {
      try {
        reply = await callAnthropic(userMessage)
        log(`→ [LLM/Anthropic] replied (${reply.length} chars)`)
      } catch (anthropicErr) {
        log(`✗ Anthropic failed: ${anthropicErr.message}`)
        reply = `❌ <b>LLM ไม่พร้อมใช้งาน</b>\n\nOllama: ${ollamaErr.message}\nAnthropic: ${anthropicErr.message}\n\nกรุณาตรวจสอบ:\n• <code>pm2 logs sirinx-bot</code>\n• <code>curl http://localhost:11434/api/tags</code>`
      }
    } else {
      reply = `❌ <b>Ollama ไม่ตอบสนอง</b>\n\n${ollamaErr.message}\n\nกรุณาตรวจสอบว่า Ollama กำลัง run อยู่ด้วยคำสั่ง:\n<code>ollama list</code>`
    }
  }

  // Telegram limit: 4096 chars
  if (reply.length > 4000) {
    reply = reply.slice(0, 3997) + '...'
  }

  await sendMessage(chatId, reply)
}

// ── Command Handlers ──────────────────────────────────────────────────────────
function handleStart(chatId, firstName) {
  return sendMessage(chatId, [
    `🤖 <b>สวัสดีครับ ${firstName || 'Tony'}!</b>`,
    '',
    'ผม <b>SIRINX AI Bot</b> — ผู้ช่วย CEO WarRoom ของคุณ',
    'พิมพ์ /help เพื่อดูคำสั่งทั้งหมดครับ',
  ].join('\n'))
}

function handleHelp(chatId) {
  return sendMessage(chatId, [
    '📋 <b>คำสั่งที่รองรับ</b>',
    '',
    '/start  — แนะนำตัว',
    '/help   — แสดงคำสั่งนี้',
    '/status — สถานะระบบ 47 Ronin',
    '/solar  — ข้อมูลธุรกิจ SIRINX Solar',
    '/agents — รายชื่อ 47 Ronin agents',
    '',
    '💬 <i>พิมพ์ข้อความใดก็ได้ — AI จะตอบกลับอัตโนมัติ (Ollama qwen3-vl:4b)</i>',
  ].join('\n'))
}

function handleStatus(chatId) {
  const now = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
  return sendMessage(chatId, [
    '🟢 <b>SIRINX AI-WarRoom — System Status</b>',
    '',
    `🕐 เวลา: ${now}`,
    `🤖 47 Ronin Agents: <b>Active</b>`,
    `☁️  Alibaba Cloud Bangkok (ap-southeast-7): <b>Online</b>`,
    `📱 Telegram Bot: <b>Running (long-poll)</b>`,
    `🌐 Next.js App: Port 3002`,
    '',
    '✅ ระบบทำงานปกติ',
  ].join('\n'))
}

function handleSolar(chatId) {
  return sendMessage(chatId, [
    '☀️ <b>SIRINX Solar Energy Thailand</b>',
    '',
    '🎯 <b>Target:</b> โรงงาน/โกดัง/โรงแรม บิลค่าไฟ &gt; 50,000 บาท/เดือน',
    '🔧 <b>บริการ:</b> B2B EPC + O&amp;M + AI Platform (SaaS)',
    '🏆 <b>จุดเด่น:</b> 47 Ronin AI Agent System',
    '',
    '<b>Layer Structure:</b>',
    '  L1 (16) — Perception: สแกน lead, ข้อมูลตลาด',
    '  L2 (9)  — Analysis: ROI, scoring, insights',
    '  L3 (10) — Decision: strategy, proposals',
    '  L4 (8)  — Coordination: orchestration',
    '  L5 (4)  — Research: AI trends, R&amp;D',
    '  Kai     — Customer Chatbot (5-step CoT)',
    '',
    '📊 Dashboard: <code>http://localhost:3002/dashboard</code>',
  ].join('\n'))
}

function handleAgents(chatId) {
  return sendMessage(chatId, [
    '🥷 <b>47 Ronin Agent System</b>',
    '',
    '<b>L1 Perception (16):</b> Kuranosuke→Jurozaemon',
    '<b>L2 Analysis (9):</b> Junai→Sampachi',
    '<b>L3 Decision (10):</b> Kihei→Heidayu',
    '<b>L4 Coordination (8):</b> Gengo→Muneharu',
    '<b>L5 Research (4):</b> Mimura, Yokogawa, Kayano, Terasaka',
    '<b>Chatbot:</b> Kai (Customer-facing)',
    '',
    '💡 พิมพ์ /solar สำหรับข้อมูลธุรกิจเพิ่มเติม',
  ].join('\n'))
}

function handleUnknown(chatId, text) {
  return sendMessage(chatId, [
    `❓ ไม่รู้จักคำสั่ง: <code>${text.slice(0, 50)}</code>`,
    '',
    'พิมพ์ /help เพื่อดูคำสั่งที่รองรับครับ',
  ].join('\n'))
}

// ── Update processor ──────────────────────────────────────────────────────────
async function processUpdate(update) {
  const msg = update.message || update.edited_message
  if (!msg || !msg.text) return

  const chatId    = String(msg.chat.id)
  const text      = msg.text.trim()
  const firstName = msg.from?.first_name || ''
  const cmd       = text.split(' ')[0].toLowerCase().replace(/@\S+$/, '')

  log(`← [${chatId}] ${text}`)

  switch (cmd) {
    case '/start':   await handleStart(chatId, firstName); break
    case '/help':    await handleHelp(chatId); break
    case '/status':  await handleStatus(chatId); break
    case '/solar':   await handleSolar(chatId); break
    case '/agents':  await handleAgents(chatId); break
    default:
      if (text.startsWith('/')) await handleUnknown(chatId, text)
      else await handleLLMChat(chatId, text)
  }
}

// ── Long-polling loop ─────────────────────────────────────────────────────────
let offset   = 0
let running  = true
let retryDelay = 1000

async function poll() {
  // Clear any stuck webhook before starting
  await tgGet('deleteWebhook', { drop_pending_updates: false })
    .then(() => log('✓ Webhook cleared'))
    .catch(() => {})

  log(`✓ SIRINX Bot started (PID ${process.pid}) — polling...`)

  while (running) {
    try {
      const data = await tgGet('getUpdates', {
        offset,
        timeout:          30,
        allowed_updates:  'message',
      })

      if (!data.ok) {
        log(`✗ getUpdates error: ${JSON.stringify(data)}`)
        await sleep(retryDelay)
        retryDelay = Math.min(retryDelay * 2, 30000)
        continue
      }

      retryDelay = 1000  // reset on success

      for (const update of data.result || []) {
        offset = update.update_id + 1
        processUpdate(update).catch(e => log(`✗ processUpdate error: ${e.message}`))
      }
    } catch (err) {
      if (!running) break
      log(`✗ Poll error: ${err.message}`)
      await sleep(retryDelay)
      retryDelay = Math.min(retryDelay * 2, 30000)
    }
  }

  log('Bot stopped.')
  releaseLock()
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────
function shutdown(sig) {
  log(`← ${sig} received — shutting down`)
  running = false
}

process.on('SIGINT',  () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('uncaughtException', err => {
  log(`✗ uncaughtException: ${err.stack}`)
  releaseLock()
  process.exit(1)
})

// ── Boot ──────────────────────────────────────────────────────────────────────
acquireLock()
poll()

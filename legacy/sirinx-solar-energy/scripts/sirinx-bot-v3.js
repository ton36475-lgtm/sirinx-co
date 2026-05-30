#!/usr/bin/env node
/**
 * SIRINX Bot v4.0 "Simple AI"
 * ============================
 * ปรัชญา: Simple but Complete
 * - 4 ปุ่มหลัก (Thai labels)
 * - พิมพ์อะไรก็ได้ → AI ตอบ
 * - เปิด/ปิดระบบอัตโนมัติ
 * - สถานะระบบในหน้าเดียว
 *
 * Pure Node.js — ไม่ต้อง npm install
 */

'use strict'
const https = require('https')
const http = require('http')
const path = require('path')
const fs = require('fs')

// ── Agent Bridge ───────────────────────────────────────────────────────────
const bridge = require('./agent-bridge')

// ── Load .env ──────────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '..', 'sirinx-app', '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const k = t.slice(0, eq).trim()
    const v = t.slice(eq + 1).trim()
    if (!process.env[k]) process.env[k] = v
  }
}

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TONY_ID = '5320654632'
const API = `https://api.telegram.org/bot${TOKEN}`

if (!TOKEN) { console.error('✗ TELEGRAM_BOT_TOKEN not set'); process.exit(1) }

// ── State ──────────────────────────────────────────────────────────────────
const state = {
  automation: false,
  agentRunCount: 0,
  lastAgentName: null,
  lastAgentTime: null,
  errorsToday: 0,
  schedulerTimer: null,
}

// ── LLM config (Ollama) ────────────────────────────────────────────────────
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'localhost'
const OLLAMA_PORT = parseInt(process.env.OLLAMA_PORT || '11434')
const LLM_MODEL = process.env.LLM_MODEL || process.env.OLLAMA_MODEL || 'qwen3-vl:4b'

// ── Helpers ────────────────────────────────────────────────────────────────
function log(msg) {
  console.log(`[${new Date().toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok' })}] ${msg}`)
}

function apiCall(method, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API}/${method}`)
    const opts = {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json; charset=utf-8' } : {},
    }
    const req = https.request(url, opts, res => {
      let d = ''; res.on('data', c => d += c)
      res.on('end', () => { try { resolve(JSON.parse(d)) } catch(e) { reject(e) } })
    })
    req.on('error', reject)
    req.setTimeout(40000, () => { req.destroy(); reject(new Error('timeout')) })
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

function send(chatId, text, extra = {}) {
  return apiCall('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', ...extra })
}

function sendWithKeyboard(chatId, text, buttons) {
  const keyboard = buttons.map(row =>
    row.map(btn => typeof btn === 'string'
      ? { text: btn, callback_data: btn }
      : btn
    )
  )
  return send(chatId, text, { reply_markup: JSON.stringify({ inline_keyboard: keyboard }) })
}

function answerCallback(id, text = '') {
  return apiCall('answerCallbackQuery', { callback_query_id: id, text })
}

function sendTyping(chatId) {
  return apiCall('sendChatAction', { chat_id: chatId, action: 'typing' }).catch(() => {})
}

// ── LLM — Ollama ───────────────────────────────────────────────────────────
function callLLM(userMessage) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: LLM_MODEL,
      messages: [
        {
          role: 'system',
          content: 'คุณเป็น AI assistant ของบริษัท SIRINX Solar Energy ผู้เชี่ยวชาญด้านพลังงานแสงอาทิตย์ในประเทศไทย ตอบเป็นภาษาไทยเสมอ กระชับและมีประโยชน์',
        },
        { role: 'user', content: userMessage },
      ],
      stream: false,
    })

    const opts = {
      hostname: OLLAMA_HOST,
      port: OLLAMA_PORT,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }

    const req = http.request(opts, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(d)
          const text = parsed?.message?.content || parsed?.response || 'ไม่มีคำตอบ'
          resolve({ ok: true, text })
        } catch {
          resolve({ ok: false })
        }
      })
    })
    req.on('error', e => { log(`LLM error: ${e.message}`); resolve({ ok: false, error: e.message }) })
    req.setTimeout(60000, () => { req.destroy(); log('LLM timeout'); resolve({ ok: false, error: 'timeout' }) })
    req.write(body)
    req.end()
  })
}

function checkLLM() {
  return new Promise(resolve => {
    const req = http.request(
      { hostname: OLLAMA_HOST, port: OLLAMA_PORT, path: '/api/tags', method: 'GET' },
      res => {
        let d = ''; res.on('data', c => d += c)
        res.on('end', () => {
          try {
            const j = JSON.parse(d)
            const models = (j.models || []).map(m => m.name).slice(0, 2).join(', ')
            resolve(`🟢 เชื่อมต่อ (${models || LLM_MODEL})`)
          } catch {
            resolve('🟡 เชื่อมต่อแล้ว')
          }
        })
      }
    )
    req.on('error', () => resolve('🔴 ออฟไลน์'))
    req.setTimeout(3000, () => { req.destroy(); resolve('🔴 ออฟไลน์') })
    req.end()
  })
}

// ── Automation ─────────────────────────────────────────────────────────────
async function runAutomationCycle() {
  try {
    const result = await bridge.dispatchAgent('agent-35', { task: 'scheduled-check' })
    state.agentRunCount++
    state.lastAgentName = result.agentName || 'Gengo'
    state.lastAgentTime = new Date().toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok' })
    log(`Auto: ${state.lastAgentName} — ${(result.message || '').substring(0, 60)}`)
  } catch (e) {
    state.errorsToday++
    log(`Auto error: ${e.message}`)
  }
}

function startAutomation() {
  if (state.automation) return
  state.automation = true
  runAutomationCycle()
  state.schedulerTimer = setInterval(runAutomationCycle, 10 * 60 * 1000)
  log('Automation started')
}

function stopAutomation() {
  if (!state.automation) return
  state.automation = false
  if (state.schedulerTimer) { clearInterval(state.schedulerTimer); state.schedulerTimer = null }
  log('Automation stopped')
}

// ── Menus & Screens ─────────────────────────────────────────────────────────
function showMainMenu(chatId) {
  return sendWithKeyboard(chatId,
    '🤖 <b>SIRINX AI Assistant</b>\n\nพิมพ์ข้อความอะไรก็ได้ — AI จะตอบให้',
    [
      [
        { text: '🚀 เปิดระบบทั้งหมด', callback_data: 'do_start' },
        { text: '📊 สถานะระบบ', callback_data: 'do_status' },
      ],
      [
        { text: '💬 คุยกับ AI', callback_data: 'do_chat' },
        { text: '⚙️ OpenClaw', callback_data: 'do_openclaw' },
      ],
    ]
  )
}

async function showStatus(chatId) {
  const now = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
  const autoStatus = state.automation ? '🟢 เปิดอยู่' : '🔴 ปิดอยู่'
  const lastAction = state.lastAgentName
    ? `${state.lastAgentName} เมื่อ ${state.lastAgentTime}`
    : 'ยังไม่มี'
  const llmStatus = await checkLLM()

  return sendWithKeyboard(chatId,
    `📊 <b>สถานะระบบ</b>\n\n` +
    `🕐 ${now}\n` +
    `🤖 Automation: ${autoStatus}\n` +
    `📈 Agents วันนี้: ${state.agentRunCount} ครั้ง\n` +
    `🧠 LLM: ${llmStatus}\n` +
    `⏱ Last action: ${lastAction}\n` +
    `❌ Errors วันนี้: ${state.errorsToday}`,
    [[
      { text: '🔄 รีเฟรช', callback_data: 'do_status' },
      { text: '🏠 เมนูหลัก', callback_data: 'do_menu' },
    ]]
  )
}

async function handleStartSystem(chatId) {
  const alreadyOn = state.automation
  if (!alreadyOn) startAutomation()

  return sendWithKeyboard(chatId,
    alreadyOn
      ? `✅ <b>ระบบทำงานอยู่แล้ว</b>\n\n🥷 47 agents พร้อม\n📅 Scheduler: เปิด\n⚡ Events: เปิด`
      : `✅ <b>ระบบทำงานแล้ว</b>\n\n🥷 47 agents พร้อม\n📅 Scheduler: เปิด\n⚡ Events: เปิด\n\nAuto-check ทุก 10 นาที`,
    [[
      { text: '🛑 หยุดระบบ', callback_data: 'do_stop' },
      { text: '🏠 เมนูหลัก', callback_data: 'do_menu' },
    ]]
  )
}

function handleStopSystem(chatId) {
  stopAutomation()
  return sendWithKeyboard(chatId,
    '🛑 <b>ระบบหยุดแล้ว</b>\n\nScheduler ปิด — agents ยังพร้อมรับคำสั่ง manual',
    [[
      { text: '🚀 เปิดอีกครั้ง', callback_data: 'do_start' },
      { text: '🏠 เมนูหลัก', callback_data: 'do_menu' },
    ]]
  )
}

function showSettings(chatId) {
  return sendWithKeyboard(chatId,
    '⚙️ <b>ตั้งค่า</b>',
    [
      [{ text: '📅 ดู Schedules', callback_data: 'do_schedules' }],
      [{ text: '🔔 เปิด/ปิด แจ้งเตือน', callback_data: 'do_toggle_notif' }],
      [{ text: '🏠 กลับเมนูหลัก', callback_data: 'do_menu' }],
    ]
  )
}

function showSchedules(chatId) {
  const lines = [
    `${state.automation ? '🟢' : '🔴'} Auto Health Check — ทุก 10 นาที (${state.automation ? 'เปิด' : 'ปิด'})`,
    `⏸ FB Group Scan (Kanroku #09) — รอสั่ง manual`,
    `⏸ Lead Pipeline (Gengo #35) — รอสั่ง manual`,
  ].join('\n')

  return sendWithKeyboard(chatId,
    `📅 <b>Schedules</b>\n\n${lines}`,
    [[
      { text: '🔙 ตั้งค่า', callback_data: 'do_settings' },
      { text: '🏠 เมนูหลัก', callback_data: 'do_menu' },
    ]]
  )
}

// ── Intent Detection ───────────────────────────────────────────────────────
function detectIntent(text) {
  const t = text.toLowerCase().trim()

  if (/สถานะ|status/.test(t)) return { type: 'status' }
  if (/^เปิด$|^start$|^เปิดระบบ/.test(t)) return { type: 'start' }
  if (/^หยุด$|^stop$|^ปิดระบบ/.test(t)) return { type: 'stop' }

  const roiMatch = t.match(/(?:roi|คำนวณ|solar)\s*(\d+)\s*(?:kw|kwp)?/)
  if (roiMatch) return { type: 'roi', kwp: parseInt(roiMatch[1]) }

  return { type: 'llm' }
}

// ── Text Handler ───────────────────────────────────────────────────────────
async function handleText(chatId, text) {
  const intent = detectIntent(text)

  if (intent.type === 'status') return showStatus(chatId)
  if (intent.type === 'start') return handleStartSystem(chatId)
  if (intent.type === 'stop') return handleStopSystem(chatId)

  if (intent.type === 'roi') {
    await send(chatId, `💰 <b>คำนวณ ROI ${intent.kwp} kWp...</b>`)
    try {
      const result = await bridge.dispatchAgent('agent-18', { kwp: intent.kwp })
      state.agentRunCount++
      state.lastAgentName = 'Koemon (ROI)'
      state.lastAgentTime = new Date().toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok' })
      return sendWithKeyboard(chatId,
        `💰 <b>ROI Analysis — ${intent.kwp} kWp</b>\n\n${result.message}`,
        [[{ text: '🏠 เมนูหลัก', callback_data: 'do_menu' }]]
      )
    } catch (e) {
      state.errorsToday++
      return send(chatId, `❌ คำนวณไม่ได้: ${e.message}`)
    }
  }

  // Send to LLM
  await sendTyping(chatId)
  const llmResult = await callLLM(text)

  if (!llmResult.ok) {
    const errDetail = llmResult.error ? `\n<code>${llmResult.error}</code>` : ''
    return sendWithKeyboard(chatId,
      `⚠️ <b>AI ออฟไลน์</b> — Ollama ไม่ตอบสนอง${errDetail}\n\nModel: <code>${LLM_MODEL}</code>`,
      [[{ text: '🏠 เมนูหลัก', callback_data: 'do_menu' }]]
    )
  }

  return sendWithKeyboard(chatId,
    `🤖 <b>AI:</b>\n\n${llmResult.text}`,
    [[{ text: '🏠 เมนูหลัก', callback_data: 'do_menu' }]]
  )
}

// ── OpenClaw Control ──────────────────────────────────────────────────────
const OC_GATEWAY = 'http://localhost:18789'

function ocRequest(path) {
  return new Promise(resolve => {
    const url = new URL(path, OC_GATEWAY)
    http.get(url, res => {
      let d = ''; res.on('data', c => d += c)
      res.on('end', () => { try { resolve({ ok: true, data: JSON.parse(d) }) } catch { resolve({ ok: true, data: d }) } })
    }).on('error', e => resolve({ ok: false, error: e.message }))
      .setTimeout(5000, function() { this.destroy(); resolve({ ok: false, error: 'timeout' }) })
  })
}

function showOpenClawMenu(chatId) {
  return sendWithKeyboard(chatId,
    '⚙️ <b>OpenClaw Commander</b>\n\nเลือกคำสั่งที่ต้องการ:',
    [
      [
        { text: '📡 Gateway Status', callback_data: 'oc_status' },
        { text: '🤖 Run Agent', callback_data: 'oc_agents' },
      ],
      [
        { text: '📋 Schedules', callback_data: 'oc_schedules' },
        { text: '🧠 LLM Models', callback_data: 'oc_models' },
      ],
      [
        { text: '🔧 System Health', callback_data: 'oc_health' },
        { text: '🏠 เมนูหลัก', callback_data: 'do_menu' },
      ],
    ]
  )
}

async function ocGatewayStatus(chatId) {
  const r = await ocRequest('/health')
  if (r.ok) {
    return sendWithKeyboard(chatId,
      `📡 <b>OpenClaw Gateway</b>\n\n🟢 Online\n${typeof r.data === 'object' ? JSON.stringify(r.data, null, 2).slice(0, 300) : String(r.data).slice(0, 300)}`,
      [[{ text: '🔙 OpenClaw', callback_data: 'do_openclaw' }, { text: '🏠 เมนูหลัก', callback_data: 'do_menu' }]]
    )
  }
  return sendWithKeyboard(chatId,
    `📡 <b>OpenClaw Gateway</b>\n\n🔴 Offline — ${r.error}\n\nPort: 18789`,
    [[{ text: '🔄 ลองอีก', callback_data: 'oc_status' }, { text: '🔙 OpenClaw', callback_data: 'do_openclaw' }]]
  )
}

async function ocRunAgent(chatId) {
  const agents = [
    { name: 'Kuranosuke #01 (FB Scanner)', id: 'agent-01' },
    { name: 'Kanroku #09 (Group Scan)', id: 'agent-09' },
    { name: 'Jūnai #17 (Lead Score)', id: 'agent-17' },
    { name: 'Gengo #35 (Orchestrator)', id: 'agent-35' },
    { name: 'Mimura #44 (AI Trends)', id: 'agent-44' },
  ]
  return sendWithKeyboard(chatId,
    '🤖 <b>Run Agent</b>\n\nเลือก agent ที่ต้องการรัน:',
    [
      ...agents.map(a => [{ text: `🥷 ${a.name}`, callback_data: `oc_run_${a.id}` }]),
      [{ text: '🔙 OpenClaw', callback_data: 'do_openclaw' }],
    ]
  )
}

async function ocExecAgent(chatId, agentId) {
  await sendTyping(chatId)
  try {
    const result = await bridge.dispatchAgent(agentId, { task: 'manual-trigger', source: 'telegram' })
    state.agentRunCount++
    state.lastAgentName = result.agentName || agentId
    state.lastAgentTime = new Date().toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok' })
    return sendWithKeyboard(chatId,
      `✅ <b>${result.agentName || agentId}</b>\n\n${(result.message || 'Done').slice(0, 500)}`,
      [[{ text: '🤖 Run อีก', callback_data: 'oc_agents' }, { text: '🏠 เมนูหลัก', callback_data: 'do_menu' }]]
    )
  } catch (e) {
    state.errorsToday++
    return sendWithKeyboard(chatId,
      `❌ <b>Agent Error</b>\n\n${e.message}`,
      [[{ text: '🔙 OpenClaw', callback_data: 'do_openclaw' }]]
    )
  }
}

async function ocShowModels(chatId) {
  const llmStatus = await checkLLM()
  return sendWithKeyboard(chatId,
    `🧠 <b>LLM Models</b>\n\n${llmStatus}\nActive: <code>${LLM_MODEL}</code>\nHost: ${OLLAMA_HOST}:${OLLAMA_PORT}`,
    [[{ text: '🔙 OpenClaw', callback_data: 'do_openclaw' }, { text: '🏠 เมนูหลัก', callback_data: 'do_menu' }]]
  )
}

async function ocSystemHealth(chatId) {
  const llm = await checkLLM()
  const gw = await ocRequest('/health')
  const now = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
  return sendWithKeyboard(chatId,
    `🔧 <b>System Health</b>\n\n` +
    `🕐 ${now}\n` +
    `🧠 LLM: ${llm}\n` +
    `📡 Gateway: ${gw.ok ? '🟢 Online' : '🔴 Offline'}\n` +
    `🤖 Automation: ${state.automation ? '🟢 เปิด' : '🔴 ปิด'}\n` +
    `📈 Runs today: ${state.agentRunCount}\n` +
    `❌ Errors: ${state.errorsToday}`,
    [[{ text: '🔄 รีเฟรช', callback_data: 'oc_health' }, { text: '🔙 OpenClaw', callback_data: 'do_openclaw' }]]
  )
}

// ── Callback Handler ───────────────────────────────────────────────────────
async function handleCallback(query) {
  const chatId = query.message?.chat?.id
  const data = query.data
  await answerCallback(query.id)

  switch (data) {
    case 'do_menu':         return showMainMenu(chatId)
    case 'do_start':        return handleStartSystem(chatId)
    case 'do_stop':         return handleStopSystem(chatId)
    case 'do_status':       return showStatus(chatId)
    case 'do_settings':     return showSettings(chatId)
    case 'do_schedules':    return showSchedules(chatId)
    case 'do_toggle_notif': return send(chatId, '🔔 การแจ้งเตือน: <b>เปิดอยู่แล้ว</b>')
    case 'do_chat':
      return send(chatId,
        '💬 <b>โหมดคุยกับ AI</b>\n\nพิมพ์คำถามได้เลย — AI จะตอบภาษาไทยทันที\n\n' +
        'ตัวอย่าง:\n• "roi 50" → คำนวณ ROI 50 kWp\n• "สถานะ" → ดูสถานะระบบ\n• ถามอะไรก็ได้เกี่ยวกับโซลาร์'
      )
    // ── OpenClaw commands ──
    case 'do_openclaw':      return showOpenClawMenu(chatId)
    case 'oc_status':        return ocGatewayStatus(chatId)
    case 'oc_agents':        return ocRunAgent(chatId)
    case 'oc_schedules':     return showSchedules(chatId)
    case 'oc_models':        return ocShowModels(chatId)
    case 'oc_health':        return ocSystemHealth(chatId)
    default:
      // Handle dynamic agent run commands
      if (data?.startsWith('oc_run_')) return ocExecAgent(chatId, data.slice(7))
      log(`Unknown callback: ${data}`)
  }
}

// ── Update Processor ───────────────────────────────────────────────────────
async function processUpdate(update) {
  try {
    if (update.callback_query) {
      await handleCallback(update.callback_query)
      return
    }

    const msg = update.message
    if (!msg || !msg.text) return

    const chatId = msg.chat.id
    const userId = String(msg.from?.id)
    const text = msg.text.trim()

    if (userId !== TONY_ID) {
      await send(chatId, '⛔ ไม่มีสิทธิ์เข้าถึง')
      return
    }

    log(`Msg: ${text.substring(0, 60)}`)

    if (text === '/start' || text === '🏠 เมนูหลัก') {
      return showMainMenu(chatId)
    }

    await handleText(chatId, text)
  } catch (e) {
    log(`processUpdate error: ${e.message}`)
  }
}

// ── Long Polling ───────────────────────────────────────────────────────────
let lastUpdateId = 0

async function poll() {
  try {
    const res = await apiCall('getUpdates', {
      offset: lastUpdateId + 1,
      timeout: 30,
      allowed_updates: ['message', 'callback_query'],
    })

    if (res.ok && res.result?.length) {
      for (const update of res.result) {
        lastUpdateId = update.update_id
        processUpdate(update).catch(e => log(`Error: ${e.message}`))
      }
    }
  } catch (e) {
    if (!e.message?.includes('timeout')) log(`Poll error: ${e.message}`)
    await new Promise(r => setTimeout(r, 3000))
  }
  setImmediate(poll)
}

// ── Startup ─────────────────────────────────────────────────────────────────
async function main() {
  log('SIRINX Bot v4.0 "Simple AI" starting...')
  log(`Agents: ${bridge.AGENTS.length} | LLM: ${OLLAMA_HOST}:${OLLAMA_PORT} (${LLM_MODEL})`)

  startAutomation()

  try {
    await send(TONY_ID,
      `🤖 <b>SIRINX Bot v4.0 พร้อมแล้ว</b>\n\n` +
      `✅ Automation เปิดแล้ว\n` +
      `🥷 ${bridge.AGENTS.length} agents โหลดแล้ว\n` +
      `🧠 LLM: ${LLM_MODEL}\n\n` +
      `พิมพ์อะไรก็ได้ หรือกดปุ่มด้านล่าง:`
    )
    await showMainMenu(TONY_ID)
  } catch (e) {
    log(`Startup notify error: ${e.message}`)
  }

  poll()
}

main().catch(e => { console.error(e); process.exit(1) })

#!/usr/bin/env node
/**
 * SIRINX Solar Energy — Daily Executive Report
 * =============================================
 * Gathers system metrics, git activity, and sends a Thai-language
 * executive summary to Tony (CEO) via Telegram every day.
 *
 * Usage:
 *   node scripts/daily-report.js          — generate & send
 *   node scripts/daily-report.js --dry    — print report, don't send
 *
 * Schedule (Windows Task Scheduler / cron):
 *   0 20 * * * node /path/to/scripts/daily-report.js
 */

const https   = require('https')
const fs      = require('fs')
const path    = require('path')
const { execSync } = require('child_process')

const ROOT = path.join(__dirname, '..')

// ── Load .env ──────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(ROOT, '.env')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+)$/)
    if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
}

// ── Fallback: read bot token from openclaw.json ────────────────────────────
function getTokenFromOpenClaw() {
  try {
    const p = path.join(process.env.USERPROFILE || process.env.HOME, '.openclaw', 'openclaw.json')
    return JSON.parse(fs.readFileSync(p, 'utf8'))?.channels?.telegram?.botToken || null
  } catch { return null }
}

// ── Bangkok time helpers ───────────────────────────────────────────────────
function bangkokNow() {
  return new Date().toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok', hour12: false,
    year: 'numeric', month: 'long', day: 'numeric',
    weekday: 'long',
  })
}

function bangkokDate() {
  return new Date().toLocaleDateString('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
}

// ── System metrics ─────────────────────────────────────────────────────────
function countPages(appDir) {
  try {
    const srcApp = path.join(ROOT, appDir, 'src', 'app')
    if (!fs.existsSync(srcApp)) return 0
    let count = 0
    const walk = (dir) => {
      for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
        if (f.isDirectory()) walk(path.join(dir, f.name))
        else if (f.name === 'page.tsx' || f.name === 'page.ts' || f.name === 'page.js') count++
      }
    }
    walk(srcApp)
    return count
  } catch { return 0 }
}

function countSkills() {
  try {
    const skillsDir = path.join(ROOT, '.claude', 'skills')
    if (!fs.existsSync(skillsDir)) return 0
    return fs.readdirSync(skillsDir).filter(f =>
      fs.statSync(path.join(skillsDir, f)).isDirectory()
    ).length
  } catch { return 0 }
}

function countAgents() {
  // Count from agent-definitions.ts entries
  try {
    const defsPath = path.join(ROOT, 'sirinx-app', 'src', 'agents', 'agent-definitions.ts')
    const content = fs.readFileSync(defsPath, 'utf8')
    return (content.match(/id:\s*['"`][a-z]/g) || []).length
  } catch { return 47 }
}

function getGitLog(since = 'today') {
  try {
    const sinceDate = since === 'today'
      ? new Date().toISOString().split('T')[0]
      : since
    const log = execSync(
      `git -C "${ROOT}" log --since="${sinceDate} 00:00:00" --until="${sinceDate} 23:59:59" --oneline --no-merges`,
      { encoding: 'utf8', timeout: 5000 }
    ).trim()
    return log ? log.split('\n') : []
  } catch { return [] }
}

function checkApiStatus() {
  const envPath = path.join(ROOT, '.env')
  const content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''
  const apis = {
    'Telegram Bot':   /TELEGRAM_BOT_TOKEN=\S/.test(content),
    'Supabase':       /SUPABASE_URL=\S/.test(content) || /NEXT_PUBLIC_SUPABASE_URL=\S/.test(content),
    'Google Gemini':  /GEMINI_API_KEY=\S/.test(content) || /GOOGLE_GEMINI=\S/.test(content),
    'Facebook Page':  /FACEBOOK_PAGE_ACCESS_TOKEN=\S/.test(content) || /FB_PAGE_ACCESS_TOKEN=\S/.test(content),
    'OpenAI':         /OPENAI_API_KEY=sk-/.test(content),
    'Anthropic':      /ANTHROPIC_API_KEY=sk-ant/.test(content),
    'gcloud':         (() => { try { execSync('gcloud auth list --filter=status:ACTIVE --format=value(account) 2>/dev/null', { timeout: 3000 }); return true } catch { return false } })(),
  }
  return apis
}

// ── Telegram sender ────────────────────────────────────────────────────────
function sendTelegram(token, chatId, text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    })
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        const r = JSON.parse(data)
        r.ok ? resolve(r.result) : reject(new Error(`${r.error_code}: ${r.description}`))
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ── Build report ───────────────────────────────────────────────────────────
function buildReport(opts = {}) {
  const {
    completed    = [],
    inProgress   = [],
    tomorrowPlan = [],
    revenueNote  = '',
  } = opts

  const sirinxPages     = countPages('sirinx-app')
  const customerPages   = countPages('sirinx-customer')
  const contractorPages = countPages('sirinx-contractor')
  const skills          = countSkills()
  const agents          = countAgents()
  const apis            = checkApiStatus()
  const commits         = getGitLog()

  const apiLines = Object.entries(apis)
    .map(([name, ok]) => `  ${ok ? '✅' : '❌'} ${name}`)
    .join('\n')

  const commitLines = commits.length
    ? commits.map(c => `  🔧 ${c}`).join('\n')
    : '  (ไม่มี commits วันนี้)'

  const completedLines = completed.length
    ? completed.map(i => `  ✅ ${i}`).join('\n')
    : '  (ไม่มีรายการ)'

  const inProgressLines = inProgress.length
    ? inProgress.map(i => `  🔄 ${i}`).join('\n')
    : '  (ไม่มีรายการ)'

  const tomorrowLines = tomorrowPlan.length
    ? tomorrowPlan.map(i => `  🎯 ${i}`).join('\n')
    : '  (ไม่มีรายการ)'

  return [
    `📊 <b>SIRINX Solar Energy — รายงานประจำวัน</b>`,
    `📅 วันที่: ${bangkokNow()}`,
    ``,
    `✅ <b>สิ่งที่ดำเนินการเสร็จวันนี้:</b>`,
    completedLines,
    ``,
    `🔄 <b>กำลังดำเนินการ:</b>`,
    inProgressLines,
    ``,
    `📈 <b>สถิติระบบ:</b>`,
    `  🌐 เว็บ SIRINX App: ${sirinxPages} หน้า`,
    `  👤 เว็บ Customer Portal: ${customerPages} หน้า`,
    `  🔧 เว็บ Contractor Portal: ${contractorPages} หน้า`,
    `  🤖 AI Agents (47 Ronin): ${agents} ตัว`,
    `  🛠️ Skills: ${skills} skills`,
    ``,
    `🔌 <b>สถานะ API:</b>`,
    apiLines,
    ``,
    commits.length ? `💻 <b>Git Commits วันนี้ (${commits.length}):</b>\n${commitLines}\n` : '',
    `🎯 <b>แผนงานพรุ่งนี้:</b>`,
    tomorrowLines,
    ``,
    revenueNote ? `💰 <b>เป้าหมายรายได้:</b>\n  ${revenueNote}\n` : '',
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🤖 SIRINX AI-WarRoom v10.0 "47 Ronin"`,
    `⏰ ส่งอัตโนมัติ: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', hour12: false })}`,
  ].filter(l => l !== undefined).join('\n')
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  loadEnv()

  const isDry = process.argv.includes('--dry')

  // ── TODAY'S REPORT DATA ────────────────────────────────────────────────
  // Edit these arrays each day OR integrate with a state file
  const todayData = {
    completed: [
      'Telegram Bot แก้ไขสำเร็จ (webhook cleared, polling mode active)',
      'Facebook Page auto-post system สร้างเสร็จ (lib/facebook-poster.js, scripts/fb-post.js, API endpoint)',
      'Facebook Page เชื่อมต่อแล้ว (Page ID: 61576474523275, Access Token configured)',
      'Google Gemini API ผสานรวมเป็น Primary LLM (Free Tier, 1,000 req/day)',
      'Gemini ตั้งค่าเป็น default drafter/reviewer ใน engine',
      'Google Cloud deployment files พร้อม (Dockerfile x3, cloudbuild.yaml, deploy.sh)',
      'GLM-5V-Turbo ปิดใช้งานอย่างสง่างาม (fallback to Gemini)',
      'Supabase เชื่อมต่อสำเร็จ',
      'ตั้งค่า .env files ครบ 6 ไฟล์ทุก project',
      'gcloud CLI authenticated (ton36475@gmail.com)',
    ],
    inProgress: [
      'ตรวจสอบการเริ่มต้น Core system',
      'Google Cloud deployment (รอเลือก domain)',
      'Anthropic/OpenAI API top-up',
    ],
    tomorrowPlan: [
      'Deploy เว็บไซต์ SIRINX ขึ้น Google Cloud',
      'เริ่ม Facebook content campaign สำหรับ solar leads',
      'เปิดใช้งาน Telegram bot สำหรับ real-time system control',
      'แคมเปญ lead generation โซลาร์ครั้งแรก',
    ],
    revenueNote: 'เป้า Q2/2026: 5 โครงการ × ฿2M = ฿10M | Pipeline: 0 → เริ่มสร้างวันพรุ่งนี้',
  }

  const report = buildReport(todayData)

  console.log('\n' + '═'.repeat(60))
  console.log(report.replace(/<[^>]+>/g, ''))  // strip HTML for console
  console.log('═'.repeat(60) + '\n')

  if (isDry) {
    console.log('🔍 Dry run — ไม่ส่ง Telegram')
    return
  }

  const token  = process.env.TELEGRAM_BOT_TOKEN || getTokenFromOpenClaw()
  const chatId = process.env.TELEGRAM_CHAT_ID || '5320654632'

  if (!token) {
    console.error('❌ ไม่พบ TELEGRAM_BOT_TOKEN')
    process.exit(1)
  }

  console.log(`📤 กำลังส่งรายงานไปยัง Tony (chat: ${chatId})...`)
  try {
    const result = await sendTelegram(token, chatId, report)
    console.log(`✅ ส่งสำเร็จ! Message ID: ${result.message_id}`)
  } catch (err) {
    console.error(`❌ ส่งไม่สำเร็จ: ${err.message}`)
    process.exit(1)
  }
}

main()

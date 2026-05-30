#!/usr/bin/env node
/**
 * SIRINX Automation Module
 * ========================
 * Scheduled automation tasks for the SIRINX platform.
 * Handles daily reports, FB post scheduling, system health, lead pipeline.
 *
 * Used by sirinx-bot-v3.js for /auto command and background tasks.
 * Pure Node.js — no npm install required.
 */

'use strict'
const { execSync } = require('child_process')
const fs   = require('fs')
const path = require('path')
const { callLLM, getLLMStatus } = require('./llm-connector')

const ROOT = path.join(__dirname, '..')

// ── Automation task registry ─────────────────────────────────────────────────
const TASKS = {
  'daily-report': {
    name: 'Daily Executive Report',
    emoji: '📊',
    desc: 'สรุปรายงานประจำวัน — git, PM2, system health',
    schedule: '20:00 Bangkok',
  },
  'fb-post': {
    name: 'Facebook Auto Post',
    emoji: '📱',
    desc: 'สร้างและโพสต์ Facebook content อัตโนมัติ',
    schedule: 'Manual / 09:00 Bangkok',
  },
  'lead-scan': {
    name: 'Lead Scanner',
    emoji: '🎯',
    desc: 'สแกน FB Groups หาลูกค้าโซลาร์ B2B',
    schedule: 'Every 6 hours',
  },
  'health-check': {
    name: 'System Health Check',
    emoji: '🏥',
    desc: 'ตรวจสอบ server, PM2, API keys, disk',
    schedule: 'Every 1 hour',
  },
  'ai-brief': {
    name: 'AI Morning Brief',
    emoji: '🤖',
    desc: 'สรุปข่าว AI + solar Thailand ประจำวัน (LLM-powered)',
    schedule: '08:00 Bangkok',
  },
}

// ── Automation state ──────────────────────────────────────────────────────────
const state = {
  enabled: false,
  startedAt: null,
  timers: {},
  log: [],   // { task, ts, success, message }
}

// ── Exec helper ───────────────────────────────────────────────────────────────
function exec(cmd, cwd = ROOT) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', timeout: 30000, stdio: ['pipe','pipe','pipe'] }).trim()
  } catch(e) {
    return `ERROR: ${(e.stderr || e.message).substring(0, 300)}`
  }
}

// ── Log helper ────────────────────────────────────────────────────────────────
function logTask(task, success, message) {
  state.log.unshift({ task, ts: new Date().toISOString(), success, message })
  if (state.log.length > 50) state.log.pop()
}

// ── Task: daily-report ────────────────────────────────────────────────────────
async function runDailyReport() {
  const now = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
  const branch = exec('git branch --show-current')
  const commits = exec('git log --oneline -5 --format="%h %s"')
  const dirty = exec('git status --short')
  const dirtyCount = dirty ? dirty.split('\n').filter(Boolean).length : 0

  let pm2Status = ''
  try {
    const procs = JSON.parse(exec('pm2 jlist 2>nul'))
    pm2Status = procs.map(p => `${p.pm2_env.status === 'online' ? '🟢' : '🔴'} ${p.name}`).join('\n')
  } catch { pm2Status = exec('pm2 list --no-color') }

  const disk = exec('powershell -c "Get-PSDrive C | ForEach-Object { [math]::Round($_.Free/1GB,1).ToString() + \'GB free\' }"')

  const report = [
    `📊 <b>SIRINX Daily Report</b>`,
    `📅 ${now}`,
    ``,
    `🌿 <b>Git:</b> <code>${branch}</code>`,
    `📌 Commits: ${dirtyCount > 0 ? `⚠️ ${dirtyCount} uncommitted` : '✅ Clean'}`,
    `<pre>${commits}</pre>`,
    ``,
    `🔄 <b>PM2:</b>\n${pm2Status}`,
    ``,
    `💾 <b>Disk:</b> ${disk}`,
  ].join('\n')

  logTask('daily-report', true, 'Report generated')
  return report
}

// ── Task: health-check ────────────────────────────────────────────────────────
async function runHealthCheck() {
  const checks = []

  // Node version
  const nodeVer = exec('node --version')
  checks.push(`${nodeVer.startsWith('v') ? '✅' : '❌'} Node.js ${nodeVer}`)

  // PM2
  const pm2Ver = exec('pm2 --version')
  checks.push(`${pm2Ver.match(/^\d/) ? '✅' : '❌'} PM2 ${pm2Ver}`)

  // Git
  const gitStatus = exec('git status --porcelain 2>&1')
  checks.push(`${gitStatus.includes('fatal') ? '❌' : '✅'} Git repo`)

  // Disk
  const freeGB = parseFloat(exec('powershell -c "Get-PSDrive C | ForEach-Object { [math]::Round($_.Free/1GB,1) }"') || '0')
  checks.push(`${freeGB > 5 ? '✅' : '⚠️'} Disk free: ${freeGB}GB`)

  // LLM
  const llm = getLLMStatus()
  checks.push(`${llm.ready ? '✅' : '⚠️'} LLM: ${llm.provider} (${llm.keySource})`)

  // .env.local
  const envPath = path.join(ROOT, 'sirinx-app', '.env.local')
  checks.push(`${fs.existsSync(envPath) ? '✅' : '❌'} .env.local`)

  const result = `🏥 <b>Health Check</b>\n\n${checks.join('\n')}`
  logTask('health-check', true, `${checks.filter(c => c.startsWith('✅')).length}/${checks.length} checks passed`)
  return result
}

// ── Task: ai-brief (LLM-powered) ─────────────────────────────────────────────
async function runAIBrief() {
  const llm = getLLMStatus()
  if (!llm.ready) {
    return '⚠️ <b>AI Brief</b>\n\nไม่พบ API key — ตั้งค่า ANTHROPIC_API_KEY หรือ GEMINI_API_KEY ใน .env.local'
  }

  const prompt = `วันนี้ ${new Date().toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

สรุปประเด็นสำคัญสำหรับ CEO บริษัท SIRINX Solar Energy ไทย:
1. เทรนด์ AI ที่น่าสนใจสำหรับธุรกิจโซลาร์
2. ตลาดโซลาร์เซลล์ประเทศไทย B2B
3. คำแนะนำ action item 3 ข้อสำหรับวันนี้

ตอบสั้นกระชับ ไม่เกิน 200 คำ เน้นข้อมูลที่ actionable`

  const text = await callLLM(prompt, { maxTokens: 512 })
  const brief = `🤖 <b>AI Morning Brief</b>\n\n${text}`
  logTask('ai-brief', true, 'AI brief generated')
  return brief
}

// ── Task: lead-scan stub ──────────────────────────────────────────────────────
async function runLeadScan() {
  // Stub — real implementation uses agent-09 (Kanroku) and agent-10 (Kyudayu)
  const msg = [
    `🎯 <b>Lead Scanner</b>`,
    ``,
    `▶️ Kanroku (FB Group Scanner) — scanning...`,
    `▶️ Kyudayu (FB Comment Scanner) — scanning...`,
    ``,
    `ℹ️ ใช้ /pipeline fb-scan เพื่อรัน agent pipeline แบบ interactive`,
    `หรือ /agent kanroku สำหรับ FB Group scan`,
  ].join('\n')

  logTask('lead-scan', true, 'Lead scan dispatched via agent pipeline')
  return msg
}

// ── Task dispatcher ───────────────────────────────────────────────────────────
async function runTask(taskId) {
  const task = TASKS[taskId]
  if (!task) throw new Error(`Unknown task: ${taskId}`)

  switch (taskId) {
    case 'daily-report': return runDailyReport()
    case 'health-check': return runHealthCheck()
    case 'ai-brief':     return runAIBrief()
    case 'lead-scan':    return runLeadScan()
    case 'fb-post':
      return `📱 <b>FB Auto Post</b>\n\nใช้ /exec node scripts/fb-post.js เพื่อโพสต์\nหรือดู Facebook pipeline: /pipeline fb-scan`
    default:
      return `⚠️ Task "${taskId}" ยังไม่ได้ implement`
  }
}

// ── Start scheduled automation ────────────────────────────────────────────────
function startAutomation(onResult) {
  if (state.enabled) return '⚠️ Automation กำลังทำงานอยู่แล้ว'

  state.enabled = true
  state.startedAt = new Date().toISOString()

  // Health check every 60 minutes
  state.timers['health-check'] = setInterval(async () => {
    try {
      const result = await runHealthCheck()
      if (onResult) onResult('health-check', result)
    } catch(e) { logTask('health-check', false, e.message) }
  }, 60 * 60 * 1000)

  // Daily report at 20:00 Bangkok — check every minute
  state.timers['daily-report-scheduler'] = setInterval(async () => {
    const now = new Date()
    const bkk = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
    if (bkk.getHours() === 20 && bkk.getMinutes() === 0) {
      try {
        const result = await runDailyReport()
        if (onResult) onResult('daily-report', result)
      } catch(e) { logTask('daily-report', false, e.message) }
    }
  }, 60 * 1000)

  return `✅ Automation เริ่มทำงาน\n⏰ Health check: ทุก 60 นาที\n📊 Daily report: 20:00 น. (Bangkok)`
}

// ── Stop scheduled automation ─────────────────────────────────────────────────
function stopAutomation() {
  if (!state.enabled) return '⚠️ Automation ไม่ได้รันอยู่'

  for (const [key, timer] of Object.entries(state.timers)) {
    clearInterval(timer)
    delete state.timers[key]
  }
  state.enabled = false
  return '🛑 Automation หยุดทำงาน'
}

// ── Get automation status ─────────────────────────────────────────────────────
function getStatus() {
  const llm = getLLMStatus()
  const recentLog = state.log.slice(0, 5)
    .map(l => `${l.success ? '✅' : '❌'} ${l.task} — ${new Date(l.ts).toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok' })}`)
    .join('\n')

  return [
    `⚙️ <b>Automation Status</b>`,
    ``,
    `🔄 State: ${state.enabled ? '🟢 Running' : '🔴 Stopped'}`,
    state.startedAt ? `⏱ Started: ${new Date(state.startedAt).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}` : '',
    ``,
    `🤖 LLM: ${llm.ready ? `✅ ${llm.provider}` : '❌ No API key'}`,
    ``,
    `📋 <b>Available Tasks:</b>`,
    ...Object.entries(TASKS).map(([id, t]) => `${t.emoji} <b>${id}</b> — ${t.desc}`),
    ``,
    recentLog ? `📜 <b>Recent (last 5):</b>\n${recentLog}` : '📜 ยังไม่มี task log',
  ].filter(Boolean).join('\n')
}

module.exports = { TASKS, runTask, startAutomation, stopAutomation, getStatus, getLLMStatus }

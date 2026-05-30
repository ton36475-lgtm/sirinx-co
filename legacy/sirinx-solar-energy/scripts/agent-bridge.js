#!/usr/bin/env node
/**
 * SIRINX 47 Ronin — Agent Bridge for Telegram Bot
 * =================================================
 * Lightweight agent dispatcher that routes Telegram commands
 * to the 47 Ronin agent system. Pure Node.js, no dependencies.
 *
 * Architecture:
 *   Telegram Bot → Agent Bridge → Agent Handler → Result
 *
 * Each agent has:
 *   - id, name, codename, layer, type, description
 *   - handler function (real implementation or stub)
 *   - dependencies (for pipeline routing)
 */

'use strict'
const https = require('https')
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const PROJECT_DIR = path.join(__dirname, '..')
const APP_DIR = path.join(PROJECT_DIR, 'sirinx-app')

// ── Agent Definitions (mirrored from sirinx-app/src/agents/) ───────────────
const AGENTS = [
  // L1 Perception
  { id: 'agent-01', name: 'Kuranosuke', codename: 'kuranosuke', layer: 'L1', type: 'pv-monitor', desc: 'Solar PV production monitoring & anomaly detection', emoji: '☀️' },
  { id: 'agent-02', name: 'Chikara', codename: 'chikara', layer: 'L1', type: 'battery-monitor', desc: 'Battery state-of-charge & health tracking', emoji: '🔋' },
  { id: 'agent-03', name: 'Soemon', codename: 'soemon', layer: 'L1', type: 'weather-monitor', desc: 'Weather & solar irradiance data collection', emoji: '🌤' },
  { id: 'agent-04', name: 'Gengoemon', codename: 'gengoemon', layer: 'L1', type: 'grid-tariff', desc: 'Grid status & real-time tariff monitoring', emoji: '⚡' },
  { id: 'agent-05', name: 'Yahei', codename: 'yahei', layer: 'L1', type: 'site-survey', desc: 'Installation site survey & geo-mapping', emoji: '📍' },
  { id: 'agent-06', name: 'Yasubei', codename: 'yasubei', layer: 'L1', type: 'customer-usage', desc: 'Customer electricity consumption patterns', emoji: '📊' },
  { id: 'agent-07', name: 'Chuzaemon', codename: 'chuzaemon', layer: 'L1', type: 'maintenance-history', desc: 'Maintenance history log aggregation', emoji: '🔧' },
  { id: 'agent-08', name: 'Sawaemon', codename: 'sawaemon', layer: 'L1', type: 'contractor-perf', desc: 'Contractor rating & SLA tracking', emoji: '👷' },
  { id: 'agent-09', name: 'Kanroku', codename: 'kanroku', layer: 'L1', type: 'fb-group-scanner', desc: 'Facebook group scanning for solar leads', emoji: '👥' },
  { id: 'agent-10', name: 'Kyudayu', codename: 'kyudayu', layer: 'L1', type: 'fb-comment-scanner', desc: 'Facebook ad comment lead extraction', emoji: '💬' },
  { id: 'agent-11', name: 'Magokuro', codename: 'magokuro', layer: 'L1', type: 'tiktok-scanner', desc: 'TikTok solar content monitoring', emoji: '🎵' },
  { id: 'agent-12', name: 'Genzo', codename: 'genzo', layer: 'L1', type: 'instagram-scanner', desc: 'Instagram hashtag & reel scanning', emoji: '📸' },
  { id: 'agent-13', name: 'Matanojo', codename: 'matanojo', layer: 'L1', type: 'youtube-scanner', desc: 'YouTube solar channel mining', emoji: '🎬' },
  { id: 'agent-14', name: 'Sukeemon', codename: 'sukeemon', layer: 'L1', type: 'property-scanner', desc: 'Property listing rooftop scoring', emoji: '🏢' },
  { id: 'agent-15', name: 'Kazuemon', codename: 'kazuemon', layer: 'L1', type: 'google-maps', desc: 'Google Maps business scanner', emoji: '🗺' },
  { id: 'agent-16', name: "Kin'emon", codename: 'kinemon', layer: 'L1', type: 'multi-bot-coord', desc: 'L1 sub-bot orchestration coordinator', emoji: '🤖' },
  // L2 Analysis
  { id: 'agent-17', name: 'Junai', codename: 'junai', layer: 'L2', type: 'degradation-analysis', desc: 'Panel degradation modeling & RUL', emoji: '📉' },
  { id: 'agent-18', name: 'Koemon', codename: 'koemon', layer: 'L2', type: 'financial-analysis', desc: 'ROI, payback, NPV calculation', emoji: '💰' },
  { id: 'agent-19', name: 'Okaemon', codename: 'okaemon', layer: 'L2', type: 'tax-optimization', desc: 'Thai BOI tax incentive optimization', emoji: '🏦' },
  { id: 'agent-20', name: 'Magodayu', codename: 'magodayu', layer: 'L2', type: 'production-forecast', desc: '12-month solar production forecasting', emoji: '📈' },
  { id: 'agent-21', name: 'Sadaemon', codename: 'sadaemon', layer: 'L2', type: 'battery-optimizer', desc: 'Battery charge/discharge optimization', emoji: '🔌' },
  { id: 'agent-22', name: 'Tozaemon', codename: 'tozaemon', layer: 'L2', type: 'low-prod-detection', desc: 'Underperforming panel anomaly detection', emoji: '⚠️' },
  { id: 'agent-23', name: 'Goroemon', codename: 'goroemon', layer: 'L2', type: 'cash-flow-health', desc: 'Payment health & churn prediction', emoji: '💳' },
  { id: 'agent-24', name: 'Sezaemon', codename: 'sezaemon', layer: 'L2', type: 'lead-qualification', desc: 'BANT lead scoring (1-100)', emoji: '🎯' },
  { id: 'agent-25', name: 'Jurozaemon', codename: 'jurozaemon', layer: 'L2', type: 'competitor-intel', desc: 'Competitor pricing & market intel', emoji: '🔍' },
  // L3 Decision
  { id: 'agent-26', name: 'Kihei', codename: 'kihei', layer: 'L3', type: 'proposal-generator', desc: 'Full solar proposal generation (PDF)', emoji: '📄' },
  { id: 'agent-27', name: 'Jujiro', codename: 'jujiro', layer: 'L3', type: 'service-recommender', desc: 'AI service package recommendation', emoji: '🎁' },
  { id: 'agent-28', name: 'Shinrokuro', codename: 'shinrokuro', layer: 'L3', type: 'job-posting', desc: 'Auto-post installation jobs', emoji: '📋' },
  { id: 'agent-29', name: 'Kansuke', codename: 'kansuke', layer: 'L3', type: 'bid-evaluator', desc: 'Contractor bid scoring', emoji: '⚖️' },
  { id: 'agent-30', name: 'Saburobei', codename: 'saburobei', layer: 'L3', type: 'promotion-engine', desc: 'Dynamic promotion & discount engine', emoji: '🏷' },
  { id: 'agent-31', name: 'Hannojo', codename: 'hannojo', layer: 'L3', type: 'notification', desc: 'Multi-channel notifications', emoji: '🔔' },
  { id: 'agent-32', name: 'Muramatsu', codename: 'muramatsu', layer: 'L3', type: 'verification', desc: 'Output quality verification', emoji: '✅' },
  { id: 'agent-33', name: 'Sandayu', codename: 'sandayu', layer: 'L3', type: 'content-request', desc: 'Social media content brief generation', emoji: '✍️' },
  { id: 'agent-34', name: 'Densuke', codename: 'densuke', layer: 'L3', type: 'email-marketing', desc: 'Personalized email campaigns', emoji: '📧' },
  { id: 'agent-43', name: 'Yasoemon', codename: 'yasoemon', layer: 'L3', type: 'security', desc: 'API access control & rate limiting', emoji: '🛡' },
  // L4 Coordination
  { id: 'agent-35', name: 'Gengo', codename: 'gengo', layer: 'L4', type: 'orchestrator', desc: '★ Master orchestrator — pipeline coordination', emoji: '🎯' },
  { id: 'agent-36', name: 'Emoshichi', codename: 'emoshichi', layer: 'L4', type: 'customer-portal', desc: 'Customer portal data sync', emoji: '👤' },
  { id: 'agent-37', name: 'Shinzaemon', codename: 'shinzaemon', layer: 'L4', type: 'core-dashboard', desc: 'Admin dashboard KPI aggregation', emoji: '📊' },
  { id: 'agent-38', name: 'Tadashichi', codename: 'tadashichi', layer: 'L4', type: 'contractor-portal', desc: 'Contractor job dispatch & tracking', emoji: '🏗' },
  { id: 'agent-39', name: 'Isuke', codename: 'isuke', layer: 'L4', type: 'growth-acquisition', desc: 'Growth: referral, upsell, expansion', emoji: '🚀' },
  { id: 'agent-40', name: 'Yazaemon', codename: 'yazaemon', layer: 'L4', type: 'decision-router', desc: 'Smart routing to L3 agent pipelines', emoji: '🔀' },
  { id: 'agent-41', name: 'Juheiji', codename: 'juheiji', layer: 'L4', type: 'state-manager', desc: 'Supabase-backed distributed state', emoji: '💾' },
  { id: 'agent-42', name: 'Yogoro', codename: 'yogoro', layer: 'L4', type: 'learning-optimization', desc: 'RL-based continuous learning', emoji: '🧠' },
  // L5 Research
  { id: 'agent-44', name: 'Mimura', codename: 'mimura', layer: 'L5', type: 'ai-trend-scanner', desc: 'AI/ML model trend scanning', emoji: '🔬' },
  { id: 'agent-45', name: 'Yokogawa', codename: 'yokogawa', layer: 'L5', type: 'code-evolution', desc: 'Dependency health & upgrade proposals', emoji: '🧬' },
  { id: 'agent-46', name: 'Kayano', codename: 'kayano', layer: 'L5', type: 'benchmark-research', desc: 'Performance benchmarks', emoji: '🏋️' },
  { id: 'agent-47', name: 'Terasaka', codename: 'terasaka', layer: 'L5', type: 'integration-discovery', desc: 'New API/MCP integration discovery', emoji: '🔗' },
  // Chatbot
  { id: 'chatbot-kai', name: 'Kai', codename: 'kai', layer: 'Chatbot', type: 'chatbot', desc: 'Customer-facing AI chatbot (5-step CoT)', emoji: '💬' },
]

// ── Layer grouping ─────────────────────────────────────────────────────────
const LAYERS = {
  L1: { name: 'Perception', emoji: '👁', count: 16, tokenBudget: '4K' },
  L2: { name: 'Analysis', emoji: '🧮', count: 9, tokenBudget: '8K' },
  L3: { name: 'Decision', emoji: '⚡', count: 10, tokenBudget: '16K' },
  L4: { name: 'Coordination', emoji: '🎯', count: 8, tokenBudget: '32K' },
  L5: { name: 'Research', emoji: '🔬', count: 4, tokenBudget: '128K' },
  Chatbot: { name: 'Chatbot', emoji: '💬', count: 1, tokenBudget: '16K' },
}

// ── Shell exec helper ──────────────────────────────────────────────────────
function exec(cmd, cwd = PROJECT_DIR) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', timeout: 30000, stdio: ['pipe','pipe','pipe'] }).trim()
  } catch (e) {
    return `ERROR: ${e.stderr || e.message}`.substring(0, 500)
  }
}

// ── Agent Event Log (in-memory ring buffer) ────────────────────────────────
const EVENT_LOG = []
const MAX_EVENTS = 100

function logEvent(agentId, type, data) {
  const event = {
    agentId,
    type,
    data,
    timestamp: new Date().toISOString(),
  }
  EVENT_LOG.push(event)
  if (EVENT_LOG.length > MAX_EVENTS) EVENT_LOG.shift()
  return event
}

// ── Agent Handlers (real implementations) ──────────────────────────────────
// Each handler returns { success, data, message }
// "Real" handlers do actual work; others return stub with useful info

const agentHandlers = {
  // ── L1: Facebook Group Scanner (Kanroku #09) ─────────────────────────────
  'agent-09': async (payload) => {
    const pageId = process.env.FACEBOOK_PAGE_ID || '1079349678575494'
    const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || process.env.FACEBOOK_PAGE_TOKEN
    if (!token) return { success: false, message: 'Facebook token not configured' }

    try {
      const url = `https://graph.facebook.com/v25.0/${pageId}/feed?fields=id,message,created_time,likes.summary(true),comments.summary(true)&limit=5&access_token=${token}`
      const data = await httpGet(url)
      if (data.error) return { success: false, message: `FB API: ${data.error.message}` }

      const posts = (data.data || []).map(p => ({
        id: p.id,
        text: (p.message || '').substring(0, 80),
        date: p.created_time,
        likes: p.likes?.summary?.total_count || 0,
        comments: p.comments?.summary?.total_count || 0,
      }))

      return {
        success: true,
        data: { posts, total: posts.length },
        message: `Scanned ${posts.length} recent posts. Top engagement: ${Math.max(...posts.map(p => p.likes + p.comments))} interactions`,
      }
    } catch (e) {
      return { success: false, message: e.message }
    }
  },

  // ── L1: System Monitor (mapped from PV Monitor #01) ──────────────────────
  'agent-01': async () => {
    const uptime = exec('powershell -c "(Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime | ForEach-Object { $_.Days.ToString() + \'d \' + $_.Hours.ToString() + \'h\' }"')
    const nodeVer = exec('node --version')
    const branch = exec('git branch --show-current')
    const commit = exec('git log -1 --format="%h %s"')
    const dirty = exec('git status --porcelain')
    const dirtyCount = dirty ? dirty.split('\n').length : 0

    let pm2Info = 'unknown'
    try {
      const procs = JSON.parse(exec('pm2 jlist 2>nul'))
      const online = procs.filter(p => p.pm2_env.status === 'online').length
      pm2Info = `${online}/${procs.length} online`
    } catch {}

    return {
      success: true,
      data: { uptime, nodeVer, branch, commit, dirtyCount, pm2Info },
      message: `System up ${uptime} | Node ${nodeVer} | ${branch}:${commit} | ${dirtyCount} uncommitted | PM2: ${pm2Info}`,
    }
  },

  // ── L2: Financial Analysis (Koemon #18) ──────────────────────────────────
  'agent-18': async (payload) => {
    const { kwp, billPerMonth, panelCost } = payload || {}
    const kw = kwp || 10
    const bill = billPerMonth || 50000
    const cost = panelCost || (kw * 25000) // ~25K/kWp average

    const monthlyProduction = kw * 120 // 120 kWh/kWp/month average in Thailand
    const tariff = 4.2 // THB/kWh average
    const monthlySavings = monthlyProduction * tariff
    const paybackMonths = Math.ceil(cost / monthlySavings)
    const paybackYears = (paybackMonths / 12).toFixed(1)
    const roi25Year = ((monthlySavings * 12 * 25 - cost) / cost * 100).toFixed(0)
    const npv = Math.round(monthlySavings * 12 * 15 - cost) // simplified 15-year NPV

    return {
      success: true,
      data: { kwp: kw, cost, monthlySavings: Math.round(monthlySavings), paybackYears, roi25Year, npv },
      message: `${kw} kWp system | Cost: ${(cost/1000).toFixed(0)}K THB | Monthly savings: ${Math.round(monthlySavings).toLocaleString()} THB | Payback: ${paybackYears} years | ROI(25yr): ${roi25Year}%`,
    }
  },

  // ── L2: Lead Qualification (Sezaemon #24) ────────────────────────────────
  'agent-24': async (payload) => {
    const { name, bill, location, urgency } = payload || {}
    let score = 50 // base
    if (bill && bill > 50000) score += 20
    if (bill && bill > 100000) score += 10
    if (location) score += 5
    if (urgency === 'high') score += 15
    score = Math.min(score, 100)

    const grade = score >= 80 ? 'A (Hot)' : score >= 60 ? 'B (Warm)' : score >= 40 ? 'C (Nurture)' : 'D (Cold)'

    return {
      success: true,
      data: { score, grade, factors: { bill, location, urgency } },
      message: `Lead Score: ${score}/100 — Grade ${grade}`,
    }
  },

  // ── L3: Notification Agent (Hannojo #31) ─────────────────────────────────
  'agent-31': async (payload) => {
    const { channel, message } = payload || {}
    if (channel === 'telegram') {
      // Already in Telegram, just acknowledge
      return { success: true, message: `Notification queued for Telegram: "${(message || '').substring(0, 50)}"` }
    }
    return { success: true, message: `Notification agent ready. Channels: Telegram, LINE OA, Email, SMS` }
  },

  // ── L4: Master Orchestrator (Gengo #35) ──────────────────────────────────
  'agent-35': async (payload) => {
    const { task, pipeline } = payload || {}

    // Show available pipelines
    const pipelines = [
      { name: 'lead-to-proposal', steps: 'FB Scan → Lead Score → Financial Analysis → Proposal Gen', agents: '#09→#24→#18→#26' },
      { name: 'system-health', steps: 'PV Monitor → Degradation → Low Prod Detection → Notification', agents: '#01→#17→#22→#31' },
      { name: 'content-pipeline', steps: 'Social Scan → Content Request → Verification → Notification', agents: '#09-13→#33→#32→#31' },
      { name: 'competitor-analysis', steps: 'Competitor Intel → Promotion Engine → Decision Router', agents: '#25→#30→#40' },
    ]

    if (pipeline) {
      const found = pipelines.find(p => p.name === pipeline)
      if (found) {
        logEvent('agent-35', 'pipeline.started', { pipeline: found.name })
        return {
          success: true,
          data: { pipeline: found },
          message: `Pipeline "${found.name}" initiated\nSteps: ${found.steps}\nAgents: ${found.agents}`,
        }
      }
    }

    return {
      success: true,
      data: { pipelines },
      message: `Orchestrator ready. ${pipelines.length} pipelines available:\n` +
        pipelines.map(p => `  • ${p.name}: ${p.steps}`).join('\n'),
    }
  },

  // ── L5: AI Trend Scanner (Mimura #44) ────────────────────────────────────
  'agent-44': async () => {
    // Check recent git activity as proxy for "code trends"
    const recentCommits = exec('git log --oneline -5 --format="%h %s (%cr)"')
    const packageJson = path.join(APP_DIR, 'package.json')
    let deps = {}
    try { deps = JSON.parse(fs.readFileSync(packageJson, 'utf8')).dependencies || {} } catch {}

    const keyDeps = ['next', 'react', 'typescript', 'tailwindcss']
      .filter(d => deps[d])
      .map(d => `${d}@${deps[d]}`)

    return {
      success: true,
      data: { recentCommits, keyDeps },
      message: `Stack: ${keyDeps.join(', ')}\nRecent activity:\n${recentCommits}`,
    }
  },
}

// ── HTTP helper ────────────────────────────────────────────────────────────
function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let d = ''; res.on('data', c => d += c)
      res.on('end', () => { try { resolve(JSON.parse(d)) } catch(e) { reject(e) } })
    }).on('error', reject)
  })
}

// ── Main dispatch function ─────────────────────────────────────────────────
async function dispatchAgent(agentId, payload = {}) {
  const agent = AGENTS.find(a => a.id === agentId)
  if (!agent) return { success: false, error: `Unknown agent: ${agentId}` }

  const startMs = Date.now()
  logEvent(agentId, 'agent.started', { payload })

  let result
  if (agentHandlers[agentId]) {
    // Real handler
    result = await agentHandlers[agentId](payload)
  } else {
    // Stub handler
    result = {
      success: true,
      message: `${agent.emoji} ${agent.name} (${agent.layer}) — ${agent.desc}\n\nAgent registered but implementation pending. Use /pipeline to run full agent pipelines.`,
      data: { status: 'stub' },
    }
  }

  const processingMs = Date.now() - startMs
  logEvent(agentId, result.success ? 'agent.completed' : 'agent.failed', { processingMs, ...result.data })

  return {
    ...result,
    agentId,
    agentName: agent.name,
    layer: agent.layer,
    processingMs,
    emoji: agent.emoji,
  }
}

// ── Pipeline execution ─────────────────────────────────────────────────────
async function runPipeline(pipelineName, payload = {}) {
  const pipelines = {
    'lead-to-proposal': ['agent-09', 'agent-24', 'agent-18', 'agent-26'],
    'system-health': ['agent-01', 'agent-17', 'agent-22', 'agent-31'],
    'content-pipeline': ['agent-09', 'agent-33', 'agent-32', 'agent-31'],
    'quick-roi': ['agent-18'],
    'fb-scan': ['agent-09', 'agent-24'],
  }

  const steps = pipelines[pipelineName]
  if (!steps) return { success: false, error: `Unknown pipeline: ${pipelineName}` }

  logEvent('agent-35', 'pipeline.started', { pipeline: pipelineName, steps })

  const results = []
  let currentPayload = { ...payload }

  for (const agentId of steps) {
    const result = await dispatchAgent(agentId, currentPayload)
    results.push(result)
    // Pass data forward through pipeline
    if (result.data) {
      currentPayload = { ...currentPayload, ...result.data }
    }
    if (!result.success) break
  }

  logEvent('agent-35', 'pipeline.completed', { pipeline: pipelineName, stepsCompleted: results.length })

  return {
    pipeline: pipelineName,
    steps: results,
    success: results.every(r => r.success),
    totalMs: results.reduce((sum, r) => sum + (r.processingMs || 0), 0),
  }
}

// ── Exports ────────────────────────────────────────────────────────────────
module.exports = {
  AGENTS,
  LAYERS,
  EVENT_LOG,
  dispatchAgent,
  runPipeline,
  logEvent,
  getAgentsByLayer: (layer) => AGENTS.filter(a => a.layer === layer),
  getAgentById: (id) => AGENTS.find(a => a.id === id),
  getAgentByCodename: (codename) => AGENTS.find(a => a.codename === codename),
}

#!/usr/bin/env node
/**
 * SIRINX Agent Scheduler — Cron-based agent triggers
 * Runs scheduled agent pipelines independently of the Telegram bot
 */
'use strict'

const path = require('path')
const bridge = require('./agent-bridge')

const log = msg => console.log(`[${new Date().toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok' })}] Scheduler: ${msg}`)

log(`Loaded ${bridge.AGENTS.length} agents`)

// ── Schedule definitions ──
const schedules = [
  { name: 'system-health',    intervalMs: 15 * 60 * 1000, agentId: 'agent-01', desc: 'System health check' },
  { name: 'orchestrator-ping', intervalMs: 30 * 60 * 1000, agentId: 'agent-35', desc: 'Orchestrator status' },
  { name: 'ai-trends',        intervalMs: 6 * 60 * 60 * 1000, agentId: 'agent-44', desc: 'AI trend scan' },
]

async function runSchedule(schedule) {
  try {
    log(`Running: ${schedule.name} (${schedule.desc})`)
    const result = await bridge.dispatchAgent(schedule.agentId, { task: 'scheduled', source: 'scheduler' })
    log(`Done: ${schedule.name} — ${(result.message || 'ok').slice(0, 80)}`)
  } catch (e) {
    log(`Error: ${schedule.name} — ${e.message}`)
  }
}

// Start all schedules
for (const s of schedules) {
  // Run once on startup
  setTimeout(() => runSchedule(s), 5000 + Math.random() * 10000)
  // Then on interval
  setInterval(() => runSchedule(s), s.intervalMs)
  log(`Scheduled: ${s.name} every ${s.intervalMs / 60000} min`)
}

log('Agent Scheduler active')

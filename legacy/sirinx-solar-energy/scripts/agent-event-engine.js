#!/usr/bin/env node
/**
 * SIRINX Agent Event Engine — Real-time event processing
 * Listens for system events and dispatches agents accordingly
 */
'use strict'

const path = require('path')
const bridge = require('./agent-bridge')

const log = msg => console.log(`[${new Date().toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok' })}] EventEngine: ${msg}`)

log(`Loaded ${bridge.AGENTS.length} agents`)

// ── Event → Agent routing ──
const eventRoutes = {
  'lead.detected':    'agent-24',  // Lead qualification
  'system.alert':     'agent-31',  // Notification
  'pipeline.request': 'agent-35',  // Master orchestrator
  'roi.request':      'agent-18',  // Financial analysis
}

// ── Internal event bus (simple EventEmitter) ──
const { EventEmitter } = require('events')
const bus = new EventEmitter()
bus.setMaxListeners(50)

async function handleEvent(eventType, payload) {
  const agentId = eventRoutes[eventType]
  if (!agentId) {
    log(`No route for event: ${eventType}`)
    return
  }
  try {
    log(`Event: ${eventType} → ${agentId}`)
    const result = await bridge.dispatchAgent(agentId, { ...payload, source: 'event-engine' })
    bridge.logEvent(agentId, 'event.processed', { eventType, success: result.success })
    log(`Processed: ${eventType} — ${(result.message || 'ok').slice(0, 80)}`)
  } catch (e) {
    log(`Error processing ${eventType}: ${e.message}`)
  }
}

bus.on('event', (type, payload) => handleEvent(type, payload))

// ── Expose emit for other modules ──
module.exports = { bus, emit: (type, payload) => bus.emit('event', type, payload) }

log('Agent Event Engine active — listening for events')

// Heartbeat
setInterval(() => {
  log(`Heartbeat — ${Object.keys(eventRoutes).length} event routes active`)
}, 30 * 60 * 1000)

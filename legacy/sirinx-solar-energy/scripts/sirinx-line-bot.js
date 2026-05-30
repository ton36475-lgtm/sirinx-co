#!/usr/bin/env node
/**
 * SIRINX LINE Bot — Stub
 * LINE messaging integration (pending full implementation)
 */
'use strict'

const log = msg => console.log(`[${new Date().toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok' })}] LINE Bot: ${msg}`)

log('LINE Bot stub running — waiting for LINE_CHANNEL_ACCESS_TOKEN configuration')

// Keep process alive
setInterval(() => {
  log('Heartbeat — LINE Bot waiting for config')
}, 60 * 60 * 1000) // log every hour

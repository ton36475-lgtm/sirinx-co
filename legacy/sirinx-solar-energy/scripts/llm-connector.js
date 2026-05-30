#!/usr/bin/env node
/**
 * SIRINX LLM Connector
 * ====================
 * Unified API connector for LLM providers (Anthropic Claude, xAI Grok, Gemini).
 * Used by sirinx-automation.js and the bot for AI-powered responses.
 *
 * Priority order:
 *   1. Anthropic Claude (ANTHROPIC_API_KEY)
 *   2. xAI Grok via OpenClaw (from ~/.openclaw/openclaw.json)
 *   3. Gemini (GEMINI_API_KEY / GOOGLE_AI_API_KEY)
 *
 * Pure Node.js — no npm install required.
 */

'use strict'
const https = require('https')
const http  = require('http')
const fs    = require('fs')
const path  = require('path')

// ── Load OpenClaw config for xAI key ────────────────────────────────────────
function getOpenClawXaiKey() {
  try {
    const p = path.join(process.env.USERPROFILE || process.env.HOME, '.openclaw', 'openclaw.json')
    const cfg = JSON.parse(fs.readFileSync(p, 'utf8'))
    const profiles = cfg?.auth?.profiles || {}
    for (const v of Object.values(profiles)) {
      if (v.provider === 'xai' && v.api_key) return v.api_key
    }
    return null
  } catch { return null }
}

// ── Determine active provider ────────────────────────────────────────────────
function getProvider() {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
  if (getOpenClawXaiKey() || process.env.XAI_API_KEY) return 'xai'
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY) return 'gemini'
  // Local Ollama fallback — always available when Ollama is running
  return 'ollama'
}

// ── HTTP POST helper ─────────────────────────────────────────────────────────
function httpPost(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body)
    const opts = {
      hostname, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), ...headers }
    }
    const req = https.request(opts, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) })
        } catch(e) { reject(new Error(`JSON parse error: ${d.substring(0, 200)}`)) }
      })
    })
    req.on('error', reject)
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('LLM request timeout')) })
    req.write(payload)
    req.end()
  })
}

// ── Anthropic Claude ─────────────────────────────────────────────────────────
async function callAnthropic(prompt, options = {}) {
  const model   = options.model   || 'claude-haiku-4-5-20251001'
  const maxTokens = options.maxTokens || 1024
  const system  = options.system  || 'คุณเป็นผู้ช่วย AI ของบริษัท SIRINX Solar Energy ตอบเป็นภาษาไทยสั้นกระชับ'

  const res = await httpPost('api.anthropic.com', '/v1/messages',
    {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    {
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: prompt }],
    }
  )

  if (res.status !== 200) throw new Error(`Anthropic API error ${res.status}: ${JSON.stringify(res.data).substring(0, 200)}`)
  return res.data.content?.[0]?.text || ''
}

// ── xAI Grok ─────────────────────────────────────────────────────────────────
async function callXai(prompt, options = {}) {
  const apiKey = process.env.XAI_API_KEY || getOpenClawXaiKey()
  if (!apiKey) throw new Error('No xAI API key found')

  const model = options.model || 'grok-3'
  const maxTokens = options.maxTokens || 1024

  const res = await httpPost('api.x.ai', '/v1/chat/completions',
    { Authorization: `Bearer ${apiKey}` },
    {
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: options.system || 'คุณเป็นผู้ช่วย AI ของบริษัท SIRINX Solar Energy' },
        { role: 'user', content: prompt }
      ],
    }
  )

  if (res.status !== 200) throw new Error(`xAI API error ${res.status}: ${JSON.stringify(res.data).substring(0, 200)}`)
  return res.data.choices?.[0]?.message?.content || ''
}

// ── Gemini ────────────────────────────────────────────────────────────────────
async function callGemini(prompt, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
  if (!apiKey) throw new Error('No Gemini API key found')

  const model = options.model || 'gemini-2.0-flash'
  const res = await httpPost('generativelanguage.googleapis.com',
    `/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {},
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: options.maxTokens || 1024 }
    }
  )

  if (res.status !== 200) throw new Error(`Gemini API error ${res.status}: ${JSON.stringify(res.data).substring(0, 200)}`)
  return res.data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// ── Ollama (local Gemma) ──────────────────────────────────────────────────────
async function callOllama(prompt, options = {}) {
  const host  = process.env.OLLAMA_HOST || 'localhost'
  const port  = parseInt(process.env.OLLAMA_PORT || '11434')
  const model = options.model || process.env.LLM_MODEL || process.env.OLLAMA_MODEL || 'qwen3-vl:4b'
  const system = options.system || 'คุณเป็นผู้ช่วย AI ของบริษัท SIRINX Solar Energy ตอบเป็นภาษาไทยสั้นกระชับ'

  const body = JSON.stringify({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user',   content: prompt },
    ],
    stream: false,
  })

  return new Promise((resolve, reject) => {
    const opts = {
      hostname: host, port, method: 'POST',
      path: '/api/chat',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }
    const req = http.request(opts, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => {
        try {
          const j = JSON.parse(d)
          if (j.error) reject(new Error(`Ollama error: ${j.error}`))
          else resolve(j?.message?.content || j?.response || '')
        } catch (e) { reject(new Error(`Ollama JSON parse error: ${d.substring(0, 200)}`)) }
      })
    })
    req.on('error', reject)
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('Ollama request timeout')) })
    req.write(body)
    req.end()
  })
}

// ── Main unified call ─────────────────────────────────────────────────────────
async function callLLM(prompt, options = {}) {
  const provider = options.provider || getProvider()

  switch (provider) {
    case 'anthropic': return callAnthropic(prompt, options)
    case 'xai':       return callXai(prompt, options)
    case 'gemini':    return callGemini(prompt, options)
    case 'ollama':    return callOllama(prompt, options)
    default:          throw new Error(`Unknown provider: ${provider}`)
  }
}

// ── Status ────────────────────────────────────────────────────────────────────
function getLLMStatus() {
  const provider = getProvider()
  const keyMap = {
    anthropic: 'ANTHROPIC_API_KEY',
    xai:       'XAI_API_KEY / OpenClaw',
    gemini:    'GEMINI_API_KEY',
    ollama:    'Ollama local (qwen3-vl:4b)',
  }
  return {
    provider: provider || 'none',
    ready: true,
    keySource: keyMap[provider] || 'unknown',
  }
}

module.exports = { callLLM, getLLMStatus, getProvider }

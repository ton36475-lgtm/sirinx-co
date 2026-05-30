/**
 * SIRINX API Key Connection Tester
 * ทดสอบ connectivity ของ AI providers ทั้งหมด
 * Usage: node scripts/test-api-keys.mjs
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// โหลด env จาก sirinx-app/.env.local (มี keys ครบที่สุด)
function loadEnv(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8')
    const env = {}
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx === -1) continue
      const key = trimmed.slice(0, idx).trim()
      const val = trimmed.slice(idx + 1).trim()
      env[key] = val
    }
    return env
  } catch {
    return {}
  }
}

const appEnv = loadEnv(resolve(ROOT, 'sirinx-app/.env.local'))
const rootEnv = loadEnv(resolve(ROOT, '.env'))

// Merge: sirinx-app takes priority, root fills gaps
const env = { ...rootEnv, ...appEnv }

function isSet(val) {
  return val && !val.startsWith('PASTE_YOUR_') && val.trim() !== ''
}

const RESET  = '\x1b[0m'
const GREEN  = '\x1b[32m'
const RED    = '\x1b[31m'
const YELLOW = '\x1b[33m'
const BOLD   = '\x1b[1m'
const CYAN   = '\x1b[36m'

function pass(msg) { console.log(`  ${GREEN}✓${RESET} ${msg}`) }
function fail(msg) { console.log(`  ${RED}✗${RESET} ${msg}`) }
function skip(msg) { console.log(`  ${YELLOW}⊘${RESET} ${msg} ${YELLOW}(key ไม่ได้กรอก)${RESET}`) }

const results = { passed: 0, failed: 0, skipped: 0 }

async function testAnthropic() {
  console.log(`\n${CYAN}── Anthropic (Claude) ─────────────────────${RESET}`)
  const key = env.ANTHROPIC_API_KEY
  if (!isSet(key)) { skip('ANTHROPIC_API_KEY'); results.skipped++; return }
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "OK" only.' }],
      }),
    })
    const data = await res.json()
    if (res.ok && data.content?.[0]?.text) {
      pass(`Claude Haiku → "${data.content[0].text.trim()}"`)
      results.passed++
    } else {
      fail(`HTTP ${res.status}: ${data.error?.message || JSON.stringify(data)}`)
      results.failed++
    }
  } catch (e) {
    fail(`Network error: ${e.message}`)
    results.failed++
  }
}

async function testOpenAI() {
  console.log(`\n${CYAN}── OpenAI (ChatGPT) ────────────────────────${RESET}`)
  const key = env.OPENAI_API_KEY
  if (!isSet(key)) { skip('OPENAI_API_KEY'); results.skipped++; return }
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "OK" only.' }],
      }),
    })
    const data = await res.json()
    if (res.ok && data.choices?.[0]?.message?.content) {
      pass(`GPT-4o-mini → "${data.choices[0].message.content.trim()}"`)
      results.passed++
    } else {
      fail(`HTTP ${res.status}: ${data.error?.message || JSON.stringify(data)}`)
      results.failed++
    }
  } catch (e) {
    fail(`Network error: ${e.message}`)
    results.failed++
  }
}

async function testXAI() {
  console.log(`\n${CYAN}── xAI (Grok) ──────────────────────────────${RESET}`)
  const key = env.XAI_API_KEY
  if (!isSet(key)) { skip('XAI_API_KEY'); results.skipped++; return }
  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "OK" only.' }],
      }),
    })
    const data = await res.json()
    if (res.ok && data.choices?.[0]?.message?.content) {
      pass(`Grok-3-mini → "${data.choices[0].message.content.trim()}"`)
      results.passed++
    } else {
      fail(`HTTP ${res.status}: ${data.error?.message || JSON.stringify(data)}`)
      results.failed++
    }
  } catch (e) {
    fail(`Network error: ${e.message}`)
    results.failed++
  }
}

async function testZhipu() {
  console.log(`\n${CYAN}── Zhipu AI (GLM-5V-Turbo) ─────────────────${RESET}`)
  const key = env.ZHIPU_API_KEY
  const baseUrl = env.ZHIPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4'
  if (!isSet(key)) { skip('ZHIPU_API_KEY'); results.skipped++; return }
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "OK" only.' }],
      }),
    })
    const data = await res.json()
    if (res.ok && data.choices?.[0]?.message?.content) {
      pass(`GLM-4-Flash → "${data.choices[0].message.content.trim()}"`)
      results.passed++
    } else {
      fail(`HTTP ${res.status}: ${data.error?.message || JSON.stringify(data)}`)
      results.failed++
    }
  } catch (e) {
    fail(`Network error: ${e.message}`)
    results.failed++
  }
}

async function testSupabase() {
  console.log(`\n${CYAN}── Supabase ─────────────────────────────────${RESET}`)
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!isSet(url) || !isSet(key)) {
    skip('SUPABASE_URL / SUPABASE_ANON_KEY')
    results.skipped++
    return
  }
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
    })
    if (res.ok || res.status === 200) {
      pass(`Supabase REST API → HTTP ${res.status}`)
      results.passed++
    } else if (res.status === 404) {
      // 404 on root is normal — connection works
      pass(`Supabase REST API → connected (HTTP 404 on root = OK)`)
      results.passed++
    } else {
      fail(`HTTP ${res.status}`)
      results.failed++
    }
  } catch (e) {
    fail(`Network error: ${e.message}`)
    results.failed++
  }
}

async function main() {
  console.log(`\n${BOLD}SIRINX API Key Connection Tester${RESET}`)
  console.log(`วันที่: ${new Date().toLocaleString('th-TH')}`)
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)

  await testAnthropic()
  await testOpenAI()
  await testXAI()
  await testZhipu()
  await testSupabase()

  console.log(`\n${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`ผลลัพธ์: ${GREEN}✓ ${results.passed} passed${RESET}  ${RED}✗ ${results.failed} failed${RESET}  ${YELLOW}⊘ ${results.skipped} skipped${RESET}\n`)
}

main().catch(console.error)

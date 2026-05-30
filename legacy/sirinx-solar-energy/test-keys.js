#!/usr/bin/env node
// test-keys.js — SIRINX API Connection Tester
// Usage: node test-keys.js
// No dependencies required — uses native fetch (Node 18+)

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Parse .env file ──────────────────────────────────────────────────────────
function parseEnv(filePath) {
  try {
    const content = readFileSync(resolve(__dir, filePath), 'utf8');
    const result = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (val && !val.startsWith('PASTE_YOUR') && val !== '') result[key] = val;
    }
    return result;
  } catch {
    return {};
  }
}

// Load from both files — sirinx-app takes priority for AI keys
const rootEnv = parseEnv('.env');
const appEnv  = parseEnv('sirinx-app/.env.local');
const env     = { ...rootEnv, ...appEnv };

// ── Helpers ──────────────────────────────────────────────────────────────────
const GREEN  = '\x1b[32m✅\x1b[0m';
const RED    = '\x1b[31m❌\x1b[0m';
const YELLOW = '\x1b[33m⚠️ \x1b[0m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

async function test(name, fn) {
  process.stdout.write(`  Testing ${BOLD}${name}${RESET}... `);
  try {
    const result = await fn();
    console.log(`${GREEN} ${result}`);
    return true;
  } catch (err) {
    console.log(`${RED} ${err.message}`);
    return false;
  }
}

function requireKey(name) {
  const val = env[name];
  if (!val) throw new Error(`${name} not set`);
  return val;
}

// ── Tests ─────────────────────────────────────────────────────────────────────
async function testAnthropic() {
  const key = requireKey('ANTHROPIC_API_KEY');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'hi' }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${data.error?.message ?? JSON.stringify(data)}`);
  return `model=${data.model}, tokens=${data.usage?.input_tokens}in`;
}

async function testOpenAI() {
  const key = requireKey('OPENAI_API_KEY');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'hi' }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${data.error?.message ?? JSON.stringify(data)}`);
  return `model=${data.model}, tokens=${data.usage?.prompt_tokens}in`;
}

async function testZhipu() {
  const key = requireKey('ZHIPU_API_KEY');
  const res = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'glm-4-flash',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'hi' }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${data.error?.message ?? JSON.stringify(data)}`);
  return `model=${data.model}, id=${data.id?.slice(0, 12)}...`;
}

async function testSupabase() {
  const url = requireKey('NEXT_PUBLIC_SUPABASE_URL');
  const key = requireKey('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const res = await fetch(`${url}/rest/v1/`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return `connected to ${new URL(url).hostname}`;
}

async function testTelegram() {
  const token = requireKey('TELEGRAM_BOT_TOKEN');
  const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.description ?? 'Unknown error');
  return `@${data.result.username} (${data.result.first_name})`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log('\n🔑 SIRINX API Key Tester\n');

const results = await Promise.allSettled([
  test('Anthropic (Claude)', testAnthropic),
  test('OpenAI (GPT-4o-mini)', testOpenAI),
  test('Zhipu/GLM', testZhipu),
  test('Supabase', testSupabase),
  test('Telegram Bot', testTelegram),
]);

const passed = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
console.log(`\n${BOLD}Result: ${passed}/5 providers connected${RESET}\n`);

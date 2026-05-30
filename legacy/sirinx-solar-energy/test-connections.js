#!/usr/bin/env node
/**
 * SIRINX API Connection Test
 * Reads keys from sirinx-app/.env.local (primary) + root .env (Telegram fallback)
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

// --- Parse .env files ---
function parseEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  fs.readFileSync(filePath, 'utf8').split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const idx = line.indexOf('=');
    if (idx < 0) return;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (val) env[key] = val;
  });
  return env;
}

const rootDir = path.resolve(__dirname);
const appEnv  = parseEnv(path.join(rootDir, 'sirinx-app/.env.local'));
const rootEnv = parseEnv(path.join(rootDir, '.env'));

function get(key) {
  return appEnv[key] || rootEnv[key] || '';
}

// --- HTTP helper (no axios needed) ---
function post(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request(
      { hostname, path, method: 'POST', headers: { ...headers, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } },
      res => {
        let buf = '';
        res.on('data', d => buf += d);
        res.on('end', () => resolve({ status: res.statusCode, body: buf }));
      }
    );
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(new Error('timeout')); });
    req.write(data);
    req.end();
  });
}

function get_req(hostname, path, headers) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname, path, method: 'GET', headers },
      res => {
        let buf = '';
        res.on('data', d => buf += d);
        res.on('end', () => resolve({ status: res.statusCode, body: buf }));
      }
    );
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(new Error('timeout')); });
    req.end();
  });
}

async function testAnthropic() {
  const key = get('ANTHROPIC_API_KEY');
  if (!key) return { name: 'Anthropic Claude', status: '❌ NO KEY' };
  try {
    const r = await post('api.anthropic.com', '/v1/messages', {
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    }, {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }]
    });
    if (r.status === 200) return { name: 'Anthropic Claude', status: '✅ OK', detail: `HTTP ${r.status}` };
    const err = JSON.parse(r.body).error?.message || r.body.slice(0, 80);
    return { name: 'Anthropic Claude', status: '❌ FAIL', detail: `HTTP ${r.status}: ${err}` };
  } catch (e) { return { name: 'Anthropic Claude', status: '❌ ERROR', detail: e.message }; }
}

async function testOpenAI() {
  const key = get('OPENAI_API_KEY');
  if (!key) return { name: 'OpenAI GPT', status: '❌ NO KEY' };
  try {
    const r = await post('api.openai.com', '/v1/chat/completions', {
      'Authorization': `Bearer ${key}`
    }, {
      model: 'gpt-4o-mini',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }]
    });
    if (r.status === 200) return { name: 'OpenAI GPT', status: '✅ OK', detail: `HTTP ${r.status}` };
    const err = JSON.parse(r.body).error?.message || r.body.slice(0, 80);
    return { name: 'OpenAI GPT', status: '❌ FAIL', detail: `HTTP ${r.status}: ${err}` };
  } catch (e) { return { name: 'OpenAI GPT', status: '❌ ERROR', detail: e.message }; }
}

async function testZhipu() {
  const key = get('ZHIPU_API_KEY');
  if (!key) return { name: 'Zhipu GLM', status: '❌ NO KEY' };
  try {
    const r = await post('open.bigmodel.cn', '/api/paas/v4/chat/completions', {
      'Authorization': `Bearer ${key}`
    }, {
      model: 'glm-4-flash',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }]
    });
    if (r.status === 200) return { name: 'Zhipu GLM', status: '✅ OK', detail: `HTTP ${r.status}` };
    const err = JSON.parse(r.body).error?.message || r.body.slice(0, 80);
    return { name: 'Zhipu GLM', status: '❌ FAIL', detail: `HTTP ${r.status}: ${err}` };
  } catch (e) { return { name: 'Zhipu GLM', status: '❌ ERROR', detail: e.message }; }
}

async function testSupabase() {
  const url  = get('NEXT_PUBLIC_SUPABASE_URL');
  const akey = get('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!url || !akey) return { name: 'Supabase', status: '❌ NO KEY' };
  try {
    const hostname = new URL(url).hostname;
    const r = await get_req(hostname, '/rest/v1/', { 'apikey': akey, 'Authorization': `Bearer ${akey}` });
    if (r.status < 400) return { name: 'Supabase', status: '✅ OK', detail: `HTTP ${r.status}` };
    return { name: 'Supabase', status: '❌ FAIL', detail: `HTTP ${r.status}` };
  } catch (e) { return { name: 'Supabase', status: '❌ ERROR', detail: e.message }; }
}

async function testTelegram() {
  const token = get('TELEGRAM_BOT_TOKEN');
  if (!token) return { name: 'Telegram Bot', status: '❌ NO KEY' };
  try {
    const r = await get_req('api.telegram.org', `/bot${token}/getMe`, {});
    if (r.status === 200) {
      const d = JSON.parse(r.body);
      const username = d.result?.username || '?';
      return { name: 'Telegram Bot', status: '✅ OK', detail: `@${username}` };
    }
    return { name: 'Telegram Bot', status: '❌ FAIL', detail: `HTTP ${r.status}` };
  } catch (e) { return { name: 'Telegram Bot', status: '❌ ERROR', detail: e.message }; }
}

// --- Main ---
(async () => {
  console.log('\n🔍 SIRINX API Connection Test\n' + '─'.repeat(45));
  const results = await Promise.all([
    testAnthropic(),
    testOpenAI(),
    testZhipu(),
    testSupabase(),
    testTelegram(),
  ]);

  results.forEach(r => {
    const detail = r.detail ? `  (${r.detail})` : '';
    console.log(`${r.status}  ${r.name}${detail}`);
  });

  const ok  = results.filter(r => r.status.startsWith('✅')).length;
  const total = results.length;
  console.log(`\n${'─'.repeat(45)}\nResult: ${ok}/${total} services OK\n`);

  // Export results for PM2/Telegram step
  const allOk = ok === total;
  process.exit(allOk ? 0 : 1);
})();

/**
 * config.js — Engine Configuration
 * โหลด env vars, กำหนดค่า defaults, และตรวจสอบ API keys ที่มีอยู่
 * Engine ทำงานแบบ graceful degradation — ถ้าขาด key ของ model ไหน จะข้ามไป
 */

import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// โหลด .env จาก engine directory ก่อน แล้วค่อย fallback ไปที่ root
function loadEnv() {
  const envPaths = [
    resolve(__dirname, '.env'),
    resolve(__dirname, '..', '.env'),
    resolve(__dirname, '..', '..', '.env'),
  ];

  for (const envPath of envPaths) {
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
      }
      break;
    }
  }
}

loadEnv();

// ===== Model Pricing (USD per 1M tokens) =====
export const PRICING = {
  'claude-opus-4-20250514':    { input: 15.00, output: 75.00 },
  'claude-sonnet-4-20250514':  { input: 3.00,  output: 15.00 },
  'claude-haiku-4-5-20251001': { input: 0.80,  output: 4.00  },
  'gpt-4o':                    { input: 2.50,  output: 10.00 },
  'gpt-4o-mini':               { input: 0.15,  output: 0.60  },
  'o1':                        { input: 15.00, output: 60.00 },
  'o1-mini':                   { input: 3.00,  output: 12.00 },
  'gemini-2.5-pro':            { input: 1.25,  output: 10.00 },
  'gemini-2.5-flash':          { input: 0.15,  output: 0.60  },
  'gemini-2.0-flash':          { input: 0.10,  output: 0.40  },
  'gemini-2.0-flash-lite':     { input: 0.075, output: 0.30  },
  'gemini-flash-latest':       { input: 0.10,  output: 0.40  },
  'gemini-pro-latest':         { input: 1.25,  output: 10.00 },
  'grok-3':                    { input: 3.00,  output: 15.00 },
  'grok-3-fast':               { input: 5.00,  output: 25.00 },
  'grok-3-mini':               { input: 0.30,  output: 0.50  },
  'qwen-plus':                 { input: 0.50,  output: 1.50  },
  'qwen-max':                  { input: 1.60,  output: 6.40  },
  'qwen-turbo':                { input: 0.05,  output: 0.20  },
  'glm-4':                     { input: 0.86,  output: 0.86  },
  'glm-5v-turbo':              { input: 1.20,  output: 4.00  },  // Zhipu AI GLM-5V-Turbo (vision)
  'z-ai/glm-5v-turbo':         { input: 1.20,  output: 4.00  },  // OpenRouter alias
  'kimi-moonshot-v1-8k':       { input: 0.012, output: 0.012 },
};

// USD → THB rate (approximate)
export const USD_TO_THB = 34;

// ===== Default Model Assignments =====
export const MODEL_DEFAULTS = {
  claude: {
    default:  'claude-sonnet-4-20250514',
    complex:  'claude-opus-4-20250514',
    fast:     'claude-haiku-4-5-20251001',
  },
  chatgpt: {
    default:  'gpt-4o',
    complex:  'o1',
    fast:     'gpt-4o-mini',
    reason:   'o1-mini',
  },
  gemini: {
    default:  'gemini-flash-latest',   // alias → ใช้ flash รุ่นล่าสุดที่ available
    complex:  'gemini-pro-latest',
    fast:     'gemini-flash-latest',
  },
  qwen: {
    default:  'qwen-plus',
    complex:  'qwen-max',
    fast:     'qwen-turbo',
  },
  glm: {
    default:  'glm-5v-turbo',   // multimodal vision+agent
    complex:  'glm-5v-turbo',   // same — no heavier variant yet
    fast:     'glm-5v-turbo',
    legacy:   'glm-4',          // text-only legacy model
  },
  kimi: {
    default:  'kimi-moonshot-v1-8k',
  },
  grok: {
    default:  'grok-3',
    complex:  'grok-3',
    fast:     'grok-3-fast',
    economy:  'grok-3-mini',
  },
  ollama: {
    default:  'llama3.1:latest',     // general purpose + Thai — PRIMARY model
    complex:  'qwen2.5-coder:14b',   // code/complex tasks — 14b
    fast:     'qwen2.5-coder:7b',    // code fast — 7b
    vision:   'qwen3-vl:4b',         // multimodal/vision
  },
};

// ===== API Keys =====
export const API_KEYS = {
  anthropic:  process.env.ANTHROPIC_API_KEY,
  openai:     process.env.OPENAI_API_KEY,
  google:     process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY,  // รองรับทั้งสองชื่อ
  xai:        process.env.XAI_API_KEY,
  dashscope:  process.env.DASHSCOPE_API_KEY,  // Qwen / Alibaba Cloud
  zhipu:      process.env.ZHIPU_API_KEY,
  openrouter: process.env.OPENROUTER_API_KEY,  // Fallback for GLM via OpenRouter
  kimi:       process.env.KIMI_API_KEY,
  telegram: {
    token:    process.env.TELEGRAM_BOT_TOKEN,
    chatId:   process.env.TELEGRAM_CHAT_ID,
  },
};

// ===== Engine Settings =====
export const ENGINE = {
  logLevel:       process.env.ENGINE_LOG_LEVEL       || 'info',
  maxRetries:     parseInt(process.env.ENGINE_MAX_RETRIES  || '3'),
  timeoutMs:      parseInt(process.env.ENGINE_TIMEOUT_MS   || '60000'),
  budgetTHB:      parseInt(process.env.ENGINE_COST_BUDGET_THB || '1400'),
  defaultDrafter: process.env.ENGINE_DEFAULT_DRAFTER  || 'ollama',   // Ollama PRIMARY — local/free 24h
  defaultReviewer:process.env.ENGINE_DEFAULT_REVIEWER || 'ollama',
  artifactDir:    process.env.ARTIFACT_DIR            || resolve(__dirname, 'artifacts/store'),
};

// ===== Available Models (based on which keys exist) =====
export function getAvailableModels() {
  const available = [];
  if (API_KEYS.anthropic) available.push('claude');
  if (API_KEYS.openai)    available.push('chatgpt');
  if (API_KEYS.google)    available.push('gemini');
  if (API_KEYS.dashscope) available.push('qwen');
  if (API_KEYS.zhipu || API_KEYS.openrouter) available.push('glm');
  if (API_KEYS.kimi)      available.push('kimi');
  if (API_KEYS.xai)       available.push('grok');
  available.push('ollama');  // local — always listed (init() จะตรวจสอบเองว่า server รันอยู่ไหม)
  return available;
}

// ===== Logger =====
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const COLORS  = { debug: '\x1b[36m', info: '\x1b[32m', warn: '\x1b[33m', error: '\x1b[31m', reset: '\x1b[0m' };

export const logger = {
  _level: LEVELS[ENGINE.logLevel] ?? 1,
  _fmt(level, msg, data) {
    const ts  = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const col = COLORS[level] || '';
    const rst = COLORS.reset;
    const prefix = `${col}[${ts}] [${level.toUpperCase()}]${rst}`;
    if (data !== undefined) {
      console.log(`${prefix} ${msg}`, typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
    } else {
      console.log(`${prefix} ${msg}`);
    }
  },
  debug(msg, data) { if (this._level <= 0) this._fmt('debug', msg, data); },
  info(msg,  data) { if (this._level <= 1) this._fmt('info',  msg, data); },
  warn(msg,  data) { if (this._level <= 2) this._fmt('warn',  msg, data); },
  error(msg, data) { if (this._level <= 3) this._fmt('error', msg, data); },
};

// ===== Retry Helper =====
export async function withRetry(fn, { retries = ENGINE.maxRetries, label = 'operation' } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt <= retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 16000);
        logger.warn(`[retry] ${label} attempt ${attempt} failed: ${err.message} — retrying in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

export default { PRICING, USD_TO_THB, MODEL_DEFAULTS, API_KEYS, ENGINE, logger, withRetry };

/**
 * cost-optimizer.js — Cost Tracking and Optimization
 * ติดตาม cost ทุก API call, เปรียบเทียบกับ budget, แนะนำ optimization
 * เป้าหมาย: 1,400 THB/เดือน (3-Tier strategy)
 *
 * Tier Strategy:
 * - Premium (5%): Claude Opus, GPT-o1 — สำหรับงานสำคัญมาก
 * - Standard (15%): Claude Sonnet, GPT-4o — งานทั่วไป
 * - Economy (80%): Qwen, Gemini Flash, GLM, Kimi — bulk work
 */

import { PRICING, USD_TO_THB, ENGINE, logger } from './config.js';

// Monthly budget allocation (THB)
const BUDGET_TIERS = {
  premium:  ENGINE.budgetTHB * 0.05,   // 70 THB
  standard: ENGINE.budgetTHB * 0.15,   // 210 THB
  economy:  ENGINE.budgetTHB * 0.80,   // 1,120 THB
};

// Which models belong to which tier
const MODEL_TIERS = {
  'claude-opus-4-20250514':    'premium',
  'o1':                        'premium',
  'o1-mini':                   'premium',
  'claude-sonnet-4-20250514':  'standard',
  'gpt-4o':                    'standard',
  'claude-haiku-4-5-20251001': 'economy',
  'gpt-4o-mini':               'economy',
  'gemini-1.5-pro':            'economy',
  'gemini-1.5-flash':          'economy',
  'gemini-2.0-flash':          'economy',
  'qwen-plus':                 'economy',
  'qwen-max':                  'economy',
  'qwen-turbo':                'economy',
  'glm-4':                     'economy',
  'kimi-moonshot-v1-8k':       'economy',
};

export class CostOptimizer {
  constructor() {
    this._session  = {
      startedAt: new Date().toISOString(),
      calls:     [],
      totals:    { usd: 0, thb: 0, tokens: 0 },
      byModel:   {},
      byTask:    {},
      byTier:    { premium: 0, standard: 0, economy: 0 },
    };

    // Monthly tracking (persisted — load from disk in production)
    this._monthly = { thb: 0, usd: 0, calls: 0 };
  }

  /**
   * บันทึก API call และ cost
   * @param {Object} record
   * @param {string} record.model
   * @param {string} record.provider
   * @param {string} record.task
   * @param {number} record.inputTokens
   * @param {number} record.outputTokens
   * @param {{ usd: number, thb: number }} record.cost
   * @param {number} record.latencyMs
   */
  record(record) {
    const { model, provider, task, inputTokens, outputTokens, cost, latencyMs } = record;

    const entry = {
      timestamp:   new Date().toISOString(),
      model,
      provider,
      task,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      cost,
      latencyMs,
      tier:        MODEL_TIERS[model] || 'standard',
    };

    this._session.calls.push(entry);
    this._session.totals.usd    += cost.usd;
    this._session.totals.thb    += cost.thb;
    this._session.totals.tokens += entry.totalTokens;

    // By model
    if (!this._session.byModel[model]) {
      this._session.byModel[model] = { usd: 0, thb: 0, calls: 0, tokens: 0 };
    }
    this._session.byModel[model].usd    += cost.usd;
    this._session.byModel[model].thb    += cost.thb;
    this._session.byModel[model].calls  += 1;
    this._session.byModel[model].tokens += entry.totalTokens;

    // By task
    if (!this._session.byTask[task]) {
      this._session.byTask[task] = { usd: 0, thb: 0, calls: 0 };
    }
    this._session.byTask[task].usd   += cost.usd;
    this._session.byTask[task].thb   += cost.thb;
    this._session.byTask[task].calls += 1;

    // By tier
    this._session.byTier[entry.tier] = (this._session.byTier[entry.tier] || 0) + cost.thb;

    // Monthly
    this._monthly.thb   += cost.thb;
    this._monthly.usd   += cost.usd;
    this._monthly.calls += 1;

    logger.debug(`[cost] ${model} | ${entry.totalTokens} tokens | ${cost.thb.toFixed(4)} THB`);

    // Budget warning
    this._checkBudget(entry.tier, cost.thb);
  }

  /**
   * ตรวจสอบ budget และแจ้งเตือน
   */
  _checkBudget(tier, costThb) {
    const tierBudget = BUDGET_TIERS[tier] || BUDGET_TIERS.standard;
    const tierSpent  = this._session.byTier[tier] || 0;
    const pct        = (tierSpent / tierBudget) * 100;

    if (pct > 90) {
      logger.warn(`[budget] ⚠️ ${tier} tier ใช้ไปแล้ว ${pct.toFixed(1)}% ของ budget (${tierSpent.toFixed(2)}/${tierBudget} THB)`);
    }

    const totalPct = (this._session.totals.thb / ENGINE.budgetTHB) * 100;
    if (totalPct > 80) {
      logger.warn(`[budget] ⚠️ Total session cost: ${totalPct.toFixed(1)}% ของ monthly budget`);
    }
  }

  /**
   * แนะนำ model ที่ประหยัดที่สุดสำหรับ task ประเภทนี้
   * @param {string} taskType
   * @param {string[]} availableModels
   * @returns {string}
   */
  recommendModel(taskType, availableModels) {
    // ถ้า budget premium เกิน 80% — ห้ามใช้ premium models
    const premiumUsed = this._session.byTier.premium || 0;
    const blockPremium = premiumUsed > BUDGET_TIERS.premium * 0.8;

    // ถ้า budget standard เกิน 80% — ชวนใช้ economy
    const standardUsed = this._session.byTier.standard || 0;
    const forceEconomy = standardUsed > BUDGET_TIERS.standard * 0.8;

    // กรอง models ตาม constraint
    let candidates = availableModels;
    if (blockPremium) {
      candidates = candidates.filter(m => MODEL_TIERS[m] !== 'premium');
      logger.warn('[cost] Premium budget limit — ไม่ใช้ premium models');
    }
    if (forceEconomy) {
      const economyCandidates = candidates.filter(m => MODEL_TIERS[m] === 'economy');
      if (economyCandidates.length > 0) candidates = economyCandidates;
    }

    // เรียงตาม cost (cheapest first)
    return candidates.sort((a, b) => {
      const priceA = PRICING[a]?.input || 99;
      const priceB = PRICING[b]?.input || 99;
      return priceA - priceB;
    })[0] || availableModels[0];
  }

  /**
   * สรุป session cost
   * @returns {Object}
   */
  getSessionSummary() {
    const { totals, byModel, byTask, byTier, calls } = this._session;
    return {
      totalCalls:   calls.length,
      totalTokens:  totals.tokens,
      totalUSD:     parseFloat(totals.usd.toFixed(6)),
      totalTHB:     parseFloat(totals.thb.toFixed(4)),
      budgetUsedPct: parseFloat(((totals.thb / ENGINE.budgetTHB) * 100).toFixed(2)),
      byModel,
      byTask,
      byTier: {
        premium:  { spent: byTier.premium  || 0, budget: BUDGET_TIERS.premium,  pct: ((byTier.premium  || 0) / BUDGET_TIERS.premium  * 100).toFixed(1) },
        standard: { spent: byTier.standard || 0, budget: BUDGET_TIERS.standard, pct: ((byTier.standard || 0) / BUDGET_TIERS.standard * 100).toFixed(1) },
        economy:  { spent: byTier.economy  || 0, budget: BUDGET_TIERS.economy,  pct: ((byTier.economy  || 0) / BUDGET_TIERS.economy  * 100).toFixed(1) },
      },
      projectedMonthly: {
        thb: parseFloat((totals.thb * 30).toFixed(2)),
        withinBudget: (totals.thb * 30) <= ENGINE.budgetTHB,
      },
    };
  }

  /**
   * Format สรุป cost เป็น string สำหรับ logging
   * @returns {string}
   */
  formatSummary() {
    const s = this.getSessionSummary();
    return [
      `💰 Cost Summary`,
      `  Total: ${s.totalTHB} THB (${s.totalUSD} USD)`,
      `  Calls: ${s.totalCalls} | Tokens: ${s.totalTokens.toLocaleString()}`,
      `  Budget: ${s.budgetUsedPct}% of monthly ${ENGINE.budgetTHB} THB`,
      `  Tiers: Premium ${s.byTier.premium.pct}% | Standard ${s.byTier.standard.pct}% | Economy ${s.byTier.economy.pct}%`,
    ].join('\n');
  }

  /**
   * คำนวณ cost estimate ก่อน run
   * @param {string} modelId
   * @param {number} estimatedInputTokens
   * @param {number} estimatedOutputTokens
   * @returns {{ usd: number, thb: number, withinBudget: boolean }}
   */
  estimateCost(modelId, estimatedInputTokens, estimatedOutputTokens) {
    const pricing = PRICING[modelId];
    if (!pricing) return { usd: 0, thb: 0, withinBudget: true };

    const usd = (estimatedInputTokens / 1_000_000) * pricing.input
              + (estimatedOutputTokens / 1_000_000) * pricing.output;
    const thb = usd * USD_TO_THB;

    const remaining = ENGINE.budgetTHB - this._monthly.thb;
    return {
      usd:           parseFloat(usd.toFixed(6)),
      thb:           parseFloat(thb.toFixed(4)),
      withinBudget:  thb <= remaining,
      remaining,
    };
  }

  /**
   * Reset session counters (เรียกตอนเริ่ม workflow ใหม่)
   */
  resetSession() {
    this._session = {
      startedAt: new Date().toISOString(),
      calls:     [],
      totals:    { usd: 0, thb: 0, tokens: 0 },
      byModel:   {},
      byTask:    {},
      byTier:    { premium: 0, standard: 0, economy: 0 },
    };
  }
}

// Singleton
let _optimizer = null;
export function getCostOptimizer() {
  if (!_optimizer) _optimizer = new CostOptimizer();
  return _optimizer;
}

export default CostOptimizer;

/**
 * base-model.js — Abstract Base Class for all Model Adapters
 * ทุก model adapter ต้อง extend class นี้และ implement abstract methods
 * จัดการ: token counting, cost tracking, retry logic, structured I/O
 */

import { PRICING, USD_TO_THB, ENGINE, logger, withRetry } from '../config.js';

// ===== Structured Input/Output Types =====
/**
 * @typedef {Object} ModelInput
 * @property {string} task          — คำอธิบาย task
 * @property {string} prompt        — Prompt หลัก
 * @property {string} [context]     — Context เพิ่มเติม (artifacts จาก model อื่น)
 * @property {string} [systemRole]  — System role override
 * @property {Object} [options]     — Model-specific options
 * @property {'fast'|'default'|'complex'|'reason'} [tier] — Model tier
 */

/**
 * @typedef {Object} ModelOutput
 * @property {boolean} success
 * @property {string}  content      — ผลลัพธ์หลัก
 * @property {string}  modelId      — Model ID ที่ใช้จริง
 * @property {string}  provider     — 'claude' | 'chatgpt' | 'gemini' | 'qwen' | ...
 * @property {Object}  usage        — { inputTokens, outputTokens, totalTokens }
 * @property {Object}  cost         — { usd, thb }
 * @property {number}  latencyMs    — เวลาที่ใช้ (ms)
 * @property {string}  [error]      — Error message ถ้า success=false
 * @property {Object}  [metadata]   — ข้อมูลเพิ่มเติม
 */

/**
 * @typedef {Object} ReviewOutput
 * @property {boolean} approved
 * @property {number}  score        — 0-100
 * @property {Array}   findings     — [{ severity, message, suggestion }]
 * @property {string}  summary      — สรุปการ review
 * @property {string}  recommendation — 'approve' | 'revise' | 'reject'
 * @property {ModelOutput} raw      — Raw model output
 */

export class BaseModel {
  /**
   * @param {string} provider — ชื่อ provider (claude, chatgpt, gemini, qwen)
   * @param {Object} config   — Config object จาก config.js
   */
  constructor(provider, config = {}) {
    if (new.target === BaseModel) {
      throw new Error('BaseModel เป็น abstract class — ต้อง extend และ implement methods');
    }
    this.provider    = provider;
    this.config      = config;
    this.isAvailable = false;  // จะถูก set ใน initialize()
    this._costAccum  = { usd: 0, thb: 0, calls: 0 };
  }

  // ===== Abstract Methods — ต้อง Override =====

  /**
   * สร้าง content ตาม prompt ที่ให้
   * @param {ModelInput} input
   * @returns {Promise<ModelOutput>}
   */
  async generate(input) {
    throw new Error(`${this.provider}.generate() ยังไม่ได้ implement`);
  }

  /**
   * Review content ที่ได้รับ — ใช้สำหรับ critique loop
   * @param {string} content  — Content ที่จะ review
   * @param {string} task     — Task description (เพื่อ context)
   * @param {Object} [criteria] — เกณฑ์การ review เพิ่มเติม
   * @returns {Promise<ReviewOutput>}
   */
  async review(content, task, criteria = {}) {
    throw new Error(`${this.provider}.review() ยังไม่ได้ implement`);
  }

  /**
   * Critique และให้ feedback แบบ structured
   * @param {string} draftContent
   * @param {string} task
   * @returns {Promise<ReviewOutput>}
   */
  async critique(draftContent, task) {
    return this.review(draftContent, task, { mode: 'critique' });
  }

  /**
   * สรุป content ให้กระชับ
   * @param {string} content
   * @param {number} [maxWords]
   * @returns {Promise<ModelOutput>}
   */
  async summarize(content, maxWords = 200) {
    return this.generate({
      task: 'summarize',
      prompt: `สรุปเนื้อหาต่อไปนี้ให้กระชับไม่เกิน ${maxWords} คำ:\n\n${content}`,
      tier: 'fast',
    });
  }

  /**
   * ตรวจสอบว่า model พร้อมใช้งานหรือไม่
   * @returns {Promise<boolean>}
   */
  async initialize() {
    throw new Error(`${this.provider}.initialize() ยังไม่ได้ implement`);
  }

  // ===== Concrete Helpers — ใช้ร่วมกันได้ =====

  /**
   * คำนวณ cost จาก token usage
   * @param {string} modelId
   * @param {number} inputTokens
   * @param {number} outputTokens
   * @returns {{ usd: number, thb: number }}
   */
  calculateCost(modelId, inputTokens, outputTokens) {
    const pricing = PRICING[modelId];
    if (!pricing) {
      logger.warn(`[cost] ไม่พบ pricing สำหรับ ${modelId} — ใช้ค่าประมาณ`);
      return { usd: 0.001, thb: 0.001 * USD_TO_THB };
    }
    const usd = (inputTokens / 1_000_000) * pricing.input
              + (outputTokens / 1_000_000) * pricing.output;
    const thb = usd * USD_TO_THB;
    this._costAccum.usd   += usd;
    this._costAccum.thb   += thb;
    this._costAccum.calls += 1;
    return { usd: parseFloat(usd.toFixed(6)), thb: parseFloat(thb.toFixed(4)) };
  }

  /**
   * ประมาณจำนวน tokens จาก string (approximation: 1 token ≈ 4 chars EN, ≈ 1.5 chars TH)
   * @param {string} text
   * @returns {number}
   */
  estimateTokens(text) {
    if (!text) return 0;
    const thaiChars = (text.match(/[\u0E00-\u0E7F]/g) || []).length;
    const otherChars = text.length - thaiChars;
    return Math.ceil(thaiChars / 1.5 + otherChars / 4);
  }

  /**
   * ประมาณ cost ก่อน call จริง
   * @param {string} modelId
   * @param {string} prompt
   * @param {number} [estimatedOutputTokens]
   * @returns {{ usd: number, thb: number }}
   */
  estimateCost(modelId, prompt, estimatedOutputTokens = 500) {
    const inputTokens = this.estimateTokens(prompt);
    return this.calculateCost(modelId, inputTokens, estimatedOutputTokens);
  }

  /**
   * สรุป cost สะสมทั้งหมดของ model นี้
   * @returns {{ usd: number, thb: number, calls: number }}
   */
  getCostSummary() {
    return { ...this._costAccum };
  }

  /**
   * สร้าง system prompt สำหรับ review task
   * @param {string} task
   * @param {Object} criteria
   * @returns {string}
   */
  buildReviewSystemPrompt(task, criteria = {}) {
    const criteriaText = Object.entries(criteria)
      .filter(([k]) => k !== 'mode')
      .map(([k, v]) => `- ${k}: ${v}`)
      .join('\n');

    return `คุณเป็น Expert Reviewer สำหรับงาน: "${task}"

หน้าที่ของคุณคือ review content ที่ได้รับและให้ feedback แบบ structured JSON เท่านั้น

เกณฑ์การ review:
${criteriaText || '- ความถูกต้อง\n- ความชัดเจน\n- ความครบถ้วน\n- คุณภาพโดยรวม'}

ตอบกลับด้วย JSON เท่านั้น (ไม่มีข้อความอื่น) ในรูปแบบ:
{
  "approved": boolean,
  "score": number (0-100),
  "recommendation": "approve" | "revise" | "reject",
  "summary": "สรุปการ review ใน 1-2 ประโยค",
  "findings": [
    {
      "severity": "critical" | "major" | "minor" | "suggestion",
      "message": "ปัญหาที่พบ",
      "suggestion": "วิธีแก้ไข"
    }
  ],
  "strengths": ["จุดเด่น 1", "จุดเด่น 2"],
  "requiredChanges": ["การเปลี่ยนแปลงที่ต้องทำ (ถ้ามี)"]
}`;
  }

  /**
   * Parse review response จาก model
   * @param {string} rawContent
   * @param {ModelOutput} rawOutput
   * @returns {ReviewOutput}
   */
  parseReviewResponse(rawContent, rawOutput) {
    try {
      // พยายาม extract JSON จาก response
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('ไม่พบ JSON ใน response');

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        approved:       Boolean(parsed.approved),
        score:          Number(parsed.score) || 50,
        recommendation: parsed.recommendation || 'revise',
        summary:        parsed.summary || '',
        findings:       Array.isArray(parsed.findings) ? parsed.findings : [],
        strengths:      Array.isArray(parsed.strengths) ? parsed.strengths : [],
        requiredChanges: Array.isArray(parsed.requiredChanges) ? parsed.requiredChanges : [],
        raw:            rawOutput,
      };
    } catch (err) {
      logger.warn(`[review] parse failed: ${err.message} — returning fallback`);
      return {
        approved:       false,
        score:          50,
        recommendation: 'revise',
        summary:        rawContent.slice(0, 200),
        findings:       [{ severity: 'minor', message: 'ไม่สามารถ parse review ได้', suggestion: 'ตรวจสอบ format' }],
        strengths:      [],
        requiredChanges: [],
        raw:            rawOutput,
      };
    }
  }

  /**
   * Wrap generate() ด้วย retry logic
   * @param {ModelInput} input
   * @returns {Promise<ModelOutput>}
   */
  async generateWithRetry(input) {
    return withRetry(() => this.generate(input), {
      retries: ENGINE.maxRetries,
      label:   `${this.provider}.generate`,
    });
  }

  /**
   * สร้าง error output มาตรฐาน
   * @param {Error} err
   * @param {string} modelId
   * @returns {ModelOutput}
   */
  errorOutput(err, modelId) {
    return {
      success:   false,
      content:   '',
      modelId:   modelId || this.provider,
      provider:  this.provider,
      usage:     { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      cost:      { usd: 0, thb: 0 },
      latencyMs: 0,
      error:     err.message,
    };
  }
}

export default BaseModel;

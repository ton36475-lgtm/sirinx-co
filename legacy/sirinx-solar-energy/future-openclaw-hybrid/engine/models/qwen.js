/**
 * qwen.js — Alibaba Cloud Qwen API Adapter (Extensible)
 * Strengths: Chinese/Thai content, cost-effective bulk processing, SEO at scale
 *
 * วิธีเปิดใช้งาน:
 * 1. สมัคร Alibaba Cloud: https://www.aliyun.com/
 * 2. เปิดใช้ DashScope API
 * 3. ใส่ใน .env: DASHSCOPE_API_KEY=sk-...
 * 4. ติดตั้ง: npm install openai (ใช้ compatible API)
 */

import { BaseModel } from './base-model.js';
import { API_KEYS, MODEL_DEFAULTS, logger } from '../config.js';

// Qwen ใช้ OpenAI-compatible API endpoint
const QWEN_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

export class QwenModel extends BaseModel {
  constructor() {
    super('qwen');
    this.models     = MODEL_DEFAULTS.qwen;
    this.client     = null;
    this.capabilities = [
      'bulk_processing',
      'translation',
      'creative_content_th',
      'seo_content',
      'summarize',
      'data_processing',
      'chinese_content',
      'cost_effective',
    ];
  }

  async initialize() {
    if (!API_KEYS.dashscope) {
      logger.warn('[qwen] DASHSCOPE_API_KEY ไม่มี — Qwen ไม่พร้อมใช้งาน (optional)');
      this.isAvailable = false;
      return false;
    }

    try {
      // Dynamic import OpenAI SDK (ใช้ร่วมกัน — compatible API)
      const { default: OpenAI } = await import('openai');
      this.client      = new OpenAI({
        apiKey:  API_KEYS.dashscope,
        baseURL: QWEN_BASE_URL,
      });
      this.isAvailable = true;
      logger.info('[qwen] พร้อมใช้งาน ✓ (Alibaba DashScope)');
      return true;
    } catch (err) {
      logger.error(`[qwen] initialize failed: ${err.message}`);
      this.isAvailable = false;
      return false;
    }
  }

  _selectModel(tier = 'default') {
    return this.models[tier] || this.models.default;
  }

  async generate(input) {
    if (!this.isAvailable) {
      return this.errorOutput(new Error('Qwen ไม่พร้อมใช้งาน — ไม่มี DASHSCOPE_API_KEY'), 'qwen-plus');
    }

    const modelId = this._selectModel(input.tier || 'default');
    const started = Date.now();

    try {
      logger.debug(`[qwen] generate | model=${modelId} | task=${input.task}`);

      const messages = [
        {
          role:    'system',
          content: input.systemRole || `คุณเป็น AI assistant ที่ทำงานใน SIRINX Solar Energy Platform\nTask: ${input.task || 'general'}`,
        },
        {
          role:    'user',
          content: input.context
            ? `Context: ${input.context}\n\nTask: ${input.prompt}`
            : input.prompt,
        },
      ];

      const response  = await this.client.chat.completions.create({
        model:       modelId,
        messages,
        max_tokens:  input.options?.maxTokens || 4096,
        temperature: input.options?.temperature ?? 0.7,
      });

      const content   = response.choices[0]?.message?.content || '';
      const usage     = {
        inputTokens:  response.usage?.prompt_tokens || this.estimateTokens(input.prompt),
        outputTokens: response.usage?.completion_tokens || this.estimateTokens(content),
        totalTokens:  response.usage?.total_tokens || 0,
      };
      const cost      = this.calculateCost(modelId, usage.inputTokens, usage.outputTokens);
      const latencyMs = Date.now() - started;

      logger.info(`[qwen] done | ${usage.totalTokens} tokens | ${cost.thb.toFixed(2)} THB | ${latencyMs}ms`);

      return {
        success:   true,
        content,
        modelId,
        provider:  'qwen',
        usage,
        cost,
        latencyMs,
      };
    } catch (err) {
      logger.error(`[qwen] generate error: ${err.message}`);
      return this.errorOutput(err, modelId);
    }
  }

  async review(content, task, criteria = {}) {
    if (!this.isAvailable) {
      return { approved: false, score: 0, findings: [], summary: 'Qwen ไม่พร้อมใช้งาน', raw: null };
    }

    const systemPrompt = this.buildReviewSystemPrompt(task, criteria);
    const result = await this.generate({
      task:       `review: ${task}`,
      prompt:     `${systemPrompt}\n\nContent:\n---\n${content}\n---\nReturn ONLY valid JSON.`,
      tier:       'default',
      options:    { maxTokens: 2048 },
    });

    return this.parseReviewResponse(result.content, result);
  }

  /**
   * Specialized: Bulk SEO content generation (cost-optimized)
   * เหมาะสำหรับสร้าง content จำนวนมากในราคาถูก
   */
  async bulkGenerate(tasks) {
    logger.info(`[qwen] bulk generate ${tasks.length} tasks`);
    const results = [];
    for (const task of tasks) {
      try {
        const result = await this.generate(task);
        results.push({ task: task.task, result, success: true });
        // Rate limit: 50ms delay between calls
        await new Promise(r => setTimeout(r, 50));
      } catch (err) {
        results.push({ task: task.task, error: err.message, success: false });
      }
    }
    return results;
  }
}

// Singleton instance
let _instance = null;
export function getQwenModel() {
  if (!_instance) _instance = new QwenModel();
  return _instance;
}

export default QwenModel;

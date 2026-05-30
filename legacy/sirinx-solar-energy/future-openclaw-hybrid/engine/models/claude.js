/**
 * claude.js — Anthropic Claude API Adapter
 * จัดการการเชื่อมต่อกับ Claude API ผ่าน @anthropic-ai/sdk
 * Strengths: Thai language, creative content, marketing, brand voice, UI review
 */

import Anthropic from '@anthropic-ai/sdk';
import { BaseModel } from './base-model.js';
import { API_KEYS, MODEL_DEFAULTS, ENGINE, logger } from '../config.js';

export class ClaudeModel extends BaseModel {
  constructor() {
    super('claude');
    this.models     = MODEL_DEFAULTS.claude;
    this.client     = null;
    this.capabilities = [
      'creative_content_th',
      'creative_content_en',
      'marketing_copy',
      'seo_content',
      'translation',
      'code_review',
      'ui_review',
      'brand_voice',
      'summarize',
      'technical_docs',
    ];
  }

  async initialize() {
    if (!API_KEYS.anthropic) {
      logger.warn('[claude] ANTHROPIC_API_KEY ไม่มี — Claude ไม่พร้อมใช้งาน');
      this.isAvailable = false;
      return false;
    }
    try {
      this.client      = new Anthropic({ apiKey: API_KEYS.anthropic });
      this.isAvailable = true;
      logger.info('[claude] พร้อมใช้งาน ✓');
      return true;
    } catch (err) {
      logger.error(`[claude] initialize failed: ${err.message}`);
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * เลือก model ID จาก tier
   * @param {'fast'|'default'|'complex'} tier
   * @returns {string}
   */
  _selectModel(tier = 'default') {
    return this.models[tier] || this.models.default;
  }

  /**
   * สร้าง system prompt เริ่มต้น
   */
  _defaultSystem(task) {
    return `คุณเป็น AI assistant ของ SIRINX Solar Energy Platform
ทำงานเป็นส่วนหนึ่งของระบบ Multi-Model Orchestration Engine
Task: ${task || 'general assistance'}

แนวทาง:
- ตอบเป็นภาษาไทยเว้นแต่จะถูกขอให้ตอบภาษาอื่น
- ให้ข้อมูลที่ถูกต้อง ครบถ้วน และเป็นประโยชน์
- Output เป็น structured format ตาม task ที่กำหนด`;
  }

  async generate(input) {
    if (!this.isAvailable) {
      return this.errorOutput(new Error('Claude ไม่พร้อมใช้งาน — ไม่มี API key'), 'claude');
    }

    const modelId   = this._selectModel(input.tier || 'default');
    const system    = input.systemRole || this._defaultSystem(input.task);
    const userMsg   = input.context
      ? `## Context จาก model อื่น:\n${input.context}\n\n## Task:\n${input.prompt}`
      : input.prompt;

    const started = Date.now();
    try {
      logger.debug(`[claude] generate | model=${modelId} | task=${input.task}`);

      const response = await this.client.messages.create({
        model:       modelId,
        max_tokens:  input.options?.maxTokens || 4096,
        system,
        messages: [{ role: 'user', content: userMsg }],
      });

      const content   = response.content[0]?.text || '';
      const usage     = {
        inputTokens:  response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens:  response.usage.input_tokens + response.usage.output_tokens,
      };
      const cost      = this.calculateCost(modelId, usage.inputTokens, usage.outputTokens);
      const latencyMs = Date.now() - started;

      logger.info(`[claude] done | ${usage.totalTokens} tokens | ${cost.thb.toFixed(2)} THB | ${latencyMs}ms`);

      return {
        success:   true,
        content,
        modelId,
        provider:  'claude',
        usage,
        cost,
        latencyMs,
        metadata: { stopReason: response.stop_reason },
      };
    } catch (err) {
      logger.error(`[claude] generate error: ${err.message}`);
      return this.errorOutput(err, modelId);
    }
  }

  async review(content, task, criteria = {}) {
    if (!this.isAvailable) {
      return { approved: false, score: 0, findings: [], summary: 'Claude ไม่พร้อมใช้งาน', raw: null };
    }

    const systemPrompt = this.buildReviewSystemPrompt(task, criteria);
    const result = await this.generate({
      task:       `review: ${task}`,
      prompt:     `ตรวจสอบและ review content ต่อไปนี้:\n\n---\n${content}\n---`,
      systemRole: systemPrompt,
      tier:       'default',
      options:    { maxTokens: 2048 },
    });

    return this.parseReviewResponse(result.content, result);
  }

  /**
   * Specialized: สร้าง SEO content ภาษาไทย
   */
  async generateSEO(keyword, location, wordCount = 800) {
    return this.generateWithRetry({
      task:    'seo_content_th',
      prompt: `สร้างบทความ SEO ภาษาไทยสำหรับ keyword: "${keyword}" จังหวัด: ${location}

ข้อกำหนด:
- ความยาว ${wordCount} คำ
- มี H1, H2, H3 ที่เหมาะสม
- ใส่ keyword อย่างเป็นธรรมชาติ
- เน้นประโยชน์ของ solar energy สำหรับธุรกิจใน ${location}
- Call to action ท้ายบทความ
- Meta description 160 ตัวอักษร

ส่งกลับเป็น JSON:
{
  "title": "H1 title",
  "metaDescription": "meta desc",
  "content": "บทความทั้งหมด",
  "keywords": ["keyword list"],
  "wordCount": number
}`,
      tier: 'default',
    });
  }

  /**
   * Specialized: Marketing copy ภาษาไทย
   */
  async generateMarketingCopy(product, audience, channel) {
    return this.generateWithRetry({
      task:    'marketing_copy',
      prompt: `สร้าง marketing copy สำหรับ:
- สินค้า/บริการ: ${product}
- กลุ่มเป้าหมาย: ${audience}
- ช่องทาง: ${channel}

ใช้ AIDA framework (Attention, Interest, Desire, Action)
เน้นภาษาไทยที่เข้าใจง่าย กระชับ มีพลัง

ส่งกลับเป็น JSON:
{
  "headline": "หัวข้อหลัก",
  "subheadline": "หัวข้อรอง",
  "body": "เนื้อหา",
  "cta": "Call to action",
  "hashtags": ["#tag1", "#tag2"]
}`,
      tier: 'default',
    });
  }
}

// Singleton instance
let _instance = null;
export function getClaudeModel() {
  if (!_instance) _instance = new ClaudeModel();
  return _instance;
}

export default ClaudeModel;

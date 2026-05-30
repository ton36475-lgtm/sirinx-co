/**
 * gemini.js — Google Gemini API Adapter (Extensible — ใส่ API key แล้วพร้อมใช้งาน)
 * Strengths: multimodal, image prompts, long context, cost-effective
 *
 * วิธีเปิดใช้งาน:
 * 1. ไปที่ https://makersuite.google.com/app/apikey
 * 2. สร้าง API key และใส่ใน .env: GOOGLE_API_KEY=AIza...
 * 3. ติดตั้ง: npm install @google/generative-ai
 */

import { BaseModel } from './base-model.js';
import { API_KEYS, MODEL_DEFAULTS, logger } from '../config.js';

export class GeminiModel extends BaseModel {
  constructor() {
    super('gemini');
    this.models     = MODEL_DEFAULTS.gemini;
    this.client     = null;
    this.capabilities = [
      'image_prompt',
      'multimodal',
      'long_context',
      'creative_content_th',
      'creative_content_en',
      'translation',
      'bulk_processing',
      'summarize',
    ];
  }

  async initialize() {
    if (!API_KEYS.google) {
      logger.warn('[gemini] GOOGLE_API_KEY ไม่มี — Gemini ไม่พร้อมใช้งาน (optional)');
      this.isAvailable = false;
      return false;
    }

    try {
      // Dynamic import เพื่อให้ engine ทำงานได้แม้ไม่ได้ install @google/generative-ai
      const { GoogleGenerativeAI } = await import('@google/generative-ai').catch(() => {
        throw new Error('กรุณาติดตั้ง: npm install @google/generative-ai');
      });

      this.GoogleGenerativeAI = GoogleGenerativeAI;
      this.genAI       = new GoogleGenerativeAI(API_KEYS.google);
      this.isAvailable = true;
      logger.info('[gemini] พร้อมใช้งาน ✓');
      return true;
    } catch (err) {
      logger.warn(`[gemini] initialize failed: ${err.message} — Gemini จะถูกข้าม`);
      this.isAvailable = false;
      return false;
    }
  }

  _selectModel(tier = 'default') {
    return this.models[tier] || this.models.default;
  }

  async generate(input) {
    if (!this.isAvailable) {
      return this.errorOutput(new Error('Gemini ไม่พร้อมใช้งาน — ไม่มี API key หรือ package'), 'gemini-1.5-flash');
    }

    const modelId = this._selectModel(input.tier || 'default');
    const started = Date.now();

    try {
      logger.debug(`[gemini] generate | model=${modelId} | task=${input.task}`);

      const model  = this.genAI.getGenerativeModel({ model: modelId });
      const prompt = input.context
        ? `Context: ${input.context}\n\nTask: ${input.prompt}`
        : input.prompt;

      const result   = await model.generateContent(prompt);
      const response = await result.response;
      const content  = response.text();

      // Gemini token counting (approximation — exact usage requires separate call)
      const inputTokens  = this.estimateTokens(prompt);
      const outputTokens = this.estimateTokens(content);
      const usage        = { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens };
      const cost         = this.calculateCost(modelId, inputTokens, outputTokens);
      const latencyMs    = Date.now() - started;

      logger.info(`[gemini] done | ~${usage.totalTokens} tokens | ${cost.thb.toFixed(2)} THB | ${latencyMs}ms`);

      return {
        success:   true,
        content,
        modelId,
        provider:  'gemini',
        usage,
        cost,
        latencyMs,
        metadata: { note: 'token count estimated' },
      };
    } catch (err) {
      logger.error(`[gemini] generate error: ${err.message}`);
      return this.errorOutput(err, modelId);
    }
  }

  async review(content, task, criteria = {}) {
    if (!this.isAvailable) {
      return { approved: false, score: 0, findings: [], summary: 'Gemini ไม่พร้อมใช้งาน', raw: null };
    }

    const systemContext = this.buildReviewSystemPrompt(task, criteria);
    const result = await this.generate({
      task:    `review: ${task}`,
      prompt:  `${systemContext}\n\nContent to review:\n---\n${content}\n---\n\nReturn ONLY valid JSON.`,
      tier:    'default',
      options: { maxTokens: 2048 },
    });

    return this.parseReviewResponse(result.content, result);
  }

  /**
   * Specialized: สร้าง image prompt สำหรับ Midjourney / DALL-E
   */
  async generateImagePrompt(concept, style = 'professional', aspectRatio = '16:9') {
    return this.generateWithRetry({
      task:    'image_prompt',
      prompt: `สร้าง image prompt สำหรับ AI image generator (Midjourney/DALL-E):

Concept: ${concept}
Style: ${style}
Aspect Ratio: ${aspectRatio}
Context: Solar energy business in Thailand

ส่งกลับ JSON:
{
  "prompt": "detailed English prompt for AI image generator",
  "negativePrompt": "things to avoid",
  "style": "${style}",
  "suggestedTools": ["Midjourney", "DALL-E", "Stable Diffusion"]
}`,
      tier: 'default',
    });
  }

  /**
   * Specialized: Long document summarization
   */
  async summarizeLongDoc(document, language = 'th') {
    const langInstruction = language === 'th' ? 'ภาษาไทย' : 'English';
    return this.generateWithRetry({
      task:    'long_context_summarize',
      prompt: `สรุปเอกสารต่อไปนี้เป็น${langInstruction}:\n\n${document}\n\nส่งกลับ JSON:\n{"summary": "สรุป", "keyPoints": ["จุดสำคัญ"], "actionItems": ["สิ่งที่ต้องทำ"]}`,
      tier:    'complex',
      options: { maxTokens: 4096 },
    });
  }
}

// Singleton instance
let _instance = null;
export function getGeminiModel() {
  if (!_instance) _instance = new GeminiModel();
  return _instance;
}

export default GeminiModel;

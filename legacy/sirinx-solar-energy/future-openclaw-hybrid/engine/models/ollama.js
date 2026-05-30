/**
 * ollama.js — Local Ollama Adapter (OpenAI-compatible)
 * ใช้ models ที่ run บนเครื่อง — ฟรี 100% ไม่มีค่า API
 *
 * Models ที่มีในเครื่อง Tony:
 *   llama3.1:latest     — general purpose, Thai OK
 *   qwen2.5-coder:7b    — code (fast)
 *   qwen2.5-coder:14b   — code (smart)
 *   qwen3-vl:4b         — vision + multimodal
 *
 * วิธีเพิ่ม model: ollama pull <model-name>
 */

import OpenAI from 'openai';
import { BaseModel } from './base-model.js';
import { MODEL_DEFAULTS, logger } from '../config.js';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';

export class OllamaModel extends BaseModel {
  constructor() {
    super('ollama');
    this.models     = MODEL_DEFAULTS.ollama;
    this.client     = null;
    this.capabilities = [
      'creative_content_th',
      'creative_content_en',
      'code_generation',
      'code_review',
      'debugging',
      'test_writing',
      'api_design',
      'seo_content',
      'marketing_copy',
      'data_analysis',
      'research',
      'translation',
      'summarize',
      'technical_docs',
      'vision',        // qwen3-vl
      'multimodal',
    ];
  }

  async initialize() {
    try {
      // Probe Ollama — ตรวจว่า server รันอยู่
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`Ollama ตอบ ${res.status}`);

      const data = await res.json();
      this._availableModels = (data.models || []).map(m => m.name);

      if (this._availableModels.length === 0) {
        logger.warn('[ollama] Server รันอยู่แต่ไม่มี model — ดาวน์โหลดด้วย: ollama pull llama3.1');
        this.isAvailable = false;
        return false;
      }

      // OpenAI-compatible client
      this.client = new OpenAI({
        apiKey:  'ollama',           // Ollama ไม่ต้องการ key จริง
        baseURL: `${OLLAMA_BASE_URL}/v1`,
      });

      this.isAvailable = true;
      logger.info(`[ollama] พร้อมใช้งาน ✓ | models: ${this._availableModels.join(', ')}`);
      return true;
    } catch (err) {
      logger.warn(`[ollama] ไม่สามารถเชื่อมต่อ ${OLLAMA_BASE_URL} — ${err.message}`);
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * เลือก model ตาม tier และ task
   */
  _selectModel(tier = 'default', task = '') {
    // Vision/multimodal tasks → qwen3-vl
    if (['vision', 'multimodal', 'image_analysis', 'roof_analysis', 'bill_ocr'].includes(task)) {
      return this._pickAvailable(['qwen3-vl:4b', this.models.default]);
    }
    // Code tasks → qwen2.5-coder
    if (['code_generation', 'code_review', 'debugging', 'test_writing', 'api_design'].includes(task)) {
      const codeModel = tier === 'complex'
        ? this._pickAvailable(['qwen2.5-coder:14b', 'qwen2.5-coder:7b'])
        : this._pickAvailable(['qwen2.5-coder:7b', 'qwen2.5-coder:14b']);
      return codeModel || this.models.default;
    }
    // Tier map
    const tierMap = {
      fast:    this.models.fast,
      default: this.models.default,
      complex: this.models.complex,
    };
    return this._pickAvailable([tierMap[tier] || this.models.default]);
  }

  _pickAvailable(candidates) {
    for (const m of candidates) {
      if (this._availableModels?.includes(m)) return m;
    }
    return this._availableModels?.[0] || this.models.default;
  }

  _defaultSystem(task) {
    return `You are an expert AI assistant for SIRINX Solar Energy Platform.
Task context: ${task || 'general assistance'}
- Respond in the same language as the prompt (Thai or English)
- Be accurate, concise, and actionable`;
  }

  async generate(input) {
    if (!this.isAvailable) {
      return this.errorOutput(new Error('Ollama ไม่พร้อมใช้งาน — ตรวจสอบว่า ollama serve รันอยู่'), this.models.default);
    }

    const modelId = this._selectModel(input.tier || 'default', input.task);
    const userMsg = input.context
      ? `## Context:\n${input.context}\n\n## Task:\n${input.prompt}`
      : input.prompt;

    const started = Date.now();
    try {
      logger.debug(`[ollama] generate | model=${modelId} | task=${input.task}`);

      const response = await this.client.chat.completions.create({
        model:       modelId,
        messages: [
          { role: 'system', content: input.systemRole || this._defaultSystem(input.task) },
          { role: 'user',   content: userMsg },
        ],
        temperature: input.options?.temperature ?? 0.7,
        // Ollama ไม่ใช้ max_tokens แบบ strict — ใช้ num_predict ผ่าน options แทน
      });

      const content   = response.choices[0]?.message?.content || '';
      // Ollama คืน usage บางครั้ง
      const usage = {
        inputTokens:  response.usage?.prompt_tokens     || this.estimateTokens(userMsg),
        outputTokens: response.usage?.completion_tokens || this.estimateTokens(content),
        totalTokens:  response.usage?.total_tokens      || 0,
      };
      usage.totalTokens = usage.totalTokens || (usage.inputTokens + usage.outputTokens);

      const latencyMs = Date.now() - started;

      logger.info(`[ollama] done | model=${modelId} | ~${usage.totalTokens} tokens | 0.00 THB (local) | ${latencyMs}ms`);

      return {
        success:   true,
        content,
        modelId,
        provider:  'ollama',
        usage,
        cost:      { usd: 0, thb: 0 },   // LOCAL = FREE
        latencyMs,
        metadata:  { local: true, finishReason: response.choices[0]?.finish_reason },
      };
    } catch (err) {
      logger.error(`[ollama] generate error: ${err.message}`);
      return this.errorOutput(err, modelId);
    }
  }

  async review(content, task, criteria = {}) {
    if (!this.isAvailable) {
      return { approved: false, score: 0, findings: [], summary: 'Ollama ไม่พร้อมใช้งาน', raw: null };
    }

    const systemPrompt = this.buildReviewSystemPrompt(task, criteria);
    const result = await this.generate({
      task:       `review: ${task}`,
      prompt:     `Review the following content:\n\n---\n${content}\n---\n\nReturn ONLY valid JSON, no other text.`,
      systemRole: systemPrompt,
      tier:       'default',
    });

    return this.parseReviewResponse(result.content, result);
  }

  /**
   * คืนรายชื่อ models ที่ available ในเครื่อง
   */
  getAvailableModels() {
    return this._availableModels || [];
  }
}

// Singleton instance
let _instance = null;
export function getOllamaModel() {
  if (!_instance) _instance = new OllamaModel();
  return _instance;
}

export default OllamaModel;

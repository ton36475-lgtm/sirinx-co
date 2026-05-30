/**
 * grok.js — xAI Grok API Adapter (OpenAI-compatible)
 * Grok ใช้ OpenAI-compatible API — ติดตั้งได้ทันทีผ่าน openai package
 * Strengths: real-time web, Thai content, code, creative writing, long context
 *
 * วิธีเปิดใช้งาน:
 * 1. ไปที่ https://console.x.ai
 * 2. สร้าง API key และใส่ใน .env: XAI_API_KEY=xai-...
 * 3. ใช้ openai package ที่ติดตั้งไว้แล้ว (base URL เปลี่ยน)
 */

import OpenAI from 'openai';
import { BaseModel } from './base-model.js';
import { API_KEYS, MODEL_DEFAULTS, ENGINE, logger } from '../config.js';

export class GrokModel extends BaseModel {
  constructor() {
    super('grok');
    this.models     = MODEL_DEFAULTS.grok;
    this.client     = null;
    this.capabilities = [
      'creative_content_th',
      'creative_content_en',
      'code_generation',
      'code_review',
      'debugging',
      'seo_content',
      'marketing_copy',
      'data_analysis',
      'research',
      'competitive_intel',
      'translation',
      'reasoning',
      'technical_docs',
    ];
  }

  async initialize() {
    if (!API_KEYS.xai) {
      logger.warn('[grok] XAI_API_KEY ไม่มี — Grok ไม่พร้อมใช้งาน');
      this.isAvailable = false;
      return false;
    }
    try {
      // Grok ใช้ OpenAI-compatible API — แค่เปลี่ยน baseURL
      this.client = new OpenAI({
        apiKey:  API_KEYS.xai,
        baseURL: 'https://api.x.ai/v1',
      });
      this.isAvailable = true;
      logger.info('[grok] พร้อมใช้งาน ✓');
      return true;
    } catch (err) {
      logger.error(`[grok] initialize failed: ${err.message}`);
      this.isAvailable = false;
      return false;
    }
  }

  _selectModel(tier = 'default') {
    return this.models[tier] || this.models.default;
  }

  _defaultSystem(task) {
    return `You are an expert AI assistant for SIRINX Solar Energy Platform, working as part of a Multi-Model Orchestration Engine.

Task context: ${task || 'general assistance'}

Guidelines:
- Respond in the same language as the prompt (Thai or English)
- Provide accurate, complete, and actionable output
- For code tasks: include working code with proper error handling
- For reviews: provide structured, actionable feedback
- Be direct and concise`;
  }

  async generate(input) {
    if (!this.isAvailable) {
      return this.errorOutput(new Error('Grok ไม่พร้อมใช้งาน — ไม่มี XAI_API_KEY'), this.models.default);
    }

    const modelId = this._selectModel(input.tier || 'default');
    const userMsg = input.context
      ? `## Context from other model:\n${input.context}\n\n## Task:\n${input.prompt}`
      : input.prompt;

    const started = Date.now();
    try {
      logger.debug(`[grok] generate | model=${modelId} | task=${input.task}`);

      const response = await this.client.chat.completions.create({
        model:       modelId,
        messages: [
          { role: 'system', content: input.systemRole || this._defaultSystem(input.task) },
          { role: 'user',   content: userMsg },
        ],
        max_tokens:  input.options?.maxTokens  || 4096,
        temperature: input.options?.temperature ?? 0.7,
      });

      const content   = response.choices[0]?.message?.content || '';
      const usage     = {
        inputTokens:  response.usage.prompt_tokens,
        outputTokens: response.usage.completion_tokens,
        totalTokens:  response.usage.total_tokens,
      };
      const cost      = this.calculateCost(modelId, usage.inputTokens, usage.outputTokens);
      const latencyMs = Date.now() - started;

      logger.info(`[grok] done | ${usage.totalTokens} tokens | ${cost.thb.toFixed(2)} THB | ${latencyMs}ms`);

      return {
        success:   true,
        content,
        modelId,
        provider:  'grok',
        usage,
        cost,
        latencyMs,
        metadata:  { finishReason: response.choices[0]?.finish_reason },
      };
    } catch (err) {
      logger.error(`[grok] generate error: ${err.message}`);
      return this.errorOutput(err, modelId);
    }
  }

  async review(content, task, criteria = {}) {
    if (!this.isAvailable) {
      return { approved: false, score: 0, findings: [], summary: 'Grok ไม่พร้อมใช้งาน', raw: null };
    }

    const systemPrompt = this.buildReviewSystemPrompt(task, criteria);
    const result = await this.generate({
      task:       `review: ${task}`,
      prompt:     `Review the following content:\n\n---\n${content}\n---\n\nReturn ONLY valid JSON, no other text.`,
      systemRole: systemPrompt,
      tier:       'default',
      options:    { maxTokens: 2048 },
    });

    return this.parseReviewResponse(result.content, result);
  }
}

// Singleton instance
let _instance = null;
export function getGrokModel() {
  if (!_instance) _instance = new GrokModel();
  return _instance;
}

export default GrokModel;

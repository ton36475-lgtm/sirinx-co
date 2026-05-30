/**
 * chatgpt.js — OpenAI ChatGPT API Adapter
 * จัดการการเชื่อมต่อกับ OpenAI API
 * Strengths: code generation, debugging, test writing, reasoning, technical docs
 */

import OpenAI from 'openai';
import { BaseModel } from './base-model.js';
import { API_KEYS, MODEL_DEFAULTS, ENGINE, logger } from '../config.js';

export class ChatGPTModel extends BaseModel {
  constructor() {
    super('chatgpt');
    this.models     = MODEL_DEFAULTS.chatgpt;
    this.client     = null;
    this.capabilities = [
      'code_generation',
      'code_review',
      'debugging',
      'test_writing',
      'technical_docs',
      'data_analysis',
      'creative_content_en',
      'reasoning',
      'api_design',
      'security_review',
    ];
  }

  async initialize() {
    if (!API_KEYS.openai) {
      logger.warn('[chatgpt] OPENAI_API_KEY ไม่มี — ChatGPT ไม่พร้อมใช้งาน');
      this.isAvailable = false;
      return false;
    }
    try {
      this.client      = new OpenAI({ apiKey: API_KEYS.openai });
      this.isAvailable = true;
      logger.info('[chatgpt] พร้อมใช้งาน ✓');
      return true;
    } catch (err) {
      logger.error(`[chatgpt] initialize failed: ${err.message}`);
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * เลือก model ID จาก tier
   * o1/o1-mini ใช้ reasoning mode (ไม่มี system message)
   */
  _selectModel(tier = 'default') {
    const map = {
      fast:    this.models.fast,
      default: this.models.default,
      complex: this.models.complex,
      reason:  this.models.reason,
    };
    return map[tier] || this.models.default;
  }

  /**
   * ตรวจว่าเป็น reasoning model (o1 series)
   */
  _isReasoningModel(modelId) {
    return modelId.startsWith('o1') || modelId.startsWith('o3');
  }

  /**
   * สร้าง system message เริ่มต้น
   */
  _defaultSystem(task) {
    return `You are an expert AI assistant for SIRINX Solar Energy Platform, working as part of a Multi-Model Orchestration Engine.

Task context: ${task || 'general assistance'}

Guidelines:
- Respond in the same language as the prompt (Thai or English)
- Provide accurate, complete, and actionable output
- For code tasks: include working code with proper error handling
- For reviews: provide structured, actionable feedback`;
  }

  async generate(input) {
    if (!this.isAvailable) {
      return this.errorOutput(new Error('ChatGPT ไม่พร้อมใช้งาน — ไม่มี API key'), 'gpt-4o');
    }

    const modelId = this._selectModel(input.tier || 'default');
    const isReasoning = this._isReasoningModel(modelId);

    const userMsg = input.context
      ? `## Context from other model:\n${input.context}\n\n## Task:\n${input.prompt}`
      : input.prompt;

    const started = Date.now();
    try {
      logger.debug(`[chatgpt] generate | model=${modelId} | task=${input.task}`);

      // o1 models ไม่รองรับ system message (ใช้ developer role แทน)
      let messages;
      if (isReasoning) {
        messages = [
          { role: 'developer', content: this._defaultSystem(input.task) },
          { role: 'user', content: userMsg },
        ];
      } else {
        messages = [
          { role: 'system', content: input.systemRole || this._defaultSystem(input.task) },
          { role: 'user', content: userMsg },
        ];
      }

      const params = {
        model:    modelId,
        messages,
      };

      // o1 ใช้ max_completion_tokens แทน max_tokens
      if (isReasoning) {
        params.max_completion_tokens = input.options?.maxTokens || 8192;
      } else {
        params.max_tokens = input.options?.maxTokens || 4096;
        params.temperature = input.options?.temperature ?? 0.7;
      }

      const response  = await this.client.chat.completions.create(params);
      const content   = response.choices[0]?.message?.content || '';
      const usage     = {
        inputTokens:  response.usage.prompt_tokens,
        outputTokens: response.usage.completion_tokens,
        totalTokens:  response.usage.total_tokens,
      };
      const cost      = this.calculateCost(modelId, usage.inputTokens, usage.outputTokens);
      const latencyMs = Date.now() - started;

      logger.info(`[chatgpt] done | ${usage.totalTokens} tokens | ${cost.thb.toFixed(2)} THB | ${latencyMs}ms`);

      return {
        success:   true,
        content,
        modelId,
        provider:  'chatgpt',
        usage,
        cost,
        latencyMs,
        metadata: { finishReason: response.choices[0]?.finish_reason },
      };
    } catch (err) {
      logger.error(`[chatgpt] generate error: ${err.message}`);
      return this.errorOutput(err, modelId);
    }
  }

  async review(content, task, criteria = {}) {
    if (!this.isAvailable) {
      return { approved: false, score: 0, findings: [], summary: 'ChatGPT ไม่พร้อมใช้งาน', raw: null };
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

  /**
   * Specialized: สร้าง code พร้อม tests
   */
  async generateCode(description, language = 'javascript', includeTests = true) {
    return this.generateWithRetry({
      task:    'code_generation',
      prompt: `Generate ${language} code for: ${description}

Requirements:
- Production-ready code with proper error handling
- TypeScript-friendly types if applicable
- ${includeTests ? 'Include unit tests' : 'No tests needed'}
- Follow best practices for ${language}
- Add JSDoc comments for public functions

Return as JSON:
{
  "code": "main implementation",
  "tests": "${includeTests ? 'test code' : 'null'}",
  "explanation": "brief explanation",
  "dependencies": ["required packages"],
  "usage": "example usage"
}`,
      tier: 'default',
      options: { maxTokens: 6000 },
    });
  }

  /**
   * Specialized: Debug และ fix code
   */
  async debugCode(code, errorMessage, language = 'javascript') {
    return this.generateWithRetry({
      task:    'debugging',
      prompt: `Debug this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Error: ${errorMessage}

Return as JSON:
{
  "rootCause": "explanation of the bug",
  "fix": "corrected code",
  "explanation": "what was changed and why",
  "prevention": "how to prevent this in future"
}`,
      tier: 'default',
    });
  }

  /**
   * Specialized: Reasoning tasks (uses o1)
   */
  async reason(problem) {
    return this.generateWithRetry({
      task:    'reasoning',
      prompt:  problem,
      tier:    'reason',
      options: { maxTokens: 8192 },
    });
  }
}

// Singleton instance
let _instance = null;
export function getChatGPTModel() {
  if (!_instance) _instance = new ChatGPTModel();
  return _instance;
}

export default ChatGPTModel;

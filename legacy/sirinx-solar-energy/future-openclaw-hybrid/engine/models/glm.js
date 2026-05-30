/**
 * glm.js — Zhipu AI GLM-5V-Turbo Adapter
 * Multimodal vision+agent model: image/video/text + function calling
 * Context: ~200K tokens | Output: ~128K tokens
 * Pricing: $1.20/M input, $4.00/M output
 *
 * API: OpenAI-compatible
 *   Direct:     https://open.bigmodel.cn/api/paas/v4/
 *   OpenRouter: https://openrouter.ai/api/v1  →  model: z-ai/glm-5v-turbo
 *
 * Solar use cases:
 *   - Roof photo analysis (solar potential assessment)
 *   - Electricity bill OCR (MEA/PEA Thai bills)
 *   - Installation quality inspection
 *   - Site survey photo analysis
 *
 * วิธีเปิดใช้งาน:
 * 1. สมัครที่ https://open.bigmodel.cn/
 * 2. ใส่ใน .env: ZHIPU_API_KEY=your-key
 * 3. (ทางเลือก) ใช้ OpenRouter: OPENROUTER_API_KEY=your-key
 */

import { BaseModel } from './base-model.js';
import { API_KEYS, MODEL_DEFAULTS, logger } from '../config.js';

const ZHIPU_BASE_URL    = process.env.ZHIPU_BASE_URL    || 'https://open.bigmodel.cn/api/paas/v4/';
const OPENROUTER_BASE_URL  = 'https://openrouter.ai/api/v1';
const OPENROUTER_MODEL_ID  = 'z-ai/glm-5v-turbo';

export class GLMModel extends BaseModel {
  constructor() {
    super('glm');
    this.models      = MODEL_DEFAULTS.glm;
    this.client      = null;
    this._useOpenRouter = false;
    this.capabilities = [
      'vision',
      'image_analysis',
      'roof_analysis',
      'bill_ocr',
      'site_inspection',
      'function_calling',
      'agent_workflow',
      'multimodal',
      'long_context',
    ];
  }

  // ──────────────────────────────────────────────────────────────────────
  // Initialization
  // ──────────────────────────────────────────────────────────────────────

  async initialize() {
    const zhipuKey      = API_KEYS.zhipu;
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    if (!zhipuKey && !openrouterKey) {
      logger.warn('[glm] ZHIPU_API_KEY ไม่มี — GLM-5V-Turbo ไม่พร้อมใช้งาน (optional)');
      this.isAvailable = false;
      return false;
    }

    try {
      const { default: OpenAI } = await import('openai');

      if (zhipuKey) {
        // ✅ Direct Zhipu AI API
        this.client = new OpenAI({
          apiKey:  zhipuKey,
          baseURL: ZHIPU_BASE_URL,
        });
        this._useOpenRouter = false;
        logger.info('[glm] พร้อมใช้งาน ✓ (Zhipu AI direct — glm-5v-turbo)');
      } else {
        // 🔀 Fallback: OpenRouter
        this.client = new OpenAI({
          apiKey:  openrouterKey,
          baseURL: OPENROUTER_BASE_URL,
          defaultHeaders: {
            'HTTP-Referer': 'https://sirinx.ai',
            'X-Title':      'SIRINX Solar AI Platform',
          },
        });
        this._useOpenRouter = true;
        logger.info('[glm] พร้อมใช้งาน ✓ (OpenRouter → z-ai/glm-5v-turbo)');
      }

      this.isAvailable = true;
      return true;
    } catch (err) {
      logger.error(`[glm] initialize failed: ${err.message}`);
      this.isAvailable = false;
      return false;
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // Internal helpers
  // ──────────────────────────────────────────────────────────────────────

  _resolveModelId(tier = 'default') {
    if (this._useOpenRouter) return OPENROUTER_MODEL_ID;
    return this.models[tier] || this.models.default;
  }

  /**
   * Build OpenAI-compatible multi-modal content array.
   * @param {string}   prompt
   * @param {string[]} imageBase64s — raw base64 or data URL strings
   * @returns {Array}
   */
  _buildVisionContent(prompt, imageBase64s = []) {
    const content = [];
    for (const b64 of imageBase64s) {
      const dataUrl = b64.startsWith('data:') ? b64 : `data:image/jpeg;base64,${b64}`;
      content.push({ type: 'image_url', image_url: { url: dataUrl } });
    }
    content.push({ type: 'text', text: prompt });
    return content;
  }

  // ──────────────────────────────────────────────────────────────────────
  // Core generate()
  // ──────────────────────────────────────────────────────────────────────

  /**
   * @param {import('./base-model.js').ModelInput & { images?: string[], tools?: Object[] }} input
   * @returns {Promise<import('./base-model.js').ModelOutput>}
   */
  async generate(input) {
    if (!this.isAvailable) {
      return this.errorOutput(new Error('GLM ไม่พร้อมใช้งาน — ไม่มี ZHIPU_API_KEY'), 'glm-5v-turbo');
    }

    const modelId = this._resolveModelId(input.tier || 'default');
    const started = Date.now();

    try {
      logger.debug(`[glm] generate | model=${modelId} | task=${input.task}`);

      // Build user message content — multimodal if images provided
      let userContent;
      if (input.images?.length) {
        const promptText = input.context
          ? `Context: ${input.context}\n\nTask: ${input.prompt}`
          : input.prompt;
        userContent = this._buildVisionContent(promptText, input.images);
      } else {
        userContent = input.context
          ? `Context: ${input.context}\n\nTask: ${input.prompt}`
          : input.prompt;
      }

      const messages = [
        {
          role:    'system',
          content: input.systemRole
            || `คุณเป็น AI Vision Agent ใน SIRINX Solar Energy Platform\nTask: ${input.task || 'general'}`,
        },
        { role: 'user', content: userContent },
      ];

      const requestParams = {
        model:       modelId,
        messages,
        max_tokens:  input.options?.maxTokens  || 4096,
        temperature: input.options?.temperature ?? 0.7,
      };

      // Function calling / tool use
      if (input.tools?.length) {
        requestParams.tools = input.tools.map(t => ({
          type:     'function',
          function: {
            name:        t.name,
            description: t.description || '',
            parameters:  t.parameters  || { type: 'object', properties: {} },
          },
        }));
      }

      const response = await this.client.chat.completions.create(requestParams);
      const choice   = response.choices[0];
      const msg      = choice?.message;

      const content   = msg?.content || '';
      const toolCalls = (msg?.tool_calls || []).map(tc => ({
        id:    tc.id,
        name:  tc.function.name,
        input: (() => { try { return JSON.parse(tc.function.arguments); } catch { return {}; } })(),
      }));

      const usage = {
        inputTokens:  response.usage?.prompt_tokens     || this.estimateTokens(input.prompt),
        outputTokens: response.usage?.completion_tokens || this.estimateTokens(content),
        totalTokens:  response.usage?.total_tokens      || 0,
      };
      const cost      = this.calculateCost(modelId, usage.inputTokens, usage.outputTokens);
      const latencyMs = Date.now() - started;

      logger.info(`[glm] done | ${usage.totalTokens} tokens | ${cost.thb.toFixed(4)} THB | ${latencyMs}ms`);

      return {
        success:   true,
        content,
        modelId,
        provider:  'glm',
        usage,
        cost,
        latencyMs,
        toolCalls,
        metadata:  { finishReason: choice?.finish_reason },
      };
    } catch (err) {
      logger.error(`[glm] generate error: ${err.message}`);
      return this.errorOutput(err, modelId);
    }
  }

  // ──────────────────────────────────────────────────────────────────────
  // Solar-specific vision methods
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Analyze rooftop photos for solar potential.
   * วิเคราะห์หลังคาจากรูปถ่ายเพื่อประเมิน Solar Potential
   * @param {string[]} imageBase64s
   * @param {{ buildingType?: string, location?: string, systemSize?: number }} [context]
   */
  async analyzeRoof(imageBase64s, context = {}) {
    const prompt = `วิเคราะห์หลังคาจากภาพเพื่อประเมิน Solar Potential และตอบเป็น JSON เท่านั้น:

{
  "roofArea": { "total": number, "usable": number, "unit": "sqm" },
  "orientation": { "direction": string, "tiltAngle": number },
  "obstructions": [{ "type": string, "impact": "low|medium|high" }],
  "roofCondition": { "material": string, "estimatedAge": number, "strength": "good|fair|poor" },
  "solarPotential": { "estimatedKwp": number, "annualKwh": number, "suitabilityScore": number },
  "recommendations": string[],
  "notes": string
}

${context.buildingType ? `ประเภทอาคาร: ${context.buildingType}` : ''}
${context.location     ? `ที่ตั้ง: ${context.location}`         : ''}
${context.systemSize   ? `ขนาดระบบที่ต้องการ: ${context.systemSize} kWp` : ''}`;

    return this.generate({
      task:       'roof_analysis',
      prompt,
      images:     imageBase64s,
      systemRole: 'คุณเป็นผู้เชี่ยวชาญด้าน Solar EPC พร้อม Vision AI สำหรับวิเคราะห์หลังคาและประเมิน solar potential',
      options:    { maxTokens: 2048, temperature: 0.2 },
    });
  }

  /**
   * OCR and parse Thai electricity bill from photo.
   * อ่านและวิเคราะห์ใบแจ้งหนี้ค่าไฟฟ้า (MEA/PEA)
   * @param {string} imageBase64
   */
  async readElectricityBill(imageBase64) {
    const prompt = `อ่านและสกัดข้อมูลจากใบแจ้งหนี้ค่าไฟฟ้า (MEA/PEA) ตอบเป็น JSON เท่านั้น:

{
  "meterNumber": string | null,
  "customerName": string | null,
  "address": string | null,
  "billingPeriod": { "from": string, "to": string } | null,
  "consumption": {
    "currentKwh": number | null,
    "monthlyHistory": [{ "month": string, "kwh": number }]
  },
  "charges": {
    "energyCharge": number | null,
    "ftCharge": number | null,
    "vatAmount": number | null,
    "totalTHB": number | null
  },
  "avgCostPerKwh": number | null,
  "tariffType": "residential|sme|industrial|tou" | null,
  "utility": "MEA|PEA|other" | null,
  "readConfidence": "high|medium|low"
}

หากอ่านค่าไม่ออกให้ใส่ null`;

    return this.generate({
      task:       'bill_ocr',
      prompt,
      images:     [imageBase64],
      systemRole: 'คุณเป็น OCR AI ผู้เชี่ยวชาญด้านใบแจ้งหนี้ MEA/PEA ของประเทศไทย',
      options:    { maxTokens: 1024, temperature: 0.1 },
    });
  }

  /**
   * Inspect solar installation quality from photos.
   * ตรวจสอบคุณภาพการติดตั้ง Solar Cell
   * @param {string[]} imageBase64s
   */
  async inspectInstallation(imageBase64s) {
    const prompt = `ตรวจสอบคุณภาพการติดตั้ง Solar Cell จากภาพ ตอบเป็น JSON เท่านั้น:

{
  "panelAlignment":   { "score": number, "notes": string },
  "mountingRacking":  { "score": number, "notes": string },
  "wiring":           { "score": number, "notes": string },
  "inverterSetup":    { "score": number, "notes": string },
  "overallScore":     number,
  "issues": [
    { "severity": "critical|major|minor", "component": string, "description": string, "action": string }
  ],
  "passesQC":         boolean,
  "recommendations":  string[]
}`;

    return this.generate({
      task:       'installation_inspection',
      prompt,
      images:     imageBase64s,
      systemRole: 'คุณเป็น Solar Installation Inspector ผ่านการอบรม TÜV/IEC มีประสบการณ์ตรวจสอบงาน EPC ไทย',
      options:    { maxTokens: 2048, temperature: 0.2 },
    });
  }

  /**
   * Analyze site survey photos for project planning.
   * วิเคราะห์ภาพ Site Survey
   * @param {string[]} imageBase64s
   * @param {{ projectName?: string, systemSize?: number }} [surveyData]
   */
  async analyzeSiteSurvey(imageBase64s, surveyData = {}) {
    const prompt = `วิเคราะห์ภาพ Site Survey สำหรับโครงการ Solar ตอบเป็น JSON เท่านั้น:

{
  "siteSuitability":  { "score": number, "summary": string },
  "structuralNotes":  string,
  "accessibilityNotes": string,
  "specialRequirements": ["crane", "scaffolding", "permits", ...],
  "riskFactors": [{ "risk": string, "impact": "cost|timeline|safety", "mitigation": string }],
  "layoutRecommendation": string,
  "estimatedInstallDays": number | null,
  "additionalNotes": string
}

${surveyData.projectName ? `โครงการ: ${surveyData.projectName}` : ''}
${surveyData.systemSize  ? `ขนาดระบบ: ${surveyData.systemSize} kWp` : ''}`;

    return this.generate({
      task:       'site_survey',
      prompt,
      images:     imageBase64s,
      systemRole: 'คุณเป็น Solar Project Engineer ผู้เชี่ยวชาญ Site Assessment สำหรับโครงการ EPC ในไทย',
      options:    { maxTokens: 2048, temperature: 0.3 },
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // Review (for critique loop)
  // ──────────────────────────────────────────────────────────────────────

  async review(content, task, criteria = {}) {
    if (!this.isAvailable) {
      return { approved: false, score: 0, findings: [], summary: 'GLM ไม่พร้อมใช้งาน', raw: null };
    }

    const systemPrompt = this.buildReviewSystemPrompt(task, criteria);
    const result = await this.generate({
      task:    `review: ${task}`,
      prompt:  `${systemPrompt}\n\nContent:\n---\n${content}\n---\nReturn ONLY valid JSON.`,
      tier:    'default',
      options: { maxTokens: 2048 },
    });

    return this.parseReviewResponse(result.content, result);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Singleton
// ──────────────────────────────────────────────────────────────────────────
let _instance = null;
export function getGLMModel() {
  if (!_instance) _instance = new GLMModel();
  return _instance;
}

export default GLMModel;

/**
 * model-registry.js — Model Registry and Capability Mapping
 * จัดการ: register/remove models, route tasks ไปยัง model ที่ดีที่สุด
 * รองรับ: cost optimization, capability matching, fallback chains
 */

import { logger, getAvailableModels } from './config.js';

// ===== Task → Model Routing Map =====
// ลำดับคือ priority — model แรกที่ available จะถูกเลือก
// NOTE: ollama (local/free) อยู่อันดับแรกเสมอ → fallback ไป gemini → cloud models
export const TASK_MODEL_MAP = {
  // Code — qwen2.5-coder ใน ollama แรก
  'code_generation':      ['ollama', 'grok', 'gemini', 'chatgpt', 'claude'],
  'code_review':          ['ollama', 'grok', 'gemini', 'claude', 'chatgpt'],
  'debugging':            ['ollama', 'grok', 'gemini', 'chatgpt', 'claude'],
  'test_writing':         ['ollama', 'grok', 'gemini', 'chatgpt', 'claude'],
  'api_design':           ['ollama', 'grok', 'gemini', 'chatgpt', 'claude'],
  'security_review':      ['ollama', 'grok', 'gemini', 'chatgpt', 'claude'],

  // Content (Thai)
  'creative_content_th':  ['ollama', 'gemini', 'grok', 'claude', 'qwen'],
  'seo_content':          ['ollama', 'gemini', 'grok', 'claude', 'qwen'],
  'seo_content_bulk':     ['ollama', 'gemini', 'qwen', 'grok'],
  'marketing_copy':       ['ollama', 'grok', 'gemini', 'claude', 'chatgpt'],
  'translation':          ['ollama', 'gemini', 'grok', 'claude', 'qwen'],

  // Content (English)
  'creative_content_en':  ['ollama', 'grok', 'gemini', 'chatgpt', 'claude'],
  'technical_docs':       ['ollama', 'grok', 'gemini', 'chatgpt', 'claude'],

  // Analysis
  'data_analysis':        ['ollama', 'grok', 'gemini', 'chatgpt', 'claude'],
  'reasoning':            ['ollama', 'grok', 'gemini', 'chatgpt', 'claude'],
  'financial_modeling':   ['ollama', 'gemini', 'grok', 'chatgpt', 'claude'],

  // Multimodal / Visual — qwen3-vl ใน ollama
  'image_prompt':         ['ollama', 'gemini', 'claude', 'glm'],
  'ui_review':            ['ollama', 'gemini', 'grok', 'claude', 'glm'],
  'brand_voice':          ['ollama', 'grok', 'gemini', 'claude', 'chatgpt'],

  // Vision — qwen3-vl:4b local ก่อน
  'vision':               ['ollama', 'glm', 'gemini', 'claude'],
  'roof_analysis':        ['ollama', 'glm', 'gemini'],
  'bill_ocr':             ['ollama', 'glm', 'gemini'],
  'installation_inspection': ['ollama', 'glm', 'gemini'],
  'site_survey':          ['ollama', 'glm', 'gemini', 'grok'],
  'image_analysis':       ['ollama', 'glm', 'gemini', 'claude'],
  'multimodal':           ['ollama', 'glm', 'gemini'],

  // Bulk / Cost-Optimized
  'bulk_processing':      ['ollama', 'gemini', 'qwen'],
  'summarize':            ['ollama', 'gemini', 'qwen', 'grok'],
  'chinese_content':      ['qwen', 'ollama', 'gemini'],

  // Research
  'research':             ['ollama', 'grok', 'gemini', 'claude', 'chatgpt'],
  'competitive_intel':    ['ollama', 'gemini', 'grok', 'claude', 'chatgpt'],
  'investment_analysis':  ['ollama', 'gemini', 'grok', 'claude', 'chatgpt'],
};

// ===== Cost Tiers (% of monthly budget) =====
export const COST_TIERS = {
  premium:   { models: ['claude_opus', 'chatgpt_o1'],   budgetPct: 5  },  // 5%
  standard:  { models: ['claude', 'chatgpt'],            budgetPct: 15 },  // 15%
  economy:   { models: ['qwen', 'gemini', 'glm', 'kimi', 'grok'], budgetPct: 80 }, // 80%  (glm for vision tasks)
};

export class ModelRegistry {
  constructor() {
    this._models   = new Map();  // modelName → model instance
    this._disabled = new Set();  // temporarily disabled models
  }

  /**
   * Register a model instance
   * @param {string} name         — model identifier (e.g., 'claude', 'chatgpt')
   * @param {BaseModel} instance  — model instance
   */
  register(name, instance) {
    this._models.set(name, instance);
    logger.debug(`[registry] registered: ${name}`);
  }

  /**
   * Remove a model from registry
   */
  remove(name) {
    this._models.delete(name);
    logger.info(`[registry] removed: ${name}`);
  }

  /**
   * Temporarily disable a model (e.g., rate limit hit)
   * @param {string} name
   * @param {number} durationMs
   */
  disable(name, durationMs = 60000) {
    this._disabled.add(name);
    logger.warn(`[registry] disabled ${name} for ${durationMs}ms`);
    setTimeout(() => {
      this._disabled.delete(name);
      logger.info(`[registry] re-enabled ${name}`);
    }, durationMs);
  }

  /**
   * ตรวจว่า model นี้พร้อมใช้งาน
   */
  isReady(name) {
    if (this._disabled.has(name)) return false;
    const model = this._models.get(name);
    return model?.isAvailable === true;
  }

  /**
   * ดึง model instance
   */
  get(name) {
    return this._models.get(name);
  }

  /**
   * ดึง models ทั้งหมดที่ available
   */
  getAvailable() {
    return Array.from(this._models.entries())
      .filter(([name]) => this.isReady(name))
      .map(([name, model]) => ({ name, model }));
  }

  /**
   * Route task ไปยัง model ที่ดีที่สุดตาม task type
   * @param {string} taskType   — จาก TASK_MODEL_MAP
   * @param {Object} [options]
   * @param {string[]} [options.exclude] — ห้ามใช้ models เหล่านี้
   * @param {boolean} [options.costOptimize] — เลือก cheapest model ก่อน
   * @returns {{ name: string, model: BaseModel } | null}
   */
  routeTask(taskType, options = {}) {
    const { exclude = [], costOptimize = false } = options;

    // ดึง preference list
    let preferred = TASK_MODEL_MAP[taskType];
    if (!preferred) {
      // Fallback: ใช้ task type โดยตรงเป็น model name
      preferred = [taskType, 'claude', 'chatgpt'];
      logger.warn(`[registry] ไม่พบ task type "${taskType}" ใน map — ใช้ fallback`);
    }

    // ถ้า cost optimize: เรียงตาม cheapest ก่อน
    if (costOptimize) {
      preferred = this._sortByCost(preferred);
    }

    for (const modelName of preferred) {
      if (exclude.includes(modelName)) continue;
      if (this.isReady(modelName)) {
        logger.debug(`[registry] route "${taskType}" → ${modelName}`);
        return { name: modelName, model: this._models.get(modelName) };
      }
    }

    logger.error(`[registry] ไม่พบ model ที่พร้อมใช้งานสำหรับ task "${taskType}"`);
    return null;
  }

  /**
   * Route สำหรับ critique loop — คืน drafter + reviewer
   * @param {string} taskType
   * @param {string} [forceDrafter]
   * @param {string} [forceReviewer]
   * @returns {{ drafter, reviewer }}
   */
  routeCritique(taskType, forceDrafter = null, forceReviewer = null) {
    const preferred = TASK_MODEL_MAP[taskType] || ['claude', 'chatgpt'];

    const drafter  = forceDrafter  ? this.get(forceDrafter)  : this._models.get(preferred[0]);
    const reviewer = forceReviewer ? this.get(forceReviewer) : this._models.get(preferred[1] || preferred[0]);

    const drafterName  = forceDrafter  || preferred[0];
    const reviewerName = forceReviewer || preferred[1] || preferred[0];

    if (!drafter?.isAvailable) {
      throw new Error(`Drafter "${drafterName}" ไม่พร้อมใช้งาน`);
    }
    if (!reviewer?.isAvailable) {
      throw new Error(`Reviewer "${reviewerName}" ไม่พร้อมใช้งาน`);
    }

    return {
      drafter:      { name: drafterName,  model: drafter  },
      reviewer:     { name: reviewerName, model: reviewer },
    };
  }

  /**
   * สรุปสถานะทุก model
   */
  getStatus() {
    const status = {};
    for (const [name, model] of this._models.entries()) {
      status[name] = {
        available:    model.isAvailable,
        disabled:     this._disabled.has(name),
        capabilities: model.capabilities || [],
        costSummary:  model.getCostSummary?.() || null,
      };
    }
    return status;
  }

  /**
   * เรียง models ตาม cost (cheapest first)
   * @param {string[]} modelNames
   * @returns {string[]}
   */
  _sortByCost(modelNames) {
    // grok-3-mini: $0.30/$0.50 — very cheap; grok-3: $3/$15 — similar to claude
    const COST_ORDER = { ollama: 0, qwen: 1, gemini: 2, kimi: 3, glm: 4, grok: 5, chatgpt: 6, claude: 7 };
    return [...modelNames].sort((a, b) => (COST_ORDER[a] || 99) - (COST_ORDER[b] || 99));
  }
}

// Singleton
let _registry = null;
export function getRegistry() {
  if (!_registry) _registry = new ModelRegistry();
  return _registry;
}

export default ModelRegistry;

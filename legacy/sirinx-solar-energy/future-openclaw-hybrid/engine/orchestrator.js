/**
 * orchestrator.js — Main Multi-Model Orchestration Engine
 * จุดควบคุมกลางสำหรับการ coordinate ระหว่าง ChatGPT, Claude, Gemini, Qwen
 * OpenClaw acts as the control plane
 *
 * Usage:
 *   const engine = new Orchestrator()
 *   await engine.init()
 *   const result = await engine.critique('Write SEO content', { drafter: 'claude', reviewer: 'chatgpt' })
 *   const result = await engine.parallel([{ id: 'copy', task: '...', model: 'claude' }])
 *   const result = await engine.cascade('Write blog post', { chain: ['qwen', 'claude'] })
 *   const result = await engine.route('สร้าง code', { taskType: 'code_generation' })
 */

import { ModelRegistry, getRegistry } from './model-registry.js';
import { ClaudeModel }    from './models/claude.js';
import { ChatGPTModel }   from './models/chatgpt.js';
import { GeminiModel }    from './models/gemini.js';
import { QwenModel }      from './models/qwen.js';
import { GrokModel }      from './models/grok.js';
import { OllamaModel }   from './models/ollama.js';
import { CritiqueLoop }   from './workflows/critique-loop.js';
import { ParallelBuild }  from './workflows/parallel-build.js';
import { Cascade }        from './workflows/cascade.js';
import { getArtifactStore }  from './artifacts/artifact-store.js';
import { getCostOptimizer }  from './cost-optimizer.js';
import { generateRunId }     from './artifacts/schemas.js';
import { ENGINE, logger, getAvailableModels } from './config.js';
import { getApprovalEngine } from './approval-engine.js';

export class Orchestrator {
  constructor() {
    this.registry        = getRegistry();
    this.store           = getArtifactStore();
    this.costOptimizer   = getCostOptimizer();
    this.approvalEngine  = getApprovalEngine();
    this._initialized    = false;

    // Workflow engines
    this.workflows = {
      critique: null,
      parallel: null,
      cascade:  null,
    };
  }

  /**
   * Initialize all models and workflows
   * เรียก init() ก่อนใช้งานเสมอ
   * @param {Object} [options]
   * @param {boolean} [options.verbose] — Print detailed status
   * @returns {Promise<InitResult>}
   */
  async init(options = {}) {
    logger.info('🚀 Initializing Multi-Model Orchestration Engine...');

    // Initialize all model adapters
    const models = [
      { name: 'claude',   instance: new ClaudeModel()   },
      { name: 'chatgpt',  instance: new ChatGPTModel()  },
      { name: 'gemini',   instance: new GeminiModel()   },
      { name: 'qwen',     instance: new QwenModel()     },
      { name: 'grok',     instance: new GrokModel()     },
      { name: 'ollama',   instance: new OllamaModel()   },
    ];

    const initResults = await Promise.all(
      models.map(async ({ name, instance }) => {
        const ok = await instance.initialize();
        if (ok) this.registry.register(name, instance);
        return { name, available: ok };
      })
    );

    // Initialize workflow engines
    this.workflows.critique = new CritiqueLoop();
    this.workflows.parallel = new ParallelBuild();
    this.workflows.cascade  = new Cascade();

    const available = initResults.filter(r => r.available).map(r => r.name);
    const unavailable = initResults.filter(r => !r.available).map(r => r.name);

    if (available.length === 0) {
      logger.error('❌ ไม่มี model พร้อมใช้งาน — ตรวจสอบ API keys ใน .env');
      return { success: false, available: [], unavailable: models.map(m => m.name) };
    }

    this._initialized = true;

    logger.info(`✅ Engine ready | Available: [${available.join(', ')}] | Unavailable: [${unavailable.join(', ')}]`);

    if (options.verbose) {
      logger.info('Model Status:');
      initResults.forEach(r => {
        logger.info(`  ${r.available ? '✅' : '❌'} ${r.name}`);
      });
    }

    return { success: true, available, unavailable };
  }

  /**
   * Auto-route task to best model and execute
   * @param {string} task      — Task description
   * @param {Object} options
   * @param {string} [options.taskType]      — Override task type detection
   * @param {boolean} [options.costOptimize] — Prefer cheaper models
   * @returns {Promise<ModelOutput>}
   */
  async route(task, options = {}) {
    this._checkInit();
    const { taskType, costOptimize = false, exclude = [] } = options;

    // Auto-detect task type
    const detectedType = taskType || this._detectTaskType(task);
    logger.info(`[orchestrator] Route | task="${task.slice(0, 60)}..." | type=${detectedType}`);

    // ลอง model ตามลำดับ priority — fallback อัตโนมัติถ้า model ล้มเหลว (403/429/network)
    const tried = [...exclude];
    let lastError;

    while (true) {
      const modelEntry = this.registry.routeTask(detectedType, { costOptimize, exclude: tried });
      if (!modelEntry) break;

      logger.info(`[orchestrator] → ${modelEntry.name}${tried.length ? ` (fallback จาก ${tried.join(',')})` : ''}`);
      tried.push(modelEntry.name);

      const output = await modelEntry.model.generateWithRetry({
        task:    detectedType,
        prompt:  task,
        tier:    costOptimize ? 'fast' : 'default',
      });

      // ถ้าสำเร็จ — บันทึก cost และ return
      if (output.success) {
        if (output.cost) {
          this.costOptimizer.record({
            model:        output.modelId,
            provider:     output.provider,
            task:         detectedType,
            inputTokens:  output.usage.inputTokens,
            outputTokens: output.usage.outputTokens,
            cost:         output.cost,
            latencyMs:    output.latencyMs,
          });
        }
        return { ...output, workflow: 'route', routedTo: modelEntry.name, taskType: detectedType };
      }

      // ถ้าล้มเหลว — ตรวจ rate limit / auth แล้วข้ามไป model ถัดไป
      lastError = output.error || 'unknown error';
      logger.warn(`[orchestrator] ${modelEntry.name} failed (${lastError.slice(0,60)}) — ลอง model ถัดไป`);

      // Auto-disable ชั่วคราวถ้าโดน rate limit หรือ quota เพื่อไม่ให้ agents ถัดไปลองซ้ำ
      if (/429|rate.?limit|quota.*exceeded|too many requests/i.test(lastError)) {
        // Parse retry delay จาก error ถ้ามี (Gemini ส่ง retryDelay:"32s")
        const retryMatch = lastError.match(/retryDelay.*?(\d+)s/);
        const cooldownMs = retryMatch ? (parseInt(retryMatch[1]) + 5) * 1000 : 65000;
        this.registry.disable(modelEntry.name, cooldownMs);
        logger.warn(`[orchestrator] ${modelEntry.name} rate-limited — disabled for ${Math.round(cooldownMs/1000)}s`);
      } else if (/403|401|credit.*low|no credits|incorrect.*key/i.test(lastError)) {
        // Auth fail — disable longer (5 min) since key won't fix itself mid-run
        this.registry.disable(modelEntry.name, 5 * 60 * 1000);
        logger.warn(`[orchestrator] ${modelEntry.name} auth error — disabled for 5min`);
      }
    }

    throw new Error(`ทุก model ล้มเหลวสำหรับ task "${detectedType}" | last error: ${lastError}`);
  }

  /**
   * Run critique loop workflow
   * @param {string} task
   * @param {Object} options
   * @param {string} [options.drafter='claude']    — Model to draft
   * @param {string} [options.reviewer='chatgpt']  — Model to review
   * @param {string} [options.taskType]
   * @param {number} [options.maxRounds=3]
   * @param {number} [options.qualityThreshold=75]
   * @param {Object} [options.taskParams]
   * @param {Function} [options.onProgress]
   * @returns {Promise<CritiqueResult>}
   */
  async critique(task, options = {}) {
    this._checkInit();

    const {
      drafter         = ENGINE.defaultDrafter,
      reviewer        = ENGINE.defaultReviewer,
      taskType,
      maxRounds       = 3,
      qualityThreshold = 75,
      taskParams      = {},
      onProgress,
    } = options;

    const detectedType = taskType || this._detectTaskType(task);

    // Resolve drafter and reviewer
    let drafterEntry, reviewerEntry;
    try {
      const pair    = this.registry.routeCritique(detectedType, drafter, reviewer);
      drafterEntry  = pair.drafter;
      reviewerEntry = pair.reviewer;
    } catch (err) {
      throw new Error(`[critique] ${err.message}`);
    }

    const loop = new CritiqueLoop({ maxRounds, qualityThreshold });
    return loop.run({
      task,
      taskType: detectedType,
      drafter:  drafterEntry,
      reviewer: reviewerEntry,
      taskParams,
      onProgress,
    });
  }

  /**
   * Run parallel build workflow
   * @param {Array} subTasks   — Array of sub-task definitions
   * @param {Object} options
   * @param {Function} [options.mergeStrategy]
   * @param {Function} [options.onProgress]
   * @returns {Promise<ParallelResult>}
   */
  async parallel(subTasks, options = {}) {
    this._checkInit();

    return this.workflows.parallel.run({
      subTasks,
      registry:      this.registry,
      mergeStrategy: options.mergeStrategy,
      onProgress:    options.onProgress,
    });
  }

  /**
   * Run cascade/escalation workflow
   * @param {string} task
   * @param {Object} options
   * @param {string[]} [options.chain]          — Custom model chain
   * @param {string}   [options.chainPreset]    — Preset name
   * @param {number}   [options.qualityThreshold]
   * @param {string}   [options.taskType]
   * @param {Object}   [options.taskParams]
   * @param {Function} [options.onProgress]
   * @returns {Promise<CascadeResult>}
   */
  async cascade(task, options = {}) {
    this._checkInit();

    const {
      chain,
      chainPreset     = 'general',
      qualityThreshold = 70,
      taskType,
      taskParams      = {},
      onProgress,
    } = options;

    const detectedType = taskType || this._detectTaskType(task);
    const cascadeEngine = new Cascade({ qualityThreshold });

    return cascadeEngine.run({
      task,
      taskType:  detectedType,
      registry:  this.registry,
      chain,
      chainPreset,
      taskParams,
      onProgress,
    });
  }

  /**
   * สรุปสถานะทั้งระบบ
   */
  getStatus() {
    return {
      initialized: this._initialized,
      models:      this.registry.getStatus(),
      cost:        this.costOptimizer.getSessionSummary(),
      budget:      {
        monthlyTHB: ENGINE.budgetTHB,
        note:       '3-Tier: Premium 5% / Standard 15% / Economy 80%',
      },
    };
  }

  /**
   * Detect task type from task description (heuristic)
   * @param {string} task
   * @returns {string}
   */
  _detectTaskType(task) {
    const lower = task.toLowerCase();

    if (/code|function|api|endpoint|debug|test|typescript|javascript|python/.test(lower)) return 'code_generation';
    if (/review.*code|code.*review|pr review/.test(lower)) return 'code_review';
    if (/seo|search engine|keyword|meta|บทความ/.test(lower)) return 'seo_content';
    if (/marketing|copy|ad|โฆษณา|แคมเปญ|campaign/.test(lower)) return 'marketing_copy';
    if (/translate|แปล|translation/.test(lower)) return 'translation';
    if (/image|รูป|visual|prompt/.test(lower)) return 'image_prompt';
    if (/analyze|analysis|data|วิเคราะห์/.test(lower)) return 'data_analysis';
    if (/summarize|สรุป|summary/.test(lower)) return 'summarize';
    if (/invest|proposal|ข้อเสนอ|investor/.test(lower)) return 'investment_analysis';
    if (/เขียน|write|content|บทความ/.test(lower)) return 'creative_content_th';
    if (/reason|think|คิด|วางแผน/.test(lower)) return 'reasoning';

    return 'creative_content_th';  // default
  }

  /**
   * Route task ผ่าน AI CEO approval ก่อน execute
   * ถ้า auto/ceo approved → route ปกติ
   * ถ้า human required → throw error พร้อม escalationId
   *
   * @param {Object} taskRequest
   * @param {string} taskRequest.task            — Task description
   * @param {string} [taskRequest.requestedBy]   — Agent ID ที่ขอ
   * @param {string} [taskRequest.category]      — Override category
   * @param {number} [taskRequest.estimatedCostTHB=0]
   * @param {Object} [taskRequest.routeOptions]  — Options ส่งต่อไปยัง route()
   * @returns {Promise<ModelOutput & { approval: ApprovalResponse }>}
   */
  async requestApproval(taskRequest) {
    this._checkInit();

    const {
      task,
      requestedBy    = 'orchestrator',
      category,
      estimatedCostTHB = 0,
      routeOptions   = {},
    } = taskRequest;

    // ประเมิน approval
    const approval = this.approvalEngine.evaluate({
      description:     task,
      category,
      estimatedCostTHB,
      requestedBy,
    });

    logger.info(`[orchestrator] requestApproval | ${approval.decision.toUpperCase()} | ${approval.category} | "${task.slice(0, 60)}"`);

    if (approval.decision === 'human') {
      const err  = new Error(`[requestApproval] Human approval required: ${approval.reason}`);
      err.approval = approval;
      throw err;
    }

    // Auto or CEO approved — execute
    const result = await this.route(task, routeOptions);
    return { ...result, approval };
  }

  _checkInit() {
    if (!this._initialized) {
      throw new Error('Orchestrator ยังไม่ได้ initialize — เรียก await engine.init() ก่อน');
    }
  }
}

// Singleton factory
let _instance = null;
export function getOrchestrator() {
  if (!_instance) _instance = new Orchestrator();
  return _instance;
}

export default Orchestrator;

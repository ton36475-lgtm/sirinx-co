/**
 * cascade.js — Cascade/Escalation Workflow
 * เริ่มจาก cheapest model → ถ้า quality < threshold → escalate ไปยัง better model
 * Optimizes cost while maintaining quality gates
 *
 * Cascade: Qwen/Gemini → Claude Haiku → Claude Sonnet/GPT-4o → Claude Opus/o1
 */

import { generateRunId } from '../artifacts/schemas.js';
import { getArtifactStore } from '../artifacts/artifact-store.js';
import { getCostOptimizer } from '../cost-optimizer.js';
import { logger } from '../config.js';

// Default cascade chains (cheapest → most capable)
const DEFAULT_CASCADE_CHAINS = {
  general:   ['qwen', 'gemini', 'chatgpt', 'claude'],
  creative:  ['qwen', 'gemini', 'claude'],
  code:      ['chatgpt', 'claude'],
  analysis:  ['chatgpt', 'claude'],
  quality:   ['claude', 'chatgpt'],  // เริ่มจาก quality-first
};

export class Cascade {
  /**
   * @param {Object} options
   * @param {number} [options.qualityThreshold=70]  — Score ต่ำกว่านี้ escalate
   * @param {number} [options.minScore=60]           — Score ต่ำกว่านี้ถือว่า fail
   * @param {boolean} [options.selfReview=true]      — ให้แต่ละ model review ผลงานตัวเอง
   */
  constructor(options = {}) {
    this.qualityThreshold = options.qualityThreshold ?? 70;
    this.minScore         = options.minScore         ?? 60;
    this.selfReview       = options.selfReview       ?? true;
    this.store            = getArtifactStore();
    this.costOptimizer    = getCostOptimizer();
  }

  /**
   * รัน cascade workflow
   * @param {Object} params
   * @param {string} params.task          — Task description
   * @param {string} params.taskType      — Task type
   * @param {Object} params.registry      — ModelRegistry instance
   * @param {string[]} [params.chain]     — Custom cascade chain (model names)
   * @param {string} [params.chainPreset] — Preset name from DEFAULT_CASCADE_CHAINS
   * @param {Object} [params.taskParams]  — Extra params
   * @param {Function} [params.onProgress]
   * @returns {Promise<CascadeResult>}
   */
  async run(params) {
    const {
      task,
      taskType,
      registry,
      chain        = null,
      chainPreset  = 'general',
      taskParams   = {},
      onProgress   = null,
    } = params;

    const runId     = generateRunId('cascade');
    const startedAt = Date.now();
    this.costOptimizer.resetSession();

    // Resolve cascade chain
    const cascadeChain = chain || DEFAULT_CASCADE_CHAINS[chainPreset] || DEFAULT_CASCADE_CHAINS.general;
    const availableChain = cascadeChain.filter(m => registry.isReady(m));

    if (availableChain.length === 0) {
      throw new Error('ไม่มี model พร้อมใช้งานใน cascade chain');
    }

    logger.info(`[cascade] 🚀 Starting | runId=${runId} | chain=${availableChain.join(' → ')}`);
    logger.info(`[cascade] Task: ${task}`);
    logger.info(`[cascade] Quality threshold: ${this.qualityThreshold}`);

    this.store.writeTask(runId, task, { taskType, chainPreset, ...taskParams });

    let attempts = [];
    let bestResult = null;
    let bestScore  = -1;

    for (let i = 0; i < availableChain.length; i++) {
      const modelName = availableChain[i];
      const model     = registry.get(modelName);
      const isLast    = i === availableChain.length - 1;

      logger.info(`[cascade] 🔗 Level ${i+1}/${availableChain.length}: ${modelName}${isLast ? ' (final)' : ''}`);
      this._notify(onProgress, { phase: 'generating', level: i+1, model: modelName });

      // Generate
      const context = i > 0 ? this._buildEscalationContext(task, attempts) : null;
      const output  = await model.generateWithRetry({
        task:    taskType,
        prompt:  this._buildCascadePrompt(task, taskParams, i, attempts),
        context,
        tier:    this._selectTier(modelName, i, availableChain.length),
      });

      if (!output.success) {
        logger.warn(`[cascade] ${modelName} failed: ${output.error} — trying next`);
        attempts.push({ model: modelName, success: false, error: output.error, score: 0 });
        continue;
      }

      this.costOptimizer.record({
        model:        output.modelId,
        provider:     output.provider,
        task:         `cascade_level_${i+1}`,
        inputTokens:  output.usage.inputTokens,
        outputTokens: output.usage.outputTokens,
        cost:         output.cost,
        latencyMs:    output.latencyMs,
      });

      // Self-review / quality scoring
      let score = 70; // default
      if (this.selfReview) {
        logger.info(`[cascade] 🔍 Self-reviewing ${modelName} output...`);
        const review = await model.review(output.content, task, {
          cascadeLevel: i + 1,
          previousAttempts: attempts.length,
        });

        if (review.raw?.cost) {
          this.costOptimizer.record({
            model:        review.raw.modelId,
            provider:     review.raw.provider,
            task:         `cascade_review_${i+1}`,
            inputTokens:  review.raw.usage?.inputTokens || 0,
            outputTokens: review.raw.usage?.outputTokens || 0,
            cost:         review.raw.cost,
            latencyMs:    review.raw.latencyMs || 0,
          });
        }

        score = review.score;
        logger.info(`[cascade] ${modelName} self-score: ${score}/100`);
        this._notify(onProgress, { phase: 'reviewed', model: modelName, score });

        const attempt = {
          model:       modelName,
          success:     true,
          content:     output.content,
          score,
          cost:        output.cost,
          latencyMs:   output.latencyMs,
          review:      { approved: review.approved, findings: review.findings, summary: review.summary },
        };
        attempts.push(attempt);

        if (score > bestScore) {
          bestScore  = score;
          bestResult = attempt;
        }

        this.store.writeDraft(`${runId}_L${i+1}`, output.content, { ...output, round: i+1 });
        this.store.writeReview(`${runId}_L${i+1}`, review);

        // Quality gate check
        if (score >= this.qualityThreshold || isLast) {
          if (score >= this.qualityThreshold) {
            logger.info(`[cascade] ✅ Quality threshold met at ${modelName} (${score} >= ${this.qualityThreshold})`);
          } else {
            logger.info(`[cascade] 🏁 Final level reached — using best result (score: ${bestScore})`);
          }
          this._notify(onProgress, { phase: 'accepted', model: modelName, score });
          break;
        }

        logger.info(`[cascade] ⬆️ Score ${score} < ${this.qualityThreshold} — escalating to ${availableChain[i+1] || 'end'}`);
        this._notify(onProgress, { phase: 'escalating', from: modelName, to: availableChain[i+1] });

      } else {
        // No self-review — use output directly if good enough
        attempts.push({ model: modelName, success: true, content: output.content, score: 75, cost: output.cost });
        if (!bestResult) bestResult = attempts[attempts.length - 1];
        break;
      }
    }

    const costSummary = this.costOptimizer.getSessionSummary();
    const finalResult = {
      content:     bestResult?.content || '',
      workflow:    'cascade',
      totalCost:   { usd: costSummary.totalUSD, thb: costSummary.totalTHB },
      totalTokens: costSummary.totalTokens,
      models:      attempts.map(a => a.model),
      quality: {
        finalScore: bestScore,
        approved:   bestScore >= this.qualityThreshold,
        levels:     attempts.length,
      },
      attempts,
      latencyMs:   Date.now() - startedAt,
      runId,
    };

    this.store.writeResult(runId, finalResult);
    logger.info(`[cascade] 🏆 Complete | score=${bestScore} | levels=${attempts.length} | cost=${costSummary.totalTHB.toFixed(4)} THB`);
    logger.info(this.costOptimizer.formatSummary());

    // Cost savings report
    const premiumCost = costSummary.byModel['claude-opus-4-20250514']?.thb || 0;
    const actualCost  = costSummary.totalTHB;
    if (premiumCost === 0 && actualCost > 0) {
      logger.info(`[cascade] 💰 Cost optimization: stopped before premium model`);
    }

    return finalResult;
  }

  _buildCascadePrompt(task, params, level, prevAttempts) {
    let prompt = `Task: ${task}\n`;
    if (params && Object.keys(params).length > 0) {
      prompt += `Parameters: ${JSON.stringify(params, null, 2)}\n`;
    }
    if (level > 0 && prevAttempts.length > 0) {
      prompt += `\nหมายเหตุ: งานนี้ผ่าน ${level} model มาแล้ว และยังไม่ได้คุณภาพที่ต้องการ กรุณาสร้าง output ที่ดีกว่าเดิมอย่างมีนัยสำคัญ`;
    }
    return prompt;
  }

  _buildEscalationContext(task, prevAttempts) {
    if (prevAttempts.length === 0) return null;
    const last = prevAttempts[prevAttempts.length - 1];
    return `Previous attempt by ${last.model} scored ${last.score}/100.\nPrevious output:\n${last.content?.slice(0, 500)}...\n\nPlease significantly improve upon this.`;
  }

  _selectTier(modelName, level, totalLevels) {
    // ใช้ complex tier สำหรับ model สุดท้ายใน chain
    if (level === totalLevels - 1) return 'complex';
    return 'default';
  }

  _notify(callback, data) {
    if (typeof callback === 'function') {
      try { callback(data); } catch {}
    }
  }
}

export default Cascade;

/**
 * critique-loop.js — Draft → Review → Refine Workflow
 * Model A drafts → Model B reviews → Model A refines → repeat until quality gate
 *
 * Pipeline:
 * 1. Drafter generates initial draft
 * 2. Reviewer critiques with structured findings
 * 3. If score < threshold OR critical findings: Drafter refines using feedback
 * 4. Repeat up to maxRounds
 * 5. Return best version
 */

import { generateRunId } from '../artifacts/schemas.js';
import { getArtifactStore } from '../artifacts/artifact-store.js';
import { getCostOptimizer } from '../cost-optimizer.js';
import { logger } from '../config.js';

export class CritiqueLoop {
  /**
   * @param {Object} options
   * @param {number} [options.maxRounds=3]           — Maximum critique rounds
   * @param {number} [options.qualityThreshold=75]   — Score to stop early (0-100)
   * @param {number} [options.approvalThreshold=85]  — Score to auto-approve
   */
  constructor(options = {}) {
    this.maxRounds         = options.maxRounds         || 3;
    this.qualityThreshold  = options.qualityThreshold  || 75;
    this.approvalThreshold = options.approvalThreshold || 85;
    this.store             = getArtifactStore();
    this.costOptimizer     = getCostOptimizer();
  }

  /**
   * รัน critique loop workflow
   * @param {Object} params
   * @param {string} params.task                  — Task description
   * @param {string} params.taskType              — Task type from TASK_MODEL_MAP
   * @param {Object} params.drafter               — { name, model } from ModelRegistry
   * @param {Object} params.reviewer              — { name, model } from ModelRegistry
   * @param {Object} [params.taskParams]          — Extra params for the task
   * @param {Object} [params.reviewCriteria]      — Custom review criteria
   * @param {Function} [params.onProgress]        — Callback for progress updates
   * @returns {Promise<CritiqueResult>}
   */
  async run(params) {
    const {
      task,
      taskType,
      drafter,
      reviewer,
      taskParams     = {},
      reviewCriteria = {},
      onProgress     = null,
    } = params;

    const runId     = generateRunId('critique');
    const startedAt = Date.now();
    this.costOptimizer.resetSession();

    logger.info(`[critique] 🚀 Starting | runId=${runId} | drafter=${drafter.name} | reviewer=${reviewer.name}`);
    logger.info(`[critique] Task: ${task}`);

    // Write task artifact
    this.store.writeTask(runId, task, { taskType, ...taskParams });

    let bestDraft   = null;
    let bestScore   = 0;
    let rounds      = [];
    let finalReview = null;

    for (let round = 1; round <= this.maxRounds; round++) {
      logger.info(`[critique] 📝 Round ${round}/${this.maxRounds} — Drafting...`);
      this._notify(onProgress, { phase: 'drafting', round });

      // ===== Step 1: Generate Draft =====
      const draftContext = round > 1
        ? this.store.buildContext(runId)  // ใส่ review feedback จาก round ก่อนหน้า
        : null;

      const draftPrompt = this._buildDraftPrompt(task, taskParams, round, finalReview);

      const draftOutput = await drafter.model.generateWithRetry({
        task:    taskType,
        prompt:  draftPrompt,
        context: draftContext,
        tier:    round === 1 ? 'default' : 'default',
      });

      if (!draftOutput.success) {
        logger.error(`[critique] Draft failed: ${draftOutput.error}`);
        break;
      }

      // Track cost
      this.costOptimizer.record({
        model:        draftOutput.modelId,
        provider:     draftOutput.provider,
        task:         `draft_round_${round}`,
        inputTokens:  draftOutput.usage.inputTokens,
        outputTokens: draftOutput.usage.outputTokens,
        cost:         draftOutput.cost,
        latencyMs:    draftOutput.latencyMs,
      });

      // Save draft artifact
      this.store.writeDraft(runId, draftOutput.content, { ...draftOutput, round });
      logger.info(`[critique] ✍️ Draft Round ${round}: ${draftOutput.content.length} chars | ${draftOutput.cost.thb.toFixed(4)} THB`);

      // ===== Step 2: Review =====
      logger.info(`[critique] 🔍 Round ${round}/${this.maxRounds} — Reviewing...`);
      this._notify(onProgress, { phase: 'reviewing', round });

      const reviewOutput = await reviewer.model.review(
        draftOutput.content,
        task,
        { ...reviewCriteria, round, taskType }
      );

      if (reviewOutput.raw?.cost) {
        this.costOptimizer.record({
          model:        reviewOutput.raw.modelId,
          provider:     reviewOutput.raw.provider,
          task:         `review_round_${round}`,
          inputTokens:  reviewOutput.raw.usage?.inputTokens || 0,
          outputTokens: reviewOutput.raw.usage?.outputTokens || 0,
          cost:         reviewOutput.raw.cost,
          latencyMs:    reviewOutput.raw.latencyMs || 0,
        });
      }

      // Save review artifact
      this.store.writeReview(runId, reviewOutput);

      finalReview = reviewOutput;
      const roundData = {
        round,
        draft:        draftOutput.content,
        score:        reviewOutput.score,
        approved:     reviewOutput.approved,
        findings:     reviewOutput.findings,
        recommendation: reviewOutput.recommendation,
        drafter:      drafter.name,
        reviewer:     reviewer.name,
      };
      rounds.push(roundData);

      logger.info(`[critique] 📊 Round ${round} score: ${reviewOutput.score}/100 | ${reviewOutput.recommendation} | findings: ${reviewOutput.findings.length}`);

      // Track best version
      if (reviewOutput.score > bestScore) {
        bestScore = reviewOutput.score;
        bestDraft = draftOutput.content;
      }

      // ===== Step 3: Quality Gate =====
      if (reviewOutput.approved || reviewOutput.score >= this.approvalThreshold) {
        logger.info(`[critique] ✅ Approved after Round ${round} (score: ${reviewOutput.score})`);
        this._notify(onProgress, { phase: 'approved', round, score: reviewOutput.score });
        break;
      }

      if (reviewOutput.recommendation === 'reject') {
        logger.warn(`[critique] ❌ Rejected at Round ${round} — stopping`);
        this._notify(onProgress, { phase: 'rejected', round });
        break;
      }

      if (round === this.maxRounds) {
        logger.info(`[critique] 🏁 Max rounds reached — using best draft (score: ${bestScore})`);
        this._notify(onProgress, { phase: 'max_rounds', score: bestScore });
      }
    }

    // Build final result
    const costSummary = this.costOptimizer.getSessionSummary();
    const result = {
      content:     bestDraft || '',
      workflow:    'critique_loop',
      totalCost:   { usd: costSummary.totalUSD, thb: costSummary.totalTHB },
      totalTokens: costSummary.totalTokens,
      totalRounds: rounds.length,
      models:      [drafter.name, reviewer.name],
      quality: {
        finalScore: bestScore,
        approved:   finalReview?.approved || false,
      },
      rounds,
      latencyMs:   Date.now() - startedAt,
      runId,
    };

    this.store.writeResult(runId, result);
    logger.info(`[critique] 🏆 Complete | score=${bestScore} | cost=${costSummary.totalTHB.toFixed(4)} THB | rounds=${rounds.length}`);
    logger.info(this.costOptimizer.formatSummary());

    return result;
  }

  /**
   * สร้าง prompt สำหรับ draft (รวม feedback จาก round ก่อนหน้า)
   */
  _buildDraftPrompt(task, params, round, prevReview) {
    let prompt = `Task: ${task}\n`;

    if (params && Object.keys(params).length > 0) {
      prompt += `Parameters: ${JSON.stringify(params, null, 2)}\n`;
    }

    if (round > 1 && prevReview) {
      prompt += `\n## Feedback จาก Review Round ${round - 1}:\n`;
      prompt += `Score: ${prevReview.score}/100\n`;
      prompt += `Summary: ${prevReview.summary}\n`;

      if (prevReview.requiredChanges?.length > 0) {
        prompt += `\nRequired Changes:\n`;
        prevReview.requiredChanges.forEach((c, i) => { prompt += `${i+1}. ${c}\n`; });
      }

      if (prevReview.findings?.length > 0) {
        const critical = prevReview.findings.filter(f => f.severity === 'critical' || f.severity === 'major');
        if (critical.length > 0) {
          prompt += `\nCritical Issues to Fix:\n`;
          critical.forEach(f => { prompt += `- [${f.severity}] ${f.message} → ${f.suggestion || 'แก้ไขด้วย'}\n`; });
        }
      }

      prompt += `\nกรุณาสร้าง draft ที่ดีขึ้น โดยแก้ไขปัญหาทั้งหมดที่ระบุไว้ข้างต้น`;
    } else {
      prompt += `\nกรุณาสร้าง content ที่ดีที่สุดตาม task ที่กำหนด`;
    }

    return prompt;
  }

  _notify(callback, data) {
    if (typeof callback === 'function') {
      try { callback(data); } catch {}
    }
  }
}

export default CritiqueLoop;

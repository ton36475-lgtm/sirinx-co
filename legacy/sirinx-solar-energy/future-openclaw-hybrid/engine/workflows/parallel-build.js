/**
 * parallel-build.js — Parallel Execution Workflow
 * แยก task เป็น sub-tasks → route แต่ละอันไปยัง optimal model → run พร้อมกัน → merge
 *
 * Example: Claude writes marketing copy WHILE ChatGPT writes API code
 */

import { generateRunId } from '../artifacts/schemas.js';
import { getArtifactStore } from '../artifacts/artifact-store.js';
import { getCostOptimizer } from '../cost-optimizer.js';
import { logger } from '../config.js';

export class ParallelBuild {
  constructor() {
    this.store         = getArtifactStore();
    this.costOptimizer = getCostOptimizer();
  }

  /**
   * รัน parallel execution workflow
   * @param {Object} params
   * @param {Array}  params.subTasks            — Array ของ sub-tasks
   * @param {Object} params.registry            — ModelRegistry instance
   * @param {Function} [params.onProgress]      — Callback
   * @param {Function} [params.mergeStrategy]   — Custom merge function (optional)
   * @returns {Promise<ParallelResult>}
   *
   * subTasks format:
   * [
   *   { id: 'copy',   task: 'Write Thai marketing copy', taskType: 'marketing_copy', model: 'claude' },
   *   { id: 'code',   task: 'Write API endpoint',        taskType: 'code_generation', model: 'chatgpt' },
   *   { id: 'seo',    task: 'Write SEO meta tags',       taskType: 'seo_content',    model: null }, // auto-route
   * ]
   */
  async run(params) {
    const { subTasks, registry, onProgress = null, mergeStrategy = null } = params;

    const runId     = generateRunId('parallel');
    const startedAt = Date.now();
    this.costOptimizer.resetSession();

    logger.info(`[parallel] 🚀 Starting | runId=${runId} | subtasks=${subTasks.length}`);
    subTasks.forEach((t, i) => logger.info(`[parallel]   [${i+1}] ${t.id}: ${t.task} → ${t.model || 'auto'}`));

    this._notify(onProgress, { phase: 'starting', runId, total: subTasks.length });

    // ===== Resolve models for each sub-task =====
    const resolvedTasks = subTasks.map(st => {
      let modelEntry = null;

      if (st.model) {
        // Explicit model specified
        const model = registry.get(st.model);
        if (model?.isAvailable) {
          modelEntry = { name: st.model, model };
        } else {
          logger.warn(`[parallel] Model "${st.model}" not available — auto-routing "${st.id}"`);
        }
      }

      if (!modelEntry) {
        // Auto-route
        modelEntry = registry.routeTask(st.taskType || 'creative_content_th');
      }

      if (!modelEntry) {
        logger.error(`[parallel] No model available for sub-task "${st.id}"`);
        return { ...st, modelEntry: null, error: 'No model available' };
      }

      return { ...st, modelEntry };
    });

    // ===== Execute in parallel =====
    logger.info(`[parallel] ⚡ Executing ${resolvedTasks.length} tasks in parallel...`);
    this._notify(onProgress, { phase: 'executing' });

    const promises = resolvedTasks.map(st => this._executeSubTask(runId, st));
    const results  = await Promise.allSettled(promises);

    // ===== Collect results =====
    const taskResults = results.map((result, i) => {
      const st = resolvedTasks[i];
      if (result.status === 'fulfilled') {
        return { id: st.id, task: st.task, success: true, ...result.value };
      } else {
        logger.error(`[parallel] Sub-task "${st.id}" failed: ${result.reason}`);
        return { id: st.id, task: st.task, success: false, error: result.reason?.message || 'Unknown error' };
      }
    });

    const successful = taskResults.filter(r => r.success);
    const failed     = taskResults.filter(r => !r.success);

    logger.info(`[parallel] Results: ${successful.length} success, ${failed.length} failed`);

    // ===== Merge results =====
    this._notify(onProgress, { phase: 'merging' });
    const merged = mergeStrategy
      ? mergeStrategy(taskResults)
      : this._defaultMerge(taskResults);

    // Build final result
    const costSummary = this.costOptimizer.getSessionSummary();
    const finalResult = {
      content:        merged,
      workflow:       'parallel_build',
      totalCost:      { usd: costSummary.totalUSD, thb: costSummary.totalTHB },
      totalTokens:    costSummary.totalTokens,
      models:         [...new Set(resolvedTasks.filter(t => t.modelEntry).map(t => t.modelEntry.name))],
      subTaskResults: taskResults,
      successful:     successful.length,
      failed:         failed.length,
      latencyMs:      Date.now() - startedAt,
      runId,
    };

    this.store.writeResult(runId, finalResult);
    logger.info(`[parallel] 🏆 Complete | ${successful.length}/${resolvedTasks.length} tasks | cost=${costSummary.totalTHB.toFixed(4)} THB | time=${finalResult.latencyMs}ms`);
    logger.info(this.costOptimizer.formatSummary());

    return finalResult;
  }

  /**
   * Execute a single sub-task
   */
  async _executeSubTask(runId, st) {
    if (!st.modelEntry) {
      throw new Error(`No model for "${st.id}"`);
    }

    const { name, model } = st.modelEntry;
    logger.info(`[parallel] ▶ "${st.id}" → ${name}`);

    const output = await model.generateWithRetry({
      task:    st.taskType || st.task,
      prompt:  st.prompt || st.task,
      context: st.context,
      tier:    st.tier || 'default',
      options: st.options,
    });

    if (!output.success) throw new Error(output.error);

    // Track cost
    this.costOptimizer.record({
      model:        output.modelId,
      provider:     output.provider,
      task:         st.id,
      inputTokens:  output.usage.inputTokens,
      outputTokens: output.usage.outputTokens,
      cost:         output.cost,
      latencyMs:    output.latencyMs,
    });

    this.store.writeDraft(`${runId}_${st.id}`, output.content, output);
    logger.info(`[parallel] ✅ "${st.id}" done | ${output.cost.thb.toFixed(4)} THB | ${output.latencyMs}ms`);

    return {
      content:   output.content,
      modelId:   output.modelId,
      provider:  output.provider,
      cost:      output.cost,
      latencyMs: output.latencyMs,
      usage:     output.usage,
    };
  }

  /**
   * Default merge: concatenate all results with section headers
   */
  _defaultMerge(taskResults) {
    const sections = taskResults
      .filter(r => r.success)
      .map(r => `## ${r.id.toUpperCase()}\n${r.content}`)
      .join('\n\n---\n\n');

    return sections;
  }

  _notify(callback, data) {
    if (typeof callback === 'function') {
      try { callback(data); } catch {}
    }
  }
}

export default ParallelBuild;

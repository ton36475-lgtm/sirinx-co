/**
 * performance-max.js — 47 Ronin Agent Performance Maximizer
 * ทุก agent ต้องทำงานที่ capacity สูงสุดตลอดเวลา
 * ตรวจสอบทุก 5 นาที — ถ้า idle > 15 นาที auto-assign งาน
 *
 * Metrics:
 *   - Tasks completed / hour
 *   - Revenue potential generated
 *   - Response quality score
 *   - Idle time %
 *   → composite performanceScore (0.0 – 1.0)
 */

import { logger } from './config.js';

const MONITOR_INTERVAL_MS  = 5 * 60 * 1000;   // ตรวจสอบทุก 5 นาที
const IDLE_THRESHOLD_MS    = 15 * 60 * 1000;   // idle > 15 นาที = ต้องได้งาน
const UNDERPERFORM_THRESH  = 0.45;             // score < 0.45 = escalate
const HOURLY_TASK_TARGET   = 3;               // target tasks/hour ต่อ agent

export class PerformanceMax {
  /**
   * @param {AgentScheduler} scheduler
   * @param {Function}       [onAlert]  — callback({ agentId, type, message })
   */
  constructor(scheduler, onAlert = null) {
    this.scheduler    = scheduler;
    this.onAlert      = onAlert;
    this._intervalId  = null;
    this._running     = false;
    this._history     = new Map();  // agentId → performance history[]
    this._hourlyStats = new Map();  // agentId → { tasksThisHour, revenueThisHour }
    this._leaderboard = [];
    this._departmentStats = {};
  }

  // ===== Lifecycle =====

  start() {
    if (this._running) return;
    this._running    = true;
    this._intervalId = setInterval(() => this._monitorCycle().catch(err =>
      logger.error(`[perf-max] monitor error: ${err.message}`)
    ), MONITOR_INTERVAL_MS);

    logger.info('[perf-max] 🚀 Performance Monitor started — checking every 5min');
    // Initial cycle immediately
    this._monitorCycle().catch(err => logger.error(`[perf-max] initial cycle error: ${err.message}`));
  }

  stop() {
    if (this._intervalId) clearInterval(this._intervalId);
    this._running    = false;
    this._intervalId = null;
    logger.info('[perf-max] Stopped');
  }

  // ===== Core Monitor =====

  async _monitorCycle() {
    if (!this.scheduler) return;

    const agents = this.scheduler.getAllAgents();
    const now    = Date.now();

    // ขั้นตอน 1: คำนวณ performanceScore ทุก agent
    for (const agent of agents) {
      agent.performanceScore = this.calculateScore(agent);
      this._recordHistory(agent.id, agent.performanceScore);
    }

    // ขั้นตอน 2: หา idle agents ที่ต้องการงาน
    const idleAgents = agents.filter(a =>
      (a.status === 'idle' || a.status === 'cooldown') &&
      a.taskQueue.length === 0 &&
      (now - (a.lastActiveAt || 0)) > IDLE_THRESHOLD_MS
    );

    if (idleAgents.length > 0) {
      logger.info(`[perf-max] ${idleAgents.length} agents idle — auto-assigning tasks`);
      for (const agent of idleAgents) {
        await this._assignProactiveTask(agent);
      }
    }

    // ขั้นตอน 3: ตรวจหา underperformers
    const underperformers = agents.filter(a =>
      a.tasksCompleted > 0 &&  // มีประวัติก่อน
      a.performanceScore < UNDERPERFORM_THRESH
    );

    for (const agent of underperformers) {
      this._escalate(agent, 'underperforming');
    }

    // ขั้นตอน 4: อัปเดต leaderboard และ department stats
    this._updateLeaderboard(agents);
    this._updateDepartmentStats(agents);

    const utilization = Math.round((agents.filter(a => a.status === 'active').length / agents.length) * 100);
    logger.debug(`[perf-max] cycle done | util: ${utilization}% | idle: ${idleAgents.length} | underperf: ${underperformers.length}`);
  }

  // ===== Scoring =====

  /**
   * คำนวณ composite performance score (0.0 – 1.0)
   * @param {Object} agent
   * @returns {number}
   */
  calculateScore(agent) {
    const now = Date.now();

    // 1. Task completion rate (0–1): เทียบกับ target 3 tasks/hour
    const sessionHours    = Math.max(1, (now - (agent.sessionStartAt || now - 3_600_000)) / 3_600_000);
    const expectedTasks   = sessionHours * HOURLY_TASK_TARGET;
    const completionRate  = Math.min(1, (agent.tasksCompleted || 0) / Math.max(1, expectedTasks));

    // 2. Activity rate (0–1): ไม่ควร idle นานเกินไป
    const idleMs           = Math.max(0, (now - (agent.lastActiveAt || now)));
    const maxIdleMs        = 60 * 60 * 1000;  // 1 hour reference
    const activityRate     = Math.max(0, 1 - idleMs / maxIdleMs);

    // 3. Revenue rate (0–1): เทียบกับ baseline 1000 THB/hour
    const revenueBaseline  = sessionHours * 1000;
    const revenueRate      = Math.min(1, (agent.revenueGenerated || 0) / Math.max(1, revenueBaseline));

    // 4. Queue health (0–1): มี tasks ใน queue = พร้อม
    const queueScore       = agent.taskQueue?.length > 0 ? 1.0 : (agent.status === 'active' ? 1.0 : 0.5);

    // Weighted composite
    const score = (
      completionRate  * 0.35 +
      activityRate    * 0.30 +
      revenueRate     * 0.25 +
      queueScore      * 0.10
    );

    return Math.round(score * 100) / 100;
  }

  // ===== Proactive Task Assignment =====

  async _assignProactiveTask(agent) {
    const task = this._selectTaskForAgent(agent);
    if (!task) return;

    try {
      this.scheduler.assignTask(agent.id, task, false);
      const msg = `Proactive task assigned to ${agent.codename}: ${task.task.slice(0, 60)}`;
      logger.info(`[perf-max] ✅ ${msg}`);
      this._notify(agent.id, 'task_assigned', msg);
    } catch (err) {
      logger.warn(`[perf-max] Failed to assign task to ${agent.id}: ${err.message}`);
    }
  }

  /**
   * เลือก task ที่เหมาะกับ specialization ของ agent
   */
  _selectTaskForAgent(agent) {
    const tasksByLayer = {
      L1: [
        { task: `สแกนหา leads ใหม่และ monitor Facebook Groups สำหรับ ${agent.codename}`, priority: 'medium', estimatedRevenueTHB: 3000, taskType: 'bulk_processing' },
        { task: `อัปเดตข้อมูล market intelligence และ competitive tracking`, priority: 'medium', estimatedRevenueTHB: 2000, taskType: 'research' },
      ],
      L2: [
        { task: `วิเคราะห์ข้อมูลที่ L1 รวบรวมมา สร้าง insights รายวัน`, priority: 'medium', estimatedRevenueTHB: 5000, taskType: 'data_analysis' },
        { task: `ประเมิน lead quality score และ prioritize pipeline`, priority: 'high', estimatedRevenueTHB: 8000, taskType: 'data_analysis' },
      ],
      L3: [
        { task: `สร้าง strategy recommendations จาก L2 analysis ล่าสุด`, priority: 'medium', estimatedRevenueTHB: 10000, taskType: 'reasoning' },
        { task: `วางแผน outreach campaign สำหรับ top 10 leads ในระบบ`, priority: 'high', estimatedRevenueTHB: 15000, taskType: 'marketing_copy' },
      ],
      L4: [
        { task: `Orchestrate และ coordinate งาน agents ในทีม`, priority: 'medium', estimatedRevenueTHB: 5000, taskType: 'reasoning' },
        { task: `ตรวจสอบ workflow status และ resolve blockers`, priority: 'high', estimatedRevenueTHB: 3000, taskType: 'data_analysis' },
      ],
      L5: [
        { task: `Research AI model benchmarks ใหม่ เปรียบเทียบ performance`, priority: 'low', estimatedRevenueTHB: 2000, taskType: 'research' },
        { task: `วิเคราะห์ trends ในอุตสาหกรรม solar ระดับ global`, priority: 'medium', estimatedRevenueTHB: 3000, taskType: 'research' },
      ],
      Chatbot: [
        { task: `สร้าง FAQ responses สำหรับ solar ROI calculator`, priority: 'medium', estimatedRevenueTHB: 1000, taskType: 'creative_content_th' },
      ],
    };

    const layerTasks = tasksByLayer[agent.layer] || tasksByLayer.L1;
    const idx = Math.floor(Math.random() * layerTasks.length);
    return {
      ...layerTasks[idx],
      id:          `perf_${agent.id}_${Date.now()}`,
      agentId:     agent.id,
      generatedAt: new Date().toISOString(),
      model:       agent.model,
      tier:        agent.tier,
      status:      'pending',
    };
  }

  // ===== Escalation =====

  _escalate(agent, reason) {
    const msg = `Agent ${agent.codename} (${agent.layer}) performance score: ${agent.performanceScore} — ${reason}`;
    logger.warn(`[perf-max] ⚠️ ${msg}`);
    this._notify(agent.id, 'underperforming', msg);
  }

  // ===== Revenue Tracking =====

  /**
   * บันทึก revenue สำหรับ agent
   * @param {string} agentId
   * @param {number} amount — THB
   * @param {string} source — task ID หรือ description
   */
  trackRevenue(agentId, amount, source) {
    const agent = this.scheduler?.getAgent(agentId);
    if (agent) {
      agent.revenueGenerated = (agent.revenueGenerated || 0) + amount;
    }

    // Hourly tracking
    if (!this._hourlyStats.has(agentId)) {
      this._hourlyStats.set(agentId, { tasksThisHour: 0, revenueThisHour: 0, hourStart: Date.now() });
    }
    const hourly = this._hourlyStats.get(agentId);

    // Reset if new hour
    if (Date.now() - hourly.hourStart > 3_600_000) {
      hourly.tasksThisHour   = 0;
      hourly.revenueThisHour = 0;
      hourly.hourStart       = Date.now();
    }

    hourly.revenueThisHour += amount;
    hourly.tasksThisHour   += 1;

    logger.debug(`[perf-max] Revenue +${amount} THB | ${agentId} | ${source}`);
  }

  // ===== Leaderboard =====

  _updateLeaderboard(agents) {
    this._leaderboard = agents
      .map(a => ({
        rank:              0,
        id:                a.id,
        codename:          a.codename,
        layer:             a.layer,
        performanceScore:  a.performanceScore || 0,
        tasksCompleted:    a.tasksCompleted   || 0,
        revenueGenerated:  a.revenueGenerated || 0,
        status:            a.status,
      }))
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .map((a, i) => ({ ...a, rank: i + 1 }));
  }

  /**
   * คืน top N agents
   */
  getLeaderboard(limit = 10) {
    return this._leaderboard.slice(0, limit);
  }

  // ===== Department Stats =====

  _updateDepartmentStats(agents) {
    const depts = { L1: [], L2: [], L3: [], L4: [], L5: [], Chatbot: [] };

    for (const agent of agents) {
      const layer = agent.layer || 'L1';
      if (!depts[layer]) depts[layer] = [];
      depts[layer].push(agent);
    }

    this._departmentStats = {};
    for (const [layer, layerAgents] of Object.entries(depts)) {
      if (layerAgents.length === 0) continue;

      const avgScore  = layerAgents.reduce((s, a) => s + (a.performanceScore || 0), 0) / layerAgents.length;
      const active    = layerAgents.filter(a => a.status === 'active').length;
      const revenue   = layerAgents.reduce((s, a) => s + (a.revenueGenerated || 0), 0);
      const tasks     = layerAgents.reduce((s, a) => s + (a.tasksCompleted   || 0), 0);

      this._departmentStats[layer] = {
        agentCount:      layerAgents.length,
        activeCount:     active,
        utilization:     `${Math.round((active / layerAgents.length) * 100)}%`,
        avgScore:        Math.round(avgScore * 100) / 100,
        totalRevenue:    revenue,
        totalTasks:      tasks,
      };
    }
  }

  getDepartmentStats() {
    return this._departmentStats;
  }

  // ===== History =====

  _recordHistory(agentId, score) {
    if (!this._history.has(agentId)) this._history.set(agentId, []);
    const hist = this._history.get(agentId);
    hist.push({ ts: Date.now(), score });
    if (hist.length > 288) hist.shift();  // keep 24h @ 5min intervals
  }

  getAgentHistory(agentId, limit = 12) {
    return (this._history.get(agentId) || []).slice(-limit);
  }

  // ===== Notify =====

  _notify(agentId, type, message) {
    if (this.onAlert) {
      try { this.onAlert({ agentId, type, message }); } catch {}
    }
  }

  // ===== Summary =====

  getSummary() {
    const agents = this.scheduler?.getAllAgents() || [];
    if (agents.length === 0) return null;

    const scores    = agents.map(a => a.performanceScore || 0);
    const avgScore  = scores.reduce((s, v) => s + v, 0) / scores.length;
    const topAgent  = this._leaderboard[0] || null;
    const worstAgent = this._leaderboard[this._leaderboard.length - 1] || null;

    return {
      avgPerformanceScore: Math.round(avgScore * 100) / 100,
      utilization:         `${Math.round((agents.filter(a => a.status === 'active').length / agents.length) * 100)}%`,
      topAgent:            topAgent ? `${topAgent.codename} (${topAgent.performanceScore})` : 'N/A',
      worstAgent:          worstAgent ? `${worstAgent.codename} (${worstAgent.performanceScore})` : 'N/A',
      totalRevenue:        agents.reduce((s, a) => s + (a.revenueGenerated || 0), 0),
      departments:         this._departmentStats,
      leaderboardTop5:     this.getLeaderboard(5),
    };
  }
}

// Singleton factory
let _instance = null;
export function getPerformanceMax(scheduler, onAlert) {
  if (!_instance) _instance = new PerformanceMax(scheduler, onAlert);
  return _instance;
}

export default PerformanceMax;

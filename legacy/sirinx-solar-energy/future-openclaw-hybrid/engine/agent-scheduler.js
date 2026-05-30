/**
 * agent-scheduler.js — 47 Ronin Agent Task Scheduler
 * ไม่มี agent ไหนที่ idle — ทุก agent มีงานทำตลอดเวลา
 *
 * Features:
 * 1. Priority queue system — urgent tasks ก่อน
 * 2. Idle detection — ถ้า idle > 15 min → auto-assign work
 * 3. Load balancing — กระจาย tasks ในแต่ละ layer อย่างสมดุล
 * 4. Revenue tracking per agent
 * 5. Status reporting สำหรับ /agents Telegram command
 * 6. Integration กับ Orchestrator engine
 */

import { AGENTS, STATUS, getAgentsByLayer } from './agent-definitions.js';
import { TaskGenerator } from './task-generator.js';
import { logger }        from './config.js';

const IDLE_THRESHOLD_MS    = 15 * 60 * 1000;  // 15 นาที
const SCHEDULER_INTERVAL_MS = 60 * 1000;       // ตรวจสอบทุก 1 นาที

export class AgentScheduler {
  /**
   * @param {Orchestrator}   orchestrator  — Orchestrator instance
   * @param {PerformanceMax} [perfMax]     — Optional PerformanceMax for hooks
   */
  constructor(orchestrator = null, perfMax = null) {
    this.orchestrator    = orchestrator;
    this.perfMax         = perfMax;      // PerformanceMax hook
    this.taskGenerator   = new TaskGenerator();

    // Clone agent definitions to mutable state
    this.agents = AGENTS.map(a => ({ ...a,
      status:           STATUS.IDLE,
      idleMinutes:      0,
      lastActiveAt:     Date.now(),
      revenueGenerated: 0,
      taskQueue:        [],
      currentTask:      null,
      tasksCompleted:   0,
    }));

    this._agentMap     = new Map(this.agents.map(a => [a.id, a]));
    this._running      = false;
    this._intervalId   = null;
    this._listeners    = [];
    this._sessionStats = {
      startedAt:        new Date().toISOString(),
      totalTasksRun:    0,
      totalRevenue:     0,
      totalCostTHB:     0,
    };
  }

  // ===== Lifecycle =====

  /**
   * เริ่ม scheduler — ตรวจสอบ idle agents ทุก 1 นาที
   * @param {PerformanceMax} [perfMax] — ถ้าส่งมาตอน start จะ override constructor value
   */
  start(perfMax) {
    if (this._running) return;
    if (perfMax) this.perfMax = perfMax;

    this._running    = true;
    this._intervalId = setInterval(() => this._tick(), SCHEDULER_INTERVAL_MS);
    logger.info('[scheduler] 🚀 Started — monitoring 47 agents every 60s');

    // เริ่ม PerformanceMax ถ้ามี
    if (this.perfMax && !this.perfMax._running) {
      this.perfMax.start();
      logger.info('[scheduler] PerformanceMax monitor attached');
    }

    // Initial task assignment
    this._tick();
  }

  /**
   * หยุด scheduler
   */
  stop() {
    if (this._intervalId) clearInterval(this._intervalId);
    this._running    = false;
    this._intervalId = null;
    if (this.perfMax?._running) this.perfMax.stop();
    logger.info('[scheduler] Stopped');
  }

  /**
   * Attach PerformanceMax หลัง constructor (ถ้า init ทีหลัง)
   * @param {PerformanceMax} perfMax
   */
  attachPerformanceMax(perfMax) {
    this.perfMax = perfMax;
    if (this._running && !perfMax._running) {
      perfMax.start();
      logger.info('[scheduler] PerformanceMax attached and started');
    }
  }

  // ===== Core Logic =====

  /**
   * Main tick — ตรวจสอบและ assign tasks ทุก interval
   */
  async _tick() {
    logger.debug('[scheduler] tick — checking agent status');

    const now = Date.now();

    // อัปเดต idle time ทุก agent
    for (const agent of this.agents) {
      if (agent.status === STATUS.IDLE || agent.status === STATUS.COOLDOWN) {
        agent.idleMinutes = Math.floor((now - agent.lastActiveAt) / 60000);
      }
    }

    // หา idle agents ที่ไม่มี tasks
    const idleAgents = this.agents.filter(a =>
      a.status === STATUS.IDLE &&
      a.taskQueue.length === 0 &&
      (now - a.lastActiveAt) > IDLE_THRESHOLD_MS
    );

    if (idleAgents.length > 0) {
      logger.info(`[scheduler] ${idleAgents.length} agents idle > 15min — generating tasks`);
      await this._assignTasksToIdleAgents(idleAgents);
    }

    // Execute pending tasks สำหรับ agents ที่มี queue
    const readyAgents = this.agents.filter(a =>
      a.status === STATUS.IDLE &&
      a.taskQueue.length > 0
    );

    for (const agent of readyAgents.slice(0, 5)) {  // max 5 concurrent per tick
      this._executeNextTask(agent).catch(err =>
        logger.error(`[scheduler] ${agent.id} task error: ${err.message}`)
      );
    }

    this._notifyListeners({ type: 'tick', idleCount: idleAgents.length });
  }

  /**
   * Generate และ assign tasks ให้ idle agents
   */
  async _assignTasksToIdleAgents(idleAgents) {
    const taskMap = this.taskGenerator.generateForIdleAgents(idleAgents);

    for (const agent of idleAgents) {
      const tasks = taskMap.get(agent.id) || [];
      const sorted = this.taskGenerator.sortByPriority(tasks);

      // เพิ่ม top 3 tasks ไปใน queue
      agent.taskQueue.push(...sorted.slice(0, 3));
      logger.debug(`[scheduler] ${agent.codename} → ${agent.taskQueue.length} tasks queued`);
    }
  }

  /**
   * Execute task ถัดไปสำหรับ agent
   */
  async _executeNextTask(agent) {
    if (agent.taskQueue.length === 0 || agent.status === STATUS.ACTIVE) return;

    // Priority sort
    agent.taskQueue.sort((a, b) => {
      const order = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (order[a.priority] || 99) - (order[b.priority] || 99);
    });

    const task       = agent.taskQueue.shift();
    agent.currentTask = task;
    agent.status      = STATUS.ACTIVE;
    agent.idleMinutes = 0;

    logger.info(`[scheduler] ▶ ${agent.codename} | ${task.priority.toUpperCase()} | ${task.task.slice(0, 60)}...`);
    this._notifyListeners({ type: 'task_started', agentId: agent.id, task });

    const startedAt = Date.now();

    try {
      let result = null;

      if (this.orchestrator) {
        // รัน task จริงผ่าน orchestrator
        result = await this.orchestrator.route(task.task, {
          taskType:     task.taskType,
          costOptimize: agent.layer === 'L1' || agent.layer === 'L2',  // L1/L2 ประหยัด cost
        });
      } else {
        // Simulation mode (ถ้าไม่มี orchestrator)
        await new Promise(r => setTimeout(r, 500 + Math.random() * 2000));
        result = { success: true, content: `[Simulated] ${agent.codename} completed: ${task.task}`, cost: { thb: 0.01 } };
      }

      const latencyMs = Date.now() - startedAt;

      // อัปเดต agent state
      agent.tasksCompleted   += 1;
      agent.revenueGenerated += task.estimatedRevenueTHB || 0;
      agent.lastActiveAt      = Date.now();
      agent.status            = STATUS.COOLDOWN;
      agent.currentTask       = null;
      agent.metrics.tasksCompleted = agent.tasksCompleted;

      // Cooldown 30 วินาที ก่อน active อีก
      setTimeout(() => {
        if (agent.status === STATUS.COOLDOWN) {
          agent.status      = STATUS.IDLE;
          agent.idleMinutes = 0;
        }
      }, 30000);

      // Session stats
      this._sessionStats.totalTasksRun    += 1;
      this._sessionStats.totalRevenue     += task.estimatedRevenueTHB || 0;
      this._sessionStats.totalCostTHB     += result?.cost?.thb || 0;

      // PerformanceMax hook — track revenue
      if (this.perfMax && task.estimatedRevenueTHB > 0) {
        this.perfMax.trackRevenue(agent.id, task.estimatedRevenueTHB, task.id || task.task?.slice(0, 40));
      }

      logger.info(`[scheduler] ✅ ${agent.codename} | ${latencyMs}ms | +${task.estimatedRevenueTHB?.toLocaleString()} THB potential`);
      this._notifyListeners({ type: 'task_completed', agentId: agent.id, task, result, latencyMs });

    } catch (err) {
      agent.status      = STATUS.IDLE;
      agent.currentTask = null;
      agent.lastActiveAt = Date.now();
      logger.error(`[scheduler] ❌ ${agent.codename} task failed: ${err.message}`);
      this._notifyListeners({ type: 'task_failed', agentId: agent.id, task, error: err.message });
    }
  }

  // ===== Manual Controls =====

  /**
   * Assign task ให้ agent เฉพาะเจาะจง (manual override)
   * @param {string} agentId
   * @param {Object} task
   * @param {boolean} [urgent=false] — ใส่ต้น queue
   */
  assignTask(agentId, task, urgent = false) {
    const agent = this._agentMap.get(agentId);
    if (!agent) {
      logger.warn(`[scheduler] Agent "${agentId}" ไม่พบ`);
      return false;
    }

    const taskObj = {
      id:                  `manual_${Date.now()}`,
      agentId,
      task:                task.task || task,
      priority:            task.priority || (urgent ? 'urgent' : 'medium'),
      estimatedRevenueTHB: task.estimatedRevenueTHB || 0,
      taskType:            task.taskType || agent.taskType,
      model:               agent.model,
      tier:                agent.tier,
      generatedAt:         new Date().toISOString(),
      status:              'pending',
    };

    if (urgent) {
      agent.taskQueue.unshift(taskObj);
    } else {
      agent.taskQueue.push(taskObj);
    }

    logger.info(`[scheduler] Assigned ${urgent ? 'URGENT' : ''} task to ${agent.codename}: ${taskObj.task.slice(0, 60)}`);
    return true;
  }

  /**
   * Broadcast urgent task ไปยัง agents ที่เหมาะสมใน layer
   * @param {string} layer — L1 | L2 | L3 | L4 | L5
   * @param {Object} task
   */
  broadcastToLayer(layer, task) {
    const layerAgents = this.agents.filter(a => a.layer === layer);
    const idleInLayer = layerAgents.filter(a => a.status === STATUS.IDLE);

    if (idleInLayer.length === 0) {
      logger.warn(`[scheduler] ไม่มี idle agents ใน ${layer}`);
      return 0;
    }

    // เลือก agent ที่มี queue น้อยที่สุด (load balancing)
    idleInLayer.sort((a, b) => a.taskQueue.length - b.taskQueue.length);
    const target = idleInLayer[0];
    this.assignTask(target.id, task, true);
    return 1;
  }

  /**
   * Trigger urgent situation — กระจาย tasks ที่เกี่ยวข้อง
   * @param {string} situation — 'new_leads' | 'competitor_move' | 'deal_at_risk'
   */
  triggerSituation(situation) {
    const urgentTasks = this.taskGenerator.generateUrgentTasks(situation);
    logger.info(`[scheduler] 🚨 Situation "${situation}" — assigning ${urgentTasks.length} urgent tasks`);

    for (const task of urgentTasks) {
      this.assignTask(task.agentId, { ...task, priority: 'urgent' }, true);
    }

    return urgentTasks.length;
  }

  // ===== Reporting =====

  /**
   * สรุปสถานะทุก agent
   */
  getStatusReport() {
    const byLayer   = { L1: [], L2: [], L3: [], L4: [], L5: [], Chatbot: [] };
    let totalActive = 0, totalIdle = 0, totalBlocked = 0;
    let totalRevenue = 0;

    for (const agent of this.agents) {
      const layer = agent.layer || 'Unknown';
      if (!byLayer[layer]) byLayer[layer] = [];

      byLayer[layer].push({
        id:              agent.id,
        codename:        agent.codename,
        status:          agent.status,
        idleMinutes:     agent.idleMinutes,
        currentTask:     agent.currentTask?.task?.slice(0, 50) || null,
        queueLength:     agent.taskQueue.length,
        tasksCompleted:  agent.tasksCompleted,
        revenueGenerated: agent.revenueGenerated,
      });

      if (agent.status === STATUS.ACTIVE)   totalActive++;
      if (agent.status === STATUS.IDLE)     totalIdle++;
      if (agent.status === STATUS.BLOCKED)  totalBlocked++;
      totalRevenue += agent.revenueGenerated;
    }

    return {
      summary: {
        totalAgents:  this.agents.length,
        active:       totalActive,
        idle:         totalIdle,
        blocked:      totalBlocked,
        cooldown:     this.agents.filter(a => a.status === STATUS.COOLDOWN).length,
        totalRevenuePotentialTHB: totalRevenue,
      },
      byLayer,
      session: this._sessionStats,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format report สำหรับ Telegram /agents command
   */
  formatTelegramReport(report) {
    const { summary, byLayer, session } = report;
    const lines = [
      `🤖 *47 Ronin Agent Status*`,
      `Active: ${summary.active} | Idle: ${summary.idle} | Cooldown: ${summary.cooldown}`,
      `Session tasks: ${session.totalTasksRun} | Revenue potential: ${summary.totalRevenuePotentialTHB.toLocaleString()} THB`,
      ``,
    ];

    for (const [layer, agents] of Object.entries(byLayer)) {
      if (agents.length === 0) continue;
      lines.push(`*${layer} (${agents.length} agents):*`);

      for (const a of agents.slice(0, 5)) {  // Show first 5 per layer to avoid too long message
        const icon   = a.status === 'active' ? '🟢' : a.status === 'cooldown' ? '🟡' : a.idleMinutes > 30 ? '🔴' : '⚪';
        const task   = a.currentTask ? `→ ${a.currentTask}` : a.queueLength > 0 ? `(${a.queueLength} queued)` : `idle ${a.idleMinutes}m`;
        lines.push(`${icon} ${a.codename}: ${task}`);
      }

      if (agents.length > 5) {
        lines.push(`  ...and ${agents.length - 5} more`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Format summary for CEO dashboard
   */
  formatCEOSummary() {
    const report = this.getStatusReport();
    const { summary, session } = report;
    return {
      activeAgents:           summary.active,
      idleAgents:             summary.idle,
      utilization:            `${Math.round((summary.active / summary.totalAgents) * 100)}%`,
      tasksRunToday:          session.totalTasksRun,
      revenuePotentialTHB:    summary.totalRevenuePotentialTHB,
      engineCostTHB:          session.totalCostTHB,
      roi:                    summary.totalRevenuePotentialTHB > 0
        ? `${Math.round(summary.totalRevenuePotentialTHB / Math.max(session.totalCostTHB, 0.01))}x`
        : 'N/A',
    };
  }

  // ===== Event System =====

  /**
   * Subscribe ไปยัง scheduler events
   * @param {Function} listener — callback({ type, ... })
   */
  on(listener) {
    this._listeners.push(listener);
  }

  off(listener) {
    this._listeners = this._listeners.filter(l => l !== listener);
  }

  _notifyListeners(event) {
    for (const listener of this._listeners) {
      try { listener(event); } catch {}
    }
  }

  // ===== Getters =====

  getAgent(id) {
    return this._agentMap.get(id);
  }

  getAllAgents() {
    return this.agents;
  }

  getAgentsByLayer(layer) {
    return this.agents.filter(a => a.layer === layer);
  }

  getIdleAgents() {
    return this.agents.filter(a => a.status === STATUS.IDLE);
  }

  getActiveAgents() {
    return this.agents.filter(a => a.status === STATUS.ACTIVE);
  }
}

export default AgentScheduler;

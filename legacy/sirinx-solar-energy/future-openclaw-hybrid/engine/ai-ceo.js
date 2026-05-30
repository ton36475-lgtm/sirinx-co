/**
 * ai-ceo.js — AI CEO Agent: Kuranosuke (大石内蔵助)
 * ผู้บัญชาการสูงสุดของระบบ 47 Ronin
 *
 * อำนาจหน้าที่:
 * - Auto-approve งาน system/operational ที่ไม่กระทบ production
 * - Delegate งานไปยัง department heads
 * - Monitor performance และ reassign idle agents
 * - Budget decisions ภายใน 50,000 THB/day
 * - Escalate เฉพาะ decisions ที่สำคัญมากไปหา Tony
 *
 * จะ escalate ก็ต่อเมื่อ:
 *   - Production deploy
 *   - Transaction > 50,000 THB
 *   - External customer communications
 *   - Credential changes
 *   - Production data deletion
 *   - Legal documents / vendor contracts
 */

import { logger }            from './config.js';
import { getApprovalEngine } from './approval-engine.js';
import { getSystemAccess }   from './system-access.js';

// ===== Department Heads =====
const DEPARTMENT_HEADS = {
  sales:     { name: 'Ōishi Yoshio',      agentId: 'yazama-02',    layer: 'L3' },
  marketing: { name: 'Horibe Sadaemon',   agentId: 'muramatsu-04', layer: 'L3' },
  tech:      { name: 'Okuda Chikara',     agentId: 'okuda-08',     layer: 'L4' },
  finance:   { name: 'Harada Kichiemon',  agentId: 'hara-03',      layer: 'L2' },
  ops:       { name: 'Yoshida Chūzaemon', agentId: 'yoshida-05',   layer: 'L4' },
};

// ===== AiCeo Class =====

export class AiCeo {
  /**
   * @param {Object}          [config]
   * @param {AgentScheduler}  [config.scheduler]
   * @param {Orchestrator}    [config.orchestrator]
   * @param {PerformanceMax}  [config.perfMax]
   * @param {TelegramBridge}  [config.telegramBridge]
   * @param {Function}        [config.onEscalate]   — callback เมื่อต้องส่งงานให้ Tony
   */
  constructor(config = {}) {
    this.name              = 'Kuranosuke';
    this.title             = 'AI CEO — 大石内蔵助';
    this.scheduler         = config.scheduler       || null;
    this.orchestrator      = config.orchestrator    || null;
    this.perfMax           = config.perfMax         || null;
    this.telegramBridge    = config.telegramBridge  || null;
    this.onEscalate        = config.onEscalate      || null;

    this.approvalEngine    = getApprovalEngine();
    this.sysAccess         = getSystemAccess();

    this.budgetLimitTHB    = 50_000;
    this.departmentHeads   = DEPARTMENT_HEADS;

    // State
    this._pendingEscalations = [];
    this._actionLog          = [];
    this._monitorIntervalId  = null;
    this._running            = false;
  }

  // ===== Lifecycle =====

  start() {
    if (this._running) return;
    this._running = true;

    // Monitor agents every 5 minutes
    this._monitorIntervalId = setInterval(() => {
      this.checkAgentPerformance().catch(err =>
        logger.error(`[ai-ceo] monitor error: ${err.message}`)
      );
    }, 5 * 60 * 1000);

    logger.info(`[ai-ceo] ${this.title} is online — auto-approvals active`);
    this._logAction('SYSTEM', 'AI CEO started', { budgetLimitTHB: this.budgetLimitTHB });
  }

  stop() {
    if (this._monitorIntervalId) clearInterval(this._monitorIntervalId);
    this._running = false;
    logger.info(`[ai-ceo] ${this.name} offline`);
  }

  // ===== Approval Handling =====

  /**
   * จุดเข้าหลัก — ทุก request ผ่านตรงนี้ก่อน
   * @param {Object} request
   * @param {string} request.description       — สิ่งที่ต้องการทำ
   * @param {string} [request.category]        — Override category
   * @param {number} [request.estimatedCostTHB=0]
   * @param {string} [request.requestedBy]     — agent ID
   * @param {Object} [request.context]         — ข้อมูลเพิ่มเติม
   * @returns {Promise<ApprovalResponse>}
   */
  async handleApprovalRequest(request) {
    const { description = '', requestedBy = 'unknown', estimatedCostTHB = 0, context = {} } = request;

    logger.info(`[ai-ceo] Approval request | from: ${requestedBy} | "${description.slice(0, 80)}"`);

    // Run through approval engine rules
    const evaluation = this.approvalEngine.evaluate({
      description,
      category:         request.category,
      estimatedCostTHB,
      requestedBy,
    });

    switch (evaluation.decision) {

      case 'auto': {
        // ✅ Auto-approved — ดำเนินการเลย
        this._logAction('AUTO_APPROVE', description, { category: evaluation.category, requestedBy, estimatedCostTHB });
        logger.info(`[ai-ceo] ✅ AUTO-APPROVED | ${evaluation.category} | ${requestedBy}`);

        return {
          approved:  true,
          approver:  'kuranosuke-auto',
          decision:  'auto',
          category:  evaluation.category,
          reason:    evaluation.reason,
          timestamp: new Date().toISOString(),
        };
      }

      case 'ceo': {
        // 🟡 CEO evaluates — Kuranosuke ตัดสินใจเอง
        const ceoDecision = await this._ceoBrainDecide(request, evaluation);
        this._logAction(
          ceoDecision.approved ? 'CEO_APPROVE' : 'CEO_REJECT',
          description,
          { category: evaluation.category, requestedBy, ceoReason: ceoDecision.reason }
        );
        return ceoDecision;
      }

      case 'human': {
        // 🔴 Human required — escalate ไปหา Tony
        const escalation = await this._escalateToTony(request, evaluation);
        this._logAction('ESCALATE_HUMAN', description, { category: evaluation.category, requestedBy });
        return escalation;
      }

      default: {
        logger.warn(`[ai-ceo] Unknown decision "${evaluation.decision}" — defaulting to human escalation`);
        return this._escalateToTony(request, evaluation);
      }
    }
  }

  /**
   * CEO brain — ตัดสินใจสำหรับ category ที่ต้องประเมินเอง
   */
  async _ceoBrainDecide(request, evaluation) {
    const { description, estimatedCostTHB = 0, context = {} } = request;

    // Logic สำหรับแต่ละ CEO-approved category
    const autoApproveConditions = {
      deploy_staging:       () => true,  // staging deploy เสมอ OK
      new_agent_creation:   () => true,  // สร้าง agent ใหม่ OK
      workflow_changes:     () => estimatedCostTHB < 10_000,
      budget_reallocation:  () => estimatedCostTHB < this.budgetLimitTHB,
      priority_changes:     () => true,
      team_restructuring:   () => true,
      model_config_change:  () => true,
      api_key_rotation_dev: () => true,
      integration_setup:    () => estimatedCostTHB < 5_000,
    };

    const condition = autoApproveConditions[evaluation.category];
    const approved  = condition ? condition() : false;

    const response = {
      approved,
      approver:  this.name,
      decision:  'ceo',
      category:  evaluation.category,
      reason:    approved
        ? `${this.name} approved: ${evaluation.reason}`
        : `${this.name} rejected: conditions not met for "${evaluation.category}"`,
      timestamp: new Date().toISOString(),
    };

    logger.info(`[ai-ceo] ${approved ? '✅' : '❌'} CEO DECISION | ${evaluation.category} | ${approved ? 'APPROVED' : 'REJECTED'}`);
    return response;
  }

  /**
   * Escalate to Tony — สร้าง pending escalation และแจ้ง Telegram
   */
  async _escalateToTony(request, evaluation) {
    const escalation = {
      id:          `esc_${Date.now()}`,
      ts:          new Date().toISOString(),
      request,
      evaluation,
      status:      'pending',
      resolvedAt:  null,
      resolution:  null,
    };

    this._pendingEscalations.push(escalation);

    const msg = [
      `🔴 *CEO Escalation — Tony Approval Required*`,
      ``,
      `📋 Request: ${request.description?.slice(0, 200)}`,
      `📂 Category: ${evaluation.category}`,
      `👤 Requested by: ${request.requestedBy || 'unknown'}`,
      `💰 Est. Cost: ${(request.estimatedCostTHB || 0).toLocaleString()} THB`,
      `📌 Reason: ${evaluation.reason}`,
      ``,
      `Escalation ID: \`${escalation.id}\``,
    ].join('\n');

    // แจ้ง Telegram
    if (this.telegramBridge) {
      await this.telegramBridge._send(msg).catch(err =>
        logger.warn(`[ai-ceo] Telegram escalation failed: ${err.message}`)
      );
    } else {
      logger.warn(`[ai-ceo] 🔴 ESCALATION (no Telegram): ${request.description?.slice(0, 80)}`);
    }

    // Fire onEscalate callback
    if (this.onEscalate) {
      try { this.onEscalate(escalation); } catch {}
    }

    return {
      approved:     false,
      approver:     'tony-required',
      decision:     'human',
      category:     evaluation.category,
      reason:       evaluation.reason,
      escalationId: escalation.id,
      timestamp:    escalation.ts,
    };
  }

  // ===== Agent Performance Monitoring =====

  /**
   * ตรวจสอบ performance ทุก 47 agent
   * Auto-assign งานให้ idle agents, escalate underperformers
   */
  async checkAgentPerformance() {
    if (!this.scheduler) return;

    const agents    = this.scheduler.getAllAgents();
    const now       = Date.now();
    const IDLE_MS   = 15 * 60 * 1000;

    let idleCount = 0;
    let assignedCount = 0;

    for (const agent of agents) {
      const isIdle     = agent.status === 'idle' || agent.status === 'cooldown';
      const noTasks    = agent.taskQueue.length === 0;
      const idleTooLong = (now - (agent.lastActiveAt || 0)) > IDLE_MS;

      if (isIdle && noTasks && idleTooLong) {
        idleCount++;

        // Check approval for auto-assigning work
        const approvalResult = this.approvalEngine.evaluate({
          description:     `Assign proactive task to idle agent ${agent.codename} (${agent.layer})`,
          category:        'agent_task_assignment',
          estimatedCostTHB: 0,
          requestedBy:     'kuranosuke-01',
        });

        if (approvalResult.decision === 'auto') {
          this.scheduler.assignTask(agent.id, {
            task:                `[${this.name}] Proactive: ${agent.specialization || 'ทำงาน default tasks'}`,
            priority:            'medium',
            estimatedRevenueTHB: 1000,
            taskType:            agent.taskType || 'data_analysis',
          });
          assignedCount++;
        }
      }

      // Check underperformance via perfMax
      if (this.perfMax && agent.tasksCompleted > 0) {
        const score = this.perfMax.calculateScore(agent);
        if (score < 0.30) {
          logger.warn(`[ai-ceo] ⚠️ ${agent.codename} performance score: ${score} — escalating`);
          this._logAction('UNDERPERFORM_ALERT', agent.codename, { score, layer: agent.layer });
        }
      }
    }

    if (idleCount > 0) {
      logger.info(`[ai-ceo] Performance check | idle: ${idleCount} | auto-assigned: ${assignedCount}`);
    }
  }

  // ===== Task Delegation =====

  /**
   * Delegate งานไปยัง department head ที่เหมาะสม
   * @param {string} department — 'sales' | 'marketing' | 'tech' | 'finance' | 'ops'
   * @param {Object} task
   * @returns {boolean}
   */
  delegate(department, task) {
    const head = this.departmentHeads[department];
    if (!head) {
      logger.warn(`[ai-ceo] Unknown department: "${department}"`);
      return false;
    }

    if (!this.scheduler) {
      logger.warn(`[ai-ceo] No scheduler — cannot delegate`);
      return false;
    }

    const taskWithMeta = {
      ...task,
      delegatedBy:   this.name,
      delegatedAt:   new Date().toISOString(),
      department,
    };

    const ok = this.scheduler.assignTask(head.agentId, taskWithMeta, task.urgent || false);
    if (ok) {
      logger.info(`[ai-ceo] Delegated to ${head.name} (${department}): ${task.task?.slice(0, 60)}`);
      this._logAction('DELEGATE', task.task || '', { department, assignedTo: head.name });
    }
    return ok;
  }

  // ===== System Task Execution =====

  /**
   * Execute system task โดยตรง (file ops, builds, scripts)
   * @param {Object} task
   * @param {string} task.type    — 'read_file' | 'write_file' | 'list_dir' | 'run_command'
   * @param {Object} task.params
   * @returns {Promise<any>}
   */
  async executeSystemTask(task) {
    const approvalResult = this.approvalEngine.evaluate({
      description:     `System task: ${task.type} — ${JSON.stringify(task.params).slice(0, 80)}`,
      category:        'system_maintenance',
      estimatedCostTHB: 0,
      requestedBy:     'kuranosuke-01',
    });

    if (approvalResult.decision === 'human') {
      throw new Error(`[ai-ceo] System task blocked — requires human approval: ${approvalResult.reason}`);
    }

    this._logAction('SYSTEM_TASK', task.type, task.params);

    switch (task.type) {
      case 'read_file':
        return this.sysAccess.readFile(task.params.path, task.params.encoding);

      case 'write_file':
        return this.sysAccess.writeFile(task.params.path, task.params.content, task.params.encoding);

      case 'list_dir':
        return this.sysAccess.listDir(task.params.path);

      case 'run_command':
        return this.sysAccess.runCommand(task.params.cmd, task.params.args || [], task.params.options);

      default:
        throw new Error(`[ai-ceo] Unknown system task type: "${task.type}"`);
    }
  }

  // ===== Budget Decisions =====

  /**
   * ตัดสินใจ budget — approve ถ้าไม่เกิน limit
   * @param {number} amountTHB
   * @param {string} purpose
   * @returns {{ approved: boolean, reason: string }}
   */
  decideBudget(amountTHB, purpose) {
    const dailyStats = this.approvalEngine.getDailyStats();

    if (amountTHB > this.budgetLimitTHB) {
      const reason = `Amount ${amountTHB.toLocaleString()} THB exceeds AI CEO limit ${this.budgetLimitTHB.toLocaleString()} THB — Tony required`;
      this._logAction('BUDGET_REJECT', purpose, { amountTHB, reason });
      return { approved: false, reason };
    }

    if (dailyStats.dailySpendTHB + amountTHB > this.budgetLimitTHB) {
      const reason = `Daily budget nearly exhausted (${dailyStats.dailySpendTHB.toLocaleString()} used) — Tony required`;
      this._logAction('BUDGET_REJECT', purpose, { amountTHB, reason });
      return { approved: false, reason };
    }

    const reason = `AI CEO approved ${amountTHB.toLocaleString()} THB for: ${purpose}`;
    this._logAction('BUDGET_APPROVE', purpose, { amountTHB });
    return { approved: true, reason };
  }

  // ===== Reporting =====

  getStatus() {
    return {
      name:               this.name,
      title:              this.title,
      running:            this._running,
      pendingEscalations: this._pendingEscalations.filter(e => e.status === 'pending').length,
      dailyBudget:        this.approvalEngine.getDailyStats(),
      actionCount:        this._actionLog.length,
      departmentHeads:    this.departmentHeads,
    };
  }

  getPendingEscalations() {
    return this._pendingEscalations.filter(e => e.status === 'pending');
  }

  resolveEscalation(escalationId, approved, tonyNote = '') {
    const esc = this._pendingEscalations.find(e => e.id === escalationId);
    if (!esc) return false;
    esc.status     = approved ? 'approved' : 'rejected';
    esc.resolvedAt = new Date().toISOString();
    esc.resolution = tonyNote;
    logger.info(`[ai-ceo] Escalation ${escalationId} resolved: ${esc.status}`);
    return true;
  }

  getRecentActions(limit = 20) {
    return this._actionLog.slice(-limit);
  }

  formatTelegramStatus() {
    const status    = this.getStatus();
    const budgetPct = status.dailyBudget.utilizationPct;
    const lines     = [
      `🎌 *${this.title}*`,
      `Status: ${this._running ? '🟢 Online' : '🔴 Offline'}`,
      `Pending escalations: ${status.pendingEscalations}`,
      `Daily budget: ${status.dailyBudget.dailySpendTHB.toLocaleString()} / ${status.dailyBudget.budgetLimitTHB.toLocaleString()} THB (${budgetPct}%)`,
      `Actions today: ${status.actionCount}`,
    ];
    return lines.join('\n');
  }

  // ===== Internal Logging =====

  _logAction(type, description, meta = {}) {
    const entry = {
      ts:          new Date().toISOString(),
      type,
      description: String(description).slice(0, 120),
      meta,
    };
    this._actionLog.push(entry);
    if (this._actionLog.length > 500) this._actionLog.shift();
  }
}

// Singleton
let _instance = null;
export function getAiCeo(config = {}) {
  if (!_instance) _instance = new AiCeo(config);
  return _instance;
}

export default AiCeo;

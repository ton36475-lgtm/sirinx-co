/**
 * ceo-dashboard.js — CEO Dashboard Data Provider
 * รวบรวม realtime data จากทุก component เพื่อ display ใน Telegram / Web
 *
 * Data provided:
 *   - Agent status (47 Ronin utilization)
 *   - Revenue pipeline (potential THB)
 *   - Approval queue (pending escalations)
 *   - System health (models, cost, budget)
 *   - Performance leaderboard
 *   - Recent AI CEO actions
 */

import { logger } from './config.js';
import { getSystemAccess } from './system-access.js';

export class CeoDashboard {
  /**
   * @param {Object} components
   * @param {Orchestrator}      components.orchestrator
   * @param {AgentScheduler}    components.scheduler
   * @param {PerformanceMax}    components.perfMax
   * @param {AiCeo}             components.aiCeo
   * @param {ImprovementPlanner} [components.planner]
   */
  constructor(components = {}) {
    this.orchestrator = components.orchestrator || null;
    this.scheduler    = components.scheduler    || null;
    this.perfMax      = components.perfMax      || null;
    this.aiCeo        = components.aiCeo        || null;
    this.planner      = components.planner      || null;
  }

  // ===== Full Dashboard Snapshot =====

  /**
   * สรุปข้อมูลครบทุก section สำหรับ CEO
   * @returns {Object}
   */
  getSnapshot() {
    return {
      ts:           new Date().toISOString(),
      agents:       this.getAgentSection(),
      revenue:      this.getRevenueSection(),
      approvals:    this.getApprovalSection(),
      systemHealth: this.getSystemHealthSection(),
      performance:  this.getPerformanceSection(),
      ceoActions:   this.getCeoActionsSection(),
    };
  }

  // ===== Sections =====

  getAgentSection() {
    if (!this.scheduler) return { error: 'Scheduler not connected' };

    const report  = this.scheduler.getStatusReport();
    const { summary, byLayer, session } = report;

    const layerSummary = {};
    for (const [layer, agents] of Object.entries(byLayer)) {
      if (agents.length === 0) continue;
      const active = agents.filter(a => a.status === 'active').length;
      layerSummary[layer] = {
        total:        agents.length,
        active,
        idle:         agents.filter(a => a.status === 'idle').length,
        utilization:  `${Math.round((active / agents.length) * 100)}%`,
        avgScore:     this.perfMax
          ? Math.round(
              agents.reduce((s, a) => s + (this.perfMax.calculateScore(a) || 0), 0) / agents.length * 100
            ) / 100
          : null,
      };
    }

    return {
      totalAgents:  summary.totalAgents,
      active:       summary.active,
      idle:         summary.idle,
      cooldown:     summary.cooldown,
      blocked:      summary.blocked,
      utilization:  `${Math.round((summary.active / summary.totalAgents) * 100)}%`,
      byLayer:      layerSummary,
      session: {
        tasksRun:         session.totalTasksRun,
        startedAt:        session.startedAt,
        totalCostTHB:     Math.round(session.totalCostTHB * 100) / 100,
      },
    };
  }

  getRevenueSection() {
    if (!this.scheduler) return { error: 'Scheduler not connected' };

    const report  = this.scheduler.getStatusReport();
    const agents  = this.scheduler.getAllAgents();
    const { summary, session } = report;

    // Top revenue agents
    const topAgents = agents
      .filter(a => a.revenueGenerated > 0)
      .sort((a, b) => b.revenueGenerated - a.revenueGenerated)
      .slice(0, 5)
      .map(a => ({ codename: a.codename, layer: a.layer, revenue: a.revenueGenerated }));

    const totalRevenue = summary.totalRevenuePotentialTHB;
    const roi = session.totalCostTHB > 0
      ? `${Math.round(totalRevenue / session.totalCostTHB)}x`
      : 'N/A';

    return {
      totalPotentialTHB: totalRevenue,
      engineCostTHB:     Math.round(session.totalCostTHB * 100) / 100,
      roi,
      topAgents,
      perfMax:           this.perfMax?.getSummary?.() || null,
    };
  }

  getApprovalSection() {
    if (!this.aiCeo) return { error: 'AI CEO not connected' };

    const pending = this.aiCeo.getPendingEscalations();
    const budget  = this.aiCeo.getStatus().dailyBudget;

    return {
      pendingEscalations: pending.length,
      escalations: pending.slice(0, 5).map(e => ({
        id:          e.id,
        ts:          e.ts,
        category:    e.evaluation?.category,
        description: e.request?.description?.slice(0, 100),
        requestedBy: e.request?.requestedBy,
        costTHB:     e.request?.estimatedCostTHB || 0,
      })),
      budget: {
        spentTHB:    budget.dailySpendTHB,
        limitTHB:    budget.budgetLimitTHB,
        remainingTHB: budget.remainingTHB,
        utilizationPct: budget.utilizationPct,
      },
      audit: this.aiCeo?.approvalEngine?.getRecentAudit?.(5) || [],
    };
  }

  getSystemHealthSection() {
    const health = {
      orchestratorReady: false,
      modelsAvailable:   [],
      modelsUnavailable: [],
      sessionCostTHB:    0,
      budgetUsedPct:     0,
    };

    if (this.orchestrator) {
      try {
        const status = this.orchestrator.getStatus();
        health.orchestratorReady = status.initialized;

        for (const [name, info] of Object.entries(status.models || {})) {
          if (info.available && !info.disabled) {
            health.modelsAvailable.push(name);
          } else {
            health.modelsUnavailable.push(name);
          }
        }

        const cost = status.cost || {};
        health.sessionCostTHB  = Math.round((cost.totalTHB || 0) * 100) / 100;
        health.budgetUsedPct   = parseFloat(cost.budgetUsedPct || 0);
        health.byTier          = cost.byTier || null;
      } catch (err) {
        health.error = err.message;
      }
    }

    // System access audit (recent ops)
    try {
      const sysAccess = getSystemAccess?.();
      health.recentSystemOps = sysAccess?.getAuditLog?.(5) || [];
    } catch {
      health.recentSystemOps = [];
    }

    return health;
  }

  getPerformanceSection() {
    if (!this.perfMax) return { error: 'PerformanceMax not connected' };

    return {
      summary:      this.perfMax.getSummary(),
      leaderboard:  this.perfMax.getLeaderboard(10),
      departments:  this.perfMax.getDepartmentStats(),
    };
  }

  getCeoActionsSection() {
    if (!this.aiCeo) return { error: 'AI CEO not connected' };

    const actions = this.aiCeo.getRecentActions(10);
    const status  = this.aiCeo.getStatus();

    return {
      ceoStatus:    status,
      recentActions: actions.map(a => ({
        ts:   a.ts,
        type: a.type,
        desc: a.description,
      })),
    };
  }

  // ===== Telegram Formatting =====

  /**
   * Format สำหรับ /ceo command ใน Telegram
   */
  formatTelegramDashboard() {
    const snap = this.getSnapshot();
    const lines = [
      `🎌 *SIRINX AI-WarRoom — CEO Dashboard*`,
      `_${new Date().toLocaleString('th-TH')}_`,
      ``,
    ];

    // Agents
    const ag = snap.agents;
    if (!ag.error) {
      lines.push(`🤖 *Agents*`);
      lines.push(`Active: ${ag.active}/${ag.totalAgents} (${ag.utilization}) | Tasks: ${ag.session?.tasksRun || 0}`);
      lines.push(``);
    }

    // Revenue
    const rev = snap.revenue;
    if (!rev.error) {
      lines.push(`💰 *Revenue Pipeline*`);
      lines.push(`Potential: ${(rev.totalPotentialTHB || 0).toLocaleString()} THB | ROI: ${rev.roi}`);
      lines.push(`Engine cost: ${rev.engineCostTHB} THB`);
      if (rev.topAgents?.length > 0) {
        lines.push(`Top: ${rev.topAgents.slice(0, 3).map(a => `${a.codename} +${a.revenue.toLocaleString()}`).join(', ')}`);
      }
      lines.push(``);
    }

    // Approvals
    const appr = snap.approvals;
    if (!appr.error) {
      const icon = appr.pendingEscalations > 0 ? '🔴' : '✅';
      lines.push(`${icon} *Approvals*`);
      lines.push(`Pending Tony approval: ${appr.pendingEscalations}`);
      lines.push(`Budget: ${appr.budget?.spentTHB?.toLocaleString()} / ${appr.budget?.limitTHB?.toLocaleString()} THB (${appr.budget?.utilizationPct}%)`);
      lines.push(``);
    }

    // System Health
    const sys = snap.systemHealth;
    if (!sys.error) {
      lines.push(`🔧 *System Health*`);
      lines.push(`Models: ✅ ${sys.modelsAvailable.join(', ')}${sys.modelsUnavailable.length > 0 ? ` | ❌ ${sys.modelsUnavailable.join(', ')}` : ''}`);
      lines.push(`Session cost: ${sys.sessionCostTHB} THB (${sys.budgetUsedPct}% of budget)`);
      lines.push(``);
    }

    // Performance top 3
    const perf = snap.performance;
    if (!perf.error && perf.leaderboard?.length > 0) {
      lines.push(`🏆 *Top Performers*`);
      perf.leaderboard.slice(0, 3).forEach((a, i) => {
        lines.push(`${i + 1}. ${a.codename} (${a.layer}) — score: ${a.performanceScore}`);
      });
      lines.push(``);
    }

    // AI CEO
    const ceo = snap.ceoActions;
    if (!ceo.error) {
      lines.push(this.aiCeo?.formatTelegramStatus?.() || '');
    }

    return lines.join('\n');
  }

  /**
   * Format compact เพื่อ send ทุก X นาที (scheduled summary)
   */
  formatQuickSummary() {
    try {
      const ag  = this.getAgentSection();
      const rev = this.getRevenueSection();
      const appr = this.getApprovalSection();

      const parts = [
        `🤖 ${ag.active || 0}/${ag.totalAgents || 47} active`,
        `💰 ${((rev.totalPotentialTHB || 0) / 1000).toFixed(0)}K THB pipeline`,
        appr.pendingEscalations > 0 ? `🔴 ${appr.pendingEscalations} pending` : `✅ No escalations`,
        `💸 Budget: ${appr.budget?.utilizationPct || 0}%`,
      ];

      return `📊 *QuickStats* | ${parts.join(' | ')}`;
    } catch (err) {
      return `📊 Dashboard error: ${err.message}`;
    }
  }
}

export default CeoDashboard;

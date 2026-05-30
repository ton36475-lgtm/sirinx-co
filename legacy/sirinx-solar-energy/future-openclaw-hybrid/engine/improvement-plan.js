/**
 * improvement-plan.js — System Improvement Planner
 * วิเคราะห์สถานะปัจจุบันของระบบและสร้าง roadmap ปรับปรุง
 * ใช้ข้อมูลจาก orchestrator, scheduler, performance-max
 */

import { logger }          from './config.js';
import { getSystemAccess } from './system-access.js';

// ===== Analysis Templates =====

const IMPROVEMENT_AREAS = {
  agent_coverage: {
    description: 'ครอบคลุมทุก business function ด้วย agents ที่เหมาะสม',
    weight: 0.25,
  },
  model_utilization: {
    description: 'ใช้ model ที่เหมาะกับแต่ละ task type',
    weight: 0.20,
  },
  cost_efficiency: {
    description: 'ลด cost ต่อ task โดยไม่ลด quality',
    weight: 0.20,
  },
  integration_depth: {
    description: 'เชื่อมต่อกับ CRM, Telegram, Supabase อย่างสมบูรณ์',
    weight: 0.15,
  },
  automation_coverage: {
    description: 'งานซ้ำๆ ถูก automate ทั้งหมด',
    weight: 0.20,
  },
};

const PHASED_ROADMAP = {
  phase1: {
    name: 'Foundation',
    timeline: 'Week 1-2',
    focus: 'Core engine stability + all agents online',
    milestones: [
      'ทุก 47 agent มี task templates และ auto-assignment ทำงานได้',
      'AI CEO (Kuranosuke) auto-approval สำหรับ system tasks',
      'Telegram bridge ทำงานได้ครบทุก command',
      'Audit log ครอบคลุมทุก action',
      'Cost tracking ทำงาน realtime',
    ],
  },
  phase2: {
    name: 'Integration',
    timeline: 'Week 3-4',
    focus: 'เชื่อมต่อ external systems',
    milestones: [
      'Supabase integration สำหรับ lead storage',
      'Facebook Groups scanner ทำงานได้ (L1 agents)',
      'SEO content pipeline ครบ 77 จังหวัด',
      'ROI Calculator connected to agent data',
      'Automated daily reports ส่ง Telegram',
    ],
  },
  phase3: {
    name: 'Scale',
    timeline: 'Month 2',
    focus: 'รองรับ volume สูง + performance optimization',
    milestones: [
      'Parallel execution สำหรับ L1 agents (batch scanning)',
      'Model cascade ปรับ quality threshold อัตโนมัติ',
      'Revenue tracking ต่อ agent ต่อ deal',
      'Leaderboard และ performance dashboard',
      'Customer-facing chatbot (Kai) production-ready',
    ],
  },
  phase4: {
    name: 'Optimize',
    timeline: 'Month 3',
    focus: 'Fine-tune, cost optimization, ROI maximization',
    milestones: [
      'A/B test prompt strategies ระหว่าง model pairs',
      'Auto-tune agent task priorities ตาม conversion data',
      'Predictive lead scoring model',
      'Multi-tenant support (รองรับลูกค้าหลายราย)',
      'SLA monitoring และ auto-escalation',
    ],
  },
};

// ===== ImprovementPlanner Class =====

export class ImprovementPlanner {
  /**
   * @param {Orchestrator}    [orchestrator]
   * @param {AgentScheduler}  [scheduler]
   * @param {PerformanceMax}  [perfMax]
   */
  constructor(orchestrator = null, scheduler = null, perfMax = null) {
    this.orchestrator = orchestrator;
    this.scheduler    = scheduler;
    this.perfMax      = perfMax;
    this.sysAccess    = getSystemAccess();
    this._lastAnalysis = null;
  }

  /**
   * วิเคราะห์สถานะระบบปัจจุบัน
   * @returns {Promise<AnalysisResult>}
   */
  async analyzeCurrentSystem() {
    logger.info('[improvement] 🔍 Analyzing current system...');

    const analysis = {
      timestamp:       new Date().toISOString(),
      strengths:       [],
      weaknesses:      [],
      opportunities:   [],
      recommendations: [],
      scores:          {},
      nextActions:     [],
    };

    // ===== Check: Agent Coverage =====
    try {
      const agents      = this.scheduler?.getAllAgents() || [];
      const active      = agents.filter(a => a.status === 'active').length;
      const withTasks   = agents.filter(a => a.tasksCompleted > 0).length;
      const score       = agents.length >= 47 ? 1.0 : agents.length / 47;

      analysis.scores.agent_coverage = Math.round(score * 100);

      if (agents.length >= 47) {
        analysis.strengths.push(`✅ ครบ 47 agents — ${active} กำลังทำงาน, ${agents.length - active} idle`);
      } else {
        analysis.weaknesses.push(`⚠️ พบ ${agents.length}/47 agents — ขาดอีก ${47 - agents.length} agents`);
        analysis.recommendations.push({
          area: 'agent_coverage',
          priority: 'high',
          action: `เพิ่ม ${47 - agents.length} agents ที่ขาดหาย ตาม CLAUDE.md Ronin Codenames`,
        });
      }

      if (withTasks < agents.length * 0.5) {
        analysis.weaknesses.push(`⚠️ มีเพียง ${withTasks}/${agents.length} agents ที่เคย complete tasks`);
        analysis.recommendations.push({
          area: 'agent_coverage',
          priority: 'medium',
          action: 'รัน initial task assignment cycle เพื่อ warm-up agents ทั้งหมด',
        });
      }
    } catch (err) {
      analysis.weaknesses.push(`❌ ไม่สามารถ read agent status: ${err.message}`);
    }

    // ===== Check: Model Utilization =====
    try {
      const modelStatus = this.orchestrator?.getStatus()?.models || {};
      const available   = Object.entries(modelStatus).filter(([, v]) => v.available);
      const total       = Object.keys(modelStatus).length || 4;
      const score       = available.length / total;

      analysis.scores.model_utilization = Math.round(score * 100);

      if (available.length === total) {
        analysis.strengths.push(`✅ ทุก model พร้อมใช้: ${available.map(([k]) => k).join(', ')}`);
      } else {
        const missing = Object.entries(modelStatus).filter(([, v]) => !v.available).map(([k]) => k);
        analysis.weaknesses.push(`⚠️ Model ไม่พร้อม: ${missing.join(', ')}`);
        analysis.recommendations.push({
          area: 'model_utilization',
          priority: 'high',
          action: `ตั้งค่า API keys สำหรับ: ${missing.join(', ')} ใน engine/.env`,
        });
      }
    } catch (err) {
      analysis.scores.model_utilization = 50;
      analysis.weaknesses.push(`⚠️ ไม่สามารถตรวจสอบ model status`);
    }

    // ===== Check: Cost Efficiency =====
    try {
      const costData  = this.orchestrator?.costOptimizer?.getSessionSummary?.() || {};
      const budgetPct = parseFloat(costData.budgetUsedPct || 0);

      if (budgetPct < 50) {
        analysis.strengths.push(`✅ Cost efficiency ดี — ใช้ budget ${budgetPct}% จาก limit`);
        analysis.scores.cost_efficiency = 90;
      } else if (budgetPct < 80) {
        analysis.scores.cost_efficiency = 70;
        analysis.opportunities.push(`💡 Budget ใช้ไป ${budgetPct}% — มีโอกาสลด cost โดย shift งาน L1/L2 ไปใช้ Economy models`);
      } else {
        analysis.scores.cost_efficiency = 40;
        analysis.weaknesses.push(`⚠️ Budget ใช้ไปแล้ว ${budgetPct}% — ใกล้ limit`);
        analysis.recommendations.push({
          area: 'cost_efficiency',
          priority: 'urgent',
          action: 'เพิ่ม budget limit หรือ shift tasks ไปยัง cheaper models (Qwen Turbo, Gemini Flash)',
        });
      }
    } catch {
      analysis.scores.cost_efficiency = 75;
    }

    // ===== Check: Integration Depth =====
    const integrationChecks = await this._checkIntegrations();
    analysis.scores.integration_depth = integrationChecks.score;
    analysis.strengths.push(...integrationChecks.strengths);
    analysis.weaknesses.push(...integrationChecks.weaknesses);
    analysis.recommendations.push(...integrationChecks.recommendations);

    // ===== Check: Automation Coverage =====
    const perfSummary = this.perfMax?.getSummary?.() || null;
    if (perfSummary) {
      const util  = parseFloat(perfSummary.utilization) || 0;
      const score = Math.min(100, util * 1.5);
      analysis.scores.automation_coverage = Math.round(score);

      if (util >= 60) {
        analysis.strengths.push(`✅ Automation utilization ${perfSummary.utilization} — agents ทำงานดี`);
      } else {
        analysis.weaknesses.push(`⚠️ Utilization เพียง ${perfSummary.utilization} — agents ส่วนใหญ่ idle`);
        analysis.recommendations.push({
          area: 'automation_coverage',
          priority: 'high',
          action: 'เปิด PerformanceMax monitor และลด IDLE_THRESHOLD เป็น 10 นาที',
        });
      }
    } else {
      analysis.scores.automation_coverage = 50;
      analysis.opportunities.push('💡 ยังไม่มี PerformanceMax monitoring — เปิดใช้เพื่อ maximize utilization');
    }

    // ===== Overall Score =====
    const overallScore = Math.round(
      Object.entries(IMPROVEMENT_AREAS).reduce((total, [key, def]) => {
        return total + (analysis.scores[key] || 50) * def.weight;
      }, 0)
    );
    analysis.overallScore    = overallScore;
    analysis.overallGrade    = overallScore >= 80 ? 'A' : overallScore >= 65 ? 'B' : overallScore >= 50 ? 'C' : 'D';

    // ===== Next Actions (top 5 priorities) =====
    analysis.nextActions = analysis.recommendations
      .sort((a, b) => {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (order[a.priority] || 99) - (order[b.priority] || 99);
      })
      .slice(0, 5)
      .map((r, i) => `${i + 1}. [${r.priority.toUpperCase()}] ${r.action}`);

    this._lastAnalysis = analysis;
    logger.info(`[improvement] Analysis complete — Score: ${overallScore}/100 (${analysis.overallGrade})`);
    return analysis;
  }

  /**
   * ตรวจสอบ integrations (env file, Telegram, Supabase)
   */
  async _checkIntegrations() {
    const result = { score: 0, strengths: [], weaknesses: [], recommendations: [] };
    let points = 0;
    const totalPoints = 5;

    // Check Telegram
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      points++;
      result.strengths.push('✅ Telegram integration configured');
    } else {
      result.weaknesses.push('⚠️ Telegram bot token หรือ chat ID ไม่ได้ตั้งค่า');
      result.recommendations.push({ area: 'integration_depth', priority: 'high', action: 'ตั้งค่า TELEGRAM_BOT_TOKEN และ TELEGRAM_CHAT_ID ใน .env' });
    }

    // Check Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      points++;
      result.strengths.push('✅ Anthropic API key present');
    } else {
      result.weaknesses.push('⚠️ ANTHROPIC_API_KEY ไม่ได้ตั้งค่า');
    }

    // Check OpenAI
    if (process.env.OPENAI_API_KEY) {
      points++;
      result.strengths.push('✅ OpenAI API key present');
    } else {
      result.weaknesses.push('⚠️ OPENAI_API_KEY ไม่ได้ตั้งค่า — ChatGPT ไม่พร้อมใช้');
    }

    // Check Supabase
    if (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) {
      points++;
      result.strengths.push('✅ Supabase URL configured');
    } else {
      result.recommendations.push({ area: 'integration_depth', priority: 'medium', action: 'ตั้งค่า Supabase URL สำหรับ lead storage' });
    }

    // Check Google/Gemini
    if (process.env.GOOGLE_API_KEY) {
      points++;
      result.strengths.push('✅ Google Gemini API key present');
    } else {
      result.weaknesses.push('⚠️ GOOGLE_API_KEY ไม่ได้ตั้งค่า — Gemini ไม่พร้อมใช้');
    }

    result.score = Math.round((points / totalPoints) * 100);
    return result;
  }

  /**
   * สร้าง phased improvement roadmap
   * @returns {Object}
   */
  generatePlan() {
    const analysis = this._lastAnalysis;

    return {
      generatedAt:  new Date().toISOString(),
      systemScore:  analysis ? `${analysis.overallScore}/100 (${analysis.overallGrade})` : 'Run analyzeCurrentSystem() first',
      phases:       PHASED_ROADMAP,
      quickWins:    this._getQuickWins(analysis),
      kpis: {
        week2:  { utilization: '70%', agentsOnline: 47, dailyTasksRun: 200 },
        month1: { utilization: '85%', leadsScanned: 500, revenueGenerated: '฿500K potential' },
        month3: { utilization: '95%', closedDeals: 5, recurringRevenue: '฿200K ARR' },
      },
    };
  }

  _getQuickWins(analysis) {
    if (!analysis) return [];
    return analysis.recommendations
      .filter(r => r.priority === 'high' || r.priority === 'urgent')
      .slice(0, 3)
      .map(r => r.action);
  }

  /**
   * สร้าง formatted report สำหรับ Telegram / CEO dashboard
   */
  formatReport() {
    const a = this._lastAnalysis;
    if (!a) return '❌ ยังไม่ได้ run analysis — เรียก analyzeCurrentSystem() ก่อน';

    const lines = [
      `📊 *System Health Report*`,
      `Score: ${a.overallScore}/100 (Grade: ${a.overallGrade})`,
      ``,
      `✅ *Strengths (${a.strengths.length})*`,
      ...a.strengths.slice(0, 3),
      ``,
      `⚠️ *Weaknesses (${a.weaknesses.length})*`,
      ...a.weaknesses.slice(0, 3),
      ``,
      `🎯 *Top Actions*`,
      ...a.nextActions.slice(0, 3),
    ];

    return lines.join('\n');
  }
}

export default ImprovementPlanner;

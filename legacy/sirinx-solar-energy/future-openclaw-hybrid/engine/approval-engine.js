/**
 * approval-engine.js — Auto-Approval Rule Engine
 * กำหนด 3 ระดับ: auto_approved / ceo_agent_approved / human_required
 * Kuranosuke (AI CEO) ใช้ engine นี้ในการตัดสินใจ approve/escalate
 */

import { logger } from './config.js';

// ===== Approval Categories =====

export const APPROVAL_RULES = {

  // ✅ Auto-approved — ไม่ต้องรอใคร
  auto_approved: {
    categories: [
      'system_maintenance',
      'content_generation',
      'seo_work',
      'lead_scanning',
      'data_analysis',
      'agent_task_assignment',
      'file_operations_project',
      'api_calls_within_budget',
      'test_execution',
      'report_generation',
      'build_staging',
      'code_review',
      'skill_deployment',
      'telegram_notifications',
      'scheduled_tasks',
      'performance_monitoring',
      'log_analysis',
      'cache_cleanup',
      'dependency_updates',
      'documentation_updates',
    ],
    conditions: {
      budgetPerActionTHB: 5000,
      budgetPerDayTHB:   50000,
      withinProjectDirs:  true,
      noProductionImpact: true,
    },
  },

  // 🟡 CEO Agent approved — Kuranosuke ประเมินและ approve เอง
  ceo_agent_approved: {
    categories: [
      'deploy_staging',
      'new_agent_creation',
      'workflow_changes',
      'budget_reallocation',
      'priority_changes',
      'team_restructuring',
      'model_config_change',
      'api_key_rotation_dev',
      'integration_setup',
    ],
  },

  // 🔴 Human required — ต้องรอ Tony อนุมัติ
  human_required: {
    categories: [
      'deploy_production',
      'financial_transaction_large',
      'external_customer_comms',
      'credential_changes',
      'production_data_deletion',
      'vendor_contracts',
      'legal_documents',
      'api_key_rotation_prod',
      'investor_communications',
    ],
  },
};

// Pattern matching สำหรับ detect category จาก request text
const CATEGORY_PATTERNS = [
  // Auto-approved
  { pattern: /maintenance|cleanup|cache|log.*(clean|purge)|restart.*service/i,         category: 'system_maintenance' },
  { pattern: /content|blog|article|copy|เขียน|สร้างบทความ/i,                           category: 'content_generation' },
  { pattern: /seo|keyword|meta.?tag|sitemap|77.*จังหวัด/i,                              category: 'seo_work' },
  { pattern: /scan.*lead|lead.*scan|fb.*group|facebook.*group/i,                        category: 'lead_scanning' },
  { pattern: /analyz|วิเคราะห์|data.*process|report.*generate/i,                        category: 'data_analysis' },
  { pattern: /assign.*task|task.*assign|ให้งาน|agent.*work/i,                           category: 'agent_task_assignment' },
  { pattern: /read.*file|write.*file|list.*dir|file.*operat/i,                          category: 'file_operations_project' },
  { pattern: /api.*call|model.*request|llm.*request/i,                                  category: 'api_calls_within_budget' },
  { pattern: /run.*test|test.*execut|npm.*test|pytest/i,                                category: 'test_execution' },
  { pattern: /generat.*report|สร้างรายงาน|weekly.*report|daily.*summary/i,              category: 'report_generation' },
  { pattern: /build.*staging|npm.*build|next.*build/i,                                   category: 'build_staging' },
  { pattern: /code.*review|review.*code|pr.*review/i,                                   category: 'code_review' },
  { pattern: /deploy.*skill|skill.*deploy|install.*skill/i,                             category: 'skill_deployment' },
  { pattern: /telegram.*notif|send.*telegram|bot.*message/i,                            category: 'telegram_notifications' },
  { pattern: /scheduled.*task|cron|interval.*run/i,                                     category: 'scheduled_tasks' },
  { pattern: /monitor.*perf|performance.*check|health.*check/i,                         category: 'performance_monitoring' },
  { pattern: /analyz.*log|log.*analyz|error.*log/i,                                     category: 'log_analysis' },
  { pattern: /npm.*update|package.*update|dependency/i,                                 category: 'dependency_updates' },
  { pattern: /update.*doc|เขียน.*doc|documentation/i,                                  category: 'documentation_updates' },

  // CEO agent approved
  { pattern: /deploy.*staging|staging.*deploy/i,                                        category: 'deploy_staging' },
  { pattern: /create.*agent|new.*agent|เพิ่ม.*agent/i,                                  category: 'new_agent_creation' },
  { pattern: /workflow.*change|change.*workflow/i,                                       category: 'workflow_changes' },
  { pattern: /budget.*reallocat|reallocat.*budget/i,                                    category: 'budget_reallocation' },
  { pattern: /priority.*change|เปลี่ยน.*priority/i,                                     category: 'priority_changes' },

  // Human required
  { pattern: /deploy.*prod(?:uction)?|production.*deploy/i,                            category: 'deploy_production' },
  { pattern: /transact|โอนเงิน|payment|จ่ายเงิน/i,                                      category: 'financial_transaction_large' },
  { pattern: /email.*customer|customer.*email|ส่งอีเมล.*ลูกค้า/i,                       category: 'external_customer_comms' },
  { pattern: /change.*password|reset.*cred|credential/i,                                category: 'credential_changes' },
  { pattern: /delete.*prod|drop.*table|truncat.*prod/i,                                 category: 'production_data_deletion' },
  { pattern: /vendor.*contract|ทำสัญญา|contract.*sign/i,                                category: 'vendor_contracts' },
  { pattern: /legal|นิติ|กฎหมาย|ทนาย/i,                                                  category: 'legal_documents' },
];

// ===== ApprovalEngine Class =====

export class ApprovalEngine {
  constructor() {
    this._dailySpend  = 0;
    this._dailyReset  = Date.now();
    this._auditLog    = [];
  }

  /**
   * ประเมิน request และคืน approval decision
   * @param {Object} request
   * @param {string} request.description — สิ่งที่ต้องการทำ
   * @param {string} [request.category]  — Override category (ถ้ารู้แล้ว)
   * @param {number} [request.estimatedCostTHB=0]
   * @param {string} [request.requestedBy] — agent ID ที่ขอ
   * @returns {{ decision: 'auto'|'ceo'|'human', category: string, reason: string }}
   */
  evaluate(request) {
    const { description = '', category: override, estimatedCostTHB = 0, requestedBy = 'unknown' } = request;

    // Reset daily spend if new day
    if (Date.now() - this._dailyReset > 86_400_000) {
      this._dailySpend = 0;
      this._dailyReset = Date.now();
    }

    // Detect category
    const category = override || this._detectCategory(description);

    // Check if human_required first (hardest block)
    if (APPROVAL_RULES.human_required.categories.includes(category)) {
      const decision = { decision: 'human', category, reason: `Category "${category}" requires Tony approval` };
      this._audit(requestedBy, description, decision);
      return decision;
    }

    // Check if ceo_agent_approved
    if (APPROVAL_RULES.ceo_agent_approved.categories.includes(category)) {
      const decision = { decision: 'ceo', category, reason: `Category "${category}" — Kuranosuke will evaluate` };
      this._audit(requestedBy, description, decision);
      return decision;
    }

    // Check auto_approved conditions
    const conditions = APPROVAL_RULES.auto_approved.conditions;

    if (estimatedCostTHB > conditions.budgetPerActionTHB) {
      const decision = { decision: 'human', category, reason: `Cost ${estimatedCostTHB} THB exceeds per-action limit ${conditions.budgetPerActionTHB} THB` };
      this._audit(requestedBy, description, decision);
      return decision;
    }

    if (this._dailySpend + estimatedCostTHB > conditions.budgetPerDayTHB) {
      const decision = { decision: 'human', category, reason: `Daily budget ${conditions.budgetPerDayTHB} THB would be exceeded` };
      this._audit(requestedBy, description, decision);
      return decision;
    }

    // Auto-approved
    this._dailySpend += estimatedCostTHB;
    const decision = { decision: 'auto', category, reason: `Category "${category}" is auto-approved` };
    this._audit(requestedBy, description, decision);
    return decision;
  }

  /**
   * Detect category from description using pattern matching
   */
  _detectCategory(description) {
    for (const { pattern, category } of CATEGORY_PATTERNS) {
      if (pattern.test(description)) return category;
    }
    // Default: ถ้าไม่รู้ว่าเป็น category อะไร ให้ CEO ตัดสิน
    return 'agent_task_assignment';
  }

  /**
   * บันทึก audit log
   */
  _audit(requestedBy, description, decision) {
    const entry = {
      ts:          new Date().toISOString(),
      requestedBy,
      description: description.slice(0, 120),
      ...decision,
    };
    this._auditLog.push(entry);
    // Keep last 500 entries
    if (this._auditLog.length > 500) this._auditLog.shift();

    const icon = decision.decision === 'auto' ? '✅' : decision.decision === 'ceo' ? '🟡' : '🔴';
    logger.debug(`[approval] ${icon} ${decision.decision.toUpperCase()} | ${decision.category} | ${description.slice(0, 60)}`);
  }

  getDailyStats() {
    return {
      dailySpendTHB: this._dailySpend,
      budgetLimitTHB: APPROVAL_RULES.auto_approved.conditions.budgetPerDayTHB,
      remainingTHB: APPROVAL_RULES.auto_approved.conditions.budgetPerDayTHB - this._dailySpend,
      utilizationPct: Math.round((this._dailySpend / APPROVAL_RULES.auto_approved.conditions.budgetPerDayTHB) * 100),
    };
  }

  getRecentAudit(limit = 20) {
    return this._auditLog.slice(-limit);
  }
}

// Singleton
let _instance = null;
export function getApprovalEngine() {
  if (!_instance) _instance = new ApprovalEngine();
  return _instance;
}

export default ApprovalEngine;

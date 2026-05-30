/**
 * schemas.js — Artifact Schema Definitions
 * กำหนด structure ของ artifacts ที่ใช้สื่อสารระหว่าง models
 * ใช้ plain object validation (ไม่ต้องการ Zod dependency)
 */

// ===== Schema Definitions =====

export const ARTIFACT_TYPES = [
  'task',
  'draft',
  'review',
  'finding',
  'handoff',
  'result',
  'cost_summary',
  'parallel_result',
];

export const SEVERITY_LEVELS = ['critical', 'major', 'minor', 'suggestion'];
export const RECOMMENDATIONS  = ['approve', 'revise', 'reject'];

// ===== Task Artifact =====
// Input สำหรับ workflow — อธิบาย task ที่ต้องการ
export const TaskSchema = {
  required: ['task'],
  properties: {
    task:        'string — คำอธิบาย task',
    taskType:    'string — จาก TASK_MODEL_MAP',
    params:      'object — parameters เพิ่มเติม',
    priority:    'low | medium | high | urgent',
    status:      'pending | running | completed | failed',
    runId:       'string — workflow run ID',
    requestedBy: 'string — who/what requested this task',
    deadline:    'ISO date string (optional)',
  },
  example: {
    task:     'สร้าง SEO content สำหรับ keyword "โซลาร์เซลล์ พิษณุโลก"',
    taskType: 'seo_content',
    params:   { keyword: 'โซลาร์เซลล์ พิษณุโลก', wordCount: 800, location: 'พิษณุโลก' },
    priority: 'medium',
    status:   'pending',
  },
};

// ===== Draft Artifact =====
// Output จาก drafter model
export const DraftSchema = {
  required: ['content', 'model', 'provider'],
  properties: {
    content:   'string — เนื้อหาที่ draft',
    model:     'string — model ID ที่ใช้',
    provider:  'string — claude | chatgpt | gemini | qwen',
    usage:     '{ inputTokens, outputTokens, totalTokens }',
    cost:      '{ usd, thb }',
    latencyMs: 'number',
    round:     'number — draft round (1, 2, 3...)',
  },
};

// ===== Review Artifact =====
// Feedback จาก reviewer model
export const ReviewSchema = {
  required: ['approved', 'score', 'recommendation', 'findings'],
  properties: {
    approved:        'boolean',
    score:           'number 0-100',
    recommendation:  'approve | revise | reject',
    summary:         'string — สรุปการ review',
    findings: [{
      severity:   'critical | major | minor | suggestion',
      message:    'string — ปัญหาที่พบ',
      suggestion: 'string — วิธีแก้ไข',
    }],
    strengths:       'string[] — จุดเด่น',
    requiredChanges: 'string[] — การเปลี่ยนแปลงที่ต้องทำ',
    model:           'string — reviewer model ID',
    cost:            '{ usd, thb }',
  },
};

// ===== Finding Artifact =====
// Single finding จาก review
export const FindingSchema = {
  required: ['severity', 'message'],
  properties: {
    severity:   'critical | major | minor | suggestion',
    message:    'string',
    suggestion: 'string (optional)',
    line:       'number (optional — สำหรับ code review)',
    file:       'string (optional — สำหรับ code review)',
  },
};

// ===== Handoff Artifact =====
// ส่งงานจาก model หนึ่งไปยังอีก model
export const HandoffSchema = {
  required: ['from', 'to', 'task', 'content'],
  properties: {
    from:         'string — sender model',
    to:           'string — receiver model',
    task:         'string — task description',
    content:      'string — เนื้อหาที่ส่งต่อ',
    instructions: 'string — คำแนะนำสำหรับ receiver',
    context:      'string — context เพิ่มเติม',
    priority:     'low | medium | high | urgent',
  },
};

// ===== Result Artifact =====
// Final output ของ workflow
export const ResultSchema = {
  required: ['content', 'workflow', 'totalCost'],
  properties: {
    content:     'string — final content',
    workflow:    'critique_loop | parallel_build | cascade | simple',
    totalCost:   '{ usd, thb }',
    totalTokens: 'number',
    totalRounds: 'number (for critique loops)',
    models:      'string[] — models ที่ใช้',
    quality: {
      finalScore:   'number 0-100',
      approved:     'boolean',
    },
    completedAt: 'ISO date string',
    metadata:    'object',
  },
};

// ===== Validation Helper =====
/**
 * Validate artifact against basic schema rules
 * @param {Object} artifact
 * @param {Object} schema
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validate(artifact, schema) {
  const errors = [];

  if (!schema.required) return { valid: true, errors: [] };

  for (const field of schema.required) {
    if (artifact[field] === undefined || artifact[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return {
    valid:  errors.length === 0,
    errors,
  };
}

/**
 * สร้าง runId unique สำหรับ workflow
 * @param {string} [prefix]
 * @returns {string}
 */
export function generateRunId(prefix = 'run') {
  const ts     = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 6);
  return `${prefix}_${ts}_${random}`;
}

export default {
  ARTIFACT_TYPES,
  SEVERITY_LEVELS,
  RECOMMENDATIONS,
  TaskSchema,
  DraftSchema,
  ReviewSchema,
  FindingSchema,
  HandoffSchema,
  ResultSchema,
  validate,
  generateRunId,
};

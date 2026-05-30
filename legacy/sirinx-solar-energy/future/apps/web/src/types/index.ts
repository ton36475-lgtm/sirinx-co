// ─── Core Enums ───────────────────────────────────────────────────────────────

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'awaiting_approval'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type BrainCategory = 'doctrine' | 'template' | 'knowledge' | 'research_standard'
export type PolicyEffect = 'allow' | 'deny'
export type AuditAction =
  | 'task.created' | 'task.started' | 'task.completed' | 'task.failed' | 'task.cancelled'
  | 'approval.requested' | 'approval.approved' | 'approval.rejected'
  | 'brain.entry.created' | 'brain.entry.updated' | 'brain.entry.deleted'
  | 'policy.created' | 'policy.updated' | 'policy.deleted'
  | 'org.updated' | 'workspace.created' | 'provider.updated'
  | 'budget.updated' | 'agent.deployed' | 'agent.removed'

// ─── Org & Workspace ──────────────────────────────────────────────────────────

export interface Org {
  id: string
  slug: string
  name: string
  logo_url?: string
  theme_color?: string
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  org_id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── Agents & Packs ───────────────────────────────────────────────────────────

export interface AgentPack {
  id: string
  org_id: string
  workspace_id?: string
  name: string
  description?: string
  agents: Agent[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Agent {
  id: string
  pack_id: string
  name: string
  role: string
  model: string
  system_prompt: string
  tools: string[]
  is_active: boolean
  created_at: string
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export interface Task {
  id: string
  org_id: string
  workspace_id?: string
  title: string
  description?: string
  status: TaskStatus
  pack_id?: string
  created_by?: string
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
  cost_usd?: number
  tokens_used?: number
  steps_total?: number
  steps_completed?: number
}

export interface TaskStep {
  id: string
  task_id: string
  step_number: number
  agent_name: string
  action: string
  status: TaskStatus
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  error?: string
  started_at?: string
  completed_at?: string
  tokens_used?: number
  cost_usd?: number
}

export interface TaskArtifact {
  id: string
  task_id: string
  name: string
  type: string
  size_bytes?: number
  url?: string
  created_at: string
}

export interface TaskDetail extends Task {
  steps: TaskStep[]
  artifacts: TaskArtifact[]
  approval?: Approval
}

// ─── Approvals ────────────────────────────────────────────────────────────────

export interface Approval {
  id: string
  org_id: string
  task_id: string
  task_title: string
  requested_action: string
  risk_level: RiskLevel
  requested_by?: string
  status: ApprovalStatus
  reviewer_id?: string
  reviewer_note?: string
  reviewed_at?: string
  created_at: string
}

// ─── Company Brain ────────────────────────────────────────────────────────────

export interface BrainEntry {
  id: string
  org_id: string
  category: BrainCategory
  title: string
  content: string
  tags: string[]
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

// ─── Policies ─────────────────────────────────────────────────────────────────

export interface Policy {
  id: string
  org_id: string
  name: string
  description?: string
  effect: PolicyEffect
  actions: string[]
  conditions?: Record<string, unknown>
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// ─── Budget ───────────────────────────────────────────────────────────────────

export interface BudgetConfig {
  id: string
  org_id: string
  workspace_id?: string
  monthly_limit_usd: number
  daily_limit_usd?: number
  per_task_limit_usd?: number
  alert_threshold_pct: number
  created_at: string
  updated_at: string
}

export interface BudgetUsage {
  org_id: string
  period: string
  total_usd: number
  task_count: number
  token_count: number
  by_workspace: WorkspaceBudget[]
  by_day: DailyBudget[]
}

export interface WorkspaceBudget {
  workspace_id: string
  workspace_name: string
  total_usd: number
  task_count: number
}

export interface DailyBudget {
  date: string
  total_usd: number
  task_count: number
}

// ─── Providers ────────────────────────────────────────────────────────────────

export interface Provider {
  id: string
  org_id: string
  name: string
  type: 'openai' | 'anthropic' | 'google' | 'azure' | 'custom'
  base_url?: string
  is_active: boolean
  models: ProviderModel[]
  created_at: string
  updated_at: string
}

export interface ProviderModel {
  id: string
  provider_id: string
  model_id: string
  display_name: string
  context_window: number
  input_price_per_1k: number
  output_price_per_1k: number
  is_default: boolean
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export interface AuditEvent {
  id: string
  org_id: string
  action: AuditAction
  actor_id?: string
  actor_email?: string
  resource_type: string
  resource_id: string
  metadata?: Record<string, unknown>
  ip_address?: string
  created_at: string
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  has_next: boolean
}

export interface ApiError {
  error: string
  detail?: string
  code?: string
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  active_tasks: number
  pending_approvals: number
  budget_used_pct: number
  active_agents: number
  tasks_today: number
  tasks_this_week: number
  cost_today_usd: number
  cost_this_month_usd: number
}

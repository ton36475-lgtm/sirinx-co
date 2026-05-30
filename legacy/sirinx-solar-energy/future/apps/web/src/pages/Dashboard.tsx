import { useNavigate } from 'react-router-dom'
import {
  ListTodo,
  CheckCircle,
  DollarSign,
  Bot,
  Plus,
  Brain,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'
import { Layout } from '@/components/Layout'
import { KpiCard } from '@/components/Card'
import { Table, type Column } from '@/components/Table'
import { TaskStatusBadge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { useApi } from '@/hooks/useApi'
import { endpoints } from '@/api/client'
import type { Task, DashboardStats } from '@/types'

// ─── DNA Loop Visualisation ───────────────────────────────────────────────────

function DnaLoop() {
  const steps = [
    { label: 'Learn', color: 'text-electric-400', bg: 'bg-electric-500/10 border-electric-500/30' },
    { label: 'Evolve', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
    { label: 'Execute', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  ]

  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center">
          <div
            className={`flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 ${s.bg} transition-transform hover:scale-105`}
          >
            <span className={`text-xs font-bold ${s.color}`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <ArrowRight className="mx-2 h-4 w-4 text-slate-600" />
          )}
        </div>
      ))}
      {/* Loop-back arrow */}
      <span className="ml-2 text-xs text-slate-500">↺</span>
    </div>
  )
}

// ─── Mock fallback data ───────────────────────────────────────────────────────

const MOCK_STATS: DashboardStats = {
  active_tasks: 4,
  pending_approvals: 2,
  budget_used_pct: 37,
  active_agents: 12,
  tasks_today: 8,
  tasks_this_week: 34,
  cost_today_usd: 0.48,
  cost_this_month_usd: 14.2,
}

const MOCK_TASKS: Task[] = [
  {
    id: 't1', org_id: 'org_demo', title: 'Market Research Report', status: 'completed',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(), cost_usd: 0.12, tokens_used: 8200,
  },
  {
    id: 't2', org_id: 'org_demo', title: 'Competitor Analysis Q2', status: 'running',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    updated_at: new Date().toISOString(), cost_usd: 0.04, tokens_used: 2100,
  },
  {
    id: 't3', org_id: 'org_demo', title: 'Draft Blog Post: AI Trends', status: 'awaiting_approval',
    created_at: new Date(Date.now() - 900000).toISOString(),
    updated_at: new Date().toISOString(), cost_usd: 0.07, tokens_used: 4800,
  },
  {
    id: 't4', org_id: 'org_demo', title: 'Weekly Email Newsletter', status: 'pending',
    created_at: new Date(Date.now() - 300000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't5', org_id: 'org_demo', title: 'Lead Scoring Batch', status: 'failed',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date().toISOString(), cost_usd: 0.02, tokens_used: 900,
  },
]

// ─── Main Component ───────────────────────────────────────────────────────────

export function Dashboard() {
  const navigate = useNavigate()

  const {
    data: stats,
    loading: statsLoading,
  } = useApi(() => endpoints.dashboard.stats(), [])

  const {
    data: tasksData,
    loading: tasksLoading,
  } = useApi(() => endpoints.tasks.list({ page_size: 10 }), [])

  const displayStats = stats ?? MOCK_STATS
  const displayTasks = tasksData?.items ?? MOCK_TASKS

  const taskColumns: Column<Task>[] = [
    {
      key: 'title',
      header: 'Task',
      render: (t) => <span className="font-medium text-slate-200">{t.title}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => <TaskStatusBadge status={t.status} />,
      width: '160px',
    },
    {
      key: 'cost',
      header: 'Cost',
      align: 'right',
      render: (t) =>
        t.cost_usd !== undefined
          ? <span className="font-mono text-xs text-slate-400">${t.cost_usd.toFixed(4)}</span>
          : <span className="text-slate-600">—</span>,
      width: '90px',
    },
    {
      key: 'created',
      header: 'Created',
      align: 'right',
      render: (t) => (
        <span className="text-xs text-slate-500">
          {new Date(t.created_at).toLocaleString()}
        </span>
      ),
      width: '170px',
    },
  ]

  return (
    <Layout
      title="Dashboard"
      headerActions={
        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => navigate('/tasks')}
        >
          New Task
        </Button>
      }
    >
      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          title="Active Tasks"
          value={statsLoading ? '—' : displayStats.active_tasks}
          change={`+${displayStats.tasks_today} today`}
          changePositive
          icon={<ListTodo className="h-4 w-4" />}
          iconColor="bg-electric-500/10 text-electric-400"
        />
        <KpiCard
          title="Pending Approvals"
          value={statsLoading ? '—' : displayStats.pending_approvals}
          icon={<CheckCircle className="h-4 w-4" />}
          iconColor="bg-amber-500/10 text-amber-400"
        />
        <KpiCard
          title="Budget Used"
          value={statsLoading ? '—' : `${displayStats.budget_used_pct}%`}
          change={`$${displayStats.cost_this_month_usd.toFixed(2)} this month`}
          changePositive={displayStats.budget_used_pct < 80}
          icon={<DollarSign className="h-4 w-4" />}
          iconColor="bg-emerald-500/10 text-emerald-400"
        />
        <KpiCard
          title="Active Agents"
          value={statsLoading ? '—' : displayStats.active_agents}
          icon={<Bot className="h-4 w-4" />}
          iconColor="bg-rose-500/10 text-rose-400"
        />
      </div>

      {/* Bottom Row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Recent Tasks */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">Recent Tasks</h2>
            <Button
              variant="ghost"
              size="xs"
              iconRight={<ArrowRight className="h-3 w-3" />}
              onClick={() => navigate('/tasks')}
            >
              View all
            </Button>
          </div>
          <Table
            columns={taskColumns}
            data={displayTasks}
            loading={tasksLoading}
            rowKey={(t) => t.id}
            onRowClick={(t) => navigate(`/tasks/${t.id}`)}
            emptyTitle="No tasks yet"
            emptyDescription="Create your first task to get started"
          />
        </div>

        {/* Right Panel */}
        <div className="flex flex-col gap-4">
          {/* DNA Loop */}
          <div className="rounded-xl border border-slate-800 bg-navy-800 p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-200">Agent DNA Loop</h2>
            <DnaLoop />
            <p className="mt-3 text-center text-xs text-slate-500">
              Agents continuously learn, evolve, and execute
            </p>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-slate-800 bg-navy-800 p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-200">Quick Actions</h2>
            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus className="h-3.5 w-3.5" />}
                className="w-full justify-start"
                onClick={() => navigate('/tasks')}
              >
                New Task
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<Brain className="h-3.5 w-3.5" />}
                className="w-full justify-start"
                onClick={() => navigate('/brain')}
              >
                View Brain
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<DollarSign className="h-3.5 w-3.5" />}
                className="w-full justify-start"
                onClick={() => navigate('/budget')}
              >
                Check Budget
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw className="h-3.5 w-3.5" />}
                className="w-full justify-start"
                onClick={() => navigate('/approvals')}
              >
                Review Approvals
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Table, type Column } from '@/components/Table'
import { TaskStatusBadge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { useApi, useMutation } from '@/hooks/useApi'
import { endpoints } from '@/api/client'
import type { Task, TaskStatus } from '@/types'

const STATUS_OPTIONS: { label: string; value: TaskStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Running', value: 'running' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Awaiting Approval', value: 'awaiting_approval' },
]

export function Tasks() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const { data, loading, refetch } = useApi(
    () => endpoints.tasks.list({ page, page_size: 20, status: statusFilter || undefined }),
    [page, statusFilter],
  )

  const createMutation = useMutation(
    (vars: { title: string; description?: string }) => endpoints.tasks.create(vars),
  )

  const tasks = data?.items ?? []
  const filtered = search
    ? tasks.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
    : tasks

  async function handleCreate() {
    if (!newTitle.trim()) return
    await createMutation.mutate({ title: newTitle.trim(), description: newDesc.trim() || undefined })
    setNewTaskOpen(false)
    setNewTitle('')
    setNewDesc('')
    refetch()
  }

  const columns: Column<Task>[] = [
    {
      key: 'title',
      header: 'Task',
      render: (t) => (
        <div>
          <p className="font-medium text-slate-200">{t.title}</p>
          {t.description && (
            <p className="mt-0.5 text-xs text-slate-500 truncate max-w-xs">{t.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '170px',
      render: (t) => <TaskStatusBadge status={t.status} />,
    },
    {
      key: 'progress',
      header: 'Progress',
      width: '120px',
      render: (t) =>
        t.steps_total ? (
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-slate-700">
              <div
                className="h-1.5 rounded-full bg-electric-500"
                style={{ width: `${((t.steps_completed ?? 0) / t.steps_total) * 100}%` }}
              />
            </div>
            <span className="text-xs text-slate-500">
              {t.steps_completed}/{t.steps_total}
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-600">—</span>
        ),
    },
    {
      key: 'cost',
      header: 'Cost',
      align: 'right',
      width: '80px',
      render: (t) =>
        t.cost_usd !== undefined ? (
          <span className="font-mono text-xs text-slate-400">${t.cost_usd.toFixed(4)}</span>
        ) : (
          <span className="text-slate-600">—</span>
        ),
    },
    {
      key: 'created',
      header: 'Created',
      align: 'right',
      width: '160px',
      render: (t) => (
        <span className="text-xs text-slate-500">{new Date(t.created_at).toLocaleString()}</span>
      ),
    },
  ]

  return (
    <Layout
      title="Tasks"
      headerActions={
        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => setNewTaskOpen(true)}
        >
          New Task
        </Button>
      }
    >
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="h-8 rounded-lg border border-slate-700 bg-navy-800 pl-8 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-electric-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          <div className="flex gap-1">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setStatusFilter(opt.value); setPage(1) }}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  statusFilter === opt.value
                    ? 'bg-electric-500/20 text-electric-400 border border-electric-500/30'
                    : 'text-slate-400 hover:bg-navy-800 hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={filtered}
        loading={loading}
        rowKey={(t) => t.id}
        onRowClick={(t) => navigate(`/tasks/${t.id}`)}
        emptyTitle="No tasks found"
        emptyDescription="Create a new task or adjust your filters"
      />

      {/* Pagination */}
      {data && data.total > 20 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
          <span>
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of {data.total}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button size="sm" variant="secondary" disabled={!data.has_next} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      <Modal
        open={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        title="New Task"
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setNewTaskOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              loading={createMutation.loading}
              disabled={!newTitle.trim()}
              onClick={handleCreate}
            >
              Create Task
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Title *</label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. Market research report for Q3"
              className="w-full rounded-lg border border-slate-700 bg-navy-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-electric-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Description</label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={3}
              placeholder="Optional details for the agent…"
              className="w-full resize-none rounded-lg border border-slate-700 bg-navy-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-electric-500 focus:outline-none"
            />
          </div>
          {createMutation.error && (
            <p className="text-xs text-rose-400">{createMutation.error}</p>
          )}
        </div>
      </Modal>
    </Layout>
  )
}

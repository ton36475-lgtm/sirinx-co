import { useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Table, type Column } from '@/components/Table'
import { ApprovalStatusBadge, RiskBadge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { ConfirmModal } from '@/components/Modal'
import { useApi, useMutation } from '@/hooks/useApi'
import { endpoints } from '@/api/client'
import type { Approval } from '@/types'

export function Approvals() {
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | ''>('pending')
  const [confirm, setConfirm] = useState<{
    id: string
    action: 'approve' | 'reject'
    title: string
  } | null>(null)
  const [note, setNote] = useState('')

  const { data, loading, refetch } = useApi(
    () => endpoints.approvals.list(statusFilter || undefined),
    [statusFilter],
  )

  const approveMutation = useMutation((vars: { id: string; note?: string }) =>
    endpoints.approvals.approve(vars.id, vars.note),
  )
  const rejectMutation = useMutation((vars: { id: string; note?: string }) =>
    endpoints.approvals.reject(vars.id, vars.note),
  )

  const approvals = data?.items ?? []

  async function handleConfirm() {
    if (!confirm) return
    if (confirm.action === 'approve') {
      await approveMutation.mutate({ id: confirm.id, note: note || undefined })
    } else {
      await rejectMutation.mutate({ id: confirm.id, note: note || undefined })
    }
    setConfirm(null)
    setNote('')
    refetch()
  }

  const pendingCount = approvals.filter((a) => a.status === 'pending').length

  const columns: Column<Approval>[] = [
    {
      key: 'task',
      header: 'Task',
      render: (a) => (
        <div>
          <p className="font-medium text-slate-200">{a.task_title}</p>
          <p className="mt-0.5 text-xs text-slate-500 max-w-xs truncate">{a.requested_action}</p>
        </div>
      ),
    },
    {
      key: 'risk',
      header: 'Risk',
      width: '110px',
      render: (a) => <RiskBadge level={a.risk_level} />,
    },
    {
      key: 'status',
      header: 'Status',
      width: '140px',
      render: (a) => <ApprovalStatusBadge status={a.status} />,
    },
    {
      key: 'requested_by',
      header: 'Requested By',
      width: '140px',
      render: (a) => (
        <span className="text-sm text-slate-400">{a.requested_by ?? 'System'}</span>
      ),
    },
    {
      key: 'time',
      header: 'Time',
      width: '140px',
      render: (a) => (
        <span className="text-xs text-slate-500">{new Date(a.created_at).toLocaleString()}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '140px',
      align: 'right',
      render: (a) =>
        a.status === 'pending' ? (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="success"
              size="xs"
              icon={<CheckCircle className="h-3 w-3" />}
              onClick={(e) => {
                e.stopPropagation()
                setConfirm({ id: a.id, action: 'approve', title: a.task_title })
              }}
            >
              Approve
            </Button>
            <Button
              variant="danger"
              size="xs"
              icon={<XCircle className="h-3 w-3" />}
              onClick={(e) => {
                e.stopPropagation()
                setConfirm({ id: a.id, action: 'reject', title: a.task_title })
              }}
            >
              Reject
            </Button>
          </div>
        ) : (
          <span className="text-xs text-slate-500">{a.reviewer_note ?? '—'}</span>
        ),
    },
  ]

  return (
    <Layout title="Approvals">
      {/* Stats bar */}
      {pendingCount > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <span className="text-sm text-amber-300">
            {pendingCount} approval{pendingCount !== 1 ? 's' : ''} require your attention
          </span>
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-4 flex gap-1">
        {(['pending', 'approved', 'rejected', ''] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-electric-500/20 text-electric-400 border border-electric-500/30'
                : 'text-slate-400 hover:bg-navy-800 hover:text-slate-200'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <Table
        columns={columns}
        data={approvals}
        loading={loading}
        rowKey={(a) => a.id}
        emptyTitle="No approvals"
        emptyDescription={
          statusFilter === 'pending'
            ? 'All caught up — no pending approvals'
            : 'No approvals match this filter'
        }
      />

      {/* Confirm Modal */}
      <ConfirmModal
        open={!!confirm}
        onClose={() => { setConfirm(null); setNote('') }}
        onConfirm={handleConfirm}
        title={confirm?.action === 'approve' ? 'Approve Task' : 'Reject Task'}
        description={confirm?.title}
        confirmLabel={confirm?.action === 'approve' ? 'Approve' : 'Reject'}
        danger={confirm?.action === 'reject'}
        loading={approveMutation.loading || rejectMutation.loading}
      />
    </Layout>
  )
}

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Table, type Column } from '@/components/Table'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { useApi } from '@/hooks/useApi'
import { endpoints } from '@/api/client'
import type { AuditEvent } from '@/types'

function ActionBadge({ action }: { action: string }) {
  const [ns, verb] = action.split('.')
  const color =
    verb === 'deleted' || verb === 'failed' || verb === 'cancelled'
      ? 'danger'
      : verb === 'created' || verb === 'approved'
      ? 'success'
      : verb === 'rejected'
      ? 'danger'
      : 'muted'
  return (
    <Badge variant={color as 'danger' | 'success' | 'muted'} size="sm">
      {action}
    </Badge>
  )
}

export function AuditLog() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, loading } = useApi(
    () => endpoints.audit.list({ page, page_size: 50 }),
    [page],
  )

  const events = (data?.items ?? []).filter((e) =>
    search
      ? e.action.includes(search) ||
        e.resource_type.includes(search) ||
        e.actor_email?.includes(search)
      : true,
  )

  const columns: Column<AuditEvent>[] = [
    {
      key: 'time',
      header: 'Time',
      width: '170px',
      render: (e) => (
        <span className="font-mono text-xs text-slate-400">
          {new Date(e.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      width: '220px',
      render: (e) => <ActionBadge action={e.action} />,
    },
    {
      key: 'resource',
      header: 'Resource',
      render: (e) => (
        <div>
          <span className="text-xs font-medium text-slate-300">{e.resource_type}</span>
          <span className="ml-1.5 font-mono text-xs text-slate-600">{e.resource_id.slice(0, 12)}…</span>
        </div>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      width: '180px',
      render: (e) => (
        <span className="text-xs text-slate-400">{e.actor_email ?? e.actor_id ?? 'System'}</span>
      ),
    },
    {
      key: 'ip',
      header: 'IP',
      width: '120px',
      render: (e) => (
        <span className="font-mono text-xs text-slate-600">{e.ip_address ?? '—'}</span>
      ),
    },
  ]

  return (
    <Layout title="Audit Log">
      {/* Search */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by action, resource, actor…"
            className="h-8 w-72 rounded-lg border border-slate-700 bg-navy-800 pl-8 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-electric-500 focus:outline-none"
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={events}
        loading={loading}
        rowKey={(e) => e.id}
        emptyTitle="No audit events"
        emptyDescription="Actions taken by users and agents will appear here"
      />

      {data && data.total > 50 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
          <span>
            {(page - 1) * 50 + 1}–{Math.min(page * 50, data.total)} of {data.total}
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
    </Layout>
  )
}

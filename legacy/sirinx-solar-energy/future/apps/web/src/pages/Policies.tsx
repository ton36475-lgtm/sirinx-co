import { useState } from 'react'
import { Plus, Shield, Edit2, Trash2 } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Modal, ConfirmModal } from '@/components/Modal'
import { EmptyState } from '@/components/EmptyState'
import { useApi, useMutation } from '@/hooks/useApi'
import { endpoints } from '@/api/client'
import type { Policy, PolicyEffect } from '@/types'

function PolicyCard({
  policy,
  onEdit,
  onDelete,
}: {
  policy: Policy
  onEdit: (p: Policy) => void
  onDelete: (p: Policy) => void
}) {
  return (
    <Card padding="md" className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              policy.effect === 'allow'
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-rose-500/10 text-rose-400'
            }`}
          >
            <Shield className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-200 truncate">{policy.name}</p>
            {policy.description && (
              <p className="text-xs text-slate-500 truncate">{policy.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge
            variant={policy.effect === 'allow' ? 'success' : 'danger'}
            size="sm"
          >
            {policy.effect.toUpperCase()}
          </Badge>
          <Badge variant={policy.is_active ? 'success' : 'muted'} size="sm" dot>
            {policy.is_active ? 'Active' : 'Off'}
          </Badge>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {policy.actions.map((action) => (
          <span
            key={action}
            className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-slate-400"
          >
            {action}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Priority: {policy.priority}</span>
        <div className="flex gap-1.5">
          <button
            onClick={() => onEdit(policy)}
            className="rounded p-1 hover:bg-slate-700 hover:text-slate-300 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(policy)}
            className="rounded p-1 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Card>
  )
}

interface FormState {
  name: string
  description: string
  effect: PolicyEffect
  actions: string
  priority: string
  is_active: boolean
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  effect: 'allow',
  actions: '',
  priority: '100',
  is_active: true,
}

export function Policies() {
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Policy | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Policy | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const { data: policies, loading, refetch } = useApi(() => endpoints.policies.list(), [])

  const createMutation = useMutation((data: Partial<Policy>) => endpoints.policies.create(data))
  const updateMutation = useMutation((vars: { id: string; data: Partial<Policy> }) =>
    endpoints.policies.update(vars.id, vars.data),
  )
  const deleteMutation = useMutation((id: string) => endpoints.policies.delete(id))

  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  function openEdit(p: Policy) {
    setEditTarget(p)
    setForm({
      name: p.name,
      description: p.description ?? '',
      effect: p.effect,
      actions: p.actions.join(', '),
      priority: String(p.priority),
      is_active: p.is_active,
    })
    setFormOpen(true)
  }

  async function handleSubmit() {
    const actions = form.actions.split(',').map((a) => a.trim()).filter(Boolean)
    const payload: Partial<Policy> = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      effect: form.effect,
      actions,
      priority: parseInt(form.priority, 10) || 100,
      is_active: form.is_active,
    }
    if (editTarget) {
      await updateMutation.mutate({ id: editTarget.id, data: payload })
    } else {
      await createMutation.mutate(payload)
    }
    setFormOpen(false)
    refetch()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteMutation.mutate(deleteTarget.id)
    setDeleteTarget(null)
    refetch()
  }

  return (
    <Layout
      title="Policies"
      headerActions={
        <Button variant="primary" size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={openCreate}>
          New Policy
        </Button>
      }
    >
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-navy-800" />)}
        </div>
      ) : (policies ?? []).length === 0 ? (
        <EmptyState
          title="No policies"
          description="Create policies to control what agents can and cannot do"
          action={
            <Button variant="primary" size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={openCreate}>
              New Policy
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(policies ?? []).map((p) => (
            <PolicyCard key={p.id} policy={p} onEdit={openEdit} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editTarget ? 'Edit Policy' : 'New Policy'}
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              loading={createMutation.loading || updateMutation.loading}
              disabled={!form.name.trim() || !form.actions.trim()}
              onClick={handleSubmit}
            >
              {editTarget ? 'Save' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-navy-900 px-3 py-2 text-sm text-slate-200 focus:border-electric-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-navy-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-electric-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Effect</label>
              <select
                value={form.effect}
                onChange={(e) => setForm((f) => ({ ...f, effect: e.target.value as PolicyEffect }))}
                className="w-full rounded-lg border border-slate-700 bg-navy-900 px-3 py-2 text-sm text-slate-200 focus:border-electric-500 focus:outline-none"
              >
                <option value="allow">Allow</option>
                <option value="deny">Deny</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Priority</label>
              <input
                type="number"
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-navy-900 px-3 py-2 text-sm text-slate-200 focus:border-electric-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">
              Actions * (comma-separated, e.g. tasks:create, web:search)
            </label>
            <input
              value={form.actions}
              onChange={(e) => setForm((f) => ({ ...f, actions: e.target.value }))}
              placeholder="tasks:create, web:search, files:write"
              className="w-full rounded-lg border border-slate-700 bg-navy-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-electric-500 focus:outline-none"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="rounded border-slate-600"
            />
            Active
          </label>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Policy"
        description={`"${deleteTarget?.name}" will be permanently removed.`}
        confirmLabel="Delete"
        danger
        loading={deleteMutation.loading}
      />
    </Layout>
  )
}

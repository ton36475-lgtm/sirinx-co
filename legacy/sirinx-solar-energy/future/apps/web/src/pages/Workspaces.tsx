import { useState } from 'react'
import { Plus, FolderOpen, Edit2, Trash2 } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Modal, ConfirmModal } from '@/components/Modal'
import { EmptyState } from '@/components/EmptyState'
import { useApi, useMutation } from '@/hooks/useApi'
import { useOrg } from '@/hooks/useOrg'
import { endpoints } from '@/api/client'
import type { Workspace } from '@/types'

export function Workspaces() {
  const { activeOrg } = useOrg()
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Workspace | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Workspace | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const { data: workspaces, loading, refetch } = useApi(
    () => (activeOrg ? endpoints.workspaces.list(activeOrg.id) : Promise.resolve([])),
    [activeOrg?.id],
  )

  const createMutation = useMutation((data: Partial<Workspace>) =>
    endpoints.workspaces.create(activeOrg!.id, data),
  )
  const updateMutation = useMutation((vars: { id: string; data: Partial<Workspace> }) =>
    endpoints.workspaces.update(activeOrg!.id, vars.id, vars.data),
  )
  const deleteMutation = useMutation((id: string) =>
    endpoints.workspaces.delete(activeOrg!.id, id),
  )

  function openCreate() {
    setEditTarget(null)
    setName('')
    setDescription('')
    setFormOpen(true)
  }

  function openEdit(ws: Workspace) {
    setEditTarget(ws)
    setName(ws.name)
    setDescription(ws.description ?? '')
    setFormOpen(true)
  }

  async function handleSubmit() {
    const payload = { name: name.trim(), description: description.trim() || undefined }
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
      title="Workspaces"
      headerActions={
        <Button variant="primary" size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={openCreate}>
          New Workspace
        </Button>
      }
    >
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-navy-800" />)}
        </div>
      ) : (workspaces ?? []).length === 0 ? (
        <EmptyState
          title="No workspaces"
          description="Create workspaces to organise tasks and agents"
          icon={<FolderOpen className="h-5 w-5" />}
          action={
            <Button variant="primary" size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={openCreate}>
              New Workspace
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(workspaces ?? []).map((ws) => (
            <Card key={ws.id} padding="md" className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                  <FolderOpen className="h-4 w-4 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-200 truncate">{ws.name}</p>
                  {ws.description && (
                    <p className="text-xs text-slate-500 truncate">{ws.description}</p>
                  )}
                </div>
                <Badge variant={ws.is_active ? 'success' : 'muted'} size="sm" dot>
                  {ws.is_active ? 'Active' : 'Off'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Created {new Date(ws.created_at).toLocaleDateString()}</span>
                <div className="flex gap-1.5">
                  <button onClick={() => openEdit(ws)} className="hover:text-slate-300 transition-colors">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(ws)} className="hover:text-rose-400 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editTarget ? 'Edit Workspace' : 'New Workspace'}
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              loading={createMutation.loading || updateMutation.loading}
              disabled={!name.trim()}
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-navy-900 px-3 py-2 text-sm text-slate-200 focus:border-electric-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-700 bg-navy-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-electric-500 focus:outline-none"
            />
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Workspace"
        description={`"${deleteTarget?.name}" and all its data will be permanently removed.`}
        confirmLabel="Delete"
        danger
        loading={deleteMutation.loading}
      />
    </Layout>
  )
}

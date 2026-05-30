import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, Tag } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { Modal, ConfirmModal } from '@/components/Modal'
import { EmptyState } from '@/components/EmptyState'
import { useApi, useMutation } from '@/hooks/useApi'
import { endpoints } from '@/api/client'
import type { BrainEntry, BrainCategory } from '@/types'

const CATEGORIES: { value: BrainCategory | ''; label: string; color: string }[] = [
  { value: '', label: 'All', color: '' },
  { value: 'doctrine', label: 'Doctrine', color: 'info' },
  { value: 'template', label: 'Templates', color: 'success' },
  { value: 'knowledge', label: 'Knowledge', color: 'warning' },
  { value: 'research_standard', label: 'Research Standards', color: 'default' },
]

function EntryCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: BrainEntry
  onEdit: (e: BrainEntry) => void
  onDelete: (e: BrainEntry) => void
}) {
  const cat = CATEGORIES.find((c) => c.value === entry.category)
  return (
    <Card padding="md" className="flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-slate-200 truncate">{entry.title}</h3>
            {cat && cat.value && (
              <Badge variant={cat.color as 'info' | 'success' | 'warning' | 'default'} size="sm">
                {cat.label}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400 line-clamp-3">{entry.content}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => onEdit(entry)}
            className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-300 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(entry)}
            className="rounded p-1 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400"
            >
              <Tag className="h-2.5 w-2.5" />
              {tag}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-600">
        Updated {new Date(entry.updated_at).toLocaleDateString()}
      </p>
    </Card>
  )
}

interface EntryFormState {
  title: string
  content: string
  category: BrainCategory
  tags: string
}

const EMPTY_FORM: EntryFormState = {
  title: '',
  content: '',
  category: 'knowledge',
  tags: '',
}

export function Brain() {
  const [category, setCategory] = useState<BrainCategory | ''>('')
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<BrainEntry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BrainEntry | null>(null)
  const [form, setForm] = useState<EntryFormState>(EMPTY_FORM)

  const { data: entries, loading, refetch } = useApi(
    () => endpoints.brain.list({ category: category || undefined }),
    [category],
  )

  const createMutation = useMutation((data: Partial<BrainEntry>) =>
    endpoints.brain.create(data),
  )
  const updateMutation = useMutation(
    (vars: { id: string; data: Partial<BrainEntry> }) =>
      endpoints.brain.update(vars.id, vars.data),
  )
  const deleteMutation = useMutation((id: string) => endpoints.brain.delete(id))

  const filtered = (entries ?? []).filter((e) =>
    search
      ? e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.content.toLowerCase().includes(search.toLowerCase())
      : true,
  )

  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  function openEdit(entry: BrainEntry) {
    setEditTarget(entry)
    setForm({
      title: entry.title,
      content: entry.content,
      category: entry.category,
      tags: entry.tags.join(', '),
    })
    setFormOpen(true)
  }

  async function handleSubmit() {
    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const payload: Partial<BrainEntry> = {
      title: form.title.trim(),
      content: form.content.trim(),
      category: form.category,
      tags,
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
      title="Company Brain"
      headerActions={
        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="h-3.5 w-3.5" />}
          onClick={openCreate}
        >
          Add Entry
        </Button>
      }
    >
      {/* Search + Category filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brain entries…"
            className="h-8 rounded-lg border border-slate-700 bg-navy-800 pl-8 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-electric-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                category === c.value
                  ? 'bg-electric-500/20 text-electric-400 border border-electric-500/30'
                  : 'text-slate-400 hover:bg-navy-800 hover:text-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-navy-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No brain entries"
          description="Add doctrine, templates, or knowledge to help agents make better decisions"
          action={
            <Button variant="primary" size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={openCreate}>
              Add Entry
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <EntryCard key={e.id} entry={e} onEdit={openEdit} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editTarget ? 'Edit Entry' : 'New Brain Entry'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              loading={createMutation.loading || updateMutation.loading}
              disabled={!form.title.trim() || !form.content.trim()}
              onClick={handleSubmit}
            >
              {editTarget ? 'Save Changes' : 'Create Entry'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-navy-900 px-3 py-2 text-sm text-slate-200 focus:border-electric-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as BrainCategory }))}
                className="w-full rounded-lg border border-slate-700 bg-navy-900 px-3 py-2 text-sm text-slate-200 focus:border-electric-500 focus:outline-none"
              >
                <option value="doctrine">Doctrine</option>
                <option value="template">Template</option>
                <option value="knowledge">Knowledge</option>
                <option value="research_standard">Research Standard</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Tags (comma-separated)</label>
              <input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="e.g. strategy, sales, Q3"
                className="w-full rounded-lg border border-slate-700 bg-navy-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-electric-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Content *</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={6}
              placeholder="Enter content (Markdown supported)…"
              className="w-full resize-y rounded-lg border border-slate-700 bg-navy-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-electric-500 focus:outline-none font-mono"
            />
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Entry"
        description={`"${deleteTarget?.title}" will be permanently removed.`}
        confirmLabel="Delete"
        danger
        loading={deleteMutation.loading}
      />
    </Layout>
  )
}

import { useState } from 'react'
import { Plus, Building2, Edit2 } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Modal } from '@/components/Modal'
import { EmptyState } from '@/components/EmptyState'
import { useOrg } from '@/hooks/useOrg'

export function Orgs() {
  const { orgs, loading, activeOrg, switchOrg } = useOrg()
  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')

  return (
    <Layout
      title="Organisations"
      headerActions={
        <Button variant="primary" size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setAddOpen(true)}>
          New Org
        </Button>
      }
    >
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-navy-800" />)}
        </div>
      ) : orgs.length === 0 ? (
        <EmptyState
          title="No organisations"
          description="Create your first organisation to get started"
          icon={<Building2 className="h-5 w-5" />}
          action={
            <Button variant="primary" size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setAddOpen(true)}>
              New Org
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org) => (
            <Card
              key={org.id}
              padding="md"
              className={`flex flex-col gap-3 ${activeOrg?.id === org.id ? 'border-electric-500/40' : ''}`}
              hover
              onClick={() => switchOrg(org)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-electric-500/10 text-lg font-bold text-electric-400">
                  {org.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-200 truncate">{org.name}</p>
                  <p className="text-xs text-slate-500">{org.slug}</p>
                </div>
                {activeOrg?.id === org.id && (
                  <span className="text-xs text-electric-400 font-medium">Active</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Created {new Date(org.created_at).toLocaleDateString()}</span>
                <button className="hover:text-slate-300 transition-colors">
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="New Organisation"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!name.trim() || !slug.trim()}
              onClick={() => setAddOpen(false)}
            >
              Create
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Organisation Name *</label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
              }}
              className="w-full rounded-lg border border-slate-700 bg-navy-900 px-3 py-2 text-sm text-slate-200 focus:border-electric-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Slug *</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-navy-900 px-3 py-2 font-mono text-sm text-slate-200 focus:border-electric-500 focus:outline-none"
            />
          </div>
        </div>
      </Modal>
    </Layout>
  )
}

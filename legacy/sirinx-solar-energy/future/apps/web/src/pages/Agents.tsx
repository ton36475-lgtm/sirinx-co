import { useState } from 'react'
import { Plus, Bot, ChevronDown, ChevronRight, Cpu } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { useApi } from '@/hooks/useApi'
import { endpoints } from '@/api/client'
import type { AgentPack, Agent } from '@/types'

function AgentRow({ agent }: { agent: Agent }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-navy-900 px-3 py-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-electric-500/10">
        <Cpu className="h-3.5 w-3.5 text-electric-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">{agent.name}</p>
        <p className="text-xs text-slate-500 truncate">{agent.role}</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="muted" size="sm">{agent.model}</Badge>
        <Badge variant={agent.is_active ? 'success' : 'muted'} size="sm" dot>
          {agent.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>
    </div>
  )
}

function PackCard({ pack }: { pack: AgentPack }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card padding="none" className="overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-navy-700 transition-colors"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-electric-500/10">
          <Bot className="h-4 w-4 text-electric-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-200 truncate">{pack.name}</p>
          {pack.description && (
            <p className="text-xs text-slate-500 truncate">{pack.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={pack.is_active ? 'success' : 'muted'} size="sm" dot>
            {pack.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <span className="text-xs text-slate-500">{pack.agents.length} agents</span>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-500" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-800 px-4 pb-4 pt-3">
          {pack.agents.length === 0 ? (
            <p className="text-xs text-slate-500">No agents in this pack.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {pack.agents.map((agent) => (
                <AgentRow key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export function Agents() {
  const { data: packs, loading } = useApi(() => endpoints.packs.list(), [])

  const activePacks = (packs ?? []).filter((p) => p.is_active).length
  const totalAgents = (packs ?? []).reduce((sum, p) => sum + p.agents.length, 0)
  const activeAgents = (packs ?? [])
    .flatMap((p) => p.agents)
    .filter((a) => a.is_active).length

  return (
    <Layout
      title="Agents & Packs"
      headerActions={
        <Button variant="primary" size="sm" icon={<Plus className="h-3.5 w-3.5" />}>
          New Pack
        </Button>
      }
    >
      {/* Stats */}
      <div className="mb-5 flex gap-4">
        <div className="rounded-lg border border-slate-800 bg-navy-800 px-4 py-2.5 text-center">
          <p className="text-xl font-bold text-electric-400">{(packs ?? []).length}</p>
          <p className="text-xs text-slate-500">Total Packs</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-navy-800 px-4 py-2.5 text-center">
          <p className="text-xl font-bold text-emerald-400">{activePacks}</p>
          <p className="text-xs text-slate-500">Active Packs</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-navy-800 px-4 py-2.5 text-center">
          <p className="text-xl font-bold text-slate-200">{totalAgents}</p>
          <p className="text-xs text-slate-500">Total Agents</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-navy-800 px-4 py-2.5 text-center">
          <p className="text-xl font-bold text-emerald-400">{activeAgents}</p>
          <p className="text-xs text-slate-500">Active Agents</p>
        </div>
      </div>

      {/* Pack List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-navy-800" />
          ))}
        </div>
      ) : (packs ?? []).length === 0 ? (
        <EmptyState
          title="No agent packs"
          description="Create your first pack to start automating tasks"
          action={
            <Button variant="primary" size="sm" icon={<Plus className="h-3.5 w-3.5" />}>
              New Pack
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {(packs ?? []).map((pack) => (
            <PackCard key={pack.id} pack={pack} />
          ))}
        </div>
      )}
    </Layout>
  )
}

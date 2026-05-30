import { useState } from 'react'
import { Plus, Cloud, Check, Zap } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { useApi } from '@/hooks/useApi'
import { endpoints } from '@/api/client'
import type { Provider } from '@/types'

const PROVIDER_ICONS: Record<string, string> = {
  openai: '🤖',
  anthropic: '⚡',
  google: '🔍',
  azure: '☁️',
  custom: '🔧',
}

function ProviderCard({ provider }: { provider: Provider }) {
  return (
    <Card padding="md" className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-xl">
          {PROVIDER_ICONS[provider.type] ?? '🤖'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-200 truncate">{provider.name}</p>
            {provider.is_active && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
          </div>
          <p className="text-xs text-slate-500 capitalize">{provider.type}</p>
        </div>
        <Badge variant={provider.is_active ? 'success' : 'muted'} size="sm" dot>
          {provider.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {provider.base_url && (
        <div className="text-xs text-slate-500 truncate border-t border-slate-800 pt-3">
          {provider.base_url}
        </div>
      )}

      {/* Models */}
      <div>
        <p className="text-xs font-medium text-slate-400 mb-2">Models ({provider.models.length})</p>
        <div className="flex flex-col gap-1.5">
          {provider.models.slice(0, 4).map((m) => (
            <div key={m.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <Zap className="h-3 w-3 text-electric-400 shrink-0" />
                <span className="text-slate-300 truncate">{m.display_name}</span>
                {m.is_default && (
                  <Badge variant="info" size="sm">default</Badge>
                )}
              </div>
              <span className="text-slate-500 shrink-0 ml-2">
                ${m.input_price_per_1k.toFixed(3)}/$1k
              </span>
            </div>
          ))}
          {provider.models.length > 4 && (
            <p className="text-xs text-slate-600">+{provider.models.length - 4} more</p>
          )}
        </div>
      </div>
    </Card>
  )
}

export function Providers() {
  const { data: providers, loading } = useApi(() => endpoints.providers.list(), [])
  const [_addOpen, setAddOpen] = useState(false)

  return (
    <Layout
      title="AI Providers"
      headerActions={
        <Button variant="primary" size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setAddOpen(true)}>
          Add Provider
        </Button>
      }
    >
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-52 animate-pulse rounded-xl bg-navy-800" />)}
        </div>
      ) : (providers ?? []).length === 0 ? (
        <EmptyState
          title="No providers configured"
          description="Add an AI provider to start running agents"
          action={
            <Button variant="primary" size="sm" icon={<Plus className="h-3.5 w-3.5" />}>
              Add Provider
            </Button>
          }
          icon={<Cloud className="h-5 w-5" />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(providers ?? []).map((p) => (
            <ProviderCard key={p.id} provider={p} />
          ))}
        </div>
      )}
    </Layout>
  )
}

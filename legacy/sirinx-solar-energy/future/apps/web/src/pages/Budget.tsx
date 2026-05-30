import { Layout } from '@/components/Layout'
import { Card, KpiCard } from '@/components/Card'
import { useApi } from '@/hooks/useApi'
import { endpoints } from '@/api/client'
import { DollarSign, TrendingUp, Zap, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="h-2 w-full rounded-full bg-slate-800">
      <div
        className={clsx('h-2 rounded-full transition-all', color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function Budget() {
  const { data: config } = useApi(() => endpoints.budget.config(), [])
  const { data: usage, loading } = useApi(() => endpoints.budget.usage(), [])

  const pctUsed = config && usage
    ? (usage.total_usd / config.monthly_limit_usd) * 100
    : 0

  const barColor =
    pctUsed >= 90
      ? 'bg-rose-500'
      : pctUsed >= 75
      ? 'bg-amber-500'
      : 'bg-emerald-500'

  const byDay = usage?.by_day ?? []

  return (
    <Layout title="Budget">
      {/* KPI Row */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          title="Monthly Limit"
          value={config ? `$${config.monthly_limit_usd.toFixed(0)}` : '—'}
          icon={<DollarSign className="h-4 w-4" />}
          iconColor="bg-electric-500/10 text-electric-400"
        />
        <KpiCard
          title="Used This Month"
          value={usage ? `$${usage.total_usd.toFixed(2)}` : '—'}
          change={`${pctUsed.toFixed(1)}% of limit`}
          changePositive={pctUsed < 80}
          icon={<TrendingUp className="h-4 w-4" />}
          iconColor="bg-amber-500/10 text-amber-400"
        />
        <KpiCard
          title="Total Tokens"
          value={usage ? usage.token_count.toLocaleString() : '—'}
          icon={<Zap className="h-4 w-4" />}
          iconColor="bg-emerald-500/10 text-emerald-400"
        />
        <KpiCard
          title="Tasks Run"
          value={usage ? usage.task_count : '—'}
          icon={<TrendingUp className="h-4 w-4" />}
          iconColor="bg-rose-500/10 text-rose-400"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Usage Meter */}
        <Card padding="lg">
          <h3 className="mb-4 text-sm font-semibold text-slate-200">Monthly Budget Usage</h3>
          {pctUsed >= (config?.alert_threshold_pct ?? 80) && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Budget alert: {pctUsed.toFixed(1)}% used
            </div>
          )}
          <div className="flex items-end justify-between text-xs text-slate-500 mb-1">
            <span>${usage?.total_usd.toFixed(2) ?? '0.00'}</span>
            <span>${config?.monthly_limit_usd.toFixed(0) ?? '—'}</span>
          </div>
          <ProgressBar value={usage?.total_usd ?? 0} max={config?.monthly_limit_usd ?? 100} color={barColor} />
          <p className="mt-2 text-xs text-slate-500">{pctUsed.toFixed(1)}% of monthly budget used</p>

          {config?.daily_limit_usd && (
            <div className="mt-4">
              <div className="flex items-end justify-between text-xs text-slate-500 mb-1">
                <span>Daily limit: ${config.daily_limit_usd}</span>
                <span>Today: ${usage?.by_day.at(-1)?.total_usd.toFixed(2) ?? '0.00'}</span>
              </div>
              <ProgressBar
                value={usage?.by_day.at(-1)?.total_usd ?? 0}
                max={config.daily_limit_usd}
                color="bg-electric-500"
              />
            </div>
          )}
        </Card>

        {/* By Workspace */}
        <Card padding="lg">
          <h3 className="mb-4 text-sm font-semibold text-slate-200">By Workspace</h3>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 animate-pulse rounded-lg bg-navy-900" />
              ))}
            </div>
          ) : (usage?.by_workspace ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">No workspace data yet.</p>
          ) : (
            <div className="space-y-3">
              {(usage?.by_workspace ?? []).map((ws) => {
                const wsPct = config
                  ? (ws.total_usd / config.monthly_limit_usd) * 100
                  : 0
                return (
                  <div key={ws.workspace_id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 truncate max-w-[60%]">{ws.workspace_name}</span>
                      <span className="text-slate-400">
                        ${ws.total_usd.toFixed(2)} · {ws.task_count} tasks
                      </span>
                    </div>
                    <ProgressBar value={ws.total_usd} max={config?.monthly_limit_usd ?? 100} color="bg-electric-500" />
                    <p className="text-xs text-slate-600 mt-0.5">{wsPct.toFixed(1)}% of budget</p>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Daily Spend Chart (simple bar) */}
        <Card padding="lg" className="lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-slate-200">Daily Spend (last 30 days)</h3>
          {byDay.length === 0 ? (
            <p className="text-sm text-slate-500">No daily data yet.</p>
          ) : (
            <div className="flex items-end gap-1 h-28">
              {byDay.slice(-30).map((d) => {
                const maxVal = Math.max(...byDay.map((x) => x.total_usd), 0.01)
                const h = (d.total_usd / maxVal) * 100
                return (
                  <div
                    key={d.date}
                    className="flex-1 group relative"
                    title={`${d.date}: $${d.total_usd.toFixed(4)}`}
                  >
                    <div
                      className="w-full rounded-t bg-electric-500/60 group-hover:bg-electric-500 transition-colors"
                      style={{ height: `${Math.max(h, 2)}%` }}
                    />
                  </div>
                )
              })}
            </div>
          )}
          <div className="mt-1 flex justify-between text-xs text-slate-600">
            <span>{byDay[0]?.date ?? ''}</span>
            <span>{byDay.at(-1)?.date ?? ''}</span>
          </div>
        </Card>
      </div>
    </Layout>
  )
}

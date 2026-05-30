'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { EarningsRecord } from '@/types'

interface EarningsChartProps {
  records: EarningsRecord[]
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#0A2342] border border-white/20 rounded-xl px-3 py-2">
        <p className="text-white/60 text-xs">{label}</p>
        <p className="text-[#F5A623] font-bold text-sm">฿{payload[0].value.toLocaleString()}</p>
      </div>
    )
  }
  return null
}

export default function EarningsChart({ records }: EarningsChartProps) {
  const data = records.map((r) => ({
    date: r.date.slice(5), // MM-DD
    amount: r.amount,
    jobs: r.jobs,
  }))

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="date"
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar dataKey="amount" fill="#F5A623" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

'use client'

import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import type { ProductionDay, ProductionMonth, ProductionYear } from '@/types'

interface DailyProps {
  type: 'daily'
  data: ProductionDay[]
}
interface MonthlyProps {
  type: 'monthly'
  data: ProductionMonth[]
}
interface YearlyProps {
  type: 'yearly'
  data: ProductionYear[]
}
type Props = DailyProps | MonthlyProps | YearlyProps

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number; name: string }>
  label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0A2342] border border-white/20 rounded-xl p-3 shadow-xl">
      <p className="text-white/60 text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-[#F5A623] font-semibold text-sm">
          {p.value.toLocaleString('th-TH')} {p.name}
        </p>
      ))}
    </div>
  )
}

export default function ProductionChart(props: Props) {
  if (props.type === 'daily') {
    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={props.data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="date"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
            tickLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="kwh"
            name="kWh"
            fill="#F5A623"
            radius={[4, 4, 0, 0]}
            fillOpacity={0.85}
          />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  if (props.type === 'monthly') {
    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={props.data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="month"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="kwh"
            name="kWh"
            fill="#F5A623"
            radius={[4, 4, 0, 0]}
            fillOpacity={0.85}
          />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  // yearly
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={props.data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="year"
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="kwh"
          name="kWh"
          fill="#10B981"
          radius={[4, 4, 0, 0]}
          fillOpacity={0.85}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

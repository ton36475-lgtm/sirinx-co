'use client'

import { useState } from 'react'
import { Leaf, Zap, TrendingUp, TreePine } from 'lucide-react'
import { useCustomer } from '@/hooks/useCustomer'
import ProductionChart from '@/components/ProductionChart'

type Period = 'daily' | 'monthly' | 'yearly'

export default function ProductionPage() {
  const { savings, dailyProduction, monthlyProduction, yearlyProduction } = useCustomer()
  const [period, setPeriod] = useState<Period>('daily')

  const tabs: { key: Period; label: string }[] = [
    { key: 'daily', label: 'รายวัน' },
    { key: 'monthly', label: 'รายเดือน' },
    { key: 'yearly', label: 'รายปี' },
  ]

  const totalKwh = period === 'daily'
    ? savings.monthKwh
    : period === 'monthly'
    ? savings.yearKwh
    : savings.lifetimeKwh

  const label = period === 'daily' ? 'เดือนนี้' : period === 'monthly' ? 'ปีนี้' : 'ทั้งหมด'

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-white font-bold text-xl">ผลการผลิตไฟฟ้า</h1>
        <p className="text-white/50 text-sm mt-0.5">ข้อมูลการผลิตพลังงานจากระบบ Solar ของคุณ</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/6 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-[#F5A623]" />
            <p className="text-white/50 text-xs">วันนี้</p>
          </div>
          <p className="text-white font-bold text-2xl">{savings.todayKwh.toFixed(1)}</p>
          <p className="text-white/40 text-xs">kWh</p>
        </div>

        <div className="bg-white/6 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-[#10B981]" />
            <p className="text-white/50 text-xs">เดือนนี้</p>
          </div>
          <p className="text-[#10B981] font-bold text-2xl">{savings.monthKwh.toLocaleString('th-TH')}</p>
          <p className="text-white/40 text-xs">kWh</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        {/* Period Tabs */}
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 mb-4">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === key
                  ? 'bg-[#F5A623] text-[#0A2342]'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Total for period */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-white font-bold text-2xl">{totalKwh.toLocaleString('th-TH')}</span>
          <span className="text-white/50 text-sm">kWh {label}</span>
        </div>

        {/* Chart */}
        {period === 'daily' && <ProductionChart type="daily" data={dailyProduction} />}
        {period === 'monthly' && <ProductionChart type="monthly" data={monthlyProduction} />}
        {period === 'yearly' && <ProductionChart type="yearly" data={yearlyProduction} />}
      </div>

      {/* CO2 + Environment */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <p className="text-white/50 text-xs font-medium uppercase tracking-wide mb-3">ผลต่อสิ่งแวดล้อม</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#10B981]/15 flex items-center justify-center flex-shrink-0">
              <Leaf size={16} className="text-[#10B981]" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">
                {(savings.co2ReducedKg / 1000).toFixed(1)}
                <span className="text-white/50 text-xs font-normal ml-1">ตัน</span>
              </p>
              <p className="text-white/40 text-xs">CO₂ ลดได้</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#10B981]/15 flex items-center justify-center flex-shrink-0">
              <TreePine size={16} className="text-[#10B981]" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">
                {savings.treesEquivalent.toLocaleString('th-TH')}
                <span className="text-white/50 text-xs font-normal ml-1">ต้น</span>
              </p>
              <p className="text-white/40 text-xs">เทียบเท่าปลูกต้นไม้</p>
            </div>
          </div>
        </div>
      </div>

      {/* Savings breakdown */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <p className="text-white/50 text-xs font-medium uppercase tracking-wide mb-3">เงินที่ประหยัดได้</p>
        <div className="space-y-2.5">
          {[
            { label: 'วันนี้', value: `฿${savings.todaySavings.toLocaleString('th-TH')}` },
            { label: 'เดือนนี้', value: `฿${savings.monthSavings.toLocaleString('th-TH')}`, highlight: true },
            { label: 'ปีนี้', value: `฿${savings.yearSavings.toLocaleString('th-TH')}` },
            { label: 'ทั้งหมด', value: `฿${savings.lifetimeSavings.toLocaleString('th-TH')}`, highlight: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <p className="text-white/50 text-sm">{item.label}</p>
              <p className={`font-semibold text-sm ${item.highlight ? 'text-[#F5A623]' : 'text-white'}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

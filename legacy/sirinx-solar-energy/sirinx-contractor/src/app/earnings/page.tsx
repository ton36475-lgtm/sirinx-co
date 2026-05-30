'use client'

import { useState } from 'react'
import { TrendingUp, Wallet, ArrowDownCircle, Calendar } from 'lucide-react'
import { useEarnings } from '@/hooks/useContractor'
import EarningsChart from '@/components/EarningsChart'

export default function EarningsPage() {
  const { records, thisMonth, today } = useEarnings()
  const [withdrawAmount, setWithdrawAmount] = useState('')

  const totalJobs = records.reduce((s, r) => s + r.jobs, 0)
  const avgPerJob = totalJobs > 0 ? Math.round(thisMonth / totalJobs) : 0

  return (
    <div className="min-h-dvh px-4 pt-12 pb-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <TrendingUp size={24} className="text-[#F5A623]" />
        <h1 className="text-white font-bold text-xl">รายได้</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-b from-[#10B981]/20 to-[#10B981]/5 border border-[#10B981]/30 rounded-2xl p-4">
          <p className="text-[#10B981]/70 text-xs mb-1">รายได้เดือนนี้</p>
          <p className="text-[#10B981] font-bold text-2xl">฿{thisMonth.toLocaleString()}</p>
          <p className="text-white/40 text-xs mt-1">{totalJobs} งาน</p>
        </div>
        <div className="bg-white/8 border border-white/12 rounded-2xl p-4">
          <p className="text-white/50 text-xs mb-1">วันนี้</p>
          <p className="text-white font-bold text-2xl">฿{today.toLocaleString()}</p>
          <p className="text-white/40 text-xs mt-1">เฉลี่ย ฿{avgPerJob.toLocaleString()}/งาน</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white/8 border border-white/12 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-white/50" />
          <p className="text-white font-medium">7 วันที่ผ่านมา</p>
        </div>
        <EarningsChart records={records} />
      </div>

      {/* Daily breakdown */}
      <div className="bg-white/8 border border-white/12 rounded-2xl p-4">
        <p className="text-white font-medium mb-4">รายละเอียดรายวัน</p>
        <div className="space-y-2">
          {[...records].reverse().map((r) => (
            <div key={r.date} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div>
                <p className="text-white text-sm">{r.date}</p>
                <p className="text-white/40 text-xs">{r.jobs} งาน</p>
              </div>
              <p className={`font-semibold ${r.amount > 0 ? 'text-[#10B981]' : 'text-white/30'}`}>
                {r.amount > 0 ? `฿${r.amount.toLocaleString()}` : '-'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Withdraw */}
      <div className="bg-white/8 border border-white/12 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Wallet size={18} className="text-[#F5A623]" />
          <p className="text-white font-medium">ถอนเงิน</p>
        </div>
        <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
          <p className="text-white/50 text-sm">ยอดคงเหลือ</p>
          <p className="text-[#F5A623] font-bold">฿{thisMonth.toLocaleString()}</p>
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">฿</span>
          <input
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="ระบุจำนวนเงิน"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#F5A623]/50"
          />
        </div>
        <button className="w-full flex items-center justify-center gap-2 bg-[#F5A623] text-[#0A2342] font-bold py-4 rounded-2xl active:bg-amber-400 transition-colors">
          <ArrowDownCircle size={20} />
          ถอนเงิน
        </button>
        <p className="text-white/30 text-xs text-center">โอนเข้าบัญชีภายใน 1-2 วันทำการ</p>
      </div>
    </div>
  )
}

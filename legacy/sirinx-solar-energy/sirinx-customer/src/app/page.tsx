'use client'

import Link from 'next/link'
import { Sun, TrendingUp, Leaf, HeadphonesIcon, FileText, Bell, Zap } from 'lucide-react'
import { useCustomer } from '@/hooks/useCustomer'
import StatusCard from '@/components/StatusCard'
import SavingsCounter from '@/components/SavingsCounter'

export default function DashboardPage() {
  const { customer, savings, usingMock } = useCustomer()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'อรุณสวัสดิ์' : hour < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น'

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/50 text-sm">{greeting} 👋</p>
          <h1 className="text-white font-bold text-xl">{customer.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          {usingMock && (
            <span className="text-[10px] bg-[#F5A623]/20 text-[#F5A623] px-2 py-1 rounded-full">
              ข้อมูลตัวอย่าง
            </span>
          )}
          <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Bell size={18} className="text-white/60" />
          </button>
        </div>
      </div>

      {/* Status Card */}
      <StatusCard
        status={customer.installationStatus}
        installationDate={customer.installationDate}
        contractNumber={customer.contractNumber}
        systemSize={customer.systemSize}
      />

      {/* Today Production */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/6 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#F5A623]/15 flex items-center justify-center">
              <Sun size={16} className="text-[#F5A623]" />
            </div>
            <p className="text-white/50 text-xs">ผลิตได้วันนี้</p>
          </div>
          <p className="text-white font-bold text-2xl">
            {savings.todayKwh.toFixed(1)}
          </p>
          <p className="text-white/40 text-xs mt-0.5">kWh</p>
        </div>

        <div className="bg-white/6 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#10B981]/15 flex items-center justify-center">
              <TrendingUp size={16} className="text-[#10B981]" />
            </div>
            <p className="text-white/50 text-xs">ประหยัดเดือนนี้</p>
          </div>
          <p className="text-[#10B981] font-bold text-2xl">
            ฿{savings.monthSavings.toLocaleString('th-TH')}
          </p>
          <p className="text-white/40 text-xs mt-0.5">บาท</p>
        </div>
      </div>

      {/* Lifetime Savings Counter */}
      <div
        className="rounded-2xl p-5 text-center"
        style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.15) 0%, rgba(16,185,129,0.15) 100%)', border: '1px solid rgba(245,166,35,0.25)' }}
      >
        <p className="text-white/60 text-sm mb-1">ประหยัดเงินสะสมทั้งหมด</p>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-white/60 text-lg font-medium">฿</span>
          <SavingsCounter
            target={savings.lifetimeSavings}
            className="text-[#F5A623] font-bold text-4xl"
            duration={2000}
          />
        </div>
        <p className="text-white/40 text-xs mt-1">ตั้งแต่ติดตั้งระบบ</p>

        <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-white/10">
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Leaf size={12} className="text-[#10B981]" />
              <p className="text-[#10B981] font-semibold text-sm">
                {(savings.co2ReducedKg / 1000).toFixed(1)} ตัน
              </p>
            </div>
            <p className="text-white/30 text-xs">CO₂ ลดได้</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <p className="text-[#10B981] font-semibold text-sm">
              {savings.treesEquivalent.toLocaleString('th-TH')} ต้น
            </p>
            <p className="text-white/30 text-xs">เทียบเท่าปลูกต้นไม้</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-white/50 text-xs font-medium uppercase tracking-wide mb-3">ทางลัด</p>
        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/production"
            className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center gap-2 hover:bg-white/8 transition-colors active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F5A623]/15 flex items-center justify-center">
              <Zap size={20} className="text-[#F5A623]" />
            </div>
            <p className="text-white/70 text-xs text-center">ดูผลผลิต</p>
          </Link>

          <Link
            href="/support/new"
            className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center gap-2 hover:bg-white/8 transition-colors active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-400/15 flex items-center justify-center">
              <HeadphonesIcon size={20} className="text-blue-400" />
            </div>
            <p className="text-white/70 text-xs text-center">แจ้งปัญหา</p>
          </Link>

          <Link
            href="/billing"
            className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center gap-2 hover:bg-white/8 transition-colors active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-400/15 flex items-center justify-center">
              <FileText size={20} className="text-purple-400" />
            </div>
            <p className="text-white/70 text-xs text-center">ใบแจ้งหนี้</p>
          </Link>
        </div>
      </div>

      {/* System summary */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <p className="text-white/50 text-xs font-medium mb-3">สรุประบบ</p>
        <div className="space-y-2">
          {[
            { label: 'ผลิตเดือนนี้', value: `${savings.monthKwh.toLocaleString('th-TH')} kWh` },
            { label: 'ผลิตปีนี้', value: `${savings.yearKwh.toLocaleString('th-TH')} kWh` },
            { label: 'ประหยัดปีนี้', value: `฿${savings.yearSavings.toLocaleString('th-TH')}` },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <p className="text-white/50 text-sm">{item.label}</p>
              <p className="text-white font-semibold text-sm">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

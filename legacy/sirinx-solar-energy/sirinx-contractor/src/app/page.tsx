'use client'

import Link from 'next/link'
import { Zap, Plus, Camera, RefreshCw, Bell, Star, TrendingUp, Clock } from 'lucide-react'
import { useContractor } from '@/hooks/useContractor'
import JobCard from '@/components/JobCard'

export default function DashboardPage() {
  const { contractor, todayJobs, pendingJobs } = useContractor()

  const todayEarnings = todayJobs
    .filter((j) => j.status === 'completed')
    .reduce((s, j) => s + j.payment_amount, 0)

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#0A2342] via-[#0d2d55] to-[#0A2342] px-4 pt-12 pb-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/50 text-sm">สวัสดี 👋</p>
          <h1 className="text-white font-bold text-xl leading-tight mt-0.5">{contractor.name}</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <Star size={13} className="text-[#F5A623] fill-[#F5A623]" />
            <span className="text-white/70 text-sm">{contractor.rating}</span>
            <span className="text-white/30 text-xs">|</span>
            <span className="text-white/50 text-xs">{contractor.cert_level}</span>
          </div>
        </div>
        <button className="relative w-11 h-11 rounded-full bg-white/8 border border-white/12 flex items-center justify-center">
          <Bell size={20} className="text-white/70" />
          {pendingJobs.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#F5A623] rounded-full text-[10px] font-bold text-[#0A2342] flex items-center justify-center">
              {pendingJobs.length}
            </span>
          )}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/8 border border-white/12 rounded-2xl p-4">
          <p className="text-white/50 text-xs mb-1">งานวันนี้</p>
          <p className="text-white font-bold text-3xl">{todayJobs.length}</p>
          <p className="text-white/40 text-xs mt-1">งาน</p>
        </div>
        <div className="bg-white/8 border border-white/12 rounded-2xl p-4">
          <p className="text-white/50 text-xs mb-1">รายได้วันนี้</p>
          <p className="text-[#10B981] font-bold text-2xl">฿{todayEarnings.toLocaleString()}</p>
          <p className="text-white/40 text-xs mt-1">บาท</p>
        </div>
      </div>

      {/* KPI banner */}
      <div className="bg-gradient-to-r from-[#F5A623]/20 to-[#F5A623]/5 border border-[#F5A623]/30 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#F5A623] text-xs font-medium mb-0.5">รายได้เดือนนี้</p>
            <p className="text-white font-bold text-2xl">
              ฿{contractor.total_earnings.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/50 text-xs mb-0.5">งานทั้งหมด</p>
            <p className="text-white font-bold text-xl">{contractor.total_jobs}</p>
          </div>
          <TrendingUp size={32} className="text-[#F5A623]/40" />
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">Quick Actions</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: '/jobs', icon: Plus, label: 'รับงานใหม่', color: 'text-[#10B981]', bg: 'bg-[#10B981]/15' },
            { href: '/jobs', icon: RefreshCw, label: 'อัพเดทงาน', color: 'text-blue-400', bg: 'bg-blue-400/15' },
            { href: '/checklist', icon: Camera, label: 'ถ่ายรูป', color: 'text-[#F5A623]', bg: 'bg-[#F5A623]/15' },
          ].map(({ href, icon: Icon, label, color, bg }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-2 bg-white/8 border border-white/12 rounded-2xl py-4 active:scale-95 transition-transform"
            >
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon size={20} className={color} />
              </div>
              <span className="text-white/70 text-xs text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Pending jobs */}
      {pendingJobs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-white font-semibold">งานรอรับ</p>
            <span className="bg-[#F5A623] text-[#0A2342] text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingJobs.length} งาน
            </span>
          </div>
          <div className="space-y-3">
            {pendingJobs.slice(0, 2).map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}

      {/* Today's jobs */}
      {todayJobs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-white/50" />
            <p className="text-white font-semibold">งานวันนี้</p>
          </div>
          <div className="space-y-3">
            {todayJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}

      {todayJobs.length === 0 && pendingJobs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Zap size={40} className="text-[#F5A623]/30 mb-3" />
          <p className="text-white/50">ไม่มีงานวันนี้</p>
          <p className="text-white/30 text-sm mt-1">ตรวจสอบงานใหม่ได้ที่เมนู &quot;งาน&quot;</p>
        </div>
      )}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { MapPin, Phone, Clock, Zap, ChevronRight } from 'lucide-react'
import type { Job, JobStatus } from '@/types'

const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'รอรับงาน', color: 'text-yellow-400', bg: 'bg-yellow-400/15' },
  accepted: { label: 'รับงานแล้ว', color: 'text-blue-400', bg: 'bg-blue-400/15' },
  traveling: { label: 'กำลังเดินทาง', color: 'text-purple-400', bg: 'bg-purple-400/15' },
  installing: { label: 'กำลังติดตั้ง', color: 'text-[#F5A623]', bg: 'bg-[#F5A623]/15' },
  testing: { label: 'ทดสอบระบบ', color: 'text-cyan-400', bg: 'bg-cyan-400/15' },
  completed: { label: 'เสร็จสิ้น', color: 'text-[#10B981]', bg: 'bg-[#10B981]/15' },
  cancelled: { label: 'ยกเลิก', color: 'text-red-400', bg: 'bg-red-400/15' },
}

interface JobCardProps {
  job: Job
  compact?: boolean
}

export default function JobCard({ job, compact = false }: JobCardProps) {
  const cfg = STATUS_CONFIG[job.status]

  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="bg-white/8 border border-white/12 rounded-2xl p-4 active:scale-[0.98] transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-white/50 font-mono">{job.job_number}</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color} ${cfg.bg}`}>
            {cfg.label}
          </span>
        </div>

        {/* Customer */}
        <div className="mb-2">
          <p className="text-white font-semibold text-base leading-tight">{job.customer.name}</p>
          {job.customer.company && (
            <p className="text-white/60 text-sm">{job.customer.company}</p>
          )}
        </div>

        {!compact && (
          <>
            {/* Address */}
            <div className="flex items-start gap-2 mb-2">
              <MapPin size={14} className="text-white/40 mt-0.5 shrink-0" />
              <p className="text-white/60 text-sm leading-tight line-clamp-2">{job.address}</p>
            </div>

            {/* Details row */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-[#F5A623]" />
                <span className="text-white/70 text-sm">{job.solar_system.capacity_kwp} kWp</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-white/40" />
                <span className="text-white/60 text-sm">{job.scheduled_time} น.</span>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <span className="text-[#10B981] font-semibold text-sm">
                  ฿{job.payment_amount.toLocaleString()}
                </span>
                <ChevronRight size={16} className="text-white/30" />
              </div>
            </div>
          </>
        )}

        {compact && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-white/40" />
              <span className="text-white/60 text-xs">{job.scheduled_time} น.</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#10B981] font-semibold text-sm">
                ฿{job.payment_amount.toLocaleString()}
              </span>
              <ChevronRight size={14} className="text-white/30" />
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}

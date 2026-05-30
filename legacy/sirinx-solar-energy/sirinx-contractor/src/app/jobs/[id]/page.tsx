'use client'

import { use } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, Phone, MapPin, Zap, Layers, Cpu,
  Home, FileText, Camera, AlertCircle
} from 'lucide-react'
import { useJob } from '@/hooks/useContractor'
import StatusUpdater from '@/components/StatusUpdater'
import PhotoUploader from '@/components/PhotoUploader'

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { job, loading, updateStatus } = useJob(id)

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6">
        <AlertCircle size={40} className="text-red-400" />
        <p className="text-white text-center">ไม่พบงานนี้</p>
        <Link href="/jobs" className="text-[#F5A623] text-sm">← กลับไปรายการงาน</Link>
      </div>
    )
  }

  const mapsUrl = job.customer.lat && job.customer.lng
    ? `https://maps.google.com/?q=${job.customer.lat},${job.customer.lng}`
    : `https://maps.google.com/?q=${encodeURIComponent(job.address)}`

  return (
    <div className="min-h-dvh px-4 pt-4 pb-8 space-y-5">
      {/* Back nav */}
      <div className="flex items-center gap-2">
        <Link href="/jobs" className="w-9 h-9 rounded-xl bg-white/8 border border-white/12 flex items-center justify-center">
          <ChevronLeft size={18} className="text-white/70" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-white/50 text-xs font-mono">{job.job_number}</p>
          <h1 className="text-white font-bold text-base leading-tight truncate">{job.customer.name}</h1>
        </div>
      </div>

      {/* Status Updater */}
      <div className="bg-white/8 border border-white/12 rounded-2xl p-4">
        <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-4">สถานะงาน</p>
        <StatusUpdater currentStatus={job.status} onUpdate={updateStatus} />
      </div>

      {/* Customer info */}
      <div className="bg-white/8 border border-white/12 rounded-2xl p-4 space-y-3">
        <p className="text-white/50 text-xs font-medium uppercase tracking-wider">ข้อมูลลูกค้า</p>

        <div>
          <p className="text-white font-semibold text-lg">{job.customer.name}</p>
          {job.customer.company && (
            <p className="text-white/60 text-sm">{job.customer.company}</p>
          )}
        </div>

        <a
          href={`tel:${job.customer.phone}`}
          className="flex items-center gap-3 bg-[#10B981]/15 border border-[#10B981]/30 rounded-xl p-3 active:bg-[#10B981]/25 transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-[#10B981]/20 flex items-center justify-center shrink-0">
            <Phone size={18} className="text-[#10B981]" />
          </div>
          <div>
            <p className="text-[#10B981] font-semibold">{job.customer.phone}</p>
            <p className="text-[#10B981]/60 text-xs">กดโทรหาลูกค้า</p>
          </div>
        </a>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/25 rounded-xl p-3 active:bg-blue-500/20 transition-colors"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin size={18} className="text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-blue-400 font-medium text-sm leading-snug">{job.address}</p>
            <p className="text-blue-400/60 text-xs mt-0.5">เปิด Google Maps</p>
          </div>
        </a>
      </div>

      {/* System specs */}
      <div className="bg-white/8 border border-white/12 rounded-2xl p-4 space-y-3">
        <p className="text-white/50 text-xs font-medium uppercase tracking-wider">ข้อมูลระบบ</p>

        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Zap, label: 'ขนาดระบบ', value: `${job.solar_system.capacity_kwp} kWp`, color: 'text-[#F5A623]' },
            { icon: Layers, label: 'จำนวนแผง', value: `${job.solar_system.panel_count} แผง`, color: 'text-blue-400' },
            { icon: Cpu, label: 'Inverter', value: job.solar_system.inverter_brand, color: 'text-purple-400' },
            { icon: Home, label: 'หลังคา', value: job.solar_system.roof_type, color: 'text-[#10B981]' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white/5 rounded-xl p-3">
              <Icon size={14} className={`${color} mb-1.5`} />
              <p className="text-white/40 text-xs">{label}</p>
              <p className="text-white font-semibold text-sm mt-0.5 leading-tight">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white/5 rounded-xl p-3">
          <p className="text-white/40 text-xs mb-0.5">รุ่น Inverter</p>
          <p className="text-white font-mono text-sm">{job.solar_system.inverter_model}</p>
        </div>
      </div>

      {/* Payment */}
      <div className="bg-gradient-to-r from-[#10B981]/20 to-[#10B981]/5 border border-[#10B981]/30 rounded-2xl p-4">
        <p className="text-[#10B981]/70 text-xs mb-1">ค่าติดตั้ง</p>
        <p className="text-[#10B981] font-bold text-3xl">฿{job.payment_amount.toLocaleString()}</p>
        <p className="text-white/40 text-xs mt-1">จ่ายหลังเสร็จงาน</p>
      </div>

      {/* Notes */}
      {job.notes && (
        <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-yellow-400" />
            <p className="text-yellow-400 text-sm font-medium">หมายเหตุจากผู้จัดการ</p>
          </div>
          <p className="text-white/70 text-sm">{job.notes}</p>
        </div>
      )}

      {/* Photo upload */}
      <div className="bg-white/8 border border-white/12 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Camera size={16} className="text-[#F5A623]" />
          <p className="text-white font-medium">อัพโหลดรูปงาน</p>
        </div>
        <div className="space-y-3">
          {(['before', 'during', 'after'] as const).map((step) => (
            <div key={step}>
              <p className="text-white/50 text-xs mb-1.5">
                {step === 'before' ? 'ก่อนติดตั้ง' : step === 'during' ? 'ระหว่างติดตั้ง' : 'หลังติดตั้ง'}
              </p>
              <PhotoUploader step={`${job.id}-${step}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Notes input */}
      <div className="bg-white/8 border border-white/12 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} className="text-white/50" />
          <p className="text-white font-medium">บันทึกช่าง</p>
        </div>
        <textarea
          placeholder="บันทึกปัญหา, หมายเหตุ, สิ่งที่ต้องติดตาม..."
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/30 resize-none focus:outline-none focus:border-[#F5A623]/50"
        />
        <button className="mt-2 w-full py-3 rounded-xl bg-white/8 border border-white/12 text-white/60 text-sm font-medium active:bg-white/15 transition-colors">
          บันทึก
        </button>
      </div>
    </div>
  )
}

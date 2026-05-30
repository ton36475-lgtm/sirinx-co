'use client'

import { Shield, CheckCircle, AlertTriangle } from 'lucide-react'
import { useCustomer } from '@/hooks/useCustomer'
import type { WarrantyDoc } from '@/types'

const typeLabel: Record<WarrantyDoc['type'], { label: string; icon: string }> = {
  panel: { label: 'แผง Solar', icon: '☀️' },
  inverter: { label: 'Inverter', icon: '⚡' },
  battery: { label: 'Battery', icon: '🔋' },
  structure: { label: 'โครงสร้าง', icon: '🏗️' },
  workmanship: { label: 'งานติดตั้ง', icon: '🔧' },
  other: { label: 'อื่นๆ', icon: '📄' },
}

function WarrantyCard({ doc }: { doc: WarrantyDoc }) {
  const endDate = new Date(doc.endDate)
  const today = new Date()
  const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const yearsLeft = Math.floor(daysLeft / 365)
  const isExpiringSoon = daysLeft > 0 && daysLeft < 365
  const isExpired = daysLeft <= 0

  const { label, icon } = typeLabel[doc.type]

  return (
    <div className={`bg-white/5 border rounded-2xl p-4 ${
      isExpired ? 'border-red-400/20' : isExpiringSoon ? 'border-[#F5A623]/20' : 'border-white/10'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">
            {icon}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{doc.title}</p>
            <p className="text-white/40 text-xs">{doc.brand} · {doc.model}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
          isExpired ? 'bg-red-400/10 text-red-400' :
          isExpiringSoon ? 'bg-[#F5A623]/10 text-[#F5A623]' :
          'bg-[#10B981]/10 text-[#10B981]'
        }`}>
          {isExpired ? <AlertTriangle size={10} /> : <CheckCircle size={10} />}
          {isExpired ? 'หมดอายุ' : isExpiringSoon ? 'ใกล้หมด' : 'ใช้งานได้'}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-3 gap-2">
        <div>
          <p className="text-white/40 text-xs">ระยะเวลา</p>
          <p className="text-white font-semibold text-sm">{doc.warrantyYears} ปี</p>
        </div>
        <div>
          <p className="text-white/40 text-xs">เริ่มต้น</p>
          <p className="text-white text-sm">
            {new Date(doc.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
          </p>
        </div>
        <div>
          <p className="text-white/40 text-xs">สิ้นสุด</p>
          <p className={`font-semibold text-sm ${isExpired ? 'text-red-400' : isExpiringSoon ? 'text-[#F5A623]' : 'text-[#10B981]'}`}>
            {new Date(doc.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
          </p>
        </div>
      </div>

      {!isExpired && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white/30 text-xs">เหลืออีก</p>
            <p className="text-white/50 text-xs">
              {yearsLeft > 0 ? `${yearsLeft} ปี ${daysLeft % 365} วัน` : `${daysLeft} วัน`}
            </p>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${isExpiringSoon ? 'bg-[#F5A623]' : 'bg-[#10B981]'}`}
              style={{ width: `${Math.min((daysLeft / (doc.warrantyYears * 365)) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function WarrantyPage() {
  const { warrantyDocs } = useCustomer()

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div>
          <h1 className="text-white font-bold text-xl">ข้อมูลรับประกัน</h1>
          <p className="text-white/50 text-sm mt-0.5">เอกสารและระยะเวลารับประกันอุปกรณ์</p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#10B981]/15 flex items-center justify-center">
            <Shield size={20} className="text-[#10B981]" />
          </div>
          <div>
            <p className="text-white/50 text-xs">รับประกันทั้งหมด</p>
            <p className="text-white font-bold text-lg">{warrantyDocs.length} รายการ</p>
          </div>
        </div>
      </div>

      {/* Warranty Cards */}
      <div className="space-y-3">
        {warrantyDocs.map(doc => (
          <WarrantyCard key={doc.id} doc={doc} />
        ))}
      </div>

      {/* Note */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <p className="text-white/50 text-xs font-medium mb-2">หมายเหตุ</p>
        <ul className="space-y-1">
          <li className="text-white/30 text-xs">• การรับประกันไม่ครอบคลุมความเสียหายจากภัยธรรมชาติ</li>
          <li className="text-white/30 text-xs">• ต้องทำการบำรุงรักษาตามกำหนดเพื่อรักษาสิทธิ์รับประกัน</li>
          <li className="text-white/30 text-xs">• สอบถามเพิ่มเติม โทร 02-123-4567</li>
        </ul>
      </div>
    </div>
  )
}

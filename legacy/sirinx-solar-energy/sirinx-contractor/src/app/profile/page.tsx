'use client'

import { Star, Briefcase, Award, Phone, Mail, Calendar, ChevronRight, LogOut, Bell, Shield, HelpCircle } from 'lucide-react'
import { useContractor } from '@/hooks/useContractor'

export default function ProfilePage() {
  const { contractor } = useContractor()

  const initials = contractor.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)

  return (
    <div className="min-h-dvh px-4 pt-12 pb-6 space-y-5">
      {/* Avatar + name */}
      <div className="flex flex-col items-center py-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#F5A623] to-[#e08c10] flex items-center justify-center text-[#0A2342] font-bold text-2xl mb-3">
          {initials}
        </div>
        <h1 className="text-white font-bold text-xl">{contractor.name}</h1>
        <div className="flex items-center gap-1.5 mt-1">
          <Award size={14} className="text-[#F5A623]" />
          <span className="text-[#F5A623] text-sm font-medium">{contractor.cert_level}</span>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <Star size={13} className="text-yellow-400 fill-yellow-400" />
          <span className="text-white/70 text-sm">{contractor.rating} / 5.0</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'งานทั้งหมด', value: contractor.total_jobs, unit: 'งาน' },
          { label: 'Rating', value: contractor.rating, unit: '/5.0' },
          { label: 'รายได้รวม', value: `${(contractor.total_earnings / 1000).toFixed(0)}K`, unit: '฿' },
        ].map(({ label, value, unit }) => (
          <div key={label} className="bg-white/8 border border-white/12 rounded-2xl p-3 text-center">
            <p className="text-white font-bold text-xl">{value}</p>
            <p className="text-white/40 text-xs">{unit}</p>
            <p className="text-white/50 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Contact info */}
      <div className="bg-white/8 border border-white/12 rounded-2xl p-4 space-y-3">
        <p className="text-white/50 text-xs font-medium uppercase tracking-wider">ข้อมูลติดต่อ</p>
        {[
          { icon: Phone, label: contractor.phone },
          { icon: Mail, label: contractor.email || 'ยังไม่มีอีเมล' },
          { icon: Calendar, label: `เริ่มงาน: ${contractor.joined_date}` },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/8 flex items-center justify-center shrink-0">
              <Icon size={16} className="text-white/50" />
            </div>
            <span className="text-white/70 text-sm">{label}</span>
          </div>
        ))}
      </div>

      {/* Specialties */}
      <div className="bg-white/8 border border-white/12 rounded-2xl p-4">
        <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">ความเชี่ยวชาญ</p>
        <div className="flex flex-wrap gap-2">
          {contractor.specialties.map((s) => (
            <span key={s} className="bg-[#F5A623]/15 text-[#F5A623] text-xs font-medium px-3 py-1.5 rounded-full border border-[#F5A623]/25">
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Settings menu */}
      <div className="bg-white/8 border border-white/12 rounded-2xl overflow-hidden">
        {[
          { icon: Bell, label: 'การแจ้งเตือน', color: 'text-blue-400' },
          { icon: Shield, label: 'ความปลอดภัย', color: 'text-[#10B981]' },
          { icon: Briefcase, label: 'ใบรับรองและทักษะ', color: 'text-[#F5A623]' },
          { icon: HelpCircle, label: 'ช่วยเหลือ / ติดต่อ', color: 'text-purple-400' },
        ].map(({ icon: Icon, label, color }, i) => (
          <button
            key={label}
            className={`w-full flex items-center gap-3 px-4 py-4 active:bg-white/5 transition-colors ${
              i > 0 ? 'border-t border-white/8' : ''
            }`}
          >
            <Icon size={18} className={color} />
            <span className="text-white/80 text-sm flex-1 text-left">{label}</span>
            <ChevronRight size={16} className="text-white/20" />
          </button>
        ))}
      </div>

      {/* Logout */}
      <button className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/25 text-red-400 font-medium py-4 rounded-2xl active:bg-red-500/20 transition-colors">
        <LogOut size={18} />
        ออกจากระบบ
      </button>

      <p className="text-center text-white/20 text-xs">SIRINX Contractor v1.0.0</p>
    </div>
  )
}

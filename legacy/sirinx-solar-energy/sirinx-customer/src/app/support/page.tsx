'use client'

import Link from 'next/link'
import { Plus, MessageCircle } from 'lucide-react'
import { useCustomer } from '@/hooks/useCustomer'
import TicketCard from '@/components/TicketCard'
import type { TicketStatus } from '@/types'

const statusOrder: TicketStatus[] = ['open', 'in_progress', 'waiting', 'resolved', 'closed']

export default function SupportPage() {
  const { tickets } = useCustomer()

  const sorted = [...tickets].sort((a, b) =>
    statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
  )

  const openCount = tickets.filter(t => ['open', 'in_progress', 'waiting'].includes(t.status)).length

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-xl">ศูนย์ช่วยเหลือ</h1>
          <p className="text-white/50 text-sm mt-0.5">
            {openCount > 0 ? `${openCount} เรื่องที่กำลังดำเนินการ` : 'ไม่มีเรื่องค้างอยู่'}
          </p>
        </div>
        <Link
          href="/support/new"
          className="flex items-center gap-2 bg-[#F5A623] text-[#0A2342] font-semibold text-sm px-4 py-2 rounded-xl hover:bg-[#F5A623]/90 transition-colors active:scale-95"
        >
          <Plus size={16} />
          แจ้งปัญหา
        </Link>
      </div>

      {/* Tickets */}
      {sorted.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <MessageCircle size={28} className="text-white/20" />
          </div>
          <p className="text-white/40 text-sm">ยังไม่มีเรื่องที่แจ้ง</p>
          <p className="text-white/25 text-xs mt-1">หากมีปัญหา กดแจ้งปัญหาได้เลย</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}

      {/* Contact info */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <p className="text-white/50 text-xs font-medium mb-3">ติดต่อทีมงาน</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-white/60 text-sm">โทรศัพท์</p>
            <a href="tel:021234567" className="text-[#F5A623] font-semibold text-sm">02-123-4567</a>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-white/60 text-sm">LINE OA</p>
            <p className="text-white font-semibold text-sm">@sirinx</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-white/60 text-sm">เวลาทำการ</p>
            <p className="text-white/70 text-sm">จ-ศ 8:00–17:30</p>
          </div>
        </div>
      </div>
    </div>
  )
}

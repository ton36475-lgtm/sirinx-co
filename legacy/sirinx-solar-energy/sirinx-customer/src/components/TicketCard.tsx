import Link from 'next/link'
import { MessageCircle, Clock, CheckCircle, AlertCircle, XCircle, ChevronRight } from 'lucide-react'
import type { SupportTicket, TicketStatus, TicketCategory } from '@/types'

const statusConfig: Record<TicketStatus, { label: string; color: string; icon: React.ElementType }> = {
  open: { label: 'รับเรื่อง', color: 'text-blue-400 bg-blue-400/10', icon: MessageCircle },
  in_progress: { label: 'กำลังดำเนินการ', color: 'text-[#F5A623] bg-[#F5A623]/10', icon: Clock },
  waiting: { label: 'รอข้อมูล', color: 'text-purple-400 bg-purple-400/10', icon: AlertCircle },
  resolved: { label: 'แก้ไขแล้ว', color: 'text-[#10B981] bg-[#10B981]/10', icon: CheckCircle },
  closed: { label: 'ปิดเรื่อง', color: 'text-white/40 bg-white/5', icon: XCircle },
}

const categoryLabel: Record<TicketCategory, string> = {
  equipment: 'อุปกรณ์',
  billing: 'การเงิน',
  installation: 'การติดตั้ง',
  monitoring: 'ระบบ',
  other: 'อื่นๆ',
}

interface Props {
  ticket: SupportTicket
}

export default function TicketCard({ ticket }: Props) {
  const { label, color, icon: Icon } = statusConfig[ticket.status]
  const latestMsg = ticket.messages[ticket.messages.length - 1]

  return (
    <Link
      href={`/support/${ticket.id}`}
      className="block bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/8 transition-colors active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${color}`}>
              <Icon size={11} />
              {label}
            </span>
            <span className="text-white/30 text-xs">{categoryLabel[ticket.category]}</span>
          </div>
          <p className="text-white font-medium text-sm leading-snug truncate">{ticket.title}</p>
          {latestMsg && (
            <p className="text-white/40 text-xs mt-1 truncate">
              {latestMsg.sender === 'support' ? '💬 ' : '👤 '}
              {latestMsg.message}
            </p>
          )}
        </div>
        <ChevronRight size={16} className="text-white/30 flex-shrink-0 mt-1" />
      </div>
      <div className="mt-2 flex items-center gap-3">
        <span className="text-white/30 text-xs">#{ticket.id}</span>
        <span className="text-white/30 text-xs">·</span>
        <span className="text-white/30 text-xs">
          {new Date(ticket.updatedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </Link>
  )
}

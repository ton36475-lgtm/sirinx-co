import { CheckCircle, Clock, AlertTriangle, XCircle, FileText } from 'lucide-react'
import type { Invoice, InvoiceStatus } from '@/types'

const statusConfig: Record<InvoiceStatus, { label: string; color: string; icon: React.ElementType }> = {
  paid: { label: 'ชำระแล้ว', color: 'text-[#10B981] bg-[#10B981]/10', icon: CheckCircle },
  pending: { label: 'รอชำระ', color: 'text-[#F5A623] bg-[#F5A623]/10', icon: Clock },
  overdue: { label: 'เกินกำหนด', color: 'text-red-400 bg-red-400/10', icon: AlertTriangle },
  cancelled: { label: 'ยกเลิก', color: 'text-white/40 bg-white/5', icon: XCircle },
}

interface Props {
  invoice: Invoice
}

export default function InvoiceRow({ invoice }: Props) {
  const { label, color, icon: Icon } = statusConfig[invoice.status]

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
            <FileText size={18} className="text-[#F5A623]" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">{invoice.invoiceNumber}</p>
            <p className="text-white/50 text-xs leading-relaxed mt-0.5">{invoice.description}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 flex-shrink-0 ${color}`}>
          <Icon size={11} />
          {label}
        </span>
      </div>

      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
        <div>
          <p className="text-white/40 text-xs">
            {invoice.status === 'paid' && invoice.paidDate
              ? `ชำระวันที่ ${new Date(invoice.paidDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`
              : `กำหนดชำระ ${new Date(invoice.dueDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-white/40 text-xs">ยอดรวม (รวม VAT)</p>
          <p className="text-white font-bold text-base">
            ฿{invoice.totalAmount.toLocaleString('th-TH')}
          </p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { useCustomer } from '@/hooks/useCustomer'
import InvoiceRow from '@/components/InvoiceRow'

export default function BillingPage() {
  const { invoices } = useCustomer()

  const paid = invoices.filter(i => i.status === 'paid')
  const pending = invoices.filter(i => i.status === 'pending' || i.status === 'overdue')
  const totalPaid = paid.reduce((sum, i) => sum + i.totalAmount, 0)
  const totalPending = pending.reduce((sum, i) => sum + i.totalAmount, 0)

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-white font-bold text-xl">ใบแจ้งหนี้</h1>
        <p className="text-white/50 text-sm mt-0.5">ประวัติการชำระเงินและใบแจ้งหนี้</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#10B981]/10 border border-[#10B981]/25 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={14} className="text-[#10B981]" />
            <p className="text-white/50 text-xs">ชำระแล้ว</p>
          </div>
          <p className="text-[#10B981] font-bold text-xl">
            ฿{totalPaid.toLocaleString('th-TH')}
          </p>
          <p className="text-white/30 text-xs mt-0.5">{paid.length} รายการ</p>
        </div>

        <div className={`${totalPending > 0 ? 'bg-[#F5A623]/10 border-[#F5A623]/25' : 'bg-white/5 border-white/10'} border rounded-2xl p-4`}>
          <div className="flex items-center gap-2 mb-2">
            {totalPending > 0
              ? <Clock size={14} className="text-[#F5A623]" />
              : <CheckCircle size={14} className="text-white/30" />}
            <p className="text-white/50 text-xs">รอชำระ</p>
          </div>
          <p className={`font-bold text-xl ${totalPending > 0 ? 'text-[#F5A623]' : 'text-white/30'}`}>
            {totalPending > 0 ? `฿${totalPending.toLocaleString('th-TH')}` : '-'}
          </p>
          <p className="text-white/30 text-xs mt-0.5">{pending.length} รายการ</p>
        </div>
      </div>

      {/* Pending invoices first */}
      {pending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-[#F5A623]" />
            <p className="text-white/60 text-sm font-medium">รอชำระ</p>
          </div>
          <div className="space-y-3">
            {pending.map(invoice => (
              <InvoiceRow key={invoice.id} invoice={invoice} />
            ))}
          </div>
        </div>
      )}

      {/* All invoices */}
      <div>
        <p className="text-white/50 text-xs font-medium uppercase tracking-wide mb-3">ประวัติทั้งหมด</p>
        <div className="space-y-3">
          {invoices.map(invoice => (
            <InvoiceRow key={invoice.id} invoice={invoice} />
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
        <p className="text-white/40 text-xs">
          สอบถามเรื่องการเงิน โทร{' '}
          <a href="tel:021234567" className="text-[#F5A623]">02-123-4567</a>
          {' '}หรือ LINE: @sirinx
        </p>
      </div>
    </div>
  )
}

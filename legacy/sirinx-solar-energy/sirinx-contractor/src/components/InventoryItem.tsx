'use client'

import { AlertTriangle, Package } from 'lucide-react'
import type { InventoryItem as InventoryItemType } from '@/types'

const CATEGORY_LABEL: Record<InventoryItemType['category'], string> = {
  panel: 'แผงโซลาร์',
  inverter: 'อินเวอร์เตอร์',
  cable: 'สายไฟ',
  rail: 'ราง',
  hardware: 'อุปกรณ์ยึด',
  other: 'อื่นๆ',
}

interface InventoryItemProps {
  item: InventoryItemType
  onRequest?: (id: string) => void
}

export default function InventoryItem({ item, onRequest }: InventoryItemProps) {
  const isLow = item.quantity <= item.min_quantity
  const pct = Math.min(100, (item.quantity / (item.min_quantity * 3)) * 100)

  return (
    <div
      className={`rounded-2xl border p-4 ${
        isLow ? 'bg-red-500/10 border-red-500/30' : 'bg-white/8 border-white/12'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isLow ? 'bg-red-500/20' : 'bg-white/10'}`}>
            <Package size={18} className={isLow ? 'text-red-400' : 'text-white/60'} />
          </div>
          <div className="min-w-0">
            <p className="text-white font-medium text-sm leading-tight truncate">{item.name}</p>
            <p className="text-white/40 text-xs">{CATEGORY_LABEL[item.category]}</p>
          </div>
        </div>
        {isLow && (
          <AlertTriangle size={18} className="text-red-400 shrink-0 mt-1" />
        )}
      </div>

      {/* Quantity */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <span className={`text-2xl font-bold ${isLow ? 'text-red-400' : 'text-white'}`}>
            {item.quantity}
          </span>
          <span className="text-white/40 text-sm ml-1">{item.unit}</span>
        </div>
        <span className="text-white/40 text-xs">ขั้นต่ำ {item.min_quantity} {item.unit}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all ${isLow ? 'bg-red-400' : 'bg-[#10B981]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {isLow && onRequest && (
        <button
          onClick={() => onRequest(item.id)}
          className="w-full text-center text-sm font-semibold text-red-400 border border-red-400/40 rounded-xl py-2 active:bg-red-400/10 transition-colors"
        >
          สั่งเพิ่ม
        </button>
      )}
    </div>
  )
}

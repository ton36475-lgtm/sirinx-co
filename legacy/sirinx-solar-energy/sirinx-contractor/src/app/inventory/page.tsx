'use client'

import { useState } from 'react'
import { Package, AlertTriangle, Search } from 'lucide-react'
import { useInventory } from '@/hooks/useContractor'
import InventoryItemComponent from '@/components/InventoryItem'
import type { InventoryItem } from '@/types'

const CATEGORY_OPTIONS: { label: string; value: InventoryItem['category'] | 'all' }[] = [
  { label: 'ทั้งหมด', value: 'all' },
  { label: 'แผง', value: 'panel' },
  { label: 'Inverter', value: 'inverter' },
  { label: 'สาย', value: 'cable' },
  { label: 'ราง', value: 'rail' },
  { label: 'ยึด', value: 'hardware' },
]

export default function InventoryPage() {
  const { items, lowStock } = useInventory()
  const [category, setCategory] = useState<InventoryItem['category'] | 'all'>('all')
  const [search, setSearch] = useState('')

  const filtered = items.filter((item) => {
    const matchCat = category === 'all' || item.category === category
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const handleRequest = (id: string) => {
    const item = items.find((i) => i.id === id)
    if (item) alert(`แจ้งสั่งเพิ่ม: ${item.name}`)
  }

  return (
    <div className="min-h-dvh px-4 pt-12 pb-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package size={24} className="text-[#F5A623]" />
          <h1 className="text-white font-bold text-xl">อุปกรณ์</h1>
        </div>
        {lowStock.length > 0 && (
          <div className="flex items-center gap-1.5 bg-red-500/15 border border-red-500/30 rounded-full px-3 py-1">
            <AlertTriangle size={12} className="text-red-400" />
            <span className="text-red-400 text-xs font-medium">{lowStock.length} ใกล้หมด</span>
          </div>
        )}
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-4">
          <p className="text-red-400 font-medium text-sm mb-1 flex items-center gap-2">
            <AlertTriangle size={15} /> อุปกรณ์ใกล้หมด
          </p>
          <p className="text-white/50 text-xs">
            {lowStock.map((i) => i.name).join(', ')}
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาอุปกรณ์..."
          className="w-full bg-white/8 border border-white/12 rounded-2xl pl-9 pr-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#F5A623]/50"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORY_OPTIONS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setCategory(value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              category === value
                ? 'bg-[#F5A623] text-[#0A2342]'
                : 'bg-white/8 text-white/60 border border-white/12'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((item) => (
          <InventoryItemComponent key={item.id} item={item} onRequest={handleRequest} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/40">ไม่พบอุปกรณ์</p>
        </div>
      )}
    </div>
  )
}

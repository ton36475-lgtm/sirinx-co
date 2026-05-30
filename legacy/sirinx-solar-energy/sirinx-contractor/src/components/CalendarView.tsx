'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Job } from '@/types'

interface CalendarViewProps {
  jobs: Job[]
  onSelectDate?: (date: string) => void
}

const DAYS_TH = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
const MONTHS_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]

export default function CalendarView({ jobs, onSelectDate }: CalendarViewProps) {
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState(today.toISOString().split('T')[0])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const jobsByDate = jobs.reduce<Record<string, Job[]>>((acc, job) => {
    const d = job.scheduled_date
    if (!acc[d]) acc[d] = []
    acc[d].push(job)
    return acc
  }, {})

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  const handleSelect = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelected(dateStr)
    onSelectDate?.(dateStr)
  }

  const cells = Array(firstDay).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  )

  const selectedJobs = jobsByDate[selected] || []

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/8 active:bg-white/15">
          <ChevronLeft size={20} className="text-white/70" />
        </button>
        <h2 className="text-white font-semibold">{MONTHS_TH[month]} {year + 543}</h2>
        <button onClick={nextMonth} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/8 active:bg-white/15">
          <ChevronRight size={20} className="text-white/70" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center mb-1">
        {DAYS_TH.map((d) => (
          <div key={d} className="text-white/40 text-xs py-1">{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const hasJobs = !!jobsByDate[dateStr]
          const isToday = dateStr === today.toISOString().split('T')[0]
          const isSelected = dateStr === selected

          return (
            <button
              key={day}
              onClick={() => handleSelect(day)}
              className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-colors relative ${
                isSelected
                  ? 'bg-[#F5A623] text-[#0A2342] font-bold'
                  : isToday
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-white/70 hover:bg-white/8 active:bg-white/15'
              }`}
            >
              {day}
              {hasJobs && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#10B981]" />
              )}
            </button>
          )
        })}
      </div>

      {/* Jobs on selected date */}
      {selected && (
        <div className="border-t border-white/10 pt-4">
          <p className="text-white/50 text-sm mb-3">
            {selectedJobs.length > 0
              ? `${selectedJobs.length} งาน — ${selected}`
              : `ไม่มีงาน — ${selected}`}
          </p>
          {selectedJobs.map((job) => (
            <div key={job.id} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-[#F5A623]/20 flex items-center justify-center shrink-0">
                <span className="text-[#F5A623] text-xs font-bold">{job.scheduled_time}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{job.customer.name}</p>
                <p className="text-white/50 text-xs truncate">{job.solar_system.capacity_kwp} kWp</p>
              </div>
              <span className="text-[#10B981] text-sm font-semibold shrink-0">
                ฿{job.payment_amount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

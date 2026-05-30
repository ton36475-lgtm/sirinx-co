'use client'

import { useContractor } from '@/hooks/useContractor'
import CalendarView from '@/components/CalendarView'

export default function SchedulePage() {
  const { jobs } = useContractor()

  return (
    <div className="min-h-dvh px-4 pt-12 pb-6">
      <h1 className="text-white font-bold text-xl mb-6">ปฏิทินงาน</h1>
      <div className="bg-white/8 border border-white/12 rounded-2xl p-4">
        <CalendarView jobs={jobs} />
      </div>
    </div>
  )
}

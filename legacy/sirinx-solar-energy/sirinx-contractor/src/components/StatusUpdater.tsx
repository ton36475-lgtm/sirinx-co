'use client'

import { useState } from 'react'
import { CheckCircle, Navigation, Wrench, Zap, PackageCheck, Loader2 } from 'lucide-react'
import type { JobStatus } from '@/types'

const STEPS: { status: JobStatus; label: string; icon: React.ElementType }[] = [
  { status: 'accepted', label: 'รับงาน', icon: CheckCircle },
  { status: 'traveling', label: 'เดินทาง', icon: Navigation },
  { status: 'installing', label: 'ติดตั้ง', icon: Wrench },
  { status: 'testing', label: 'ทดสอบ', icon: Zap },
  { status: 'completed', label: 'เสร็จสิ้น', icon: PackageCheck },
]

const ORDER: JobStatus[] = ['pending', 'accepted', 'traveling', 'installing', 'testing', 'completed']

interface StatusUpdaterProps {
  currentStatus: JobStatus
  onUpdate: (status: JobStatus) => Promise<void>
}

export default function StatusUpdater({ currentStatus, onUpdate }: StatusUpdaterProps) {
  const [loading, setLoading] = useState(false)

  const currentIdx = ORDER.indexOf(currentStatus)

  const next = STEPS.find(
    (s) => ORDER.indexOf(s.status) === currentIdx + 1
  )

  const handleUpdate = async (status: JobStatus) => {
    setLoading(true)
    await onUpdate(status)
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((step, i) => {
          const stepIdx = ORDER.indexOf(step.status)
          const done = stepIdx <= currentIdx
          const active = step.status === currentStatus
          return (
            <div key={step.status} className="flex items-center flex-1">
              <div
                className={`flex flex-col items-center flex-1 ${
                  active ? 'opacity-100' : done ? 'opacity-80' : 'opacity-30'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center mb-1 ${
                    done
                      ? 'bg-[#10B981] text-white'
                      : 'bg-white/10 text-white/40'
                  } ${active ? 'ring-2 ring-[#10B981] ring-offset-2 ring-offset-[#0A2342]' : ''}`}
                >
                  <step.icon size={16} />
                </div>
                <span className="text-[9px] text-white/60 text-center leading-tight">{step.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-1 mb-4 rounded-full ${
                    stepIdx < currentIdx ? 'bg-[#10B981]' : 'bg-white/15'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Next step button */}
      {next && currentStatus !== 'completed' && currentStatus !== 'cancelled' && (
        <button
          onClick={() => handleUpdate(next.status)}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-[#10B981] hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-lg py-4 rounded-2xl transition-colors disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={22} className="animate-spin" />
          ) : (
            <next.icon size={22} />
          )}
          อัพเดท: {next.label}
        </button>
      )}

      {currentStatus === 'completed' && (
        <div className="w-full flex items-center justify-center gap-2 bg-[#10B981]/20 text-[#10B981] font-bold text-lg py-4 rounded-2xl border border-[#10B981]/30">
          <CheckCircle size={22} />
          งานเสร็จสิ้นแล้ว
        </div>
      )}
    </div>
  )
}

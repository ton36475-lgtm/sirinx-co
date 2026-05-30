import { CheckCircle, Circle, Loader2 } from 'lucide-react'
import type { InstallationStep } from '@/types'

interface Props {
  step: InstallationStep
  isLast?: boolean
}

export default function TimelineStep({ step, isLast }: Props) {
  return (
    <div className="flex gap-3">
      {/* Timeline line + icon */}
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          step.status === 'completed'
            ? 'bg-[#10B981]/20 text-[#10B981]'
            : step.status === 'in_progress'
            ? 'bg-[#F5A623]/20 text-[#F5A623]'
            : 'bg-white/5 text-white/30'
        }`}>
          {step.status === 'completed' && <CheckCircle size={18} />}
          {step.status === 'in_progress' && <Loader2 size={18} className="animate-spin" />}
          {step.status === 'pending' && <Circle size={18} />}
        </div>
        {!isLast && (
          <div className={`w-0.5 flex-1 my-1 min-h-6 ${
            step.status === 'completed' ? 'bg-[#10B981]/30' : 'bg-white/10'
          }`} />
        )}
      </div>

      {/* Content */}
      <div className="pb-6 flex-1">
        <p className={`font-semibold text-sm ${
          step.status === 'completed' ? 'text-white' :
          step.status === 'in_progress' ? 'text-[#F5A623]' : 'text-white/40'
        }`}>
          {step.title}
        </p>
        <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{step.description}</p>
        <div className="flex items-center gap-3 mt-1.5">
          {step.date && (
            <span className="text-white/30 text-xs">
              {new Date(step.date).toLocaleDateString('th-TH', {
                day: 'numeric', month: 'short', year: 'numeric'
              })}
            </span>
          )}
          {step.technician && (
            <>
              <span className="text-white/20">·</span>
              <span className="text-white/30 text-xs">👷 {step.technician}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

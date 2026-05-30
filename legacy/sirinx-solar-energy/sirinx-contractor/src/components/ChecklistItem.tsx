'use client'

import { useState } from 'react'
import { CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react'
import PhotoUploader from './PhotoUploader'
import type { ChecklistStep } from '@/types'

interface ChecklistItemProps {
  step: ChecklistStep
  index: number
  onChange: (id: string, changes: Partial<ChecklistStep>) => void
}

export default function ChecklistItem({ step, index, onChange }: ChecklistItemProps) {
  const [expanded, setExpanded] = useState(false)

  const toggle = () => onChange(step.id, { completed: !step.completed })

  return (
    <div
      className={`rounded-2xl border transition-colors ${
        step.completed
          ? 'bg-[#10B981]/10 border-[#10B981]/30'
          : 'bg-white/8 border-white/12'
      }`}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4"
        onClick={() => setExpanded((e) => !e)}
      >
        <button
          onClick={(e) => { e.stopPropagation(); toggle() }}
          className="shrink-0"
        >
          {step.completed ? (
            <CheckSquare size={26} className="text-[#10B981]" />
          ) : (
            <Square size={26} className="text-white/30" />
          )}
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-xs font-mono">#{index + 1}</span>
            <p className={`font-semibold ${step.completed ? 'text-[#10B981]' : 'text-white'}`}>
              {step.title}
            </p>
          </div>
          <p className="text-white/50 text-xs mt-0.5">{step.description}</p>
        </div>
        {(step.required_photo || step.notes !== undefined) && (
          <button className="text-white/30 shrink-0">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/8">
          {step.required_photo && (
            <div className="pt-3">
              <p className="text-white/50 text-xs mb-2 flex items-center gap-1">
                <span className="text-red-400">*</span> ต้องแนบรูปภาพ
              </p>
              <PhotoUploader
                step={step.id}
                previewUrl={step.photo_url}
                onUpload={async (_file, _stepId) => {
                  // TODO: upload to storage
                  return ''
                }}
              />
            </div>
          )}
          <div className="pt-1">
            <textarea
              value={step.notes || ''}
              onChange={(e) => onChange(step.id, { notes: e.target.value })}
              placeholder="หมายเหตุ..."
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/30 resize-none focus:outline-none focus:border-[#F5A623]/50"
            />
          </div>
        </div>
      )}
    </div>
  )
}

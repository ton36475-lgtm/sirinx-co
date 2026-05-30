'use client'

import { Package, CheckCircle } from 'lucide-react'
import { useCustomer } from '@/hooks/useCustomer'
import StatusCard from '@/components/StatusCard'
import TimelineStep from '@/components/TimelineStep'

export default function InstallationPage() {
  const { customer, installationSteps, equipment } = useCustomer()

  const completedSteps = installationSteps.filter(s => s.status === 'completed').length

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-white font-bold text-xl">การติดตั้ง</h1>
        <p className="text-white/50 text-sm mt-0.5">ติดตาม progress การติดตั้งระบบ Solar</p>
      </div>

      {/* Status */}
      <StatusCard
        status={customer.installationStatus}
        installationDate={customer.installationDate}
        contractNumber={customer.contractNumber}
        systemSize={customer.systemSize}
      />

      {/* Progress */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white/60 text-sm font-medium">ความคืบหน้า</p>
          <p className="text-[#10B981] font-semibold text-sm">
            {completedSteps}/{installationSteps.length} ขั้นตอน
          </p>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#10B981] rounded-full transition-all duration-500"
            style={{ width: `${(completedSteps / installationSteps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div>
        <p className="text-white/50 text-xs font-medium uppercase tracking-wide mb-4">ขั้นตอนการติดตั้ง</p>
        <div>
          {installationSteps.map((step, index) => (
            <TimelineStep
              key={step.id}
              step={step}
              isLast={index === installationSteps.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Package size={16} className="text-[#F5A623]" />
          <p className="text-white/60 text-sm font-medium">อุปกรณ์ที่ติดตั้ง</p>
        </div>
        <div className="space-y-3">
          {equipment.map((eq) => (
            <div key={eq.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-semibold text-sm">{eq.name}</p>
                  <p className="text-white/50 text-xs mt-0.5">{eq.brand} · {eq.model}</p>
                </div>
                <span className="text-[#F5A623] font-bold text-lg">
                  {eq.quantity}
                  <span className="text-white/40 text-xs font-normal ml-1">{eq.unit}</span>
                </span>
              </div>
              {eq.warrantyUntil && (
                <div className="flex items-center gap-1.5 mt-2">
                  <CheckCircle size={12} className="text-[#10B981]" />
                  <p className="text-white/40 text-xs">
                    รับประกันถึง {new Date(eq.warrantyUntil).toLocaleDateString('th-TH', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

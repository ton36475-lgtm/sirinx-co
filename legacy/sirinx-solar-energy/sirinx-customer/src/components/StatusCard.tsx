import { CheckCircle, Clock, Wrench, AlertCircle, XCircle } from 'lucide-react'
import type { InstallationStatus } from '@/types'

interface Props {
  status: InstallationStatus
  installationDate?: string | null
  contractNumber?: string
  systemSize?: number
}

const statusConfig: Record<InstallationStatus, {
  label: string
  color: string
  bg: string
  icon: React.ElementType
  description: string
}> = {
  pending: {
    label: 'รอดำเนินการ',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10 border-yellow-400/30',
    icon: Clock,
    description: 'อยู่ระหว่างการประสานงาน',
  },
  scheduled: {
    label: 'นัดหมายแล้ว',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10 border-blue-400/30',
    icon: Clock,
    description: 'มีนัดหมายทีมช่างแล้ว',
  },
  in_progress: {
    label: 'กำลังติดตั้ง',
    color: 'text-[#F5A623]',
    bg: 'bg-[#F5A623]/10 border-[#F5A623]/30',
    icon: Wrench,
    description: 'ทีมช่างกำลังดำเนินการ',
  },
  completed: {
    label: 'ติดตั้งเสร็จสิ้น',
    color: 'text-[#10B981]',
    bg: 'bg-[#10B981]/10 border-[#10B981]/30',
    icon: CheckCircle,
    description: 'ระบบพร้อมใช้งาน',
  },
  cancelled: {
    label: 'ยกเลิก',
    color: 'text-red-400',
    bg: 'bg-red-400/10 border-red-400/30',
    icon: XCircle,
    description: 'สัญญาถูกยกเลิก',
  },
}

export default function StatusCard({ status, installationDate, contractNumber, systemSize }: Props) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className={`rounded-2xl border p-4 ${config.bg}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${config.bg}`}>
          <Icon size={24} className={config.color} />
        </div>
        <div>
          <p className="text-white/60 text-xs">สถานะการติดตั้ง</p>
          <p className={`font-semibold text-lg ${config.color}`}>{config.label}</p>
          <p className="text-white/50 text-xs mt-0.5">{config.description}</p>
        </div>
      </div>
      {(installationDate || contractNumber || systemSize) && (
        <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2">
          {systemSize && (
            <div>
              <p className="text-white/40 text-xs">ขนาดระบบ</p>
              <p className="text-white font-semibold">{systemSize} kWp</p>
            </div>
          )}
          {installationDate && (
            <div>
              <p className="text-white/40 text-xs">วันที่ติดตั้ง</p>
              <p className="text-white font-semibold">
                {new Date(installationDate).toLocaleDateString('th-TH', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })}
              </p>
            </div>
          )}
          {contractNumber && (
            <div className="col-span-2">
              <p className="text-white/40 text-xs">เลขที่สัญญา</p>
              <p className="text-white font-mono text-sm">{contractNumber}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

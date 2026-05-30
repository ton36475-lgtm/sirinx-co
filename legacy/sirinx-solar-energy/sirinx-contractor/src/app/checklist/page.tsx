'use client'

import { useState } from 'react'
import { ClipboardCheck, ChevronDown, ChevronUp } from 'lucide-react'
import ChecklistItem from '@/components/ChecklistItem'
import type { ChecklistStep } from '@/types'

const INITIAL_CHECKLIST: ChecklistStep[] = [
  // Pre-installation
  { id: 'pre-01', phase: 'pre', title: 'ตรวจสอบสภาพหลังคา', description: 'ตรวจความแข็งแรง รอยร้าว และความลาดเอียง', required_photo: true, completed: false },
  { id: 'pre-02', phase: 'pre', title: 'วัดขนาดพื้นที่', description: 'วัดขนาดหลังคาและวางแผนการจัดวางแผง', required_photo: false, completed: false },
  { id: 'pre-03', phase: 'pre', title: 'ตรวจระบบไฟฟ้าเดิม', description: 'ตรวจ Main Breaker, ขนาดสาย, และ Ground', required_photo: true, completed: false },
  { id: 'pre-04', phase: 'pre', title: 'ถ่ายรูปก่อนติดตั้ง', description: 'ถ่ายรูปสภาพหลังคาและตู้ไฟก่อนเริ่มงาน', required_photo: true, completed: false },

  // Installation
  { id: 'inst-01', phase: 'install', title: 'ติดตั้งรางยึดแผง', description: 'ติดตั้ง Rail และ Bracket ตามแผนที่วางไว้', required_photo: true, completed: false },
  { id: 'inst-02', phase: 'install', title: 'ติดตั้งแผงโซลาร์', description: 'ยึดแผงกับราง ตรวจสอบ Mid/End Clamp', required_photo: true, completed: false },
  { id: 'inst-03', phase: 'install', title: 'เดินสายไฟ DC', description: 'เดินสาย DC จากแผงถึง Inverter พร้อมป้ายกำกับ', required_photo: true, completed: false },
  { id: 'inst-04', phase: 'install', title: 'ติดตั้ง Inverter', description: 'ติดตั้ง Inverter ในที่ร่ม ห่างจากแสงแดด', required_photo: true, completed: false },
  { id: 'inst-05', phase: 'install', title: 'เดินสายไฟ AC', description: 'ต่อสายจาก Inverter เข้าตู้ Main พร้อม Breaker', required_photo: true, completed: false },
  { id: 'inst-06', phase: 'install', title: 'ติดตั้งระบบ Grounding', description: 'ต่อสายดินจากโครงสร้างโซลาร์ถึง Earth Rod', required_photo: true, completed: false },

  // Post-installation
  { id: 'post-01', phase: 'post', title: 'ทดสอบระบบครั้งแรก', description: 'เปิดระบบ ตรวจค่า Voltage และ Power Output', required_photo: true, completed: false },
  { id: 'post-02', phase: 'post', title: 'ตรวจสอบ Warning/Error', description: 'ตรวจหน้าจอ Inverter — ไม่ควรมี Error Code', required_photo: false, completed: false },
  { id: 'post-03', phase: 'post', title: 'อบรมการใช้งานลูกค้า', description: 'แนะนำการอ่านค่าบน Inverter และ App มอนิเตอร์', required_photo: false, completed: false },
  { id: 'post-04', phase: 'post', title: 'ถ่ายรูปหลังติดตั้ง', description: 'ถ่ายรูปงานเสร็จสมบูรณ์ทุกมุม', required_photo: true, completed: false },
  { id: 'post-05', phase: 'post', title: 'ส่งมอบเอกสาร', description: 'ส่งคู่มือ, ใบรับประกัน, และแผนผังระบบให้ลูกค้า', required_photo: false, completed: false },
]

const PHASE_CONFIG = {
  pre: { label: 'ก่อนติดตั้ง', color: 'text-blue-400', bg: 'bg-blue-400/15' },
  install: { label: 'ระหว่างติดตั้ง', color: 'text-[#F5A623]', bg: 'bg-[#F5A623]/15' },
  post: { label: 'หลังติดตั้ง', color: 'text-[#10B981]', bg: 'bg-[#10B981]/15' },
}

type Phase = 'pre' | 'install' | 'post'

export default function ChecklistPage() {
  const [steps, setSteps] = useState<ChecklistStep[]>(INITIAL_CHECKLIST)
  const [collapsed, setCollapsed] = useState<Record<Phase, boolean>>({
    pre: false,
    install: false,
    post: false,
  })

  const handleChange = (id: string, changes: Partial<ChecklistStep>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...changes } : s)))
  }

  const phases: Phase[] = ['pre', 'install', 'post']

  const totalDone = steps.filter((s) => s.completed).length
  const pct = Math.round((totalDone / steps.length) * 100)

  return (
    <div className="min-h-dvh px-4 pt-12 pb-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ClipboardCheck size={24} className="text-[#F5A623]" />
        <h1 className="text-white font-bold text-xl">Checklist ติดตั้ง</h1>
      </div>

      {/* Progress */}
      <div className="bg-white/8 border border-white/12 rounded-2xl p-4">
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-white/50 text-xs">ความคืบหน้า</p>
            <p className="text-white font-bold text-2xl">{totalDone}/{steps.length}</p>
          </div>
          <p className="text-[#F5A623] font-bold text-2xl">{pct}%</p>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#F5A623] to-[#10B981] rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Phases */}
      {phases.map((phase) => {
        const cfg = PHASE_CONFIG[phase]
        const phaseSteps = steps.filter((s) => s.phase === phase)
        const phaseDone = phaseSteps.filter((s) => s.completed).length
        const isCollapsed = collapsed[phase]

        return (
          <div key={phase} className="space-y-2">
            <button
              className="w-full flex items-center justify-between"
              onClick={() => setCollapsed((c) => ({ ...c, [phase]: !c[phase] }))}
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color} ${cfg.bg}`}>
                  {cfg.label}
                </span>
                <span className="text-white/50 text-sm">{phaseDone}/{phaseSteps.length}</span>
              </div>
              {isCollapsed ? (
                <ChevronDown size={16} className="text-white/40" />
              ) : (
                <ChevronUp size={16} className="text-white/40" />
              )}
            </button>

            {!isCollapsed && (
              <div className="space-y-2">
                {phaseSteps.map((step, i) => (
                  <ChecklistItem
                    key={step.id}
                    step={step}
                    index={steps.indexOf(step)}
                    onChange={handleChange}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Submit */}
      {pct === 100 && (
        <button className="w-full py-4 rounded-2xl bg-[#10B981] text-white font-bold text-lg flex items-center justify-center gap-2 active:bg-emerald-600 transition-colors">
          <ClipboardCheck size={22} />
          ส่ง Checklist
        </button>
      )}
    </div>
  )
}

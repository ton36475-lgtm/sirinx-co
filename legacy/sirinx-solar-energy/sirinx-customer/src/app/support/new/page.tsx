'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X, Send, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import type { TicketCategory } from '@/types'

const categories: { key: TicketCategory; label: string; icon: string }[] = [
  { key: 'equipment', label: 'อุปกรณ์/ระบบ', icon: '⚡' },
  { key: 'billing', label: 'การเงิน/ใบเสร็จ', icon: '💳' },
  { key: 'installation', label: 'การติดตั้ง', icon: '🔧' },
  { key: 'monitoring', label: 'ระบบ Monitoring', icon: '📊' },
  { key: 'other', label: 'อื่นๆ', icon: '💬' },
]

export default function NewTicketPage() {
  const router = useRouter()
  const [category, setCategory] = useState<TicketCategory>('equipment')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const remaining = 3 - images.length
    Array.from(files).slice(0, remaining).forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImages(prev => [...prev, ev.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return
    setLoading(true)
    // Simulate API call
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6 pb-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-[#10B981]/20 flex items-center justify-center mb-4">
          <CheckCircle size={36} className="text-[#10B981]" />
        </div>
        <h2 className="text-white font-bold text-xl mb-2">ส่งเรื่องแล้ว!</h2>
        <p className="text-white/50 text-sm mb-1">ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง</p>
        <p className="text-white/30 text-xs mb-8">ติดตามสถานะได้ที่หน้าศูนย์ช่วยเหลือ</p>
        <Link
          href="/support"
          className="bg-[#F5A623] text-[#0A2342] font-semibold px-8 py-3 rounded-xl"
        >
          ดู tickets ของฉัน
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/support" className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
          <ArrowLeft size={18} className="text-white/70" />
        </Link>
        <div>
          <h1 className="text-white font-bold text-xl">แจ้งปัญหาใหม่</h1>
          <p className="text-white/50 text-xs">กรอกรายละเอียดให้ครบถ้วน</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category */}
        <div>
          <label className="text-white/60 text-xs font-medium uppercase tracking-wide block mb-2">
            ประเภทปัญหา
          </label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className={`py-2.5 px-2 rounded-xl border text-xs text-center transition-all ${
                  category === key
                    ? 'bg-[#F5A623]/15 border-[#F5A623]/50 text-[#F5A623]'
                    : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                }`}
              >
                <span className="text-lg block mb-1">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-white/60 text-xs font-medium uppercase tracking-wide block mb-2">
            หัวข้อปัญหา *
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="เช่น Inverter แสดงไฟเตือน, ผลิตไฟน้อยลง"
            required
            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#F5A623]/50 focus:bg-white/8 transition-all"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-white/60 text-xs font-medium uppercase tracking-wide block mb-2">
            รายละเอียด *
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="อธิบายปัญหาที่พบ เกิดเมื่อไหร่ มีอาการอย่างไร..."
            required
            rows={4}
            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-[#F5A623]/50 focus:bg-white/8 transition-all resize-none"
          />
          <p className="text-white/25 text-xs mt-1">{description.length}/500</p>
        </div>

        {/* Image Upload */}
        <div>
          <label className="text-white/60 text-xs font-medium uppercase tracking-wide block mb-2">
            รูปภาพประกอบ (สูงสุด 3 รูป)
          </label>
          <div className="flex items-center gap-3 flex-wrap">
            {images.map((img, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={`upload-${i}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                >
                  <X size={10} className="text-white" />
                </button>
              </div>
            ))}
            {images.length < 3 && (
              <label className="w-20 h-20 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-white/30 transition-colors">
                <Upload size={18} className="text-white/30" />
                <span className="text-white/25 text-[10px] mt-1">เพิ่มรูป</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !title.trim() || !description.trim()}
          className="w-full flex items-center justify-center gap-2 bg-[#F5A623] text-[#0A2342] font-bold py-3.5 rounded-xl text-base disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F5A623]/90 transition-all active:scale-[0.98]"
        >
          {loading ? (
            <span className="animate-spin w-5 h-5 border-2 border-[#0A2342]/30 border-t-[#0A2342] rounded-full" />
          ) : (
            <>
              <Send size={18} />
              ส่งเรื่อง
            </>
          )}
        </button>
      </form>
    </div>
  )
}

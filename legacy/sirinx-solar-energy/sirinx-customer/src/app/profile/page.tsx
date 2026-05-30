'use client'

import { useState } from 'react'
import { User, Phone, Mail, MapPin, Shield, LogOut, ChevronRight, FileText, Wrench } from 'lucide-react'
import { useCustomer } from '@/hooks/useCustomer'
import Link from 'next/link'

export default function ProfilePage() {
  const { customer } = useCustomer()
  const [editing, setEditing] = useState(false)
  const [phone, setPhone] = useState(customer.phone)
  const [email, setEmail] = useState(customer.email)

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <h1 className="text-white font-bold text-xl">โปรไฟล์</h1>

      {/* Avatar + Name */}
      <div className="flex flex-col items-center py-4">
        <div className="w-20 h-20 rounded-full bg-[#F5A623]/20 border-2 border-[#F5A623]/50 flex items-center justify-center mb-3">
          <User size={36} className="text-[#F5A623]" />
        </div>
        <h2 className="text-white font-bold text-lg">{customer.name}</h2>
        <p className="text-white/40 text-sm">{customer.contractNumber}</p>
        <div className="flex items-center gap-1.5 mt-2 bg-[#10B981]/15 px-3 py-1 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-[#10B981] text-xs font-medium">ระบบทำงานปกติ</span>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <p className="text-white/60 text-xs font-medium uppercase tracking-wide">ข้อมูลส่วนตัว</p>
          <button
            onClick={() => setEditing(!editing)}
            className="text-[#F5A623] text-xs font-medium"
          >
            {editing ? 'บันทึก' : 'แก้ไข'}
          </button>
        </div>

        <div className="divide-y divide-white/5">
          {/* Phone */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Phone size={16} className="text-white/30 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-white/40 text-xs">โทรศัพท์</p>
              {editing ? (
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="text-white text-sm bg-transparent border-b border-[#F5A623]/40 outline-none w-full"
                />
              ) : (
                <p className="text-white text-sm">{customer.phone}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Mail size={16} className="text-white/30 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-white/40 text-xs">อีเมล</p>
              {editing ? (
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="text-white text-sm bg-transparent border-b border-[#F5A623]/40 outline-none w-full"
                />
              ) : (
                <p className="text-white text-sm">{customer.email}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start gap-3 px-4 py-3.5">
            <MapPin size={16} className="text-white/30 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-white/40 text-xs">ที่อยู่ติดตั้ง</p>
              <p className="text-white text-sm leading-relaxed">{customer.address}</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-white/60 text-xs font-medium uppercase tracking-wide">ข้อมูลระบบ</p>
        </div>
        <div className="divide-y divide-white/5">
          {[
            { label: 'ขนาดระบบ', value: `${customer.systemSize} kWp` },
            {
              label: 'วันที่ติดตั้ง',
              value: customer.installationDate
                ? new Date(customer.installationDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
                : '-'
            },
            { label: 'เลขที่สัญญา', value: customer.contractNumber },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-4 py-3.5">
              <p className="text-white/50 text-sm">{label}</p>
              <p className="text-white font-medium text-sm">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {[
          { href: '/warranty', icon: Shield, label: 'เอกสารรับประกัน', color: 'text-[#10B981]' },
          { href: '/billing', icon: FileText, label: 'ใบแจ้งหนี้ทั้งหมด', color: 'text-purple-400' },
          { href: '/support/new', icon: Wrench, label: 'แจ้งซ่อมบำรุง', color: 'text-[#F5A623]' },
        ].map(({ href, icon: Icon, label, color }, i, arr) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition-colors ${i < arr.length - 1 ? 'border-b border-white/5' : ''}`}
          >
            <div className="flex items-center gap-3">
              <Icon size={16} className={color} />
              <p className="text-white/80 text-sm">{label}</p>
            </div>
            <ChevronRight size={16} className="text-white/20" />
          </Link>
        ))}
      </div>

      {/* Logout */}
      <button className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl py-3.5 text-sm font-medium hover:bg-red-500/15 transition-colors">
        <LogOut size={16} />
        ออกจากระบบ
      </button>

      <p className="text-center text-white/20 text-xs pb-2">SIRINX Solar v1.0 · ติดต่อ: support@sirinx.co.th</p>
    </div>
  )
}

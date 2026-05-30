'use client'

import { useState } from 'react'
import { Search, Filter } from 'lucide-react'
import { useContractor } from '@/hooks/useContractor'
import JobCard from '@/components/JobCard'
import type { JobStatus } from '@/types'

const TABS: { label: string; value: JobStatus | 'all' }[] = [
  { label: 'ทั้งหมด', value: 'all' },
  { label: 'รอรับ', value: 'pending' },
  { label: 'กำลังทำ', value: 'installing' },
  { label: 'เสร็จ', value: 'completed' },
]

export default function JobsPage() {
  const { jobs } = useContractor()
  const [tab, setTab] = useState<JobStatus | 'all'>('all')
  const [search, setSearch] = useState('')

  const filtered = jobs.filter((j) => {
    const matchTab = tab === 'all' || j.status === tab ||
      (tab === 'installing' && ['accepted', 'traveling', 'installing', 'testing'].includes(j.status))
    const matchSearch = !search ||
      j.customer.name.includes(search) ||
      j.job_number.includes(search) ||
      (j.customer.company || '').includes(search)
    return matchTab && matchSearch
  })

  return (
    <div className="min-h-dvh px-4 pt-12 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-white font-bold text-xl">รายการงาน</h1>
        <button className="w-9 h-9 rounded-xl bg-white/8 border border-white/12 flex items-center justify-center">
          <Filter size={16} className="text-white/60" />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหางาน, ลูกค้า..."
          className="w-full bg-white/8 border border-white/12 rounded-2xl pl-9 pr-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#F5A623]/50"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {TABS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === value
                ? 'bg-[#F5A623] text-[#0A2342]'
                : 'bg-white/8 text-white/60 border border-white/12'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Job list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-white/40">ไม่พบงาน</p>
          </div>
        ) : (
          filtered.map((job) => <JobCard key={job.id} job={job} />)
        )}
      </div>
    </div>
  )
}

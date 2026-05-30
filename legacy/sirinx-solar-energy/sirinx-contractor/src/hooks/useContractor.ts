'use client'

import { useState, useEffect } from 'react'
import type { Job, Contractor, JobStatus, InventoryItem, EarningsRecord } from '@/types'
import { MOCK_CONTRACTOR, MOCK_JOBS, MOCK_EARNINGS, MOCK_INVENTORY } from '@/lib/mockData'
import { supabase, isSupabaseReady } from '@/lib/supabase'

export function useContractor() {
  const [contractor, setContractor] = useState<Contractor>(MOCK_CONTRACTOR)
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isSupabaseReady || !supabase) return
    // TODO: fetch real data from Supabase
  }, [])

  const todayJobs = jobs.filter(
    (j) => j.scheduled_date === new Date().toISOString().split('T')[0]
  )
  const pendingJobs = jobs.filter((j) => j.status === 'pending')
  const activeJobs = jobs.filter(
    (j) => !['completed', 'cancelled', 'pending'].includes(j.status)
  )

  return { contractor, jobs, todayJobs, pendingJobs, activeJobs, loading }
}

export function useJob(id: string) {
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const found = MOCK_JOBS.find((j) => j.id === id) || null
    setJob(found)
    setLoading(false)

    if (!isSupabaseReady || !supabase) return
    // TODO: fetch real job from Supabase
  }, [id])

  const updateStatus = async (status: JobStatus) => {
    if (!job) return
    const updated = { ...job, status, updated_at: new Date().toISOString() }
    setJob(updated)

    if (!isSupabaseReady || !supabase) return
    await supabase.from('jobs').update({ status }).eq('id', job.id)
  }

  return { job, loading, updateStatus }
}

export function useEarnings() {
  const [records] = useState<EarningsRecord[]>(MOCK_EARNINGS)

  const thisMonth = records.reduce((sum, r) => sum + r.amount, 0)
  const today = records[records.length - 1]?.amount || 0

  return { records, thisMonth, today }
}

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>(MOCK_INVENTORY)

  const lowStock = items.filter((i) => i.quantity <= i.min_quantity)

  return { items, lowStock }
}

import { useState, useEffect, useCallback } from 'react'
import { setActiveOrgId } from '@/api/client'
import type { Org } from '@/types'

const ORG_STORAGE_KEY = 'future:active_org_id'

let listeners: Array<(org: Org | null) => void> = []
let currentOrg: Org | null = null
let orgList: Org[] = []

function broadcast(org: Org | null) {
  currentOrg = org
  setActiveOrgId(org?.id ?? null)
  listeners.forEach((fn) => fn(org))
  if (org) {
    localStorage.setItem(ORG_STORAGE_KEY, org.id)
  } else {
    localStorage.removeItem(ORG_STORAGE_KEY)
  }
}

export function useOrg() {
  const [activeOrg, setActiveOrgState] = useState<Org | null>(currentOrg)
  const [orgs, setOrgs] = useState<Org[]>(orgList)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handler = (org: Org | null) => setActiveOrgState(org)
    listeners.push(handler)
    return () => {
      listeners = listeners.filter((fn) => fn !== handler)
    }
  }, [])

  const loadOrgs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Inline fetch to avoid circular dep with endpoints
      const res = await fetch(
        `${(import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'}/orgs`,
        { headers: { 'Content-Type': 'application/json' } },
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as Org[]
      orgList = data
      setOrgs(data)

      // Restore previously selected org
      const stored = localStorage.getItem(ORG_STORAGE_KEY)
      if (!currentOrg) {
        const restored = data.find((o) => o.id === stored) ?? data[0] ?? null
        broadcast(restored)
        setActiveOrgState(restored)
      }
    } catch (e) {
      // Offline / dev: use mock org
      const mock: Org = {
        id: 'org_demo',
        slug: 'demo',
        name: 'Demo Organisation',
        theme_color: '#3B82F6',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      orgList = [mock]
      setOrgs([mock])
      if (!currentOrg) {
        broadcast(mock)
        setActiveOrgState(mock)
      }
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const switchOrg = useCallback((org: Org) => {
    broadcast(org)
  }, [])

  return { activeOrg, orgs, loading, error, loadOrgs, switchOrg }
}

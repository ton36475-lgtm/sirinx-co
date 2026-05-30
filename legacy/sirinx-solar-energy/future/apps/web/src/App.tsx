import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useOrg } from '@/hooks/useOrg'

// Pages
import { Dashboard } from '@/pages/Dashboard'
import { Orgs } from '@/pages/Orgs'
import { Workspaces } from '@/pages/Workspaces'
import { Agents } from '@/pages/Agents'
import { Tasks } from '@/pages/Tasks'
import { TaskDetail } from '@/pages/TaskDetail'
import { Brain } from '@/pages/Brain'
import { Policies } from '@/pages/Policies'
import { Approvals } from '@/pages/Approvals'
import { Budget } from '@/pages/Budget'
import { Providers } from '@/pages/Providers'
import { AuditLog } from '@/pages/AuditLog'
import { Settings } from '@/pages/Settings'

function AppRoutes() {
  const { loadOrgs } = useOrg()

  useEffect(() => {
    loadOrgs()
  }, [loadOrgs])

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/orgs" element={<Orgs />} />
      <Route path="/workspaces" element={<Workspaces />} />
      <Route path="/agents" element={<Agents />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/tasks/:id" element={<TaskDetail />} />
      <Route path="/brain" element={<Brain />} />
      <Route path="/policies" element={<Policies />} />
      <Route path="/approvals" element={<Approvals />} />
      <Route path="/budget" element={<Budget />} />
      <Route path="/providers" element={<Providers />} />
      <Route path="/audit" element={<AuditLog />} />
      <Route path="/settings" element={<Settings />} />
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

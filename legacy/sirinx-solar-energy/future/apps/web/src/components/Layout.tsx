import { useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useOrg } from '@/hooks/useOrg'

interface LayoutProps {
  children: ReactNode
  title?: string
  headerActions?: ReactNode
}

export function Layout({ children, title, headerActions }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { activeOrg } = useOrg()

  return (
    <div className="flex h-screen overflow-hidden bg-navy-900">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        orgName={activeOrg?.name ?? 'Future'}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} actions={headerActions} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

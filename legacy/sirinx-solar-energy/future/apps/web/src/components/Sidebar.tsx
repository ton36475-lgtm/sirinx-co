import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  ListTodo,
  Bot,
  Brain,
  CheckCircle,
  DollarSign,
  Shield,
  Cloud,
  FileText,
  Settings,
  ChevronLeft,
  Zap,
} from 'lucide-react'

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Tasks', to: '/tasks', icon: <ListTodo className="h-4 w-4" /> },
  { label: 'Agents & Packs', to: '/agents', icon: <Bot className="h-4 w-4" /> },
  { label: 'Company Brain', to: '/brain', icon: <Brain className="h-4 w-4" /> },
  { label: 'Approvals', to: '/approvals', icon: <CheckCircle className="h-4 w-4" /> },
  { label: 'Budget', to: '/budget', icon: <DollarSign className="h-4 w-4" /> },
  { label: 'Policies', to: '/policies', icon: <Shield className="h-4 w-4" /> },
  { label: 'Providers', to: '/providers', icon: <Cloud className="h-4 w-4" /> },
  { label: 'Audit Log', to: '/audit', icon: <FileText className="h-4 w-4" /> },
  { label: 'Settings', to: '/settings', icon: <Settings className="h-4 w-4" /> },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  orgName: string
}

export function Sidebar({ collapsed, onToggle, orgName }: SidebarProps) {
  return (
    <aside
      className={clsx(
        'flex h-full flex-col border-r border-slate-800 bg-navy-900 transition-all duration-200',
        collapsed ? 'w-[56px]' : 'w-[220px]',
      )}
    >
      {/* Logo */}
      <div
        className={clsx(
          'flex h-14 items-center border-b border-slate-800 px-3',
          collapsed ? 'justify-center' : 'gap-2.5',
        )}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-electric-500">
          <Zap className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-100">Future</p>
            <p className="truncate text-xs text-slate-500">{orgName}</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-100',
                    isActive
                      ? 'bg-electric-500/10 text-electric-400'
                      : 'text-slate-400 hover:bg-navy-800 hover:text-slate-200',
                    collapsed && 'justify-center',
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-slate-800 p-2">
        <button
          onClick={onToggle}
          className={clsx(
            'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-slate-500 transition-colors hover:bg-navy-800 hover:text-slate-300',
            collapsed && 'justify-center',
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={clsx('h-4 w-4 shrink-0 transition-transform', collapsed && 'rotate-180')}
          />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}

import { useState } from 'react'
import { clsx } from 'clsx'
import { ChevronDown, Building2, Plus, Check } from 'lucide-react'
import { useOrg } from '@/hooks/useOrg'
import type { Org } from '@/types'

interface HeaderProps {
  title?: string
  actions?: React.ReactNode
}

export function Header({ title, actions }: HeaderProps) {
  const { activeOrg, orgs, switchOrg } = useOrg()
  const [open, setOpen] = useState(false)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-navy-900/80 px-6 backdrop-blur-sm">
      {/* Page title */}
      <div className="flex items-center gap-3">
        {title && <h1 className="text-sm font-semibold text-slate-200">{title}</h1>}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {actions}

        {/* Org Switcher */}
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className={clsx(
              'flex items-center gap-2 rounded-lg border border-slate-700 bg-navy-800 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100',
              open && 'border-electric-500/50 text-slate-100',
            )}
          >
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            <span className="max-w-[140px] truncate">{activeOrg?.name ?? 'Select Org'}</span>
            <ChevronDown className={clsx('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
          </button>

          {open && (
            <OrgDropdown
              orgs={orgs}
              active={activeOrg}
              onSelect={(org) => {
                switchOrg(org)
                setOpen(false)
              }}
              onClose={() => setOpen(false)}
            />
          )}
        </div>
      </div>
    </header>
  )
}

interface OrgDropdownProps {
  orgs: Org[]
  active: Org | null
  onSelect: (org: Org) => void
  onClose: () => void
}

function OrgDropdown({ orgs, active, onSelect, onClose }: OrgDropdownProps) {
  return (
    <>
      {/* Click-outside overlay */}
      <div className="fixed inset-0 z-30" onClick={onClose} />

      <div className="absolute right-0 top-full z-40 mt-1.5 w-56 animate-fade-in rounded-xl border border-slate-700 bg-navy-800 shadow-2xl">
        <div className="border-b border-slate-800 px-3 py-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Organisations</p>
        </div>

        <ul className="max-h-56 overflow-y-auto p-1">
          {orgs.map((org) => (
            <li key={org.id}>
              <button
                onClick={() => onSelect(org)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-navy-700 hover:text-slate-100"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-electric-500/20 text-electric-400 text-xs font-bold">
                  {org.name[0]}
                </div>
                <span className="flex-1 truncate text-left">{org.name}</span>
                {active?.id === org.id && <Check className="h-3.5 w-3.5 text-electric-400" />}
              </button>
            </li>
          ))}
        </ul>

        <div className="border-t border-slate-800 p-1">
          <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-navy-700 hover:text-slate-200">
            <Plus className="h-3.5 w-3.5" />
            New Organisation
          </button>
        </div>
      </div>
    </>
  )
}

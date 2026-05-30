'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Briefcase, Calendar, DollarSign, User } from 'lucide-react'

const navItems = [
  { href: '/', label: 'หน้าแรก', icon: Home },
  { href: '/jobs', label: 'งาน', icon: Briefcase },
  { href: '/schedule', label: 'ปฏิทิน', icon: Calendar },
  { href: '/earnings', label: 'รายได้', icon: DollarSign },
  { href: '/profile', label: 'โปรไฟล์', icon: User },
]

export default function ContractorNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A2342] border-t border-white/10">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-lg transition-colors ${
                active
                  ? 'text-[#F5A623]'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

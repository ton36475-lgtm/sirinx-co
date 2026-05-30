'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Zap, BarChart2, HeadphonesIcon, User } from 'lucide-react'

const navItems = [
  { href: '/', icon: Home, label: 'หน้าแรก' },
  { href: '/installation', icon: Zap, label: 'ติดตั้ง' },
  { href: '/production', icon: BarChart2, label: 'ผลิตไฟ' },
  { href: '/support', icon: HeadphonesIcon, label: 'แจ้งปัญหา' },
  { href: '/profile', icon: User, label: 'โปรไฟล์' },
]

export default function CustomerNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A2342] border-t border-white/10 pb-safe">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                active
                  ? 'text-[#F5A623]'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <Icon
                size={22}
                className={active ? 'drop-shadow-[0_0_6px_rgba(245,166,35,0.8)]' : ''}
              />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

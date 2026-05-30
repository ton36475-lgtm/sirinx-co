'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/lib/store';

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen } = useUIStore();

  const menuItems = [
    { label: 'Dashboard', href: '/', icon: '📊' },
    { label: 'Workflows', href: '/workflows', icon: '⚙️' },
    { label: 'Analytics', href: '/analytics', icon: '📈' },
    { label: 'GitHub', href: '/github', icon: '🐙' },
    { label: 'System Health', href: '/health', icon: '❤️' },
    { label: 'Admin', href: '/admin', icon: '👨‍💼' },
    { label: 'Settings', href: '/settings', icon: '⚙️' },
  ];

  return (
    <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 dark:bg-slate-950 text-white transition-all duration-300 flex flex-col`}>
      <div className="p-4 border-b border-slate-700">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center font-bold">A</div>
          {sidebarOpen && <span className="font-bold text-lg">Automation</span>}
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              pathname === item.href
                ? 'bg-primary text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            {sidebarOpen && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm">
          {sidebarOpen ? 'Logout' : '🚪'}
        </button>
      </div>
    </aside>
  );
}

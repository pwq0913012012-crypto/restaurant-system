'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, UtensilsCrossed, MapPin, Users, BarChart3,
  LogOut, Menu as MenuIcon, X
} from 'lucide-react'

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: '總覽' },
  { href: '/admin/menu', icon: UtensilsCrossed, label: '菜單管理' },
  { href: '/admin/tables', icon: MapPin, label: '桌位管理' },
  { href: '/admin/users', icon: Users, label: '帳號管理' },
  { href: '/admin/reports', icon: BarChart3, label: '營收報表' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-surface border-r border-surface-light flex flex-col transform transition-transform lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 flex items-center justify-between border-b border-surface-light">
          <h1 className="text-xl font-bold text-accent">管理後台</h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded hover:bg-surface-light">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted hover:text-foreground hover:bg-surface-light'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-surface-light">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-light w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">登出</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-surface border-b border-surface-light px-4 py-3 flex items-center lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-1 rounded hover:bg-surface-light mr-3">
            <MenuIcon className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-accent">管理後台</h1>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}

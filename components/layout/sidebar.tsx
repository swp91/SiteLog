'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Building2, Calendar, BarChart2,
  DollarSign, Wrench, LogOut, Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { useAppStore } from '@/stores/app-store'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: '대시보드' },
  { href: '/sites',     icon: Building2,       label: '현장' },
  { href: '/calendar',  icon: Calendar,        label: '통합 달력' },
  { href: '/stats',     icon: BarChart2,       label: '월별 통계' },
  { href: '/payroll',   icon: DollarSign,      label: '노무비' },
  { href: '/trades',    icon: Wrench,          label: '공종 · 업체' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAppStore()

  return (
    <aside className="hidden wide:flex flex-col w-[244px] shrink-0 h-screen bg-white border-r border-slate-200 fixed top-0 left-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <Building2 size={16} className="text-white" />
        </div>
        <span className="text-[0.9375rem] font-bold text-ink">현장출근기록</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 mx-2 px-3 h-10 rounded-sm text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800',
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Profile footer */}
      <div className="border-t border-slate-100 p-3">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 p-2 rounded-sm transition-colors',
            pathname === '/settings'
              ? 'bg-blue-50'
              : 'hover:bg-slate-50',
          )}
        >
          <Avatar name={user.avatar} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-[0.8125rem] font-semibold text-ink truncate">{user.name}</p>
            <p className="text-[0.6875rem] text-slate-400 truncate">{user.role}</p>
          </div>
          <Settings size={15} className="text-slate-400 shrink-0" />
        </Link>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full mt-1 px-2 py-1.5 rounded-xs text-[0.8125rem] text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={14} />
          로그아웃
        </button>
      </div>
    </aside>
  )
}

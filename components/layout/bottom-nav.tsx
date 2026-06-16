'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Building2, Calendar, BarChart2, MoreHorizontal, WalletCards } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app-store'

const MANAGER_TABS = [
  { href: '/dashboard', icon: Home,          label: '홈' },
  { href: '/sites',     icon: Building2,     label: '현장' },
  { href: '/calendar',  icon: Calendar,      label: '달력' },
  { href: '/stats',     icon: BarChart2,     label: '통계' },
  { href: '/more',      icon: MoreHorizontal, label: '더보기' },
]

const WORKER_TABS = [
  { href: '/worker',    icon: WalletCards,   label: '공수' },
  { href: '/settings',  icon: MoreHorizontal, label: '내 정보' },
]

export function BottomNav() {
  const pathname = usePathname()
  const userType = useAppStore((s) => s.user.type)
  const tabs = userType === 'worker' ? WORKER_TABS : MANAGER_TABS

  return (
    <nav className="wide:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-slate-200">
      <div className="flex">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/more' && pathname.startsWith(href + '/'))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors',
                active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600',
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[0.625rem] font-semibold">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

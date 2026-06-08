'use client'

import type { ReactNode } from 'react'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'
import { Toast } from '@/components/ui'
import { useAppStore } from '@/stores/app-store'

export function AppShell({ children }: { children: ReactNode }) {
  const toast = useAppStore((s) => s.toast)

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="wide:pl-[244px] pb-[72px] wide:pb-0 min-h-screen">
        {children}
      </main>
      <BottomNav />
      <Toast message={toast} />
    </div>
  )
}

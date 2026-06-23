'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'
import { Toast } from '@/components/ui'
import { useAppStore } from '@/stores/app-store'

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const toast = useAppStore((s) => s.toast)
  const authed = useAppStore((s) => s.authed)
  const authInitialized = useAppStore((s) => s.authInitialized)

  useEffect(() => {
    if (!authInitialized) return

    if (!authed) {
      router.replace('/login')
    } else {
      const state = useAppStore.getState()
      if (state.user.type === 'worker' && !pathname.startsWith('/worker') && pathname !== '/settings') {
        router.replace('/worker')
      }
      if (state.user.type === 'manager' && pathname.startsWith('/worker')) {
        router.replace('/dashboard')
      }
    }
  }, [authInitialized, authed, pathname, router])

  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <p className="text-[0.8125rem] text-slate-400">사용자 인증 정보를 확인하는 중...</p>
        </div>
      </div>
    )
  }

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

'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'
import { Toast } from '@/components/ui'
import { useAppStore } from '@/stores/app-store'
import { supabase } from '@/lib/supabase'

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const toast = useAppStore((s) => s.toast)
  const logout = useAppStore((s) => s.logout)
  const fetchData = useAppStore((s) => s.fetchData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        logout()
        router.push('/login')
      } else {
        try {
          await fetchData()
        } catch (err) {
          console.error(err)
        } finally {
          if (active) setLoading(false)
        }
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        logout()
        router.push('/login')
      } else if (event === 'SIGNED_IN' && session) {
        try {
          await fetchData()
        } catch (err) {
          console.error(err)
        } finally {
          if (active) setLoading(false)
        }
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [router, logout, fetchData])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <p className="text-[13px] text-slate-400">데이터를 불러오는 중...</p>
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

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BriefcaseBusiness, HardHat, LogIn } from 'lucide-react'
import { Button, Card, Segmented } from '@/components/ui'
import { useAppStore } from '@/stores/app-store'
import type { UserType } from '@/lib/types'

export default function LoginPage() {
  const router = useRouter()
  const [type, setType] = useState<UserType>('manager')
  const authed = useAppStore((s) => s.authed)
  const login = useAppStore((s) => s.login)
  const fetchData = useAppStore((s) => s.fetchData)

  useEffect(() => {
    async function redirectIfAuthed() {
      if (!authed) {
        await fetchData()
      }

      const state = useAppStore.getState()
      if (state.authed) {
        router.replace(state.user.type === 'worker' ? '/worker' : '/dashboard')
      }
    }

    redirectIfAuthed()
  }, [authed, fetchData, router])

  function startDemo() {
    login(type)
    router.push(type === 'worker' ? '/worker' : '/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        <div className="flex flex-col items-center gap-3 mb-8">
          <img src="/Sitelog-logo.svg" alt="SiteLog Logo" className="w-16 h-16 object-contain" />
          <div className="text-center">
            <h1 className="text-[1.375rem] font-bold text-ink">SiteLog</h1>
            <p className="text-sm text-slate-400 mt-1">현장 출근 기록 데모</p>
          </div>
        </div>

        <Card className="flex flex-col gap-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              {type === 'worker' ? <HardHat size={22} /> : <BriefcaseBusiness size={22} />}
            </div>
            <div>
              <p className="text-[0.9375rem] font-bold text-ink">사용자 타입 선택</p>
              <p className="text-[0.8125rem] text-slate-500 mt-1 leading-5">
                관리자용 현장 관리와 노동자용 개인 공수 장부 중 하나로 시작합니다.
              </p>
            </div>
          </div>

          <Segmented
            full
            value={type}
            onChange={(value) => setType(value as UserType)}
            options={[
              { value: 'manager', label: '관리자' },
              { value: 'worker', label: '노동자' },
            ]}
          />

          <Button full size="lg" icon={<LogIn size={16} />} onClick={startDemo}>
            데모 시작
          </Button>
        </Card>
      </div>
    </div>
  )
}

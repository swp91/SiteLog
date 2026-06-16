'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HardHat, LogIn } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { useAppStore } from '@/stores/app-store'

export default function LoginPage() {
  const router = useRouter()
  const authed = useAppStore((s) => s.authed)
  const login = useAppStore((s) => s.login)
  const fetchData = useAppStore((s) => s.fetchData)

  useEffect(() => {
    async function redirectIfAuthed() {
      if (!authed) {
        await fetchData()
      }

      if (useAppStore.getState().authed) {
        router.replace('/dashboard')
      }
    }

    redirectIfAuthed()
  }, [authed, fetchData, router])

  function startDemo() {
    login()
    router.push('/dashboard')
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
              <HardHat size={22} />
            </div>
            <div>
              <p className="text-[0.9375rem] font-bold text-ink">데모 모드</p>
              <p className="text-[0.8125rem] text-slate-500 mt-1 leading-5">
                외부 백엔드 연결 없이 샘플 현장과 출근 기록으로 화면을 확인합니다.
              </p>
            </div>
          </div>

          <Button full size="lg" icon={<LogIn size={16} />} onClick={startDemo}>
            데모 시작
          </Button>
        </Card>
      </div>
    </div>
  )
}

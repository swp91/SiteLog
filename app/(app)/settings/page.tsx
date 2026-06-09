'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Bell, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { TopBar } from '@/components/layout/top-bar'
import { Card, Avatar, Button } from '@/components/ui'

export default function SettingsPage() {
  const router = useRouter()
  const { user, sites, records, logout } = useAppStore()

  const [alerts, setAlerts] = useState({
    missing: true,
    weekly: false,
    trade: true,
  })

  const totalEntries = Object.keys(records).length
  const activeSiteCount = sites.filter((s) => s.status !== '완료').length

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  return (
    <div className="max-w-[720px] mx-auto px-4 pb-8">
      <TopBar title="내 정보 · 설정" />

      {/* Profile card */}
      <Card className="mt-6 mb-5">
        <div className="flex items-center gap-4 mb-4">
          <Avatar name={user.avatar} size="xl" />
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-ink">{user.name}</p>
            <p className="text-[0.8125rem] text-slate-500">{user.role}</p>
            {user.company && <p className="text-xs text-slate-400">{user.company}</p>}
          </div>
          <Button size="sm" variant="outline">편집</Button>
        </div>
        <div className="flex gap-4 pt-3 border-t border-slate-100">
          <div className="text-center flex-1">
            <p className="text-xl font-bold text-blue-600 tabular-nums">{activeSiteCount}</p>
            <p className="text-[0.6875rem] text-slate-400 mt-0.5">담당현장</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-xl font-bold text-ink tabular-nums">{totalEntries}</p>
            <p className="text-[0.6875rem] text-slate-400 mt-0.5">누적입력</p>
          </div>
          {user.joined && (
            <div className="text-center flex-1">
              <p className="text-sm font-bold text-slate-500">{user.joined}</p>
              <p className="text-[0.6875rem] text-slate-400 mt-0.5">가입</p>
            </div>
          )}
        </div>
      </Card>

      {/* Account */}
      <p className="text-xs font-semibold text-slate-400 px-1 mb-2">계정</p>
      <Card className="mb-5 divide-y divide-slate-100 !p-0">
        {[
          { label: '이메일', value: user.email },
          { label: '휴대폰', value: user.phone ?? '미등록' },
          { label: '비밀번호 변경', value: '' },
          { label: '카카오 연결', value: '미연결' },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm font-medium text-ink">{label}</span>
            <div className="flex items-center gap-1">
              {value && <span className="text-[0.8125rem] text-slate-400">{value}</span>}
              <ChevronRight size={15} className="text-slate-300" />
            </div>
          </div>
        ))}
      </Card>

      {/* Notifications */}
      <p className="text-xs font-semibold text-slate-400 px-1 mb-2">알림</p>
      <Card className="mb-5 divide-y divide-slate-100 !p-0">
        {[
          { key: 'missing' as const, label: '미입력 현장 알림', desc: '출근 기록이 없는 현장 알림' },
          { key: 'weekly' as const, label: '주간 요약 리포트', desc: '매주 월요일 지난주 통계 리포트' },
          { key: 'trade' as const, label: '업체 투입 변동 알림', desc: '공종별 인원 변동 시 알림' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center gap-3 px-4 py-3.5">
            <Bell size={16} className="text-slate-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">{label}</p>
              <p className="text-xs text-slate-400">{desc}</p>
            </div>
            <button
              onClick={() => setAlerts((a) => ({ ...a, [key]: !a[key] }))}
              className={`w-11 h-6 rounded-full transition-colors relative ${alerts[key] ? 'bg-blue-600' : 'bg-slate-200'}`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${alerts[key] ? 'left-5.5' : 'left-0.5'}`}
                style={{ left: alerts[key] ? '22px' : '2px' }}
              />
            </button>
          </div>
        ))}
      </Card>

      {/* Logout */}
      <Button
        full
        variant="outline"
        size="lg"
        icon={<LogOut size={16} />}
        onClick={handleLogout}
        className="text-red-500 border-red-200 hover:bg-red-50"
      >
        로그아웃
      </Button>
    </div>
  )
}

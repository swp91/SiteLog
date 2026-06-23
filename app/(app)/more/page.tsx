'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DollarSign, Wrench, Settings, ChevronRight, NotebookText, RefreshCcw } from 'lucide-react'
import { TopBar } from '@/components/layout/top-bar'
import { Card, Avatar, Badge, Button } from '@/components/ui'
import { useAppStore } from '@/stores/app-store'

const ITEMS = [
  { href: '/journals', icon: NotebookText, label: '일지', desc: '현장 작업 내용을 게시글처럼 기록' },
  { href: '/payroll', icon: DollarSign, label: '노무비 계산', desc: '공종별 일당 × man-day' },
  { href: '/trades',  icon: Wrench,     label: '공종 · 업체',  desc: '협력사 관리 및 일당 설정' },
  { href: '/settings', icon: Settings,  label: '내 정보 · 설정', desc: '프로필, 계정, 알림 관리' },
]

export default function MorePage() {
  const router = useRouter()
  const { user, switchUserType, flash } = useAppStore()
  const nextType = user.type === 'worker' ? 'manager' : 'worker'
  const nextLabel = user.type === 'worker' ? '관리자 모드로 전환' : '노동자 모드로 전환'

  function handleSwitchType() {
    switchUserType(nextType)
    flash(nextLabel)
    router.push(nextType === 'worker' ? '/worker' : '/dashboard')
  }

  return (
    <div className="max-w-[720px] mx-auto px-4 pb-8">
      <TopBar title="더보기" />

      {/* 모바일 프로필 & 역할 전환 카드 */}
      <Card className="mt-4 mb-4 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={user.avatar} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-ink">{user.name}</p>
              <Badge tone={user.type === 'worker' ? 'amber' : 'blue'}>
                {user.type === 'worker' ? '노동자' : '관리자'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user.email || '이메일 없음'}</p>
          </div>
        </div>
        <Button full variant="secondary" size="sm" icon={<RefreshCcw size={14} />} onClick={handleSwitchType}>
          {nextLabel}
        </Button>
      </Card>

      <div className="flex flex-col gap-3">
        {ITEMS.map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href}>
            <Card hover className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Icon size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-[0.9375rem] font-semibold text-ink">{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { DollarSign, Wrench, Settings, ChevronRight } from 'lucide-react'
import { TopBar } from '@/components/layout/top-bar'
import { Card } from '@/components/ui'

const ITEMS = [
  { href: '/payroll', icon: DollarSign, label: '노무비 계산', desc: '공종별 일당 × man-day' },
  { href: '/trades',  icon: Wrench,     label: '공종 · 업체',  desc: '협력사 관리 및 일당 설정' },
  { href: '/settings', icon: Settings,  label: '내 정보 · 설정', desc: '프로필, 계정, 알림 관리' },
]

export default function MorePage() {
  return (
    <div className="max-w-[720px] mx-auto px-4 pb-8">
      <TopBar title="더보기" />
      <div className="pt-4 flex flex-col gap-3">
        {ITEMS.map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href}>
            <Card hover className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Icon size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-ink">{label}</p>
                <p className="text-[12px] text-slate-400">{desc}</p>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

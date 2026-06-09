'use client'

import Link from 'next/link'
import { useAppStore } from '@/stores/app-store'
import { TopBar } from '@/components/layout/top-bar'
import { Card, Badge, TradeDot } from '@/components/ui'
import { dayTotal, dayEntries, allSitesDayTotal, ymd, addDays, fmtKShort, wonShort } from '@/lib/utils'
import type { SiteStatus } from '@/lib/types'

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)
const todayStr = ymd(TODAY)

const statusTone: Record<SiteStatus, 'blue' | 'amber' | 'slate'> = {
  '진행중': 'blue',
  '마감임박': 'amber',
  '완료': 'slate',
}

export default function DashboardPage() {
  const { user, sites, trades, records } = useAppStore()

  const hour = TODAY.getHours()
  const greeting = hour < 12 ? '좋은 아침이에요' : hour < 18 ? '안녕하세요' : '수고하셨어요'

  const activeSites = sites.filter((s) => s.status !== '완료')
  const todayTotal = allSitesDayTotal(records, sites.map((s) => s.id), todayStr)

  // Last 7 days bar chart data
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(TODAY, i - 6)
    const total = allSitesDayTotal(records, sites.map((s) => s.id), ymd(d))
    return { date: d, total }
  })
  const maxDay = Math.max(...last7.map((d) => d.total), 1)

  return (
    <div className="max-w-[1200px] mx-auto px-4 pb-8">
      <TopBar />

      {/* Greeting */}
      <div className="pt-6 pb-4">
        <p className="text-sm text-slate-500">{greeting},</p>
        <h1 className="text-2xl font-bold text-ink">{user.name} 님</h1>
      </div>

      {/* Hero grid */}
      <div className="grid wide:grid-cols-2 gap-4 mb-6">
        {/* Today total */}
        <div className="gradient-blue rounded-xl p-5 text-white shadow-blue">
          <p className="text-[0.8125rem] font-medium text-blue-100 mb-1">오늘 전체 출근</p>
          <div className="flex items-end gap-3 mb-3">
            <span className="text-[2.875rem] font-extrabold leading-none tabular-nums">{todayTotal}</span>
            <span className="text-base font-medium text-blue-200 mb-1.5">명</span>
          </div>
          <div className="flex items-center gap-2 pt-3 border-t border-white/20">
            <Badge tone="blue" className="bg-white/20 text-white text-[0.6875rem]">
              진행 {activeSites.length}개 현장
            </Badge>
          </div>
        </div>

        {/* 7-day chart */}
        <Card padding={false} className="p-5">
          <p className="text-[0.8125rem] font-semibold text-slate-500 mb-3">최근 7일 출근 추이</p>
          <div className="flex items-end gap-1 h-24">
            {last7.map(({ date, total }, i) => {
              const isToday = i === 6
              const heightPct = (total / maxDay) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end" style={{ height: '80px' }}>
                    <div
                      className={`w-full rounded-sm transition-all duration-500 ${isToday ? 'bg-blue-600' : 'bg-blue-100'}`}
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                    />
                  </div>
                  <span className={`text-[0.625rem] tabular-nums ${isToday ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                    {fmtKShort(date)}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Site cards */}
      <h2 className="text-[0.9375rem] font-bold text-ink mb-3">현장별 오늘 출근</h2>
      <div className="grid wide:grid-cols-2 gap-3">
        {activeSites.map((site) => {
          const total = dayTotal(records, site.id, todayStr)
          const entries = dayEntries(records, site.id, todayStr)
          const tradesToday = Object.entries(entries)
            .map(([tid, e]) => ({ trade: trades.find((t) => t.id === tid), count: e.count }))
            .filter((x) => x.trade)

          return (
            <Link key={site.id} href={`/sites/${site.id}`}>
              <Card hover className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[0.9375rem] font-bold text-ink truncate">{site.name}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{site.addr}</p>
                  </div>
                  <Badge tone={statusTone[site.status]}>{site.status}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[0.8125rem] text-slate-500">오늘 출근</span>
                  {total > 0 ? (
                    <span className="text-xl font-extrabold text-blue-600 tabular-nums">{total}명</span>
                  ) : (
                    <Badge tone="amber">미입력</Badge>
                  )}
                </div>

                {tradesToday.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tradesToday.map(({ trade, count }) => (
                      <span
                        key={trade!.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-600"
                      >
                        <TradeDot color={trade!.color} size="sm" />
                        {trade!.name} {count}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

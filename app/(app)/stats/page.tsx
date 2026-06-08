'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { TopBar } from '@/components/layout/top-bar'
import { Card, Chip, TradeDot } from '@/components/ui'
import { dayTotal, tradeManDays, ymd, addDays, startOfMonth, endOfMonth, wonFmt, fmtKShort } from '@/lib/utils'

const TODAY = new Date()

export default function StatsPage() {
  const { sites, trades, records } = useAppStore()
  const [month, setMonth] = useState(() => new Date(TODAY.getFullYear(), TODAY.getMonth(), 1))
  const [siteFilter, setSiteFilter] = useState<string | null>(null)

  const fromStr = ymd(startOfMonth(month))
  const toStr = ymd(endOfMonth(month))

  const filteredSiteIds = siteFilter
    ? [siteFilter]
    : sites.map((s) => s.id)

  const manDays = tradeManDays(records, filteredSiteIds, fromStr, toStr)
  const totalManDay = Object.values(manDays).reduce((s, v) => s + v, 0)

  // Active days (days with at least one record)
  const allDays = Array.from(
    { length: endOfMonth(month).getDate() },
    (_, i) => addDays(startOfMonth(month), i)
  )
  const activeDays = allDays.filter((d) =>
    filteredSiteIds.some((sid) => dayTotal(records, sid, ymd(d)) > 0)
  ).length

  const activeTradeCount = Object.values(manDays).filter((v) => v > 0).length
  const dailyAvg = activeDays > 0 ? (totalManDay / activeDays).toFixed(1) : '0'

  // Daily bar chart
  const dailyTotals = allDays.map((d) => ({
    date: d,
    total: filteredSiteIds.reduce((s, sid) => s + dayTotal(records, sid, ymd(d)), 0),
  }))
  const maxDay = Math.max(...dailyTotals.map((d) => d.total), 1)

  return (
    <div className="max-w-[1200px] mx-auto px-4 pb-8">
      <TopBar title="월별 통계" />

      {/* Month nav */}
      <div className="flex items-center gap-3 py-4">
        <button
          onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          className="w-9 h-9 flex items-center justify-center rounded-sm hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-[20px] font-bold text-ink">
          {month.getFullYear()}년 {month.getMonth() + 1}월
        </h1>
        <button
          onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          className="w-9 h-9 flex items-center justify-center rounded-sm hover:bg-slate-100 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Site filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        <Chip active={siteFilter === null} onClick={() => setSiteFilter(null)}>전체</Chip>
        {sites.map((site) => (
          <Chip
            key={site.id}
            active={siteFilter === site.id}
            onClick={() => setSiteFilter(site.id === siteFilter ? null : site.id)}
          >
            {site.name}
          </Chip>
        ))}
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 wide:grid-cols-4 gap-3 mb-6">
        <Card className="gradient-blue text-white !border-0">
          <p className="text-[12px] text-blue-100 mb-1">총 man-day</p>
          <p className="text-[28px] font-extrabold tabular-nums">{totalManDay}</p>
        </Card>
        <Card>
          <p className="text-[12px] text-slate-400 mb-1">작업일수</p>
          <p className="text-[28px] font-extrabold tabular-nums text-ink">{activeDays}<span className="text-[14px] font-normal text-slate-400 ml-1">일</span></p>
        </Card>
        <Card>
          <p className="text-[12px] text-slate-400 mb-1">일 평균</p>
          <p className="text-[28px] font-extrabold tabular-nums text-ink">{dailyAvg}<span className="text-[14px] font-normal text-slate-400 ml-1">명</span></p>
        </Card>
        <Card>
          <p className="text-[12px] text-slate-400 mb-1">활성 공종</p>
          <p className="text-[28px] font-extrabold tabular-nums text-ink">{activeTradeCount}<span className="text-[14px] font-normal text-slate-400 ml-1">개</span></p>
        </Card>
      </div>

      {/* Daily bar chart */}
      <Card className="mb-5">
        <p className="text-[14px] font-semibold text-ink mb-4">일별 출근 추이</p>
        <div className="overflow-x-auto scrollbar-none">
          <div className="flex items-end gap-0.5 h-28 min-w-max px-1">
            {dailyTotals.map(({ date, total }) => (
              <div key={ymd(date)} className="flex flex-col items-center gap-1">
                <div className="w-5 flex items-end" style={{ height: '96px' }}>
                  <div
                    className="w-full rounded-sm bg-blue-500 transition-all duration-500"
                    style={{ height: `${Math.max((total / maxDay) * 100, total > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-400 tabular-nums">{date.getDate()}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Trade breakdown */}
      <div className="wide:grid wide:grid-cols-2 wide:gap-5">
        <Card>
          <p className="text-[14px] font-semibold text-ink mb-4">공종별 집계</p>
          <div className="flex flex-col gap-3">
            {trades
              .filter((t) => (manDays[t.id] ?? 0) > 0)
              .sort((a, b) => (manDays[b.id] ?? 0) - (manDays[a.id] ?? 0))
              .map((trade) => {
                const count = manDays[trade.id] ?? 0
                const pct = totalManDay > 0 ? (count / totalManDay) * 100 : 0
                return (
                  <div key={trade.id}>
                    <div className="flex items-center gap-2 mb-1">
                      <TradeDot color={trade.color} size="sm" />
                      <span className="text-[13px] font-medium text-ink flex-1">{trade.name}</span>
                      <span className="text-[13px] font-bold tabular-nums">{count}일</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: trade.color }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </Card>
      </div>
    </div>
  )
}

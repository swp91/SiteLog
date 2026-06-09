'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { TopBar } from '@/components/layout/top-bar'
import { Card, Chip, Button, TradeDot } from '@/components/ui'
import { tradeManDays, ymd, startOfMonth, endOfMonth, wonFmt, wonShort } from '@/lib/utils'

const TODAY = new Date()

export default function PayrollPage() {
  const { sites, trades, records } = useAppStore()
  const [month, setMonth] = useState(() => new Date(TODAY.getFullYear(), TODAY.getMonth(), 1))
  const [siteFilter, setSiteFilter] = useState<string | null>(null)

  const fromStr = ymd(startOfMonth(month))
  const toStr = ymd(endOfMonth(month))
  const filteredSiteIds = siteFilter ? [siteFilter] : sites.map((s) => s.id)

  const manDays = tradeManDays(records, filteredSiteIds, fromStr, toStr)

  const rows = trades
    .map((t) => ({
      trade: t,
      manDay: manDays[t.id] ?? 0,
      cost: (manDays[t.id] ?? 0) * t.rate,
    }))
    .filter((r) => r.manDay > 0)
    .sort((a, b) => b.cost - a.cost)

  const totalCost = rows.reduce((s, r) => s + r.cost, 0)
  const totalManDay = rows.reduce((s, r) => s + r.manDay, 0)

  return (
    <div className="max-w-[900px] mx-auto px-4 pb-8">
      <TopBar title="노무비" />

      {/* Month nav */}
      <div className="flex items-center gap-3 py-4">
        <button
          onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          className="w-9 h-9 flex items-center justify-center rounded-sm hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-ink">
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

      {/* Hero */}
      <div className="gradient-blue rounded-xl p-5 text-white shadow-blue mb-5">
        <p className="text-[0.8125rem] text-blue-100 mb-1">총 노무비</p>
        <p className="text-4xl font-extrabold tabular-nums">
          {wonShort(totalCost)}<span className="text-base font-normal text-blue-200 ml-1">원</span>
        </p>
        <p className="text-[0.8125rem] text-blue-200 mt-2">총 {totalManDay} man-day</p>
      </div>

      {/* Table */}
      <Card padding={false} className="mb-5">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <p className="text-sm font-semibold text-ink">공종별 노무비</p>
          <Button size="sm" variant="outline" icon={<Download size={13} />}>
            정산서
          </Button>
        </div>
        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full text-[0.8125rem]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-2.5 font-semibold text-slate-500">공종 · 업체</th>
                <th className="text-right px-3 py-2.5 font-semibold text-slate-500 whitespace-nowrap">일당</th>
                <th className="text-right px-3 py-2.5 font-semibold text-slate-500">man·day</th>
                <th className="text-right px-4 py-2.5 font-semibold text-slate-500">노무비</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ trade, manDay, cost }) => (
                <tr key={trade.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <TradeDot color={trade.color} size="sm" />
                      <div>
                        <p className="font-semibold text-ink">{trade.name}</p>
                        {trade.company && <p className="text-[0.6875rem] text-slate-400">{trade.company}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-slate-500 tabular-nums whitespace-nowrap">
                    {wonFmt(trade.rate)}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">{manDay}</td>
                  <td className="px-4 py-3 text-right font-bold text-ink tabular-nums whitespace-nowrap">
                    {wonFmt(cost)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t border-slate-200">
                <td className="px-4 py-3 font-bold text-ink" colSpan={2}>합계</td>
                <td className="px-3 py-3 text-right font-bold tabular-nums">{totalManDay}</td>
                <td className="px-4 py-3 text-right font-extrabold text-blue-600 tabular-nums whitespace-nowrap">
                  {wonFmt(totalCost)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Bar chart */}
      <Card>
        <p className="text-sm font-semibold text-ink mb-4">비중</p>
        <div className="flex flex-col gap-3">
          {rows.map(({ trade, cost }) => {
            const pct = totalCost > 0 ? (cost / totalCost) * 100 : 0
            return (
              <div key={trade.id}>
                <div className="flex items-center gap-2 mb-1">
                  <TradeDot color={trade.color} size="sm" />
                  <span className="text-[0.8125rem] text-ink flex-1">{trade.name}</span>
                  <span className="text-[0.8125rem] font-bold tabular-nums">{wonShort(cost)}</span>
                  <span className="text-[0.6875rem] text-slate-400 tabular-nums w-8 text-right">{pct.toFixed(0)}%</span>
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
  )
}

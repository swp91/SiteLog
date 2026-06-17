'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { Download, Eye, Printer } from 'lucide-react'
import { Button, Segmented, Sheet, TradeDot, TextInput } from '@/components/ui'
import { ymd, addDays, fmtKShort, parseYmd, startOfMonth, endOfMonth, dayEntries } from '@/lib/utils'
import type { Site, Trade, Records } from '@/lib/types'

interface Props {
  site: Site
  trades: Trade[]
  records: Records
}

type PeriodMode = 'all' | 'this-month' | 'last-month' | 'custom'

interface MonthGroup {
  key: string
  label: string
  days: Date[]
}

const PERIOD_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'this-month', label: '이번 달' },
  { value: 'last-month', label: '지난 달' },
  { value: 'custom', label: '직접 선택' },
]

const DAY_MS = 86_400_000

function daysBetween(from: Date, to: Date) {
  const length = Math.max(1, Math.floor((to.getTime() - from.getTime()) / DAY_MS) + 1)
  return Array.from({ length }, (_, i) => addDays(from, i))
}

function monthLabel(d: Date) {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`
}

function clampDate(d: Date, min: Date, max: Date) {
  if (d < min) return min
  if (d > max) return max
  return d
}

function formatManDay(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

export function TableTab({ site, trades, records }: Props) {
  const [periodMode, setPeriodMode] = useState<PeriodMode>('all')
  const [previewOpen, setPreviewOpen] = useState(false)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const siteDates = useMemo(
    () =>
      Object.keys(records)
        .filter((key) => key.startsWith(`${site.id}|`))
        .map((key) => key.split('|')[1])
        .sort(),
    [records, site.id],
  )

  const dataFrom = siteDates.length > 0 ? parseYmd(siteDates[0]) : today
  const dataTo = siteDates.length > 0 ? parseYmd(siteDates[siteDates.length - 1]) : today
  const [customFrom, setCustomFrom] = useState(ymd(dataFrom))
  const [customTo, setCustomTo] = useState(ymd(dataTo))

  const days = useMemo(() => {
    if (periodMode === 'this-month') {
      return daysBetween(startOfMonth(today), clampDate(today, startOfMonth(today), endOfMonth(today)))
    }

    if (periodMode === 'last-month') {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      return daysBetween(startOfMonth(lastMonth), endOfMonth(lastMonth))
    }

    if (periodMode === 'custom') {
      const from = parseYmd(customFrom)
      const to = parseYmd(customTo)
      return from <= to ? daysBetween(from, to) : daysBetween(to, from)
    }

    return daysBetween(dataFrom, dataTo)
  }, [customFrom, customTo, dataFrom, dataTo, periodMode])

  function getCount(tradeId: string, d: Date): number {
    return dayEntries(records, site.id, ymd(d))[tradeId]?.count ?? 0
  }

  function tradeTotal(tradeId: string, targetDays = days): number {
    return targetDays.reduce((sum, day) => sum + getCount(tradeId, day), 0)
  }

  function dayColTotal(d: Date): number {
    return trades.reduce((sum, trade) => sum + getCount(trade.id, d), 0)
  }

  function totalForDays(targetDays: Date[]): number {
    return trades.reduce((sum, trade) => sum + tradeTotal(trade.id, targetDays), 0)
  }

  function activeTradesForDays(targetDays: Date[]) {
    return trades.filter((trade) => tradeTotal(trade.id, targetDays) > 0)
  }

  const activeTrades = activeTradesForDays(days)
  const grandTotal = totalForDays(days)
  const fromLabel = fmtKShort(days[0])
  const toLabel = fmtKShort(days[days.length - 1])
  const monthGroups = useMemo<MonthGroup[]>(() => {
    return days.reduce<MonthGroup[]>((groups, day) => {
      const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}`
      const last = groups[groups.length - 1]

      if (last?.key === key) {
        last.days.push(day)
        return groups
      }

      groups.push({ key, label: monthLabel(day), days: [day] })
      return groups
    }, [])
  }, [days])

  function downloadCsv() {
    const header = ['공종', ...days.map((d) => fmtKShort(d)), '합계'].join(',')
    const rows = activeTrades.map((trade) =>
      [trade.name, ...days.map((d) => getCount(trade.id, d)), formatManDay(tradeTotal(trade.id))].join(','),
    )
    const footer = ['합계', ...days.map((d) => formatManDay(dayColTotal(d))), formatManDay(grandTotal)].join(',')
    const csv = [header, ...rows, footer].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${site.name}_출근기록.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function printReport() {
    setPreviewOpen(false)
    window.setTimeout(() => window.print(), 50)
  }

  const summaryBoard = (
    <MonthlySummaryBoard
      groups={monthGroups}
      activeTradesForDays={activeTradesForDays}
      tradeTotal={tradeTotal}
      totalForDays={totalForDays}
    />
  )

  const report = (
    <ReportPreview
      siteName={site.name}
      period={`${fromLabel} - ${toLabel}`}
      days={days}
      monthGroups={monthGroups}
      trades={activeTrades}
      getCount={getCount}
      tradeTotal={tradeTotal}
      dayColTotal={dayColTotal}
      totalForDays={totalForDays}
      activeTradesForDays={activeTradesForDays}
      grandTotal={grandTotal}
      summaryBoard={summaryBoard}
    />
  )

  return (
    <div className="max-w-[900px] mx-auto px-4 pb-8 pt-4">
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 wide:flex-row wide:items-center wide:justify-between">
          <div>
            <p className="text-sm font-bold text-ink">출근기록 보고서</p>
            <p className="mt-0.5 text-xs text-slate-500">기간을 고르면 표와 PDF 미리보기가 같이 바뀝니다.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" icon={<Eye size={14} />} onClick={() => setPreviewOpen(true)}>
              미리보기
            </Button>
            <Button size="sm" variant="outline" icon={<Download size={14} />} onClick={downloadCsv}>
              CSV
            </Button>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto scrollbar-none">
          <Segmented value={periodMode} onChange={(value) => setPeriodMode(value as PeriodMode)} options={PERIOD_OPTIONS} />
        </div>

        {periodMode === 'custom' && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <TextInput type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} />
            <TextInput type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} />
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white scrollbar-none">
        <table className="w-full text-[0.8125rem] tabular-nums">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="sticky left-0 bg-slate-50 text-left px-3 py-2 font-semibold text-slate-600 min-w-[80px]">
                공종
              </th>
              {days.map((d) => (
                <th key={ymd(d)} className="px-2 py-2 font-semibold text-slate-500 text-center min-w-[36px]">
                  {fmtKShort(d)}
                </th>
              ))}
              <th className="px-3 py-2 font-bold text-ink text-right min-w-[48px]">합계</th>
            </tr>
          </thead>
          <tbody>
            {activeTrades.map((trade) => (
              <tr key={trade.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="sticky left-0 bg-white px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <TradeDot color={trade.color} size="sm" />
                    <span className="font-medium text-ink">{trade.name}</span>
                  </div>
                </td>
                {days.map((d) => {
                  const count = getCount(trade.id, d)
                  return (
                    <td key={ymd(d)} className={`px-2 py-2 text-center ${count > 0 ? 'text-ink font-semibold' : 'text-slate-200'}`}>
                      {count > 0 ? formatManDay(count) : '-'}
                    </td>
                  )
                })}
                <td className="px-3 py-2 text-right font-bold text-blue-600">{formatManDay(tradeTotal(trade.id))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t border-slate-200">
              <td className="sticky left-0 bg-slate-50 px-3 py-2 font-bold text-ink">합계</td>
              {days.map((d) => {
                const count = dayColTotal(d)
                return (
                  <td key={ymd(d)} className={`px-2 py-2 text-center font-bold ${count > 0 ? 'text-ink' : 'text-slate-200'}`}>
                    {count > 0 ? formatManDay(count) : '-'}
                  </td>
                )
              })}
              <td className="px-3 py-2 text-right font-extrabold text-blue-600">{formatManDay(grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4">{summaryBoard}</div>

      <Sheet open={previewOpen} onClose={() => setPreviewOpen(false)} title="PDF 미리보기" maxWidth="1100px">
        {report}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setPreviewOpen(false)}>
            닫기
          </Button>
          <Button icon={<Printer size={15} />} onClick={printReport}>
            PDF 저장
          </Button>
        </div>
      </Sheet>

      <div className="print-report">{report}</div>
    </div>
  )
}

interface ReportPreviewProps {
  siteName: string
  period: string
  days: Date[]
  monthGroups: MonthGroup[]
  trades: Trade[]
  getCount: (tradeId: string, d: Date) => number
  tradeTotal: (tradeId: string, targetDays?: Date[]) => number
  dayColTotal: (d: Date) => number
  totalForDays: (targetDays: Date[]) => number
  activeTradesForDays: (targetDays: Date[]) => Trade[]
  grandTotal: number
  summaryBoard: ReactNode
}

function ReportPreview({
  siteName,
  period,
  days,
  monthGroups,
  trades,
  getCount,
  tradeTotal,
  dayColTotal,
  totalForDays,
  activeTradesForDays,
  grandTotal,
}: ReportPreviewProps) {
  const cumulativeTrades = [...trades].sort((a, b) => tradeTotal(b.id) - tradeTotal(a.id))
  const maxMonthTotal = Math.max(...monthGroups.map((group) => totalForDays(group.days)), 1)

  return (
    <section className="report-page rounded-xl bg-slate-50 p-6 text-ink">
      <div className="mb-6 flex items-start justify-between gap-6">
        <div>
          <p className="text-sm font-semibold text-blue-600">출근기록 보고서</p>
          <h2 className="mt-1 text-[1.65rem] font-extrabold leading-tight tracking-normal">
            {siteName} 인테리어 공종별 출근기록부
          </h2>
          <p className="mt-2 text-sm text-slate-500">기간 {period}</p>
        </div>
        <p className="pt-2 text-right text-xs font-medium text-slate-400">현장출근기록</p>
      </div>

      <div className="mb-6 grid grid-cols-5 gap-3">
        <MetricCard label="총 공수" value={formatManDay(grandTotal)} unit="공수" strong />
        <MetricCard label="작업 기간" value={formatManDay(days.length)} unit="일" />
        <MetricCard label="참여 공종" value={formatManDay(trades.length)} unit="개" />
        {monthGroups.slice(-2).map((group) => (
          <MetricCard
            key={group.key}
            label={`${group.label.replace(/^\d{4}년 /, '')} 공수`}
            value={formatManDay(totalForDays(group.days))}
            unit="공수"
          />
        ))}
      </div>

      <div className="mb-6 grid grid-cols-[0.95fr_1fr] gap-4">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 text-base font-extrabold">월별 공수 현황</h3>
          <div className="space-y-4">
            {monthGroups.map((group, index) => {
              const total = totalForDays(group.days)
              const width = `${Math.max(8, (total / maxMonthTotal) * 100)}%`
              return (
                <div key={group.key} className="grid grid-cols-[90px_1fr_72px] items-center gap-3">
                  <p className="text-sm font-medium text-slate-600">{group.label}</p>
                  <div className="h-5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${index === monthGroups.length - 1 ? 'bg-blue-600' : 'bg-slate-400'}`}
                      style={{ width }}
                    />
                  </div>
                  <p className="text-right text-sm font-bold text-ink">{formatManDay(total)} 공수</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 text-base font-extrabold">공종별 누적 공수</h3>
          <div className="grid grid-cols-3 gap-2">
            {cumulativeTrades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-1.5 text-sm">
                <span className="truncate text-slate-600">{trade.name}</span>
                <span className="font-bold text-blue-600">{formatManDay(tradeTotal(trade.id))}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="space-y-5">
        {monthGroups.map((group) => (
          <section key={group.key} className="report-month rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-extrabold">{group.label} 상세 출근 현황</h3>
              <p className="text-sm font-semibold text-blue-600">월 공수 {formatManDay(totalForDays(group.days))}공수</p>
            </div>
            <AttendanceMatrix
              days={group.days}
              trades={activeTradesForDays(group.days)}
              getCount={getCount}
              tradeTotal={tradeTotal}
              dayColTotal={dayColTotal}
              total={totalForDays(group.days)}
            />
          </section>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-400">※ 공수는 작업 인원 x 작업일 기준으로 집계</p>
    </section>
  )
}

function MetricCard({ label, value, unit, strong }: { label: string; value: string; unit: string; strong?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-extrabold tracking-normal ${strong ? 'text-blue-600' : 'text-ink'}`}>
        {value}
        <span className="ml-1 text-sm font-medium text-slate-500">{unit}</span>
      </p>
    </div>
  )
}

interface AttendanceMatrixProps {
  days: Date[]
  trades: Trade[]
  getCount: (tradeId: string, d: Date) => number
  tradeTotal: (tradeId: string, targetDays?: Date[]) => number
  dayColTotal: (d: Date) => number
  total: number
}

function AttendanceMatrix({ days, trades, getCount, tradeTotal, dayColTotal, total }: AttendanceMatrixProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-xs tabular-nums">
        <thead>
          <tr className="border-y border-slate-200 bg-slate-50">
            <th className="px-3 py-2 text-left font-bold text-slate-600">공종</th>
            {days.map((d) => (
              <th key={ymd(d)} className="px-2 py-2 text-center font-semibold text-slate-500">
                {fmtKShort(d)}
              </th>
            ))}
            <th className="px-3 py-2 text-right font-bold text-blue-600">합계</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr key={trade.id} className="border-b border-slate-100">
              <td className="px-3 py-2 font-semibold text-slate-700">{trade.name}</td>
              {days.map((d) => {
                const count = getCount(trade.id, d)
                return (
                  <td key={ymd(d)} className={`px-2 py-2 text-center ${count > 0 ? 'text-ink' : 'text-slate-300'}`}>
                    {count > 0 ? formatManDay(count) : '-'}
                  </td>
                )
              })}
              <td className="px-3 py-2 text-right font-bold text-blue-600">{formatManDay(tradeTotal(trade.id, days))}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-blue-50">
            <td className="px-3 py-2 font-extrabold">합계</td>
            {days.map((d) => {
              const count = dayColTotal(d)
              return (
                <td key={ymd(d)} className={`px-2 py-2 text-center font-bold ${count > 0 ? 'text-blue-600' : 'text-slate-300'}`}>
                  {count > 0 ? formatManDay(count) : '-'}
                </td>
              )
            })}
            <td className="px-3 py-2 text-right font-extrabold text-blue-600">{formatManDay(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

interface MonthlySummaryBoardProps {
  groups: MonthGroup[]
  activeTradesForDays: (targetDays: Date[]) => Trade[]
  tradeTotal: (tradeId: string, targetDays?: Date[]) => number
  totalForDays: (targetDays: Date[]) => number
}

function MonthlySummaryBoard({ groups, activeTradesForDays, tradeTotal, totalForDays }: MonthlySummaryBoardProps) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-ink">종합 상황판</h3>
        <p className="text-xs text-slate-500">월별 공종 공수</p>
      </div>

      <div className="grid gap-3 wide:grid-cols-2">
        {groups.map((group) => {
          const monthTrades = activeTradesForDays(group.days)
          const monthTotal = totalForDays(group.days)

          return (
            <article key={group.key} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-bold text-blue-600">{group.label}</p>
              <p className="mt-1 text-3xl font-extrabold tracking-normal text-ink">
                {formatManDay(monthTotal)}
                <span className="ml-1 text-base font-bold">공수</span>
              </p>

              <div className="mt-4 space-y-2.5">
                {monthTrades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="inline-flex items-center gap-2 font-semibold text-slate-700">
                      <TradeDot color={trade.color} size="sm" />
                      {trade.name}
                    </span>
                    <span className="font-extrabold text-ink">{formatManDay(tradeTotal(trade.id, group.days))}공수</span>
                  </div>
                ))}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

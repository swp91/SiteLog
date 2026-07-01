'use client'

import { useMemo, useState } from 'react'
import { Download, Eye, Printer, Share2 } from 'lucide-react'
import { Button, Segmented, Sheet, TradeDot, TextInput } from '@/components/ui'
import { ymd, addDays, fmtKShort, parseYmd, startOfMonth, endOfMonth, dayEntries, shareText } from '@/lib/utils'
import { useAppStore } from '@/stores/app-store'
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
  const [deselectedTradeIds, setDeselectedTradeIds] = useState<Set<string>>(new Set())
  const flash = useAppStore((state) => state.flash)

  const toggleTrade = (tradeId: string) => {
    const next = new Set(deselectedTradeIds)
    if (next.has(tradeId)) {
      next.delete(tradeId)
    } else {
      next.add(tradeId)
    }
    setDeselectedTradeIds(next)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function handleShare() {
    const tradeLines = activeTrades
      .map((trade) => `- ${trade.name}: ${formatManDay(tradeTotal(trade.id))}공수`)
      .join('\n')

    const monthLines = monthGroups
      .map((group) => `- ${group.label}: ${formatManDay(totalForDays(group.days))}공수`)
      .join('\n')

    const summaryText = `[SiteLog 현장 출근 요약]
현장명: ${site.name}
기간: ${fromLabel} ~ ${toLabel}
총 공수: ${formatManDay(grandTotal)}공수
참여 공종: ${activeTrades.length}개

월별 현황:
${monthLines || '현황 없음'}

공종별 누적 공수:
${tradeLines || '내역 없음'}

상세 내역은 SiteLog에서 확인하세요.`

    shareText({
      title: `${site.name} 출근기록 요약`,
      text: summaryText,
      onSuccess: (type) => {
        if (type === 'share') {
          flash('공유창을 열었습니다')
        } else {
          flash('출근기록 요약이 클립보드에 복사되었습니다')
        }
      },
      onError: () => {
        flash('공유하기에 실패했습니다')
      },
    })
  }

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
    return trades
      .filter((trade) => !deselectedTradeIds.has(trade.id))
      .reduce((sum, trade) => sum + getCount(trade.id, d), 0)
  }

  function totalForDays(targetDays: Date[]): number {
    return trades
      .filter((trade) => !deselectedTradeIds.has(trade.id))
      .reduce((sum, trade) => sum + tradeTotal(trade.id, targetDays), 0)
  }

  function activeTradesForDays(targetDays: Date[]) {
    return trades.filter((trade) => !deselectedTradeIds.has(trade.id) && tradeTotal(trade.id, targetDays) > 0)
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
    const prevTitle = document.title
    document.title = ' '
    window.setTimeout(() => {
      window.print()
      window.setTimeout(() => {
        document.title = prevTitle
      }, 300)
    }, 50)
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
    />
  )

  return (
    <div className="max-w-[1100px] mx-auto px-4 pb-8 pt-4">
      {/* 스타일 주입 (인쇄 시 A4 세로 방향 설정 및 여백 조정) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 12mm !important;
          }
        }
      `}} />
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 wide:flex-row wide:items-center wide:justify-between">
          <div>
            <p className="text-sm font-bold text-ink">출근기록 보고서</p>
            <p className="mt-0.5 text-xs text-slate-500">기간을 고르면 표와 PDF 미리보기가 같이 바뀝니다.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" icon={<Share2 size={14} />} onClick={handleShare}>
              공유
            </Button>
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

        {/* 공종 필터 선택 UI */}
        <div className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-3">
          <p className="text-xs font-bold text-slate-500 mb-2">출력할 공종 선택</p>
          <div className="flex flex-wrap gap-1.5">
            {trades.map((trade) => {
              const isSelected = !deselectedTradeIds.has(trade.id)
              return (
                <button
                  key={trade.id}
                  type="button"
                  onClick={() => toggleTrade(trade.id)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-100/50'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: trade.color }} />
                  {trade.name}
                </button>
              )
            })}
          </div>
        </div>
      </div>
 
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white scrollbar-thin">
        <table className="w-full text-xs tabular-nums border-collapse">
          <thead>
            {/* Row 1: Months */}
            <tr className="bg-slate-50 border-b border-slate-100">
              <th rowSpan={2} className="sticky left-0 z-10 bg-slate-50 text-left px-3 py-3 font-bold text-slate-700 min-w-[84px] border-r border-slate-200/80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                공종
              </th>
              {monthGroups.map((group) => (
                <th
                  key={group.key}
                  colSpan={group.days.length}
                  className="px-2 py-1.5 font-bold text-slate-600 text-center border-b border-slate-200 bg-slate-100/60 text-[0.6875rem] tracking-wider"
                >
                  {group.label}
                </th>
              ))}
              <th rowSpan={2} className="px-3 py-3 font-bold text-slate-700 text-right min-w-[54px] border-l border-slate-200/80">
                합계
              </th>
            </tr>
            {/* Row 2: Days */}
            <tr className="bg-slate-50 border-b border-slate-200">
              {days.map((d) => {
                const dayOfWeek = d.getDay()
                const isSun = dayOfWeek === 0
                const isSat = dayOfWeek === 6
                return (
                  <th
                    key={ymd(d)}
                    className={`px-1 py-1.5 font-semibold text-center min-w-[26px] text-[0.6875rem] border-r border-slate-100 last:border-r-0 ${
                      isSun ? 'text-red-500 bg-red-50/20' : isSat ? 'text-blue-500 bg-blue-50/20' : 'text-slate-500'
                    }`}
                  >
                    {d.getDate()}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {activeTrades.map((trade) => (
              <tr key={trade.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                <td className="sticky left-0 z-10 bg-white px-3 py-2 border-r border-slate-200/80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-1.5">
                    <TradeDot color={trade.color} size="sm" />
                    <span className="font-semibold text-slate-700 truncate max-w-[70px]" title={trade.name}>
                      {trade.name}
                    </span>
                  </div>
                </td>
                {days.map((d) => {
                  const count = getCount(trade.id, d)
                  const dayOfWeek = d.getDay()
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                  return (
                    <td
                      key={ymd(d)}
                      className={`px-1 py-2 text-center border-r border-slate-100/50 last:border-r-0 ${
                        count > 0 
                          ? 'text-slate-900 font-bold bg-blue-50/10' 
                          : isWeekend 
                            ? 'text-slate-200 bg-slate-50/30' 
                            : 'text-slate-200'
                      }`}
                    >
                      {count > 0 ? formatManDay(count) : '-'}
                    </td>
                  )
                })}
                <td className="px-3 py-2 text-right font-bold text-blue-600 bg-blue-50/20 border-l border-slate-200/80">
                  {formatManDay(tradeTotal(trade.id))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50/80 border-t border-slate-200 font-bold">
              <td className="sticky left-0 z-10 bg-slate-50 px-3 py-2.5 text-slate-700 border-r border-slate-200/80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                합계
              </td>
              {days.map((d) => {
                const count = dayColTotal(d)
                const dayOfWeek = d.getDay()
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                return (
                  <td
                    key={ymd(d)}
                    className={`px-1 py-2.5 text-center border-r border-slate-100 last:border-r-0 ${
                      count > 0 
                        ? 'text-slate-800 font-extrabold' 
                        : isWeekend 
                          ? 'text-slate-200 bg-slate-100/20' 
                          : 'text-slate-200'
                    }`}
                  >
                    {count > 0 ? formatManDay(count) : '-'}
                  </td>
                )
              })}
              <td className="px-3 py-2.5 text-right font-extrabold text-blue-600 bg-blue-50/30 border-l border-slate-200/80">
                {formatManDay(grandTotal)}
              </td>
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
          <Button variant="outline" icon={<Share2 size={15} />} onClick={handleShare}>
            요약 공유
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
  const maxDay = days.reduce(
    (max, day) => {
      const total = dayColTotal(day)
      return total > max.total ? { day, total } : max
    },
    { day: days[0], total: 0 },
  )

  return (
    <section className="report-page space-y-4 text-ink">
      <ReportSummaryPage
        siteName={siteName}
        period={period}
        days={days}
        trades={cumulativeTrades}
        monthGroups={monthGroups}
        grandTotal={grandTotal}
        maxDay={maxDay}
        maxMonthTotal={maxMonthTotal}
        tradeTotal={tradeTotal}
        totalForDays={totalForDays}
      />

      {trades.map((trade) => (
        <div key={trade.id} className="space-y-4">
          {monthGroups.map((group) => {
            const monthlyTotalOfTrade = tradeTotal(trade.id, group.days)
            if (monthlyTotalOfTrade === 0) return null

            return (
              <MonthlyCalendarPage
                key={`${trade.id}-${group.key}`}
                siteName={siteName}
                group={group}
                trades={[trade]}
                getCount={getCount}
                dayColTotal={(d) => getCount(trade.id, d)}
                totalForDays={(targetDays) => tradeTotal(trade.id, targetDays)}
              />
            )
          })}
        </div>
      ))}
    </section>
  )
}

interface ReportSummaryPageProps {
  siteName: string
  period: string
  days: Date[]
  trades: Trade[]
  monthGroups: MonthGroup[]
  grandTotal: number
  maxDay: { day: Date; total: number }
  maxMonthTotal: number
  tradeTotal: (tradeId: string, targetDays?: Date[]) => number
  totalForDays: (targetDays: Date[]) => number
}

function ReportSummaryPage({
  siteName,
  period,
  days,
  trades,
  monthGroups,
  grandTotal,
  maxDay,
  maxMonthTotal,
  tradeTotal,
  totalForDays,
}: ReportSummaryPageProps) {
  return (
    <article className="report-sheet rounded-xl bg-slate-50 p-6">
      <div className="mb-5 flex items-start justify-between gap-6">
        <div>
          <p className="text-sm font-semibold text-blue-600">출근기록 보고서</p>
          <h2 className="mt-1 text-[1.55rem] font-extrabold leading-tight tracking-normal">
            {siteName} 월간 출근 요약
          </h2>
          <p className="mt-2 text-sm text-slate-500">기간 {period}</p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-4 gap-3">
        <MetricCard label="총 공수" value={formatManDay(grandTotal)} unit="공수" strong />
        <MetricCard label="작업 기간" value={formatManDay(days.length)} unit="일" />
        <MetricCard label="참여 공종" value={formatManDay(trades.length)} unit="개" />
        <MetricCard label="최대 투입일" value={formatManDay(maxDay.total)} unit={`공수 · ${fmtKShort(maxDay.day)}`} />
      </div>

      <div className="grid grid-cols-[0.9fr_1.1fr] gap-4">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 text-base font-extrabold">월별 공수 현황</h3>
          <div className="space-y-4">
            {monthGroups.map((group, index) => {
              const total = totalForDays(group.days)
              const width = `${Math.max(8, (total / maxMonthTotal) * 100)}%`
              return (
                <div key={group.key} className="grid grid-cols-[90px_1fr_86px] items-center gap-3">
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
            {trades.map((trade) => (
              <div key={trade.id} className="flex min-w-0 items-center justify-between rounded-md bg-slate-50 px-3 py-1.5 text-sm">
                <span className="truncate text-slate-600">{trade.name}</span>
                <span className="font-bold text-blue-600">{formatManDay(tradeTotal(trade.id))}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <p className="mt-4 text-xs text-slate-400">※ 공수는 작업 인원 x 작업일 기준으로 집계</p>
    </article>
  )
}

interface MonthlyCalendarPageProps {
  siteName: string
  group: MonthGroup
  trades: Trade[]
  getCount: (tradeId: string, d: Date) => number
  dayColTotal: (d: Date) => number
  totalForDays: (targetDays: Date[]) => number
}

function MonthlyCalendarPage({ siteName, group, trades, getCount, dayColTotal, totalForDays }: MonthlyCalendarPageProps) {
  const tradeCodes = buildTradeCodes(trades)

  // Parse year and month to generate all days in this month
  const [yearStr, monthStr] = group.key.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10) - 1 // 0-indexed month
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const allDaysInMonth = daysBetween(firstDay, lastDay)

  const selectedDaysSet = new Set(group.days.map((d) => ymd(d)))

  const leadingBlanks = allDaysInMonth[0].getDay()
  const trailingBlanks = (7 - ((leadingBlanks + allDaysInMonth.length) % 7)) % 7
  const calendarCells = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...allDaysInMonth,
    ...Array.from({ length: trailingBlanks }, () => null),
  ]

  return (
    <article className="report-sheet rounded-xl bg-slate-50 p-6">
      <div className="mb-4 flex items-start justify-between gap-6">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            {trades.length === 1 ? `${trades[0].name} 출근 현황` : '월별 상세 출근 현황'}
          </p>
          <h2 className="mt-1 text-[1.45rem] font-extrabold leading-tight tracking-normal">
            {siteName} · {group.label}{trades.length === 1 ? ` (${trades[0].name})` : ''}
          </h2>
        </div>
        <p className="text-sm font-semibold text-blue-600">월 공수 {formatManDay(totalForDays(group.days))}공수</p>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-[0.7rem] font-bold text-slate-500">
        {['일', '월', '화', '수', '목', '금', '토'].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {calendarCells.map((day, index) =>
          day ? (
            <CalendarDay
              key={ymd(day)}
              day={day}
              trades={trades}
              tradeCodes={tradeCodes}
              getCount={getCount}
              dayColTotal={dayColTotal}
              active={selectedDaysSet.has(ymd(day))}
            />
          ) : (
            <div key={`blank-${index}`} className="min-h-[82px] rounded-lg border border-dashed border-slate-200 bg-white/40" />
          ),
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.72rem] text-slate-500">
        {trades.map((trade) => (
          <span key={trade.id} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: trade.color }} />
            <b className="text-slate-700">{tradeCodes[trade.id]}</b>={trade.name}
          </span>
        ))}
      </div>
    </article>
  )
}

interface CalendarDayProps {
  day: Date
  trades: Trade[]
  tradeCodes: Record<string, string>
  getCount: (tradeId: string, d: Date) => number
  dayColTotal: (d: Date) => number
  active: boolean
}

function CalendarDay({ day, trades, tradeCodes, getCount, dayColTotal, active }: CalendarDayProps) {
  const entries = active
    ? trades
        .map((trade) => ({ trade, count: getCount(trade.id, day) }))
        .filter((entry) => entry.count > 0)
    : []

  const total = active ? dayColTotal(day) : 0

  return (
    <div className={`min-h-[82px] rounded-lg border p-1.5 transition-colors ${active ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50/40'}`}>
      <div className="mb-1 flex items-start justify-between gap-1">
        <span className={`text-[0.72rem] font-extrabold ${active ? 'text-ink' : 'text-slate-300'}`}>{day.getDate()}</span>
        <span className={`text-[0.72rem] font-extrabold ${active ? 'text-blue-600' : 'text-slate-300'}`}>
          {total > 0 ? formatManDay(total) : '-'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1">
        {entries.map(({ trade, count }) => (
          <span
            key={trade.id}
            className="flex min-w-0 items-center justify-between rounded px-1 py-0.5 text-[0.58rem] font-extrabold leading-none text-white"
            style={{ backgroundColor: trade.color }}
            title={`${trade.name} ${formatManDay(count)}공수`}
          >
            <span className="truncate">{tradeCodes[trade.id]}</span>
            <span>{formatManDay(count)}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function buildTradeCodes(trades: Trade[]) {
  const used = new Set<string>()
  const codes: Record<string, string> = {}

  for (const trade of trades) {
    const compactName = trade.name.replace(/\s+/g, '')
    let code = compactName.slice(0, 1) || trade.name.slice(0, 1)

    for (let length = 1; used.has(code) && length <= compactName.length; length += 1) {
      code = compactName.slice(0, length + 1)
    }

    if (used.has(code)) {
      let suffix = 2
      const base = code || '공'
      while (used.has(`${base}${suffix}`)) suffix += 1
      code = `${base}${suffix}`
    }

    used.add(code)
    codes[trade.id] = code
  }

  return codes
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

'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TradeDot } from '@/components/ui'
import { dayTotal, dayEntries, ymd, fmtKDate, parseYmd, addDays, isSameDay, startOfMonth, endOfMonth } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Site, Trade, Records } from '@/lib/types'

interface Props {
  site: Site
  trades: Trade[]
  records: Records
  date: string
  onPickDate: (d: string) => void
}

export function CalendarTab({ site, trades, records, date, onPickDate }: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [viewMonth, setViewMonth] = useState(() => {
    const d = parseYmd(date)
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const selected = parseYmd(date)

  // Build calendar grid (Mon-start)
  const monthStart = startOfMonth(viewMonth)
  const monthEnd = endOfMonth(viewMonth)
  const startDow = (monthStart.getDay() + 6) % 7
  const gridStart = addDays(monthStart, -startDow)

  const weeks: Date[][] = []
  let cursor = new Date(gridStart)
  while (cursor <= monthEnd || weeks.length < 6) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor))
      cursor = addDays(cursor, 1)
    }
    weeks.push(week)
    if (cursor > monthEnd && weeks.length >= 4) break
  }

  // Max total for opacity scale
  const allTotals = weeks.flat().map((d) => dayTotal(records, site.id, ymd(d)))
  const maxTotal = Math.max(...allTotals, 1)

  const selectedEntries = dayEntries(records, site.id, date)
  const selectedTotal = Object.values(selectedEntries).reduce((s, e) => s + e.count, 0)

  return (
    <div className="wide:flex wide:gap-6 max-w-[900px] mx-auto px-4 pb-8 pt-4">
      {/* Calendar */}
      <div className="wide:flex-1">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            className="w-9 h-9 flex items-center justify-center rounded-sm hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-[16px] font-bold text-ink">
            {viewMonth.getFullYear()}년 {viewMonth.getMonth() + 1}월
          </h2>
          <button
            onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            className="w-9 h-9 flex items-center justify-center rounded-sm hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {['월', '화', '수', '목', '금', '토', '일'].map((d, i) => (
            <div key={d} className={cn('text-center text-[11px] font-semibold py-1', i === 6 ? 'text-red-400' : i === 5 ? 'text-blue-400' : 'text-slate-400')}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {weeks.flat().map((d) => {
            const str = ymd(d)
            const isCurrentMonth = d.getMonth() === viewMonth.getMonth()
            const total = dayTotal(records, site.id, str)
            const isSelected = isSameDay(d, selected)
            const isToday = isSameDay(d, today)
            const ratio = total / maxTotal
            const bgOpacity = total > 0 ? 0.12 + ratio * 0.7 : 0
            const dow = (d.getDay() + 6) % 7 // 0=Mon

            return (
              <button
                key={str}
                onClick={() => onPickDate(str)}
                className={cn(
                  'relative flex flex-col items-center py-1.5 rounded-sm transition-all',
                  !isCurrentMonth && 'opacity-30',
                  isSelected && 'ring-2 ring-blue-600',
                )}
                style={
                  total > 0 && !isSelected
                    ? { backgroundColor: `rgba(37,99,235,${bgOpacity})` }
                    : isSelected
                    ? { backgroundColor: '#2563EB' }
                    : undefined
                }
              >
                <span className={cn(
                  'text-[13px] font-bold',
                  isSelected ? 'text-white' : dow === 6 ? 'text-red-500' : dow === 5 ? 'text-blue-500' : 'text-ink',
                )}>
                  {d.getDate()}
                </span>
                {total > 0 && (
                  <span className={cn('text-[10px] tabular-nums font-semibold', isSelected ? 'text-blue-100' : 'text-blue-700')}>
                    {total}
                  </span>
                )}
                {isToday && !isSelected && (
                  <span className="absolute top-0.5 right-1 w-1.5 h-1.5 rounded-full bg-blue-500" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Detail panel */}
      <div className="wide:w-64 mt-6 wide:mt-0 bg-white rounded-lg border border-slate-200 p-4">
        <p className="text-[13px] font-semibold text-slate-500 mb-1">{fmtKDate(selected)}</p>
        <p className="text-[28px] font-extrabold text-ink tabular-nums mb-3">{selectedTotal}명</p>
        {selectedTotal === 0 ? (
          <p className="text-[13px] text-slate-400">출근 기록이 없어요</p>
        ) : (
          <div className="flex flex-col gap-2">
            {Object.entries(selectedEntries).map(([tid, entry]) => {
              const trade = trades.find((t) => t.id === tid)
              if (!trade) return null
              return (
                <div key={tid} className="flex items-center gap-2">
                  <TradeDot color={trade.color} size="sm" />
                  <span className="text-[13px] text-slate-700 flex-1">{trade.name}</span>
                  <span className="text-[13px] font-bold text-ink tabular-nums">{entry.count}명</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

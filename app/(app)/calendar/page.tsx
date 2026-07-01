'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { TopBar } from '@/components/layout/top-bar'
import { Chip, TradeDot } from '@/components/ui'
import { dayTotal, allSitesDayTotal, ymd, addDays, isSameDay, startOfMonth, endOfMonth, fmtKDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const SITE_COLORS = ['#2563EB', '#0EA5E9', '#8B5CF6', '#F59E0B', '#14B8A6', '#EC4899', '#6366F1', '#EF4444']

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

export default function CalendarPage() {
  const { sites, trades, records } = useAppStore()
  const [activeSiteIds, setActiveSiteIds] = useState<string[]>(
    sites.filter((s) => s.status !== '완료').map((s) => s.id)
  )
  const [viewMonth, setViewMonth] = useState(() => new Date(TODAY.getFullYear(), TODAY.getMonth(), 1))
  const [selected, setSelected] = useState(TODAY)

  function toggleSite(id: string) {
    setActiveSiteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const monthStart = startOfMonth(viewMonth)
  const monthEnd = endOfMonth(viewMonth)
  const startDow = monthStart.getDay()
  const gridStart = addDays(monthStart, -startDow)

  const weeks: Date[][] = []
  let cursor = new Date(gridStart)
  while (cursor <= monthEnd || weeks.length < 4) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) { week.push(new Date(cursor)); cursor = addDays(cursor, 1) }
    weeks.push(week)
    if (cursor > monthEnd && weeks.length >= 4) break
  }

  const selectedStr = ymd(selected)
  const selectedDayTotals = activeSiteIds.map((sid) => ({
    site: sites.find((s) => s.id === sid)!,
    total: dayTotal(records, sid, selectedStr),
    color: SITE_COLORS[sites.findIndex((s) => s.id === sid) % SITE_COLORS.length],
  })).filter((x) => x.site)

  return (
    <div className="max-w-[1100px] mx-auto px-4 pb-8">
      <TopBar title="통합 달력" />

      {/* Site chips */}
      <div className="flex flex-wrap gap-2 py-4">
        {sites.map((site, i) => (
          <Chip
            key={site.id}
            active={activeSiteIds.includes(site.id)}
            dot={SITE_COLORS[i % SITE_COLORS.length]}
            onClick={() => toggleSite(site.id)}
          >
            {site.name}
          </Chip>
        ))}
      </div>

      <div className="wide:flex wide:gap-6">
        {/* Calendar */}
        <div className="wide:flex-1">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="w-9 h-9 flex items-center justify-center rounded-sm hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-base font-bold text-ink">
              {viewMonth.getFullYear()}년 {viewMonth.getMonth() + 1}월
            </h2>
            <button
              onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="w-9 h-9 flex items-center justify-center rounded-sm hover:bg-slate-100 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <div key={d} className={cn('text-center text-[0.6875rem] font-semibold py-1', i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400')}>
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {weeks.flat().map((d) => {
              const str = ymd(d)
              const isCurrentMonth = d.getMonth() === viewMonth.getMonth()
              const isSelected = isSameDay(d, selected)
              const isToday = isSameDay(d, TODAY)
              const total = allSitesDayTotal(records, activeSiteIds, str)
              const activeSiteDots = activeSiteIds
                .filter((sid) => dayTotal(records, sid, str) > 0)
                .slice(0, 6)

              return (
                <button
                  key={str}
                  onClick={() => setSelected(d)}
                  className={cn(
                    'flex flex-col items-center p-1.5 rounded-sm transition-all min-h-[52px]',
                    !isCurrentMonth && 'opacity-30',
                    isSelected ? 'bg-blue-600 text-white' : 'hover:bg-slate-100',
                  )}
                >
                  <span className={cn(
                    'text-[0.8125rem] font-bold',
                    isSelected ? 'text-white' : isToday ? 'text-blue-600' : 'text-ink',
                  )}>
                    {d.getDate()}
                  </span>
                  {total > 0 && (
                    <span className={cn('text-[0.625rem] tabular-nums', isSelected ? 'text-blue-100' : 'text-slate-500')}>
                      {total}명
                    </span>
                  )}
                  {activeSiteDots.length > 0 && (
                    <div className="flex gap-0.5 flex-wrap justify-center mt-0.5">
                      {activeSiteDots.map((sid) => (
                        <span
                          key={sid}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: isSelected ? 'white' : SITE_COLORS[sites.findIndex((s) => s.id === sid) % SITE_COLORS.length] }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Detail */}
        <div className="wide:w-64 mt-6 wide:mt-0 bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-[0.8125rem] font-semibold text-slate-500 mb-3">{fmtKDate(selected)}</p>
          {selectedDayTotals.filter((x) => x.total > 0).length === 0 ? (
            <p className="text-[0.8125rem] text-slate-400">출근 기록이 없어요</p>
          ) : (
            <div className="flex flex-col gap-3">
              {selectedDayTotals.filter((x) => x.total > 0).map(({ site, total, color }) => (
                <div key={site.id} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-[0.8125rem] text-slate-700 flex-1 truncate">{site.name}</span>
                  <span className="text-[0.8125rem] font-bold tabular-nums">{total}명</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

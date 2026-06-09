'use client'

import { useRef, useEffect } from 'react'
import { cn, addDays, ymd, WEEKDAYS } from '@/lib/utils'

interface DateStripProps {
  selected: string
  onChange: (dateStr: string) => void
  /** days before today to show */
  past?: number
  /** days after today to show */
  future?: number
}

export function DateStrip({ selected, onChange, past = 30, future = 7 }: DateStripProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = addDays(today, -past)

  const days: Date[] = []
  for (let i = 0; i <= past + future; i++) {
    days.push(addDays(start, i))
  }

  const containerRef = useRef<HTMLDivElement>(null)

  // Scroll selected date into view
  useEffect(() => {
    const el = containerRef.current?.querySelector('[data-selected="true"]')
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [selected])

  return (
    <div
      ref={containerRef}
      className="flex gap-1 overflow-x-auto px-4 py-2 scrollbar-none"
      style={{ scrollbarWidth: 'none' }}
    >
      {days.map((d) => {
        const str = ymd(d)
        const isSelected = str === selected
        const isToday = str === ymd(today)
        const dow = d.getDay()
        const isSun = dow === 0
        const isSat = dow === 6

        return (
          <button
            key={str}
            data-selected={isSelected}
            onClick={() => onChange(str)}
            className={cn(
              'flex flex-col items-center gap-0.5 w-11 shrink-0 py-1.5 rounded-sm transition-all',
              isSelected
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-100',
            )}
          >
            <span className={cn(
              'text-[0.6875rem] font-medium',
              isSelected ? 'text-blue-100' : isSun ? 'text-red-500' : isSat ? 'text-blue-400' : 'text-slate-400',
            )}>
              {WEEKDAYS[dow]}
            </span>
            <span className={cn(
              'text-[0.9375rem] font-bold tabular-nums',
              isSelected ? 'text-white' : 'text-ink',
            )}>
              {d.getDate()}
            </span>
            {isToday && !isSelected && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            )}
          </button>
        )
      })}
    </div>
  )
}

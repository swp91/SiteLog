'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Card, Stepper, TradeDot } from '@/components/ui'
import { dayEntries, fmtKDate, parseYmd } from '@/lib/utils'
import type { Site, Trade, Records } from '@/lib/types'

interface Props {
  site: Site
  trades: Trade[]
  records: Records
  date: string
  onSet: (tradeId: string, patch: Partial<{ count: number; memo: string }>) => void
}

export function InputStepperTab({ site, trades, records, date, onSet }: Props) {
  const entries = dayEntries(records, site.id, date)
  const total = Object.values(entries).reduce((s, e) => s + e.count, 0)
  const activeCount = Object.values(entries).filter((e) => e.count > 0).length

  return (
    <div className="max-w-[700px] mx-auto px-4 pb-8">
      {/* Summary bar */}
      <div className="sticky top-[calc(7.5rem)] z-10 -mx-4 px-4 py-2 bg-slate-50/90 backdrop-blur-sm border-b border-slate-100 mb-4 flex items-center gap-4">
        <span className="text-[0.8125rem] text-slate-500">{fmtKDate(parseYmd(date))}</span>
        <span className="text-[0.8125rem] text-slate-400">·</span>
        <span className="text-[0.8125rem] font-semibold text-ink">{activeCount}개 공종</span>
        <span className="text-[0.8125rem] text-slate-400">·</span>
        <span className="text-base font-extrabold text-blue-600 tabular-nums">{total}명</span>
        <span className="ml-auto text-[0.6875rem] text-slate-400">자동 저장됩니다</span>
      </div>

      <div className="flex flex-col gap-3">
        {trades.map((trade) => (
          <TradeCard
            key={trade.id}
            trade={trade}
            count={entries[trade.id]?.count ?? 0}
            memo={entries[trade.id]?.memo ?? ''}
            onCountChange={(count) => onSet(trade.id, { count })}
            onMemoChange={(memo) => onSet(trade.id, { memo })}
          />
        ))}
      </div>
    </div>
  )
}

function TradeCard({
  trade, count, memo, onCountChange, onMemoChange,
}: {
  trade: Trade
  count: number
  memo: string
  onCountChange: (v: number) => void
  onMemoChange: (v: string) => void
}) {
  const [memoOpen, setMemoOpen] = useState(false)

  return (
    <Card className={count > 0 ? 'border-blue-200' : ''}>
      <div className="flex items-center gap-3">
        <TradeDot color={trade.color} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink">{trade.name}</p>
          {trade.company && (
            <p className="text-xs text-slate-400 truncate">{trade.company}</p>
          )}
        </div>
        <Stepper value={count} onChange={onCountChange} size="lg" />
      </div>

      {count > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setMemoOpen((v) => !v)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            {memoOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            메모
            {memo && !memoOpen && <span className="text-slate-500 ml-1 truncate max-w-[200px]">{memo}</span>}
          </button>
          {memoOpen && (
            <textarea
              className="mt-2 w-full h-16 px-3 py-2 text-[0.8125rem] rounded-sm border border-slate-200 bg-slate-50 resize-none outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors"
              placeholder="작업 내용 메모"
              value={memo}
              onChange={(e) => onMemoChange(e.target.value)}
            />
          )}
        </div>
      )}
    </Card>
  )
}

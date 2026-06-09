'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button, Segmented, TradeDot } from '@/components/ui'
import { ymd, addDays, fmtKShort, parseYmd, dayEntries } from '@/lib/utils'
import type { Site, Trade, Records } from '@/lib/types'

interface Props {
  site: Site
  trades: Trade[]
  records: Records
}

const PERIOD_OPTIONS = [
  { value: '7',  label: '7일' },
  { value: '14', label: '2주' },
  { value: '30', label: '1개월' },
]

export function TableTab({ site, trades, records }: Props) {
  const [period, setPeriod] = useState('7')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Array.from({ length: Number(period) }, (_, i) =>
    addDays(today, i - Number(period) + 1)
  )

  // Build matrix: trades × days
  function getCount(tradeId: string, d: Date): number {
    return dayEntries(records, site.id, ymd(d))[tradeId]?.count ?? 0
  }

  function tradeTotal(tradeId: string): number {
    return days.reduce((s, d) => s + getCount(tradeId, d), 0)
  }

  function dayColTotal(d: Date): number {
    return trades.reduce((s, t) => s + getCount(t.id, d), 0)
  }

  const grandTotal = trades.reduce((s, t) => s + tradeTotal(t.id), 0)

  function downloadCsv() {
    const header = ['공종', ...days.map((d) => fmtKShort(d)), '합계'].join(',')
    const rows = trades.map((t) =>
      [t.name, ...days.map((d) => getCount(t.id, d)), tradeTotal(t.id)].join(',')
    )
    const footer = ['합계', ...days.map((d) => dayColTotal(d)), grandTotal].join(',')
    const csv = [header, ...rows, footer].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${site.name}_출근표.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 pb-8 pt-4">
      <div className="flex items-center justify-between mb-4">
        <Segmented
          value={period}
          onChange={setPeriod}
          options={PERIOD_OPTIONS}
        />
        <Button
          size="sm"
          variant="outline"
          icon={<Download size={14} />}
          onClick={downloadCsv}
        >
          CSV
        </Button>
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
            {trades.map((trade) => {
              const total = tradeTotal(trade.id)
              if (total === 0) return null
              return (
                <tr key={trade.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="sticky left-0 bg-white px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <TradeDot color={trade.color} size="sm" />
                      <span className="font-medium text-ink">{trade.name}</span>
                    </div>
                  </td>
                  {days.map((d) => {
                    const c = getCount(trade.id, d)
                    return (
                      <td key={ymd(d)} className={`px-2 py-2 text-center ${c > 0 ? 'text-ink font-semibold' : 'text-slate-200'}`}>
                        {c > 0 ? c : '·'}
                      </td>
                    )
                  })}
                  <td className="px-3 py-2 text-right font-bold text-blue-600">{total}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t border-slate-200">
              <td className="sticky left-0 bg-slate-50 px-3 py-2 font-bold text-ink">합계</td>
              {days.map((d) => {
                const c = dayColTotal(d)
                return (
                  <td key={ymd(d)} className={`px-2 py-2 text-center font-bold ${c > 0 ? 'text-ink' : 'text-slate-200'}`}>
                    {c > 0 ? c : '·'}
                  </td>
                )
              })}
              <td className="px-3 py-2 text-right font-extrabold text-blue-600">{grandTotal}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

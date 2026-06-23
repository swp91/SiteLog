'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, MapPin } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { Badge, Segmented, DateStrip } from '@/components/ui'
import { ymd } from '@/lib/utils'
import { InputStepperTab } from './tabs/input-stepper'
import { CalendarTab } from './tabs/calendar'
import { TableTab } from './tabs/table'
import type { SiteStatus } from '@/lib/types'

const statusTone: Record<SiteStatus, 'blue' | 'amber' | 'slate'> = {
  '진행중': 'blue', '마감임박': 'amber', '완료': 'slate',
}

const TABS = [
  { value: 'input',   label: '입력' },
  { value: 'calendar', label: '달력' },
  { value: 'table',   label: '표' },
]

export default function SiteDetailPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = use(params)
  const router = useRouter()
  const { sites, trades, records, setAttendance } = useAppStore()

  const site = sites.find((s) => s.id === siteId)
  const [tab, setTab] = useState('input')

  const todayStr = ymd(new Date())
  const [date, setDate] = useState(todayStr)

  if (!site) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <p>현장을 찾을 수 없어요</p>
      </div>
    )
  }

  const showDateStrip = tab === 'input'

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="flex items-center gap-2 px-4 h-14">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center -ml-1 rounded-sm text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-ink truncate">{site.name}</p>
            {site.addr && (
              <p className="flex items-center gap-1 text-[0.6875rem] text-slate-400">
                <MapPin size={10} />
                {site.addr}
              </p>
            )}
          </div>
          <Badge tone={statusTone[site.status]}>{site.status}</Badge>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3">
          <Segmented
            full
            value={tab}
            onChange={setTab}
            options={TABS}
          />
        </div>

        {/* Date strip — only for input tab */}
        {showDateStrip && (
          <DateStrip selected={date} onChange={setDate} />
        )}
      </div>

      {/* Tab content */}
      <div className="flex-1">
        {tab === 'input' && (
          <InputStepperTab
            site={site}
            trades={trades}
            records={records}
            date={date}
            onSet={(tradeId, patch) => setAttendance(site.id, date, tradeId, patch)}
          />
        )}
        {tab === 'calendar' && (
          <CalendarTab
            site={site}
            trades={trades}
            records={records}
            date={date}
            onPickDate={setDate}
          />
        )}
        {tab === 'table' && (
          <TableTab site={site} trades={trades} records={records} />
        )}
      </div>
    </div>
  )
}

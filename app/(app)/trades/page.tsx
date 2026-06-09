'use client'

import { useState } from 'react'
import { Plus, Pencil, Phone } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { TopBar } from '@/components/layout/top-bar'
import { Button, Card, Sheet, Field, TextInput, TradeDot } from '@/components/ui'
import { tradeManDays, ymd } from '@/lib/utils'
import type { Trade } from '@/lib/types'

const COLOR_PALETTE = [
  '#2563EB', '#0EA5E9', '#06B6D4', '#14B8A6',
  '#10B981', '#F59E0B', '#EF4444', '#EC4899',
  '#8B5CF6', '#6366F1', '#64748B', '#0F172A',
]

const EMPTY_DRAFT: Omit<Trade, 'id'> = {
  name: '', color: '#2563EB', rate: 0, company: '', contact: '', phone: '', sort_order: 0,
}

export default function TradesPage() {
  const { sites, trades, records, addTrade, updateTrade, deleteTrade, flash } = useAppStore()
  const [sheet, setSheet] = useState<null | 'new' | Trade>(null)
  const [draft, setDraft] = useState<Omit<Trade, 'id'>>(EMPTY_DRAFT)

  const siteIds = sites.map((s) => s.id)
  const end = ymd(new Date())
  const start = (() => { const d = new Date(); d.setDate(d.getDate() - 90); return ymd(d) })()
  const manDays = tradeManDays(records, siteIds, start, end)

  function openNew() {
    setDraft(EMPTY_DRAFT)
    setSheet('new')
  }

  function openEdit(trade: Trade) {
    setDraft({ name: trade.name, color: trade.color, rate: trade.rate, company: trade.company ?? '', contact: trade.contact ?? '', phone: trade.phone ?? '', sort_order: trade.sort_order ?? 0 })
    setSheet(trade)
  }

  function save() {
    if (!draft.name.trim() || sheet === null) return
    if (sheet === 'new') {
      addTrade(draft)
      flash('공종이 추가되었어요')
    } else {
      updateTrade({ ...sheet, ...draft })
      flash('공종이 수정되었어요')
    }
    setSheet(null)
  }

  function remove(trade: Trade) {
    if (!confirm(`"${trade.name}" 공종을 삭제할까요?`)) return
    deleteTrade(trade.id)
    setSheet(null)
    flash('공종이 삭제되었어요')
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 pb-8">
      <TopBar title="공종 · 업체" />

      <div className="flex items-center justify-between pt-6 pb-4">
        <h1 className="text-[1.375rem] font-bold text-ink">공종 · 업체</h1>
        <Button size="sm" icon={<Plus size={15} />} onClick={openNew} className="hidden wide:flex">
          공종 추가
        </Button>
      </div>

      <div className="grid wide:grid-cols-3 gap-3">
        {trades.map((trade) => {
          const md = manDays[trade.id] ?? 0
          return (
            <Card key={trade.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <TradeDot color={trade.color} />
                <span className="text-[0.9375rem] font-bold text-ink flex-1">{trade.name}</span>
                <button
                  onClick={() => openEdit(trade)}
                  className="w-8 h-8 flex items-center justify-center rounded-sm text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <Pencil size={14} />
                </button>
              </div>
              {trade.company && (
                <p className="text-[0.8125rem] font-medium text-slate-700">{trade.company}</p>
              )}
              {trade.contact && (
                <p className="text-xs text-slate-400">{trade.contact}</p>
              )}
              {trade.phone && (
                <a
                  href={`tel:${trade.phone}`}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors"
                >
                  <Phone size={11} />
                  {trade.phone}
                </a>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
                <span>일당 {(trade.rate / 10000).toFixed(0)}만원</span>
                <span>누적 {md}일</span>
              </div>
            </Card>
          )
        })}
      </div>

      {/* FAB */}
      <button
        onClick={openNew}
        className="wide:hidden fixed right-4 bottom-[92px] z-10 w-[58px] h-[58px] rounded-full bg-blue-600 text-white shadow-blue flex items-center justify-center"
      >
        <Plus size={24} />
      </button>

      {/* Sheet */}
      <Sheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        title={sheet === 'new' ? '새 공종 추가' : '공종 수정'}
      >
        <div className="flex flex-col gap-4">
          <Field label="공종 이름 *">
            <TextInput
              placeholder="예: 경량, 설비, 전기"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </Field>
          <Field label="업체명">
            <TextInput
              placeholder="협력사 상호"
              value={draft.company ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, company: e.target.value }))}
            />
          </Field>
          <Field label="담당자">
            <TextInput
              placeholder="담당자 이름"
              value={draft.contact ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, contact: e.target.value }))}
            />
          </Field>
          <Field label="연락처">
            <TextInput
              type="tel"
              placeholder="010-0000-0000"
              value={draft.phone ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
            />
          </Field>
          <Field label="일당 (원)">
            <TextInput
              type="number"
              placeholder="200000"
              value={draft.rate || ''}
              onChange={(e) => setDraft((d) => ({ ...d, rate: Number(e.target.value) }))}
            />
          </Field>
          <Field label="색상">
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setDraft((d) => ({ ...d, color: c }))}
                  className={`w-8 h-8 rounded-full transition-transform ${draft.color === c ? 'ring-2 ring-offset-2 ring-blue-600 scale-110' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </Field>

          <div className="flex flex-col gap-2 pt-2">
            <Button full onClick={save} disabled={!draft.name.trim()}>
              {sheet === 'new' ? '추가' : '저장'}
            </Button>
            {sheet && sheet !== 'new' && (
              <Button full variant="danger" onClick={() => remove(sheet as Trade)}>
                삭제
              </Button>
            )}
          </div>
        </div>
      </Sheet>
    </div>
  )
}

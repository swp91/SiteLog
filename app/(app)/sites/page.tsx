'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, MapPin, User, ClipboardList, Pencil, Trash2 } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { TopBar } from '@/components/layout/top-bar'
import { Button, Card, Badge, TextInput, Field, Sheet, Segmented } from '@/components/ui'
import { dayTotal, ymd } from '@/lib/utils'
import type { Site, SiteStatus } from '@/lib/types'

const TODAY = new Date()
const todayStr = ymd(TODAY)

const statusTone: Record<SiteStatus, 'blue' | 'amber' | 'slate'> = {
  '진행중': 'blue',
  '마감임박': 'amber',
  '완료': 'slate',
}

const STATUS_OPTIONS: SiteStatus[] = ['진행중', '마감임박', '완료']

const EMPTY_DRAFT: Omit<Site, 'id'> = {
  name: '', addr: '', status: '진행중', start: '', manager: '',
}

export default function SitesPage() {
  const { sites, records, addSite, updateSite, deleteSite, flash } = useAppStore()
  const [search, setSearch] = useState('')
  const [sheet, setSheet] = useState<null | 'new' | Site>(null)
  const [draft, setDraft] = useState<Omit<Site, 'id'>>(EMPTY_DRAFT)

  const filtered = sites.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.addr ?? '').includes(search),
  )

  function openNew() {
    setDraft(EMPTY_DRAFT)
    setSheet('new')
  }

  function openEdit(site: Site) {
    setDraft({ name: site.name, addr: site.addr ?? '', status: site.status, start: site.start ?? '', manager: site.manager ?? '' })
    setSheet(site)
  }

  function save() {
    if (!draft.name.trim() || sheet === null) return
    if (sheet === 'new') {
      addSite({ ...draft, id: `s${Date.now()}` })
      flash('현장이 추가되었어요')
    } else {
      updateSite({ ...sheet, ...draft })
      flash('현장이 수정되었어요')
    }
    setSheet(null)
  }

  function remove(site: Site) {
    if (!confirm(`"${site.name}"을(를) 삭제할까요?`)) return
    deleteSite(site.id)
    setSheet(null)
    flash('현장이 삭제되었어요')
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 pb-8">
      <TopBar title="현장 관리" />

      {/* Header */}
      <div className="flex items-center justify-between pt-6 pb-4">
        <h1 className="text-[22px] font-bold text-ink">현장</h1>
        <Button size="sm" icon={<Plus size={15} />} onClick={openNew} className="hidden wide:flex">
          현장 추가
        </Button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <TextInput
          icon={<Search size={16} />}
          placeholder="현장명 또는 주소 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      <div className="grid wide:grid-cols-2 gap-3">
        {filtered.map((site) => {
          const total = dayTotal(records, site.id, todayStr)
          return (
            <Card key={site.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-ink truncate">{site.name}</p>
                  {site.addr && (
                    <p className="flex items-center gap-1 text-[12px] text-slate-400 mt-0.5">
                      <MapPin size={11} />
                      {site.addr}
                    </p>
                  )}
                </div>
                <Badge tone={statusTone[site.status]}>{site.status}</Badge>
              </div>

              {site.manager && (
                <p className="flex items-center gap-1.5 text-[13px] text-slate-500">
                  <User size={13} className="text-slate-400" />
                  {site.manager}
                </p>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-[13px] text-slate-400">오늘 {total}명</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<ClipboardList size={13} />}
                    onClick={() => { window.location.href = `/sites/${site.id}` }}
                  >
                    출근 기록
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Pencil size={13} />}
                    onClick={() => openEdit(site)}
                  >
                    수정
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-[15px]">검색 결과가 없어요</p>
        </div>
      )}

      {/* FAB (mobile) */}
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
        title={sheet === 'new' ? '새 현장 추가' : '현장 수정'}
      >
        <div className="flex flex-col gap-4">
          <Field label="현장 이름 *">
            <TextInput
              placeholder="현장명을 입력하세요"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </Field>
          <Field label="주소">
            <TextInput
              placeholder="현장 주소"
              value={draft.addr ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, addr: e.target.value }))}
            />
          </Field>
          <Field label="담당 관리기사">
            <TextInput
              placeholder="담당자 이름"
              value={draft.manager ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, manager: e.target.value }))}
            />
          </Field>
          <Field label="상태">
            <Segmented
              full
              value={draft.status}
              onChange={(v) => setDraft((d) => ({ ...d, status: v as SiteStatus }))}
              options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
            />
          </Field>

          <div className="flex flex-col gap-2 pt-2">
            <Button full onClick={save} disabled={!draft.name.trim()}>
              {sheet === 'new' ? '추가' : '저장'}
            </Button>
            {sheet && sheet !== 'new' && (
              <Button
                full
                variant="danger"
                icon={<Trash2 size={15} />}
                onClick={() => remove(sheet as Site)}
              >
                삭제
              </Button>
            )}
          </div>
        </div>
      </Sheet>
    </div>
  )
}
